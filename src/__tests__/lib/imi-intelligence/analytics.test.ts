import {
  brl,
  pct,
  brokerPerformanceIndex,
  buildFunnel,
  forecast,
  generateInsights,
  windowDelta,
  type BrokerStat,
  type DayPoint,
  type SalesDataset,
} from '@/lib/imi-intelligence/analytics'

const brokers: BrokerStat[] = [
  { name: 'João', sales: 4, proposals: 9, leads: 14, revenue: 9_600_000, avgResponseMin: 8, activities: 64 },
  { name: 'Anderson', sales: 1, proposals: 4, leads: 8, revenue: 2_200_000, avgResponseMin: 18, activities: 29 },
]

function series(values: number[]): DayPoint[] {
  return values.map((v, i) => ({ date: `2026-06-${String(i + 1).padStart(2, '0')}`, sales: v, revenue: v * 1_000_000, proposals: v + 1 }))
}

describe('imi-intelligence/analytics', () => {
  it('formats BRL in M / K', () => {
    expect(brl(2_400_000)).toBe('R$ 2,40M')
    expect(brl(642_000)).toBe('R$ 642K')
    expect(brl(500)).toBe('R$ 500')
  })

  it('formats signed percentages', () => {
    expect(pct(18)).toBe('+18.0%')
    expect(pct(-11)).toBe('-11.0%')
  })

  it('ranks brokers by a bounded BPI (0..100)', () => {
    const ranked = brokerPerformanceIndex(brokers)
    expect(ranked[0].name).toBe('João') // higher sales/revenue/activity, faster response
    ranked.forEach((b) => {
      expect(b.bpi).toBeGreaterThanOrEqual(0)
      expect(b.bpi).toBeLessThanOrEqual(100)
    })
    expect(ranked[0].conversion).toBeCloseTo((4 / 14) * 100, 1)
  })

  it('builds a funnel with monotonic step conversions', () => {
    const f = buildFunnel({ leads: 100, contacts: 60, visits: 40, proposals: 20, reservations: 10, sales: 5 })
    expect(f[0].label).toBe('Leads')
    expect(f[f.length - 1].label).toBe('Venda')
    expect(f[1].stepConversion).toBeCloseTo(60, 1) // 60/100
    expect(f[f.length - 1].ofTop).toBeCloseTo(5, 1) // 5/100
  })

  it('forecasts an increasing trend with a confidence in [0,1]', () => {
    const fc = forecast(series([1, 2, 3, 4, 5, 6]), 30, 'sales')
    expect(fc.slope).toBeGreaterThan(0)
    expect(fc.total).toBeGreaterThan(0)
    expect(fc.confidence).toBeGreaterThan(0)
    expect(fc.confidence).toBeLessThanOrEqual(1)
  })

  it('computes a window delta sign correctly', () => {
    // first half sums 3, second half sums 12 → +300%
    const d = windowDelta(series([1, 1, 1, 4, 4, 4]), 'sales')
    expect(d).toBeGreaterThan(0)
  })

  it('generates interpretive insights including a forecast and a recommendation', () => {
    const ds: SalesDataset = {
      projectName: 'Alto Bellevue',
      brokers,
      series: series([1, 2, 2, 3, 4, 5]),
      funnel: { leads: 100, contacts: 60, visits: 40, proposals: 20, reservations: 10, sales: 5 },
      inventory: { available: 18, reserved: 5, sold: 11, avgDaysInStock: 24, hottestBlock: 'Quadra B' },
      vgvTotal: 78_400_000,
      avgClosingDays: 2.3,
    }
    const insights = generateInsights(ds)
    expect(insights.length).toBeGreaterThan(3)
    expect(insights.some((i) => i.kind === 'forecast')).toBe(true)
    expect(insights.some((i) => i.kind === 'recommendation')).toBe(true)
    insights.forEach((i) => {
      expect(i.confidence).toBeGreaterThan(0)
      expect(i.confidence).toBeLessThanOrEqual(1)
    })
  })
})
