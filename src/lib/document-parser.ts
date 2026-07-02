/**
 * Document Parser — Extracts text from .docx, .xlsx, and .pdf files.
 * Used by the KB processor to support additional document formats.
 */

export type SupportedFormat = 'docx' | 'xlsx' | 'pdf' | 'txt'

export interface ParsedDocument {
  text: string
  format: SupportedFormat
  pageCount?: number
}

export function detectFormat(fileName: string): SupportedFormat | null {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'docx' || ext === 'doc') return 'docx'
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx'
  if (ext === 'pdf') return 'pdf'
  if (ext === 'txt' || ext === 'md') return 'txt'
  return null
}

export async function parseDocument(buffer: Buffer, format: SupportedFormat): Promise<ParsedDocument> {
  switch (format) {
    case 'docx':
      return parseDocx(buffer)
    case 'xlsx':
      return parseXlsx(buffer)
    case 'pdf':
      return parsePdf(buffer)
    case 'txt':
      return { text: buffer.toString('utf-8'), format: 'txt' }
    default:
      throw new Error(`Formato não suportado: ${format}`)
  }
}

async function parseDocx(buffer: Buffer): Promise<ParsedDocument> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return {
    text: result.value,
    format: 'docx',
  }
}

async function parseXlsx(buffer: Buffer): Promise<ParsedDocument> {
  // T-24: parsing via adapter (ExcelJS) — sem dependência direta de vendor.
  const { readSpreadsheetSheetsAsCsv } = await import('@/lib/spreadsheet')
  const sheetsCsv = await readSpreadsheetSheetsAsCsv(buffer)
  const sheets = sheetsCsv.map(({ name, csv }) => `## ${name}\n${csv}`)

  return {
    text: sheets.join('\n\n'),
    format: 'xlsx',
    pageCount: sheetsCsv.length,
  }
}

async function parsePdf(buffer: Buffer): Promise<ParsedDocument> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParse = ((await import('pdf-parse')) as any).default || (await import('pdf-parse'))
  const result = await pdfParse(buffer)
  return {
    text: result.text,
    format: 'pdf',
    pageCount: result.numpages,
  }
}
