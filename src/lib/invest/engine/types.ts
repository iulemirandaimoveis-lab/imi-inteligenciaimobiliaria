// ============================================================
// IMI INVEST ENGINE — TypeScript Types
// ============================================================

export type Market = 'brasil' | 'usa' | 'dubai'
export type Currency = 'BRL' | 'USD' | 'AED'
export type Objective = 'renda_passiva' | 'valorizacao' | 'flip' | 'diversificacao'
export type InvestorProfile = 'conservador' | 'moderado' | 'agressivo'
export type FinancingType = 'cash' | 'financiamento' | 'consorcio' | 'mortgage'
export type RentalStrategy = 'longa_duracao' | 'curta_temporada' | 'hibrido' | 'sem_aluguel'
export type ExitStrategy = 'venda' | 'heranca' | 'fii_tokenizacao'

export interface Step1Data {
  market: Market
  objective: Objective
  investorProfile: InvestorProfile
  currency: Currency
}

export interface PropertyLocation {
  country: string
  state?: string
  city: string
  neighborhood?: string
}

export interface Step2Data {
  propertyValue: number
  propertyType: 'apartamento' | 'casa' | 'comercial' | 'terreno' | 'hotel_flat'
  area_m2: number
  bedrooms: number
  location: PropertyLocation
  downPayment: number
  financingType: FinancingType
}

export interface MonthlyExpenses {
  condominium: number
  propertyTax: number
  insurance: number
  maintenance: number
  management: number
  vacancy: number
}

export interface Step3Data {
  rentalStrategy: RentalStrategy
  monthlyRent?: number
  occupancyRate?: number
  averageDailyRate?: number
  monthlyExpenses: MonthlyExpenses
  appreciationRate: number
  inflationRate: number
  holdingPeriod: number
  exitStrategy: ExitStrategy
  interestRate: number
}

export interface SimulationParams extends Step1Data, Step2Data, Step3Data {
  capitalGainsTaxRate: number
  rentalIncomeTaxRate: number
  transferTaxRate: number
  sellingCostsRate: number
  closingCosts: number
}

export interface AmortizationEntry {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
}

export interface MonthlyCashFlow {
  month: number
  cashIn: number
  cashOut: number
  netCashFlow: number
  cumulativeNetCashFlow: number
}

export interface ScenarioResult {
  label: string
  irr: number
  totalReturn: number
  netProfit: number
  paybackMonths: number
  cashOnCash: number
}

export interface BenchmarkResult {
  name: string
  totalReturn: number
  annualReturn: number
}

export interface SimulationSummary {
  totalInvested: number
  totalReturn: number
  netProfit: number
  irr: number
  paybackMonths: number
  cashOnCashReturn: number
}

export interface SimulationDetailed {
  monthlyCashFlow: number
  annualCashFlow: number
  cumulativeCashFlow: number[]
  capRate: number
  grossYield: number
  netYield: number
  npv: number
  roiTotal: number
  roiAnnualized: number
  equityBuildup: number[]
  debtServiceCoverage: number
  monthlyPayment: number
  totalInterestPaid: number
  totalAmortized: number
  outstandingBalance: number[]
  amortizationSchedule: AmortizationEntry[]
  scenarios: {
    optimistic: ScenarioResult
    base: ScenarioResult
    pessimistic: ScenarioResult
    crisis: ScenarioResult
  }
  benchmarks: Record<string, BenchmarkResult>
  taxes: {
    capitalGainsTax: number
    totalRentalIncomeTax: number
    transferTaxOnPurchase: number
    transferTaxOnSale: number
    totalTaxBurden: number
    effectiveTaxRate: number
  }
  realReturn: {
    nominalIRR: number
    realIRR: number
    nominalTotal: number
    realTotal: number
    purchasingPowerPreserved: boolean
  }
}

export interface SimulationResult {
  summary: SimulationSummary
  detailed: SimulationDetailed
  cashFlows: MonthlyCashFlow[]
  meta: {
    simulationId: string
    createdAt: string
    market: Market
    dataSources: string[]
    dataFreshness: string
    disclaimer: string
  }
}

export interface IndexData {
  id: string
  value: number
  unit: string
  period: string
  source: string
  history: { date: string; value: number }[]
  fetchedAt: string
}
