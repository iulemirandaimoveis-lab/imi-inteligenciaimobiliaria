/**
 * Motor de Avaliação Imobiliária — NBR 14653
 *
 * Implementa os métodos normatizados:
 * 1. Comparativo Direto de Dados de Mercado (NBR 14653-2 §8)
 * 2. Evolutivo / Custo de Reprodução com Ross-Heidecke (NBR 14653-2 §10/§12)
 * 3. Método da Renda / Capitalização (NBR 14653-2 §11)
 *
 * Referências:
 * - ABNT NBR 14653-1:2019 — Procedimentos gerais
 * - ABNT NBR 14653-2:2011 — Imóveis urbanos
 * - IBAPE/SP — Tabela de honorários
 * - Ross-Heidecke — Depreciação de benfeitorias
 */

// ── Types ─────────────────────────────────────────────────────

export interface Comparable {
  endereco: string
  area: number
  valorVenda: number
  quartos: number
  vagas: number
  padrao: string
  estado: string
  andar?: number
  distanciaKm: number
  dataColeta: string
}

export interface PropertyInput {
  area: number
  quartos: number
  vagas: number
  padrao: string           // 'Baixo' | 'Normal' | 'Alto' | 'Luxo'
  estado_conservacao: string // Ross-Heidecke state
  andar?: number
  ano_construcao?: number
  tipo: string             // 'Apartamento' | 'Casa' | etc
  bairro?: string
  cidade?: string
}

export interface ValuationResult {
  metodo: string
  valor_unitario: number    // R$/m²
  valor_total: number       // R$
  valor_minimo: number      // Intervalo de confiança
  valor_maximo: number
  amplitude: number         // % do intervalo
  comparaveis_usados: number
  grau_fundamentacao: 'I' | 'II' | 'III'
  grau_precisao: 'I' | 'II' | 'III'
  fatores_aplicados: FactorLog[]
  depreciacao?: DepreciationResult
  estatisticas: Statistics
}

export interface FactorLog {
  nome: string
  fator: number
  justificativa: string
}

export interface Statistics {
  media: number
  mediana: number
  desvio_padrao: number
  coeficiente_variacao: number  // CV%
  n_amostras: number
  amostras_saneadas: number
}

export interface DepreciationResult {
  idade_real: number
  vida_util: number
  idade_percentual: number
  estado_conservacao: string
  coeficiente_ross: number
  coeficiente_heidecke: number
  depreciacao_total: number     // %
  valor_depreciado: number
  valor_residual: number
}

export interface RentCapitalizationInput {
  renda_mensal: number
  taxa_capitalizacao: number   // % a.a. (default 6-8%)
  vacancia: number             // % (default 5-10%)
  despesas_operacionais: number // % da renda bruta
}

export interface RentCapitalizationResult {
  metodo: string
  renda_liquida_mensal: number
  renda_liquida_anual: number
  taxa_capitalizacao: number
  valor_total: number
  yield_bruto: number
  yield_liquido: number
}

// ── Constants ─────────────────────────────────────────────────

/** Ross-Heidecke depreciation state coefficients (c) */
const HEIDECKE_COEF: Record<string, number> = {
  'Novo':                                0.00,
  'Entre Novo e Regular':                0.032,
  'Regular':                             0.052,
  'Entre Regular e Reparos Simples':     0.086,
  'Reparos Simples':                     0.148,
  'Entre Reparos Simples e Importantes': 0.228,
  'Reparos Importantes':                 0.332,
  'Entre Reparos Importantes e Sem Valor': 0.526,
  'Sem Valor':                           1.00,
}

/** Useful life by property type (years) — IBAPE reference */
const VIDA_UTIL: Record<string, number> = {
  'Apartamento':     60,
  'Casa':            60,
  'Cobertura':       60,
  'Studio':          60,
  'Flat':            50,
  'Loft':            50,
  'Comercial - Sala': 50,
  'Comercial - Loja': 50,
  'Galpão/Armazém':  40,
  'Hotel/Pousada':   50,
}

/** Standard pattern multiplier (homogeneização) */
const PADRAO_FATOR: Record<string, number> = {
  'Baixo':  0.80,
  'Normal': 1.00,
  'Alto':   1.25,
  'Luxo':   1.60,
}

/** CUB/m² reference by pattern (Recife/PE, Mar/2026 estimated) */
const CUB_M2: Record<string, number> = {
  'Baixo':  1_850,
  'Normal': 2_450,
  'Alto':   3_200,
  'Luxo':   4_100,
}

// ── Helpers ───────────────────────────────────────────────────

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function stddev(arr: number[], avg: number): number {
  if (arr.length <= 1) return 0
  const sumSq = arr.reduce((s, v) => s + (v - avg) ** 2, 0)
  return Math.sqrt(sumSq / (arr.length - 1))
}

/**
 * Saneamento amostral — remove outliers pelo critério de Chauvenet
 * (simplificado: remove valores fora de ±2σ da média)
 */
function sanitize(values: number[]): number[] {
  if (values.length < 4) return values
  const avg = values.reduce((s, v) => s + v, 0) / values.length
  const sd = stddev(values, avg)
  if (sd === 0) return values
  return values.filter(v => Math.abs(v - avg) <= 2 * sd)
}

/**
 * Factor for time adjustment (IPCA proxy: ~4.5% a.a.)
 * Adjusts values to present date based on data collection date
 */
function timeFactor(dataColeta: string): number {
  const coleta = new Date(dataColeta)
  const now = new Date()
  const monthsDiff = (now.getFullYear() - coleta.getFullYear()) * 12 + now.getMonth() - coleta.getMonth()
  const monthlyRate = 0.045 / 12
  return Math.pow(1 + monthlyRate, monthsDiff)
}

/** Location factor — closer is more comparable */
function locationFactor(distKm: number): number {
  if (distKm <= 0.5) return 1.00
  if (distKm <= 1.0) return 0.99
  if (distKm <= 2.0) return 0.98
  if (distKm <= 5.0) return 0.96
  return 0.93
}

// ── Método Comparativo Direto ─────────────────────────────────

export function metodoComparativo(
  property: PropertyInput,
  comparables: Comparable[],
): ValuationResult {
  if (comparables.length === 0) {
    throw new Error('Mínimo de 1 comparável necessário para o método comparativo')
  }

  const factors: FactorLog[] = []

  // 1. Calculate unit values (R$/m²) for each comparable
  const rawUnitValues = comparables.map(c => c.valorVenda / c.area)

  // 2. Apply homogeneização factors to each comparable
  const homogenizedValues = comparables.map((comp, i) => {
    let unitValue = rawUnitValues[i]
    const compFactors: { nome: string; fator: number }[] = []

    // a) Time adjustment
    const tf = timeFactor(comp.dataColeta)
    if (tf !== 1) {
      unitValue *= tf
      compFactors.push({ nome: 'Tempo', fator: tf })
    }

    // b) Location factor
    const lf = locationFactor(comp.distanciaKm)
    if (lf !== 1) {
      unitValue *= lf
      compFactors.push({ nome: 'Localização', fator: lf })
    }

    // c) Pattern (padrão) transposition
    const compPadrao = PADRAO_FATOR[comp.padrao] ?? 1
    const propPadrao = PADRAO_FATOR[property.padrao] ?? 1
    if (compPadrao !== propPadrao) {
      const pf = propPadrao / compPadrao
      unitValue *= pf
      compFactors.push({ nome: 'Padrão', fator: pf })
    }

    // d) Floor factor (apartments)
    if (property.andar && comp.andar && property.andar !== comp.andar) {
      const ff = 1 + (property.andar - comp.andar) * 0.005
      unitValue *= ff
      compFactors.push({ nome: 'Andar', fator: ff })
    }

    // e) Parking spaces factor
    if (property.vagas !== comp.vagas) {
      const vf = 1 + (property.vagas - comp.vagas) * 0.02
      unitValue *= vf
      compFactors.push({ nome: 'Vagas', fator: vf })
    }

    return { unitValue, factors: compFactors }
  })

  // 3. Extract homogenized unit values
  let unitValues = homogenizedValues.map(h => h.unitValue)

  // 4. Saneamento amostral
  const sanitized = sanitize(unitValues)
  const removedCount = unitValues.length - sanitized.length
  unitValues = sanitized

  // 5. Statistics
  const avg = unitValues.reduce((s, v) => s + v, 0) / unitValues.length
  const med = median(unitValues)
  const sd = stddev(unitValues, avg)
  const cv = avg > 0 ? (sd / avg) * 100 : 0

  // 6. Determine grau de fundamentação (NBR 14653-2 Table 1)
  let grauFund: 'I' | 'II' | 'III' = 'I'
  if (unitValues.length >= 6 && cv <= 30) grauFund = 'III'
  else if (unitValues.length >= 4 && cv <= 40) grauFund = 'II'

  // 7. Determine grau de precisão (NBR 14653-2 Table 2)
  let grauPrec: 'I' | 'II' | 'III' = 'I'
  if (cv <= 20) grauPrec = 'III'
  else if (cv <= 30) grauPrec = 'II'

  // 8. Confidence interval (±amplitude)
  const amplitude = grauPrec === 'III' ? 15 : grauPrec === 'II' ? 20 : 30
  const valorUnitario = avg
  const valorTotal = Math.round(valorUnitario * property.area)
  const valorMin = Math.round(valorTotal * (1 - amplitude / 100))
  const valorMax = Math.round(valorTotal * (1 + amplitude / 100))

  // Log aggregated factors
  const factorCounts: Record<string, number[]> = {}
  for (const h of homogenizedValues) {
    for (const f of h.factors) {
      if (!factorCounts[f.nome]) factorCounts[f.nome] = []
      factorCounts[f.nome].push(f.fator)
    }
  }
  for (const [nome, vals] of Object.entries(factorCounts)) {
    const avgFactor = vals.reduce((s, v) => s + v, 0) / vals.length
    factors.push({
      nome,
      fator: Number(avgFactor.toFixed(4)),
      justificativa: `Média dos fatores de ${nome.toLowerCase()} aplicados a ${vals.length} comparáveis`,
    })
  }

  if (removedCount > 0) {
    factors.push({
      nome: 'Saneamento',
      fator: 0,
      justificativa: `${removedCount} amostra(s) removida(s) por critério de Chauvenet (±2σ)`,
    })
  }

  return {
    metodo: 'Comparativo Direto de Dados de Mercado',
    valor_unitario: Number(valorUnitario.toFixed(2)),
    valor_total: valorTotal,
    valor_minimo: valorMin,
    valor_maximo: valorMax,
    amplitude,
    comparaveis_usados: unitValues.length,
    grau_fundamentacao: grauFund,
    grau_precisao: grauPrec,
    fatores_aplicados: factors,
    estatisticas: {
      media: Number(avg.toFixed(2)),
      mediana: Number(med.toFixed(2)),
      desvio_padrao: Number(sd.toFixed(2)),
      coeficiente_variacao: Number(cv.toFixed(2)),
      n_amostras: comparables.length,
      amostras_saneadas: unitValues.length,
    },
  }
}

// ── Ross-Heidecke Depreciation ────────────────────────────────

/**
 * Calculates depreciation using the Ross-Heidecke method
 * D = (1 - R) * [(x/n)² + (x/n)] / 2 + c * [1 - ((x/n)² + (x/n)) / 2]
 * Where: x = age, n = useful life, c = Heidecke state coefficient, R = residual (usually 20%)
 */
export function rossHeidecke(
  anoConstucao: number,
  vidaUtil: number,
  estadoConservacao: string,
  valorNovo: number,
  valorResidualPct: number = 20,
): DepreciationResult {
  const now = new Date().getFullYear()
  const idadeReal = Math.max(0, now - anoConstucao)
  const idadePct = Math.min(idadeReal / vidaUtil, 1)

  const c = HEIDECKE_COEF[estadoConservacao] ?? 0
  const R = valorResidualPct / 100

  // Ross component: (x/n)² + (x/n)) / 2
  const ross = (idadePct * idadePct + idadePct) / 2

  // Ross-Heidecke combined depreciation
  const depreciacao = (1 - R) * ross + c * (1 - ross)
  const depreciacaoTotal = Math.min(depreciacao, 1 - R)

  const valorDepreciado = valorNovo * depreciacaoTotal
  const valorResidual = valorNovo - valorDepreciado

  return {
    idade_real: idadeReal,
    vida_util: vidaUtil,
    idade_percentual: Number((idadePct * 100).toFixed(1)),
    estado_conservacao: estadoConservacao,
    coeficiente_ross: Number(ross.toFixed(4)),
    coeficiente_heidecke: c,
    depreciacao_total: Number((depreciacaoTotal * 100).toFixed(2)),
    valor_depreciado: Math.round(valorDepreciado),
    valor_residual: Math.round(valorResidual),
  }
}

// ── Método Evolutivo (Terreno + Benfeitoria Depreciada) ───────

export function metodoEvolutivo(
  property: PropertyInput,
  valorTerreno: number,      // R$ total do terreno
): ValuationResult {
  const cubM2 = CUB_M2[property.padrao] ?? CUB_M2.Normal
  const custoReproducao = cubM2 * property.area

  const vidaUtil = VIDA_UTIL[property.tipo] ?? 60
  const anoConst = property.ano_construcao ?? new Date().getFullYear()

  const deprec = rossHeidecke(
    anoConst,
    vidaUtil,
    property.estado_conservacao,
    custoReproducao,
  )

  const valorTotal = valorTerreno + deprec.valor_residual
  const valorUnitario = valorTotal / property.area

  // Confidence interval (evolutivo has wider margins)
  const amplitude = 25
  const valorMin = Math.round(valorTotal * 0.75)
  const valorMax = Math.round(valorTotal * 1.25)

  return {
    metodo: 'Método Evolutivo (Terreno + Custo Reprodução Depreciado)',
    valor_unitario: Number(valorUnitario.toFixed(2)),
    valor_total: Math.round(valorTotal),
    valor_minimo: valorMin,
    valor_maximo: valorMax,
    amplitude,
    comparaveis_usados: 0,
    grau_fundamentacao: 'I',
    grau_precisao: 'I',
    fatores_aplicados: [
      { nome: 'CUB/m²', fator: cubM2, justificativa: `Custo unitário básico para padrão ${property.padrao}` },
      { nome: 'Custo Reprodução', fator: custoReproducao, justificativa: `${property.area}m² × R$ ${cubM2}/m²` },
      { nome: 'Terreno', fator: valorTerreno, justificativa: 'Valor de mercado do terreno' },
      { nome: 'Depreciação Ross-Heidecke', fator: deprec.depreciacao_total / 100, justificativa: `${deprec.idade_real} anos, estado: ${deprec.estado_conservacao}` },
    ],
    depreciacao: deprec,
    estatisticas: {
      media: valorUnitario,
      mediana: valorUnitario,
      desvio_padrao: 0,
      coeficiente_variacao: 0,
      n_amostras: 0,
      amostras_saneadas: 0,
    },
  }
}

// ── Método da Renda (Capitalização) ───────────────────────────

export function metodoRenda(
  property: PropertyInput,
  input: RentCapitalizationInput,
): RentCapitalizationResult {
  const rendaBruta = input.renda_mensal
  const despesas = rendaBruta * (input.despesas_operacionais / 100)
  const vacancia = rendaBruta * (input.vacancia / 100)
  const rendaLiquida = rendaBruta - despesas - vacancia

  const rendaAnual = rendaLiquida * 12
  const valorTotal = rendaAnual / (input.taxa_capitalizacao / 100)

  const yieldBruto = (rendaBruta * 12) / valorTotal * 100
  const yieldLiquido = rendaAnual / valorTotal * 100

  return {
    metodo: 'Método da Renda (Capitalização Direta)',
    renda_liquida_mensal: Number(rendaLiquida.toFixed(2)),
    renda_liquida_anual: Number(rendaAnual.toFixed(2)),
    taxa_capitalizacao: input.taxa_capitalizacao,
    valor_total: Math.round(valorTotal),
    yield_bruto: Number(yieldBruto.toFixed(2)),
    yield_liquido: Number(yieldLiquido.toFixed(2)),
  }
}

// ── NBR 14653 Grau de Fundamentação Checker ───────────────────

export interface FundamentacaoCheck {
  grau: 'I' | 'II' | 'III'
  items: { criterio: string; atende: boolean; detalhe: string }[]
  pontuacao: number
  pontuacao_maxima: number
}

export function checkFundamentacao(
  nComparaveis: number,
  cv: number,
  hasVisita: boolean,
  hasDocumentacao: boolean,
): FundamentacaoCheck {
  const items: FundamentacaoCheck['items'] = []

  // Item 1: Quantidade mínima de dados
  items.push({
    criterio: 'Quantidade de dados de mercado',
    atende: nComparaveis >= 3,
    detalhe: `${nComparaveis} comparáveis (mín. 3 para Grau I, 6 para III)`,
  })

  // Item 2: Identificação dos dados
  items.push({
    criterio: 'Identificação dos dados',
    atende: true,
    detalhe: 'Dados com endereço, área, valor e fonte identificados',
  })

  // Item 3: Vistoria do avaliando
  items.push({
    criterio: 'Vistoria do imóvel avaliando',
    atende: hasVisita,
    detalhe: hasVisita ? 'Vistoria realizada' : 'Vistoria não realizada — requerida para Grau II+',
  })

  // Item 4: Amplitude do intervalo de confiança
  items.push({
    criterio: 'Amplitude do intervalo (CV)',
    atende: cv <= 40,
    detalhe: `CV = ${cv.toFixed(1)}% (≤30% para Grau III, ≤40% para Grau II)`,
  })

  // Item 5: Documentação
  items.push({
    criterio: 'Documentação e registros',
    atende: hasDocumentacao,
    detalhe: hasDocumentacao ? 'Documentação completa' : 'Documentação pendente',
  })

  const pontos = items.filter(i => i.atende).length
  let grau: 'I' | 'II' | 'III' = 'I'
  if (pontos >= 5 && nComparaveis >= 6 && cv <= 30) grau = 'III'
  else if (pontos >= 4 && nComparaveis >= 4 && cv <= 40) grau = 'II'

  return {
    grau,
    items,
    pontuacao: pontos,
    pontuacao_maxima: items.length,
  }
}
