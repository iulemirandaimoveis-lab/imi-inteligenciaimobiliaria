/**
 * Motor de Avaliação Imobiliária — NBR 14653
 *
 * Implementa os métodos normatizados:
 * 1. Comparativo Direto de Dados de Mercado (NBR 14653-2 §8)
 * 2. Evolutivo / Custo de Reprodução com Ross-Heidecke (NBR 14653-2 §10/§12)
 * 3. Método da Renda / Capitalização (NBR 14653-2 §11)
 * 4. Método Involutivo / VGV (NBR 14653-2 §9)
 * 5. Cap Rate / NOI
 * 6. Fluxo de Caixa Descontado — DCF (NBR 14653-2 §11.3)
 * 7. Liquidação Forçada
 * 8. Cenários: Conservador / Realista / Agressivo
 * 9. BDI — Benefícios e Despesas Indiretas
 * 10. Fundo de Comércio / Ponto Comercial
 *
 * Referências:
 * - ABNT NBR 14653-1:2019 — Procedimentos gerais
 * - ABNT NBR 14653-2:2011 — Imóveis urbanos
 * - ABNT NBR 14653-3 — Imóveis rurais
 * - IBAPE/SP — Tabela de honorários
 * - Ross-Heidecke — Depreciação de benfeitorias
 * - João Diniz Marcello — Avaliação Mercadológica de Imóveis
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

// ── Auto-populate comparables from real DB data ─────────────────

/**
 * Server-side: find comparable properties for a given subject property.
 * Searches developments + units in the same city/neighborhood within ±30% price range.
 * Returns up to `limit` comparables formatted for the comparative method.
 */
export async function findComparables(
  subject: PropertyInput,
  options?: { priceEstimate?: number; limit?: number }
): Promise<Comparable[]> {
  const { priceEstimate = 0, limit = 10 } = options ?? {}

  try {
    const { supabaseAdmin } = await import('@/lib/supabase/admin')

    // Build query: same city, with units that have price and area data
    let query = supabaseAdmin
      .from('development_units')
      .select('unit_name, area, total_price, bedrooms, parking_spots, development:developments!inner(name, neighborhood, city, property_type, status)')
      .gt('total_price', 0)
      .gt('area', 0)

    // Filter by city if available
    if (subject.cidade) {
      query = query.eq('development.city', subject.cidade)
    }

    // Price range filter (±30%)
    if (priceEstimate > 0) {
      query = query
        .gte('total_price', Math.round(priceEstimate * 0.7))
        .lte('total_price', Math.round(priceEstimate * 1.3))
    }

    const { data: rows } = await query.limit(limit * 2) // fetch extra to filter

    if (!rows || rows.length === 0) return []

    const comparables: Comparable[] = []
    const today = new Date().toISOString().split('T')[0]

    for (const row of rows) {
      const dev = row.development as unknown as {
        name: string; neighborhood: string; city: string; property_type: string; status: string
      }
      if (!dev) continue

      // Skip if same neighborhood requested and doesn't match
      // But prefer same neighborhood comparables
      const sameNeighborhood = subject.bairro
        ? dev.neighborhood?.toLowerCase() === subject.bairro.toLowerCase()
        : true

      const padrao = inferPadrao(row.total_price, row.area)
      const estado = inferEstado(dev.status)

      comparables.push({
        endereco: `${dev.name} — ${dev.neighborhood}, ${dev.city}`,
        area: row.area,
        valorVenda: row.total_price,
        quartos: row.bedrooms ?? subject.quartos,
        vagas: row.parking_spots ?? 1,
        padrao,
        estado,
        distanciaKm: sameNeighborhood ? 0.5 : 3.0,
        dataColeta: today,
      })
    }

    // Sort: prefer same neighborhood, then by price proximity
    comparables.sort((a, b) => {
      const aDist = a.distanciaKm
      const bDist = b.distanciaKm
      if (aDist !== bDist) return aDist - bDist
      if (priceEstimate > 0) {
        return Math.abs(a.valorVenda - priceEstimate) - Math.abs(b.valorVenda - priceEstimate)
      }
      return 0
    })

    return comparables.slice(0, limit)
  } catch {
    return []
  }
}

function inferPadrao(price: number, area: number): string {
  const sqm = price / area
  if (sqm > 15000) return 'Luxo'
  if (sqm > 10000) return 'Alto'
  if (sqm > 6000) return 'Normal'
  return 'Baixo'
}

function inferEstado(status: string): string {
  const map: Record<string, string> = {
    launch: 'Novo', lancamento: 'Novo',
    under_construction: 'Entre Novo e Regular',
    ready: 'Regular', active: 'Regular', disponivel: 'Regular',
  }
  return map[status] ?? 'Regular'
}

// ═══════════════════════════════════════════════════════════════
// NOVOS MÉTODOS — IMI Avaliação Premium
// Baseados em: João Diniz Marcello — Avaliação Mercadológica de Imóveis
// e ABNT NBR 14653 partes 1-3
// ═══════════════════════════════════════════════════════════════

// ── Método Involutivo ─────────────────────────────────────────

export interface InvolutivoInput {
  vgv: number                   // Valor Geral de Vendas (R$)
  custos_pct: number            // % de custos sobre VGV (típico 50-65%)
  lucro_pct: number             // % de lucro do incorporador (típico 12-20%)
  area_terreno: number          // m² do terreno
}

export interface InvolutivoResult {
  metodo: string
  vgv: number
  custos_totais: number
  lucro_incorporador: number
  valor_terreno: number         // VT = VGV - C - L
  valor_unitario_terreno: number // R$/m²
  valor_minimo: number
  valor_maximo: number
  amplitude: number
}

/**
 * Método Involutivo — NBR 14653-2 §9
 * VT = VGV − C − L
 * Indicado para terrenos com potencial de incorporação e glebas.
 * Cap. 8 João Diniz: "O método involutivo simula a hipótese de
 * incorporação e retroage ao valor do terreno."
 */
export function metodoInvolutivo(input: InvolutivoInput): InvolutivoResult {
  const { vgv, custos_pct, lucro_pct, area_terreno } = input
  const custos = vgv * (custos_pct / 100)
  const lucro = vgv * (lucro_pct / 100)
  const valorTerreno = Math.round(vgv - custos - lucro)
  const valorUnitario = area_terreno > 0 ? valorTerreno / area_terreno : 0
  const amplitude = 20 // ±20% para método involutivo
  return {
    metodo: 'Involutivo (VGV − Custos − Lucro)',
    vgv,
    custos_totais: Math.round(custos),
    lucro_incorporador: Math.round(lucro),
    valor_terreno: valorTerreno,
    valor_unitario_terreno: Number(valorUnitario.toFixed(2)),
    valor_minimo: Math.round(valorTerreno * (1 - amplitude / 100)),
    valor_maximo: Math.round(valorTerreno * (1 + amplitude / 100)),
    amplitude,
  }
}

// ── Cap Rate / NOI ────────────────────────────────────────────

export interface CapRateInput {
  noi_mensal: number            // Net Operating Income mensal (R$)
  taxa_cap_rate: number         // % a.a. (ex: 8)
  vacancia_pct: number          // % de vacância (ex: 5)
}

export interface CapRateResult {
  metodo: string
  noi_mensal_bruto: number
  vacancia_valor: number
  noi_mensal_liquido: number
  noi_anual: number
  taxa_cap_rate: number
  valor_total: number
  valor_minimo: number
  valor_maximo: number
  yield_bruto: number           // % a.a.
  yield_liquido: number         // % a.a.
}

/**
 * Cap Rate / NOI — NBR 14653-2 §11
 * Valor = NOI anual / Cap Rate
 * Usado para imóveis comerciais, galpões, lojas com locatários estáveis.
 */
export function metodoCapRate(input: CapRateInput): CapRateResult {
  const { noi_mensal, taxa_cap_rate, vacancia_pct } = input
  const vacanciaValor = noi_mensal * (vacancia_pct / 100)
  const noiLiquido = noi_mensal - vacanciaValor
  const noiAnual = noiLiquido * 12
  const valorTotal = Math.round(noiAnual / (taxa_cap_rate / 100))
  const amplitude = 15
  const yieldBruto = valorTotal > 0 ? (noi_mensal * 12 / valorTotal) * 100 : 0
  const yieldLiquido = valorTotal > 0 ? (noiAnual / valorTotal) * 100 : 0

  return {
    metodo: 'Cap Rate / NOI',
    noi_mensal_bruto: noi_mensal,
    vacancia_valor: Math.round(vacanciaValor),
    noi_mensal_liquido: Math.round(noiLiquido),
    noi_anual: Math.round(noiAnual),
    taxa_cap_rate,
    valor_total: valorTotal,
    valor_minimo: Math.round(valorTotal * (1 - amplitude / 100)),
    valor_maximo: Math.round(valorTotal * (1 + amplitude / 100)),
    yield_bruto: Number(yieldBruto.toFixed(2)),
    yield_liquido: Number(yieldLiquido.toFixed(2)),
  }
}

// ── Fluxo de Caixa Descontado (DCF) ──────────────────────────

export interface DCFInput {
  fluxo_anual: number[]         // Fluxo de caixa por ano (R$)
  taxa_desconto: number         // % a.a. (TMA)
  valor_residual: number        // Valor residual no ano final (R$)
}

export interface DCFResult {
  metodo: string
  vpl: number                   // Valor Presente Líquido
  tir: number                   // Taxa Interna de Retorno (% a.a.)
  payback_anos: number          // Anos para recuperar investimento
  valor_presente_fluxos: number
  valor_presente_residual: number
  fluxo_descontado: { ano: number; fluxo: number; fator_desconto: number; vp: number }[]
  taxa_desconto: number
}

/**
 * Fluxo de Caixa Descontado — NBR 14653-2 §11.3
 * VPL = Σ FCt/(1+i)^t + VR/(1+i)^n
 * Para hotéis, shoppings, empreendimentos complexos.
 */
export function metodoFluxoCaixaDescontado(input: DCFInput): DCFResult {
  const { fluxo_anual, taxa_desconto, valor_residual } = input
  const i = taxa_desconto / 100
  const n = fluxo_anual.length

  let vpFluxos = 0
  const fluxoDesc: DCFResult['fluxo_descontado'] = []
  let acumulado = 0
  let payback = n // default: não recupera no período

  for (let t = 0; t < n; t++) {
    const fator = Math.pow(1 + i, t + 1)
    const vp = fluxo_anual[t] / fator
    vpFluxos += vp
    acumulado += fluxo_anual[t]
    if (acumulado >= 0 && payback === n) payback = t + 1
    fluxoDesc.push({
      ano: t + 1,
      fluxo: fluxo_anual[t],
      fator_desconto: Number(fator.toFixed(4)),
      vp: Math.round(vp),
    })
  }

  const vpResidual = valor_residual / Math.pow(1 + i, n)
  const vpl = Math.round(vpFluxos + vpResidual)

  // TIR — Newton-Raphson iterativo (simplificado)
  let tir = 0
  try {
    let rate = 0.1
    for (let iter = 0; iter < 100; iter++) {
      let f = 0
      let df = 0
      for (let t = 0; t < n; t++) {
        const v = Math.pow(1 + rate, t + 1)
        f += fluxo_anual[t] / v
        df -= (t + 1) * fluxo_anual[t] / (v * (1 + rate))
      }
      f += valor_residual / Math.pow(1 + rate, n)
      df -= n * valor_residual / (Math.pow(1 + rate, n) * (1 + rate))
      const newRate = rate - f / df
      if (Math.abs(newRate - rate) < 1e-8) { rate = newRate; break }
      rate = newRate
    }
    tir = Number((rate * 100).toFixed(2))
  } catch { tir = 0 }

  return {
    metodo: 'Fluxo de Caixa Descontado (DCF)',
    vpl,
    tir,
    payback_anos: payback,
    valor_presente_fluxos: Math.round(vpFluxos),
    valor_presente_residual: Math.round(vpResidual),
    fluxo_descontado: fluxoDesc,
    taxa_desconto,
  }
}

// ── Liquidação Forçada ────────────────────────────────────────

export interface LiquidacaoForcadaResult {
  metodo: string
  valor_mercado: number
  liquidez: 'alta' | 'media' | 'baixa'
  desconto_pct: number
  valor_liquidacao: number
  descricao_liquidez: string
}

/**
 * Liquidação Forçada — Cap. 14 João Diniz
 * Aplica desconto ao valor de mercado conforme urgência de venda.
 * Usado em penhoras, leilões e execuções hipotecárias.
 * NBR 14653-2: "preço vil" = abaixo de 50% do valor de mercado.
 */
export function metodoLiquidacaoForcada(
  valorMercado: number,
  liquidez: 'alta' | 'media' | 'baixa',
): LiquidacaoForcadaResult {
  const DESCONTOS = { alta: 10, media: 20, baixa: 30 } as const
  const DESCRICOES = {
    alta: 'Liquidez alta — imóvel em região com demanda aquecida, venda possível em até 30 dias',
    media: 'Liquidez média — imóvel em região com demanda normal, venda em 60-120 dias',
    baixa: 'Liquidez baixa — imóvel em região com pouca demanda, venda pode levar 6-12 meses',
  }

  const descontoPct = DESCONTOS[liquidez]
  const valorLiquidacao = Math.round(valorMercado * (1 - descontoPct / 100))

  return {
    metodo: 'Liquidação Forçada',
    valor_mercado: valorMercado,
    liquidez,
    desconto_pct: descontoPct,
    valor_liquidacao: valorLiquidacao,
    descricao_liquidez: DESCRICOES[liquidez],
  }
}

// ── Cenários ──────────────────────────────────────────────────

export interface CenariosResult {
  conservador: { valor: number; variacao_pct: number; descricao: string }
  realista:    { valor: number; variacao_pct: number; descricao: string }
  agressivo:   { valor: number; variacao_pct: number; descricao: string }
}

/**
 * Três cenários de valor — abordagem de mercado imobiliário.
 * Conservador: −15% (pior caso, mercado recessivo)
 * Realista: valor de mercado calculado
 * Agressivo: +12% (otimista, mercado em valorização)
 */
export function metodoCenarios(valorBase: number): CenariosResult {
  return {
    conservador: {
      valor: Math.round(valorBase * 0.85),
      variacao_pct: -15,
      descricao: 'Cenário pessimista — mercado em retração, maior tempo de venda, possível necessidade de desconto',
    },
    realista: {
      valor: Math.round(valorBase),
      variacao_pct: 0,
      descricao: 'Cenário base — valor de mercado calculado com os dados disponíveis, dentro do grau de fundamentação NBR 14653',
    },
    agressivo: {
      valor: Math.round(valorBase * 1.12),
      variacao_pct: 12,
      descricao: 'Cenário otimista — mercado em valorização, região em desenvolvimento, imóvel com diferenciais competitivos',
    },
  }
}

// ── BDI ───────────────────────────────────────────────────────

export interface BDIResult {
  custo_direto: number
  bdi_pct: number
  valor_bdi: number
  custo_total_bdi: number
  componentes: {
    administracao_central: number  // ~5%
    risco: number                  // ~1.5%
    impostos: number               // ~4%
    lucro: number                  // ~7.5%
    outros: number                 // ~7%
  }
}

/**
 * BDI — Benefícios e Despesas Indiretas (NBR 14653-2 §10)
 * Encargos sobre o custo direto de construção (tipicamente 20-30%).
 * Inclui: administração central, risco, impostos, lucro, outros.
 */
export function metodoBDI(
  custoDireto: number,
  bdiPct: number = 25,
): BDIResult {
  const valorBdi = custoDireto * (bdiPct / 100)
  const total = custoDireto + valorBdi

  // Distribuição típica do BDI (proporcional ao % informado)
  const proporcao = bdiPct / 25 // normaliza para padrão 25%
  return {
    custo_direto: custoDireto,
    bdi_pct: bdiPct,
    valor_bdi: Math.round(valorBdi),
    custo_total_bdi: Math.round(total),
    componentes: {
      administracao_central: Math.round(custoDireto * 0.05 * proporcao),
      risco:                  Math.round(custoDireto * 0.015 * proporcao),
      impostos:               Math.round(custoDireto * 0.04 * proporcao),
      lucro:                  Math.round(custoDireto * 0.075 * proporcao),
      outros:                 Math.round(custoDireto * 0.07 * proporcao),
    },
  }
}

// ── Fundo de Comércio ─────────────────────────────────────────

export interface FundoComercioInput {
  faturamento_mensal: number    // R$/mês
  margem_liquida_pct: number    // % de margem líquida (ex: 15)
  meses_multiplicador: number   // típico 24-48 meses
}

export interface FundoComercioResult {
  metodo: string
  faturamento_mensal: number
  lucro_mensal: number
  meses_multiplicador: number
  valor_fundo: number
  valor_minimo: number
  valor_maximo: number
}

/**
 * Fundo de Comércio — Cap. 15 João Diniz (Situações Específicas)
 * Valor = Faturamento × Margem × Multiplicador de meses
 * Para estabelecimentos comerciais em funcionamento.
 */
export function metodoFundoComercio(input: FundoComercioInput): FundoComercioResult {
  const { faturamento_mensal, margem_liquida_pct, meses_multiplicador } = input
  const lucroMensal = faturamento_mensal * (margem_liquida_pct / 100)
  const valorFundo = Math.round(lucroMensal * meses_multiplicador)

  return {
    metodo: 'Fundo de Comércio',
    faturamento_mensal,
    lucro_mensal: Math.round(lucroMensal),
    meses_multiplicador,
    valor_fundo: valorFundo,
    valor_minimo: Math.round(valorFundo * 0.80),
    valor_maximo: Math.round(valorFundo * 1.20),
  }
}

// ── Honorários — Tabela IBAPE Simplificada ───────────────────

export interface HonorariosResult {
  valor_imovel: number
  percentual: number
  honorarios_base: number
  honorarios_minimos: number
  honorarios_sugeridos: number
  complexidade_label: string
}

/**
 * Cálculo de honorários — Cap. 17 João Diniz
 * Tabela IBAPE/SP regressiva: quanto maior o valor, menor o percentual.
 * Ref: IBAPE Nacional — Tabela de Honorários para Avaliações Imobiliárias.
 */
export function calcularHonorarios(
  valorImovel: number,
  complexidade: 'simples' | 'normal' | 'complexa' = 'normal',
): HonorariosResult {
  // Tabela IBAPE simplificada (regressiva por faixa de valor)
  let pct: number
  if (valorImovel <= 200_000)       pct = 1.50
  else if (valorImovel <= 500_000)  pct = 1.20
  else if (valorImovel <= 1_000_000) pct = 0.90
  else if (valorImovel <= 2_000_000) pct = 0.70
  else if (valorImovel <= 5_000_000) pct = 0.50
  else if (valorImovel <= 10_000_000) pct = 0.40
  else pct = 0.30

  const COMPLEXIDADE_MULT = { simples: 0.80, normal: 1.00, complexa: 1.50 }
  const COMPLEXIDADE_LABELS = {
    simples: 'Avaliação simples (1 método, imóvel padrão)',
    normal: 'Avaliação normal (com homogeneização e PTAM)',
    complexa: 'Avaliação complexa (judicial, múltiplos métodos, perícia)',
  }

  const baseHonorarios = valorImovel * (pct / 100) * COMPLEXIDADE_MULT[complexidade]
  const minimo = 500 // piso mínimo sugerido

  return {
    valor_imovel: valorImovel,
    percentual: pct * COMPLEXIDADE_MULT[complexidade],
    honorarios_base: Math.round(baseHonorarios),
    honorarios_minimos: minimo,
    honorarios_sugeridos: Math.max(Math.round(baseHonorarios), minimo),
    complexidade_label: COMPLEXIDADE_LABELS[complexidade],
  }
}

// ── Valor Venal Simplificado ──────────────────────────────────

export interface ValorVenalResult {
  valor_terreno: number
  valor_edificacao: number
  valor_venal_total: number
  base_iptu_estimada: number
}

/**
 * Estimativa de valor venal para referência fiscal.
 * Não substitui o cálculo oficial do município.
 * Tipicamente 60-80% do valor de mercado.
 */
export function estimarValorVenal(
  valorMercado: number,
  areaTerreno: number = 0,
  areaConstruida: number = 0,
  cubM2: number = 2450,
): ValorVenalResult {
  const valorEdificacao = areaConstruida > 0 ? areaConstruida * cubM2 * 0.60 : valorMercado * 0.40
  const valorTerreno = areaTerreno > 0 ? areaTerreno * (valorMercado / (areaTerreno + areaConstruida)) : valorMercado * 0.35
  const valorVenal = Math.round((valorTerreno + valorEdificacao) * 0.75) // ~75% do mercado

  return {
    valor_terreno: Math.round(valorTerreno),
    valor_edificacao: Math.round(valorEdificacao),
    valor_venal_total: valorVenal,
    base_iptu_estimada: Math.round(valorVenal * 0.80), // 80% do venal como base típica
  }
}
