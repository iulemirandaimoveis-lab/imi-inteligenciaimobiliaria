import type { Market } from './types'

export const FISCAL_RULES = {
  brasil: {
    transferTax: 0.03,        // ITBI ~3%
    capitalGainsBrackets: [
      { upTo: 5_000_000, rate: 0.15 },
      { upTo: 10_000_000, rate: 0.175 },
      { upTo: 30_000_000, rate: 0.20 },
      { above: 30_000_000, rate: 0.225 },
    ],
    rentalIncomeBrackets: [
      { upTo: 2259.20, rate: 0, deduction: 0 },
      { upTo: 2826.65, rate: 0.075, deduction: 169.44 },
      { upTo: 3751.05, rate: 0.15, deduction: 381.44 },
      { upTo: 4664.68, rate: 0.225, deduction: 662.77 },
      { above: 4664.68, rate: 0.275, deduction: 896.00 },
    ],
    sellingCosts: 0.06,        // 6% corretagem
    closingCostsRate: 0.02,    // ~2% cartório/registro
  },
  usa: {
    transferTax: 0.01,         // ~1% avg (varies by state)
    capitalGainsLongTerm: 0.15, // 15% federal (most brackets)
    niit: 0.038,               // Net Investment Income Tax
    rentalIncomeTax: 0.22,     // ~22% effective
    depreciation: 27.5,        // years (residential)
    sellingCosts: 0.06,
    closingCostsRate: 0.03,
  },
  dubai: {
    transferTax: 0.04,         // 4% DLD fee
    capitalGainsTax: 0,        // Zero capital gains
    rentalIncomeTax: 0,        // Zero income tax
    housingFee: 0.05,          // 5% DEWA housing fee on rent
    sellingCosts: 0.02,
    closingCostsRate: 0.01,
  },
} as const

export function getDefaultFiscalParams(market: Market) {
  const rules = FISCAL_RULES[market]

  switch (market) {
    case 'brasil':
      return {
        capitalGainsTaxRate: 15,
        rentalIncomeTaxRate: 15,
        transferTaxRate: 3,
        sellingCostsRate: 6,
        closingCosts: 0, // calculated from property value
      }
    case 'usa':
      return {
        capitalGainsTaxRate: 15,
        rentalIncomeTaxRate: 22,
        transferTaxRate: 1,
        sellingCostsRate: 6,
        closingCosts: 0,
      }
    case 'dubai':
      return {
        capitalGainsTaxRate: 0,
        rentalIncomeTaxRate: 5, // DEWA housing fee
        transferTaxRate: 4,
        sellingCostsRate: 2,
        closingCosts: 0,
      }
  }
}
