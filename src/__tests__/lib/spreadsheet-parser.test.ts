/**
 * @jest-environment node
 */

/**
 * T-24 — Testes do adapter de planilha (ExcelJS), substituindo `xlsx`.
 * Gera planilhas reais com ExcelJS e valida readRows / readSheetsAsCsv,
 * incluindo casos de borda e limites de segurança.
 */
import ExcelJS from 'exceljs'
import {
  readSpreadsheetRows,
  readSpreadsheetSheetsAsCsv,
  SpreadsheetTooLargeError,
  SPREADSHEET_LIMITS,
} from '@/lib/spreadsheet'

async function buildXlsx(build: (wb: ExcelJS.Workbook) => void): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  build(wb)
  const out = await wb.xlsx.writeBuffer()
  return Buffer.from(out)
}

describe('T-24 — SpreadsheetParser (ExcelJS)', () => {
  it('lê a primeira aba como matriz de strings (cabeçalho + dados)', async () => {
    const buf = await buildXlsx((wb) => {
      const ws = wb.addWorksheet('Lotes')
      ws.addRow(['Quadra', 'Lote', 'Área', 'Valor'])
      ws.addRow(['A', '01', 250.5, 180000])
      ws.addRow(['A', '02', 300, 210000])
    })
    const rows = await readSpreadsheetRows(buf)
    expect(rows[0]).toEqual(['Quadra', 'Lote', 'Área', 'Valor'])
    expect(rows[1]).toEqual(['A', '01', '250.5', '180000'])
    expect(rows.length).toBe(3)
  })

  it('planilha vazia → matriz vazia', async () => {
    const buf = await buildXlsx((wb) => { wb.addWorksheet('Empty') })
    const rows = await readSpreadsheetRows(buf)
    expect(rows).toEqual([])
  })

  it('coage fórmula (usa result), data (ISO) e boolean', async () => {
    const buf = await buildXlsx((wb) => {
      const ws = wb.addWorksheet('Mix')
      ws.addRow(['formula', 'data', 'bool'])
      const r = ws.addRow([])
      r.getCell(1).value = { formula: 'A1', result: 42 }
      r.getCell(2).value = new Date('2026-07-02T00:00:00Z')
      r.getCell(3).value = true
    })
    const rows = await readSpreadsheetRows(buf)
    expect(rows[1][0]).toBe('42')
    expect(rows[1][1]).toContain('2026-07-02')
    expect(rows[1][2]).toBe('true')
  })

  it('preserva unicode e caracteres especiais (CPF/CNPJ, acentos)', async () => {
    const buf = await buildXlsx((wb) => {
      const ws = wb.addWorksheet('Doc')
      ws.addRow(['Nome', 'CPF', 'Obs'])
      ws.addRow(['José Ção', '123.456.789-09', 'áçãõ, "aspas"'])
    })
    const rows = await readSpreadsheetRows(buf)
    expect(rows[1][0]).toBe('José Ção')
    expect(rows[1][1]).toBe('123.456.789-09')
    expect(rows[1][2]).toBe('áçãõ, "aspas"')
  })

  it('readSheetsAsCsv serializa todas as abas com escaping correto', async () => {
    const buf = await buildXlsx((wb) => {
      const s1 = wb.addWorksheet('S1')
      s1.addRow(['a', 'b,c', 'd"e'])
      const s2 = wb.addWorksheet('S2')
      s2.addRow(['x', 'y'])
    })
    const sheets = await readSpreadsheetSheetsAsCsv(buf)
    expect(sheets.map((s) => s.name)).toEqual(['S1', 'S2'])
    // vírgula e aspas exigem escaping CSV
    expect(sheets[0].csv).toBe('a,"b,c","d""e"')
    expect(sheets[1].csv).toBe('x,y')
  })

  it('omite abas vazias no readSheetsAsCsv', async () => {
    const buf = await buildXlsx((wb) => {
      wb.addWorksheet('Vazia')
      const s = wb.addWorksheet('Cheia')
      s.addRow(['ok'])
    })
    const sheets = await readSpreadsheetSheetsAsCsv(buf)
    expect(sheets.map((s) => s.name)).toEqual(['Cheia'])
  })

  it('arquivo acima do limite → SpreadsheetTooLargeError (anti-DoS)', async () => {
    const tooBig = Buffer.alloc(SPREADSHEET_LIMITS.maxBytes + 1)
    await expect(readSpreadsheetRows(tooBig)).rejects.toBeInstanceOf(SpreadsheetTooLargeError)
  })

  it('arquivo corrompido/não-xlsx → rejeita (não trava)', async () => {
    const garbage = Buffer.from('isto não é uma planilha', 'utf8')
    await expect(readSpreadsheetRows(garbage)).rejects.toBeDefined()
  })
})
