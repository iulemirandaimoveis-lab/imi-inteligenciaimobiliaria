'use client'

import { useEffect, useRef, useState } from 'react'
import { Development } from '@/app/[lang]/(website)/imoveis/types/development'

// Dynamic import of mapboxgl to avoid SSR issues
let mapboxgl: any = null

interface PropertyMapProps {
  developments: Development[]
  height?: string
  className?: string
  lang?: string
  darkMode?: boolean
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

export default function PropertyMap({
  developments,
  height = '500px',
  className = '',
  lang = 'pt',
  darkMode = true,
}: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const markers = useRef<any[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

  // Filter properties with valid coordinates
  const validDevelopments = developments.filter(
    (d) =>
      d.location.coordinates?.lat !== 0 &&
      d.location.coordinates?.lng !== 0 &&
      d.location.coordinates?.lat != null
  )

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainer.current || map.current) return

    const initMap = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const mapboxModule = await import('mapbox-gl')
        mapboxgl = mapboxModule.default

        mapboxgl.accessToken = MAPBOX_TOKEN

        // Calculate center from properties
        const center =
          validDevelopments.length > 0
            ? [
                validDevelopments.reduce((s, d) => s + d.location.coordinates.lng, 0) /
                  validDevelopments.length,
                validDevelopments.reduce((s, d) => s + d.location.coordinates.lat, 0) /
                  validDevelopments.length,
              ]
            : [-34.861, -7.115] // Default: João Pessoa, PB

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: darkMode
            ? 'mapbox://styles/mapbox/dark-v11'
            : 'mapbox://styles/mapbox/light-v11',
          center: center as [number, number],
          zoom: validDevelopments.length === 1 ? 14 : 8,
          attributionControl: false,
        })

        // Add minimal navigation controls
        map.current.addControl(
          new mapboxgl.NavigationControl({ showCompass: false }),
          'bottom-right'
        )

        map.current.on('load', () => {
          setMapLoaded(true)

          // Add markers
          validDevelopments.forEach((dev) => {
            const { lat, lng } = dev.location.coordinates
            const statusColor = STATUS_COLORS[dev.status] || '#3B82F6'

            // Custom marker element
            const el = document.createElement('div')
            el.className = 'imi-property-marker'
            el.style.cssText = `
              position: relative;
              cursor: pointer;
              transition: transform 0.2s ease;
            `

            // Pin shape
            const pin = document.createElement('div')
            pin.style.cssText = `
              width: 44px;
              height: 44px;
              border-radius: 50% 50% 50% 4px;
              transform: rotate(-45deg);
              background: linear-gradient(135deg, ${statusColor}dd, ${statusColor});
              border: 2.5px solid rgba(255,255,255,0.4);
              box-shadow: 0 4px 20px ${statusColor}55, 0 2px 6px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
            `

            // Price label inside pin
            const label = document.createElement('div')
            label.style.cssText = `
              transform: rotate(45deg);
              color: white;
              font-size: 7px;
              font-weight: 800;
              text-align: center;
              line-height: 1.3;
              max-width: 32px;
              text-shadow: 0 1px 2px rgba(0,0,0,0.3);
              letter-spacing: -0.01em;
            `
            const price = dev.priceRange.min
            label.textContent =
              price > 1_000_000
                ? `R$${(price / 1_000_000).toFixed(1)}M`
                : price > 0
                  ? `R$${Math.round(price / 1000)}K`
                  : '★'

            pin.appendChild(label)
            el.appendChild(pin)

            // Hover effect
            el.addEventListener('mouseenter', () => {
              el.style.transform = 'scale(1.15) translateY(-2px)'
              pin.style.boxShadow = `0 8px 30px ${statusColor}88, 0 4px 12px rgba(0,0,0,0.5)`
            })
            el.addEventListener('mouseleave', () => {
              el.style.transform = 'scale(1) translateY(0)'
              pin.style.boxShadow = `0 4px 20px ${statusColor}55, 0 2px 6px rgba(0,0,0,0.4)`
            })

            // Popup
            const popupHTML = `
              <div style="
                background: #1A1E2A;
                border-radius: 14px;
                overflow: hidden;
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                min-width: 240px;
                max-width: 280px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.6);
              ">
                ${
                  dev.images.main
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
                  <div style="font-size:11px;color:#9CA3AF;margin-bottom:10px;">${dev.location.neighborhood}${dev.location.neighborhood ? ', ' : ''}${dev.location.city}</div>

                  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
                    ${
                      dev.specs.areaRange !== 'Sob consulta'
                        ? `<span style="background:#1D4ED815;color:#60A5FA;font-size:10px;padding:3px 8px;border-radius:6px;font-weight:600;border:1px solid #1D4ED830;">${dev.specs.areaRange}</span>`
                        : ''
                    }
                    ${
                      dev.specs.bedroomsRange !== 'Sob consulta'
                        ? `<span style="background:#1D4ED815;color:#60A5FA;font-size:10px;padding:3px 8px;border-radius:6px;font-weight:600;border:1px solid #1D4ED830;">${dev.specs.bedroomsRange} qts</span>`
                        : ''
                    }
                  </div>

                  <div style="font-size:17px;font-weight:900;color:#60A5FA;margin-bottom:12px;letter-spacing:-0.02em;">
                    ${
                      dev.priceRange.min > 0
                        ? `<span style="font-size:10px;font-weight:600;color:#9CA3AF;display:block;margin-bottom:2px;">A partir de</span>${formatCurrency(dev.priceRange.min)}`
                        : '<span style="color:#F59E0B;">Sob Consulta</span>'
                    }
                  </div>

                  <a
                    href="/${lang}/imoveis/${dev.slug}"
                    style="
                      display:block;
                      text-align:center;
                      background:linear-gradient(135deg,#1D4ED8,#3B82F6);
                      color:white;
                      font-size:12px;
                      font-weight:700;
                      padding:9px 16px;
                      border-radius:9px;
                      text-decoration:none;
                      transition:opacity 0.15s;
                      letter-spacing:0.01em;
                    "
                    onmouseover="this.style.opacity=0.85"
                    onmouseout="this.style.opacity=1"
                  >
                    Ver Empreendimento →
                  </a>
                </div>
              </div>
            `

            const popup = new mapboxgl.Popup({
              offset: [0, -48],
              className: 'imi-popup',
              maxWidth: '300px',
              closeButton: true,
              closeOnMove: false,
            }).setHTML(popupHTML)

            const marker = new mapboxgl.Marker({
              element: el,
              anchor: 'bottom',
            })
              .setLngLat([lng, lat])
              .setPopup(popup)
              .addTo(map.current)

            markers.current.push(marker)
          })

          // Fit bounds to show all properties
          if (validDevelopments.length > 1) {
            const bounds = new mapboxgl.LngLatBounds()
            validDevelopments.forEach((d) =>
              bounds.extend([d.location.coordinates.lng, d.location.coordinates.lat])
            )
            map.current.fitBounds(bounds, {
              padding: { top: 80, bottom: 80, left: 60, right: 60 },
              maxZoom: 13,
              duration: 800,
            })
          }
        })
      } catch (err) {
        console.error('Mapbox init error:', err)
        setError('Erro ao carregar o mapa')
      }
    }

    initMap()

    return () => {
      markers.current.forEach((m) => m.remove())
      markers.current = []
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [MAPBOX_TOKEN])

  // Token not configured
  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={className}
        style={{
          height,
          background: darkMode ? '#1A1E2A' : '#F1F5F9',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          border: '1px dashed rgba(255,255,255,0.1)',
        }}
      >
        <span style={{ fontSize: 40 }}>🗺️</span>
        <p
          style={{
            color: darkMode ? '#9CA3AF' : '#64748B',
            fontSize: 14,
            fontWeight: 700,
            margin: 0,
          }}
        >
          Mapa interativo ativando em breve
        </p>
        <p
          style={{
            color: darkMode ? '#6B7280' : '#94A3B8',
            fontSize: 12,
            margin: 0,
          }}
        >
          {validDevelopments.length} empreendimentos mapeados
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={className}
        style={{
          height,
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

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        height,
      }}
    >
      {/* Loading overlay */}
      {!mapLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#1A1E2A',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              border: '3px solid rgba(59,130,246,0.2)',
              borderTopColor: '#3B82F6',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>
            Carregando mapa...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Count badge */}
      {mapLoaded && validDevelopments.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 5,
            background: 'rgba(10,15,30,0.85)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            fontSize: 11,
            fontWeight: 700,
            padding: '5px 12px',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.1)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {validDevelopments.length} empreendimento{validDevelopments.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Map container */}
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Popup CSS overrides */}
      <style>{`
        .imi-popup .mapboxgl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          border-radius: 14px !important;
          box-shadow: none !important;
        }
        .imi-popup .mapboxgl-popup-tip {
          display: none !important;
        }
        .imi-popup .mapboxgl-popup-close-button {
          display: none !important;
        }
        .mapboxgl-ctrl-bottom-right {
          bottom: 10px !important;
          right: 10px !important;
        }
        .mapboxgl-ctrl-attrib,
        .mapboxgl-ctrl-logo {
          display: none !important;
        }
        .imi-property-marker {
          z-index: 1;
        }
        .imi-property-marker:hover {
          z-index: 10;
        }
      `}</style>
    </div>
  )
}
