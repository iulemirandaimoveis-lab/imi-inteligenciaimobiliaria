/** VPL — Valor Presente Líquido */
export function calculateNPV(cashFlows: number[], discountRate: number): number {
  return cashFlows.reduce((npv, cf, t) => npv + cf / Math.pow(1 + discountRate, t), 0)
}

/** Cap Rate */
export function calculateCapRate(annualNOI: number, propertyValue: number): number {
  if (propertyValue <= 0) return 0
  return (annualNOI / propertyValue) * 100
}

/** Cash-on-Cash Return */
export function calculateCashOnCash(annualCashFlow: number, totalCashInvested: number): number {
  if (totalCashInvested <= 0) return 0
  return (annualCashFlow / totalCashInvested) * 100
}

/** DSCR — Debt Service Coverage Ratio */
export function calculateDSCR(annualNOI: number, annualDebtService: number): number {
  if (annualDebtService <= 0) return Infinity
  return annualNOI / annualDebtService
}

/** Retorno Real (ajustado pela inflação) */
export function calculateRealReturn(nominalReturn: number, inflationRate: number): number {
  return ((1 + nominalReturn) / (1 + inflationRate)) - 1
}
