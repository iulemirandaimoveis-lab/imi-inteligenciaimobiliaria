/**
 * @jest-environment node
 */

/**
 * IMI Invest Engine — Calculator Tests
 * Realistic property data from Recife market
 */

import { calculateSAC, calculatePrice, calculateAmortization } from '@/lib/invest/engine/amortization'
import { calculateIRR, monthlyToAnnualIRR } from '@/lib/invest/engine/irr'
import { calculateNPV, calculateCapRate, calculateCashOnCash, calculateDSCR } from '@/lib/invest/engine/npv'

describe('IMI Invest Calculator', () => {
  // ── Amortization ──────────────────────────────────────────────────────────

  describe('SAC Amortization', () => {
    it('calculates SAC amortization for R$ 500k property (80% financed)', () => {
      const principal = 400_000 // R$ 500k com 20% entrada
      const annualRate = 0.1099 // ~11% a.a. (taxa típica Recife)
      const months = 360 // 30 anos

      const schedule = calculateSAC(principal, annualRate, months)

      expect(schedule).toHaveLength(360)
      // SAC: amortização constante
      const constantAmort = principal / months
      expect(schedule[0].principal).toBeCloseTo(constantAmort, 2)
      expect(schedule[359].principal).toBeCloseTo(constantAmort, 2)
      // First payment > last payment (SAC characteristic)
      expect(schedule[0].payment).toBeGreaterThan(schedule[359].payment)
      // Final balance should be ~0
      expect(schedule[359].balance).toBeCloseTo(0, 0)
      // Total principal paid = original principal
      const totalPrincipal = schedule.reduce((sum, e) => sum + e.principal, 0)
      expect(totalPrincipal).toBeCloseTo(principal, 0)
    })
  })

  describe('Price Amortization', () => {
    it('calculates Price (fixed-payment) amortization for R$ 500k property', () => {
      const principal = 400_000
      const annualRate = 0.1099
      const months = 360

      const schedule = calculatePrice(principal, annualRate, months)

      expect(schedule).toHaveLength(360)
      // Price: all payments equal
      const firstPayment = schedule[0].payment
      const lastPayment = schedule[359].payment
      expect(firstPayment).toBeCloseTo(lastPayment, 2)
      // Interest decreases over time, principal increases
      expect(schedule[0].interest).toBeGreaterThan(schedule[359].interest)
      expect(schedule[0].principal).toBeLessThan(schedule[359].principal)
      // Final balance ~0
      expect(schedule[359].balance).toBeCloseTo(0, 0)
    })
  })

  describe('calculateAmortization selector', () => {
    it('returns empty array for cash purchase', () => {
      const result = calculateAmortization(400_000, 0.11, 360, 'cash')
      expect(result).toEqual([])
    })

    it('returns empty array for zero principal', () => {
      const result = calculateAmortization(0, 0.11, 360, 'sac')
      expect(result).toEqual([])
    })
  })

  // ── IRR ────────────────────────────────────────────────────────────────────

  describe('IRR Calculation', () => {
    it('calculates IRR for a 10-year investment in Recife apartment', () => {
      // Simplified: -200k initial, +2.5k/month net for 120 months, +350k sale at end
      const cashFlows = [-200_000]
      for (let i = 1; i < 120; i++) {
        cashFlows.push(2_500)
      }
      cashFlows.push(2_500 + 350_000) // last month includes sale

      const monthlyIRR = calculateIRR(cashFlows)
      const annualIRR = monthlyToAnnualIRR(monthlyIRR)

      // Should be a positive annual return (realistic range 8-25%)
      expect(annualIRR).toBeGreaterThan(0.08)
      expect(annualIRR).toBeLessThan(0.30)
    })
  })

  // ── NPV ────────────────────────────────────────────────────────────────────

  describe('NPV Calculation', () => {
    it('returns positive NPV for profitable Recife rental scenario', () => {
      // Discount rate: ~0.8% monthly (IPCA + spread)
      const discountRate = 0.008
      const cashFlows = [-300_000]
      for (let i = 1; i <= 120; i++) {
        cashFlows.push(3_000) // R$ 3k/month net
      }
      cashFlows[120] += 450_000 // Sale proceeds at end

      const npv = calculateNPV(cashFlows, discountRate)
      expect(npv).toBeGreaterThan(0)
    })

    it('returns negative NPV for overpriced property with low rent', () => {
      const discountRate = 0.01 // 1% monthly
      const cashFlows = [-800_000]
      for (let i = 1; i <= 120; i++) {
        cashFlows.push(1_500) // Very low rent for the price
      }
      cashFlows[120] += 600_000 // Depreciated sale

      const npv = calculateNPV(cashFlows, discountRate)
      expect(npv).toBeLessThan(0)
    })
  })

  // ── Cap Rate ───────────────────────────────────────────────────────────────

  describe('Cap Rate', () => {
    it('calculates cap rate for typical Recife apartment', () => {
      // Apartamento Boa Viagem: R$ 600k, aluguel líquido R$ 36k/ano (NOI)
      const annualNOI = 36_000
      const propertyValue = 600_000

      const capRate = calculateCapRate(annualNOI, propertyValue)
      expect(capRate).toBeCloseTo(6.0, 1) // 6% cap rate
    })
  })

  // ── Cash-on-Cash ───────────────────────────────────────────────────────────

  describe('Cash-on-Cash Return', () => {
    it('calculates cash-on-cash for leveraged Recife investment', () => {
      // Entrada R$ 120k + custos R$ 18k = R$ 138k investido
      // Fluxo de caixa anual líquido (após financiamento): R$ 14k
      const annualCashFlow = 14_000
      const totalCashInvested = 138_000

      const coc = calculateCashOnCash(annualCashFlow, totalCashInvested)
      expect(coc).toBeCloseTo(10.14, 1) // ~10%
    })
  })

  // ── DSCR ───────────────────────────────────────────────────────────────────

  describe('DSCR (Debt Service Coverage Ratio)', () => {
    it('returns DSCR > 1 for healthy investment', () => {
      const annualNOI = 48_000
      const annualDebtService = 36_000

      const dscr = calculateDSCR(annualNOI, annualDebtService)
      expect(dscr).toBeCloseTo(1.33, 2)
      expect(dscr).toBeGreaterThan(1)
    })

    it('returns DSCR < 1 for risky investment', () => {
      const annualNOI = 24_000
      const annualDebtService = 36_000

      const dscr = calculateDSCR(annualNOI, annualDebtService)
      expect(dscr).toBeCloseTo(0.67, 2)
      expect(dscr).toBeLessThan(1)
    })
  })

  // ── Edge Cases ─────────────────────────────────────────────────────────────

  describe('Edge Cases', () => {
    it('handles zero rent (cap rate, cash-on-cash, DSCR)', () => {
      expect(calculateCapRate(0, 500_000)).toBe(0)
      expect(calculateCashOnCash(0, 150_000)).toBe(0)
      // Zero NOI with debt service
      expect(calculateDSCR(0, 36_000)).toBe(0)
    })

    it('handles zero debt service (DSCR returns Infinity)', () => {
      expect(calculateDSCR(48_000, 0)).toBe(Infinity)
    })

    it('handles zero property value (cap rate returns 0)', () => {
      expect(calculateCapRate(36_000, 0)).toBe(0)
    })
  })
})
