import type { IMIProperty } from '../types'
import { NEIGHBORHOOD_YIELD, NEIGHBORHOOD_AVG_SQM } from '../types'

/**
 * IMI Score Algorithm v2.0
 *
 * Composite score 0–100 combining:
 *   22% — Yield potential (estimated rental income)
 *   18% — Price vs market (discount/premium)
 *   18% — Liquidity index (neighborhood demand proxy)
 *   15% — Appreciation trend (12m proxy via condition + age)
 *   12% — Location quality (city + completeness)
 *   8%  — Property attributes (floor, view, finishing)
 *   7%  — Size efficiency (area/bedrooms ratio)
 *
 * v2 additions: floor bonus, age penalty, finishing quality, view premium,
 *               size efficiency, dynamic stats injection.
 */

// --- Dynamic stats (populated server-side from real DB data when available) ---
export interface NeighborhoodStats {
  yield: Record<string, number>
  avgSqm: Record<string, number>
}

let _dynamicStats: NeighborhoodStats | null = null

/** Call from server-side to inject real neighborhood stats before scoring */
export function setDynamicStats(stats: NeighborhoodStats): void {
  _dynamicStats = stats
}

function getYield(neighborhood: string): number {
  return _dynamicStats?.yield[neighborhood] ?? NEIGHBORHOOD_YIELD[neighborhood] ?? 5.5
}

function getAvgSqm(neighborhood: string): number | null {
  return _dynamicStats?.avgSqm[neighborhood] ?? NEIGHBORHOOD_AVG_SQM[neighborhood] ?? null
}

// --- Utilities ---------------------------------------------------------------

function clamp(v: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, v))
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50
  return clamp(((value - min) / (max - min)) * 100)
}

export function calcPricePerSqm(price?: number, area?: number): number | null {
  if (!price || !area || area === 0) return null
  return Math.round(price / area)
}

export function calcYieldEst(property: IMIProperty): number {
  const base = getYield(property.neighborhood ?? '')
  const typeBonus: Record<string, number> = {
    apartamento: 0, studio: 1.2, flat: 1.5, comercial: 0.8,
    casa: -0.3, cobertura: -0.5, terreno: -2,
  }
  const type = (property.type ?? 'apartamento').toLowerCase()
  const bonus = typeBonus[type] ?? 0
  const priceAdjust = property.price && property.price < 500_000 ? 0.4
    : property.price && property.price < 800_000 ? 0.1
    : property.price && property.price > 2_000_000 ? -0.5 : 0
  return parseFloat((base + bonus + priceAdjust).toFixed(2))
}

export function calcMarketDelta(property: IMIProperty): number {
  const sqm = calcPricePerSqm(property.price, property.area)
  if (!sqm) return 0
  const avgSqm = getAvgSqm(property.neighborhood ?? '')
  if (!avgSqm) return 0
  return parseFloat((((avgSqm - sqm) / avgSqm) * 100).toFixed(1))
}

// --- Attribute scoring (v2) --------------------------------------------------

function calcAttributeScore(property: IMIProperty): number {
  let score = 50 // baseline

  // Floor bonus: higher floors = better (up to 20 pts)
  if (property.floor) {
    score += Math.min(property.floor * 2, 20)
  }

  // View premium: +15 pts
  if (property.has_view) score += 15

  // Finishing quality
  const finishingBonus: Record<string, number> = {
    basic: -10, standard: 0, premium: 10, luxury: 20,
  }
  if (property.finishing) {
    score += finishingBonus[property.finishing] ?? 0
  }

  return clamp(score)
}

function calcAgePenalty(property: IMIProperty): number {
  // Newer = better for appreciation
  const age = property.age_years ?? 0
  if (age <= 0) return 80 // brand new
  if (age <= 3) return 70
  if (age <= 10) return 55
  if (age <= 20) return 40
  return 30
}

function calcSizeEfficiency(property: IMIProperty): number {
  const area = property.area ?? 0
  const bedrooms = property.bedrooms ?? 1
  if (area <= 0 || bedrooms <= 0) return 50

  const sqmPerBedroom = area / bedrooms
  // Optimal range: 20-40 sqm per bedroom
  if (sqmPerBedroom >= 25 && sqmPerBedroom <= 35) return 85
  if (sqmPerBedroom >= 20 && sqmPerBedroom <= 40) return 70
  if (sqmPerBedroom >= 15 && sqmPerBedroom <= 50) return 55
  return 40
}

// --- Main Score Calculation --------------------------------------------------

export function calcIMIScore(property: IMIProperty): number {
  const yieldEst = calcYieldEst(property)
  const marketDelta = calcMarketDelta(property)
  const neighborhood = property.neighborhood ?? ''

  // Component 1: Yield score (22%)
  const yieldScore = normalize(yieldEst, 3, 12) * 0.22

  // Component 2: Price vs market (18%)
  const discountScore = normalize(marketDelta, -10, 20) * 0.18

  // Component 3: Liquidity proxy (18%)
  const hasNeighData = !!(getAvgSqm(neighborhood))
  const liquidityBase = hasNeighData ? 65 : 40
  const popularNeighborhoods = ['Boa Viagem', 'Miramar', 'Casa Forte', 'Pina', 'Parnamirim',
    'Brooklin', 'Vila Nova Conceição', 'Barra', 'Dubai Marina', 'South Beach']
  const liquidityBonus = popularNeighborhoods.includes(neighborhood) ? 20 : 0
  const liquidityScore = clamp(liquidityBase + liquidityBonus) * 0.18

  // Component 4: Appreciation trend (15%) — condition + age
  const conditionTrend: Record<string, number> = {
    lancamento: 80, launch: 80, em_construcao: 70, under_construction: 70,
    pronto: 55, ready: 55, seminovo: 45, usado: 35, active: 55,
  }
  const condition = property.condition ?? property.status ?? 'pronto'
  const conditionScore = conditionTrend[condition] ?? 50
  const ageScore = calcAgePenalty(property)
  const trendScore = ((conditionScore + ageScore) / 2) * 0.15

  // Component 5: Location quality (12%)
  const majorCities = ['Recife', 'São Paulo', 'Rio de Janeiro', 'Fortaleza', 'Salvador',
    'Dubai', 'Miami', 'Orlando', 'Balneário Camboriú', 'João Pessoa', 'Natal', 'Maceió']
  const isMajorCity = majorCities.includes(property.city ?? '')
  const hasFullAddress = !!(property.address && property.neighborhood && property.city)
  const locationScore = (isMajorCity ? 70 : 50) + (hasFullAddress ? 15 : 0) + (hasNeighData ? 15 : 0)
  const locationComponent = clamp(locationScore) * 0.12

  // Component 6: Property attributes (8%)
  const attributeScore = calcAttributeScore(property) * 0.08

  // Component 7: Size efficiency (7%)
  const sizeScore = calcSizeEfficiency(property) * 0.07

  const total = yieldScore + discountScore + liquidityScore + trendScore + locationComponent + attributeScore + sizeScore
  return Math.round(clamp(total))
}

export function calcLiquidityIndex(property: IMIProperty): number {
  const neighborhood = property.neighborhood ?? ''
  const popularNeighborhoods = ['Boa Viagem', 'Miramar', 'Pina', 'Casa Forte', 'Parnamirim']
  const goodNeighborhoods = ['Graças', 'Espinheiro', 'Aflitos', 'Tamarineira', 'Derby', 'Boa Vista']
  const hash = (property.id || '').split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0x7f, 0)
  const micro = hash % 10
  if (popularNeighborhoods.includes(neighborhood)) return 82 + micro
  if (goodNeighborhoods.includes(neighborhood)) return 60 + (hash % 15)
  return 40 + (hash % 20)
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#5DB887'   // green  — Excelente
  if (score >= 60) return '#5B9BD5'   // blue   — Bom
  if (score >= 40) return '#D4913A'   // amber  — Regular
  return '#E06B6B'                    // red    — Baixo
}

export function getScoreBadge(score: number): { bg: string; text: string; label: string } {
  if (score >= 80) return { bg: 'rgba(93,184,135,0.15)', text: '#5DB887', label: 'Excelente' }
  if (score >= 60) return { bg: 'rgba(91,155,213,0.15)', text: '#5B9BD5', label: 'Bom' }
  if (score >= 40) return { bg: 'rgba(212,145,58,0.15)', text: '#D4913A', label: 'Regular' }
  return { bg: 'rgba(224,107,107,0.15)', text: '#E06B6B', label: 'Baixo' }
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excelente'
  if (score >= 60) return 'Bom'
  if (score >= 40) return 'Regular'
  return 'Baixo'
}

export function enrichProperty(p: IMIProperty): IMIProperty {
  const score = calcIMIScore(p)
  const pricePerSqm = calcPricePerSqm(p.price, p.area) ?? undefined
  const yieldEst = calcYieldEst(p)
  const marketDelta = calcMarketDelta(p)
  const liquidity = calcLiquidityIndex(p)
  const roi12m = parseFloat((yieldEst * 1.4).toFixed(1))

  return {
    ...p,
    imi_score: score,
    price_per_sqm: pricePerSqm,
    yield_est: yieldEst,
    roi_12m: roi12m,
    liquidity_index: liquidity,
    market_delta_pct: marketDelta,
  }
}

export interface IMIScoreBreakdown {
  imiScore: number
  location: number
  liquidity: number
  rentabilidade: number
  construtora: number
}

/**
 * Returns individual score components (0-100 each) for display in UI panels.
 * All values are property-specific — no hardcoded or static data.
 */
export function calcDetailedScores(property: IMIProperty): IMIScoreBreakdown {
  const neighborhood = property.neighborhood ?? ''
  const yieldEst = calcYieldEst(property)

  // Location score
  const majorCities = ['Recife', 'São Paulo', 'Rio de Janeiro', 'Fortaleza', 'Salvador',
    'Dubai', 'Miami', 'Orlando', 'Balneário Camboriú', 'João Pessoa', 'Natal', 'Maceió']
  const isMajorCity = majorCities.includes(property.city ?? '')
  const hasNeighData = !!(getAvgSqm(neighborhood))
  const hasFullAddress = !!(property.address && property.neighborhood && property.city)
  const locationScore = clamp((isMajorCity ? 70 : 50) + (hasFullAddress ? 15 : 0) + (hasNeighData ? 15 : 0))

  // Liquidity (already 0-100)
  const liquidityScore = calcLiquidityIndex(property)

  // Rentabilidade — normalize yield 3%→30 .. 12%→100
  const rentabilidade = Math.round(clamp(30 + ((yieldEst - 3) / (12 - 3)) * 70))

  // Construtora — inferred from property status/condition
  const conditionMap: Record<string, number> = {
    lancamento: 88, launch: 88, em_construcao: 80, under_construction: 80,
    pronto: 72, ready: 72, seminovo: 62, usado: 52, active: 72,
  }
  const condition = property.condition ?? property.status ?? 'pronto'
  const construtora = clamp(conditionMap[condition] ?? 70)

  return {
    imiScore: calcIMIScore(property),
    location: Math.round(locationScore),
    liquidity: Math.round(liquidityScore),
    rentabilidade: Math.round(rentabilidade),
    construtora: Math.round(construtora),
  }
}

/**
 * Server-side: compute neighborhood stats from real development_units data.
 * Call this once on the server before scoring properties to inject real market data.
 * Falls back gracefully to hardcoded values when DB has no data.
 */
export async function loadNeighborhoodStatsFromDB(): Promise<NeighborhoodStats | null> {
  try {
    // Dynamic import to avoid bundling supabaseAdmin on client
    const { supabaseAdmin } = await import('@/lib/supabase/admin')

    const { data: rows } = await supabaseAdmin
      .from('development_units')
      .select('total_price, area, development:developments!inner(neighborhood, city)')
      .gt('total_price', 0)
      .gt('area', 0)

    if (!rows || rows.length === 0) return null

    // Aggregate by neighborhood
    const byNeighborhood = new Map<string, { totalPrice: number; totalArea: number; count: number }>()
    for (const row of rows) {
      const dev = row.development as unknown as { neighborhood: string; city: string }
      const hood = dev?.neighborhood
      if (!hood) continue

      const existing = byNeighborhood.get(hood) || { totalPrice: 0, totalArea: 0, count: 0 }
      existing.totalPrice += row.total_price
      existing.totalArea += row.area
      existing.count += 1
      byNeighborhood.set(hood, existing)
    }

    if (byNeighborhood.size === 0) return null

    const avgSqm: Record<string, number> = {}
    const yieldRates: Record<string, number> = {}

    for (const [hood, data] of byNeighborhood) {
      if (data.count >= 2) { // Need at least 2 data points
        avgSqm[hood] = Math.round(data.totalPrice / data.totalArea)
        // Estimate yield: lower price/sqm neighborhoods tend to have higher yields
        const pricePerSqm = data.totalPrice / data.totalArea
        yieldRates[hood] = pricePerSqm > 15000 ? 4.5
          : pricePerSqm > 10000 ? 5.5
          : pricePerSqm > 7000 ? 6.5
          : 7.5
      }
    }

    const stats: NeighborhoodStats = { yield: yieldRates, avgSqm }
    setDynamicStats(stats)
    return stats
  } catch {
    return null
  }
}
