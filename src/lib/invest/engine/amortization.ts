import type { AmortizationEntry } from './types'

/** SAC — Sistema de Amortização Constante (Brasil) */
export function calculateSAC(principal: number, annualRate: number, months: number): AmortizationEntry[] {
  const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1
  const monthlyAmortization = principal / months
  const schedule: AmortizationEntry[] = []
  let balance = principal

  for (let m = 1; m <= months; m++) {
    const interest = balance * monthlyRate
    const payment = monthlyAmortization + interest
    balance -= monthlyAmortization
    schedule.push({ month: m, payment, principal: monthlyAmortization, interest, balance: Math.max(0, balance) })
  }
  return schedule
}

/** Price / Mortgage — Parcelas fixas (Brasil/EUA) */
export function calculatePrice(principal: number, annualRate: number, months: number): AmortizationEntry[] {
  const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
  const schedule: AmortizationEntry[] = []
  let balance = principal

  for (let m = 1; m <= months; m++) {
    const interest = balance * monthlyRate
    const principalPaid = payment - interest
    balance -= principalPaid
    schedule.push({ month: m, payment, principal: principalPaid, interest, balance: Math.max(0, balance) })
  }
  return schedule
}

/** Seleciona sistema de amortização */
export function calculateAmortization(
  principal: number,
  annualRate: number,
  months: number,
  system: 'sac' | 'price' | 'cash' = 'price'
): AmortizationEntry[] {
  if (system === 'cash' || principal <= 0 || annualRate <= 0) return []
  if (system === 'sac') return calculateSAC(principal, annualRate, months)
  return calculatePrice(principal, annualRate, months)
}
