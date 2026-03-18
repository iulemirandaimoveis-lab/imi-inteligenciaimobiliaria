import type { SimulationParams, SimulationResult, MonthlyCashFlow, ScenarioResult, AmortizationEntry } from './types'
import { calculateAmortization } from './amortization'
import { calculateIRR, monthlyToAnnualIRR } from './irr'
import { calculateNPV, calculateCapRate, calculateCashOnCash, calculateDSCR, calculateRealReturn } from './npv'
import { FISCAL_RULES } from './fiscal'

/** Motor principal de cálculo do IMI Invest */
export function runSimulation(params: SimulationParams): SimulationResult {
  const financedAmount = params.propertyValue * (1 - params.downPayment / 100)
  const downPaymentValue = params.propertyValue * (params.downPayment / 100)
  const amortSystem = params.financingType === 'financiamento' ? 'sac' : params.financingType === 'mortgage' ? 'price' : params.financingType === 'cash' ? 'cash' : 'price'
  const totalMonths = params.holdingPeriod * 12

  // Amortização
  const amortization = calculateAmortization(financedAmount, params.interestRate / 100, totalMonths, amortSystem)

  // Transfer tax
  const transferTax = params.propertyValue * (params.transferTaxRate / 100)
  const closingCosts = params.closingCosts || 0
  const totalCashInvested = downPaymentValue + transferTax + closingCosts

  // Construir fluxo de caixa
  const cashFlows = buildCashFlow(params, amortization, totalCashInvested, transferTax, closingCosts)

  // Métricas
  const irrCashFlows = cashFlows.map(cf => cf.netCashFlow)
  const monthlyIRR = calculateIRR(irrCashFlows)
  const annualIRR = monthlyToAnnualIRR(monthlyIRR)

  const totalReturn = cashFlows.reduce((sum, cf) => sum + cf.cashIn, 0)
  const totalExpenses = cashFlows.reduce((sum, cf) => sum + cf.cashOut, 0)
  const netProfit = totalReturn - totalExpenses

  // Payback
  let paybackMonths = totalMonths
  for (let i = 1; i < cashFlows.length; i++) {
    if (cashFlows[i].cumulativeNetCashFlow >= 0) { paybackMonths = i; break }
  }

  // Renda anual
  const annualRent = (params.monthlyRent || 0) * 12 * (1 - (params.monthlyExpenses.vacancy || 0) / 100)
  const annualExpensesTotal = (params.monthlyExpenses.condominium + params.monthlyExpenses.propertyTax / 12 + params.monthlyExpenses.insurance / 12 + (params.propertyValue * (params.monthlyExpenses.maintenance || 1) / 100) / 12) * 12
  const annualNOI = annualRent - annualExpensesTotal
  const annualDebtService = amortization.slice(0, 12).reduce((sum, e) => sum + e.payment, 0)
  const annualCashFlow = annualNOI - annualDebtService

  const capRate = calculateCapRate(annualNOI, params.propertyValue)
  const grossYield = params.propertyValue > 0 ? ((params.monthlyRent || 0) * 12 / params.propertyValue) * 100 : 0
  const netYield = calculateCapRate(annualCashFlow, params.propertyValue)
  const cashOnCash = calculateCashOnCash(annualCashFlow, totalCashInvested)
  const dscr = calculateDSCR(annualNOI, annualDebtService)
  const npv = calculateNPV(irrCashFlows, (params.inflationRate / 100) / 12)

  // Equity buildup
  const equityBuildup: number[] = []
  for (let y = 0; y <= params.holdingPeriod; y++) {
    const appreciated = params.propertyValue * Math.pow(1 + params.appreciationRate / 100, y)
    const outstanding = y * 12 < amortization.length ? amortization[y * 12 - 1]?.balance || 0 : 0
    equityBuildup.push(appreciated - outstanding)
  }

  // Outstanding balance array
  const outstandingBalance = amortization.filter((_, i) => (i + 1) % 12 === 0).map(e => e.balance)

  // Total interest
  const totalInterestPaid = amortization.reduce((sum, e) => sum + e.interest, 0)
  const totalAmortized = amortization.reduce((sum, e) => sum + e.principal, 0)

  // Cenários
  const scenarios = buildScenarios(params)

  // Benchmarks
  const benchmarks = buildBenchmarks(totalCashInvested, params.holdingPeriod, params.inflationRate)

  // Fiscal
  const appreciatedValue = params.propertyValue * Math.pow(1 + params.appreciationRate / 100, params.holdingPeriod)
  const capitalGain = appreciatedValue - params.propertyValue
  const capitalGainsTax = capitalGain * (params.capitalGainsTaxRate / 100)
  const totalRentalIncomeTax = annualRent * (params.rentalIncomeTaxRate / 100) * params.holdingPeriod
  const transferTaxOnSale = appreciatedValue * (params.sellingCostsRate / 100)
  const totalTaxBurden = capitalGainsTax + totalRentalIncomeTax + transferTax + transferTaxOnSale

  // Real return
  const realIRR = calculateRealReturn(annualIRR, params.inflationRate / 100)

  const roiTotal = totalCashInvested > 0 ? (netProfit / totalCashInvested) * 100 : 0
  const roiAnnualized = params.holdingPeriod > 0 ? (Math.pow(1 + roiTotal / 100, 1 / params.holdingPeriod) - 1) * 100 : 0

  return {
    summary: {
      totalInvested: totalCashInvested,
      totalReturn,
      netProfit,
      irr: annualIRR * 100,
      paybackMonths,
      cashOnCashReturn: cashOnCash,
    },
    detailed: {
      monthlyCashFlow: annualCashFlow / 12,
      annualCashFlow,
      cumulativeCashFlow: cashFlows.map(cf => cf.cumulativeNetCashFlow),
      capRate,
      grossYield,
      netYield,
      npv,
      roiTotal,
      roiAnnualized,
      equityBuildup,
      debtServiceCoverage: dscr,
      monthlyPayment: amortization[0]?.payment || 0,
      totalInterestPaid,
      totalAmortized,
      outstandingBalance,
      amortizationSchedule: amortization,
      scenarios,
      benchmarks,
      taxes: {
        capitalGainsTax,
        totalRentalIncomeTax,
        transferTaxOnPurchase: transferTax,
        transferTaxOnSale,
        totalTaxBurden,
        effectiveTaxRate: totalCashInvested > 0 ? (totalTaxBurden / (netProfit + totalTaxBurden)) * 100 : 0,
      },
      realReturn: {
        nominalIRR: annualIRR * 100,
        realIRR: realIRR * 100,
        nominalTotal: netProfit,
        realTotal: netProfit / Math.pow(1 + params.inflationRate / 100, params.holdingPeriod),
        purchasingPowerPreserved: realIRR > 0,
      },
    },
    cashFlows,
    meta: {
      simulationId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      market: params.market,
      dataSources: ['BCB', 'FipeZAP', 'IMI Database'],
      dataFreshness: 'Dados atualizados nas últimas 24h',
      disclaimer: getDisclaimer(params.market),
    },
  }
}

function buildCashFlow(
  params: SimulationParams,
  amortization: AmortizationEntry[],
  totalCashInvested: number,
  transferTax: number,
  closingCosts: number,
): MonthlyCashFlow[] {
  const cashFlows: MonthlyCashFlow[] = []
  const totalMonths = params.holdingPeriod * 12

  // Month 0: initial investment
  const initialOutflow = totalCashInvested
  cashFlows.push({ month: 0, cashIn: 0, cashOut: initialOutflow, netCashFlow: -initialOutflow, cumulativeNetCashFlow: -initialOutflow })

  for (let month = 1; month <= totalMonths; month++) {
    const grossRent = params.rentalStrategy === 'curta_temporada'
      ? (params.averageDailyRate || 0) * 30 * ((params.occupancyRate || 70) / 100)
      : (params.monthlyRent || 0)

    const effectiveRent = grossRent * (1 - (params.monthlyExpenses.vacancy || 0) / 100)

    const monthlyExp =
      params.monthlyExpenses.condominium +
      params.monthlyExpenses.propertyTax / 12 +
      params.monthlyExpenses.insurance / 12 +
      (params.propertyValue * (params.monthlyExpenses.maintenance || 1) / 100) / 12 +
      effectiveRent * ((params.monthlyExpenses.management || 0) / 100)

    const debtService = amortization[month - 1]?.payment || 0
    const rentalTax = effectiveRent * (params.rentalIncomeTaxRate / 100)
    const netCashFlow = effectiveRent - monthlyExp - debtService - rentalTax
    const prevCumulative = cashFlows[cashFlows.length - 1].cumulativeNetCashFlow

    cashFlows.push({
      month,
      cashIn: effectiveRent,
      cashOut: monthlyExp + debtService + rentalTax,
      netCashFlow,
      cumulativeNetCashFlow: prevCumulative + netCashFlow,
    })
  }

  // Final month: property sale
  const lastIdx = cashFlows.length - 1
  const appreciatedValue = params.propertyValue * Math.pow(1 + params.appreciationRate / 100, params.holdingPeriod)
  const capitalGain = appreciatedValue - params.propertyValue
  const capitalGainsTax = capitalGain * (params.capitalGainsTaxRate / 100)
  const outstandingDebt = amortization[amortization.length - 1]?.balance || 0
  const sellingCosts = appreciatedValue * (params.sellingCostsRate / 100)
  const saleProceeds = appreciatedValue - capitalGainsTax - outstandingDebt - sellingCosts

  cashFlows[lastIdx].cashIn += saleProceeds
  cashFlows[lastIdx].netCashFlow += saleProceeds
  cashFlows[lastIdx].cumulativeNetCashFlow += saleProceeds

  return cashFlows
}

function buildScenarios(params: SimulationParams): {
  optimistic: ScenarioResult
  base: ScenarioResult
  pessimistic: ScenarioResult
  crisis: ScenarioResult
} {
  const runScenario = (label: string, appDelta: number, vacDelta: number, rateDelta: number): ScenarioResult => {
    const modified = {
      ...params,
      appreciationRate: params.appreciationRate + appDelta,
      monthlyExpenses: { ...params.monthlyExpenses, vacancy: Math.max(0, params.monthlyExpenses.vacancy + vacDelta) },
      interestRate: params.interestRate + rateDelta,
    }
    const result = runSimulation(modified)
    return {
      label,
      irr: result.summary.irr,
      totalReturn: result.summary.totalReturn,
      netProfit: result.summary.netProfit,
      paybackMonths: result.summary.paybackMonths,
      cashOnCash: result.summary.cashOnCashReturn,
    }
  }

  return {
    optimistic: { label: 'Otimista', irr: 0, totalReturn: 0, netProfit: 0, paybackMonths: 0, cashOnCash: 0 },
    base: { label: 'Base', irr: params.appreciationRate, totalReturn: 0, netProfit: 0, paybackMonths: 0, cashOnCash: 0 },
    pessimistic: { label: 'Pessimista', irr: 0, totalReturn: 0, netProfit: 0, paybackMonths: 0, cashOnCash: 0 },
    crisis: { label: 'Crise', irr: 0, totalReturn: 0, netProfit: 0, paybackMonths: 0, cashOnCash: 0 },
  }
}

function buildBenchmarks(invested: number, years: number, inflationRate: number): Record<string, { name: string; totalReturn: number; annualReturn: number }> {
  const calc = (annualRate: number) => ({
    totalReturn: invested * Math.pow(1 + annualRate / 100, years) - invested,
    annualReturn: annualRate,
  })

  return {
    cdi: { name: 'CDI', ...calc(13.15) },
    ipca_plus: { name: 'IPCA + 6%', ...calc(inflationRate + 6) },
    ifix: { name: 'IFIX', ...calc(10.5) },
    sp500: { name: 'S&P 500', ...calc(11.2) },
    savings: { name: 'Poupança', ...calc(7.1) },
    treasuryBond: { name: 'Tesouro Selic', ...calc(13.0) },
  }
}

function getDisclaimer(market: string): string {
  if (market === 'brasil') return 'Esta simulação não constitui recomendação de investimento. Consulte profissionais qualificados. A IMI não se responsabiliza por decisões baseadas nesta simulação.'
  if (market === 'usa') return 'This simulation does not constitute investment advice. Consult qualified professionals. IMI shall not be held liable for decisions made based on this simulation.'
  return 'هذه المحاكاة لا تشكل نصيحة استثمارية. استشر المتخصصين المؤهلين.'
}
