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
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheets: string[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(sheet)
    if (csv.trim()) {
      sheets.push(`## ${sheetName}\n${csv}`)
    }
  }

  return {
    text: sheets.join('\n\n'),
    format: 'xlsx',
    pageCount: workbook.SheetNames.length,
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
