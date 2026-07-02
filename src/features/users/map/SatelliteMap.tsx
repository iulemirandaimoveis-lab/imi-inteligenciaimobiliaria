'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { tokens as T } from '../ui/tokens'

/**
 * Vista de satélite/aérea ultra realista centrada numa âncora geográfica.
 *
 * Usa MapLibre GL (já no projeto) + Esri World Imagery (tiles raster gratuitos,
 * sem token) e uma camada de rótulos por cima. Não embute lotes — o overlay
 * georreferenciado dos lotes depende de pontos de controle (scripts/cad/geo/).
 */
export function SatelliteMap({
  lng,
  lat,
  zoom = 16,
  label,
}: {
  lng: number
  lat: number
  zoom?: number
  label?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      center: [lng, lat],
      zoom,
      pitch: 0,
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          esriImagery: {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution:
              'Imagery © Esri — Maxar, Earthstar Geographics, and the GIS User Community',
          },
          esriLabels: {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 19,
          },
        },
        layers: [
          { id: 'imagery', type: 'raster', source: 'esriImagery' },
          { id: 'labels', type: 'raster', source: 'esriLabels' },
        ],
      },
    })

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
    map.addControl(new maplibregl.FullscreenControl(), 'top-right')
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

    // Marcador dourado na âncora.
    const el = document.createElement('div')
    el.style.cssText = `width:18px;height:18px;border-radius:50%;background:${T.gold};border:3px solid #1A1206;box-shadow:0 0 0 4px rgba(200,164,74,0.35);`
    const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat])
    // className explícita — o CSS padrão do MapLibre não define `color` no
    // popup (só o fundo branco); sem isto o texto herda a cor do ancestral
    // DOM e fica invisível (balão branco "vazio") em telas com tema escuro.
    if (label) marker.setPopup(new maplibregl.Popup({ offset: 18, className: 'ab-anchor-popup' }).setText(label))
    marker.addTo(map)

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [lng, lat, zoom, label])

  return (
    <>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '72vh', minHeight: 440, borderRadius: 12, overflow: 'hidden' }}
      />
      <style>{`
        .ab-anchor-popup .maplibregl-popup-content {
          color: #0B1928;
          font-weight: 700;
          font-size: 13px;
          font-family: 'Outfit', sans-serif;
        }
      `}</style>
    </>
  )
}
