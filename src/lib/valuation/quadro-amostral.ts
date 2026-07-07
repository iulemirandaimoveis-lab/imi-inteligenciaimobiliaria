/**
 * Quadro Amostral — Saneamento por Faixa de Mercado (NBR 14653-2)
 * ============================================================================
 * Implementa o tratamento estatístico "por fatores/por saneamento" efetivamente
 * utilizado em laudos mercadológicos reais: o método da faixa de tolerância.
 *
 * Fluxo (idêntico ao laudo-modelo Nielda / planilha "Quadro Amostral"):
 *   1. Coleta da amostra bruta (R$/m² de cada elemento comparativo).
 *   2. Cálculo da média inicial e do desvio-padrão amostral.
 *   3. Definição da faixa de tolerância ±X% (default 20%) em torno da média.
 *   4. Saneamento: eliminação dos elementos discrepantes fora da faixa.
 *   5. Recálculo da média com a amostra homogeneizada (valor unitário médio).
 *   6. Valor bruto = valor unitário médio × área do avaliando.
 *   7. Arredondamento técnico: maior valor "redondo" dentro de +máx 1%.
 *   8. Faixa de valor de mercado: valor adotado ±Y% (default 10%).
 *
 * Referências:
 * - ABNT NBR 14653-2:2011 — Imóveis urbanos (§ saneamento / tratamento por fatores)
 * - IBAPE — Norma para Avaliação de Imóveis Urbanos
 *
 * Reproduz exatamente os números do laudo-modelo:
 *   20 elementos em Boa Viagem/Recife → média inicial ≈ R$ 6.512/m²,
 *   faixa ±20% → R$ 5.209,65 a R$ 7.814,47/m², após saneamento
 *   média homogeneizada R$ 6.306,89/m² × 128 m² = R$ 807.281,92
 *   → arredondamento técnico R$ 815.000,00
 *   → faixa de mercado R$ 733.500,00 a R$ 896.500,00.
 */

export interface AmostraElemento {
  /** valor unitário R$/m² — se ausente, calculado de valorTotal/area */
  valorM2?: number
  valorTotal?: number
  area?: number
  /** metadados opcionais, apenas transportados para o laudo */
  bairro?: string
  quartos?: number
  garagem?: number
  andar?: number | string
  fonte?: string
  link?: string
}

export interface AmostraSaneada extends AmostraElemento {
  indice: number
  valorM2: number
  /** true = eliminado no saneamento (fora da faixa) */
  eliminado: boolean
  /** desvio percentual em relação à média inicial */
  desvioPct: number
}

export interface QuadroAmostralResult {
  // ── Amostra ──
  amostras: AmostraSaneada[]
  nInicial: number
  nSaneada: number
  nEliminados: number

  // ── Estatística (bruta / inicial) ──
  mediaInicial: number
  desvioPadrao: number
  coeficienteVariacao: number // CV%
  limiteSuperiorFaixa: number // média × (1 + tolerância)
  limiteInferiorFaixa: number // média × (1 − tolerância)
  toleranciaPct: number

  // ── Estatística (homogeneizada / pós-saneamento) ──
  valorUnitarioMedio: number // R$/m² homogeneizado
  desvioPadraoSaneado: number
  coeficienteVariacaoSaneado: number

  // ── Valor ──
  areaAvaliando: number
  valorBruto: number // valor unitário médio × área
  valorAdotado: number // após arredondamento técnico
  arredondamentoValor: number // valorAdotado − valorBruto
  arredondamentoPct: number

  // ── Faixa de mercado ──
  faixaPct: number
  limiteInferior: number
  limiteSuperior: number

  // ── Enquadramento NBR 14653-2 ──
  grauFundamentacao: 'I' | 'II' | 'III'
  grauPrecisao: 'I' | 'II' | 'III'
}

export interface QuadroAmostralOptions {
  /** tolerância do saneamento (fração, default 0.20 = ±20%) */
  tolerancia?: number
  /** amplitude da faixa de mercado (fração, default 0.10 = ±10%) */
  faixa?: number
  /** passo do arredondamento técnico em R$ (default 5000) */
  passoArredondamento?: number
  /** teto do arredondamento técnico (fração, default 0.01 = máx 1%) */
  tetoArredondamento?: number
}

// ── Helpers estatísticos ──────────────────────────────────────────────────

function media(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

/** desvio-padrão amostral (n−1) */
function desvioPadrao(arr: number[], m: number): number {
  if (arr.length <= 1) return 0
  const soma = arr.reduce((s, v) => s + (v - m) ** 2, 0)
  return Math.sqrt(soma / (arr.length - 1))
}

/**
 * Arredondamento técnico: maior múltiplo de `passo` que não ultrapasse
 * o valor bruto acrescido do teto (default +1%).
 * Ex.: 807.281,92 × 1,01 = 815.354,74 → múltiplo de 5.000 = 815.000.
 */
export function arredondamentoTecnico(
  valorBruto: number,
  passo = 5000,
  teto = 0.01,
): number {
  if (valorBruto <= 0) return 0
  const limite = valorBruto * (1 + teto)
  const arredondado = Math.floor(limite / passo) * passo
  // nunca retornar abaixo do valor bruto (garante que o arredondamento não reduz)
  return arredondado >= valorBruto ? arredondado : Math.round(valorBruto / passo) * passo
}

// ── Motor principal ────────────────────────────────────────────────────────

/**
 * Calcula o quadro amostral completo pelo método da faixa de mercado.
 *
 * @param elementos amostra bruta (mín. 3 elementos)
 * @param areaAvaliando área privativa/considerada do imóvel avaliando (m²)
 */
export function calcularQuadroAmostral(
  elementos: AmostraElemento[],
  areaAvaliando: number,
  options: QuadroAmostralOptions = {},
): QuadroAmostralResult {
  const {
    tolerancia = 0.20,
    faixa = 0.10,
    passoArredondamento = 5000,
    tetoArredondamento = 0.01,
  } = options

  // Normaliza R$/m² de cada elemento (valorM2 direto ou valorTotal/area)
  const normalizados = elementos
    .map((el, i) => {
      const vm2 =
        el.valorM2 && el.valorM2 > 0
          ? el.valorM2
          : el.valorTotal && el.area && el.area > 0
            ? el.valorTotal / el.area
            : 0
      return { ...el, indice: i, valorM2: vm2 }
    })
    .filter((el) => el.valorM2 > 0)

  if (normalizados.length < 1) {
    throw new Error('Quadro amostral requer ao menos 1 elemento com R$/m² válido')
  }

  // 1-2. Estatística inicial
  const brutos = normalizados.map((e) => e.valorM2)
  const mediaInicial = media(brutos)
  const dp = desvioPadrao(brutos, mediaInicial)
  const cv = mediaInicial > 0 ? (dp / mediaInicial) * 100 : 0

  // 3. Faixa de tolerância ±X% (referência publicada — em torno da média inicial)
  const limiteSuperiorFaixa = mediaInicial * (1 + tolerancia)
  const limiteInferiorFaixa = mediaInicial * (1 - tolerancia)

  // 4. Saneamento iterativo — a cada rodada recalcula a média da amostra
  //    remanescente e reaplica a faixa ±X%, até estabilizar (nenhum elemento
  //    novo fora da faixa). Reproduz o saneamento sucessivo dos laudos reais,
  //    que estreita progressivamente a amostra em torno da tendência central.
  const MIN_AMOSTRA = 3
  let mantidos = [...normalizados]
  // salvaguarda: só sanea se houver folga para manter o mínimo amostral
  for (let rodada = 0; rodada < 20; rodada++) {
    const m = media(mantidos.map((e) => e.valorM2))
    const hi = m * (1 + tolerancia)
    const lo = m * (1 - tolerancia)
    const dentro = mantidos.filter((e) => e.valorM2 <= hi && e.valorM2 >= lo)
    if (dentro.length === mantidos.length) break
    if (dentro.length < MIN_AMOSTRA) break
    mantidos = dentro
  }

  const idsMantidos = new Set(mantidos.map((e) => e.indice))
  const marcados: AmostraSaneada[] = normalizados.map((e) => ({
    ...e,
    eliminado: !idsMantidos.has(e.indice),
    desvioPct:
      mediaInicial > 0
        ? ((e.valorM2 - mediaInicial) / mediaInicial) * 100
        : 0,
  }))

  const saneados = marcados.filter((e) => !e.eliminado)

  // 5. Média homogeneizada (arredondada a 2 casas — valor unitário publicado)
  const saneadosVals = saneados.map((e) => e.valorM2)
  const valorUnitarioMedio = round2(media(saneadosVals))
  const dpSaneado = desvioPadrao(saneadosVals, valorUnitarioMedio)
  const cvSaneado =
    valorUnitarioMedio > 0 ? (dpSaneado / valorUnitarioMedio) * 100 : 0

  // 6. Valor bruto = valor unitário publicado × área
  const valorBruto = round2(valorUnitarioMedio * areaAvaliando)

  // 7. Arredondamento técnico
  const valorAdotado = arredondamentoTecnico(
    valorBruto,
    passoArredondamento,
    tetoArredondamento,
  )
  const arredondamentoValor = valorAdotado - valorBruto
  const arredondamentoPct =
    valorBruto > 0 ? (arredondamentoValor / valorBruto) * 100 : 0

  // 8. Faixa de valor de mercado ±Y%
  const limiteInferior = Math.round(valorAdotado * (1 - faixa))
  const limiteSuperior = Math.round(valorAdotado * (1 + faixa))

  // Enquadramento NBR 14653-2 (Tabelas de grau)
  const n = saneados.length
  let grauFundamentacao: 'I' | 'II' | 'III' = 'I'
  if (n >= 12 && cvSaneado <= 25) grauFundamentacao = 'III'
  else if (n >= 6 && cvSaneado <= 30) grauFundamentacao = 'II'

  let grauPrecisao: 'I' | 'II' | 'III' = 'I'
  if (cvSaneado <= 15) grauPrecisao = 'III'
  else if (cvSaneado <= 30) grauPrecisao = 'II'

  return {
    amostras: marcados,
    nInicial: normalizados.length,
    nSaneada: saneados.length,
    nEliminados: normalizados.length - saneados.length,

    mediaInicial: round2(mediaInicial),
    desvioPadrao: round2(dp),
    coeficienteVariacao: round2(cv),
    limiteSuperiorFaixa: round2(limiteSuperiorFaixa),
    limiteInferiorFaixa: round2(limiteInferiorFaixa),
    toleranciaPct: tolerancia * 100,

    valorUnitarioMedio: round2(valorUnitarioMedio),
    desvioPadraoSaneado: round2(dpSaneado),
    coeficienteVariacaoSaneado: round2(cvSaneado),

    areaAvaliando,
    valorBruto: round2(valorBruto),
    valorAdotado,
    arredondamentoValor: round2(arredondamentoValor),
    arredondamentoPct: round2(arredondamentoPct),

    faixaPct: faixa * 100,
    limiteInferior,
    limiteSuperior,

    grauFundamentacao,
    grauPrecisao,
  }
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}
