import 'server-only'
import type { BtgAccountConfig } from './config'
import type { NormalizedBankTransaction } from './types'

export class BtgStatementError extends Error {}

/**
 * Busca o extrato via BTG Empresas API e normaliza para o shape interno.
 *
 * ⚠️ O nome exato dos campos da resposta (`valor`/`amount`, `data`/`date`, etc.)
 * não pôde ser confirmado nesta sessão — o acesso a developers.empresas.btgpactual.com
 * foi bloqueado pela política de rede do ambiente. O normalizador abaixo tenta
 * as variantes mais comuns; se a conta PJ retornar um payload com nomes
 * diferentes, ajuste apenas `normalizeEntry()` — o restante do pipeline
 * (dedupe por `external_id`, matching, UI) não muda.
 */
export async function fetchBtgStatement(
  config: BtgAccountConfig,
  accessToken: string,
  range: { from: string; to: string }
): Promise<NormalizedBankTransaction[]> {
  const url = new URL(config.statementPath, config.apiBaseUrl)
  url.searchParams.set('dataInicio', range.from)
  url.searchParams.set('dataFim', range.to)

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new BtgStatementError(`BTG extrato error (HTTP ${res.status}): ${JSON.stringify(json)}`)
  }

  const list: unknown[] = Array.isArray(json)
    ? json
    : (json?.transacoes ?? json?.movimentos ?? json?.items ?? json?.data ?? [])
  if (!Array.isArray(list)) {
    throw new BtgStatementError(`BTG extrato: formato de resposta inesperado — ${JSON.stringify(json).slice(0, 300)}`)
  }

  return list
    .map((entry) => normalizeEntry(entry as Record<string, unknown>))
    .filter((tx): tx is NormalizedBankTransaction => tx !== null)
}

function normalizeEntry(raw: Record<string, unknown>): NormalizedBankTransaction | null {
  const amountRaw = raw.valor ?? raw.amount ?? raw.value
  if (amountRaw == null) return null
  const amount = Math.abs(Number(amountRaw))
  if (!Number.isFinite(amount)) return null

  const typeRaw = String(raw.tipo ?? raw.type ?? (Number(amountRaw) < 0 ? 'D' : 'C')).toUpperCase()
  const type: 'credito' | 'debito' = typeRaw.startsWith('C') || typeRaw.startsWith('E') ? 'credito' : 'debito'

  const dateRaw = raw.data ?? raw.date ?? raw.dataMovimento ?? raw.transactionDate
  if (!dateRaw) return null
  const date = String(dateRaw).slice(0, 10)

  const pagador = (raw.pagador ?? raw.payer ?? {}) as Record<string, unknown>
  const externalId = raw.id ?? raw.transactionId ?? raw.codigoTransacao ?? null

  return {
    externalId: externalId != null ? String(externalId) : null,
    amount,
    type,
    description: String(raw.descricao ?? raw.description ?? raw.historico ?? ''),
    counterpartyName: (raw.nomePagador ?? raw.counterpartyName ?? pagador.nome ?? pagador.name ?? null) as string | null,
    counterpartyDocument: (raw.documentoPagador ?? raw.counterpartyDocument ?? pagador.documento ?? pagador.document ?? null) as string | null,
    date,
    raw,
  }
}
