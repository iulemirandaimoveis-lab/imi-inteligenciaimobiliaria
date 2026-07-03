'use client'

import AerialSatelliteMap from '@/components/maps/AerialSatelliteMap'
import { tokens as T } from '../ui/tokens'

/**
 * Vista de satélite/aérea do console — casca fina sobre o componente canônico
 * `AerialSatelliteMap` (mesma fonte: MapLibre + Esri World Imagery).
 *
 * Antes este arquivo duplicava toda a inicialização do mapa e ficou para trás
 * quando o canônico ganhou o clamp de zoom (z≤18): acima disso a Esri devolve
 * tiles "Map data not yet available" (tela cinza). Delegando, o console herda
 * automaticamente esse e futuros fixes — só o enquadramento visual é local.
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
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden' }}>
      <AerialSatelliteMap lng={lng} lat={lat} zoom={zoom} label={label} markerColor={T.gold} />
    </div>
  )
}
