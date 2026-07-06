export interface NormalizedBankTransaction {
  externalId: string | null
  amount: number
  type: 'credito' | 'debito'
  description: string
  counterpartyName: string | null
  counterpartyDocument: string | null
  date: string // YYYY-MM-DD
  raw: Record<string, unknown>
}
