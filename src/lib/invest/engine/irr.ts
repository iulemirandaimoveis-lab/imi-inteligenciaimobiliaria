/** TIR — Taxa Interna de Retorno via Newton-Raphson */
export function calculateIRR(cashFlows: number[], guess: number = 0.1): number {
  const maxIterations = 1000
  const tolerance = 1e-10
  let rate = guess

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0
    let dnpv = 0

    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t)
      dnpv -= t * cashFlows[t] / Math.pow(1 + rate, t + 1)
    }

    if (Math.abs(dnpv) < tolerance) break
    const newRate = rate - npv / dnpv
    if (Math.abs(newRate - rate) < tolerance) return newRate
    rate = newRate
  }
  return rate
}

/** Converte TIR mensal para anual */
export function monthlyToAnnualIRR(monthlyIRR: number): number {
  return Math.pow(1 + monthlyIRR, 12) - 1
}
