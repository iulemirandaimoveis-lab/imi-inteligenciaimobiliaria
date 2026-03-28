'use client'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Development } from '@/app/[lang]/(website)/imoveis/types/development'

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

// ─── Region detection & grouping ─────────────────────────────────────────────

interface Region {
    id: string
    label: string
    flag: string
    center: [number, number] // [lng, lat]
    zoom: number
}

const REGIONS: Region[] = [
    { id: 'todos', label: 'Todos', flag: '🌎', center: [-38.5, -8.5], zoom: 4 },
    { id: 'nordeste', label: 'Nordeste', flag: '🇧🇷', center: [-34.9, -7.8], zoom: 7 },
    { id: 'sao-paulo', label: 'São Paulo', flag: '🇧🇷', center: [-46.67, -23.58], zoom: 12 },
    { id: 'dubai', label: 'Dubai', flag: '🇦🇪', center: [55.18, 25.08], zoom: 11 },
    { id: 'eua', label: 'EUA', flag: '🇺🇸', center: [-80.5, 27.0], zoom: 6 },
]

function getRegionId(dev: Development): string {
    const country = dev.location.country?.toLowerCase() || ''
    const state = dev.location.state?.toUpperCase() || ''
    if (country.includes('emirados') || country.includes('uae') || dev.location.city?.toLowerCase().includes('dubai'))
        return 'dubai'
    if (country.includes('estados unidos') || country.includes('usa') || country.includes('united states'))
        return 'eua'
    if (state === 'SP' || dev.location.city?.toLowerCase().includes('são paulo'))
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

    useEffect(() => { onMarkerClickRef.current = onMarkerClick }, [onMarkerClick])

    const validDevelopments = useMemo(() =>
        developments.filter(
            (d) =>
                d.location.coordinates?.lat !== 0 &&
                d.location.coordinates?.lng !== 0 &&
                d.location.coordinates?.lat != null &&
                d.location.coordinates?.lng != null
        ),
        [developments]
    )

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

        devs.forEach((dev) => {
            const { lat, lng } = dev.location.coordinates
            const statusColor = STATUS_COLORS[dev.status] || '#60A5FA'

            const el = document.createElement('div')
            el.className = 'imi-property-marker'
            el.style.cssText = 'position:relative;cursor:pointer;transition:transform 0.2s ease;'

            const pin = document.createElement('div')
            pin.style.cssText = `
                width:44px;height:44px;
                border-radius:50% 50% 50% 4px;
                transform:rotate(-45deg);
                background:linear-gradient(135deg,${statusColor}dd,${statusColor});
                border:2.5px solid rgba(255,255,255,0.4);
                box-shadow:0 4px 20px ${statusColor}55,0 2px 6px rgba(0,0,0,0.4);
                display:flex;align-items:center;justify-content:center;
            `
            const labelEl = document.createElement('div')
            labelEl.style.cssText = `
                transform:rotate(45deg);color:white;font-size:7px;
                font-weight:800;text-align:center;line-height:1.3;
                max-width:32px;text-shadow:0 1px 2px rgba(0,0,0,0.3);
                letter-spacing:-0.01em;
            `
            const price = dev.priceRange.min
            labelEl.textContent =
                price > 1_000_000
                    ? `R$${(price / 1_000_000).toFixed(1)}M`
                    : price > 0
                      ? `R$${Math.round(price / 1000)}K`
                      : '★'
            pin.appendChild(labelEl)
            el.appendChild(pin)

            // Country flag badge for international properties
            const country = dev.location.country?.toLowerCase() || ''
            if (country.includes('emirados') || country.includes('estados unidos') || country.includes('usa')) {
                const badge = document.createElement('div')
                badge.style.cssText = `
                    position:absolute;top:-4px;right:-4px;
                    width:18px;height:18px;border-radius:50%;
                    background:#1A1E2A;border:1.5px solid rgba(255,255,255,0.3);
                    display:flex;align-items:center;justify-content:center;
                    font-size:10px;line-height:1;z-index:2;
                `
                badge.textContent = country.includes('emirados') ? '🇦🇪' : '🇺🇸'
                el.appendChild(badge)
            }

            el.addEventListener('mouseenter', () => {
                el.style.transform = 'scale(1.15) translateY(-2px)'
                pin.style.boxShadow = `0 8px 30px ${statusColor}88,0 4px 12px rgba(0,0,0,0.5)`
            })
            el.addEventListener('mouseleave', () => {
                el.style.transform = 'scale(1) translateY(0)'
                pin.style.boxShadow = `0 4px 20px ${statusColor}55,0 2px 6px rgba(0,0,0,0.4)`
            })
            el.addEventListener('click', () => {
                onMarkerClickRef.current?.(dev.id)
                setSelectedProperty(dev)
            })

            const popupHTML = `
                <div style="
                    background:#1A1E2A;border-radius:14px;overflow:hidden;
                    color:white;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                    min-width:240px;max-width:280px;box-shadow:0 20px 60px rgba(0,0,0,0.6);
                ">
                    ${dev.images.main
                        ? `<div style="position:relative;">
                            <img src="${esc(dev.images.main)}" alt="${esc(dev.name)}" style="width:100%;height:130px;object-fit:cover;display:block;"/>
                            <div style="position:absolute;top:8px;left:8px;background:${statusColor}22;color:${statusColor};font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;padding:3px 8px;border-radius:6px;border:1px solid ${statusColor}44;backdrop-filter:blur(4px);">
                                ${esc(STATUS_LABELS[dev.status] || dev.status)}
                            </div>
                        </div>`
                        : `<div style="height:60px;background:linear-gradient(135deg,#1D4ED820,#60A5FA20);display:flex;align-items:center;justify-content:center;font-size:28px;">🏢</div>`
                    }
                    <div style="padding:12px 14px 14px;">
                        <div style="font-weight:800;font-size:13px;margin-bottom:3px;line-height:1.3;color:#F9FAFB;">${esc(dev.name)}</div>
                        <div style="font-size:11px;color:#9CA3AF;margin-bottom:10px;">
                            ${dev.location.neighborhood ? esc(dev.location.neighborhood) + ', ' : ''}${esc(dev.location.city)}${dev.location.country && dev.location.country !== 'Brasil' ? ' — ' + esc(dev.location.country) : ''}
                        </div>
                        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
                            ${dev.specs.areaRange && dev.specs.areaRange !== '—'
                                ? `<span style="background:#1D4ED815;color:#60A5FA;font-size:10px;padding:3px 8px;border-radius:6px;font-weight:600;border:1px solid #1D4ED830;">${esc(dev.specs.areaRange)}</span>`
                                : ''}
                            ${dev.specs.bedroomsRange && dev.specs.bedroomsRange !== '—'
                                ? `<span style="background:#1D4ED815;color:#60A5FA;font-size:10px;padding:3px 8px;border-radius:6px;font-weight:600;border:1px solid #1D4ED830;">${esc(dev.specs.bedroomsRange)} qts</span>`
                                : ''}
                        </div>
                        <div style="font-size:17px;font-weight:900;color:#60A5FA;margin-bottom:12px;letter-spacing:-0.02em;">
                            ${dev.priceRange.min > 0
                                ? `<span style="font-size:10px;font-weight:600;color:#9CA3AF;display:block;margin-bottom:2px;">A partir de</span>${formatCurrency(dev.priceRange.min)}`
                                : '<span style="color:#F59E0B;">Sob Consulta</span>'
                            }
                        </div>
                        <a href="/${lang}/imoveis/${esc(dev.slug)}" style="
                            display:block;text-align:center;
                            background:linear-gradient(135deg,#1D4ED8,#60A5FA);
                            color:white;font-size:12px;font-weight:700;
                            padding:9px 16px;border-radius:9px;text-decoration:none;
                            letter-spacing:0.01em;
                        ">
                            Ver Empreendimento →
                        </a>
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
                        center: [-34.9, -8.1],
                        zoom: 7,
                        attributionControl: false,
                    })
                } else {
                    const mod = await import('maplibre-gl')
                    mapLib = mod.default
                    map.current = new mapLib.Map({
                        container: mapContainer.current!,
                        style: darkMode ? CARTO_DARK : CARTO_LIGHT,
                        center: [-34.9, -8.1],
                        zoom: 7,
                        attributionControl: false,
                    })
                }

                map.current.addControl(
                    new mapLib.NavigationControl({ showCompass: false }),
                    'bottom-right'
                )

                map.current.on('load', () => {
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
        if (regionId !== 'todos' && map.current) {
            const region = REGIONS.find(r => r.id === regionId)
            if (region) {
                map.current.flyTo({
                    center: region.center,
                    zoom: region.zoom,
                    duration: 600,
                })
            }
        }
    }, [])

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
                    position: 'absolute', inset: 0, background: '#1A1E2A', zIndex: 10,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 12,
                }}>
                    <div style={{
                        width: 36, height: 36,
                        border: '3px solid rgba(59,130,246,0.2)',
                        borderTopColor: '#60A5FA', borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>Carregando mapa...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {/* Region filter tabs */}
            {mapLoaded && availableRegions.length > 2 && (
                <div style={{
                    position: 'absolute', top: 12, left: 12, zIndex: 5,
                    display: 'flex', gap: 4, flexWrap: 'wrap',
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
                                    background: isActive
                                        ? 'rgba(96,165,250,0.9)'
                                        : 'rgba(10,15,30,0.85)',
                                    backdropFilter: 'blur(8px)',
                                    color: isActive ? 'white' : '#9CA3AF',
                                    fontSize: 11,
                                    fontWeight: isActive ? 700 : 500,
                                    padding: '5px 10px',
                                    borderRadius: 16,
                                    border: isActive
                                        ? '1px solid rgba(96,165,250,0.5)'
                                        : '1px solid rgba(255,255,255,0.1)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    letterSpacing: '0.02em',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {region.flag} {region.label} <span style={{ opacity: 0.7 }}>({count})</span>
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Properties count badge — only when single region */}
            {mapLoaded && availableRegions.length <= 2 && (
                <div style={{
                    position: 'absolute', top: 12, left: 12, zIndex: 5,
                    background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(8px)',
                    color: 'white', fontSize: 11, fontWeight: 700,
                    padding: '5px 12px', borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.1)',
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>
                    {filteredDevelopments.length} empreendimento{filteredDevelopments.length !== 1 ? 's' : ''}
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
                        width: 'min(340px, calc(100% - 32px))',
                        background: 'rgba(16, 20, 35, 0.97)',
                        backdropFilter: 'blur(20px)', borderRadius: 18,
                        overflow: 'hidden',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)',
                        animation: 'floatCardIn 0.22s cubic-bezier(0.16,1,0.3,1)',
                    }}>
                        <button
                            onClick={() => setSelectedProperty(null)}
                            style={{
                                position: 'absolute', top: 10, right: 10, zIndex: 2,
                                width: 28, height: 28, borderRadius: '50%',
                                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                color: 'rgba(255,255,255,0.8)', fontSize: 18, lineHeight: '1',
                                cursor: 'pointer', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontWeight: 300,
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
                                    style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                                />
                                <div style={{
                                    position: 'absolute', bottom: 10, left: 12,
                                    background: sc + '22', color: sc,
                                    fontSize: 9, fontWeight: 700,
                                    textTransform: 'uppercase' as const, letterSpacing: '0.12em',
                                    padding: '3px 8px', borderRadius: 6,
                                    border: `1px solid ${sc}44`, backdropFilter: 'blur(4px)',
                                }}>
                                    {STATUS_LABELS[selectedProperty.status] || selectedProperty.status}
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                height: 64,
                                background: 'linear-gradient(135deg,rgba(29,78,216,0.12),rgba(59,130,246,0.12))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                            }}>
                                🏢
                            </div>
                        )}
                        <div style={{ padding: '14px 16px 16px' }}>
                            <p style={{ fontWeight: 800, fontSize: 14, color: '#F9FAFB', margin: '0 0 3px', lineHeight: 1.3 }}>
                                {selectedProperty.name}
                            </p>
                            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 10px' }}>
                                {selectedProperty.location.neighborhood ? `${selectedProperty.location.neighborhood}, ` : ''}
                                {selectedProperty.location.city}
                                {selectedProperty.location.country && selectedProperty.location.country !== 'Brasil'
                                    ? ` — ${selectedProperty.location.country}` : ''}
                            </p>
                            <div style={{ marginBottom: 14 }}>
                                {selectedProperty.priceRange.min > 0 ? (
                                    <>
                                        <p style={{ fontSize: 10, color: '#9CA3AF', margin: '0 0 2px', fontWeight: 600 }}>A partir de</p>
                                        <p style={{ fontSize: 20, fontWeight: 900, color: '#60A5FA', margin: 0, letterSpacing: '-0.02em' }}>
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
                                    display: 'block', textAlign: 'center',
                                    background: 'linear-gradient(135deg,#1D4ED8,#60A5FA)',
                                    color: 'white', fontSize: 13, fontWeight: 700,
                                    padding: '10px 16px', borderRadius: 10,
                                    textDecoration: 'none', letterSpacing: '0.01em',
                                }}
                            >
                                Ver Detalhes →
                            </a>
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
