/**
 * @jest-environment node
 */

/**
 * Tests for IMI Score service
 * Verifies: calcPricePerSqm, calcYieldEst, calcMarketDelta, calcIMIScore,
 *           setDynamicStats, getScoreColor, getScoreLabel, getScoreBadge,
 *           enrichProperty, calcLiquidityIndex,
 *           and indirectly: calcAttributeScore, calcAgePenalty, calcSizeEfficiency
 */

import {
  calcPricePerSqm,
  calcYieldEst,
  calcMarketDelta,
  calcIMIScore,
  setDynamicStats,
  getScoreColor,
  getScoreLabel,
  getScoreBadge,
  enrichProperty,
  calcLiquidityIndex,
} from '@/features/properties/services/score.service'
import type { IMIProperty } from '@/features/properties/types'

// Helper to build a minimal IMIProperty
function makeProperty(overrides: Partial<IMIProperty> = {}): IMIProperty {
  return {
    id: 'test-001',
    name: 'Test Property',
    type: 'apartamento',
    status: 'disponivel',
    ...overrides,
  }
}

/** Reset dynamic stats before each test to avoid leaking state */
beforeEach(() => {
  // Reset by injecting null-equivalent empty stats so fallback defaults kick in.
  // We re-inject real dynamic stats only in the setDynamicStats describe block.
  setDynamicStats({ yield: {}, avgSqm: {} })
})

describe('calcPricePerSqm', () => {
  it('calculates price per square meter correctly', () => {
    expect(calcPricePerSqm(500000, 50)).toBe(10000)
    expect(calcPricePerSqm(1200000, 120)).toBe(10000)
  })

  it('rounds to nearest integer', () => {
    expect(calcPricePerSqm(100000, 33)).toBe(3030)
  })

  it('returns null when price is missing', () => {
    expect(calcPricePerSqm(undefined, 50)).toBeNull()
    expect(calcPricePerSqm(0, 50)).toBeNull()
  })

  it('returns null when area is missing or zero', () => {
    expect(calcPricePerSqm(500000, undefined)).toBeNull()
    expect(calcPricePerSqm(500000, 0)).toBeNull()
  })
})

describe('calcYieldEst', () => {
  it('uses neighborhood base yield when available', () => {
    const p = makeProperty({ neighborhood: 'Boa Viagem', type: 'apartamento' })
    const yieldEst = calcYieldEst(p)
    // Boa Viagem base = 5.8, apartamento bonus = 0, no price adjust
    expect(yieldEst).toBe(5.8)
  })

  it('uses default base yield (5.5) for unknown neighborhoods', () => {
    const p = makeProperty({ neighborhood: 'Unknown Neighborhood', type: 'apartamento' })
    expect(calcYieldEst(p)).toBe(5.5)
  })

  it('applies type bonus for studios', () => {
    const p = makeProperty({ neighborhood: 'Boa Viagem', type: 'studio' })
    // 5.8 + 1.2 = 7.0
    expect(calcYieldEst(p)).toBe(7.0)
  })

  it('applies type bonus for flats', () => {
    const p = makeProperty({ neighborhood: 'Pina', type: 'flat' })
    // Pina = 6.2, flat = +1.5 => 7.7
    expect(calcYieldEst(p)).toBe(7.7)
  })

  it('applies negative bonus for terreno', () => {
    const p = makeProperty({ type: 'terreno' })
    // default 5.5 - 2 = 3.5
    expect(calcYieldEst(p)).toBe(3.5)
  })

  it('applies price adjustment for low-price properties', () => {
    const p = makeProperty({ type: 'apartamento', price: 400000 })
    // 5.5 + 0 + 0.4 = 5.9
    expect(calcYieldEst(p)).toBe(5.9)
  })

  it('applies negative price adjustment for expensive properties', () => {
    const p = makeProperty({ type: 'apartamento', price: 3000000 })
    // 5.5 + 0 - 0.5 = 5.0
    expect(calcYieldEst(p)).toBe(5.0)
  })

  it('handles missing type gracefully (defaults to apartamento)', () => {
    const p = makeProperty({ type: undefined as unknown as string })
    // Uses 'apartamento' fallback, base 5.5
    expect(calcYieldEst(p)).toBe(5.5)
  })
})

describe('calcMarketDelta', () => {
  it('returns positive delta when property is below market', () => {
    // Boa Viagem avg = 11200 R$/m2
    // Property = 500000 / 50 = 10000 R$/m2
    // Delta = (11200 - 10000) / 11200 * 100 = 10.7%
    const p = makeProperty({ price: 500000, area: 50, neighborhood: 'Boa Viagem' })
    expect(calcMarketDelta(p)).toBe(10.7)
  })

  it('returns negative delta when property is above market', () => {
    // Boa Viagem avg = 11200, property = 1400000 / 100 = 14000
    // Delta = (11200 - 14000) / 11200 * 100 = -25.0
    const p = makeProperty({ price: 1400000, area: 100, neighborhood: 'Boa Viagem' })
    expect(calcMarketDelta(p)).toBe(-25.0)
  })

  it('returns 0 when price or area is missing', () => {
    expect(calcMarketDelta(makeProperty({ price: undefined }))).toBe(0)
    expect(calcMarketDelta(makeProperty({ area: undefined }))).toBe(0)
  })

  it('returns 0 when neighborhood has no benchmark data', () => {
    const p = makeProperty({ price: 500000, area: 50, neighborhood: 'Nowhere' })
    expect(calcMarketDelta(p)).toBe(0)
  })
})

describe('calcIMIScore', () => {
  it('returns a score between 0 and 100', () => {
    const p = makeProperty({ price: 500000, area: 50, neighborhood: 'Boa Viagem', city: 'Recife' })
    const score = calcIMIScore(p)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('gives higher score to a well-located, well-priced property', () => {
    const good = makeProperty({
      price: 400000,
      area: 50,
      type: 'studio',
      neighborhood: 'Boa Viagem',
      city: 'Recife',
      address: 'Rua X, 100',
      condition: 'lancamento',
    })
    const bad = makeProperty({
      price: 5000000,
      area: 100,
      type: 'terreno',
      neighborhood: 'Unknown',
      city: 'Unknown City',
    })
    expect(calcIMIScore(good)).toBeGreaterThan(calcIMIScore(bad))
  })

  it('handles property with no optional data gracefully', () => {
    const minimal = makeProperty({})
    const score = calcIMIScore(minimal)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

describe('getScoreColor', () => {
  it('returns green for Excelente (>= 80)', () => {
    expect(getScoreColor(80)).toBe('#5DB887')
    expect(getScoreColor(100)).toBe('#5DB887')
  })

  it('returns blue for Bom (60-79)', () => {
    expect(getScoreColor(60)).toBe('#5B9BD5')
    expect(getScoreColor(79)).toBe('#5B9BD5')
  })

  it('returns amber for Regular (40-59)', () => {
    expect(getScoreColor(40)).toBe('#D4913A')
    expect(getScoreColor(59)).toBe('#D4913A')
  })

  it('returns red for Baixo (< 40)', () => {
    expect(getScoreColor(39)).toBe('#E06B6B')
    expect(getScoreColor(0)).toBe('#E06B6B')
  })
})

describe('getScoreLabel', () => {
  it('returns correct label for each tier', () => {
    expect(getScoreLabel(95)).toBe('Excelente')
    expect(getScoreLabel(80)).toBe('Excelente')
    expect(getScoreLabel(65)).toBe('Bom')
    expect(getScoreLabel(45)).toBe('Regular')
    expect(getScoreLabel(20)).toBe('Baixo')
  })

  it('returns correct labels at exact boundaries', () => {
    expect(getScoreLabel(80)).toBe('Excelente')
    expect(getScoreLabel(60)).toBe('Bom')
    expect(getScoreLabel(40)).toBe('Regular')
    expect(getScoreLabel(39)).toBe('Baixo')
  })
})

describe('calcLiquidityIndex', () => {
  it('returns value in expected range for popular neighborhoods', () => {
    const p = makeProperty({ neighborhood: 'Boa Viagem' })
    const index = calcLiquidityIndex(p)
    expect(index).toBeGreaterThanOrEqual(82)
    expect(index).toBeLessThanOrEqual(91)
  })

  it('returns value in expected range for good neighborhoods', () => {
    const p = makeProperty({ neighborhood: 'Graças' })
    const index = calcLiquidityIndex(p)
    expect(index).toBeGreaterThanOrEqual(60)
    expect(index).toBeLessThanOrEqual(74)
  })

  it('returns value in expected range for unknown neighborhoods', () => {
    const p = makeProperty({ neighborhood: 'Far Away' })
    const index = calcLiquidityIndex(p)
    expect(index).toBeGreaterThanOrEqual(40)
    expect(index).toBeLessThanOrEqual(59)
  })
})

describe('enrichProperty', () => {
  it('adds all computed fields to a property', () => {
    const p = makeProperty({
      price: 600000,
      area: 60,
      type: 'apartamento',
      neighborhood: 'Boa Viagem',
      city: 'Recife',
    })
    const enriched = enrichProperty(p)

    expect(enriched.imi_score).toBeDefined()
    expect(enriched.imi_score).toBeGreaterThanOrEqual(0)
    expect(enriched.imi_score).toBeLessThanOrEqual(100)

    expect(enriched.price_per_sqm).toBe(10000)

    expect(enriched.yield_est).toBeDefined()
    expect(typeof enriched.yield_est).toBe('number')

    expect(enriched.roi_12m).toBeDefined()
    expect(typeof enriched.roi_12m).toBe('number')

    expect(enriched.liquidity_index).toBeDefined()
    expect(enriched.liquidity_index).toBeGreaterThanOrEqual(0)

    expect(enriched.market_delta_pct).toBeDefined()
  })

  it('preserves all original property fields', () => {
    const p = makeProperty({ name: 'Keep Me', city: 'Recife' })
    const enriched = enrichProperty(p)

    expect(enriched.id).toBe('test-001')
    expect(enriched.name).toBe('Keep Me')
    expect(enriched.city).toBe('Recife')
    expect(enriched.status).toBe('disponivel')
  })

  it('sets price_per_sqm to undefined when price or area is missing', () => {
    const p = makeProperty({})
    const enriched = enrichProperty(p)
    expect(enriched.price_per_sqm).toBeUndefined()
  })

  it('roi_12m is roughly 1.4x yield_est', () => {
    const p = makeProperty({ neighborhood: 'Boa Viagem', type: 'studio' })
    const enriched = enrichProperty(p)
    const expected = parseFloat(((enriched.yield_est ?? 0) * 1.4).toFixed(1))
    expect(enriched.roi_12m).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// setDynamicStats / getYield / getAvgSqm (tested through public API)
// ---------------------------------------------------------------------------

describe('setDynamicStats', () => {
  it('overrides default neighborhood yield when dynamic stats are set', () => {
    // Boa Viagem default yield is 5.8 (from NEIGHBORHOOD_YIELD)
    const pBefore = makeProperty({ neighborhood: 'Boa Viagem', type: 'apartamento' })
    setDynamicStats({ yield: {}, avgSqm: {} })
    const yieldBefore = calcYieldEst(pBefore)

    // Now inject a higher yield
    setDynamicStats({ yield: { 'Boa Viagem': 9.0 }, avgSqm: {} })
    const yieldAfter = calcYieldEst(pBefore)

    expect(yieldAfter).toBeGreaterThan(yieldBefore)
    // 9.0 + 0 (apartamento) + 0 (no price adjust) = 9.0
    expect(yieldAfter).toBe(9.0)
  })

  it('overrides default avgSqm affecting market delta', () => {
    const p = makeProperty({ price: 500000, area: 50, neighborhood: 'Boa Viagem' })

    // With default: Boa Viagem avg = 11200, price/sqm = 10000 => delta ~10.7%
    setDynamicStats({ yield: {}, avgSqm: {} })
    const deltaBefore = calcMarketDelta(p)
    expect(deltaBefore).toBe(10.7)

    // Inject lower avgSqm => property now above market
    setDynamicStats({ yield: {}, avgSqm: { 'Boa Viagem': 8000 } })
    const deltaAfter = calcMarketDelta(p)
    expect(deltaAfter).toBeLessThan(0) // property is above market now
  })

  it('falls back to hardcoded defaults when dynamic stats are empty for a neighborhood', () => {
    setDynamicStats({ yield: { 'SomeOther': 10 }, avgSqm: { 'SomeOther': 20000 } })
    // Boa Viagem should still use hardcoded value since dynamic stats don't include it
    const p = makeProperty({ neighborhood: 'Boa Viagem', type: 'apartamento' })
    expect(calcYieldEst(p)).toBe(5.8) // hardcoded NEIGHBORHOOD_YIELD['Boa Viagem']
  })

  it('falls back to global default (5.5) when neither dynamic nor hardcoded stats exist', () => {
    setDynamicStats({ yield: {}, avgSqm: {} })
    const p = makeProperty({ neighborhood: 'NonExistentPlace', type: 'apartamento' })
    expect(calcYieldEst(p)).toBe(5.5)
  })
})

// ---------------------------------------------------------------------------
// calcIMIScore — expanded: attribute, age, size, edge cases
// ---------------------------------------------------------------------------

describe('calcIMIScore — attribute scoring (via calcAttributeScore)', () => {
  // Hold everything else constant and vary only the attribute under test
  const base = {
    price: 600000,
    area: 60,
    neighborhood: 'Boa Viagem',
    city: 'Recife',
    address: 'Rua X',
    type: 'apartamento' as const,
    condition: 'pronto' as const,
    bedrooms: 2,
  }

  it('premium finishing property scores higher than basic finishing', () => {
    const premium = makeProperty({ ...base, finishing: 'premium' })
    const basic = makeProperty({ ...base, finishing: 'basic' })
    expect(calcIMIScore(premium)).toBeGreaterThan(calcIMIScore(basic))
  })

  it('luxury finishing scores higher than premium', () => {
    const luxury = makeProperty({ ...base, finishing: 'luxury' })
    const premium = makeProperty({ ...base, finishing: 'premium' })
    expect(calcIMIScore(luxury)).toBeGreaterThanOrEqual(calcIMIScore(premium))
  })

  it('property with has_view=true scores higher than without', () => {
    const withView = makeProperty({ ...base, has_view: true })
    const noView = makeProperty({ ...base, has_view: false })
    expect(calcIMIScore(withView)).toBeGreaterThanOrEqual(calcIMIScore(noView))
  })

  it('higher floor property scores higher', () => {
    const highFloor = makeProperty({ ...base, floor: 15 })
    const lowFloor = makeProperty({ ...base, floor: 1 })
    expect(calcIMIScore(highFloor)).toBeGreaterThanOrEqual(calcIMIScore(lowFloor))
  })

  it('all attributes present gives maximum attribute bonus', () => {
    const full = makeProperty({ ...base, floor: 20, has_view: true, finishing: 'luxury' })
    const none = makeProperty({ ...base })
    expect(calcIMIScore(full)).toBeGreaterThan(calcIMIScore(none))
  })

  it('no optional attributes still returns a valid score (baseline 50 for attrs)', () => {
    const minimal = makeProperty({ ...base })
    const score = calcIMIScore(minimal)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

describe('calcIMIScore — age penalty (via calcAgePenalty)', () => {
  const base = {
    price: 600000,
    area: 60,
    neighborhood: 'Boa Viagem',
    city: 'Recife',
    address: 'Rua X',
    type: 'apartamento' as const,
    condition: 'pronto' as const,
    bedrooms: 2,
  }

  it('brand new (age_years=0) scores higher than old property (age_years=25)', () => {
    const brandNew = makeProperty({ ...base, age_years: 0 })
    const old = makeProperty({ ...base, age_years: 25 })
    expect(calcIMIScore(brandNew)).toBeGreaterThan(calcIMIScore(old))
  })

  it('age=3 scores higher than age=15', () => {
    const young = makeProperty({ ...base, age_years: 3 })
    const mid = makeProperty({ ...base, age_years: 15 })
    expect(calcIMIScore(young)).toBeGreaterThan(calcIMIScore(mid))
  })

  it('missing age_years defaults to brand-new behavior (age=0)', () => {
    const noAge = makeProperty({ ...base })
    const brandNew = makeProperty({ ...base, age_years: 0 })
    expect(calcIMIScore(noAge)).toBe(calcIMIScore(brandNew))
  })

  it('negative age_years is treated as brand new', () => {
    const negAge = makeProperty({ ...base, age_years: -5 })
    const brandNew = makeProperty({ ...base, age_years: 0 })
    expect(calcIMIScore(negAge)).toBe(calcIMIScore(brandNew))
  })
})

describe('calcIMIScore — size efficiency (via calcSizeEfficiency)', () => {
  const base = {
    price: 600000,
    neighborhood: 'Boa Viagem',
    city: 'Recife',
    address: 'Rua X',
    type: 'apartamento' as const,
    condition: 'pronto' as const,
  }

  it('optimal sqm/bedroom ratio (30 sqm/bed) scores higher than extreme ratio', () => {
    // Use same area but vary bedrooms so price/sqm and market delta stay constant
    const optimal = makeProperty({ ...base, area: 90, bedrooms: 3 }) // 30 sqm/bed => 85
    const extreme = makeProperty({ ...base, area: 90, bedrooms: 1 }) // 90 sqm/bed => 40
    expect(calcIMIScore(optimal)).toBeGreaterThan(calcIMIScore(extreme))
  })

  it('too-small ratio (10 sqm/bed) gets low efficiency score', () => {
    const cramped = makeProperty({ ...base, area: 20, bedrooms: 2 }) // 10 sqm/bed
    const optimal = makeProperty({ ...base, area: 60, bedrooms: 2 }) // 30 sqm/bed
    expect(calcIMIScore(optimal)).toBeGreaterThan(calcIMIScore(cramped))
  })

  it('area=0 falls back to default efficiency (50)', () => {
    const noArea = makeProperty({ ...base, area: 0, bedrooms: 2 })
    const score = calcIMIScore(noArea)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('bedrooms=0 falls back to default efficiency (50)', () => {
    const noBed = makeProperty({ ...base, area: 60, bedrooms: 0 })
    const score = calcIMIScore(noBed)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

describe('calcIMIScore — edge cases', () => {
  it('price=0, area=0 returns a valid score', () => {
    const p = makeProperty({ price: 0, area: 0 })
    const score = calcIMIScore(p)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('very high price does not exceed 100', () => {
    const p = makeProperty({ price: 999_999_999, area: 10, neighborhood: 'Boa Viagem', city: 'Recife' })
    expect(calcIMIScore(p)).toBeLessThanOrEqual(100)
  })

  it('missing all optional fields returns a valid low score', () => {
    const p = makeProperty({})
    const score = calcIMIScore(p)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('high yield property (studio, cheap, good neighborhood) scores higher', () => {
    const highYield = makeProperty({
      price: 300000,
      area: 30,
      type: 'studio',
      neighborhood: 'Pina',
      city: 'Recife',
      address: 'Rua Y',
      condition: 'lancamento',
      age_years: 0,
      floor: 10,
      has_view: true,
      finishing: 'luxury',
      bedrooms: 1,
    })
    const lowYield = makeProperty({
      price: 5000000,
      area: 300,
      type: 'terreno',
      neighborhood: 'Unknown',
      city: 'Unknown',
      age_years: 30,
    })
    expect(calcIMIScore(highYield)).toBeGreaterThan(calcIMIScore(lowYield))
    // The high yield property should be "Bom" or "Excelente"
    expect(calcIMIScore(highYield)).toBeGreaterThanOrEqual(60)
  })

  it('score is always an integer (Math.round applied)', () => {
    const p = makeProperty({ price: 777777, area: 77, neighborhood: 'Graças', city: 'Recife' })
    const score = calcIMIScore(p)
    expect(Number.isInteger(score)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getScoreBadge
// ---------------------------------------------------------------------------

describe('getScoreBadge', () => {
  it('returns Excelente badge for score >= 80', () => {
    const badge = getScoreBadge(85)
    expect(badge.label).toBe('Excelente')
    expect(badge.text).toBe('#5DB887')
    expect(badge.bg).toContain('93,184,135')
  })

  it('returns Bom badge for score 60-79', () => {
    const badge = getScoreBadge(65)
    expect(badge.label).toBe('Bom')
    expect(badge.text).toBe('#5B9BD5')
  })

  it('returns Regular badge for score 40-59', () => {
    const badge = getScoreBadge(45)
    expect(badge.label).toBe('Regular')
    expect(badge.text).toBe('#D4913A')
  })

  it('returns Baixo badge for score < 40', () => {
    const badge = getScoreBadge(20)
    expect(badge.label).toBe('Baixo')
    expect(badge.text).toBe('#E06B6B')
  })

  it('returns correct structure with bg, text, label keys', () => {
    const badge = getScoreBadge(50)
    expect(badge).toHaveProperty('bg')
    expect(badge).toHaveProperty('text')
    expect(badge).toHaveProperty('label')
  })
})
