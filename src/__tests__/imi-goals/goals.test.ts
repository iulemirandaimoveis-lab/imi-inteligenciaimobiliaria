import { inPeriod, summarize, progressPct } from '@/lib/imi-goals/compute'

describe('imi-goals · compute', () => {
  it('matches dates within an inclusive period (ignoring time)', () => {
    expect(inPeriod('2026-06-15T12:00:00Z', '2026-06-01', '2026-06-30')).toBe(true)
    expect(inPeriod('2026-06-01T00:00:00Z', '2026-06-01', '2026-06-30')).toBe(true)
    expect(inPeriod('2026-06-30T23:59:00Z', '2026-06-01', '2026-06-30')).toBe(true)
    expect(inPeriod('2026-07-01T00:00:00Z', '2026-06-01', '2026-06-30')).toBe(false)
    expect(inPeriod('2026-05-31T00:00:00Z', '2026-06-01', '2026-06-30')).toBe(false)
  })

  it('aggregates realized, count and average ticket', () => {
    const s = summarize([
      { amount: 100000, when: '2026-06-02' },
      { amount: 300000, when: '2026-06-10' },
    ])
    expect(s.realized).toBe(400000)
    expect(s.salesCount).toBe(2)
    expect(s.avgTicket).toBe(200000)
  })

  it('handles an empty sales list without dividing by zero', () => {
    const s = summarize([])
    expect(s).toEqual({ realized: 0, salesCount: 0, avgTicket: 0 })
  })

  it('ignores non-finite amounts defensively', () => {
    const s = summarize([{ amount: Number.NaN, when: '2026-06-02' }, { amount: 50000, when: '2026-06-03' }])
    expect(s.realized).toBe(50000)
  })

  it('computes progress percentage capped at 100', () => {
    expect(progressPct(2700000, 5000000)).toBe(54)
    expect(progressPct(280000, 500000)).toBe(56)
    expect(progressPct(6000000, 5000000)).toBe(100) // capped
    expect(progressPct(100, 0)).toBe(0) // no target → 0
    expect(progressPct(0, 1000000)).toBe(0)
  })
})
