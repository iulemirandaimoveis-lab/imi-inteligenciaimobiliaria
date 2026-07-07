/**
 * @jest-environment node
 */

/**
 * Quadro Amostral — testes do saneamento por faixa de mercado (NBR 14653-2).
 * Reproduz os números do laudo-modelo real (Nielda / Boa Viagem, Recife).
 */

import {
  calcularQuadroAmostral,
  arredondamentoTecnico,
  type AmostraElemento,
} from '@/lib/valuation/quadro-amostral'

// Amostra R$/m² do laudo-modelo (20 elementos, Boa Viagem/Recife)
const AMOSTRA_M2 = [
  5947.95, 6818.18, 7636.36, 7699.12, 6451.61, 8024.69, 7758.62, 5826.09,
  5363.64, 5769.23, 6410.26, 5434.78, 5769.23, 6608.70, 7653.85, 8076.92,
  6259.84, 6782.61, 6250.0, 5950.41,
]

function amostra(): AmostraElemento[] {
  return AMOSTRA_M2.map((v) => ({ valorM2: v, bairro: 'Boa Viagem' }))
}

const round2 = (v: number) => Math.round(v * 100) / 100

describe('arredondamentoTecnico', () => {
  it('arredonda 807.281,92 para 815.000 (maior múltiplo de 5k dentro de +1%)', () => {
    expect(arredondamentoTecnico(807281.92, 5000, 0.01)).toBe(815000)
  })

  it('nunca reduz o valor bruto', () => {
    const v = arredondamentoTecnico(500000, 5000, 0.01)
    expect(v).toBeGreaterThanOrEqual(500000)
  })

  it('respeita o passo de arredondamento', () => {
    expect(arredondamentoTecnico(100000, 10000, 0.01) % 10000).toBe(0)
  })
})

describe('calcularQuadroAmostral', () => {
  it('reproduz a média inicial e a faixa ±20% do laudo-modelo', () => {
    const r = calcularQuadroAmostral(amostra(), 128)
    // média inicial dos 20 elementos brutos ≈ 6.624/m²
    expect(r.mediaInicial).toBeGreaterThan(6600)
    expect(r.mediaInicial).toBeLessThan(6650)
    expect(r.toleranciaPct).toBe(20)
    // limites ±20%
    expect(r.limiteSuperiorFaixa).toBeCloseTo(r.mediaInicial * 1.2, 0)
    expect(r.limiteInferiorFaixa).toBeCloseTo(r.mediaInicial * 0.8, 0)
  })

  it('elimina os discrepantes fora da faixa (saneamento)', () => {
    const r = calcularQuadroAmostral(amostra(), 128)
    // 8.076,92 e 8.024,69 estão acima do limite superior (~7.814)
    expect(r.nEliminados).toBeGreaterThanOrEqual(1)
    const eliminados = r.amostras.filter((a) => a.eliminado)
    for (const e of eliminados) {
      expect(
        e.valorM2 > r.limiteSuperiorFaixa || e.valorM2 < r.limiteInferiorFaixa,
      ).toBe(true)
    }
  })

  it('o saneamento reduz a dispersão (CV pós ≤ CV inicial)', () => {
    const r = calcularQuadroAmostral(amostra(), 128)
    expect(r.coeficienteVariacaoSaneado).toBeLessThanOrEqual(
      r.coeficienteVariacao,
    )
    expect(r.valorBruto).toBe(round2(r.valorUnitarioMedio * 128))
  })

  it('reproduz a cadeia publicada do laudo-modelo (mean homog. → valor → faixa)', () => {
    // Amostra homogeneizada final do laudo (média 6.306,89/m²), área 128 m²
    const homogeneo: AmostraElemento[] = Array.from({ length: 5 }, () => ({
      valorM2: 6306.89,
    }))
    const r = calcularQuadroAmostral(homogeneo, 128)
    expect(r.valorUnitarioMedio).toBeCloseTo(6306.89, 1)
    expect(r.valorBruto).toBeCloseTo(807281.92, 0)
    expect(r.valorAdotado).toBe(815000)
    expect(r.limiteInferior).toBe(733500)
    expect(r.limiteSuperior).toBe(896500)
    expect(r.arredondamentoPct).toBeLessThanOrEqual(1)
  })

  it('calcula R$/m² a partir de valorTotal/area quando valorM2 ausente', () => {
    const els: AmostraElemento[] = [
      { valorTotal: 720000, area: 121.05 },
      { valorTotal: 900000, area: 132 },
      { valorTotal: 840000, area: 110 },
    ]
    const r = calcularQuadroAmostral(els, 120)
    expect(r.nInicial).toBe(3)
    expect(r.valorUnitarioMedio).toBeGreaterThan(0)
  })

  it('não zera a amostra mesmo com dispersão alta', () => {
    const els: AmostraElemento[] = [
      { valorM2: 1000 },
      { valorM2: 5000 },
      { valorM2: 20000 },
    ]
    const r = calcularQuadroAmostral(els, 100)
    expect(r.nSaneada).toBeGreaterThanOrEqual(3)
  })

  it('respeita opções customizadas de tolerância e faixa', () => {
    const r = calcularQuadroAmostral(amostra(), 128, {
      tolerancia: 0.1,
      faixa: 0.15,
    })
    expect(r.toleranciaPct).toBe(10)
    expect(r.faixaPct).toBe(15)
    // faixa mais estreita → mais eliminações
    expect(r.nEliminados).toBeGreaterThan(0)
  })

  it('lança erro sem elementos válidos', () => {
    expect(() => calcularQuadroAmostral([], 100)).toThrow()
    expect(() => calcularQuadroAmostral([{ valorM2: 0 }], 100)).toThrow()
  })
})
