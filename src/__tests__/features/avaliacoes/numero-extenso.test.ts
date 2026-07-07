/**
 * @jest-environment node
 */

import { numeroPorExtenso } from '@/lib/valuation/generate-ptam-html'

describe('numeroPorExtenso', () => {
  it('converte o valor do laudo-modelo (815.000)', () => {
    expect(numeroPorExtenso(815000)).toBe('oitocentos e quinze mil reais')
  })

  it('trata casos de borda', () => {
    expect(numeroPorExtenso(0)).toBe('zero reais')
    expect(numeroPorExtenso(1)).toBe('um real')
    expect(numeroPorExtenso(100)).toBe('cem reais')
    expect(numeroPorExtenso(1000)).toBe('mil reais')
  })

  it('converte milhares e centenas', () => {
    expect(numeroPorExtenso(733500)).toContain('setecentos e trinta e três mil')
    expect(numeroPorExtenso(896500)).toContain('oitocentos e noventa e seis mil')
    expect(numeroPorExtenso(250000)).toBe('duzentos e cinquenta mil reais')
  })

  it('converte milhões', () => {
    expect(numeroPorExtenso(1000000)).toBe('um milhão reais')
    expect(numeroPorExtenso(2500000)).toContain('dois milhões')
    expect(numeroPorExtenso(2500000)).toContain('quinhentos mil')
  })
})
