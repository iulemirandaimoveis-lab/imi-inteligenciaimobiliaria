/**
 * Isochrone generation.
 *
 * v1 = radial approximation: for each requested minute band we compute the
 * reachable distance from the mode's average speed and draw a polygon ring.
 * It's deterministic, key-free and instant — good enough for a first-pass
 * "what's within 10 minutes" visual. The `IsochroneSet.method` field marks it
 * as `radial` so the UI can badge it as an estimate. A routed backend
 * (Mapbox Isochrone / OSRM) can later populate `method: 'routed'` behind the
 * same return shape.
 */

import type {
  GeoJSONPolygon,
  GeoPoint,
  Isochrone,
  IsochroneSet,
  TravelMode,
} from '../../types'
import { offsetPoint } from '../../utils/distance'
import { estimateTravelTime } from '../../utils/travel-time'

/** Segments used to approximate each ring's circle. */
const RING_SEGMENTS = 48

/**
 * Invert `estimateTravelTime`: find the straight-line distance whose ETA for
 * `mode` equals `minutes`. Binary search keeps it consistent with the
 * travel-time model (including its detour + overhead terms).
 */
function reachableDistance(minutes: number, mode: TravelMode): number {
  const targetSeconds = minutes * 60
  let lo = 0
  let hi = 60_000 // 60 km upper bound
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (estimateTravelTime(mid, mode) < targetSeconds) lo = mid
    else hi = mid
  }
  return lo
}

function ringPolygon(center: GeoPoint, radiusMeters: number): GeoJSONPolygon {
  const coords: number[][] = []
  for (let i = 0; i <= RING_SEGMENTS; i++) {
    const angle = (i / RING_SEGMENTS) * 2 * Math.PI
    const north = Math.cos(angle) * radiusMeters
    const east = Math.sin(angle) * radiusMeters
    const p = offsetPoint(center, north, east)
    coords.push([p.lng, p.lat]) // GeoJSON is [lng, lat]
  }
  return { type: 'Polygon', coordinates: [coords] }
}

export function computeIsochrones(
  center: GeoPoint,
  mode: TravelMode,
  minutes: number[] = [5, 10, 15, 20],
): IsochroneSet {
  const rings: Isochrone[] = [...minutes]
    .sort((a, b) => a - b)
    .map((m) => ({
      mode,
      minutes: m,
      polygon: ringPolygon(center, reachableDistance(m, mode)),
    }))
  return { center, mode, rings, method: 'radial' }
}
