/**
 * Google Places provider (server-side only).
 *
 * Highest-quality enrichment — rating, review count, phone, website, opening
 * hours, "open now". Gated behind `GOOGLE_PLACES_API_KEY` (server env). The key
 * is NEVER read on the client: this class is only instantiated inside the
 * `/api/geo/*` route handlers. When no key is present the provider reports
 * itself unavailable and the registry falls through to OSM.
 */

import type {
  GeoCategoryConfig,
  GeoPOI,
  GeoProvider,
  GeoQuery,
  ProviderHealth,
} from '../../types'
import { haversine } from '../../utils/distance'

const NEARBY_URL =
  'https://maps.googleapis.com/maps/api/place/nearbysearch/json'

interface GooglePlace {
  place_id: string
  name: string
  geometry: { location: { lat: number; lng: number } }
  rating?: number
  user_ratings_total?: number
  vicinity?: string
  opening_hours?: { open_now?: boolean }
  types?: string[]
}

export class GooglePlacesProvider implements GeoProvider {
  readonly id = 'google' as const
  private apiKey: string | undefined
  private perCategoryLimit: number

  constructor(opts?: { apiKey?: string; perCategoryLimit?: number }) {
    // Prefer a dedicated server key; fall back to the maps key if that's all
    // that's configured. Both are read from server env only.
    this.apiKey =
      opts?.apiKey ||
      process.env.GOOGLE_PLACES_API_KEY ||
      process.env.GOOGLE_MAPS_SERVER_KEY
    this.perCategoryLimit = opts?.perCategoryLimit ?? 5
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey)
  }

  health(): ProviderHealth {
    return this.apiKey
      ? { provider: this.id, available: true }
      : { provider: this.id, available: false, reason: 'GOOGLE_PLACES_API_KEY not set' }
  }

  private async fetchCategory(
    query: GeoQuery,
    cat: GeoCategoryConfig,
  ): Promise<GeoPOI[]> {
    const type = cat.googleTypes[0]
    if (!type) return []
    const radius = Math.min(cat.radius, query.radius || cat.radius)
    const params = new URLSearchParams({
      location: `${query.center.lat},${query.center.lng}`,
      radius: String(radius),
      type,
      language: 'pt-BR',
      key: this.apiKey as string,
    })
    const res = await fetch(`${NEARBY_URL}?${params.toString()}`, {
      // POI data is stable — let the edge cache it for a week.
      next: { revalidate: 604_800 },
    })
    if (!res.ok) throw new Error(`Google Places ${res.status}`)
    const data = (await res.json()) as {
      status: string
      results?: GooglePlace[]
    }
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places status ${data.status}`)
    }
    return (data.results ?? [])
      .slice(0, this.perCategoryLimit)
      .map((place) => {
        const loc = { lat: place.geometry.location.lat, lng: place.geometry.location.lng }
        return {
          id: `google:${place.place_id}`,
          name: place.name,
          category: cat.key,
          location: loc,
          distance: Math.round(haversine(query.center, loc)),
          source: 'google' as const,
          rating: place.rating,
          reviewCount: place.user_ratings_total,
          address: place.vicinity,
          openNow: place.opening_hours?.open_now,
        }
      })
  }

  async fetchPOIs(
    query: GeoQuery,
    categories: GeoCategoryConfig[],
  ): Promise<GeoPOI[]> {
    const settled = await Promise.allSettled(
      categories.map((cat) => this.fetchCategory(query, cat)),
    )
    const pois: GeoPOI[] = []
    for (const s of settled) {
      if (s.status === 'fulfilled') pois.push(...s.value)
    }
    return pois
  }
}
