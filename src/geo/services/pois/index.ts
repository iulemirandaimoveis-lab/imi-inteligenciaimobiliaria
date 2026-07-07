/**
 * IMI Geo Intelligence Engine — POI Service (orchestrator)
 * ------------------------------------------------------------------
 * The single entry point that turns "a point + a profile" into unified
 * `GeoIntelligence`. Responsibilities:
 *   1. Resolve the category catalog for the requested profile.
 *   2. Ask the provider registry (with fallback) for raw POIs.
 *   3. Enrich: dedupe, attach travel times, sort by distance.
 *   4. Roll up per-category insights + a weighted 0–100 convenience score.
 *   5. Cache the result (keyed by rounded coords + profile).
 *
 * Provider-agnostic and development-agnostic: callers pass coordinates and a
 * profile string, never a vendor or an empreendimento id.
 */

import type {
  CategoryInsight,
  GeoCategoryConfig,
  GeoIntelligence,
  GeoPOI,
  GeoPoint,
  ScoreLabel,
} from '../../types'
import { GEO_CATEGORIES, resolveCategories, GEO_PROFILES } from '../../config/categories'
import { buildDefaultRegistry, ProviderRegistry } from '../../providers'
import { estimateTravelTimes } from '../../utils/travel-time'
import { geoCache, cacheKey, type GeoCache } from '../../cache'

const DEFAULT_TTL_MS = hoursToMs(
  Number(process.env.GEO_CACHE_TTL_HOURS) || 24 * 7,
)
const DEFAULT_PER_CATEGORY = 5

function hoursToMs(h: number): number {
  return h * 60 * 60 * 1000
}

export interface GeoIntelligenceOptions {
  center: GeoPoint
  radius?: number
  profile?: keyof typeof GEO_PROFILES | undefined
  categories?: GeoCategoryConfig[]
  perCategoryLimit?: number
  registry?: ProviderRegistry
  cache?: GeoCache
  /** Skip cache read/write (useful for admin "refresh"). */
  bypassCache?: boolean
}

function scoreLabel(score: number): ScoreLabel {
  if (score >= 85) return 'Excelente'
  if (score >= 70) return 'Ótimo'
  if (score >= 55) return 'Bom'
  if (score >= 40) return 'Regular'
  return 'Limitado'
}

/** 0–100 sub-score blending proximity (60%) and quantity (40%). */
function categoryScore(items: GeoPOI[], radius: number): number {
  if (items.length === 0) return 0
  const qty = Math.min(100, 20 + items.length * 16)
  const nearest = Math.min(...items.map((p) => p.distance))
  const prox = Math.max(0, 100 - (nearest / radius) * 100)
  return Math.round(qty * 0.4 + prox * 0.6)
}

function dedupe(pois: GeoPOI[]): GeoPOI[] {
  const seen = new Set<string>()
  const out: GeoPOI[] = []
  for (const p of pois) {
    if (seen.has(p.id)) continue
    seen.add(p.id)
    out.push(p)
  }
  return out
}

export async function getGeoIntelligence(
  opts: GeoIntelligenceOptions,
): Promise<GeoIntelligence> {
  const profile = (opts.profile ?? 'residencial') as string
  const categories = opts.categories ?? resolveCategories(profile)
  const registry = opts.registry ?? buildDefaultRegistry()
  const cache = opts.cache ?? geoCache
  const perCategoryLimit = opts.perCategoryLimit ?? DEFAULT_PER_CATEGORY
  const maxRadius = opts.radius ?? Math.max(...categories.map((c) => c.radius))
  const key = cacheKey(opts.center.lat, opts.center.lng, maxRadius, profile)

  if (!opts.bypassCache) {
    const hit = await cache.get<GeoIntelligence>(key)
    if (hit) return { ...hit, cached: true }
  }

  const { result, consulted } = await registry.fetchWithFallback(
    {
      center: opts.center,
      radius: maxRadius,
      categories: categories.map((c) => c.key),
      perCategoryLimit,
    },
    categories,
  )

  const rawPois = result ? dedupe(result.pois) : []
  // Attach travel times + icons, keep only requested categories.
  const enriched: GeoPOI[] = rawPois.map((p) => ({
    ...p,
    icon: GEO_CATEGORIES[p.category]?.icon,
    travelTimes: estimateTravelTimes(p.distance),
  }))

  const insights: CategoryInsight[] = categories.map((cat) => {
    const items = enriched
      .filter((p) => p.category === cat.key)
      .sort((a, b) => a.distance - b.distance)
    const kept = items.slice(0, perCategoryLimit)
    const nearest = items.length ? items[0].distance : null
    return {
      category: cat.key,
      label: cat.label,
      icon: cat.icon,
      color: cat.color,
      count: items.length,
      nearest,
      nearestTravelTimes: nearest != null ? estimateTravelTimes(nearest) : undefined,
      score: categoryScore(items, cat.radius),
      items: kept,
    }
  })

  // Weighted overall score (weights renormalized over the active profile).
  const totalWeight = categories.reduce((s, c) => s + c.weight, 0) || 1
  const overall = Math.round(
    insights.reduce((sum, ins) => {
      const w = GEO_CATEGORIES[ins.category]?.weight ?? 0
      return sum + ins.score * (w / totalWeight)
    }, 0),
  )

  const intelligence: GeoIntelligence = {
    center: opts.center,
    radius: maxRadius,
    pois: enriched.slice().sort((a, b) => a.distance - b.distance),
    categories: insights,
    score: overall,
    scoreLabel: scoreLabel(overall),
    providers: consulted.map((p) => p.id),
    fetchedAt: new Date().toISOString(),
    cached: false,
  }

  if (!opts.bypassCache && enriched.length > 0) {
    await cache.set(key, intelligence, DEFAULT_TTL_MS)
  }
  return intelligence
}
