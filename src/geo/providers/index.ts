/**
 * Provider wiring. `buildDefaultRegistry()` reads server env and returns a
 * registry in priority order: Google (richest, if keyed) → OSM (reliable
 * baseline) → Mapbox (scaffold). Call this ONLY from server code — never a
 * client component — so provider keys stay server-side.
 */

import { ProviderRegistry } from './registry'
import { GooglePlacesProvider } from './google/GooglePlacesProvider'
import { OverpassProvider } from './osm/OverpassProvider'
import { MapboxProvider } from './mapbox/MapboxProvider'

export { ProviderRegistry } from './registry'
export { GooglePlacesProvider } from './google/GooglePlacesProvider'
export { OverpassProvider } from './osm/OverpassProvider'
export { MapboxProvider } from './mapbox/MapboxProvider'

let cached: ProviderRegistry | null = null

export function buildDefaultRegistry(): ProviderRegistry {
  if (cached) return cached
  cached = new ProviderRegistry([
    new GooglePlacesProvider(),
    new OverpassProvider(),
    new MapboxProvider(),
  ])
  return cached
}
