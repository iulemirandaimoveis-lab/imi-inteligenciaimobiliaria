/**
 * IMI Geo Intelligence Engine — unit tests.
 * Covers the pure/deterministic core: distance, travel-time, isochrones,
 * category catalog integrity, provider-registry fallback, and the poiService
 * orchestration (with a fake provider, no network).
 */

import { haversine, boundingBox } from '@/geo/utils/distance'
import {
  estimateTravelTime,
  estimateTravelTimes,
  formatDuration,
} from '@/geo/utils/travel-time'
import { computeIsochrones } from '@/geo/services/isochrones'
import {
  GEO_CATEGORIES,
  ALL_CATEGORY_KEYS,
  resolveCategories,
  GEO_PROFILES,
} from '@/geo/config/categories'
import { ProviderRegistry } from '@/geo/providers/registry'
import { getGeoIntelligence } from '@/geo/services/pois'
import { MemoryGeoCache } from '@/geo/cache'
import type {
  GeoPOI,
  GeoProvider,
  GeoQuery,
  GeoCategoryConfig,
  ProviderHealth,
} from '@/geo/types'

const RECIFE = { lat: -8.05, lng: -34.9 }

describe('distance', () => {
  it('haversine is ~0 for the same point', () => {
    expect(haversine(RECIFE, RECIFE)).toBeCloseTo(0, 5)
  })

  it('haversine matches a known ~1.11km per 0.01° latitude', () => {
    const d = haversine(RECIFE, { lat: RECIFE.lat + 0.01, lng: RECIFE.lng })
    expect(d).toBeGreaterThan(1100)
    expect(d).toBeLessThan(1120)
  })

  it('boundingBox brackets the center', () => {
    const [s, w, n, e] = boundingBox(RECIFE, 1000)
    expect(s).toBeLessThan(RECIFE.lat)
    expect(n).toBeGreaterThan(RECIFE.lat)
    expect(w).toBeLessThan(RECIFE.lng)
    expect(e).toBeGreaterThan(RECIFE.lng)
  })
})

describe('travel-time', () => {
  it('walking is slower than driving for the same distance', () => {
    expect(estimateTravelTime(2000, 'walking')).toBeGreaterThan(
      estimateTravelTime(2000, 'driving'),
    )
  })

  it('returns all four modes', () => {
    const t = estimateTravelTimes(1500)
    expect(Object.keys(t).sort()).toEqual(
      ['cycling', 'driving', 'transit', 'walking'].sort(),
    )
  })

  it('formatDuration renders minutes and hours', () => {
    expect(formatDuration(300)).toBe('5 min')
    expect(formatDuration(3900)).toBe('1 h 5 min')
  })
})

describe('isochrones', () => {
  it('produces nested rings, larger minutes → larger radius', () => {
    const set = computeIsochrones(RECIFE, 'driving', [5, 10, 15])
    expect(set.method).toBe('radial')
    expect(set.rings).toHaveLength(3)
    const spans = set.rings.map((r) => {
      const lngs = r.polygon.coordinates[0].map((c) => c[0])
      return Math.max(...lngs) - Math.min(...lngs)
    })
    expect(spans[0]).toBeLessThan(spans[1])
    expect(spans[1]).toBeLessThan(spans[2])
  })
})

describe('category catalog', () => {
  it('every key resolves to a config whose key matches', () => {
    for (const k of ALL_CATEGORY_KEYS) {
      expect(GEO_CATEGORIES[k].key).toBe(k)
    }
  })

  it('every profile references only known categories', () => {
    for (const keys of Object.values(GEO_PROFILES)) {
      for (const k of keys) expect(GEO_CATEGORIES[k]).toBeDefined()
    }
  })

  it('resolveCategories falls back to residencial for unknown input', () => {
    const configs = resolveCategories('does-not-exist' as never)
    expect(configs.length).toBe(GEO_PROFILES.residencial.length)
  })
})

// ─── Fakes for orchestration tests ──────────────────────────

function makeProvider(
  id: GeoProvider['id'],
  pois: GeoPOI[],
  available = true,
): GeoProvider {
  return {
    id,
    isAvailable: () => available,
    health: (): ProviderHealth => ({ provider: id, available }),
    fetchPOIs: async (_q: GeoQuery, _c: GeoCategoryConfig[]) => pois,
  }
}

const school: GeoPOI = {
  id: 'osm:node/1',
  name: 'Escola Teste',
  category: 'school',
  location: { lat: RECIFE.lat + 0.005, lng: RECIFE.lng },
  distance: 550,
  source: 'osm',
}

describe('provider registry fallback', () => {
  it('skips unavailable providers and uses the first with results', async () => {
    const registry = new ProviderRegistry([
      makeProvider('google', [], false), // unavailable → skipped
      makeProvider('osm', [school]), // wins
      makeProvider('mapbox', []),
    ])
    const { result, consulted } = await registry.fetchWithFallback(
      { center: RECIFE, radius: 2000 },
      resolveCategories('residencial'),
    )
    expect(result?.provider).toBe('osm')
    expect(consulted.map((p) => p.id)).toEqual(['osm'])
  })

  it('falls through when a provider throws', async () => {
    const throwing: GeoProvider = {
      id: 'google',
      isAvailable: () => true,
      health: () => ({ provider: 'google', available: true }),
      fetchPOIs: async () => {
        throw new Error('boom')
      },
    }
    const registry = new ProviderRegistry([throwing, makeProvider('osm', [school])])
    const { result } = await registry.fetchWithFallback(
      { center: RECIFE, radius: 2000 },
      resolveCategories('residencial'),
    )
    expect(result?.provider).toBe('osm')
  })
})

describe('getGeoIntelligence orchestration', () => {
  it('scores, enriches with travel times, and caches', async () => {
    const registry = new ProviderRegistry([makeProvider('osm', [school])])
    const cache = new MemoryGeoCache()
    const res = await getGeoIntelligence({
      center: RECIFE,
      profile: 'residencial',
      registry,
      cache,
    })

    expect(res.providers).toEqual(['osm'])
    expect(res.pois[0].travelTimes?.walking).toBeGreaterThan(0)
    expect(res.pois[0].icon).toBe(GEO_CATEGORIES.school.icon)
    const schoolInsight = res.categories.find((c) => c.category === 'school')
    expect(schoolInsight?.count).toBe(1)
    expect(schoolInsight?.score).toBeGreaterThan(0)
    expect(res.score).toBeGreaterThan(0)
    expect(res.cached).toBe(false)

    // Second call hits cache.
    const cachedRes = await getGeoIntelligence({
      center: RECIFE,
      profile: 'residencial',
      registry,
      cache,
    })
    expect(cachedRes.cached).toBe(true)
  })

  it('returns an empty-but-valid result when no provider has data', async () => {
    const registry = new ProviderRegistry([makeProvider('osm', [])])
    const res = await getGeoIntelligence({
      center: RECIFE,
      profile: 'residencial',
      registry,
      cache: new MemoryGeoCache(),
    })
    expect(res.pois).toHaveLength(0)
    expect(res.score).toBe(0)
    expect(res.scoreLabel).toBe('Limitado')
  })
})
