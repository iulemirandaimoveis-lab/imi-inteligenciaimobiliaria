/**
 * IMI Geo Intelligence Engine — Canonical Types
 * ------------------------------------------------------------------
 * Single source of truth for the geospatial intelligence layer.
 *
 * Design goals (see docs/GEO_INTELLIGENCE_ENGINE.md):
 *  - Provider-agnostic: the same `GeoPOI` shape is produced whether the
 *    data came from Google Places, OpenStreetMap/Overpass, Mapbox or the
 *    IMI-owned database.
 *  - Parameterized: nothing here is specific to a single development.
 *    Every consumer passes a `GeoQuery` (center + radius + categories).
 *  - Superset: fields the prompt requires (phone, website, opening hours,
 *    rating, review count, travel times per mode) are first-class and
 *    optional — providers fill what they can, the engine never assumes.
 */

// ─── Geometry ───────────────────────────────────────────────

export interface GeoPoint {
  lat: number
  lng: number
}

/** Axis-aligned bounding box: [south, west, north, east]. */
export type BoundingBox = [number, number, number, number]

// ─── Categories & Layers ────────────────────────────────────

/**
 * Canonical category keys. This is the vocabulary the whole engine speaks;
 * every provider maps its native taxonomy onto these. Keep in sync with
 * `src/geo/config/categories.ts` (the runtime catalog).
 */
export type GeoCategoryKey =
  | 'school'
  | 'university'
  | 'hospital'
  | 'pharmacy'
  | 'supermarket'
  | 'gym'
  | 'restaurant'
  | 'bakery'
  | 'gas_station'
  | 'shopping_mall'
  | 'bank'
  | 'transit'
  | 'park'
  | 'leisure'
  | 'beach'
  | 'notary'
  | 'hotel'
  | 'real_estate'
  | 'construction'
  | 'company'

/** Descriptor for a category — parameterized, provider-independent. */
export interface GeoCategoryConfig {
  key: GeoCategoryKey
  /** Human label (pt-BR). */
  label: string
  /** Emoji / glyph used by lightweight SVG layers. */
  icon: string
  /** Hex color for the map layer + chips. */
  color: string
  /** Default search radius in meters. */
  radius: number
  /** Weight (0–1 relative) used by the convenience score. */
  weight: number
  /** OpenStreetMap tag selectors, e.g. `["amenity"="school"]`. */
  osmTags: string[]
  /** Google Places `type` values that map to this category. */
  googleTypes: string[]
}

// ─── Travel time ────────────────────────────────────────────

export type TravelMode = 'walking' | 'cycling' | 'driving' | 'transit'

/** Estimated travel time to a point, in seconds, per mode. */
export type TravelTimes = Partial<Record<TravelMode, number>>

// ─── Points of Interest ─────────────────────────────────────

export type GeoProviderId = 'google' | 'osm' | 'mapbox' | 'imi'

/**
 * Canonical POI. Every field beyond the required core is optional and
 * populated on a best-effort basis by whichever provider served it.
 */
export interface GeoPOI {
  /** Stable id, namespaced by provider (e.g. `osm:node/123`). */
  id: string
  name: string
  category: GeoCategoryKey
  location: GeoPoint
  /** Straight-line distance from the query center, meters. */
  distance: number
  /** Estimated travel times from the query center. */
  travelTimes?: TravelTimes
  /** Provider that produced this record. */
  source: GeoProviderId

  // Enrichment (best-effort)
  phone?: string
  website?: string
  address?: string
  /** Opening hours in raw provider format (OSM `opening_hours` or Google). */
  openingHours?: string
  /** Whether the place is open at query time, when the provider knows. */
  openNow?: boolean
  /** Rating 0–5. */
  rating?: number
  /** Number of ratings/reviews. */
  reviewCount?: number
  icon?: string
}

/** Per-category rollup used for scoring and the side panel. */
export interface CategoryInsight {
  category: GeoCategoryKey
  label: string
  icon: string
  color: string
  count: number
  /** Distance to the nearest POI in this category, meters. */
  nearest: number | null
  /** Travel times to the nearest POI. */
  nearestTravelTimes?: TravelTimes
  /** 0–100 sub-score for this category. */
  score: number
  /** Up to N closest POIs, sorted by distance. */
  items: GeoPOI[]
}

export type ScoreLabel = 'Excelente' | 'Ótimo' | 'Bom' | 'Regular' | 'Limitado'

/**
 * The unified result of a geo-intelligence lookup. This is what the
 * `/api/geo/pois` route returns and what `usePOIs` consumes.
 */
export interface GeoIntelligence {
  center: GeoPoint
  radius: number
  pois: GeoPOI[]
  categories: CategoryInsight[]
  /** Weighted 0–100 convenience score. */
  score: number
  scoreLabel: ScoreLabel
  /** Which providers contributed, in the order they were consulted. */
  providers: GeoProviderId[]
  fetchedAt: string
  /** True when served from cache. */
  cached: boolean
}

// ─── Provider contract ──────────────────────────────────────

export interface GeoQuery {
  center: GeoPoint
  radius: number
  /** Categories to fetch; omit to fetch the full catalog. */
  categories?: GeoCategoryKey[]
  /** Max POIs to keep per category after ranking. */
  perCategoryLimit?: number
}

export interface ProviderFetchResult {
  provider: GeoProviderId
  pois: GeoPOI[]
  /** Wall-clock milliseconds the provider took. */
  elapsedMs: number
}

export interface ProviderHealth {
  provider: GeoProviderId
  available: boolean
  reason?: string
}

/**
 * Abstraction every data source implements. Adding Mapbox / a scraper / a
 * new database only requires a new class — no consumer changes.
 */
export interface GeoProvider {
  readonly id: GeoProviderId
  /** Cheap check: is this provider configured & usable right now? */
  isAvailable(): boolean
  /** Fetch POIs for a query. Must resolve (never throw) — errors → []. */
  fetchPOIs(query: GeoQuery, categories: GeoCategoryConfig[]): Promise<GeoPOI[]>
  health(): ProviderHealth
}

// ─── Isochrones ─────────────────────────────────────────────

export interface Isochrone {
  mode: TravelMode
  /** Minutes of travel this ring represents. */
  minutes: number
  /** GeoJSON Polygon ring. */
  polygon: GeoJSONPolygon
}

export interface IsochroneSet {
  center: GeoPoint
  mode: TravelMode
  rings: Isochrone[]
  /** `radial` = speed×time circle approximation; `routed` = provider isolines. */
  method: 'radial' | 'routed'
}

export interface GeoJSONPolygon {
  type: 'Polygon'
  coordinates: number[][][]
}

// ─── Observability ──────────────────────────────────────────

export interface GeoMetricSample {
  provider: GeoProviderId
  operation: 'fetchPOIs' | 'geocode' | 'isochrone'
  elapsedMs: number
  ok: boolean
  count?: number
  at: string
  error?: string
}
