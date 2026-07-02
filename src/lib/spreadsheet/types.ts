/**
 * SpreadsheetParser — abstração de parsing de planilhas (T-24).
 *
 * Isola o vendor (hoje ExcelJS; antes `xlsx`, removido por prototype pollution +
 * ReDoS sem patch — ver docs/SECURITY_AUDIT.md F-08/T-24). Todo consumo de xlsx
 * DEVE passar por esta interface — proíbe lock-in e centraliza validação/segurança.
 */

/** Entrada aceita: Buffer (server) ou ArrayBuffer (browser). */
export type SpreadsheetInput = Buffer | ArrayBuffer | Uint8Array

export interface SpreadsheetSheetCsv {
  name: string
  csv: string
}

export interface SpreadsheetParser {
  /**
   * Lê a PRIMEIRA aba como matriz de strings (equivalente ao antigo
   * `XLSX.utils.sheet_to_json(ws, { header: 1 })`). Células vazias viram ''.
   */
  readRows(input: SpreadsheetInput): Promise<string[][]>

  /**
   * Lê TODAS as abas, cada uma serializada em CSV (equivalente ao antigo
   * `XLSX.utils.sheet_to_csv` por aba). Abas vazias são omitidas.
   */
  readSheetsAsCsv(input: SpreadsheetInput): Promise<SpreadsheetSheetCsv[]>
}

/** Limites de segurança/DoS aplicados no parsing (validados no adapter). */
export const SPREADSHEET_LIMITS = {
  /** Tamanho máximo do arquivo em bytes (10 MB). */
  maxBytes: 10 * 1024 * 1024,
  /** Máximo de linhas processadas por aba (anti-DoS). */
  maxRows: 100_000,
  /** Máximo de colunas consideradas por linha. */
  maxCols: 1_000,
} as const

export class SpreadsheetTooLargeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SpreadsheetTooLargeError'
  }
}
