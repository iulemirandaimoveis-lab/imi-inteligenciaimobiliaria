'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { ConvenienceData } from '@/types/poi'

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
  developmentId,
  showPois = false,
}: {
  lng: number
  lat: number
  zoom?: number
  label?: string
  height?: string | number
  markerColor?: string
  /** Id do empreendimento — usado junto com `showPois` para buscar POIs próximos. */
  developmentId?: string
  /**
   * Plota pontos de interesse (mercado, escola, posto, hospital etc.) próximos
   * à âncora, buscados do mesmo endpoint usado por `POIGrid`. Opt-in — outros
   * consumidores deste componente (ex. console) não são afetados.
   */
  showPois?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [pois, setPois] = useState<ConvenienceData | null>(null)

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
    // className explícita — o CSS padrão do MapLibre não define `color` no
    // popup (só o fundo branco), então o texto herda a cor do ancestral DOM.
    // Sem isto, em páginas com `color` claro herdado o texto fica invisível
    // (balão branco "vazio"). Forçamos contraste independente do tema em volta.
    if (label) marker.setPopup(new maplibregl.Popup({ offset: 18, className: 'ab-anchor-popup' }).setText(label))
    marker.addTo(map)

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [lng, lat, zoom, label, markerColor])

  // Busca de POIs (mesmo endpoint usado por POIGrid) — opt-in via `showPois`.
  useEffect(() => {
    if (!showPois || !developmentId) return
    let cancelled = false
    fetch(`/api/pois?lat=${lat}&lng=${lng}&id=${developmentId}&type=residencial`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ConvenienceData | null) => { if (!cancelled) setPois(data) })
      .catch(() => { /* POIs são complementares — falha silenciosa */ })
    return () => { cancelled = true }
  }, [showPois, developmentId, lat, lng])

  // A API de POIs devolve só distância/nome/categoria (sem lat/lng por item) —
  // não há como cravar um pino georreferenciado real. Em vez de inventar uma
  // posição aproximada (enganoso numa imagem de satélite real), mostramos um
  // painel flutuante "Nas proximidades" com a distância real de cada ponto.
  const nearestByCategory = pois?.categories.filter((c) => c.items.length > 0) ?? []

  return (
    <div className="relative w-full" style={{ height, minHeight: 440 }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', overflow: 'hidden' }}
      />

      {showPois && nearestByCategory.length > 0 && (
        <div
          className="absolute left-3 bottom-3 sm:left-4 sm:bottom-4 z-10 rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(11,25,40,0.92)',
            backdropFilter: 'blur(12px)',
            maxWidth: 260,
            border: '1px solid rgba(200,164,74,0.25)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, color: '#C8A44A', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, padding: '10px 14px 6px' }}>
            Nas proximidades
          </p>
          <ul style={{ margin: 0, padding: '0 14px 12px', listStyle: 'none' }}>
            {nearestByCategory.map((category) => {
              const nearest = category.items[0]
              const distanceLabel = category.nearest_distance_meters >= 1000
                ? `${(category.nearest_distance_meters / 1000).toFixed(1)} km`
                : `${Math.round(category.nearest_distance_meters)} m`
              return (
                <li key={category.category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '4px 0' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.85)', minWidth: 0 }}>
                    <span aria-hidden style={{ fontSize: 13 }}>{category.icon}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {category.label}{nearest ? ` · ${nearest.name}` : ''}
                    </span>
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#C8A44A', flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                    {distanceLabel}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <style>{`
        .ab-anchor-popup .maplibregl-popup-content {
          color: #0B1928;
          font-weight: 700;
          font-size: 13px;
          font-family: 'Outfit', sans-serif;
        }
      `}</style>
    </div>
  )
}
