// Motor de Descoberta por Intenção — traduz intenção do usuário em ranking
// de bairros sobre o dataset nacional. Puro e determinístico: sem IO, sem
// dependências — testável em unidade e executável no cliente.

import { BRAZIL_FALLBACK_CITIES } from './brazilIntelligenceFallback'

// ─── Intenções ────────────────────────────────────────────────────────────────

export type IntentKey = 'appreciation' | 'liquidity' | 'rental' | 'affordable' | 'premium'

export interface IntentDef {
  key: IntentKey
  label: string
  hint: string
}

export const INTENTS: IntentDef[] = [
  { key: 'appreciation', label: 'Valorização', hint: 'bairros com maior alta de preço em 12 meses' },
  { key: 'liquidity', label: 'Liquidez', hint: 'imóveis que vendem mais rápido' },
  { key: 'rental', label: 'Renda de aluguel', hint: 'maior yield anual de locação' },
  { key: 'affordable', label: 'Entrada acessível', hint: 'menor preço de entrada por m²' },
  { key: 'premium', label: 'Alto padrão', hint: 'endereços consolidados de maior valor' },
]

// Preset inicial: perfil investidor equilibrado.
export const DEFAULT_INTENTS: IntentKey[] = ['appreciation', 'liquidity', 'rental']

// ─── Parser de linguagem natural (pt-BR) ─────────────────────────────────────

const INTENT_PATTERNS: Record<IntentKey, RegExp> = {
  appreciation: /valoriz|aprecia|crescim|potencial|futuro/,
  liquidity: /liquid|vend[ae].{0,12}r[aá]pid|revend|sa[ií]da|gir[oa]/,
  rental: /alug|renda|yield|passiv|locac|locaç|airbnb|temporada/,
  affordable: /acess|barat|entrada|come[cç]|primeir|econ[oô]m/,
  premium: /alto padr|luxo|premium|consolidad|nobre|sofistic/,
}

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** Extrai intenções de um texto livre em português. */
export function parseIntent(text: string): IntentKey[] {
  const t = normalize(text)
  return INTENTS.map((i) => i.key).filter((key) =>
    INTENT_PATTERNS[key].test(t),
  )
}

// ─── Dataset nacional ─────────────────────────────────────────────────────────

export interface NationalNeighborhood {
  neighborhood: string
  city: string
  state: string
  median_price_sqm: number
  price_trend_12m: number
  avg_days_on_market: number
  avg_rental_yield: number
}

export function nationalDataset(): NationalNeighborhood[] {
  return BRAZIL_FALLBACK_CITIES.flatMap((c) =>
    c.neighborhoods.map((n) => ({
      neighborhood: n.neighborhood,
      city: c.city,
      state: c.state,
      median_price_sqm: n.median_price_sqm,
      price_trend_12m: n.price_trend_12m,
      avg_days_on_market: n.avg_days_on_market,
      avg_rental_yield: n.avg_rental_yield,
    })),
  )
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export interface FactorScore {
  intent: IntentKey
  /** 0–1: posição normalizada do bairro no Brasil para esta intenção. */
  value: number
  /** 0–100: percentil nacional (quanto maior, melhor para a intenção). */
  percentile: number
}

export interface RankedNeighborhood extends NationalNeighborhood {
  /** 0–100: aderência à intenção combinada. */
  fit: number
  factors: FactorScore[]
}

// Extrai o valor bruto orientado a "maior = melhor" para cada intenção.
function rawValue(n: NationalNeighborhood, intent: IntentKey): number {
  switch (intent) {
    case 'appreciation':
      return n.price_trend_12m
    case 'liquidity':
      return -n.avg_days_on_market
    case 'rental':
      return n.avg_rental_yield
    case 'affordable':
      return -n.median_price_sqm
    case 'premium':
      return n.median_price_sqm
  }
}

/**
 * Ranqueia o dataset por aderência às intenções selecionadas.
 * Normalização min-max por intenção sobre TODO o dataset; fit = média das
 * intenções ativas × 100. Empates resolvidos por ordem estável do dataset.
 */
export function rankByIntent(
  intents: IntentKey[],
  dataset: NationalNeighborhood[] = nationalDataset(),
  limit = 8,
): RankedNeighborhood[] {
  if (intents.length === 0 || dataset.length === 0) return []

  const ranges = intents.map((intent) => {
    const values = dataset.map((n) => rawValue(n, intent))
    const min = Math.min(...values)
    const max = Math.max(...values)
    return { intent, min, span: max - min || 1, values }
  })

  const scored = dataset.map((n, idx) => {
    const factors: FactorScore[] = ranges.map(({ intent, min, span, values }) => {
      const value = (values[idx] - min) / span
      const below = values.filter((v) => v < values[idx]).length
      return {
        intent,
        value,
        percentile: Math.round((below / (values.length - 1 || 1)) * 100),
      }
    })
    const exactFit =
      (factors.reduce((s, f) => s + f.value, 0) / factors.length) * 100
    return { ...n, fit: Math.round(exactFit), exactFit, factors }
  })

  return scored
    .sort((a, b) => b.exactFit - a.exactFit)
    .slice(0, limit)
    .map(({ exactFit: _exactFit, ...rest }) => rest)
}

// ─── Explicação ("por quê") ───────────────────────────────────────────────────

const fmtBRLCompact = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const fmtPct = (v: number) => v.toFixed(1).replace('.', ',')

function factorPhrase(n: RankedNeighborhood, f: FactorScore): string {
  switch (f.intent) {
    case 'appreciation':
      return `valoriza ${n.price_trend_12m > 0 ? '+' : ''}${fmtPct(n.price_trend_12m)}% em 12m`
    case 'liquidity':
      return `vende em ~${n.avg_days_on_market} dias`
    case 'rental':
      return `yield de ${fmtPct(n.avg_rental_yield)}% a.a.`
    case 'affordable':
      return `entrada em ${fmtBRLCompact(n.median_price_sqm)}/m²`
    case 'premium':
      return `m² consolidado em ${fmtBRLCompact(n.median_price_sqm)}`
  }
}

/** Uma frase em pt-BR explicando os fatores dominantes do resultado. */
export function explainFit(n: RankedNeighborhood): string {
  const top = [...n.factors].sort((a, b) => b.value - a.value).slice(0, 2)
  const phrases = top.map((f) => factorPhrase(n, f))
  const best = top[0]
  const suffix = best ? ` — à frente de ${best.percentile}% do Brasil` : ''
  return `${phrases.join(' e ')}${suffix}.`
}
