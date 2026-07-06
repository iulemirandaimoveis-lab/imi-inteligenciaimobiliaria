import 'server-only'
import type { NormalizedBankTransaction } from './types'

export class StatementCsvError extends Error {}

const HEADER_ALIASES: Record<string, string[]> = {
  date: ['data', 'data movimento', 'data lançamento', 'date'],
  description: ['descricao', 'descrição', 'historico', 'histórico', 'lancamento', 'lançamento', 'description'],
  amount: ['valor', 'amount', 'value'],
  type: ['tipo', 'type', 'entrada/saida', 'entrada/saída'],
  document: ['documento', 'cpf/cnpj', 'cpf_cnpj', 'documento pagador'],
  counterparty: ['pagador', 'nome', 'contraparte', 'counterparty', 'origem'],
}

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function detectDelimiter(firstLine: string): ',' | ';' {
  const semi = (firstLine.match(/;/g) || []).length
  const comma = (firstLine.match(/,/g) || []).length
  return semi >= comma ? ';' : ','
}

function splitCsvLine(line: string, delimiter: string): string[] {
  // Suporta campos entre aspas (para descrições com o próprio delimitador dentro)
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === delimiter && !inQuotes) {
      cells.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  cells.push(current)
  return cells.map((c) => c.trim().replace(/^"|"$/g, ''))
}

/** Converte valor no formato BR ("1.234,56" ou "-1234,56") ou já no formato "." decimal. */
function parseBrAmount(raw: string): number {
  const cleaned = raw.trim().replace(/^R\$\s*/i, '')
  const hasComma = cleaned.includes(',')
  const normalized = hasComma
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned
  const value = Number(normalized)
  if (!Number.isFinite(value)) throw new StatementCsvError(`Valor inválido no CSV: "${raw}"`)
  return value
}

function assertValidCalendarDate(year: string, month: string, day: string, raw: string): void {
  const m = Number(month)
  const d = Number(day)
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    throw new StatementCsvError(`Data inválida no CSV: "${raw}"`)
  }
}

function parseDate(raw: string): string {
  const s = raw.trim()
  // dd/mm/yyyy ou dd-mm-yyyy
  const br = s.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/)
  if (br) {
    assertValidCalendarDate(br[3], br[2], br[1], raw)
    return `${br[3]}-${br[2]}-${br[1]}`
  }
  // yyyy-mm-dd (já ISO)
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    assertValidCalendarDate(iso[1], iso[2], iso[3], raw)
    return `${iso[1]}-${iso[2]}-${iso[3]}`
  }
  throw new StatementCsvError(`Data inválida no CSV: "${raw}" (use dd/mm/aaaa ou aaaa-mm-dd)`)
}

/**
 * Faz o parse de um extrato exportado em CSV (formato comum de bancos BR:
 * colunas Data / Descrição / Valor, delimitador `;` ou `,`, decimal com vírgula).
 * Linhas que não puderem ser interpretadas são reportadas em `warnings`.
 */
export function parseStatementCsv(content: string): { transactions: NormalizedBankTransaction[]; warnings: string[] } {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) {
    throw new StatementCsvError('CSV vazio ou sem linhas de dados (esperado: cabeçalho + ao menos 1 lançamento)')
  }

  const delimiter = detectDelimiter(lines[0])
  const headerCells = splitCsvLine(lines[0], delimiter).map(normalizeHeader)

  const colIndex: Partial<Record<keyof typeof HEADER_ALIASES, number>> = {}
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    const idx = headerCells.findIndex((h) => aliases.includes(h))
    if (idx >= 0) colIndex[key as keyof typeof HEADER_ALIASES] = idx
  }

  if (colIndex.date === undefined || colIndex.amount === undefined) {
    throw new StatementCsvError(
      `Cabeçalho do CSV não reconhecido. Encontrado: [${headerCells.join(', ')}]. ` +
      'Esperado ao menos colunas de Data e Valor (ex: Data;Descrição;Valor).'
    )
  }

  const transactions: NormalizedBankTransaction[] = []
  const warnings: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delimiter)
    try {
      const date = parseDate(cells[colIndex.date!])
      const rawAmount = parseBrAmount(cells[colIndex.amount!])
      const typeCell = colIndex.type !== undefined ? cells[colIndex.type] : undefined
      const type: 'credito' | 'debito' = typeCell
        ? (/^c|entrada/i.test(typeCell) ? 'credito' : 'debito')
        : (rawAmount >= 0 ? 'credito' : 'debito')

      transactions.push({
        externalId: null,
        amount: Math.abs(rawAmount),
        type,
        description: colIndex.description !== undefined ? cells[colIndex.description] : '',
        counterpartyName: colIndex.counterparty !== undefined ? (cells[colIndex.counterparty] || null) : null,
        counterpartyDocument: colIndex.document !== undefined ? (cells[colIndex.document] || null) : null,
        date,
        raw: { line: lines[i] },
      })
    } catch (err) {
      warnings.push(`Linha ${i + 1}: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  return { transactions, warnings }
}
