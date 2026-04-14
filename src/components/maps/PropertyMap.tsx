'use client'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Development } from '@/app/[lang]/(website)/imoveis/types/development'

// Lazy-loaded map library singleton (maplibre-gl) — cached across renders
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mapLib: any = null

const CARTO_DARK  = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const CARTO_LIGHT = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

interface PropertyMapProps {
    developments: Development[]
    height?: string
    className?: string
    lang?: string
    darkMode?: boolean
    selectedId?: string
    onMarkerClick?: (id: string) => void
}

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
    }).format(v)

// Escape HTML to prevent XSS in popup template literals
function esc(str: string | null | undefined): string {
    if (!str) return ''
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

const STATUS_LABELS: Record<string, string> = {
    launch: 'Lançamento',
    ready: 'Pronto',
    under_construction: 'Em Obra',
}

const STATUS_COLORS: Record<string, string> = {
    launch: '#60A5FA',
    ready: '#10B981',
    under_construction: '#F59E0B',
}

// ─── Cluster constants & helpers ─────────────────────────────────────────────

/** Below this zoom level clusters are shown; at or above, individual price pills appear */
const CLUSTER_ZOOM_THRESHOLD = 10

function buildGeoJSON(devs: Development[]) {
    return {
        type: 'FeatureCollection' as const,
        features: devs.map(dev => ({
            type: 'Feature' as const,
            geometry: {
                type: 'Point' as const,
                coordinates: [dev.location.coordinates.lng!, dev.location.coordinates.lat!],
            },
            properties: { id: dev.id },
        })),
    }
}

// Supports both MapLibre 5+ (Promise) and Mapbox GL (callback) APIs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getClusterExpansionZoom(source: any, clusterId: number): Promise<number> {
    if (typeof source.getClusterExpansionZoom === 'function') {
        const result = source.getClusterExpansionZoom(clusterId)
        if (result && typeof result.then === 'function') return result
    }
    return new Promise((resolve, reject) => {
        source.getClusterExpansionZoom(clusterId, (err: Error | null, zoom: number) => {
            if (err) reject(err); else resolve(zoom)
        })
    })
}

// ─── Region detection & grouping ─────────────────────────────────────────────

interface Region {
    id: string
    label: string
    flag: string
    center: [number, number] // [lng, lat]
    zoom: number
}

const REGIONS: Region[] = [
    { id: 'todos', label: 'Todos', flag: '🌎', center: [-46.0, -14.0], zoom: 4 },
    { id: 'nordeste', label: 'Nordeste', flag: '🇧🇷', center: [-34.9, -7.8], zoom: 7 },
    { id: 'sao-paulo', label: 'São Paulo', flag: '🇧🇷', center: [-46.67, -23.58], zoom: 12 },
    { id: 'dubai', label: 'Dubai', flag: '🇦🇪', center: [55.18, 25.08], zoom: 11 },
    { id: 'eua', label: 'EUA', flag: '🇺🇸', center: [-80.5, 27.0], zoom: 6 },
]

function getRegionId(dev: Development): string {
    const country = (dev.location.country ?? '').toLowerCase().trim()
    const state = (dev.location.state ?? '').toUpperCase().trim()
    const city = (dev.location.city ?? '').toLowerCase().trim()
    if (country.includes('emirados') || country.includes('uae') || country.includes('united arab') || city.includes('dubai'))
        return 'dubai'
    if (country.includes('estados unidos') || country.includes('usa') || country.includes('united states') || country.includes('eua'))
        return 'eua'
    if (state === 'SP' || city.includes('são paulo') || city.includes('sao paulo'))
        return 'sao-paulo'
    return 'nordeste' // Default for Brazilian NE properties
}

// ─── Map provider detection ──────────────────────────────────────────────────

function getMapProvider() {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (mapboxToken && mapboxToken.startsWith('pk.'))
        return { engine: 'mapbox' as const, token: mapboxToken }
    return { engine: 'maplibre' as const, token: null }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PropertyMap({
    developments,
    height,
    className = '',
    lang = 'pt',
    darkMode = true,
    selectedId,
    onMarkerClick,
}: PropertyMapProps) {
    const resolvedHeight = height || 'clamp(400px, calc(100vh - 280px), 700px)'
    const mapContainer = useRef<HTMLDivElement>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = useRef<any>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const markersOnMap = useRef<Map<string, any>>(new Map())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const popupsOnMap = useRef<Map<string, any>>(new Map())
    const onMarkerClickRef = useRef(onMarkerClick)
    const [mapLoaded, setMapLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedProperty, setSelectedProperty] = useState<Development | null>(null)
    const [activeRegion, setActiveRegion] = useState('todos')
    const clusterReady = useRef(false)

    useEffect(() => { onMarkerClickRef.current = onMarkerClick }, [onMarkerClick])

    const validDevelopments = useMemo(() =>
        developments.filter(
            (d) =>
                d.location.coordinates?.lat != null &&
                d.location.coordinates?.lng != null &&
                d.location.coordinates.lat !== 0 &&
                d.location.coordinates.lng !== 0
        ),
        [developments]
    )

    const excludedCount = developments.length - validDevelopments.length

    // Group by region
    const regionMap = useMemo(() => {
        const groups: Record<string, Development[]> = {}
        for (const dev of validDevelopments) {
            const rid = getRegionId(dev)
            if (!groups[rid]) groups[rid] = []
            groups[rid].push(dev)
        }
        return groups
    }, [validDevelopments])

    // Available regions (only show tabs for regions that have properties)
    const availableRegions = useMemo(() => {
        const ids = new Set(Object.keys(regionMap))
        // Always show 'todos' first, then only regions with properties
        return REGIONS.filter(r => r.id === 'todos' || ids.has(r.id))
    }, [regionMap])

    // Filtered developments for current region
    const filteredDevelopments = useMemo(() => {
        if (activeRegion === 'todos') return validDevelopments
        return regionMap[activeRegion] || []
    }, [activeRegion, validDevelopments, regionMap])

    // ─── Clear and add markers ───────────────────────────────────────────────

    const clearMarkers = useCallback(() => {
        markersOnMap.current.forEach((m) => m.remove())
        markersOnMap.current.clear()
        popupsOnMap.current.forEach((p) => p.remove())
        popupsOnMap.current.clear()
    }, [])

    const addMarkers = useCallback((devs: Development[]) => {
        if (!map.current || !mapLib) return
        clearMarkers()

        // Sync cluster GeoJSON source with current data
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const src = map.current.getSource('imi-properties') as any
            if (src?.setData) src.setData(buildGeoJSON(devs))
        } catch { /* source not ready yet */ }

        devs.forEach((dev) => {
            const { lat, lng } = dev.location.coordinates
            if (lat == null || lng == null) return
            const statusColor = STATUS_COLORS[dev.status] || '#60A5FA'

            const el = document.createElement('div')
            el.className = 'imi-property-marker'
            el.style.cssText = 'position:relative;cursor:pointer;transition:all 0.2s cubic-bezier(0.16,1,0.3,1);width:fit-content;max-width:120px;'

            // Modern pill-style price marker
            const pin = document.createElement('div')
            const price = dev.priceRange.min
            const priceText =
                price > 1_000_000
                    ? `R$${(price / 1_000_000).toFixed(1)}M`
                    : price > 0
                      ? `R$${Math.round(price / 1000)}K`
                      : '★'

            const isDark = darkMode
            pin.style.cssText = `
                padding:4px 10px;
                border-radius:999px;
                background:${isDark ? '#0B1928' : 'rgba(16,20,35,0.94)'};
                color:white;
                font-size:11px;font-weight:700;letter-spacing:-0.01em;
                white-space:nowrap;
                width:fit-content;
                min-width:unset;
                max-width:120px;
                box-shadow:0 2px 8px rgba(0,0,0,0.28),0 1px 3px rgba(0,0,0,0.12);
                border:1.5px solid rgba(255,255,255,0.9);
                display:inline-flex;align-items:center;gap:4px;
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                overflow:hidden;
                text-overflow:ellipsis;
            `
            // Status dot
            const dot = document.createElement('span')
            dot.style.cssText = `width:5px;height:5px;border-radius:50%;background:${statusColor};flex-shrink:0;`
            pin.appendChild(dot)

            const labelEl = document.createElement('span')
            labelEl.textContent = priceText
            pin.appendChild(labelEl)
            el.appendChild(pin)

            // Pointer triangle below pill
            const pointer = document.createElement('div')
            pointer.style.cssText = `
                width:0;height:0;
                border-left:5px solid transparent;border-right:5px solid transparent;
                border-top:5px solid ${isDark ? '#0B1928' : 'rgba(16,20,35,0.94)'};
                margin:0 auto;filter:drop-shadow(0 1px 1px rgba(0,0,0,0.1));
            `
            el.appendChild(pointer)

            // Country flag badge for international properties
            const country = dev.location.country?.toLowerCase() || ''
            if (country.includes('emirados') || country.includes('estados unidos') || country.includes('usa')) {
                const badge = document.createElement('div')
                badge.style.cssText = `
                    position:absolute;top:-6px;right:-6px;
                    width:20px;height:20px;border-radius:50%;
                    background:white;border:1.5px solid #E2E0DB;
                    display:flex;align-items:center;justify-content:center;
                    font-size:11px;line-height:1;z-index:2;
                    box-shadow:0 2px 6px rgba(0,0,0,0.12);
                `
                badge.textContent = country.includes('emirados') ? '🇦🇪' : '🇺🇸'
                el.appendChild(badge)
            }

            el.addEventListener('mouseenter', () => {
                el.style.transform = 'scale(1.1) translateY(-3px)'
                el.style.zIndex = '10'
                pin.style.boxShadow = '0 8px 28px rgba(0,0,0,0.35),0 2px 6px rgba(0,0,0,0.15)'
            })
            el.addEventListener('mouseleave', () => {
                el.style.transform = 'scale(1) translateY(0)'
                el.style.zIndex = '1'
                pin.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25),0 1px 3px rgba(0,0,0,0.12)'
            })
            el.addEventListener('click', () => {
                onMarkerClickRef.current?.(dev.id)
                setSelectedProperty(dev)
            })

            const popupHTML = `
                <div style="
                    background:white;border-radius:16px;overflow:hidden;
                    color:#0B1928;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                    min-width:240px;max-width:280px;
                    box-shadow:0 20px 60px rgba(0,0,0,0.18),0 4px 16px rgba(0,0,0,0.08);
                    border:1px solid rgba(0,0,0,0.06);
                ">
                    ${dev.images.main
                        ? `<div style="position:relative;">
                            <img src="${esc(dev.images.main)}" alt="${esc(dev.name)}" style="width:100%;height:140px;object-fit:cover;display:block;"/>
                            <div style="position:absolute;top:10px;left:10px;background:white;color:#0B1928;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;padding:4px 10px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.12);">
                                <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${statusColor};margin-right:5px;vertical-align:middle;"></span>
                                ${esc(STATUS_LABELS[dev.status] || dev.status)}
                            </div>
                        </div>`
                        : `<div style="height:60px;background:linear-gradient(135deg,#F8F6F2,#E2E0DB);display:flex;align-items:center;justify-content:center;font-size:28px;">🏢</div>`
                    }
                    <div style="padding:14px 16px 16px;">
                        <div style="font-weight:800;font-size:14px;margin-bottom:4px;line-height:1.3;color:#0B1928;">${esc(dev.name)}</div>
                        <div style="font-size:11px;color:#948F84;margin-bottom:10px;display:flex;align-items:center;gap:3px;">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#948F84" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            ${dev.location.neighborhood ? esc(dev.location.neighborhood) + ', ' : ''}${esc(dev.location.city)}${dev.location.country && dev.location.country !== 'Brasil' ? ' — ' + esc(dev.location.country) : ''}
                        </div>
                        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
                            ${dev.specs.areaRange && dev.specs.areaRange !== '—'
                                ? `<span style="background:#F8F6F2;color:#5A6577;font-size:10px;padding:4px 10px;border-radius:8px;font-weight:600;">${esc(dev.specs.areaRange)}</span>`
                                : ''}
                            ${dev.specs.bedroomsRange && dev.specs.bedroomsRange !== '—'
                                ? `<span style="background:#F8F6F2;color:#5A6577;font-size:10px;padding:4px 10px;border-radius:8px;font-weight:600;">${esc(dev.specs.bedroomsRange)} qts</span>`
                                : ''}
                        </div>
                        <div style="display:flex;align-items:center;justify-content:space-between;">
                            <div>
                                ${dev.priceRange.min > 0
                                    ? `<div style="font-size:10px;font-weight:600;color:#948F84;margin-bottom:1px;">A partir de</div>
                                       <div style="font-size:18px;font-weight:900;color:#0B1928;letter-spacing:-0.02em;">${formatCurrency(dev.priceRange.min)}</div>`
                                    : '<div style="font-size:14px;font-weight:700;color:#F59E0B;">Sob Consulta</div>'
                                }
                            </div>
                            <a href="/${lang}/imoveis/${esc(dev.slug)}" style="
                                display:flex;align-items:center;justify-content:center;
                                background:#0B1928;width:40px;height:40px;border-radius:12px;
                                text-decoration:none;flex-shrink:0;
                            ">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </a>
                        </div>
                    </div>
                </div>
            `

            const popup = new mapLib.Popup({
                offset: [0, -48],
                className: 'imi-popup',
                maxWidth: '300px',
                closeButton: true,
                closeOnMove: false,
            }).setHTML(popupHTML)

            const marker = new mapLib.Marker({ element: el, anchor: 'bottom' })
                .setLngLat([lng, lat])
                .setPopup(popup)
                .addTo(map.current)

            markersOnMap.current.set(dev.id, marker)
            popupsOnMap.current.set(dev.id, popup)
        })

        // Apply zoom-based visibility immediately after markers are placed
        if (map.current) {
            const zoom = map.current.getZoom()
            const showClusters = zoom < CLUSTER_ZOOM_THRESHOLD
            markersOnMap.current.forEach(m => {
                m.getElement().style.display = showClusters ? 'none' : ''
            })
        }
    }, [clearMarkers, lang])

    const fitToDevs = useCallback((devs: Development[], animate = true) => {
        if (!map.current || !mapLib || devs.length === 0) return

        if (devs.length === 1) {
            map.current.flyTo({
                center: [devs[0].location.coordinates.lng, devs[0].location.coordinates.lat],
                zoom: 14,
                duration: animate ? 700 : 0,
            })
            return
        }

        const bounds = new mapLib.LngLatBounds()
        devs.forEach((d) => bounds.extend([d.location.coordinates.lng, d.location.coordinates.lat]))

        map.current.fitBounds(bounds, {
            padding: { top: 80, bottom: 80, left: 60, right: 60 },
            maxZoom: 14,
            minZoom: 3,
            duration: animate ? 800 : 0,
        })
    }, [])

    // ─── Zoom-level cluster/marker toggle ─────────────────────────────────────

    const updateZoomMode = useCallback(() => {
        if (!map.current) return
        const zoom = map.current.getZoom()
        const showClusters = zoom < CLUSTER_ZOOM_THRESHOLD

        // Toggle individual DOM price-pill markers
        markersOnMap.current.forEach(m => {
            m.getElement().style.display = showClusters ? 'none' : ''
        })

        // Toggle cluster GL layers
        if (map.current.getLayer('imi-clusters')) {
            map.current.setLayoutProperty('imi-clusters', 'visibility', showClusters ? 'visible' : 'none')
            map.current.setLayoutProperty('imi-cluster-halo', 'visibility', showClusters ? 'visible' : 'none')
            map.current.setLayoutProperty('imi-cluster-count', 'visibility', showClusters ? 'visible' : 'none')
        }
    }, [])

    // ─── One-time cluster layer setup (called inside 'load' event) ────────────

    const setupClusterLayers = useCallback(() => {
        if (!map.current || !mapLib || clusterReady.current) return

        map.current.addSource('imi-properties', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
            cluster: true,
            // Stop clustering once zoom >= CLUSTER_ZOOM_THRESHOLD (individual pins take over)
            clusterMaxZoom: CLUSTER_ZOOM_THRESHOLD - 1,
            // Pixel radius to consider two points part of the same cluster
            clusterRadius: 55,
        })

        // Soft glow halo behind cluster circles
        map.current.addLayer({
            id: 'imi-cluster-halo',
            type: 'circle',
            source: 'imi-properties',
            filter: ['has', 'point_count'],
            paint: {
                'circle-color': '#0B1928',
                'circle-radius': ['step', ['get', 'point_count'], 26, 5, 33, 15, 41],
                'circle-opacity': 0.18,
                'circle-stroke-width': 0,
            },
        })

        // Main cluster circles — size & shade scale with count
        map.current.addLayer({
            id: 'imi-clusters',
            type: 'circle',
            source: 'imi-properties',
            filter: ['has', 'point_count'],
            paint: {
                'circle-color': [
                    'step', ['get', 'point_count'],
                    '#0B1928',   //  1–9
                    10, '#1a3a5c', // 10–29
                    30, '#2563EB', // 30+
                ],
                'circle-radius': ['step', ['get', 'point_count'], 18, 5, 24, 15, 32],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#FFFFFF',
                'circle-opacity': 0.95,
            },
        })

        // Count label inside each cluster
        map.current.addLayer({
            id: 'imi-cluster-count',
            type: 'symbol',
            source: 'imi-properties',
            filter: ['has', 'point_count'],
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-size': 11,
                'text-anchor': 'center',
            },
            paint: { 'text-color': '#FFFFFF' },
        })

        // Click cluster → zoom in to expand
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.current.on('click', 'imi-clusters', async (e: any) => {
            const features = map.current.queryRenderedFeatures(e.point, { layers: ['imi-clusters'] })
            if (!features.length) return
            const clusterId = features[0].properties.cluster_id
            const coords = (features[0].geometry as { coordinates: [number, number] }).coordinates
            try {
                const src = map.current.getSource('imi-properties')
                const zoom = await getClusterExpansionZoom(src, clusterId)
                map.current.flyTo({ center: coords, zoom: zoom + 0.5, duration: 500 })
            } catch { /* ignore */ }
        })

        map.current.on('mouseenter', 'imi-clusters', () => {
            map.current.getCanvas().style.cursor = 'pointer'
        })
        map.current.on('mouseleave', 'imi-clusters', () => {
            map.current.getCanvas().style.cursor = ''
        })

        clusterReady.current = true
    }, [])

    // ─── Initialize map ──────────────────────────────────────────────────────

    useEffect(() => {
        if (!mapContainer.current || map.current) return

        const initMap = async () => {
            try {
                const provider = getMapProvider()
                if (provider.engine === 'mapbox') {
                    const mod = await import('mapbox-gl')
                    mapLib = mod.default
                    mapLib.accessToken = provider.token
                    map.current = new mapLib.Map({
                        container: mapContainer.current!,
                        style: darkMode
                            ? 'mapbox://styles/mapbox/dark-v11'
                            : 'mapbox://styles/mapbox/light-v11',
                        center: REGIONS[0].center,
                        zoom: REGIONS[0].zoom,
                        attributionControl: false,
                    })
                } else {
                    const mod = await import('maplibre-gl')
                    mapLib = mod.default
                    map.current = new mapLib.Map({
                        container: mapContainer.current!,
                        style: darkMode ? CARTO_DARK : CARTO_LIGHT,
                        center: REGIONS[0].center,
                        zoom: REGIONS[0].zoom,
                        attributionControl: false,
                    })
                }

                map.current.addControl(
                    new mapLib.NavigationControl({ showCompass: false }),
                    'bottom-right'
                )

                map.current.on('load', () => {
                    setupClusterLayers()
                    // Re-evaluate cluster vs pin view on every zoom change
                    map.current.on('zoom', updateZoomMode)
                    setMapLoaded(true)
                })
            } catch {
                setError('Erro ao carregar o mapa')
            }
        }

        initMap()

        return () => {
            clearMarkers()
            if (map.current) {
                map.current.remove()
                map.current = null
                mapLib = null
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ─── Update markers when region or data changes ──────────────────────────

    useEffect(() => {
        if (!mapLoaded) return
        addMarkers(filteredDevelopments)
        fitToDevs(filteredDevelopments)
    }, [mapLoaded, filteredDevelopments, addMarkers, fitToDevs])

    // ─── Handle region change ────────────────────────────────────────────────

    const handleRegionChange = useCallback((regionId: string) => {
        setActiveRegion(regionId)
        setSelectedProperty(null)

        // For specific regions, fly to their center immediately for a snappier UX
        // For "todos", fitToDevs will be called by the useEffect when filteredDevelopments changes
        if (regionId !== 'todos' && map.current) {
            const region = REGIONS.find(r => r.id === regionId)
            if (region) {
                map.current.flyTo({
                    center: region.center,
                    zoom: region.zoom,
                    duration: 600,
                })
            }
        } else if (regionId === 'todos' && map.current) {
            // For "todos", immediately fit to all valid developments
            fitToDevs(validDevelopments, true)
        }
    }, [fitToDevs, validDevelopments])

    // ─── External selectedId sync ────────────────────────────────────────────

    useEffect(() => {
        if (!selectedId || !mapLoaded) return
        const marker = markersOnMap.current.get(selectedId)
        const popup = popupsOnMap.current.get(selectedId)

        // If the selected property is in a different region, switch to it
        const dev = validDevelopments.find(d => d.id === selectedId)
        if (dev) {
            const devRegion = getRegionId(dev)
            if (activeRegion !== 'todos' && activeRegion !== devRegion) {
                setActiveRegion(devRegion)
                return // The region change effect will handle marker creation
            }
        }

        if (!marker || !popup) return
        popupsOnMap.current.forEach((p, id) => { if (id !== selectedId) p.remove() })
        if (!popup.isOpen()) marker.togglePopup()

        if (dev && map.current) {
            map.current.flyTo({
                center: [dev.location.coordinates.lng, dev.location.coordinates.lat],
                zoom: Math.max(map.current.getZoom(), 13),
                duration: 700,
                essential: true,
            })
        }
        if (dev) setSelectedProperty(dev)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId, mapLoaded, activeRegion])

    // ─── Error / empty states ────────────────────────────────────────────────

    if (error) {
        return (
            <div className={className} style={{
                height: resolvedHeight, background: '#1A1E2A', borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <p style={{ color: '#EF4444', fontSize: 13 }}>{error}</p>
            </div>
        )
    }

    if (validDevelopments.length === 0) {
        return (
            <div className={className} style={{
                height: resolvedHeight, background: '#1A1E2A', borderRadius: 16,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 8,
            }}>
                <span style={{ fontSize: 40, opacity: 0.3 }}>🗺️</span>
                <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0, fontWeight: 500 }}>
                    Nenhum empreendimento com coordenadas disponíveis
                </p>
            </div>
        )
    }

    return (
        <div className={className} style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', height: resolvedHeight }}>
            {/* Loading overlay */}
            {!mapLoaded && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: darkMode ? '#1A1E2A' : '#F8F6F2',
                    zIndex: 10,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 12,
                }}>
                    <div style={{
                        width: 36, height: 36,
                        border: `3px solid ${darkMode ? 'rgba(59,130,246,0.2)' : 'rgba(11,25,40,0.1)'}`,
                        borderTopColor: darkMode ? '#60A5FA' : '#0B1928',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <p style={{ color: darkMode ? '#9CA3AF' : '#948F84', fontSize: 13, margin: 0 }}>Carregando mapa...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {/* Region filter tabs */}
            {mapLoaded && availableRegions.length > 2 && (
                <div style={{
                    position: 'absolute', top: 14, left: 14, zIndex: 5,
                    display: 'flex', gap: 4, flexWrap: 'wrap',
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 14, padding: 4,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.06)',
                }}>
                    {availableRegions.map((region) => {
                        const isActive = activeRegion === region.id
                        const count = region.id === 'todos'
                            ? validDevelopments.length
                            : (regionMap[region.id]?.length || 0)
                        return (
                            <button
                                key={region.id}
                                onClick={() => handleRegionChange(region.id)}
                                style={{
                                    background: isActive ? '#0B1928' : 'transparent',
                                    color: isActive ? 'white' : '#5A6577',
                                    fontSize: 12,
                                    fontWeight: isActive ? 700 : 500,
                                    padding: '6px 12px',
                                    borderRadius: 10,
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    letterSpacing: '0.01em',
                                    whiteSpace: 'nowrap',
                                    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
                                }}
                            >
                                {region.flag} {region.label} <span style={{ opacity: 0.6, fontSize: 11 }}>({count})</span>
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Properties count badge — only when single region */}
            {mapLoaded && availableRegions.length <= 2 && (
                <div style={{
                    position: 'absolute', top: 14, left: 14, zIndex: 5,
                    background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
                    color: '#0B1928', fontSize: 12, fontWeight: 700,
                    padding: '7px 14px', borderRadius: 12,
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    letterSpacing: '0.03em', textTransform: 'uppercase',
                    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
                }}>
                    {filteredDevelopments.length} empreendimento{filteredDevelopments.length !== 1 ? 's' : ''}
                </div>
            )}

            {/* Excluded properties badge */}
            {mapLoaded && excludedCount > 0 && (
                <div style={{
                    position: 'absolute', bottom: 14, left: 14, zIndex: 5,
                    background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)',
                    color: '#948F84', fontSize: 11, fontWeight: 500,
                    padding: '5px 12px', borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
                    display: 'flex', alignItems: 'center', gap: 5,
                }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#948F84" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {excludedCount} {excludedCount === 1 ? 'imovel' : 'imoveis'} sem localizacao
                </div>
            )}

            {/* Map container */}
            <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

            {/* Floating property card */}
            {selectedProperty && (() => {
                const sc = STATUS_COLORS[selectedProperty.status] || '#60A5FA'
                return (
                    <div style={{
                        position: 'absolute', bottom: 20, left: '50%',
                        transform: 'translateX(-50%)', zIndex: 20,
                        width: 'min(360px, calc(100% - 32px))',
                        background: 'white',
                        backdropFilter: 'blur(20px)', borderRadius: 20,
                        overflow: 'hidden',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        animation: 'floatCardIn 0.22s cubic-bezier(0.16,1,0.3,1)',
                    }}>
                        <button
                            onClick={() => setSelectedProperty(null)}
                            style={{
                                position: 'absolute', top: 12, right: 12, zIndex: 2,
                                width: 30, height: 30, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(0,0,0,0.08)',
                                color: '#5A6577', fontSize: 18, lineHeight: '1',
                                cursor: 'pointer', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontWeight: 400,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            }}
                            aria-label="Fechar"
                        >
                            ×
                        </button>
                        {selectedProperty.images.main ? (
                            <div style={{ position: 'relative' }}>
                                <img
                                    src={selectedProperty.images.main}
                                    alt={selectedProperty.name}
                                    style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                                />
                                <div style={{
                                    position: 'absolute', bottom: 12, left: 14,
                                    background: 'white', color: '#0B1928',
                                    fontSize: 9, fontWeight: 700,
                                    textTransform: 'uppercase' as const, letterSpacing: '0.1em',
                                    padding: '4px 10px', borderRadius: 8,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                    display: 'flex', alignItems: 'center', gap: 5,
                                }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc }} />
                                    {STATUS_LABELS[selectedProperty.status] || selectedProperty.status}
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                height: 64,
                                background: 'linear-gradient(135deg,#F8F6F2,#E8E5DF)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                            }}>
                                🏢
                            </div>
                        )}
                        <div style={{ padding: '16px 18px 18px' }}>
                            <p style={{ fontWeight: 800, fontSize: 16, color: '#0B1928', margin: '0 0 4px', lineHeight: 1.3, fontFamily: "'Playfair Display', Georgia, serif" }}>
                                {selectedProperty.name}
                            </p>
                            <p style={{ fontSize: 12, color: '#948F84', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#948F84" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                {selectedProperty.location.neighborhood ? `${selectedProperty.location.neighborhood}, ` : ''}
                                {selectedProperty.location.city}
                                {selectedProperty.location.country && selectedProperty.location.country !== 'Brasil'
                                    ? ` — ${selectedProperty.location.country}` : ''}
                            </p>
                            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                                {selectedProperty.specs.areaRange && selectedProperty.specs.areaRange !== '—' && (
                                    <span style={{ background: '#F8F6F2', color: '#5A6577', fontSize: 11, padding: '4px 10px', borderRadius: 8, fontWeight: 600 }}>
                                        {selectedProperty.specs.areaRange}
                                    </span>
                                )}
                                {selectedProperty.specs.bedroomsRange && selectedProperty.specs.bedroomsRange !== '—' && (
                                    <span style={{ background: '#F8F6F2', color: '#5A6577', fontSize: 11, padding: '4px 10px', borderRadius: 8, fontWeight: 600 }}>
                                        {selectedProperty.specs.bedroomsRange} qts
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    {selectedProperty.priceRange.min > 0 ? (
                                        <>
                                            <p style={{ fontSize: 10, color: '#948F84', margin: '0 0 1px', fontWeight: 600 }}>A partir de</p>
                                            <p style={{ fontSize: 22, fontWeight: 900, color: '#0B1928', margin: 0, letterSpacing: '-0.02em' }}>
                                                {formatCurrency(selectedProperty.priceRange.min)}
                                            </p>
                                        </>
                                    ) : (
                                        <p style={{ fontSize: 16, fontWeight: 700, color: '#F59E0B', margin: 0 }}>Sob Consulta</p>
                                    )}
                                </div>
                                <a
                                    href={`/${lang}/imoveis/${selectedProperty.slug}`}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        background: '#0B1928',
                                        color: 'white', fontSize: 12, fontWeight: 700,
                                        padding: '10px 18px', borderRadius: 12,
                                        textDecoration: 'none', letterSpacing: '0.01em',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    Ver Detalhes →
                                </a>
                            </div>
                        </div>
                    </div>
                )
            })()}

            {/* Popup CSS overrides */}
            <style>{`
                .imi-popup .mapboxgl-popup-content,
                .imi-popup .maplibregl-popup-content {
                    background: transparent !important;
                    padding: 0 !important;
                    border-radius: 14px !important;
                    box-shadow: none !important;
                }
                .imi-popup .mapboxgl-popup-tip,
                .imi-popup .maplibregl-popup-tip { display: none !important; }
                .imi-popup .mapboxgl-popup-close-button,
                .imi-popup .maplibregl-popup-close-button { display: none !important; }
                .mapboxgl-ctrl-bottom-right,
                .maplibregl-ctrl-bottom-right { bottom: 10px !important; right: 10px !important; }
                .mapboxgl-ctrl-attrib, .mapboxgl-ctrl-logo,
                .maplibregl-ctrl-attrib, .maplibregl-ctrl-logo { display: none !important; }
                .imi-property-marker { z-index: 1; }
                .imi-property-marker:hover { z-index: 10; }
                @keyframes floatCardIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(14px); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `}</style>
        </div>
    )
}
