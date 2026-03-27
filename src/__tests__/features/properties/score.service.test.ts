/**
 * @jest-environment node
 */

/**
 * Tests for IMI Score service
 * Verifies: calcPricePerSqm, calcYieldEst, calcMarketDelta, calcIMIScore,
 *           getScoreColor, getScoreLabel, enrichProperty
 */

import {
  calcPricePerSqm,
  calcYieldEst,
  calcMarketDelta,
  calcIMIScore,
  getScoreColor,
  getScoreLabel,
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
