/**
 * IMI Comissões — funções puras de agregação do ledger (imi.broker_commissions).
 * Separadas da camada de dados para serem testáveis sem DB.
 */

export interface LedgerLike {
  userId: string | null
  brokerName: string
  commissionTotal: number
  companyAmount: number
  brokerAmount: number
  bonusAmount: number
  status: string // forecast | pending | approved | paid | cancelled
}

export interface CommissionTotals {
  forecast: number // previsto (tudo que não foi cancelado)
  received: number // recebido (status = paid)
  companyShare: number
  brokerShare: number
  bonusTotal: number
  count: number
}

const ACTIVE = (s: string) => s !== 'cancelled'

/** Agrega os totais do ledger (ignora lançamentos cancelados no previsto). */
export function aggregateCommissions(rows: LedgerLike[]): CommissionTotals {
  const active = rows.filter((r) => ACTIVE(r.status))
  return {
    forecast: active.reduce((s, r) => s + r.commissionTotal, 0),
    received: rows.filter((r) => r.status === 'paid').reduce((s, r) => s + r.commissionTotal, 0),
    companyShare: active.reduce((s, r) => s + r.companyAmount, 0),
    brokerShare: active.reduce((s, r) => s + r.brokerAmount, 0),
    bonusTotal: active.reduce((s, r) => s + r.bonusAmount, 0),
    count: active.length,
  }
}

export interface BrokerCommissionRank {
  userId: string
  name: string
  forecast: number // parte do corretor prevista
  received: number // parte do corretor recebida (paid)
  count: number
}

/** Ranking por corretor pela parte de comissão (broker_amount). */
export function rankBrokerCommissions(rows: LedgerLike[]): BrokerCommissionRank[] {
  const byBroker = new Map<string, BrokerCommissionRank>()
  for (const r of rows) {
    if (!r.userId || !ACTIVE(r.status)) continue
    const cur =
      byBroker.get(r.userId) ?? { userId: r.userId, name: r.brokerName, forecast: 0, received: 0, count: 0 }
    cur.forecast += r.brokerAmount
    if (r.status === 'paid') cur.received += r.brokerAmount
    cur.count += 1
    byBroker.set(r.userId, cur)
  }
  return Array.from(byBroker.values()).sort((a, b) => b.forecast - a.forecast)
}

/** Percentuais do split a partir dos totais (para a barra empresa/corretor). */
export function splitPercents(totals: CommissionTotals): { company: number; broker: number } {
  const base = totals.companyShare + totals.brokerShare
  if (base <= 0) return { company: 40, broker: 60 }
  const broker = Math.round((totals.brokerShare / base) * 100)
  return { company: 100 - broker, broker }
}
