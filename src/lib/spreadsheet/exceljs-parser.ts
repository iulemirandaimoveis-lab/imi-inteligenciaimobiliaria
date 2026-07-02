/**
 * ExcelJS implementation of SpreadsheetParser (T-24).
 * ExcelJS é carregado via dynamic import para não pesar no bundle de quem só
 * importa os tipos, e roda tanto no server (Buffer) quanto no browser (ArrayBuffer).
 */
import {
  SpreadsheetParser,
  SpreadsheetInput,
  SpreadsheetSheetCsv,
  SPREADSHEET_LIMITS,
  SpreadsheetTooLargeError,
} from './types'

function byteLength(input: SpreadsheetInput): number {
  if (input instanceof ArrayBuffer) return input.byteLength
  // Buffer e Uint8Array expõem .length/.byteLength
  return (input as Uint8Array).byteLength ?? (input as Uint8Array).length ?? 0
}

function toArrayBuffer(input: SpreadsheetInput): ArrayBuffer {
  if (input instanceof ArrayBuffer) return input
  const view = input as Uint8Array
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer
}

/**
 * Coage qualquer valor de célula ExcelJS para string estável.
 * Cobre: null, número, boolean, Date, fórmula ({formula,result}), richText,
 * hyperlink ({text,hyperlink}) e erro ({error}).
 */
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>
    if ('error' in v) return String(v.error ?? '')
    if ('result' in v) return cellToString(v.result) // fórmula: usa o resultado
    if ('text' in v) return String(v.text ?? '') // hyperlink
    if ('richText' in v && Array.isArray(v.richText)) {
      return (v.richText as Array<{ text?: string }>).map(r => r.text ?? '').join('')
    }
    if ('formula' in v) return '' // fórmula sem result calculado
  }
  return String(value)
}

function csvEscape(s: string): string {
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

async function loadWorkbook(input: SpreadsheetInput) {
  const bytes = byteLength(input)
  if (bytes > SPREADSHEET_LIMITS.maxBytes) {
    throw new SpreadsheetTooLargeError(
      `Arquivo excede o limite de ${SPREADSHEET_LIMITS.maxBytes / (1024 * 1024)} MB.`
    )
  }
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(toArrayBuffer(input))
  return workbook
}

export const excelJsParser: SpreadsheetParser = {
  async readRows(input: SpreadsheetInput): Promise<string[][]> {
    const workbook = await loadWorkbook(input)
    const ws = workbook.worksheets[0]
    if (!ws) return []
    const rows: string[][] = []
    let rowCount = 0
    ws.eachRow({ includeEmpty: true }, (row) => {
      if (rowCount >= SPREADSHEET_LIMITS.maxRows) return
      rowCount++
      // row.values é 1-indexed (índice 0 é vazio). Normaliza para 0-indexed.
      const values = Array.isArray(row.values) ? row.values.slice(1) : []
      const cells = values
        .slice(0, SPREADSHEET_LIMITS.maxCols)
        .map((v) => cellToString(v))
      rows.push(cells)
    })
    // Remove linhas totalmente vazias no fim (comportamento próximo ao antigo).
    while (rows.length && rows[rows.length - 1].every((c) => c === '')) rows.pop()
    return rows
  },

  async readSheetsAsCsv(input: SpreadsheetInput): Promise<SpreadsheetSheetCsv[]> {
    const workbook = await loadWorkbook(input)
    const out: SpreadsheetSheetCsv[] = []
    for (const ws of workbook.worksheets) {
      const lines: string[] = []
      let rowCount = 0
      ws.eachRow({ includeEmpty: false }, (row) => {
        if (rowCount >= SPREADSHEET_LIMITS.maxRows) return
        rowCount++
        const values = Array.isArray(row.values) ? row.values.slice(1) : []
        lines.push(
          values
            .slice(0, SPREADSHEET_LIMITS.maxCols)
            .map((v) => csvEscape(cellToString(v)))
            .join(',')
        )
      })
      const csv = lines.join('\n')
      if (csv.trim()) out.push({ name: ws.name, csv })
    }
    return out
  },
}
