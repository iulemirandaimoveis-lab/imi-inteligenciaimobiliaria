'use client'

import { useEffect, useRef, useState } from 'react'
import { Development } from '@/app/[lang]/(website)/imoveis/types/development'

// Dynamic import — avoids SSR issues with both providers
let mapLib: any = null

// ─── Free CARTO tile styles (no API key needed) ──────────────────────────────
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

const STATUS_LABELS: Record<string, string> = {
    launch: 'Lançamento',
    ready: 'Pronto',
    under_construction: 'Em Obra',
}

const STATUS_COLORS: Record<string, string> = {
    launch: '#3B82F6',
    ready: '#10B981',
    under_construction: '#F59E0B',
}

// Determine which map engine to use at runtime
// MapLibre (free, default) → unless MAPBOX token is explicitly set
function getMapProvider() {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (mapboxToken && mapboxToken.startsWith('pk.')) {
        return { engine: 'mapbox' as const, token: mapboxToken }
    }
    return { engine: 'maplibre' as const, token: null }
}

export default function PropertyMap({
    developments,
    height,
    className = '',
    lang = 'pt',
    darkMode = true,
    selectedId,
    onMarkerClick,
}: PropertyMapProps) {
    // Responsive default: taller on desktop, shorter on mobile
    const resolvedHeight = height || 'clamp(400px, calc(100vh - 280px), 700px)'
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<any>(null)
    const markers = useRef<Map<string, any>>(new Map())
    const popups = useRef<Map<string, any>>(new Map())
    const onMarkerClickRef = useRef(onMarkerClick)
    const [mapLoaded, setMapLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Keep callback ref fresh without re-init
    useEffect(() => { onMarkerClickRef.current = onMarkerClick }, [onMarkerClick])

    const validDevelopments = developments.filter(
        (d) =>
            d.location.coordinates?.lat !== 0 &&
            d.location.coordinates?.lng !== 0 &&
            d.location.coordinates?.lat != null &&
            d.location.coordinates?.lng != null
    )

    useEffect(() => {
        if (!mapContainer.current || map.current) return

        const initMap = async () => {
            try {
                const provider = getMapProvider()

                if (provider.engine === 'mapbox') {
                    // ── Mapbox GL JS (requires NEXT_PUBLIC_MAPBOX_TOKEN) ──────────
                    const mod = await import('mapbox-gl')
                    mapLib = mod.default
                    mapLib.accessToken = provider.token

                    const center = calcCenter(validDevelopments)
                    map.current = new mapLib.Map({
                        container: mapContainer.current!,
                        style: darkMode
                            ? 'mapbox://styles/mapbox/dark-v11'
                            : 'mapbox://styles/mapbox/light-v11',
                        center,
                        zoom: validDevelopments.length === 1 ? 14 : 8,
                        attributionControl: false,
                    })
                } else {
                    // ── MapLibre GL JS + CARTO tiles (free, no API key) ──────────
                    const mod = await import('maplibre-gl')
                    mapLib = mod.default

                    const center = calcCenter(validDevelopments)
                    map.current = new mapLib.Map({
                        container: mapContainer.current!,
                        style: darkMode ? CARTO_DARK : CARTO_LIGHT,
                        center,
                        zoom: validDevelopments.length === 1 ? 14 : 8,
                        attributionControl: false,
                    })
                }

                // Navigation control (zoom +/−, same API for both)
                map.current.addControl(
                    new mapLib.NavigationControl({ showCompass: false }),
                    'bottom-right'
                )

                map.current.on('load', () => {
                    setMapLoaded(true)
                    addMarkers()
                    fitBounds()
                })
            } catch (err) {
                console.error('[PropertyMap] init error:', err)
                setError('Erro ao carregar o mapa')
            }
        }

        const calcCenter = (devs: Development[]): [number, number] => {
            if (devs.length === 0) return [-34.861, -7.115] // Recife default
            return [
                devs.reduce((s, d) => s + d.location.coordinates.lng, 0) / devs.length,
                devs.reduce((s, d) => s + d.location.coordinates.lat, 0) / devs.length,
            ]
        }

        const addMarkers = () => {
            validDevelopments.forEach((dev) => {
                const { lat, lng } = dev.location.coordinates
                const statusColor = STATUS_COLORS[dev.status] || '#3B82F6'

                // Custom marker element
                const el = document.createElement('div')
                el.className = 'imi-property-marker'
                el.style.cssText = `position:relative;cursor:pointer;transition:transform 0.2s ease;`

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

                el.addEventListener('mouseenter', () => {
                    el.style.transform = 'scale(1.15) translateY(-2px)'
                    pin.style.boxShadow = `0 8px 30px ${statusColor}88,0 4px 12px rgba(0,0,0,0.5)`
                })
                el.addEventListener('mouseleave', () => {
                    el.style.transform = 'scale(1) translateY(0)'
                    pin.style.boxShadow = `0 4px 20px ${statusColor}55,0 2px 6px rgba(0,0,0,0.4)`
                })

                // Click fires onMarkerClick callback for sidebar sync
                el.addEventListener('click', () => {
                    onMarkerClickRef.current?.(dev.id)
                })

                const popupHTML = `
                    <div style="
                        background:#1A1E2A;border-radius:14px;overflow:hidden;
                        color:white;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                        min-width:240px;max-width:280px;box-shadow:0 20px 60px rgba(0,0,0,0.6);
                    ">
                        ${dev.images.main
                            ? `<div style="position:relative;">
                                <img src="${dev.images.main}" alt="${dev.name}" style="width:100%;height:130px;object-fit:cover;display:block;"/>
                                <div style="position:absolute;top:8px;left:8px;background:${statusColor}22;color:${statusColor};font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;padding:3px 8px;border-radius:999px;border:1px solid ${statusColor}44;backdrop-filter:blur(4px);">
                                    ${STATUS_LABELS[dev.status] || dev.status}
                                </div>
                            </div>`
                            : `<div style="height:60px;background:linear-gradient(135deg,#1D4ED820,#3B82F620);display:flex;align-items:center;justify-content:center;font-size:28px;">🏢</div>`
                        }
                        <div style="padding:12px 14px 14px;">
                            <div style="font-weight:800;font-size:13px;margin-bottom:3px;line-height:1.3;color:#F9FAFB;">${dev.name}</div>
                            <div style="font-size:11px;color:#9CA3AF;margin-bottom:10px;">
                                ${dev.location.neighborhood ? dev.location.neighborhood + ', ' : ''}${dev.location.city}
                            </div>
                            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
                                ${dev.specs.areaRange && dev.specs.areaRange !== '—'
                                    ? `<span style="background:#1D4ED815;color:#60A5FA;font-size:10px;padding:3px 8px;border-radius:6px;font-weight:600;border:1px solid #1D4ED830;">${dev.specs.areaRange}</span>`
                                    : ''}
                                ${dev.specs.bedroomsRange && dev.specs.bedroomsRange !== '—'
                                    ? `<span style="background:#1D4ED815;color:#60A5FA;font-size:10px;padding:3px 8px;border-radius:6px;font-weight:600;border:1px solid #1D4ED830;">${dev.specs.bedroomsRange} qts</span>`
                                    : ''}
                            </div>
                            <div style="font-size:17px;font-weight:900;color:#60A5FA;margin-bottom:12px;letter-spacing:-0.02em;">
                                ${dev.priceRange.min > 0
                                    ? `<span style="font-size:10px;font-weight:600;color:#9CA3AF;display:block;margin-bottom:2px;">A partir de</span>${formatCurrency(dev.priceRange.min)}`
                                    : '<span style="color:#F59E0B;">Sob Consulta</span>'
                                }
                            </div>
                            <a href="/${lang}/imoveis/${dev.slug}" style="
                                display:block;text-align:center;
                                background:linear-gradient(135deg,#1D4ED8,#3B82F6);
                                color:white;font-size:12px;font-weight:700;
                                padding:9px 16px;border-radius:9px;text-decoration:none;
                                letter-spacing:0.01em;
                            "
                            onmouseover="this.style.opacity='0.85'"
                            onmouseout="this.style.opacity='1'"
                            >
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

                markers.current.set(dev.id, marker)
                popups.current.set(dev.id, popup)
            })
        }

        const fitBounds = () => {
            if (validDevelopments.length <= 1) return
            const bounds = new mapLib.LngLatBounds()
            validDevelopments.forEach((d) =>
                bounds.extend([d.location.coordinates.lng, d.location.coordinates.lat])
            )
            map.current.fitBounds(bounds, {
                padding: { top: 80, bottom: 80, left: 60, right: 60 },
                maxZoom: 13,
                duration: 800,
            })
        }

        initMap()

        return () => {
            markers.current.forEach((m) => m.remove())
            markers.current.clear()
            popups.current.clear()
            if (map.current) {
                map.current.remove()
                map.current = null
                mapLib = null
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Open popup when selectedId changes externally (e.g. sidebar click)
    useEffect(() => {
        if (!selectedId || !mapLoaded) return
        const marker = markers.current.get(selectedId)
        const popup = popups.current.get(selectedId)
        if (!marker || !popup) return
        // Close all other popups first
        popups.current.forEach((p, id) => { if (id !== selectedId) p.remove() })
        if (!popup.isOpen()) marker.togglePopup()
        // Fly camera to selected marker
        const dev = validDevelopments.find(d => d.id === selectedId)
        if (dev && map.current) {
            map.current.flyTo({
                center: [dev.location.coordinates.lng, dev.location.coordinates.lat],
                zoom: Math.max(map.current.getZoom(), 13),
                duration: 700,
                essential: true,
            })
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId, mapLoaded])

    if (error) {
        return (
            <div
                className={className}
                style={{
                    height: resolvedHeight,
                    background: '#1A1E2A',
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <p style={{ color: '#EF4444', fontSize: 13 }}>{error}</p>
            </div>
        )
    }

    if (validDevelopments.length === 0) {
        return (
            <div
                className={className}
                style={{
                    height: resolvedHeight,
                    background: '#1A1E2A',
                    borderRadius: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                }}
            >
                <span style={{ fontSize: 40, opacity: 0.3 }}>🗺️</span>
                <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0, fontWeight: 500 }}>
                    Nenhum empreendimento com coordenadas disponíveis
                </p>
                <p style={{ color: '#6B7280', fontSize: 11, margin: 0 }}>
                    Ajuste os filtros ou adicione coordenadas aos empreendimentos
                </p>
            </div>
        )
    }

    return (
        <div
            className={className}
            style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', height: resolvedHeight }}
        >
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
                        borderTopColor: '#3B82F6', borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>Carregando mapa...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {/* Properties count badge */}
            {mapLoaded && validDevelopments.length > 0 && (
                <div style={{
                    position: 'absolute', top: 12, left: 12, zIndex: 5,
                    background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(8px)',
                    color: 'white', fontSize: 11, fontWeight: 700,
                    padding: '5px 12px', borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.1)',
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>
                    {validDevelopments.length} empreendimento{validDevelopments.length !== 1 ? 's' : ''}
                </div>
            )}

            {/* Map container */}
            <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

            {/* Popup CSS overrides — works for both mapboxgl and maplibregl classes */}
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
            `}</style>
        </div>
    )
}
