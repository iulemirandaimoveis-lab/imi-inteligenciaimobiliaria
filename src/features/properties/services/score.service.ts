import type { IMIProperty } from '../types'
import { NEIGHBORHOOD_YIELD, NEIGHBORHOOD_AVG_SQM } from '../types'

/**
 * IMI Score Algorithm v1.0
 *
 * Composite score 0–100 combining:
 *   25% — Yield potential (estimated rental income)
 *   20% — Price vs market (discount/premium)
 *   20% — Liquidity index (neighborhood demand proxy)
 *   20% — Appreciation trend (12m proxy)
 *   15% — Location quality (infrastructure proxy)
 */

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
  const base = NEIGHBORHOOD_YIELD[property.neighborhood ?? ''] ?? 5.5
  const typeBonus: Record<string, number> = {
    apartamento: 0, studio: 1.2, flat: 1.5, comercial: 0.8,
    casa: -0.3, cobertura: -0.5, terreno: -2,
  }
  const type = (property.type ?? 'apartamento').toLowerCase()
  const bonus = typeBonus[type] ?? 0
  // Price-based adjustment: lower price = higher yield potential
  const priceAdjust = property.price && property.price < 500_000 ? 0.4
    : property.price && property.price < 800_000 ? 0.1
    : property.price && property.price > 2_000_000 ? -0.5 : 0
  return parseFloat((base + bonus + priceAdjust).toFixed(2))
}

export function calcMarketDelta(property: IMIProperty): number {
  const sqm = calcPricePerSqm(property.price, property.area)
  if (!sqm) return 0
  const avgSqm = NEIGHBORHOOD_AVG_SQM[property.neighborhood ?? '']
  if (!avgSqm) return 0
  return parseFloat((((avgSqm - sqm) / avgSqm) * 100).toFixed(1))
}

export function calcIMIScore(property: IMIProperty): number {
  const yieldEst = calcYieldEst(property)
  const marketDelta = calcMarketDelta(property)
  const neighborhood = property.neighborhood ?? ''

  // Component 1: Yield score (3–12% range)
  const yieldScore = normalize(yieldEst, 3, 12) * 0.25

  // Component 2: Price vs market (-10% = bad, +20% discount = great)
  const discountScore = normalize(marketDelta, -10, 20) * 0.20

  // Component 3: Liquidity proxy (based on neighborhood data availability)
  const hasNeighData = !!NEIGHBORHOOD_YIELD[neighborhood]
  const liquidityBase = hasNeighData ? 65 : 40
  const popularNeighborhoods = ['Boa Viagem', 'Miramar', 'Casa Forte', 'Pina', 'Parnamirim']
  const liquidityBonus = popularNeighborhoods.includes(neighborhood) ? 20 : 0
  const liquidityScore = clamp(liquidityBase + liquidityBonus) * 0.20

  // Component 4: Appreciation trend proxy (condition-based)
  const conditionTrend: Record<string, number> = {
    lancamento: 80, em_construcao: 70, pronto: 55, seminovo: 45, usado: 35,
  }
  const condition = property.condition ?? property.status ?? 'pronto'
  const trendScore = (conditionTrend[condition] ?? 50) * 0.20

  // Component 5: Location quality (city + completeness)
  const isMajorCity = ['Recife', 'São Paulo', 'Rio de Janeiro', 'Fortaleza', 'Salvador'].includes(property.city ?? '')
  const hasFullAddress = !!(property.address && property.neighborhood && property.city)
  const locationScore = (isMajorCity ? 70 : 50) + (hasFullAddress ? 15 : 0) + (hasNeighData ? 15 : 0)
  const locationComponent = clamp(locationScore) * 0.15

  const total = yieldScore + discountScore + liquidityScore + trendScore + locationComponent
  return Math.round(clamp(total))
}

export function calcLiquidityIndex(property: IMIProperty): number {
  const neighborhood = property.neighborhood ?? ''
  const popularNeighborhoods = ['Boa Viagem', 'Miramar', 'Pina', 'Casa Forte', 'Parnamirim']
  const goodNeighborhoods = ['Graças', 'Espinheiro', 'Aflitos', 'Tamarineira', 'Derby', 'Boa Vista']
  if (popularNeighborhoods.includes(neighborhood)) return 82 + Math.floor(Math.random() * 10)
  if (goodNeighborhoods.includes(neighborhood)) return 60 + Math.floor(Math.random() * 15)
  return 40 + Math.floor(Math.random() * 20)
}

export function getScoreColor(score: number): string {
  if (score >= 90) return '#C8A44A'   // gold — Premium
  if (score >= 75) return '#5DB887'   // green — Ótimo
  if (score >= 60) return '#5B9BD5'   // blue — Bom
  if (score >= 40) return '#D4913A'   // amber — Moderado
  return '#E06B6B'                    // red — Atenção
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Premium'
  if (score >= 75) return 'Ótimo'
  if (score >= 60) return 'Bom'
  if (score >= 40) return 'Moderado'
  return 'Atenção'
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
