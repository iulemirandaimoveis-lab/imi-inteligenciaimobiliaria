/**
 * @jest-environment node
 */

import {
  parseCsv,
  extractAvailability,
  extractAvailabilityFromCsv,
} from '@/lib/lots/miguel-marques-availability'

describe('miguel-marques-availability', () => {
  // Reproduz o layout real da planilha Mi Gestão: blocos [LOTE,M2,VALOR,DISPONIBILIDADE]
  // repetidos na horizontal (separados por coluna em branco), quadras empilhadas na vertical.
  const csv = [
    'QUADRA A,,,,,QUADRA G,,,',
    'LOTE,M2,VALOR,DISPONIBILIDADE,,LOTE,M2,VALOR,DISPONIBILIDADE',
    '1,247,38726,VENDIDO,,1.0,145,28117,DISPONÍVEL',
    '2,137,21454,DISPONÍVEL,,2,160,31000,NEGOCIAÇÃO',
    '3,167,26207,PROPRIETÁRIO,,3,160,31000,VENDIDO',
    'QUADRA B,,,,,,,,',
    'LOTE,M2,VALOR,DISPONIBILIDADE,,,,,',
    '1,169,26479,VENDIDO,,,,,',
    '2,231,36182,DISPONÍVEL,,,,,',
  ].join('\n')

  it('parses quoted CSV fields with embedded commas/newlines', () => {
    const rows = parseCsv('a,"b,c","line1\nline2",d')
    expect(rows[0]).toEqual(['a', 'b,c', 'line1\nline2', 'd'])
  })

  it('extracts availability keyed by `${quadra}-${lote}` matching CAD ids', () => {
    const map = extractAvailabilityFromCsv(csv)
    expect(map['A-1']).toBe('vendido')
    expect(map['A-2']).toBe('disponivel')
    expect(map['A-3']).toBe('proprietario')
    expect(map['G-1']).toBe('disponivel') // "1.0" → lote 1
    expect(map['G-2']).toBe('negociacao')
    expect(map['G-3']).toBe('vendido')
    expect(map['B-1']).toBe('vendido')
    expect(map['B-2']).toBe('disponivel')
  })

  it('ignores header rows and unknown statuses', () => {
    const map = extractAvailabilityFromCsv(csv)
    expect(map['A-LOTE']).toBeUndefined()
    expect(Object.keys(map)).toHaveLength(8)
  })

  it('returns an empty map for empty/garbage input', () => {
    expect(extractAvailability([])).toEqual({})
    expect(extractAvailabilityFromCsv('foo,bar\n1,2,3')).toEqual({})
  })
})
