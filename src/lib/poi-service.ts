/**
 * POI (Points of Interest) Service — Overpass API (OpenStreetMap)
 * Fetches nearby amenities and scores location quality.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// ─── Types ──────────────────────────────────────────────────

export interface POI {
  id: number
  type: string
  category: string
  name: string
  lat: number
  lng: number
  distance: number // meters
}

export interface CategoryScore {
  category: string
  score: number // 0–100
  count: number
  nearest: number | null // meters to nearest POI
}

export interface POIResult {
  pois: POI[]
  scores: CategoryScore[]
  overall_score: number
  fetched_at: string
}

// ─── POI Categories ─────────────────────────────────────────

const POI_QUERIES: Record<string, { category: string; tags: string }[]> = {
  health: [
    { category: 'health', tags: '"amenity"="hospital"' },
    { category: 'health', tags: '"amenity"="pharmacy"' },
  ],
  education: [
    { category: 'education', tags: '"amenity"="school"' },
    { category: 'education', tags: '"amenity"="university"' },
  ],
  transport: [
    { category: 'transport', tags: '"amenity"="bus_station"' },
    { category: 'transport', tags: '"railway"="station"' },
  ],
  shopping: [
    { category: 'shopping', tags: '"shop"="supermarket"' },
    { category: 'shopping', tags: '"shop"="mall"' },
  ],
  food: [
    { category: 'food', tags: '"amenity"="restaurant"' },
    { category: 'food', tags: '"amenity"="cafe"' },
  ],
  leisure: [
    { category: 'leisure', tags: '"leisure"="park"' },
    { category: 'leisure', tags: '"amenity"="cinema"' },
  ],
  safety: [
    { category: 'safety', tags: '"amenity"="police"' },
    { category: 'safety', tags: '"amenity"="fire_station"' },
  ],
}

const CATEGORY_WEIGHTS: Record<string, number> = {
  health: 0.15,
  education: 0.15,
  transport: 0.20,
  shopping: 0.15,
  food: 0.10,
  leisure: 0.10,
  safety: 0.15,
}

// ─── Haversine Distance ─────────────────────────────────────

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth radius in meters
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Overpass Query Builder ─────────────────────────────────

function buildOverpassQuery(lat: number, lng: number, radius: number): string {
  const allTags = Object.values(POI_QUERIES).flat()
  const nodeQueries = allTags
    .map((q) => `node[${q.tags}](around:${radius},${lat},${lng});`)
    .join('\n')
  const wayQueries = allTags
    .map((q) => `way[${q.tags}](around:${radius},${lat},${lng});`)
    .join('\n')

  return `[out:json][timeout:25];(
${nodeQueries}
${wayQueries}
);out center;`
}

// ─── Category Scoring ───────────────────────────────────────

function scoreCategory(pois: POI[], radius: number): number {
  if (pois.length === 0) return 0
  // Quantity score: 1 POI = 30, 2 = 55, 3 = 70, 5+ = 85, 10+ = 100
  const qtyScore = Math.min(100, 20 + pois.length * 16)
  // Proximity score: nearest POI closer = better
  const nearest = Math.min(...pois.map((p) => p.distance))
  const proxScore = Math.max(0, 100 - (nearest / radius) * 100)
  // Blend: 40% quantity, 60% proximity
  return Math.round(qtyScore * 0.4 + proxScore * 0.6)
}

// ─── Main Fetch ─────────────────────────────────────────────

export async function fetchNearbyPOIs(
  lat: number,
  lng: number,
  radiusMeters = 1500
): Promise<POIResult> {
  const query = buildOverpassQuery(lat, lng, radiusMeters)
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  })

  if (!res.ok) {
    throw new Error(`Overpass API error: ${res.status}`)
  }

  const data = await res.json()
  const tagToCat = new Map<string, string>()
  for (const [, items] of Object.entries(POI_QUERIES)) {
    for (const item of items) {
      // Extract the value from tags like '"amenity"="hospital"'
      const match = item.tags.match(/"(\w+)"="(\w+)"/)
      if (match) tagToCat.set(`${match[1]}=${match[2]}`, item.category)
    }
  }

  const pois: POI[] = []
  for (const el of data.elements || []) {
    const elLat = el.lat ?? el.center?.lat
    const elLng = el.lon ?? el.center?.lon
    if (!elLat || !elLng) continue

    const dist = haversine(lat, lng, elLat, elLng)
    const tags = el.tags || {}
    let category = 'other'

    // Determine category from element tags
    for (const [tagKey, cat] of tagToCat) {
      const [k, v] = tagKey.split('=')
      if (tags[k] === v) {
        category = cat
        break
      }
    }

    if (category === 'other') continue

    pois.push({
      id: el.id,
      type: Object.entries(tags)
        .filter(([k]) => ['amenity', 'shop', 'leisure', 'railway'].includes(k))
        .map(([, v]) => v as string)[0] || 'unknown',
      category,
      name: tags.name || tags['name:pt'] || tags.brand || category,
      lat: elLat,
      lng: elLng,
      distance: Math.round(dist),
    })
  }

  // Deduplicate by id
  const seen = new Set<number>()
  const uniquePois = pois.filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })

  // Score per category
  const categories = Object.keys(POI_QUERIES)
  const scores: CategoryScore[] = categories.map((cat) => {
    const catPois = uniquePois.filter((p) => p.category === cat)
    return {
      category: cat,
      score: scoreCategory(catPois, radiusMeters),
      count: catPois.length,
      nearest: catPois.length > 0 ? Math.min(...catPois.map((p) => p.distance)) : null,
    }
  })

  // Weighted overall score
  const overall_score = Math.round(
    scores.reduce((sum, s) => sum + s.score * (CATEGORY_WEIGHTS[s.category] || 0), 0)
  )

  return {
    pois: uniquePois,
    scores,
    overall_score,
    fetched_at: new Date().toISOString(),
  }
}

// ─── Cached Fetch (Supabase) ────────────────────────────────

const TTL_DAYS = 30

export async function getOrFetchPOIs(
  supabase: SupabaseClient,
  propertyId: string,
  lat: number,
  lng: number
): Promise<POIResult> {
  // Check cache
  const { data: cached } = await supabase
    .from('property_pois')
    .select('pois, scores, overall_score, fetched_at')
    .eq('property_id', propertyId)
    .single()

  if (cached?.fetched_at) {
    const age = Date.now() - new Date(cached.fetched_at).getTime()
    if (age < TTL_DAYS * 24 * 60 * 60 * 1000) {
      return {
        pois: cached.pois,
        scores: cached.scores,
        overall_score: cached.overall_score,
        fetched_at: cached.fetched_at,
      }
    }
  }

  // Fetch fresh data
  const result = await fetchNearbyPOIs(lat, lng)

  // Upsert cache
  await supabase.from('property_pois').upsert(
    {
      property_id: propertyId,
      pois: result.pois,
      scores: result.scores,
      overall_score: result.overall_score,
      fetched_at: result.fetched_at,
    },
    { onConflict: 'property_id' }
  )

  return result
}
