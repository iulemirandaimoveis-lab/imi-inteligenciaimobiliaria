// ============================================================
// IMI — Configuração do Avaliador
// Preencha com seus dados reais antes do deploy de produção
// ============================================================

export const AVALIADOR = {
  nome: 'Iule Miranda',
  cnai: '53290',           // ← número CNAI atualizado
  creci: '17933',           // ← número CRECI atualizado
  empresa: 'IMI — Iule Miranda Imóveis',
  cnpj: '00.000.000/0001-00', // ← inserir CNPJ real
  endereco: 'Recife, Pernambuco — Brasil',
  cep: '50000-000',
  telefone: '(81) 9 9723-0455',
  email: 'contato@iulemirandaimoveis.com.br',
  logo: '/logo-imi.png',
  site: 'www.iulemirandaimoveis.com.br',

  // Mercados de atuação
  mercados: ['Brasil', 'Dubai', 'EUA'],

  // Normas de referência para laudos
  normas: ['NBR 14653-1', 'NBR 14653-2', 'NBR 14653-3', 'IBAPE/PE'],

  // Honorários mínimos absolutos (R$)
  honorarioMinimo: 800,

  // Tabela percentuais IBAPE (base para cálculo)
  honorariosTabela: {
    ate200k: 0.008, // 0.8%
    ate500k: 0.006, // 0.6%
    ate1M: 0.004, // 0.4%
    ate5M: 0.003, // 0.3%
    acima5M: 0.002, // 0.2%
  },

  // Multiplicadores por finalidade
  multiplicadoresFinalidade: {
    judicial: 1.5,
    desapropriacao: 1.4,
    fundo: 1.3,
    financiamento: 1.1,
    compra_venda: 1.0,
    garantia: 1.0,
    locacao: 1.0,
  },

  // Multiplicadores por metodologia
  multiplicadoresMetodologia: {
    involutivo: 1.2,
    renda: 1.2,
    evolutivo: 1.1,
    comparativo: 1.0,
    custo: 1.0,
  },
} as const

export type Avaliador = typeof AVALIADOR
