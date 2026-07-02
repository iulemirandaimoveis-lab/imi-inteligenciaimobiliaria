/**
 * Ponto de entrada do parser de planilhas (T-24).
 * Consumidores importam daqui — nunca `xlsx`/`exceljs` diretamente.
 */
export type {
  SpreadsheetParser,
  SpreadsheetInput,
  SpreadsheetSheetCsv,
} from './types'
export { SPREADSHEET_LIMITS, SpreadsheetTooLargeError } from './types'
export { excelJsParser } from './exceljs-parser'

import { excelJsParser } from './exceljs-parser'
import type { SpreadsheetInput } from './types'

/** Implementação padrão do projeto. Troca de vendor = trocar só aqui. */
export const spreadsheetParser = excelJsParser

/** Atalho: primeira aba como matriz de strings. */
export function readSpreadsheetRows(input: SpreadsheetInput) {
  return spreadsheetParser.readRows(input)
}

/** Atalho: todas as abas em CSV. */
export function readSpreadsheetSheetsAsCsv(input: SpreadsheetInput) {
  return spreadsheetParser.readSheetsAsCsv(input)
}
