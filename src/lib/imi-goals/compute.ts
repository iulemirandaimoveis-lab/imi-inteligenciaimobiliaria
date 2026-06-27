/**
 * IMI Metas — funções puras de cálculo de desempenho.
 * Mantidas separadas da camada de dados para serem testáveis sem DB.
 */

export interface SaleLike {
  amount: number
  when: string // ISO timestamp/date
}

/** True se a data (YYYY-MM-DD) está dentro de [start, end] inclusivo. */
export function inPeriod(when: string, start: string, end: string): boolean {
  const d = when.slice(0, 10)
  return d >= start && d <= end
}

/** Agrega realizado (VGV), nº de vendas e ticket médio. */
export function summarize(sales: SaleLike[]): { realized: number; salesCount: number; avgTicket: number } {
  const realized = sales.reduce((s, x) => s + (Number.isFinite(x.amount) ? x.amount : 0), 0)
  const salesCount = sales.length
  return { realized, salesCount, avgTicket: salesCount ? realized / salesCount : 0 }
}

/** Progresso em % (0–100, limitado a 100). */
export function progressPct(realized: number, target: number): number {
  if (!(target > 0)) return 0
  return Math.min(100, Math.round((realized / target) * 100))
}
