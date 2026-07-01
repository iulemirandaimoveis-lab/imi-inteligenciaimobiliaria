'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

/**
 * Vista aérea / satélite ultra realista centrada numa âncora geográfica.
 *
 * Genérico e sem dependência de tema (usável tanto no site público quanto no
 * console). Usa MapLibre GL + Esri World Imagery (tiles raster gratuitos, sem
 * token) com uma camada de rótulos por cima.
 *
 * NÃO embute os lotes — o overlay georreferenciado dos polígonos depende de
 * pontos de controle (≥3) resolvidos em scripts/cad/geo/.
 */
export default function AerialSatelliteMap({
  lng,
  lat,
  zoom = 16.5,
  label,
  height = '72vh',
  markerColor = '#C8A44A',
}: {
  lng: number
  lat: number
  zoom?: number
  label?: string
  height?: string | number
  markerColor?: string
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
      // Esri World Imagery não tem imagem real além de ~z18 nesta região
      // (Garanhuns/PE) — passar disso devolve tiles "Map data not yet available".
      // Limitamos o zoom do mapa e o maxzoom da fonte: o MapLibre faz overzoom
      // (amplia o último tile real) em vez de pedir tiles inexistentes.
      maxZoom: 18,
      minZoom: 13,
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
            maxzoom: 18,
            attribution:
              'Imagery © Esri — Maxar, Earthstar Geographics, and the GIS User Community',
          },
          esriLabels: {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 18,
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

    const el = document.createElement('div')
    el.style.cssText = `width:18px;height:18px;border-radius:50%;background:${markerColor};border:3px solid #0B1928;box-shadow:0 0 0 4px rgba(200,164,74,0.35);`
    const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat])
    if (label) marker.setPopup(new maplibregl.Popup({ offset: 18 }).setText(label))
    marker.addTo(map)

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [lng, lat, zoom, label, markerColor])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height, minHeight: 440, overflow: 'hidden' }}
    />
  )
}
