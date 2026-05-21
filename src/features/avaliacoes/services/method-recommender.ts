/**
 * Recomendador de Método Avaliatório — IMI
 *
 * Baseado no livro "Avaliação Mercadológica de Imóveis" de João Diniz Marcello
 * e na ABNT NBR 14653 (partes 1-3).
 *
 * Lógica de recomendação conforme Cap. 8 (Práticas) e Cap. 5 (Conceitos).
 */

export type TipoImovel =
  | 'Apartamento' | 'Casa' | 'Cobertura' | 'Studio' | 'Loft'
  | 'Sala Comercial' | 'Loja' | 'Galpão/Armazém' | 'Terreno/Lote'
  | 'Hotel/Pousada' | 'Shopping/Loja em Mall' | 'Imóvel Rural'
  | 'Gleba' | 'Posto de Combustível' | 'Outro'

export type Finalidade =
  | 'Venda' | 'Financiamento' | 'Judicial' | 'Inventário'
  | 'Doação' | 'Garantia' | 'Locação' | 'Desapropriação'
  | 'Servidão' | 'Permuta' | 'Dação em Pagamento' | 'Incorporação'

export interface MethodRecommendation {
  metodo_principal: string
  metodo_id: MetodoId
  metodos_alternativos: { id: MetodoId; nome: string; motivo: string }[]
  justificativa: string
  dados_necessarios: string[]
  quando_usar: string
  quando_nao_usar: string
  referencia_nbr: string
  grau_confianca: 'alto' | 'medio' | 'baixo'
  alerta?: string
}

export type MetodoId =
  | 'comparativo'
  | 'evolutivo'
  | 'involutivo'
  | 'renda'
  | 'cap_rate'
  | 'fcd'
  | 'liquidacao_forcada'
  | 'ross_heidecke'
  | 'fundo_comercio'
  | 'ponto_comercial'
  | 'bdi'

interface RecommenderInput {
  tipo_imovel: string
  finalidade: string
  tem_renda: boolean
  tem_comparaveis: boolean
  is_terreno: boolean
  is_rural: boolean
  is_judicial: boolean
}

/** Map method IDs to human-readable names */
export const METODO_LABELS: Record<MetodoId, string> = {
  comparativo:         'Comparativo Direto de Dados de Mercado',
  evolutivo:           'Evolutivo (Terreno + Custo Reprodução Ross-Heidecke)',
  involutivo:          'Involutivo (VGV − Custos − Lucro)',
  renda:               'Renda por Capitalização Direta',
  cap_rate:            'Cap Rate / NOI',
  fcd:                 'Fluxo de Caixa Descontado (DCF)',
  liquidacao_forcada:  'Liquidação Forçada',
  ross_heidecke:       'Ross-Heidecke (Depreciação)',
  fundo_comercio:      'Fundo de Comércio',
  ponto_comercial:     'Ponto Comercial',
  bdi:                 'BDI (Benefícios e Despesas Indiretas)',
}

/** Dados necessários por método */
const DADOS_POR_METODO: Record<MetodoId, string[]> = {
  comparativo: [
    'Mínimo 3 imóveis comparáveis na região (idealmente 6+)',
    'Área (m²), preço e localização de cada comparável',
    'Fonte dos dados (OLX, ZAP, Viva Real, etc.)',
    'Fatores de homogeneização (oferta, área, localização, idade)',
  ],
  evolutivo: [
    'Valor do terreno (obtido por comparativo)',
    'Área construída (m²)',
    'Ano de construção',
    'Estado de conservação (para Ross-Heidecke)',
    'Padrão construtivo (Baixo/Normal/Alto/Luxo)',
    'CUB/m² vigente do SINDUSCON',
    'BDI (Benefícios e Despesas Indiretas) — padrão 25%',
  ],
  involutivo: [
    'Valor Geral de Vendas (VGV) hipotético',
    'Número de unidades e preço por unidade',
    '% de custos de construção sobre o VGV (tipicamente 50-65%)',
    '% de lucro do incorporador (tipicamente 12-20%)',
    'Coeficiente de aproveitamento do terreno (CA)',
    'Taxa de permutas/áreas públicas',
  ],
  renda: [
    'Renda mensal (aluguel bruto)',
    'Taxa de capitalização de mercado (% a.a.)',
    'Taxa de vacância (% — padrão 5-10%)',
    'Despesas operacionais (% da renda bruta)',
  ],
  cap_rate: [
    'NOI mensal (lucro operacional líquido)',
    'Cap Rate de mercado (% a.a.)',
    'Taxa de vacância do imóvel ou mercado',
    'Histórico de renda dos últimos 12 meses',
  ],
  fcd: [
    'Fluxo de caixa estimado por ano (mínimo 5-10 anos)',
    'Taxa de desconto (TMA — Taxa Mínima de Atratividade)',
    'Valor residual no final do período',
    'Taxa de crescimento real da renda',
  ],
  liquidacao_forcada: [
    'Valor de mercado do imóvel (obtido por outro método)',
    'Índice de liquidez: alta/média/baixa',
    'Prazo para liquidação desejado',
  ],
  ross_heidecke: [
    'Ano de construção',
    'Vida útil estimada (por tipo)',
    'Estado de conservação atual',
    'Custo de reprodução (R$/m²)',
  ],
  fundo_comercio: [
    'Faturamento mensal do estabelecimento',
    'Margem de lucro líquida (%)',
    'Tempo de atividade do negócio',
    'Multiplicador de meses (setor)',
  ],
  ponto_comercial: [
    'Localização comercial (fluxo, visibilidade)',
    'Aluguel de mercado da região',
    'Faturamento estimado pelo ponto',
    'Comparáveis de pontos comerciais',
  ],
  bdi: [
    'Custo direto de construção (R$)',
    'BDI (%) — tipicamente 20-30%',
    'Tipo de obra e nível de complexidade',
  ],
}

function buildInput(tipoImovel: string, finalidade: string): RecommenderInput {
  const tipo = tipoImovel.toLowerCase()
  const fin = finalidade.toLowerCase()

  return {
    tipo_imovel: tipo,
    finalidade: fin,
    tem_renda:
      tipo.includes('hotel') || tipo.includes('pousada') ||
      tipo.includes('shopping') || tipo.includes('mall') ||
      tipo.includes('galpão') || tipo.includes('armazém') ||
      tipo.includes('loja') || tipo.includes('sala') ||
      fin === 'locação',
    tem_comparaveis: !tipo.includes('rural') && !tipo.includes('gleba') && !tipo.includes('posto'),
    is_terreno: tipo.includes('terreno') || tipo.includes('lote') || tipo.includes('gleba'),
    is_rural: tipo.includes('rural'),
    is_judicial: fin === 'judicial' || fin === 'inventário' || fin === 'desapropriação' || fin === 'servidão',
  }
}

/**
 * Recomenda o método avaliatório mais adequado conforme NBR 14653.
 * Baseado no Capítulo 8 do livro João Diniz Marcello.
 */
export function recomendarMetodo(
  tipoImovel: string,
  finalidade: string,
): MethodRecommendation {
  const inp = buildInput(tipoImovel, finalidade)

  // ─── JUDICIAL / INVENTÁRIO / DESAPROPRIAÇÃO ─────────────
  if (finalidade === 'Desapropriação' || finalidade === 'Servidão') {
    return {
      metodo_principal: METODO_LABELS.comparativo,
      metodo_id: 'comparativo',
      metodos_alternativos: [
        { id: 'evolutivo', nome: METODO_LABELS.evolutivo, motivo: 'Complemento quando comparáveis são escassos' },
      ],
      justificativa:
        'Para desapropriações e servidões, o Método Comparativo Direto é o exigido pelos tribunais e pelo Decreto-Lei 3.365/41. Permite verificação objetiva e imparcial.',
      dados_necessarios: DADOS_POR_METODO.comparativo,
      quando_usar: 'Sempre em processos de desapropriação ou constituição de servidão.',
      quando_nao_usar: 'Quando não há comparáveis disponíveis — usar Evolutivo como complemento.',
      referencia_nbr: 'NBR 14653-2 §8 · Decreto-Lei 3.365/41 · STJ 277.443/2002',
      grau_confianca: 'alto',
      alerta: 'Em desapropriações, o avaliador deve declarar inexistência de vínculos com as partes (Res. COFECI 1.066/2007).',
    }
  }

  if (finalidade === 'Judicial' || finalidade === 'Inventário') {
    return {
      metodo_principal: METODO_LABELS.comparativo,
      metodo_id: 'comparativo',
      metodos_alternativos: [
        { id: 'evolutivo', nome: METODO_LABELS.evolutivo, motivo: 'Para casas e imóveis sem comparáveis suficientes' },
        { id: 'ross_heidecke', nome: METODO_LABELS.ross_heidecke, motivo: 'Para fundamentar a depreciação das benfeitorias' },
      ],
      justificativa:
        'Em avaliações judiciais e inventários, a NBR 14653 e a jurisprudência do STJ exigem o Método Comparativo para garantir objetividade e verificação pelo juízo.',
      dados_necessarios: DADOS_POR_METODO.comparativo,
      quando_usar: 'Processos judiciais, partilhas de bens, inventários e arrolamentos.',
      quando_nao_usar: 'Quando a data da avaliação é retroativa — necessário pesquisa histórica de mercado.',
      referencia_nbr: 'NBR 14653-2 §8 · CPC Art. 465 · STJ 277.443/2002',
      grau_confianca: 'alto',
      alerta: 'Para inventários, calcular o valor na data do óbito usando CUB/SINDUSCON histórico e índices de mercado.',
    }
  }

  // ─── TERRENO / LOTE / GLEBA ────────────────────────────
  if (inp.is_terreno) {
    if (tipoImovel.toLowerCase().includes('gleba')) {
      return {
        metodo_principal: METODO_LABELS.involutivo,
        metodo_id: 'involutivo',
        metodos_alternativos: [
          { id: 'comparativo', nome: METODO_LABELS.comparativo, motivo: 'Quando há transações recentes de glebas similares' },
        ],
        justificativa:
          'Para glebas urbanizáveis, o Método Involutivo é o mais adequado (NBR 14653-2 §9.3): simula o loteamento hipotético e retrocede ao valor da gleba pela fórmula VG = VGV − Dd − Di − L.',
        dados_necessarios: DADOS_POR_METODO.involutivo,
        quando_usar: 'Glebas com potencial de loteamento ou incorporação residencial.',
        quando_nao_usar: 'Pequenos lotes já inseridos em área urbana consolidada — usar Comparativo.',
        referencia_nbr: 'NBR 14653-2 §9.3',
        grau_confianca: 'alto',
      }
    }
    return {
      metodo_principal: METODO_LABELS.involutivo,
      metodo_id: 'involutivo',
      metodos_alternativos: [
        { id: 'comparativo', nome: METODO_LABELS.comparativo, motivo: 'Quando há lotes comparáveis com dados de venda' },
      ],
      justificativa:
        'Para terrenos urbanos com potencial de incorporação, o Método Involutivo simula a hipótese de construção e retrocede ao valor do terreno (VT = VGV − C − L). Para lotes em condomínio ou sem potencial de incorporação, o Comparativo é preferível.',
      dados_necessarios: DADOS_POR_METODO.involutivo,
      quando_usar: 'Terrenos urbanos com índice de aproveitamento definido pela prefeitura.',
      quando_nao_usar: 'Terrenos sem gabarito definido ou sem dados de mercado para o VGV.',
      referencia_nbr: 'NBR 14653-2 §9',
      grau_confianca: 'alto',
    }
  }

  // ─── RURAL ────────────────────────────────────────────
  if (inp.is_rural) {
    return {
      metodo_principal: METODO_LABELS.comparativo,
      metodo_id: 'comparativo',
      metodos_alternativos: [
        { id: 'evolutivo', nome: METODO_LABELS.evolutivo, motivo: 'Para avaliar benfeitorias e construções rurais' },
        { id: 'renda', nome: METODO_LABELS.renda, motivo: 'Para fazendas com produção ativa arrendável' },
      ],
      justificativa:
        'Imóveis rurais seguem a NBR 14653-3. Avaliam-se separadamente: terra nua (comparativo), benfeitorias (evolutivo/custo), culturas (valor de mercado ou custo implantação) e semoventes.',
      dados_necessarios: [
        ...DADOS_POR_METODO.comparativo,
        'Área total e módulo fiscal do município',
        'Classificação do solo (aptidão agrícola)',
        'Benfeitorias: construções, cercas, instalações',
        'Culturas permanentes e temporárias',
      ],
      quando_usar: 'Fazendas, sítios, chácaras, imóveis rurais com exploração agropecuária.',
      quando_nao_usar: 'Áreas rurais em processo de urbanização — usar Involutivo adaptado.',
      referencia_nbr: 'NBR 14653-3',
      grau_confianca: 'medio',
      alerta: 'Verificar se a área é rural ou já urbanizável — isso muda completamente o método indicado.',
    }
  }

  // ─── HOTEL / SHOPPING / RENDA ATIVA ───────────────────
  if (inp.tem_renda && (
    tipoImovel.includes('Hotel') || tipoImovel.includes('Pousada') ||
    tipoImovel.includes('Shopping') || tipoImovel.includes('Mall')
  )) {
    return {
      metodo_principal: METODO_LABELS.fcd,
      metodo_id: 'fcd',
      metodos_alternativos: [
        { id: 'cap_rate', nome: METODO_LABELS.cap_rate, motivo: 'Método mais simples para imóvel estabilizado' },
        { id: 'renda', nome: METODO_LABELS.renda, motivo: 'Capitalização direta quando fluxo é estável' },
      ],
      justificativa:
        'Hotéis, shoppings e imóveis de uso misto com receita operacional complexa são melhor avaliados pelo Fluxo de Caixa Descontado (DCF), que capta a variação temporal dos fluxos.',
      dados_necessarios: DADOS_POR_METODO.fcd,
      quando_usar: 'Imóveis com renda operacional variável, hotéis em ramp-up, empreendimentos em estabilização.',
      quando_nao_usar: 'Quando o fluxo de caixa futuro é imprevisível — usar Cap Rate ou Renda.',
      referencia_nbr: 'NBR 14653-2 §11.3',
      grau_confianca: 'medio',
    }
  }

  // ─── GALPÃO / LOJA / SALA COM LOCAÇÃO ─────────────────
  if (finalidade === 'Locação' || (inp.tem_renda && !tipoImovel.includes('Apartamento') && !tipoImovel.includes('Casa'))) {
    return {
      metodo_principal: METODO_LABELS.renda,
      metodo_id: 'renda',
      metodos_alternativos: [
        { id: 'cap_rate', nome: METODO_LABELS.cap_rate, motivo: 'Quando NOI mensal está disponível' },
        { id: 'comparativo', nome: METODO_LABELS.comparativo, motivo: 'Para comparar com imóveis similares' },
      ],
      justificativa:
        'Para locações e imóveis que geram renda, o Método da Renda por Capitalização Direta é o mais indicado (NBR 14653-2 §11): Valor = Renda líquida anual / Taxa de capitalização.',
      dados_necessarios: DADOS_POR_METODO.renda,
      quando_usar: 'Lojas, salas comerciais, galpões e imóveis com locatários estáveis.',
      quando_nao_usar: 'Imóveis residenciais em mercado ativo com muitas transações — preferir Comparativo.',
      referencia_nbr: 'NBR 14653-2 §11',
      grau_confianca: 'alto',
    }
  }

  // ─── CASA SEM COMPARÁVEIS ─────────────────────────────
  if (tipoImovel === 'Casa') {
    return {
      metodo_principal: METODO_LABELS.evolutivo,
      metodo_id: 'evolutivo',
      metodos_alternativos: [
        { id: 'comparativo', nome: METODO_LABELS.comparativo, motivo: 'Se houver casas similares vendidas recentemente' },
        { id: 'ross_heidecke', nome: METODO_LABELS.ross_heidecke, motivo: 'Para quantificar depreciação das benfeitorias' },
      ],
      justificativa:
        'Casas individuais, especialmente em locais com poucas transações, são bem avaliadas pelo Método Evolutivo: VI = VT (terreno pelo comparativo) + VB (custo de reprodução CUB × BDI × Ross-Heidecke).',
      dados_necessarios: DADOS_POR_METODO.evolutivo,
      quando_usar: 'Casas individuais, lotes com edificações únicas, imóveis em locais com mercado restrito.',
      quando_nao_usar: 'Condomínios fechados com muitas casas do mesmo tipo — usar Comparativo.',
      referencia_nbr: 'NBR 14653-2 §10',
      grau_confianca: 'alto',
    }
  }

  // ─── DEFAULT: APARTAMENTO / STUDIO / LOFT / COBERTURA ─
  return {
    metodo_principal: METODO_LABELS.comparativo,
    metodo_id: 'comparativo',
    metodos_alternativos: [
      { id: 'evolutivo', nome: METODO_LABELS.evolutivo, motivo: 'Quando não há comparáveis suficientes' },
      { id: 'renda', nome: METODO_LABELS.renda, motivo: 'Para fins de locação ou investimento' },
    ],
    justificativa:
      'O Método Comparativo Direto é o preferencial para imóveis residenciais em mercados ativos (NBR 14653-2 §8). Compara o imóvel avaliando com transações recentes de imóveis similares, aplicando fatores de homogeneização.',
    dados_necessarios: DADOS_POR_METODO.comparativo,
    quando_usar: 'Apartamentos, studios, coberturas em cidades com mercado imobiliário ativo.',
    quando_nao_usar: 'Imóveis únicos sem comparáveis — usar Evolutivo. Gera renda ativa — usar Renda.',
    referencia_nbr: 'NBR 14653-2 §8',
    grau_confianca: 'alto',
  }
}

/** Retorna explicação simples do método para o corretor */
export function explicarMetodoParaCorretor(metodoId: MetodoId): {
  titulo: string
  explicacao_simples: string
  exemplo: string
  tempo_estimado: string
} {
  const explicacoes: Record<MetodoId, { titulo: string; explicacao_simples: string; exemplo: string; tempo_estimado: string }> = {
    comparativo: {
      titulo: 'Método Comparativo Direto',
      explicacao_simples:
        'Você pesquisa imóveis parecidos que estão à venda na mesma região, ajusta as diferenças (área, andar, vagas) e calcula a média. É o método mais confiável quando há dados de mercado.',
      exemplo:
        'Você encontra 5 apartamentos de 80m² vendidos no mesmo bairro a R$ 6.000/m². Aplica fatores de ajuste e chega no valor do imóvel do seu cliente.',
      tempo_estimado: '30-60 minutos com 3-6 comparáveis',
    },
    evolutivo: {
      titulo: 'Método Evolutivo',
      explicacao_simples:
        'Você calcula separadamente o valor do terreno (pelo comparativo) e o custo de construir a casa hoje (CUB × área), menos a depreciação por idade e estado. Soma os dois.',
      exemplo:
        'Terreno: R$ 150.000 + Casa de 100m² × CUB R$ 2.450/m² × BDI 1,25 × Ross-Heidecke 0,80 = R$ 245.000. Total: R$ 395.000.',
      tempo_estimado: '20-40 minutos com dados de CUB e terreno',
    },
    involutivo: {
      titulo: 'Método Involutivo',
      explicacao_simples:
        'Para terrenos, você simula o que seria construído lá (VGV), desconta os custos e o lucro do incorporador, e o que sobra é o valor do terreno.',
      exemplo:
        'VGV de R$ 3M − 60% de custos − 15% de lucro = R$ 750.000 para o terreno.',
      tempo_estimado: '40-60 minutos com dados de mercado de incorporações',
    },
    renda: {
      titulo: 'Método da Renda (Capitalização)',
      explicacao_simples:
        'Você divide a renda líquida anual pela taxa de capitalização do mercado. Simples e direto para imóveis que geram aluguel.',
      exemplo:
        'Aluguel mensal de R$ 3.000 − despesas = R$ 2.700 líquidos × 12 = R$ 32.400/ano ÷ 6% = R$ 540.000.',
      tempo_estimado: '10-20 minutos com dados de aluguel',
    },
    cap_rate: {
      titulo: 'Cap Rate / NOI',
      explicacao_simples:
        'Parecido com o Método da Renda, mas usa o NOI (resultado operacional líquido) como base, descontando vacância e despesas operacionais completas.',
      exemplo:
        'NOI de R$ 80.000/mês × 12 = R$ 960.000/ano ÷ Cap Rate 8% = R$ 12.000.000.',
      tempo_estimado: '15-30 minutos com dados operacionais completos',
    },
    fcd: {
      titulo: 'Fluxo de Caixa Descontado (DCF)',
      explicacao_simples:
        'Você projeta todos os recebimentos futuros do imóvel por 10-15 anos, desconta pelo custo do dinheiro (TMA), e soma o valor residual. Ideal para imóveis complexos.',
      exemplo:
        'Hotel com receita de R$ 500.000/ano, crescendo 5%/ano por 10 anos, descontado a 12% a.a., mais valor residual de R$ 8M.',
      tempo_estimado: '1-2 horas com modelagem de fluxo completa',
    },
    liquidacao_forcada: {
      titulo: 'Liquidação Forçada',
      explicacao_simples:
        'Desconta o valor de mercado pela urgência de venda: 10% (liquidez alta), 20% (média) ou 30% (baixa). Usado em leilões e penhoras.',
      exemplo:
        'Imóvel com valor de mercado de R$ 500.000, liquidez baixa: R$ 500.000 × 70% = R$ 350.000.',
      tempo_estimado: '5-10 minutos (precisa do valor de mercado base)',
    },
    ross_heidecke: {
      titulo: 'Ross-Heidecke (Depreciação)',
      explicacao_simples:
        'Calcula quanto da vida útil do imóvel já foi consumida e em que estado está. Resultado: coeficiente que reduz o custo de construção.',
      exemplo:
        'Casa de 15 anos com vida útil de 60 anos (25% consumida) em estado "Regular": coeficiente 0,75, ou seja, vale 75% do custo novo.',
      tempo_estimado: '5 minutos com ano de construção e estado de conservação',
    },
    fundo_comercio: {
      titulo: 'Fundo de Comércio',
      explicacao_simples:
        'Calcula o valor intangível do negócio em funcionamento: clientela, ponto, marca. Faturamento × margem × multiplicador de meses.',
      exemplo:
        'Restaurante fatura R$ 50.000/mês com margem de 15% = R$ 7.500 × 24 meses = R$ 180.000 de fundo de comércio.',
      tempo_estimado: '15-30 minutos com dados financeiros do negócio',
    },
    ponto_comercial: {
      titulo: 'Ponto Comercial',
      explicacao_simples:
        'Avalia o valor do ponto em si (localização, fluxo de clientes, visibilidade), independente do negócio. Base: aluguel capitalizado + sobrevalor pela localização.',
      exemplo:
        'Ponto com aluguel mensal de R$ 5.000 × 12 ÷ 8% = R$ 750.000 de valor de ponto.',
      tempo_estimado: '20-30 minutos com pesquisa de aluguéis na região',
    },
    bdi: {
      titulo: 'BDI (Benefícios e Despesas Indiretas)',
      explicacao_simples:
        'Aplica um percentual sobre o custo direto de construção para cobrir despesas indiretas (administração, seguros, impostos, lucro). Simples e rápido para obras.',
      exemplo:
        'Custo direto R$ 200.000 × BDI 25% = R$ 250.000 custo total da obra.',
      tempo_estimado: '5-10 minutos com orçamento da obra',
    },
  }

  return explicacoes[metodoId]
}

/** Verifica se há dados suficientes para o método recomendado */
export function verificarDadosSuficientes(
  metodoId: MetodoId,
  dados: {
    area?: number
    comparaveis_count?: number
    tem_renda?: boolean
    tem_terreno?: boolean
    tem_ano_construcao?: boolean
    tem_vgv?: boolean
    tem_fluxo_caixa?: boolean
  }
): { suficiente: boolean; faltando: string[] } {
  const faltando: string[] = []

  switch (metodoId) {
    case 'comparativo':
      if (!dados.area) faltando.push('Área do imóvel (m²)')
      if ((dados.comparaveis_count ?? 0) < 3) faltando.push('Mínimo 3 comparáveis de mercado')
      break
    case 'evolutivo':
      if (!dados.area) faltando.push('Área construída (m²)')
      if (!dados.tem_terreno) faltando.push('Valor do terreno')
      if (!dados.tem_ano_construcao) faltando.push('Ano de construção')
      break
    case 'involutivo':
      if (!dados.tem_vgv) faltando.push('VGV (Valor Geral de Vendas) hipotético')
      if (!dados.area) faltando.push('Área do terreno (m²)')
      break
    case 'renda':
    case 'cap_rate':
      if (!dados.tem_renda) faltando.push('Renda mensal (aluguel bruto ou NOI)')
      break
    case 'fcd':
      if (!dados.tem_fluxo_caixa) faltando.push('Projeção de fluxo de caixa anual')
      if (!dados.tem_renda) faltando.push('Receita operacional base')
      break
    case 'ross_heidecke':
      if (!dados.tem_ano_construcao) faltando.push('Ano de construção')
      if (!dados.area) faltando.push('Área (m²) para custo de reprodução')
      break
  }

  return { suficiente: faltando.length === 0, faltando }
}
