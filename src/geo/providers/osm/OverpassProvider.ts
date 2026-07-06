/**
 * OpenStreetMap / Overpass provider.
 *
 * Key-free, global coverage, generous quotas — the engine's reliable baseline
 * and default fallback. Generalizes the single-purpose logic in
 * `src/lib/poi-service.ts` into the provider contract, driven entirely by the
 * parameterized category catalog (no hardcoded tag list).
 */

import type {
  GeoCategoryConfig,
  GeoCategoryKey,
  GeoPOI,
  GeoProvider,
  GeoQuery,
  ProviderHealth,
} from '../../types'
import { haversine } from '../../utils/distance'

const DEFAULT_ENDPOINT = 'https://overpass-api.de/api/interpreter'

interface OverpassElement {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

export class OverpassProvider implements GeoProvider {
  readonly id = 'osm' as const
  private endpoint: string
  private timeoutMs: number

  constructor(opts?: { endpoint?: string; timeoutMs?: number }) {
    this.endpoint =
      opts?.endpoint || process.env.OVERPASS_API_URL || DEFAULT_ENDPOINT
    this.timeoutMs = opts?.timeoutMs ?? 25_000
  }

  isAvailable(): boolean {
    return true // no key required
  }

  health(): ProviderHealth {
    return { provider: this.id, available: true }
  }

  private buildQuery(query: GeoQuery, categories: GeoCategoryConfig[]): string {
    const { lat, lng } = query.center
    const lines: string[] = []
    for (const cat of categories) {
      const radius = Math.min(cat.radius, query.radius || cat.radius)
      for (const tag of cat.osmTags) {
        lines.push(`node[${tag}](around:${radius},${lat},${lng});`)
        lines.push(`way[${tag}](around:${radius},${lat},${lng});`)
      }
    }
    return `[out:json][timeout:${Math.floor(this.timeoutMs / 1000)}];(\n${lines.join('\n')}\n);out center tags;`
  }

  /** Match an element's tags against the catalog to find its category. */
  private classify(
    tags: Record<string, string>,
    categories: GeoCategoryConfig[],
  ): GeoCategoryKey | null {
    for (const cat of categories) {
      for (const tag of cat.osmTags) {
        const m = tag.match(/"([^"]+)"="([^"]+)"/)
        if (m && tags[m[1]] === m[2]) return cat.key
      }
    }
    return null
  }

  async fetchPOIs(
    query: GeoQuery,
    categories: GeoCategoryConfig[],
  ): Promise<GeoPOI[]> {
    const body = `data=${encodeURIComponent(this.buildQuery(query, categories))}`
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), this.timeoutMs)
    let res: Response
    try {
      res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: controller.signal,
      })
    } finally {
      clearTimeout(t)
    }
    if (!res.ok) throw new Error(`Overpass ${res.status}`)
    const data = (await res.json()) as { elements?: OverpassElement[] }

    const pois: GeoPOI[] = []
    const seen = new Set<string>()
    for (const el of data.elements ?? []) {
      const lat = el.lat ?? el.center?.lat
      const lng = el.lon ?? el.center?.lon
      if (lat == null || lng == null) continue
      const tags = el.tags ?? {}
      const category = this.classify(tags, categories)
      if (!category) continue

      const id = `osm:${el.type}/${el.id}`
      if (seen.has(id)) continue
      seen.add(id)

      pois.push({
        id,
        name: tags.name || tags['name:pt'] || tags.brand || '',
        category,
        location: { lat, lng },
        distance: Math.round(haversine(query.center, { lat, lng })),
        source: 'osm',
        phone: tags.phone || tags['contact:phone'],
        website: tags.website || tags['contact:website'],
        openingHours: tags.opening_hours,
        address: [tags['addr:street'], tags['addr:housenumber']]
          .filter(Boolean)
          .join(', ') || undefined,
      })
    }
    return pois
  }
}
