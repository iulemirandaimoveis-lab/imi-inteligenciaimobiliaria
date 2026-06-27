import {
  aggregateCommissions,
  rankBrokerCommissions,
  splitPercents,
  type LedgerLike,
} from '@/lib/imi-commissions/compute'

const row = (over: Partial<LedgerLike>): LedgerLike => ({
  userId: 'u1',
  brokerName: 'João',
  commissionTotal: 0,
  companyAmount: 0,
  brokerAmount: 0,
  bonusAmount: 0,
  status: 'forecast',
  ...over,
})

describe('imi-commissions · compute', () => {
  const rows: LedgerLike[] = [
    row({ userId: 'u1', brokerName: 'João', commissionTotal: 100000, companyAmount: 40000, brokerAmount: 60000, status: 'paid' }),
    row({ userId: 'u1', brokerName: 'João', commissionTotal: 50000, companyAmount: 20000, brokerAmount: 30000, status: 'forecast' }),
    row({ userId: 'u2', brokerName: 'Douglas', commissionTotal: 80000, companyAmount: 32000, brokerAmount: 48000, bonusAmount: 5000, status: 'approved' }),
    row({ userId: 'u3', brokerName: 'Cancelado', commissionTotal: 999999, companyAmount: 1, brokerAmount: 1, status: 'cancelled' }),
  ]

  it('aggregates totals and excludes cancelled from forecast', () => {
    const t = aggregateCommissions(rows)
    expect(t.forecast).toBe(230000) // 100k + 50k + 80k (cancelled excluded)
    expect(t.received).toBe(100000) // only paid
    expect(t.companyShare).toBe(92000) // 40k + 20k + 32k
    expect(t.brokerShare).toBe(138000) // 60k + 30k + 48k
    expect(t.bonusTotal).toBe(5000)
    expect(t.count).toBe(3)
  })

  it('ranks brokers by their commission share, paid tracked separately', () => {
    const r = rankBrokerCommissions(rows)
    expect(r.map((x) => x.userId)).toEqual(['u1', 'u2']) // u3 cancelled excluded
    expect(r[0].forecast).toBe(90000) // João 60k + 30k
    expect(r[0].received).toBe(60000) // only the paid row's broker part
    expect(r[1].forecast).toBe(48000) // Douglas
  })

  it('derives split percentages from company/broker totals', () => {
    const t = aggregateCommissions(rows)
    const s = splitPercents(t)
    expect(s.company + s.broker).toBe(100)
    expect(s.broker).toBe(60) // 138000 / 230000 ≈ 60%
  })

  it('falls back to 40/60 when there is no data', () => {
    expect(splitPercents(aggregateCommissions([]))).toEqual({ company: 40, broker: 60 })
  })
})
