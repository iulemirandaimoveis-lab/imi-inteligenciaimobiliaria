import {
  parseIntent,
  rankByIntent,
  explainFit,
  intentsToProfile,
  mergeDatasets,
  nationalDataset,
  DEFAULT_INTENTS,
  INTENTS,
  type NationalNeighborhood,
} from '@/app/[lang]/(website)/inteligencia/intentEngine'

const dataset: NationalNeighborhood[] = [
  // Valoriza muito, vende rápido, yield alto, m² médio.
  { neighborhood: 'Alfa', city: 'Recife', state: 'PE', median_price_sqm: 8000, price_trend_12m: 12, avg_days_on_market: 40, avg_rental_yield: 7.5 },
  // Caro e consolidado, valorização e yield menores, vende devagar.
  { neighborhood: 'Beta', city: 'São Paulo', state: 'SP', median_price_sqm: 16000, price_trend_12m: 5, avg_days_on_market: 90, avg_rental_yield: 4.5 },
  // Barato, mediano em tudo.
  { neighborhood: 'Gama', city: 'Manaus', state: 'AM', median_price_sqm: 4000, price_trend_12m: 8, avg_days_on_market: 70, avg_rental_yield: 6.0 },
]

describe('parseIntent', () => {
  it('reconhece intenções em texto livre pt-BR, inclusive com acentos', () => {
    expect(parseIntent('quero renda de aluguel com liquidez em bairro que valoriza')).toEqual([
      'appreciation',
      'liquidity',
      'rental',
    ])
    expect(parseIntent('procuro algo de ALTO PADRÃO')).toEqual(['premium'])
    expect(parseIntent('entrada barata para começar')).toEqual(['affordable'])
  })

  it('retorna vazio quando nenhum padrão casa', () => {
    expect(parseIntent('bom dia')).toEqual([])
    expect(parseIntent('')).toEqual([])
  })
})

describe('rankByIntent', () => {
  it('retorna vazio sem intenções selecionadas', () => {
    expect(rankByIntent([], dataset)).toEqual([])
  })

  it('ranqueia por valorização: Alfa > Gama > Beta', () => {
    const out = rankByIntent(['appreciation'], dataset)
    expect(out.map((r) => r.neighborhood)).toEqual(['Alfa', 'Gama', 'Beta'])
    expect(out[0].fit).toBe(100)
    expect(out[2].fit).toBe(0)
  })

  it('inverte métricas onde menor é melhor (liquidez e entrada acessível)', () => {
    expect(rankByIntent(['liquidity'], dataset)[0].neighborhood).toBe('Alfa')
    expect(rankByIntent(['affordable'], dataset)[0].neighborhood).toBe('Gama')
    expect(rankByIntent(['premium'], dataset)[0].neighborhood).toBe('Beta')
  })

  it('combina intenções com pesos iguais e respeita o limite', () => {
    const out = rankByIntent(['appreciation', 'rental'], dataset, 2)
    expect(out).toHaveLength(2)
    expect(out[0].neighborhood).toBe('Alfa')
    out.forEach((r) => {
      expect(r.fit).toBeGreaterThanOrEqual(0)
      expect(r.fit).toBeLessThanOrEqual(100)
      expect(r.factors).toHaveLength(2)
    })
  })

  it('opera sobre o dataset nacional real sem NaN', () => {
    const out = rankByIntent(DEFAULT_INTENTS)
    expect(out.length).toBeGreaterThan(0)
    out.forEach((r) => expect(Number.isFinite(r.fit)).toBe(true))
  })
})

describe('explainFit', () => {
  it('explica os fatores dominantes com percentil nacional', () => {
    const [top] = rankByIntent(['appreciation', 'liquidity'], dataset)
    const text = explainFit(top)
    expect(text).toContain('valoriza +12,0% em 12m')
    expect(text).toContain('vende em ~40 dias')
    expect(text).toMatch(/à frente de \d+% do Brasil\./)
  })
})

describe('intentsToProfile', () => {
  it('renda/valorização sem sinal de moradia → investor', () => {
    expect(intentsToProfile(['rental'])).toBe('investor')
    expect(intentsToProfile(['appreciation', 'liquidity'])).toBe('investor')
  })

  it('moradia (padrão/entrada) sem sinal de investimento → resident', () => {
    expect(intentsToProfile(['premium'])).toBe('resident')
    expect(intentsToProfile(['affordable', 'liquidity'])).toBe('resident')
  })

  it('misto, só liquidez ou vazio → all', () => {
    expect(intentsToProfile(['rental', 'premium'])).toBe('all')
    expect(intentsToProfile(['liquidity'])).toBe('all')
    expect(intentsToProfile([])).toBe('all')
  })
})

describe('mergeDatasets', () => {
  const fallback = nationalDataset()

  it('linha real sobrepõe o fallback do mesmo bairro (sem acento/caixa) e marca source live', () => {
    const merged = mergeDatasets(fallback, [
      { neighborhood: 'cabo branco', city: 'JOÃO PESSOA', state: 'PB', median_price_sqm: '8500', price_trend_12m: '15.8', avg_days_on_market: 38, avg_rental_yield: '5.8' },
    ])
    expect(merged).toHaveLength(fallback.length)
    const row = merged.find((n) => n.neighborhood === 'cabo branco')
    expect(row).toMatchObject({ median_price_sqm: 8500, source: 'live' })
    expect(merged.filter((n) => /cabo branco/i.test(n.neighborhood))).toHaveLength(1)
  })

  it('bairro novo é adicionado; linha incompleta é descartada', () => {
    const merged = mergeDatasets(fallback, [
      { neighborhood: 'Barra Sul', city: 'Balneário Camboriú', state: 'SC', median_price_sqm: 22000, price_trend_12m: 20.2, avg_days_on_market: 30, avg_rental_yield: 4.2 },
      { neighborhood: 'Quebrado', city: 'Nulópolis', state: 'XX', median_price_sqm: null, price_trend_12m: 1, avg_days_on_market: 10, avg_rental_yield: 5 },
    ])
    expect(merged).toHaveLength(fallback.length + 1)
    expect(merged.find((n) => n.city === 'Balneário Camboriú')?.source).toBe('live')
    expect(merged.find((n) => n.city === 'Nulópolis')).toBeUndefined()
  })

  it('sem dados reais, retorna o fallback intacto e ranqueável', () => {
    const merged = mergeDatasets(fallback, [])
    expect(merged).toHaveLength(fallback.length)
    expect(rankByIntent(DEFAULT_INTENTS, merged).length).toBeGreaterThan(0)
  })
})

describe('dataset nacional', () => {
  it('cobre as 27 UFs com métricas completas', () => {
    const data = nationalDataset()
    const ufs = new Set(data.map((n) => n.state))
    expect(ufs.size).toBe(27)
    data.forEach((n) => {
      expect(n.median_price_sqm).toBeGreaterThan(0)
      expect(n.avg_days_on_market).toBeGreaterThan(0)
    })
  })

  it('INTENTS e DEFAULT_INTENTS são consistentes', () => {
    const keys = INTENTS.map((i) => i.key)
    DEFAULT_INTENTS.forEach((k) => expect(keys).toContain(k))
  })
})
