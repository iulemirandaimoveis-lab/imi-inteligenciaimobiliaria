/**
 * Travel-time estimation.
 *
 * v1 uses mode-specific average speeds with a light "urban detour" factor to
 * turn straight-line distance into a realistic ETA. This needs no API key and
 * works offline. When a routing provider (Google Directions / Mapbox / OSRM)
 * is configured later, the engine can swap `estimateTravelTimes` for routed
 * durations behind the same `TravelTimes` shape — no consumer changes.
 */

import type { TravelMode, TravelTimes } from '../types'

/** Average speed in m/s per mode. */
const SPEED_MPS: Record<TravelMode, number> = {
  walking: 1.35, // ~4.9 km/h
  cycling: 4.2, // ~15 km/h
  driving: 8.3, // ~30 km/h urban average
  transit: 5.0, // ~18 km/h incl. stops/waits
}

/**
 * Detour factor: real paths are longer than straight lines. Driving and
 * transit follow the road grid more than walking/cycling shortcuts.
 */
const DETOUR: Record<TravelMode, number> = {
  walking: 1.25,
  cycling: 1.3,
  driving: 1.4,
  transit: 1.5,
}

/** Fixed overhead in seconds (parking, waiting for a bus, etc.). */
const OVERHEAD_S: Record<TravelMode, number> = {
  walking: 0,
  cycling: 20,
  driving: 60,
  transit: 240,
}

export const ALL_TRAVEL_MODES: TravelMode[] = [
  'walking',
  'cycling',
  'driving',
  'transit',
]

/** Estimate travel time (seconds) for a single mode. */
export function estimateTravelTime(
  distanceMeters: number,
  mode: TravelMode,
): number {
  const effective = distanceMeters * DETOUR[mode]
  return Math.round(effective / SPEED_MPS[mode] + OVERHEAD_S[mode])
}

/** Estimate travel times for every mode (or a chosen subset). */
export function estimateTravelTimes(
  distanceMeters: number,
  modes: TravelMode[] = ALL_TRAVEL_MODES,
): TravelTimes {
  const out: TravelTimes = {}
  for (const mode of modes) {
    out[mode] = estimateTravelTime(distanceMeters, mode)
  }
  return out
}

/** Human-friendly label, e.g. `8 min`, `1 h 5 min`. */
export function formatDuration(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60))
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h} h ${m} min` : `${h} h`
}
