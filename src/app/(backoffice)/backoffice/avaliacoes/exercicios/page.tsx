'use client'

import { useState } from 'react'
import {
  ArrowLeft, BookOpen, Play, CheckCircle, XCircle, Trophy,
  RefreshCw, ChevronRight, Loader2, Sparkles, Target,
  Clock, Zap, ChevronDown
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'

// ============================================================
// BANCO DE EXERCÍCIOS — NBR 14653 / Apostila João Diniz Marcello
// UNICRECI Pernambuco · Diniz Avaliações · 53 questões
// ============================================================

interface Exercicio {
  id: string
  categoria: string
  nivel: 'basico' | 'intermediario' | 'avancado'
  tipo: 'multipla_escolha' | 'calculo' | 'identificacao' | 'ordenacao'
  pergunta: string
  contexto?: string
  opcoes: string[]
  correta: number
  explicacao: string
  normaRef?: string
}

interface ScoreData {
  total: number
  corretas: number
  incorretas: number
  streak: number
  maxStreak: number
  categorias: Record<string, { total: number; corretas: number }>
}

const EXERCICIOS: Exercicio[] = [

  // ── HABILITAÇÃO & LEGISLAÇÃO ────────────────────────────────────
  {
    id: 'leg-1',
    categoria: 'Habilitação & Legislação',
    nivel: 'basico',
    tipo: 'multipla_escolha',
    pergunta: 'Quais são os quatro profissionais habilitados em lei para realizar avaliações de imóveis no Brasil?',
    opcoes: [
      'Corretores de Imóveis, Advogados, Contadores e Oficiais de Justiça',
      'Engenheiros Civis, Arquitetos, Corretores de Imóveis e Oficiais de Justiça',
      'Engenheiros Civis, Arquitetos, Administradores e Corretores de Imóveis',
      'Corretores de Imóveis, Engenheiros Civis, Advogados e Peritos Criminais',
    ],
    correta: 1,
    explicacao: 'São quatro categorias habilitadas em lei: Engenheiros Civis (Lei 5.194/66), Arquitetos (Lei 5.194/66), Corretores de Imóveis (Lei 6.530/78 Art. 3º) e Oficiais de Justiça (CPC Lei 13.105/15).',
    normaRef: 'Lei 6.530/78 Art. 3º',
  },
  {
    id: 'leg-2',
    categoria: 'Habilitação & Legislação',
    nivel: 'basico',
    tipo: 'identificacao',
    pergunta: 'A inscrição no CNAI (Cadastro Nacional de Avaliadores Imobiliários) é:',
    opcoes: [
      'Obrigatória para qualquer avaliação imobiliária',
      'Exigida apenas para perícias judiciais',
      'Opcional, mas pode ser exigida pelo solicitante da avaliação',
      'Exigida apenas para imóveis acima de R$ 1 milhão',
    ],
    correta: 2,
    explicacao: 'A Resolução COFECI 1.066/2007 estabelece que a inscrição no CNAI é opcional para o Corretor. Porém, o solicitante pode exigir o CNAI como requisito para aceitar o laudo — e a maioria das instituições financeiras já exige.',
    normaRef: 'Resolução COFECI 1.066/2007',
  },
  {
    id: 'leg-3',
    categoria: 'Habilitação & Legislação',
    nivel: 'basico',
    tipo: 'identificacao',
    pergunta: 'Qual resolução do COFECI regulamenta o PTAM e o Selo Certificador para avaliações de Corretores de Imóveis?',
    opcoes: [
      'Resolução COFECI 326/92',
      'Resolução COFECI 957/2006',
      'Resolução COFECI 1.066/2007',
      'Resolução CONFEA 345/90',
    ],
    correta: 2,
    explicacao: 'A Resolução COFECI 1.066/2007 é a norma que estabelece o PTAM como padrão, cria o Selo Certificador e define os requisitos para o exercício da atividade avaliatória por Corretores de Imóveis.',
    normaRef: 'Resolução COFECI 1.066/2007',
  },
  {
    id: 'leg-4',
    categoria: 'Habilitação & Legislação',
    nivel: 'basico',
    tipo: 'identificacao',
    pergunta: 'Por quantos anos o Corretor de Imóveis deve arquivar as avaliações realizadas?',
    opcoes: ['2 anos', '3 anos', '5 anos', '10 anos'],
    correta: 2,
    explicacao: 'A Resolução COFECI 1.066/2007 determina que o Corretor deve arquivar todas as avaliações por 5 (cinco) anos, sujeito ao Código de Ética Profissional (Resolução COFECI 326/92).',
    normaRef: 'Resolução COFECI 1.066/2007',
  },
  {
    id: 'leg-5',
    categoria: 'Habilitação & Legislação',
    nivel: 'intermediario',
    tipo: 'multipla_escolha',
    pergunta: 'Uma pessoa jurídica (imobiliária) pode ser responsável técnica por um laudo de avaliação imobiliária?',
    opcoes: [
      'Sim, desde que registrada no CRECI',
      'Sim, se tiver sócio Corretor de Imóveis com CNAI',
      'Não — a PJ pode patrocinar, mas o responsável sempre é o Corretor Pessoa Física',
      'Sim, se apresentar CNPJ ativo e Corretor credenciado como preposto',
    ],
    correta: 2,
    explicacao: 'Conforme a Resolução COFECI 1.066/2007, a Pessoa Jurídica pode patrocinar a avaliação, mas a responsabilidade técnica e ética é sempre do Corretor de Imóveis Pessoa Física que assina o laudo.',
    normaRef: 'Resolução COFECI 1.066/2007',
  },
  {
    id: 'leg-6',
    categoria: 'Habilitação & Legislação',
    nivel: 'basico',
    tipo: 'identificacao',
    pergunta: 'O Selo Certificador do COFECI deve ser afixado nas avaliações de Corretores. Qual o custo desse selo?',
    opcoes: [
      'R$ 50,00 por avaliação',
      'R$ 100,00 por avaliação',
      'Gratuito — fornecido eletronicamente pelo COFECI',
      'R$ 200,00 por avaliação',
    ],
    correta: 2,
    explicacao: 'O Selo Certificador é fornecido eletronicamente e gratuitamente pelo COFECI para dar credibilidade e certificação às avaliações. A maioria das instituições financeiras e tribunais exige o Selo para aceitar o laudo.',
    normaRef: 'Resolução COFECI 1.066/2007',
  },
  {
    id: 'leg-7',
    categoria: 'Habilitação & Legislação',
    nivel: 'avancado',
    tipo: 'multipla_escolha',
    pergunta: 'O STJ pacificou a competência do Corretor de Imóveis para avaliações judiciais por meio de qual julgado histórico?',
    opcoes: [
      'Agravo Regimental STJ 12.345 – 1999',
      'Recurso Especial STJ 277.443 – 2002',
      'Súmula Vinculante STF nº 37 – 2010',
      'ADI 4.234 – STF – 2010',
    ],
    correta: 1,
    explicacao: 'O Recurso Especial STJ 277.443/2002 pacificou a habilitação do Corretor de Imóveis para atuar como Perito Avaliador em avaliações judiciais e extrajudiciais, encerrando as contestações do CONFEA e IBAPE.',
    normaRef: 'STJ 277.443/2002',
  },

  // ── PTAM & LAUDOS ───────────────────────────────────────────────
  {
    id: 'ptam-1',
    categoria: 'PTAM & Laudos',
    nivel: 'basico',
    tipo: 'identificacao',
    pergunta: 'O que significa a sigla PTAM?',
    opcoes: [
      'Parecer Técnico de Avaliação Metodológica',
      'Protocolo Técnico de Análise de Mercado',
      'Parecer Técnico de Avaliação Mercadológica',
      'Plano Técnico de Avaliação Mercadológica',
    ],
    correta: 2,
    explicacao: 'PTAM = Parecer Técnico de Avaliação Mercadológica. É o documento-padrão estabelecido pela Resolução COFECI 1.066/2007 para avaliações realizadas por Corretores de Imóveis.',
    normaRef: 'Resolução COFECI 1.066/2007',
  },
  {
    id: 'ptam-2',
    categoria: 'PTAM & Laudos',
    nivel: 'intermediario',
    tipo: 'multipla_escolha',
    pergunta: 'Como se determina o grau final de um laudo de avaliação pela NBR 14653?',
    opcoes: [
      'Pela média entre o grau de fundamentação e o grau de precisão',
      'Pelo grau de fundamentação, independente do grau de precisão',
      'Pelo menor entre o grau de fundamentação e o grau de precisão',
      'Pelo maior entre o grau de fundamentação e o grau de precisão',
    ],
    correta: 2,
    explicacao: 'O grau final do laudo é o MENOR entre o grau de fundamentação e o grau de precisão. Exemplo: Grau III fundamentação + Grau II precisão = laudo Grau II.',
    normaRef: 'NBR 14653-2 §9',
  },
  {
    id: 'ptam-3',
    categoria: 'PTAM & Laudos',
    nivel: 'basico',
    tipo: 'multipla_escolha',
    pergunta: 'Qual elemento NÃO faz parte dos requisitos obrigatórios de um Laudo de Avaliação conforme NBR 14653?',
    opcoes: [
      'Caracterização do imóvel avaliando',
      'Identificação do solicitante',
      'Fotografias em resolução mínima de 4K',
      'Declaração do grau de fundamentação',
    ],
    correta: 2,
    explicacao: 'A NBR 14653-1 exige fotos, mas não especifica resolução em 4K. O requisito é que as imagens ilustrem o imóvel adequadamente. A resolução 4K não é critério normativo.',
    normaRef: 'NBR 14653-1 §8',
  },
  {
    id: 'ptam-4',
    categoria: 'PTAM & Laudos',
    nivel: 'intermediario',
    tipo: 'multipla_escolha',
    pergunta: 'O campo de arbítrio do valor no Método Comparativo (Grau II de precisão) corresponde a:',
    opcoes: [
      '± 5% do valor estimado',
      '± 10% do valor estimado',
      '± 15% do valor estimado',
      '± 20% do valor estimado',
    ],
    correta: 2,
    explicacao: 'O campo de arbítrio define o intervalo aceitável para o valor final: Grau III de precisão admite faixa mínima, Grau II admite ± 15%. O avaliador deve enquadrar o valor dentro desse campo.',
    normaRef: 'NBR 14653-2 §9.2',
  },

  // ── CONCEITUAÇÕES TÉCNICAS ──────────────────────────────────────
  {
    id: 'conc-1',
    categoria: 'Conceituações Técnicas',
    nivel: 'basico',
    tipo: 'multipla_escolha',
    pergunta: 'O que é "valor de mercado" de um imóvel?',
    opcoes: [
      'O preço pelo qual o imóvel foi comprado pelo proprietário atual',
      'O valor registrado no IPTU do município',
      'A quantia mais provável pela qual o imóvel seria negociado entre partes bem informadas, sem pressões',
      'O valor máximo que um comprador pagaria em leilão',
    ],
    correta: 2,
    explicacao: 'O valor de mercado é a quantia mais provável pela qual um imóvel seria negociado em uma data de referência, entre comprador e vendedor atuando livremente e com conhecimento do mercado. Reflete a tendência central do mercado imobiliário local.',
    normaRef: 'NBR 14653-1 §3',
  },
  {
    id: 'conc-2',
    categoria: 'Conceituações Técnicas',
    nivel: 'basico',
    tipo: 'identificacao',
    pergunta: 'O que é o "fator de oferta" em avaliações imobiliárias?',
    opcoes: [
      'O acréscimo de comissão cobrado pelo Corretor na venda',
      'O desconto percentual entre o preço de oferta e o preço efetivo de transação',
      'A comissão do intermediário imobiliário negociada com o vendedor',
      'A variação do IPCA aplicada ao valor do imóvel no período',
    ],
    correta: 1,
    explicacao: 'O fator de oferta é o desconto que representa a diferença típica entre o preço pedido e o preço efetivamente negociado. No mercado brasileiro varia entre 5% e 15%, sendo 10% a referência mais comum. Serve para equiparar amostras de oferta ao valor real de transação.',
    normaRef: 'NBR 14653-2 §8',
  },
  {
    id: 'conc-3',
    categoria: 'Conceituações Técnicas',
    nivel: 'intermediario',
    tipo: 'multipla_escolha',
    pergunta: 'O que é "homogeneização" de amostras no método comparativo?',
    opcoes: [
      'Selecionar apenas imóveis idênticos ao avaliando',
      'Transformar amostras heterogêneas em equivalentes ao avaliando, aplicando fatores de ajuste por variável',
      'Calcular simplesmente a média dos preços de venda coletados',
      'Remover os outliers (amostras que fogem muito da média)',
    ],
    correta: 1,
    explicacao: 'Homogeneização é o processo de tornar comparáveis amostras de diferentes características, aplicando fatores de ajuste (área, localização, padrão, estado de conservação, vagas etc.) para que todos reflitam as mesmas condições do imóvel avaliando.',
    normaRef: 'NBR 14653-2 §8.2',
  },
  {
    id: 'conc-4',
    categoria: 'Conceituações Técnicas',
    nivel: 'intermediario',
    tipo: 'identificacao',
    pergunta: 'O que é o "Coeficiente de Variação" (CV) em avaliações imobiliárias?',
    opcoes: [
      'A variação do valor do imóvel ao longo do tempo',
      'O percentual de desconto entre oferta e transação',
      'A medida de dispersão da amostra: (desvio padrão ÷ média) × 100',
      'O fator de correção para área do terreno',
    ],
    correta: 2,
    explicacao: 'O CV = (desvio padrão ÷ média) × 100, mede a dispersão relativa da amostra. A NBR 14653-2 usa o CV para classificar o grau de precisão: CV ≤ 15% → Grau III; CV ≤ 30% → Grau II; CV > 30% → Grau I.',
    normaRef: 'NBR 14653-2 Tabela 3',
  },
  {
    id: 'conc-5',
    categoria: 'Conceituações Técnicas',
    nivel: 'basico',
    tipo: 'identificacao',
    pergunta: 'O que é o "Valor Unitário" em avaliações imobiliárias?',
    opcoes: [
      'O valor total do imóvel incluindo terreno e benfeitorias',
      'O valor por unidade de área (R$/m²) = valor total ÷ área',
      'O valor de um único cômodo do imóvel avaliado',
      'O valor de mercado calculado com base em uma única amostra',
    ],
    correta: 1,
    explicacao: 'Valor Unitário = Valor Total ÷ Área (m²), expresso em R$/m². Permite comparar imóveis de diferentes tamanhos de forma normalizada. É a base para a homogeneização no método comparativo direto.',
    normaRef: 'NBR 14653-2 §8.2',
  },

  // ── METODOLOGIAS ────────────────────────────────────────────────
  {
    id: 'met-1',
    categoria: 'Metodologias',
    nivel: 'basico',
    tipo: 'multipla_escolha',
    pergunta: 'Qual metodologia é indicada pela NBR 14653-2 para avaliação de imóveis residenciais em regiões com mercado ativo?',
    opcoes: [
      'Método da Renda',
      'Método Comparativo Direto de Dados de Mercado',
      'Método Involutivo',
      'Método do Custo de Reprodução',
    ],
    correta: 1,
    explicacao: 'O Método Comparativo Direto é o preferencial quando há amostras de mercado suficientes, pois reflete diretamente o comportamento do mercado imobiliário local.',
    normaRef: 'NBR 14653-2 §8',
  },
  {
    id: 'met-2',
    categoria: 'Metodologias',
    nivel: 'intermediario',
    tipo: 'multipla_escolha',
    pergunta: 'Um avaliador precisa determinar o valor de um terreno urbano vazio com potencial para incorporação residencial. Qual método é mais indicado?',
    opcoes: [
      'Método Comparativo Direto',
      'Método da Renda',
      'Método Involutivo',
      'Método Evolutivo',
    ],
    correta: 2,
    explicacao: 'O Método Involutivo é indicado para terrenos, pois simula uma hipotética incorporação e, retrocedendo os custos e lucros, obtém o valor do terreno (VT = VGV - C - L).',
    normaRef: 'NBR 14653-2 §9',
  },
  {
    id: 'met-3',
    categoria: 'Metodologias',
    nivel: 'intermediario',
    tipo: 'multipla_escolha',
    pergunta: 'Para avaliar um shopping center ou hotel operacional, qual metodologia capta melhor o valor do ativo?',
    opcoes: [
      'Método Evolutivo',
      'Método Comparativo',
      'Método da Renda',
      'Método do Custo',
    ],
    correta: 2,
    explicacao: 'O Método da Renda é adequado para imóveis que geram renda, pois capitaliza o fluxo de caixa futuro esperado para obter o valor presente do ativo.',
    normaRef: 'NBR 14653-2 §11',
  },
  {
    id: 'met-4',
    categoria: 'Metodologias',
    nivel: 'avancado',
    tipo: 'multipla_escolha',
    pergunta: 'No Método Evolutivo, o valor do imóvel é composto por:',
    opcoes: [
      'Valor de venda - custos de transação',
      'Valor do terreno + custo de reprodução das benfeitorias (com depreciação)',
      'Renda capitalizada + valor residual',
      'Custo de reposição + lucro do incorporador',
    ],
    correta: 1,
    explicacao: 'O Método Evolutivo soma o valor do terreno (pelo Comparativo) com o custo de reprodução das benfeitorias deduzido da depreciação física e funcional (Tabela Ross-Heidecke).',
    normaRef: 'NBR 14653-2 §10',
  },

  // ── GRAUS NBR 14653 ─────────────────────────────────────────────
  {
    id: 'grau-1',
    categoria: 'Graus NBR',
    nivel: 'basico',
    tipo: 'multipla_escolha',
    pergunta: 'Quantas amostras de mercado são necessárias para atingir Grau III de fundamentação no Método Comparativo?',
    opcoes: ['3 amostras', '5 amostras', '8 amostras ou mais', '12 amostras'],
    correta: 1,
    explicacao: 'O Grau III exige no mínimo 5 amostras para fundamentar o laudo pelo método comparativo, garantindo representatividade estatística adequada.',
    normaRef: 'NBR 14653-2 Tabela 2',
  },
  {
    id: 'grau-2',
    categoria: 'Graus NBR',
    nivel: 'intermediario',
    tipo: 'multipla_escolha',
    pergunta: 'Um laudo com CV (coeficiente de variação) de 35% está dentro do limite aceitável para qual grau de precisão?',
    opcoes: [
      'Grau I (CV > 30%)',
      'Grau II (CV ≤ 30%)',
      'Grau III (CV ≤ 15%)',
      'Não atinge nenhum grau',
    ],
    correta: 0,
    explicacao: 'A NBR 14653-2 classifica: Grau III com CV ≤ 15%, Grau II com CV ≤ 30% e Grau I para CV acima de 30%. Um CV de 35% enquadra-se no Grau I de precisão.',
    normaRef: 'NBR 14653-2 Tabela 3',
  },
  {
    id: 'grau-3',
    categoria: 'Graus NBR',
    nivel: 'basico',
    tipo: 'multipla_escolha',
    pergunta: 'Quantas amostras mínimas são exigidas para o Grau I de fundamentação no Método Comparativo?',
    opcoes: ['1 amostra', '3 amostras', '5 amostras', '8 amostras'],
    correta: 1,
    explicacao: 'O Grau I de fundamentação exige no mínimo 3 amostras comparativas. É o grau mínimo aceitável, adequado para avaliações simples ou locais com poucas transações no mercado.',
    normaRef: 'NBR 14653-2 Tabela 2',
  },
  {
    id: 'grau-4',
    categoria: 'Graus NBR',
    nivel: 'intermediario',
    tipo: 'identificacao',
    pergunta: 'CV ≤ 15% corresponde a qual grau de precisão na NBR 14653-2?',
    opcoes: [
      'Grau I de precisão',
      'Grau II de precisão',
      'Grau III de precisão',
      'Fora da classificação normativa',
    ],
    correta: 2,
    explicacao: 'CV ≤ 15% = Grau III de precisão (máxima precisão). CV ≤ 30% = Grau II. CV > 30% = Grau I. O Grau III indica que a amostra está bem concentrada em torno da média.',
    normaRef: 'NBR 14653-2 Tabela 3',
  },

  // ── CÁLCULOS ────────────────────────────────────────────────────
  {
    id: 'calc-1',
    categoria: 'Cálculos',
    nivel: 'basico',
    tipo: 'calculo',
    pergunta: 'Um apartamento de 80m² foi avaliado em R$ 480.000. Qual é o valor unitário (R$/m²)?',
    contexto: 'Área: 80 m² | Valor total: R$ 480.000',
    opcoes: ['R$ 5.500/m²', 'R$ 6.000/m²', 'R$ 6.500/m²', 'R$ 7.000/m²'],
    correta: 1,
    explicacao: 'Valor unitário = R$ 480.000 ÷ 80m² = R$ 6.000/m². Sempre calcular o valor unitário das amostras para comparação homogênea.',
    normaRef: 'NBR 14653-2 §8.2',
  },
  {
    id: 'calc-2',
    categoria: 'Cálculos',
    nivel: 'intermediario',
    tipo: 'calculo',
    pergunta: 'Em 3 amostras com valores unitários de R$ 7.000, R$ 7.500 e R$ 8.500/m², qual é o valor médio?',
    contexto: 'Amostras: R$ 7.000 / R$ 7.500 / R$ 8.500 por m²',
    opcoes: ['R$ 7.500/m²', 'R$ 7.667/m²', 'R$ 8.000/m²', 'R$ 7.750/m²'],
    correta: 1,
    explicacao: 'Média = (7.000 + 7.500 + 8.500) / 3 = R$ 7.667/m². A média aritmética simples é o ponto de partida antes da ponderação estatística.',
  },
  {
    id: 'calc-3',
    categoria: 'Cálculos',
    nivel: 'avancado',
    tipo: 'calculo',
    pergunta: 'Um imóvel tem valor de oferta de R$ 800.000. Aplicando fator de oferta de 10%, qual é o valor de transação estimado?',
    contexto: 'Valor de oferta: R$ 800.000 | Fator oferta: -10%',
    opcoes: ['R$ 710.000', 'R$ 720.000', 'R$ 750.000', 'R$ 780.000'],
    correta: 1,
    explicacao: 'Valor de transação = R$ 800.000 × (1 - 0,10) = R$ 720.000. O fator de oferta desconta a diferença típica entre preço pedido e preço negociado.',
  },

  // ── HONORÁRIOS ──────────────────────────────────────────────────
  {
    id: 'hon-1',
    categoria: 'Honorários',
    nivel: 'basico',
    tipo: 'multipla_escolha',
    pergunta: 'Qual referência normativa orienta o cálculo de honorários para avaliações imobiliárias no Brasil?',
    opcoes: [
      'ABNT NBR 14653-1',
      'Tabela do IBAPE/SP e IBAPE Nacional',
      'Resolução CONFEA nº 1010',
      'Decreto nº 81.871/78',
    ],
    correta: 1,
    explicacao: 'O IBAPE (Instituto Brasileiro de Avaliações e Perícias de Engenharia) publica tabelas de referência de honorários amplamente aceitas no mercado. Não são obrigatórias, mas servem como parâmetro para tribunais e instituições financeiras.',
  },
  {
    id: 'hon-2',
    categoria: 'Honorários',
    nivel: 'intermediario',
    tipo: 'multipla_escolha',
    pergunta: 'Para uma perícia judicial, os honorários do perito avaliador são geralmente:',
    opcoes: [
      'Iguais a uma avaliação extrajudicial',
      'Menores, pois o tribunal controla o teto',
      'Majorados em razão da responsabilidade judicial e complexidade',
      'Calculados apenas pelo valor do imóvel',
    ],
    correta: 2,
    explicacao: 'Em perícias judiciais, os honorários periciais são majorados em razão da responsabilidade perante o juízo, prazos processuais rígidos e possibilidade de impugnação do trabalho.',
  },
  {
    id: 'hon-3',
    categoria: 'Honorários',
    nivel: 'intermediario',
    tipo: 'multipla_escolha',
    pergunta: 'Na tabela IBAPE, o percentual de honorários sobre o valor do imóvel avaliado tende a ser:',
    opcoes: [
      'Fixo em 1% independente do valor',
      'Maior para imóveis mais caros (escala crescente)',
      'Progressivamente menor conforme o valor aumenta (escala regressiva)',
      'Definido exclusivamente pelo juiz em casos judiciais',
    ],
    correta: 2,
    explicacao: 'A tabela IBAPE aplica percentuais regressivos: quanto maior o valor do imóvel, menor o percentual aplicado — similar à tabela do IR progressivo, mas em sentido inverso. Isso garante equilíbrio entre esforço do avaliador e remuneração.',
  },
  {
    id: 'hon-4',
    categoria: 'Honorários',
    nivel: 'basico',
    tipo: 'multipla_escolha',
    pergunta: 'Para uma avaliação de inventário (retroativa à data do óbito), os honorários costumam ser:',
    opcoes: [
      'Iguais a uma avaliação comum',
      'Menores, pois é mais simples',
      'Majorados pela complexidade e dupla apuração de datas',
      'Proibidos — o avaliador não pode cobrar em casos judiciais',
    ],
    correta: 2,
    explicacao: 'Avaliações retroativas para inventário exigem pesquisa histórica de mercado, aplicação de índices de atualização (CUB) e apuração de dois valores (data do óbito e data atual), justificando honorários majorados.',
  },

  // ── FUNDAMENTAÇÃO / VISTORIA ────────────────────────────────────
  {
    id: 'fund-1',
    categoria: 'Fundamentação',
    nivel: 'avancado',
    tipo: 'multipla_escolha',
    pergunta: 'O campo de arbítrio do valor no Método Comparativo (Grau III de precisão) deve ser:',
    opcoes: [
      '± 5% do valor estimado',
      '± 10% do valor estimado',
      'O menor possível, dentro do intervalo de confiança estatístico',
      '± 20% do valor estimado',
    ],
    correta: 2,
    explicacao: 'No Grau III de precisão, o campo de arbítrio deve ser o mínimo possível, definido pelo intervalo de confiança do modelo estatístico (regressão). No Grau II permite-se ± 15%.',
    normaRef: 'NBR 14653-2 §9.2',
  },
  {
    id: 'vist-1',
    categoria: 'Vistoria',
    nivel: 'basico',
    tipo: 'multipla_escolha',
    pergunta: 'Durante a vistoria do imóvel avaliando, o avaliador deve obrigatoriamente:',
    opcoes: [
      'Realizar medições com laser profissional certificado',
      'Identificar e registrar as características do imóvel com fotos e anotações',
      'Entrevistar todos os vizinhos do imóvel',
      'Registrar em cartório a data e horário da vistoria',
    ],
    correta: 1,
    explicacao: 'A vistoria deve identificar e documentar as características físicas do imóvel (estado de conservação, área, benfeitorias) com registro fotográfico, fundamentando a avaliação.',
    normaRef: 'NBR 14653-1 §6',
  },

  // ── CUB ─────────────────────────────────────────────────────────
  {
    id: 'cub-1',
    categoria: 'CUB',
    nivel: 'basico',
    tipo: 'identificacao',
    pergunta: 'O que significa CUB e quem o publica?',
    opcoes: [
      'Custo Unitário Básico — publicado pela CEF mensalmente',
      'Custo Unitário Básico — publicado pelo SINDUSCON regional mensalmente',
      'Custo Útil de Benfeitorias — publicado pelo IBAPE anualmente',
      'Custo Unitário de Benfeitorias — publicado pela ABNT trimestralmente',
    ],
    correta: 1,
    explicacao: 'O CUB (Custo Unitário Básico) é o custo por m² de construção, publicado mensalmente pelo SINDUSCON (Sindicato da Construção Civil) de cada estado. É a referência oficial para atualização do custo de edificações.',
    normaRef: 'Lei 4.591/64 Art. 54',
  },
  {
    id: 'cub-2',
    categoria: 'CUB',
    nivel: 'intermediario',
    tipo: 'calculo',
    pergunta: 'Uma casa foi construída em jan/2020 com custo de R$ 200.000. CUB jan/2020 = 1.800; CUB atual = 2.160. Qual o custo atualizado?',
    contexto: 'Custo original: R$ 200.000 | CUB jan/2020: R$ 1.800 | CUB atual: R$ 2.160',
    opcoes: ['R$ 220.000', 'R$ 240.000', 'R$ 250.000', 'R$ 260.000'],
    correta: 1,
    explicacao: 'Custo atualizado = R$ 200.000 × (2.160 / 1.800) = R$ 200.000 × 1,20 = R$ 240.000. O CUB atualiza o custo de construção entre datas pelo índice do SINDUSCON.',
    normaRef: 'NBR 14653-2 §10',
  },
  {
    id: 'cub-3',
    categoria: 'CUB',
    nivel: 'intermediario',
    tipo: 'multipla_escolha',
    pergunta: 'Em processo de inventário, o avaliador deve calcular o valor do imóvel na data do óbito. Qual índice retroage o custo de construção?',
    opcoes: [
      'IGPM acumulado da data do óbito até hoje',
      'CUB/SINDUSCON — dividindo o CUB do óbito pelo CUB atual',
      'INPC acumulado no período',
      'Taxa SELIC do período',
    ],
    correta: 1,
    explicacao: 'Para retroagir o custo de construção na data do óbito: Custo retroagido = Custo atual × (CUB óbito / CUB atual). O CUB é o índice oficial para atualizar/retroagir custos de edificações.',
    normaRef: 'NBR 14653-2 §10.2',
  },
  {
    id: 'cub-4',
    categoria: 'CUB',
    nivel: 'avancado',
    tipo: 'multipla_escolha',
    pergunta: 'Ao usar o CUB no método evolutivo, o cálculo do Valor das Benfeitorias (VB) deve considerar:',
    opcoes: [
      'Apenas CUB × área total, sem ajustes',
      'CUB × área × BDI, depois depreciado pela Tabela Ross-Heidecke',
      'CUB × área × 1,5 como fator padrão de mercado',
      'CUB dividido por 12 (mensal) × área privativa',
    ],
    correta: 1,
    explicacao: 'VB = CUB × área × BDI × Fator Ross-Heidecke. O BDI (Benefícios e Despesas Indiretas) — encargos, impostos e margem do construtor — geralmente varia entre 25% e 30%.',
    normaRef: 'NBR 14653-2 §10',
  },

  // ── MÉTODO EVOLUTIVO ────────────────────────────────────────────
  {
    id: 'evol-1',
    categoria: 'Método Evolutivo',
    nivel: 'basico',
    tipo: 'multipla_escolha',
    pergunta: 'Qual é a fórmula do Método Evolutivo para calcular o valor do imóvel?',
    opcoes: [
      'VI = VT × VB',
      'VI = VGV − C − L',
      'VI = VT + VB (depreciado)',
      'VI = Renda ÷ Taxa de capitalização',
    ],
    correta: 2,
    explicacao: 'No Método Evolutivo: VI = VT (Valor do Terreno) + VB (Valor das Benfeitorias depreciado). VT é obtido pelo comparativo direto; VB pelo custo de reprodução × BDI × fator Ross-Heidecke.',
    normaRef: 'NBR 14653-2 §10',
  },
  {
    id: 'evol-2',
    categoria: 'Método Evolutivo',
    nivel: 'intermediario',
    tipo: 'identificacao',
    pergunta: 'Qual tabela é usada para calcular a depreciação física das benfeitorias no Método Evolutivo?',
    opcoes: [
      'Tabela Price',
      'Tabela Ross-Heidecke',
      'Tabela SINDUSCON de depreciação',
      'Tabela ABNT de vida útil de edificações',
    ],
    correta: 1,
    explicacao: 'A Tabela Ross-Heidecke é o padrão para depreciação física em avaliações imobiliárias. Combina a percentagem de vida útil consumida com o estado de conservação (ótimo, bom, regular, ruim, péssimo) para obter o fator de depreciação.',
    normaRef: 'NBR 14653-2 Anexo B',
  },
  {
    id: 'evol-3',
    categoria: 'Método Evolutivo',
    nivel: 'avancado',
    tipo: 'calculo',
    pergunta: 'Custo de reprodução de uma casa: R$ 300.000. Fator Ross-Heidecke = 0,72 (bom estado, 30% de vida útil consumida). Qual é o VB?',
    contexto: 'Custo de reprodução: R$ 300.000 | Fator Ross-Heidecke: 0,72',
    opcoes: ['R$ 180.000', 'R$ 196.000', 'R$ 216.000', 'R$ 228.000'],
    correta: 2,
    explicacao: 'VB = Custo de reprodução × Fator Ross-Heidecke = R$ 300.000 × 0,72 = R$ 216.000.',
    normaRef: 'NBR 14653-2 §10',
  },
  {
    id: 'evol-4',
    categoria: 'Método Evolutivo',
    nivel: 'basico',
    tipo: 'multipla_escolha',
    pergunta: 'O Método Evolutivo é mais indicado para:',
    opcoes: [
      'Apartamentos em condomínios com muitas transações de mercado',
      'Terrenos urbanos vazios em área de incorporação',
      'Casas individuais e propriedades sem comparativos diretos de venda',
      'Shopping centers e hotéis operacionais',
    ],
    correta: 2,
    explicacao: 'O Método Evolutivo é indicado quando não há comparativos de venda direta — casas individuais, imóveis com benfeitorias especiais, propriedades em locais com poucas transações. Decompõe o valor em terreno + benfeitorias.',
    normaRef: 'NBR 14653-2 §10',
  },
  {
    id: 'evol-5',
    categoria: 'Método Evolutivo',
    nivel: 'intermediario',
    tipo: 'multipla_escolha',
    pergunta: 'Qual a diferença entre "custo de reprodução" e "custo de reposição"?',
    opcoes: [
      'São sinônimos — significam o mesmo na NBR 14653',
      'Reprodução = reconstruir idêntico; Reposição = construir com técnicas/materiais atuais com mesma utilidade',
      'Reprodução = materiais atuais; Reposição = materiais da época original',
      'Reprodução é para obras novas; Reposição é exclusivo para reformas',
    ],
    correta: 1,
    explicacao: 'Custo de Reprodução = reconstruir exatamente o mesmo imóvel (mesmos materiais e técnica originais). Custo de Reposição = construir imóvel com a mesma utilidade usando materiais e técnicas modernas. A NBR 14653-2 usa o custo de reprodução como base no método evolutivo.',
    normaRef: 'NBR 14653-2 §3',
  },

  // ── MÉTODO INVOLUTIVO ───────────────────────────────────────────
  {
    id: 'inv-1',
    categoria: 'Método Involutivo',
    nivel: 'basico',
    tipo: 'multipla_escolha',
    pergunta: 'Qual é a fórmula básica do Método Involutivo para calcular o valor do terreno?',
    opcoes: [
      'VT = VGV + C + L',
      'VT = VGV − C − L',
      'VT = (VGV × C) ÷ L',
      'VT = VI − VB',
    ],
    correta: 1,
    explicacao: 'No Método Involutivo: VT (Valor do Terreno) = VGV (Valor Geral de Vendas) − C (Custos totais da incorporação) − L (Lucro do incorporador). Parte do cenário hipotético de incorporação para retroagir ao valor do terreno.',
    normaRef: 'NBR 14653-2 §9',
  },
  {
    id: 'inv-2',
    categoria: 'Método Involutivo',
    nivel: 'basico',
    tipo: 'identificacao',
    pergunta: 'O que significa VGV no Método Involutivo?',
    opcoes: [
      'Valor Geral de Vendas — receita total estimada com a venda de todas as unidades',
      'Valor Global do Vendedor — preço pedido pelo proprietário do terreno',
      'Volume Global do Valor — custo total de construção do empreendimento',
      'Variação Geral do Valor — índice de correção do mercado imobiliário',
    ],
    correta: 0,
    explicacao: 'VGV = Valor Geral de Vendas: receita total estimada com a venda de TODAS as unidades da incorporação hipotética (nº de unidades × preço médio por unidade). É o ponto de partida do Método Involutivo.',
    normaRef: 'NBR 14653-2 §9',
  },
  {
    id: 'inv-3',
    categoria: 'Método Involutivo',
    nivel: 'avancado',
    tipo: 'calculo',
    pergunta: 'VGV de R$ 3.000.000. Custos (construção + impostos + admin): 60% do VGV. Lucro do incorporador: 15% do VGV. Qual é o valor do terreno?',
    contexto: 'VGV: R$ 3.000.000 | Custos: 60% | Lucro: 15%',
    opcoes: ['R$ 600.000', 'R$ 650.000', 'R$ 700.000', 'R$ 750.000'],
    correta: 3,
    explicacao: 'VT = VGV − C − L = R$ 3.000.000 − (60% × R$ 3.000.000) − (15% × R$ 3.000.000) = R$ 3.000.000 − R$ 1.800.000 − R$ 450.000 = R$ 750.000.',
    normaRef: 'NBR 14653-2 §9',
  },
  {
    id: 'inv-4',
    categoria: 'Método Involutivo',
    nivel: 'intermediario',
    tipo: 'multipla_escolha',
    pergunta: 'No Método Involutivo, o que é "permuta" entre incorporador e proprietário do terreno?',
    opcoes: [
      'Venda do terreno parcelada em prestações mensais ao incorporador',
      'Troca do terreno por unidades do empreendimento a construir, sem transação financeira imediata',
      'Hipoteca do terreno como garantia do financiamento da obra',
      'Cessão de direitos com pagamento diferido após a entrega das unidades',
    ],
    correta: 1,
    explicacao: 'Na permuta, o proprietário cede o terreno em troca de um percentual das unidades construídas (ex: 20% das unidades). Elimina a necessidade de capital para compra do terreno e é amplamente usado em incorporações no Brasil.',
    normaRef: 'NBR 14653-2 §9',
  },
  {
    id: 'inv-5',
    categoria: 'Método Involutivo',
    nivel: 'avancado',
    tipo: 'multipla_escolha',
    pergunta: 'Para avaliação de glebas urbanizáveis, qual é a fórmula do Método Involutivo adaptado?',
    opcoes: [
      'VG = VGV − C − L (igual ao método padrão para edifícios)',
      'VG = VGV − Dd − Di − L (descontando despesas diretas e indiretas de urbanização)',
      'VG = VT × fator de gleba definido pelo município',
      'VG = área total × CUB − lucro do loteador',
    ],
    correta: 1,
    explicacao: 'Para glebas (grandes terrenos a lotear): VG = VGV − Dd − Di − L, onde Dd = despesas diretas de urbanização (infraestrutura viária, redes), Di = despesas indiretas (projetos, licenças, impostos) e L = lucro do empreendedor. Áreas públicas e de preservação são descontadas do VGV.',
    normaRef: 'NBR 14653-2 §9.3',
  },

  // ── MÉTODO DA RENDA ─────────────────────────────────────────────
  {
    id: 'renda-1',
    categoria: 'Método da Renda',
    nivel: 'basico',
    tipo: 'multipla_escolha',
    pergunta: 'O Método da Renda é mais adequado para avaliar:',
    opcoes: [
      'Apartamentos residenciais em bairros com muitas transações',
      'Terrenos urbanos vazios para incorporação',
      'Imóveis que geram renda operacional (hotéis, shoppings, escritórios locados)',
      'Casas individuais sem comparativos diretos de mercado',
    ],
    correta: 2,
    explicacao: 'O Método da Renda capitaliza o fluxo de caixa futuro para obter o valor presente do ativo. É ideal para hotéis, shoppings, condomínios logísticos e escritórios com locatários estáveis.',
    normaRef: 'NBR 14653-2 §11',
  },
  {
    id: 'renda-2',
    categoria: 'Método da Renda',
    nivel: 'intermediario',
    tipo: 'identificacao',
    pergunta: 'O que é a "taxa de capitalização" no Método da Renda?',
    opcoes: [
      'A rentabilidade histórica do imóvel nos últimos 5 anos',
      'A relação entre a renda líquida anual e o valor de mercado do imóvel',
      'A taxa de juros do financiamento imobiliário utilizado na compra',
      'O percentual médio de vacância do imóvel ao longo do ano',
    ],
    correta: 1,
    explicacao: 'Taxa de capitalização = Renda líquida anual / Valor de mercado. Representa o retorno esperado pelo investidor. No mercado residencial brasileiro varia de 4% a 8% a.a. A fórmula inversa: Valor = Renda líquida anual / Taxa.',
    normaRef: 'NBR 14653-2 §11',
  },
  {
    id: 'renda-3',
    categoria: 'Método da Renda',
    nivel: 'avancado',
    tipo: 'calculo',
    pergunta: 'Um galpão logístico gera aluguel líquido de R$ 80.000/mês. Taxa de capitalização de mercado: 8% a.a. Qual é o valor do imóvel?',
    contexto: 'Aluguel líquido: R$ 80.000/mês | Taxa: 8% a.a.',
    opcoes: ['R$ 8.000.000', 'R$ 10.000.000', 'R$ 12.000.000', 'R$ 14.400.000'],
    correta: 2,
    explicacao: 'Renda anual = R$ 80.000 × 12 = R$ 960.000. Valor = Renda anual / Taxa = R$ 960.000 / 0,08 = R$ 12.000.000.',
    normaRef: 'NBR 14653-2 §11',
  },

  // ── AVALIAÇÃO RURAL ─────────────────────────────────────────────
  {
    id: 'rural-1',
    categoria: 'Avaliação Rural',
    nivel: 'basico',
    tipo: 'identificacao',
    pergunta: 'Quais são os componentes de um imóvel rural para fins de avaliação pela NBR 14653-3?',
    opcoes: [
      'Terra nua, benfeitorias, culturas e semoventes',
      'Terra nua e benfeitorias apenas',
      'Apenas a terra nua e as pastagens naturais',
      'Terra nua, benfeitorias, culturas, semoventes e produtos armazenados',
    ],
    correta: 3,
    explicacao: 'O imóvel rural é composto por: (1) Terra nua, (2) Benfeitorias (construções, instalações), (3) Culturas (permanentes e temporárias), (4) Semoventes (animais), (5) Produtos (colheitas armazenadas). Cada componente é avaliado separadamente.',
    normaRef: 'NBR 14653-3',
  },
  {
    id: 'rural-2',
    categoria: 'Avaliação Rural',
    nivel: 'intermediario',
    tipo: 'identificacao',
    pergunta: 'O que é "terra nua" em avaliação de imóvel rural?',
    opcoes: [
      'Terra sem nenhuma vegetação, completamente desmatada',
      'O valor do solo desconsiderando benfeitorias, culturas, semoventes e produtos',
      'Terra com solo de baixa fertilidade e sem aproveitamento agrícola',
      'Área rural que nunca foi cultivada nem explorada economicamente',
    ],
    correta: 1,
    explicacao: 'Terra Nua = valor do solo em si, desconsiderando benfeitorias, culturas, semoventes e produtos. Inclui as características naturais do terreno (topografia, qualidade do solo, localização, acesso a água) mas sem melhoramentos artificiais.',
    normaRef: 'NBR 14653-3',
  },
  {
    id: 'rural-3',
    categoria: 'Avaliação Rural',
    nivel: 'intermediario',
    tipo: 'multipla_escolha',
    pergunta: 'Para avaliar uma fazenda de café com produção ativa, qual é a abordagem correta?',
    opcoes: [
      'Avaliar tudo pelo CUB rural em conjunto, numa única conta',
      'Avaliar separadamente: terra nua + benfeitorias + cultura do café + equipamentos',
      'Usar apenas o método da renda considerando toda a produção anual',
      'Aplicar o método comparativo buscando fazendas de café similares na região',
    ],
    correta: 1,
    explicacao: 'A avaliação rural decompõe: (1) Terra nua = comparativo de terrenos rurais; (2) Benfeitorias = método evolutivo (custo depreciado); (3) Cultura permanente (café) = valor de mercado ou custo de implantação; (4) Equipamentos = valor de mercado. Valor final = soma dos componentes.',
    normaRef: 'NBR 14653-3',
  },
  {
    id: 'rural-4',
    categoria: 'Avaliação Rural',
    nivel: 'avancado',
    tipo: 'multipla_escolha',
    pergunta: 'Para avaliação de glebas rurais urbanizáveis (próximas a cidades em expansão), qual metodologia é mais adequada?',
    opcoes: [
      'Método Comparativo Direto apenas (preço por hectare)',
      'Método da Renda com base em arrendamento rural',
      'Método Involutivo adaptado para glebas (VG = VGV − Dd − Di − L)',
      'Método Evolutivo com CUB rural como referência',
    ],
    correta: 2,
    explicacao: 'Glebas rurais em área de expansão urbana têm valor determinado pelo potencial de urbanização. O Método Involutivo adaptado (VG = VGV − Dd − Di − L) é o mais adequado, simulando o loteamento hipotético e descontando custos de urbanização e lucro do empreendedor.',
    normaRef: 'NBR 14653-3 §9',
  },
]

const CATEGORIAS = [...new Set(EXERCICIOS.map(e => e.categoria))]
const NIVEIS: Record<string, string> = {
  basico: '🟢 Básico',
  intermediario: '🟡 Intermediário',
  avancado: '🔴 Avançado',
}

export default function ExerciciosPage() {
  const router = useRouter()
  const [selectedCat, setSelectedCat] = useState<string>('Todos')
  const [selectedNivel, setSelectedNivel] = useState<string>('Todos')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [mode, setMode] = useState<'menu' | 'treino' | 'resultado'>('menu')
  const [score, setScore] = useState<ScoreData>({
    total: 0, corretas: 0, incorretas: 0, streak: 0, maxStreak: 0, categorias: {},
  })
  const [iaExercicio, setIaExercicio] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showIA, setShowIA] = useState(false)

  const filtered = EXERCICIOS.filter(e =>
    (selectedCat === 'Todos' || e.categoria === selectedCat) &&
    (selectedNivel === 'Todos' || e.nivel === selectedNivel)
  )

  const current = filtered[currentIdx]

  const handleAnswer = (idx: number) => {
    if (revealed) return
    setSelected(idx)
    setRevealed(true)
    const correct = idx === current.correta
    const newStreak = correct ? score.streak + 1 : 0
    setScore(prev => ({
      total: prev.total + 1,
      corretas: correct ? prev.corretas + 1 : prev.corretas,
      incorretas: !correct ? prev.incorretas + 1 : prev.incorretas,
      streak: newStreak,
      maxStreak: Math.max(newStreak, prev.maxStreak),
      categorias: {
        ...prev.categorias,
        [current.categoria]: {
          total: (prev.categorias[current.categoria]?.total || 0) + 1,
          corretas: (prev.categorias[current.categoria]?.corretas || 0) + (correct ? 1 : 0),
        },
      },
    }))
  }

  const handleNext = () => {
    if (currentIdx < filtered.length - 1) {
      setCurrentIdx(prev => prev + 1)
      setSelected(null)
      setRevealed(false)
    } else {
      setMode('resultado')
    }
  }

  const startTreino = () => {
    setCurrentIdx(0)
    setSelected(null)
    setRevealed(false)
    setScore({ total: 0, corretas: 0, incorretas: 0, streak: 0, maxStreak: 0, categorias: {} })
    setMode('treino')
  }

  const generateIAExercise = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/avaliacoes/gerar-exercicio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria: selectedCat, nivel: selectedNivel, quantidade: 1 }),
      })
      const _data = await response.json()
      if (_data.success && _data.exercicios?.length > 0) {
        setIaExercicio(JSON.stringify(_data.exercicios[0]))
      } else {
        throw new Error(_data.error || 'Falha na geração')
      }
    } catch {
      setIaExercicio(JSON.stringify({
        pergunta: 'Qual o principal objetivo da NBR 14653-1?',
        opcoes: ['Regulamentar incorporações', 'Estabelecer procedimentos para avaliação de bens', 'Definir honorários obrigatórios', 'Regulamentar o CRECI'],
        correta: 1,
        explicacao: 'A NBR 14653-1 estabelece diretrizes gerais para avaliação de bens, sendo a norma-mãe da série.',
        normaRef: 'NBR 14653-1',
      }))
    }
    setIsGenerating(false)
  }

  const pct = score.total > 0 ? Math.round((score.corretas / score.total) * 100) : 0

  // ── RESULTADO ──────────────────────────────────────────────────
  if (mode === 'resultado') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-20">
        <div className="text-center py-8 rounded-lg px-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(245,158,11,0.12)' }}>
            <Trophy size={36} style={{ color: 'var(--warning)' }} />
          </div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: T.text }}>Treino Concluído!</h2>
          <p style={{ color: T.textMuted }}>{score.total} questões respondidas</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {[
              { label: 'Aproveitamento', value: `${pct}%`, color: pct >= 70 ? 'var(--success)' : 'var(--error)' },
              { label: 'Corretas', value: score.corretas, color: 'var(--success)' },
              { label: 'Sequência máx.', value: score.maxStreak, color: 'var(--warning)' },
            ].map(item => (
              <div key={item.label} className="rounded-lg p-3" style={{ background: T.elevated }}>
                <p className="text-2xl font-bold" style={{ color: item.color, fontVariantNumeric: 'tabular-nums' }}>{item.value}</p>
                <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>{item.label}</p>
              </div>
            ))}
          </div>
          {Object.entries(score.categorias).length > 0 && (
            <div className="mt-6 text-left space-y-2">
              <p className="text-sm font-semibold mb-3" style={{ color: T.text }}>Por categoria:</p>
              {Object.entries(score.categorias).map(([cat, data]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs w-36 truncate" style={{ color: T.textMuted }}>{cat}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: T.border }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${(data.corretas / data.total) * 100}%`, background: 'var(--accent-400, var(--btn-primary-bg))' }} />
                  </div>
                  <span className="text-xs w-10 text-right" style={{ color: T.textMuted }}>{data.corretas}/{data.total}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={startTreino} className="mt-6 w-full h-11 text-white rounded-[6px] font-semibold transition-all hover:opacity-80 flex items-center justify-center gap-2"
            style={{ background: 'var(--btn-primary-bg)' }}>
            <RefreshCw size={18} /> Treinar Novamente
          </button>
          <button onClick={() => setMode('menu')} className="mt-3 w-full h-10 rounded-[6px] text-sm font-medium transition-all hover:opacity-80"
            style={{ background: T.elevated, color: T.textMuted, border: `1px solid ${T.border}` }}>
            Voltar ao menu
          </button>
        </div>
      </div>
    )
  }

  // ── TREINO ─────────────────────────────────────────────────────
  if (mode === 'treino' && current) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 pb-20">
        <div className="flex items-center justify-between">
          <button onClick={() => setMode('menu')} className="w-9 h-9 rounded-[6px] flex items-center justify-center" style={{ border: `1px solid ${T.border}` }}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            {score.streak >= 3 && (
              <span className="flex items-center gap-1 text-sm font-bold" style={{ color: 'var(--warning)' }}>
                <Zap size={16} /> {score.streak}x
              </span>
            )}
            <span className="text-sm" style={{ color: T.textMuted }}>{currentIdx + 1} / {filtered.length}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span style={{ color: 'var(--success)', fontWeight: 700 }}>{score.corretas}✓</span>
            <span style={{ color: 'var(--error)', fontWeight: 700 }}>{score.incorretas}✗</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.border }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${(currentIdx / filtered.length) * 100}%`, background: 'var(--btn-primary-bg)' }} />
        </div>

        <div className="rounded-lg p-6 space-y-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-[6px]" style={{ background: T.elevated, color: T.textMuted }}>{current.categoria}</span>
            <span className="text-xs px-2 py-0.5 rounded-[6px]" style={{ background: T.elevated, color: T.textMuted }}>{NIVEIS[current.nivel]}</span>
            {current.normaRef && (
              <span className="text-xs px-2 py-0.5 rounded-[6px] font-mono" style={{ background: 'rgba(184,148,58,0.12)', color: 'var(--accent-400, #C8A44A)' }}>
                {current.normaRef}
              </span>
            )}
          </div>

          <p className="text-base font-semibold leading-relaxed" style={{ color: T.text }}>{current.pergunta}</p>

          {current.contexto && (
            <div className="p-3 rounded-lg text-sm font-mono" style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.20)', color: 'var(--warning)' }}>
              {current.contexto}
            </div>
          )}

          <div className="space-y-2">
            {current.opcoes.map((opt, idx) => {
              let inlineStyle: React.CSSProperties = { border: `1px solid ${T.border}`, color: T.text }
              if (revealed) {
                if (idx === current.correta) { inlineStyle = { border: '1px solid rgba(107,184,123,0.5)', background: 'rgba(107,184,123,0.12)', color: 'var(--success)' } }
                else if (idx === selected && idx !== current.correta) { inlineStyle = { border: '1px solid rgba(227,87,87,0.5)', background: 'rgba(227,87,87,0.12)', color: 'var(--error)' } }
                else { inlineStyle = { border: `1px solid ${T.border}`, color: T.textMuted } }
              }
              return (
                <button key={idx} onClick={() => handleAnswer(idx)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-lg text-left text-sm transition-all"
                  style={inlineStyle}>
                  <div className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={
                      revealed && idx === current.correta ? { background: 'var(--success)', borderColor: 'var(--success)', color: 'white' }
                        : revealed && idx === selected ? { background: 'var(--error)', borderColor: 'var(--error)', color: 'white' }
                          : { borderColor: T.border, color: T.textMuted }
                    }>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="flex-1">{opt}</span>
                  {revealed && idx === current.correta && <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />}
                  {revealed && idx === selected && idx !== current.correta && <XCircle size={16} style={{ color: 'var(--error)', flexShrink: 0 }} />}
                </button>
              )
            })}
          </div>

          {revealed && (
            <div className="p-4 rounded-lg text-sm" style={{ background: 'rgba(184,148,58,0.08)', border: '1px solid rgba(184,148,58,0.20)' }}>
              <p className="font-semibold mb-1" style={{ color: 'var(--accent-400, #C8A44A)' }}>Explicação</p>
              <p style={{ color: T.textMuted }}>{current.explicacao}</p>
            </div>
          )}
        </div>

        {revealed && (
          <button onClick={handleNext} className="w-full h-11 text-white rounded-[6px] font-semibold transition-all hover:opacity-80 flex items-center justify-center gap-2"
            style={{ background: 'var(--btn-primary-bg)' }}>
            {currentIdx < filtered.length - 1 ? <>Próxima <ChevronRight size={18} /></> : <>Ver Resultado <Trophy size={18} /></>}
          </button>
        )}
      </div>
    )
  }

  // ── MENU ───────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <PageIntelHeader
        moduleLabel="AVALIAÇÕES · TREINAMENTO"
        title="Exercícios — NBR 14653"
        subtitle="Apostila Prof. João Diniz · UNICRECI Pernambuco · 53 questões"
        actions={
          <button onClick={() => router.back()}
            className="w-10 h-10 rounded-[6px] flex items-center justify-center"
            style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <ArrowLeft size={18} style={{ color: T.text }} />
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Questões', value: EXERCICIOS.length, icon: BookOpen, bg: 'rgba(184,148,58,0.12)', color: 'var(--accent-400, #C8A44A)' },
          { label: 'Categorias', value: CATEGORIAS.length, icon: Target, bg: 'rgba(0,214,143,0.12)', color: 'var(--success)' },
          { label: 'IA Ilimitada', value: '∞', icon: Sparkles, bg: 'rgba(245,158,11,0.12)', color: 'var(--warning)' },
        ].map(item => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-lg p-4 flex items-center gap-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
                <Icon size={18} style={{ color: item.color }} />
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: T.text }}>{item.value}</p>
                <p className="text-xs" style={{ color: T.textMuted }}>{item.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="rounded-lg p-4 space-y-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <p className="text-sm font-semibold" style={{ color: T.text }}>Filtrar por categoria</p>
        <div className="flex flex-wrap gap-2">
          {['Todos', ...CATEGORIAS].map(cat => (
            <button key={cat} onClick={() => setSelectedCat(cat)}
              className="px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all"
              style={selectedCat === cat
                ? { background: 'var(--btn-primary-bg)', color: 'white', border: '1px solid transparent' }
                : { background: T.elevated, color: T.textMuted, border: `1px solid ${T.border}` }}>
              {cat}
            </button>
          ))}
        </div>

        <p className="text-sm font-semibold pt-1" style={{ color: T.text }}>Nível</p>
        <div className="flex flex-wrap gap-2">
          {['Todos', 'basico', 'intermediario', 'avancado'].map(nv => (
            <button key={nv} onClick={() => setSelectedNivel(nv)}
              className="px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all"
              style={selectedNivel === nv
                ? { background: 'var(--btn-primary-bg)', color: 'white', border: '1px solid transparent' }
                : { background: T.elevated, color: T.textMuted, border: `1px solid ${T.border}` }}>
              {nv === 'Todos' ? 'Todos os níveis' : NIVEIS[nv]}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: T.border }}>
          <p className="text-sm" style={{ color: T.textMuted }}>
            <strong style={{ color: T.text }}>{filtered.length}</strong> questões selecionadas
          </p>
          <button onClick={startTreino} disabled={filtered.length === 0}
            className="flex items-center gap-2 h-9 px-5 text-white rounded-[6px] text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-40"
            style={{ background: 'var(--btn-primary-bg)' }}>
            <Play size={15} /> Iniciar Treino
          </button>
        </div>
      </div>

      {/* Progresso rápido por categoria */}
      <div className="rounded-lg p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <p className="text-sm font-semibold mb-3" style={{ color: T.text }}>Questões por categoria</p>
        <div className="space-y-2">
          {CATEGORIAS.map(cat => {
            const total = EXERCICIOS.filter(e => e.categoria === cat).length
            const basico = EXERCICIOS.filter(e => e.categoria === cat && e.nivel === 'basico').length
            const inter = EXERCICIOS.filter(e => e.categoria === cat && e.nivel === 'intermediario').length
            const avan = EXERCICIOS.filter(e => e.categoria === cat && e.nivel === 'avancado').length
            return (
              <div key={cat} className="flex items-center gap-3 cursor-pointer" onClick={() => { setSelectedCat(cat); setSelectedNivel('Todos') }}>
                <span className="text-xs w-40 truncate" style={{ color: T.textMuted }}>{cat}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: T.border }}>
                  <div className="h-full rounded-full" style={{ width: `${(total / EXERCICIOS.length) * 100 * 3}%`, maxWidth: '100%', background: 'var(--btn-primary-bg)', opacity: 0.7 }} />
                </div>
                <div className="flex gap-1 text-xs" style={{ color: T.textMuted }}>
                  <span style={{ color: 'var(--success)' }}>{basico}</span>/
                  <span style={{ color: 'var(--warning)' }}>{inter}</span>/
                  <span style={{ color: 'var(--error)' }}>{avan}</span>
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs mt-3" style={{ color: T.textMuted }}>
          <span style={{ color: 'var(--success)' }}>verde</span> = básico ·{' '}
          <span style={{ color: 'var(--warning)' }}>amarelo</span> = intermediário ·{' '}
          <span style={{ color: 'var(--error)' }}>vermelho</span> = avançado
        </p>
      </div>

      {/* IA Generator */}
      <div className="rounded-lg overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <button type="button" onClick={() => setShowIA(!showIA)}
          className="w-full flex items-center justify-between p-4 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <Sparkles size={18} style={{ color: 'var(--warning)' }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: T.text }}>Gerar Exercício com IA</p>
              <p className="text-xs" style={{ color: T.textMuted }}>Questões personalizadas ilimitadas · NBR 14653</p>
            </div>
          </div>
          <ChevronDown size={18} className={`transition-transform ${showIA ? 'rotate-180' : ''}`} style={{ color: T.textMuted }} />
        </button>

        {showIA && (
          <div className="p-4 space-y-3" style={{ borderTop: `1px solid ${T.border}` }}>
            <button onClick={generateIAExercise} disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-[6px] text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: 'var(--warning)' }}>
              {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Gerando...</> : <><Sparkles size={16} /> Nova Questão IA</>}
            </button>
            {iaExercicio && (() => {
              try {
                const parsed = JSON.parse(iaExercicio)
                return (
                  <div className="space-y-3 p-3 rounded-lg" style={{ background: T.elevated }}>
                    <p className="text-sm font-medium" style={{ color: T.text }}>{parsed.pergunta}</p>
                    {parsed.normaRef && (
                      <span className="inline-block text-xs px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(184,148,58,0.12)', color: 'var(--accent-400, #C8A44A)' }}>
                        {parsed.normaRef}
                      </span>
                    )}
                    {parsed.opcoes?.map((opt: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs" style={{ color: T.textMuted }}>
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: T.border, color: T.text }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span style={{ fontWeight: i === parsed.correta ? 700 : undefined, color: i === parsed.correta ? 'var(--success)' : T.textMuted }}>{opt}</span>
                        {i === parsed.correta && <CheckCircle size={12} style={{ color: 'var(--success)' }} />}
                      </div>
                    ))}
                    <div className="p-2 rounded text-xs" style={{ background: 'rgba(184,148,58,0.08)', border: '1px solid rgba(184,148,58,0.15)', color: T.textMuted }}>
                      {parsed.explicacao}
                    </div>
                  </div>
                )
              } catch {
                return <p className="text-xs" style={{ color: 'var(--error)' }}>Erro ao processar questão gerada</p>
              }
            })()}
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div className="flex items-center gap-2 text-xs" style={{ color: T.textMuted }}>
        <Clock size={12} />
        <span>Fonte: Apostila Prof. João Diniz Marcello · UNICRECI PE 2025 · NBR 14653</span>
      </div>
    </div>
  )
}
