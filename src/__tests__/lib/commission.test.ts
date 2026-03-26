/**
 * @jest-environment node
 */

/**
 * IMI Commission Calculator Tests
 * Tests for calculateCommission and formatBRL from src/lib/commission.ts
 */

import { calculateCommission, formatBRL } from '@/lib/commission'

describe('Commission Calculator', () => {
  it('calculates standard 6% commission with 50/50 split', () => {
    const result = calculateCommission({
      propertyValue: 500_000,
      totalCommissionRate: 6,
      proposerSplitPercentage: 50,
    })

    // Total commission: R$ 500k * 6% = R$ 30k
    expect(result.totalCommissionValue).toBe(30_000)
    // Platform fee default 10%: R$ 3k
    expect(result.platformFeeValue).toBe(3_000)
    // Distributable: R$ 27k
    // Proposer 50%: R$ 13.5k
    expect(result.proposerValue).toBe(13_500)
    // Accepter 50%: R$ 13.5k
    expect(result.accepterValue).toBe(13_500)
    expect(result.proposerPercentage).toBe(50)
    expect(result.accepterPercentage).toBe(50)
  })

  it('calculates commission for luxury property (R$ 3M)', () => {
    const result = calculateCommission({
      propertyValue: 3_000_000,
      totalCommissionRate: 5,
      proposerSplitPercentage: 60,
    })

    // Total: R$ 3M * 5% = R$ 150k
    expect(result.totalCommissionValue).toBe(150_000)
    // Platform fee 10%: R$ 15k
    expect(result.platformFeeValue).toBe(15_000)
    // Distributable: R$ 135k
    // Proposer 60%: R$ 81k
    expect(result.proposerValue).toBe(81_000)
    // Accepter 40%: R$ 54k
    expect(result.accepterValue).toBe(54_000)
  })

  it('calculates split between brokers with custom platform fee', () => {
    const result = calculateCommission({
      propertyValue: 800_000,
      totalCommissionRate: 6,
      proposerSplitPercentage: 70,
      platformFeePercentage: 5,
    })

    // Total: R$ 800k * 6% = R$ 48k
    expect(result.totalCommissionValue).toBe(48_000)
    // Platform fee 5%: R$ 2.4k
    expect(result.platformFeeValue).toBe(2_400)
    expect(result.platformFeePercentage).toBe(5)
    // Distributable: R$ 45.6k
    // Proposer 70%: R$ 31.92k
    expect(result.proposerValue).toBeCloseTo(31_920, 2)
    // Accepter 30%: R$ 13.68k
    expect(result.accepterValue).toBeCloseTo(13_680, 2)
  })

  it('handles zero property value edge case', () => {
    const result = calculateCommission({
      propertyValue: 0,
      totalCommissionRate: 6,
      proposerSplitPercentage: 50,
    })

    expect(result.totalCommissionValue).toBe(0)
    expect(result.platformFeeValue).toBe(0)
    expect(result.proposerValue).toBe(0)
    expect(result.accepterValue).toBe(0)
    expect(result.proposerNet).toBe(0)
    expect(result.accepterNet).toBe(0)
  })

  it('applies minimum commission threshold (100% to proposer)', () => {
    // When proposer gets 100% of the split
    const result = calculateCommission({
      propertyValue: 100_000,
      totalCommissionRate: 6,
      proposerSplitPercentage: 100,
    })

    // Total: R$ 100k * 6% = R$ 6k
    expect(result.totalCommissionValue).toBe(6_000)
    // Platform fee 10%: R$ 600
    expect(result.platformFeeValue).toBe(600)
    // Distributable: R$ 5.4k
    // Proposer 100%: R$ 5.4k
    expect(result.proposerValue).toBe(5_400)
    // Accepter 0%: R$ 0
    expect(result.accepterValue).toBe(0)
    expect(result.accepterPercentage).toBe(0)
  })

  describe('formatBRL', () => {
    it('formats currency in BRL', () => {
      const formatted = formatBRL(30_000)
      expect(formatted).toContain('30.000')
      expect(formatted).toMatch(/R\$/)
    })
  })
})
