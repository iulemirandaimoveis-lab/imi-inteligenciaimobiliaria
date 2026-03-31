/**
 * @jest-environment node
 */

/**
 * Valuation Engine Tests — NBR 14653
 * Tests for metodoComparativo, rossHeidecke, metodoRenda, and findComparables
 */

import {
  metodoComparativo,
  rossHeidecke,
  metodoRenda,
  findComparables,
  type Comparable,
  type PropertyInput,
  type RentCapitalizationInput,
} from '@/features/avaliacoes/services/valuation-engine'

// ── Mock supabaseAdmin ─────────────────────────────────────────

const mockLimit = jest.fn()
const mockLte = jest.fn().mockReturnValue({ limit: mockLimit })
const mockGte = jest.fn().mockReturnValue({ lte: mockLte })
const mockGtChain = {
  gt: jest.fn(),
  eq: jest.fn(),
  gte: mockGte,
  lte: mockLte,
  limit: mockLimit,
}
// Build a chainable mock — each method returns the chain
for (const key of Object.keys(mockGtChain)) {
  (mockGtChain as any)[key] = jest.fn().mockReturnValue(mockGtChain)
}
mockGtChain.limit = mockLimit

const mockSelect = jest.fn().mockReturnValue(mockGtChain)
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect })

jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: (...args: any[]) => mockFrom(...args),
  },
}))

// ── Fixtures ───────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]

function makeComparable(overrides: Partial<Comparable> = {}): Comparable {
  return {
    endereco: 'Ed. Teste — Boa Viagem, Recife',
    area: 80,
    valorVenda: 480_000,
    quartos: 3,
    vagas: 2,
    padrao: 'Normal',
    estado: 'Regular',
    distanciaKm: 0.5,
    dataColeta: TODAY,
    ...overrides,
  }
}

function makeProperty(overrides: Partial<PropertyInput> = {}): PropertyInput {
  return {
    area: 80,
    quartos: 3,
    vagas: 2,
    padrao: 'Normal',
    estado_conservacao: 'Regular',
    tipo: 'Apartamento',
    bairro: 'Boa Viagem',
    cidade: 'Recife',
    ...overrides,
  }
}

// ── metodoComparativo ──────────────────────────────────────────

describe('Valuation Engine', () => {
  describe('metodoComparativo', () => {
    it('returns grau_fundamentacao and grau_precisao with 6+ comparable samples and low CV', () => {
      const property = makeProperty()
      const comparables = Array.from({ length: 7 }, (_, i) =>
        makeComparable({ valorVenda: 470_000 + i * 5_000 }),
      )

      const result = metodoComparativo(property, comparables)

      expect(result.grau_fundamentacao).toBeDefined()
      expect(result.grau_precisao).toBeDefined()
      expect(['I', 'II', 'III']).toContain(result.grau_fundamentacao)
      expect(['I', 'II', 'III']).toContain(result.grau_precisao)
    })

    it('achieves Grau III fundamentacao with 6+ samples and CV <= 30', () => {
      const property = makeProperty()
      // Tight price cluster => low CV
      const comparables = Array.from({ length: 8 }, () =>
        makeComparable({ valorVenda: 480_000 }),
      )

      const result = metodoComparativo(property, comparables)

      expect(result.grau_fundamentacao).toBe('III')
      expect(result.estatisticas.coeficiente_variacao).toBeLessThanOrEqual(30)
    })

    it('calculates CV (coefficient of variation) correctly', () => {
      const property = makeProperty()
      const comparables = [
        makeComparable({ valorVenda: 400_000 }),
        makeComparable({ valorVenda: 500_000 }),
        makeComparable({ valorVenda: 450_000 }),
        makeComparable({ valorVenda: 475_000 }),
        makeComparable({ valorVenda: 525_000 }),
      ]

      const result = metodoComparativo(property, comparables)

      // CV = (stddev / mean) * 100 — should be a positive number
      expect(result.estatisticas.coeficiente_variacao).toBeGreaterThan(0)
      expect(result.estatisticas.coeficiente_variacao).toBeLessThan(100)
      // Verify CV is stddev/mean * 100
      const { media, desvio_padrao, coeficiente_variacao } = result.estatisticas
      if (media > 0) {
        expect(coeficiente_variacao).toBeCloseTo((desvio_padrao / media) * 100, 1)
      }
    })

    it('returns intervalo de confianca with min and max', () => {
      const property = makeProperty()
      const comparables = Array.from({ length: 5 }, () =>
        makeComparable({ valorVenda: 480_000 }),
      )

      const result = metodoComparativo(property, comparables)

      expect(result.valor_minimo).toBeDefined()
      expect(result.valor_maximo).toBeDefined()
      expect(result.valor_minimo).toBeLessThan(result.valor_total)
      expect(result.valor_maximo).toBeGreaterThan(result.valor_total)
      // Amplitude must be consistent with min/max
      expect(result.valor_minimo).toBe(
        Math.round(result.valor_total * (1 - result.amplitude / 100)),
      )
      expect(result.valor_maximo).toBe(
        Math.round(result.valor_total * (1 + result.amplitude / 100)),
      )
    })

    it('throws on empty samples array', () => {
      const property = makeProperty()

      expect(() => metodoComparativo(property, [])).toThrow(
        'Mínimo de 1 comparável necessário',
      )
    })

    it('handles all samples with the same price', () => {
      const property = makeProperty()
      const comparables = Array.from({ length: 6 }, () =>
        makeComparable({ valorVenda: 500_000 }),
      )

      const result = metodoComparativo(property, comparables)

      expect(result.estatisticas.desvio_padrao).toBe(0)
      expect(result.estatisticas.coeficiente_variacao).toBe(0)
      // All same price => Grau III fundamentacao (6+ samples, CV=0 <= 30)
      expect(result.grau_fundamentacao).toBe('III')
      expect(result.grau_precisao).toBe('III')
    })

    it('populates statistics correctly', () => {
      const property = makeProperty()
      const comparables = Array.from({ length: 5 }, (_, i) =>
        makeComparable({ valorVenda: 400_000 + i * 50_000 }),
      )

      const result = metodoComparativo(property, comparables)

      expect(result.estatisticas.n_amostras).toBe(5)
      expect(result.estatisticas.amostras_saneadas).toBeLessThanOrEqual(5)
      expect(result.estatisticas.media).toBeGreaterThan(0)
      expect(result.estatisticas.mediana).toBeGreaterThan(0)
    })
  })

  // ── rossHeidecke ─────────────────────────────────────────────

  describe('rossHeidecke', () => {
    const currentYear = new Date().getFullYear()
    const valorNovo = 500_000

    it('depreciacao increases with worse estado_conservacao', () => {
      const resultNovo = rossHeidecke(currentYear - 10, 60, 'Novo', valorNovo)
      const resultRegular = rossHeidecke(currentYear - 10, 60, 'Regular', valorNovo)
      const resultReparos = rossHeidecke(currentYear - 10, 60, 'Reparos Importantes', valorNovo)

      expect(resultNovo.depreciacao_total).toBeLessThan(resultRegular.depreciacao_total)
      expect(resultRegular.depreciacao_total).toBeLessThan(resultReparos.depreciacao_total)
    })

    it('idade_aparente affects result — older building has more depreciation', () => {
      const young = rossHeidecke(currentYear - 5, 60, 'Regular', valorNovo)
      const old = rossHeidecke(currentYear - 30, 60, 'Regular', valorNovo)

      expect(young.depreciacao_total).toBeLessThan(old.depreciacao_total)
      expect(young.idade_real).toBe(5)
      expect(old.idade_real).toBe(30)
    })

    it('valor_depreciado < custo_reproducao (valorNovo)', () => {
      const result = rossHeidecke(currentYear - 20, 60, 'Regular', valorNovo)

      expect(result.valor_depreciado).toBeLessThan(valorNovo)
      expect(result.valor_depreciado).toBeGreaterThan(0)
      // valor_residual + valor_depreciado = valorNovo
      expect(result.valor_residual + result.valor_depreciado).toBeCloseTo(valorNovo, -1)
    })

    it('brand new building has minimal depreciation', () => {
      const result = rossHeidecke(currentYear, 60, 'Novo', valorNovo)

      expect(result.idade_real).toBe(0)
      expect(result.depreciacao_total).toBe(0)
      expect(result.valor_residual).toBe(valorNovo)
    })

    it('building at end of useful life has high depreciation', () => {
      const result = rossHeidecke(currentYear - 60, 60, 'Regular', valorNovo)

      expect(result.idade_percentual).toBe(100)
      // depreciacao should be significant
      expect(result.depreciacao_total).toBeGreaterThan(50)
    })
  })

  // ── metodoRenda ──────────────────────────────────────────────

  describe('metodoRenda', () => {
    const property = makeProperty()

    it('calculates cap_rate and valor_pelo_rendimento for typical rental', () => {
      const input: RentCapitalizationInput = {
        renda_mensal: 3_000,
        taxa_capitalizacao: 7,
        vacancia: 5,
        despesas_operacionais: 10,
      }

      const result = metodoRenda(property, input)

      expect(result.taxa_capitalizacao).toBe(7)
      expect(result.valor_total).toBeGreaterThan(0)
      // yield_liquido should equal taxa_capitalizacao (by construction of direct capitalization)
      expect(result.yield_liquido).toBeCloseTo(input.taxa_capitalizacao, 1)
    })

    it('valor_pelo_rendimento is reasonable for Recife market', () => {
      const input: RentCapitalizationInput = {
        renda_mensal: 3_500,
        taxa_capitalizacao: 6,
        vacancia: 8,
        despesas_operacionais: 12,
      }

      const result = metodoRenda(property, input)

      // R$ 3500/month * ~80% net * 12 / 0.06 should be in range 400k-700k
      expect(result.valor_total).toBeGreaterThan(300_000)
      expect(result.valor_total).toBeLessThan(1_000_000)
      expect(result.renda_liquida_mensal).toBeLessThan(input.renda_mensal)
      expect(result.renda_liquida_anual).toBe(
        Number((result.renda_liquida_mensal * 12).toFixed(2)),
      )
    })

    it('handles zero receita (renda_mensal = 0)', () => {
      const input: RentCapitalizationInput = {
        renda_mensal: 0,
        taxa_capitalizacao: 7,
        vacancia: 5,
        despesas_operacionais: 10,
      }

      const result = metodoRenda(property, input)

      expect(result.valor_total).toBe(0)
      expect(result.renda_liquida_mensal).toBe(0)
      expect(result.renda_liquida_anual).toBe(0)
    })

    it('yield_bruto > yield_liquido when there are expenses and vacancy', () => {
      const input: RentCapitalizationInput = {
        renda_mensal: 4_000,
        taxa_capitalizacao: 8,
        vacancia: 10,
        despesas_operacionais: 15,
      }

      const result = metodoRenda(property, input)

      expect(result.yield_bruto).toBeGreaterThan(result.yield_liquido)
    })
  })

  // ── findComparables ──────────────────────────────────────────

  describe('findComparables', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      // Re-wire chain after clear
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue(mockGtChain)
      for (const key of Object.keys(mockGtChain)) {
        if (key !== 'limit') {
          (mockGtChain as any)[key].mockReturnValue(mockGtChain)
        }
      }
    })

    it('returns comparable properties filtered by city and price range +/-30%', async () => {
      const mockRows = [
        {
          unit_name: 'Apt 101',
          area: 75,
          total_price: 450_000,
          bedrooms: 3,
          parking_spots: 2,
          development: {
            name: 'Ed. Mar Azul',
            neighborhood: 'Boa Viagem',
            city: 'Recife',
            property_type: 'Apartamento',
            status: 'ready',
          },
        },
        {
          unit_name: 'Apt 202',
          area: 90,
          total_price: 520_000,
          bedrooms: 3,
          parking_spots: 1,
          development: {
            name: 'Ed. Sol Nascente',
            neighborhood: 'Pina',
            city: 'Recife',
            property_type: 'Apartamento',
            status: 'launch',
          },
        },
      ]

      mockLimit.mockResolvedValueOnce({ data: mockRows })

      const subject = makeProperty({ cidade: 'Recife' })
      const result = await findComparables(subject, { priceEstimate: 500_000, limit: 10 })

      expect(result.length).toBe(2)
      expect(result[0].area).toBe(75)
      expect(result[0].valorVenda).toBe(450_000)
      expect(result[1].valorVenda).toBe(520_000)
      // Verify supabase was called with the right table
      expect(mockFrom).toHaveBeenCalledWith('development_units')
    })

    it('sorts by distance first, then price proximity', async () => {
      const mockRows = [
        {
          unit_name: 'Far',
          area: 80,
          total_price: 500_000,
          bedrooms: 3,
          parking_spots: 1,
          development: {
            name: 'Ed. Longe',
            neighborhood: 'Aflitos',
            city: 'Recife',
            property_type: 'Apartamento',
            status: 'ready',
          },
        },
        {
          unit_name: 'Near',
          area: 80,
          total_price: 490_000,
          bedrooms: 3,
          parking_spots: 1,
          development: {
            name: 'Ed. Perto',
            neighborhood: 'Boa Viagem',
            city: 'Recife',
            property_type: 'Apartamento',
            status: 'ready',
          },
        },
      ]

      mockLimit.mockResolvedValueOnce({ data: mockRows })

      const subject = makeProperty({ bairro: 'Boa Viagem', cidade: 'Recife' })
      const result = await findComparables(subject, { priceEstimate: 500_000 })

      // Same neighborhood gets distanciaKm=0.5, different gets 3.0
      expect(result[0].distanciaKm).toBe(0.5) // Boa Viagem (near)
      expect(result[1].distanciaKm).toBe(3.0) // Aflitos (far)
    })

    it('returns empty array when no data is found', async () => {
      mockLimit.mockResolvedValueOnce({ data: [] })

      const subject = makeProperty()
      const result = await findComparables(subject)

      expect(result).toEqual([])
    })

    it('returns empty array on supabase error', async () => {
      mockLimit.mockRejectedValueOnce(new Error('DB error'))

      const subject = makeProperty()
      const result = await findComparables(subject)

      expect(result).toEqual([])
    })

    it('respects the limit parameter', async () => {
      const mockRows = Array.from({ length: 10 }, (_, i) => ({
        unit_name: `Apt ${i}`,
        area: 80,
        total_price: 450_000 + i * 10_000,
        bedrooms: 3,
        parking_spots: 1,
        development: {
          name: `Ed. ${i}`,
          neighborhood: 'Boa Viagem',
          city: 'Recife',
          property_type: 'Apartamento',
          status: 'ready',
        },
      }))

      mockLimit.mockResolvedValueOnce({ data: mockRows })

      const subject = makeProperty()
      const result = await findComparables(subject, { limit: 5 })

      expect(result.length).toBeLessThanOrEqual(5)
    })
  })
})
