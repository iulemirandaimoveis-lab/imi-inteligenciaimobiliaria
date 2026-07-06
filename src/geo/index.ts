/**
 * IMI Geo Intelligence Engine — Public API
 * ------------------------------------------------------------------
 * Import surface for the rest of the app. Server code uses the services and
 * providers; client code uses the types and the `usePOIs` hook (which talks to
 * the `/api/geo/*` routes, so no keys reach the browser).
 *
 * See docs/GEO_INTELLIGENCE_ENGINE.md for architecture & roadmap.
 */

// Types (safe everywhere)
export type * from './types'

// Config catalog
export {
  GEO_CATEGORIES,
  GEO_PROFILES,
  ALL_CATEGORY_KEYS,
  resolveCategories,
} from './config/categories'

// Utils
export { haversine, boundingBox, offsetPoint } from './utils/distance'
export {
  estimateTravelTime,
  estimateTravelTimes,
  formatDuration,
  ALL_TRAVEL_MODES,
} from './utils/travel-time'

// Services (server-side)
export { getGeoIntelligence } from './services/pois'
export type { GeoIntelligenceOptions } from './services/pois'
export { geocode } from './services/geocoding'
export { computeIsochrones } from './services/isochrones'

// Providers (server-side)
export {
  buildDefaultRegistry,
  ProviderRegistry,
  OverpassProvider,
  GooglePlacesProvider,
  MapboxProvider,
} from './providers'

// Cache & observability
export { geoCache, MemoryGeoCache, cacheKey } from './cache'
export type { GeoCache } from './cache'
export { getMetrics, getProviderStats, record, timed } from './observability'
