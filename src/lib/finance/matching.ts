/** Motor de conciliação: pontua o quão provável é que uma transação bancária corresponda a um repasse de comissão. */

export function normalizeDocument(doc: string | null | undefined): string {
  return (doc || '').replace(/\D/g, '')
}

export interface MatchInput {
  repasseAmount: number
  repasseDueDate: string | null
  txAmount: number
  txDate: string
  txCounterpartyName: string | null
  txCounterpartyDocument: string | null
  agencyName: string | null
  agencyDocument: string | null
}

export interface MatchResult {
  score: number
  method: string
}

export function computeMatchScore(input: MatchInput): MatchResult {
  let score = 0
  const methods: string[] = []

  const diff = Math.abs(input.repasseAmount - input.txAmount)
  if (diff < 0.01) {
    score += 45
    methods.push('valor_exato')
  } else if (input.repasseAmount > 0 && diff / input.repasseAmount <= 0.02) {
    score += 25
    methods.push('valor_aprox')
  }

  if (input.repasseDueDate) {
    const days = Math.abs(
      (new Date(`${input.txDate}T00:00:00`).getTime() - new Date(`${input.repasseDueDate}T00:00:00`).getTime()) / 86_400_000
    )
    if (days <= 1) { score += 25; methods.push('data_exata') }
    else if (days <= 5) { score += 15; methods.push('data_proxima') }
    else if (days <= 15) { score += 5; methods.push('data_janela') }
  }

  const txDoc = normalizeDocument(input.txCounterpartyDocument)
  const agDoc = normalizeDocument(input.agencyDocument)
  if (txDoc && agDoc && txDoc === agDoc) {
    score += 30
    methods.push('documento_exato')
  } else if (input.txCounterpartyName && input.agencyName) {
    const txName = input.txCounterpartyName.toLowerCase()
    const agName = input.agencyName.toLowerCase()
    const firstWord = (s: string) => s.trim().split(/\s+/)[0] || ''
    if (txName.includes(firstWord(agName)) || agName.includes(firstWord(txName))) {
      score += 10
      methods.push('nome_aprox')
    }
  }

  return { score: Math.min(score, 100), method: methods.join('+') || 'nenhum' }
}
