// src/lib/modelos-contratos.ts
// ── 32 modelos de contratos IMI Atlantis ─────────────────────

import type { ModeloContrato } from '@/types/contratos'

export const MODELOS_CONTRATOS: ModeloContrato[] = [

  // ════════ LOCAÇÃO ════════
  {
    id: 'loc-residencial', categoria: 'locacao', popular: true,
    nome: 'Contrato de Locação Residencial', nome_en: 'Residential Lease Agreement',
    descricao: 'Locação residencial conforme Lei 8.245/91. Inclui garantia, reajuste IGPM/IPCA, multa rescisória e benfeitorias.',
    jurisdicao: 'BR', idiomas: ['pt', 'en', 'es'], icon: 'Home', cor: '#7B9EC4',
    tags: ['residencial', 'inquilinato', 'lei 8245'],
    campos: [
      { key: 'imovel_endereco', label: 'Endereço completo do imóvel', tipo: 'text', required: true, section: 'objeto', width: 'full' },
      { key: 'imovel_matricula', label: 'Matrícula no CRI', tipo: 'text', required: false, section: 'objeto', width: 'half' },
      { key: 'imovel_area', label: 'Área (m²)', tipo: 'number', required: true, section: 'objeto', width: 'third' },
      { key: 'valor_aluguel', label: 'Valor do aluguel (R$)', tipo: 'currency', required: true, section: 'valores', width: 'half' },
      { key: 'valor_condominio', label: 'Condomínio (R$)', tipo: 'currency', required: false, section: 'valores', width: 'half' },
      { key: 'valor_iptu', label: 'IPTU anual (R$)', tipo: 'currency', required: false, section: 'valores', width: 'half' },
      { key: 'dia_vencimento', label: 'Dia de vencimento', tipo: 'select', required: true, section: 'valores', opcoes: ['5', '10', '15', '20', '25'], width: 'third' },
      { key: 'indice_reajuste', label: 'Índice de reajuste', tipo: 'select', required: true, section: 'valores', opcoes: ['IGPM', 'IPCA', 'IGP-DI', 'INPC'], width: 'half' },
      { key: 'data_inicio', label: 'Início da locação', tipo: 'date', required: true, section: 'prazos', width: 'half' },
      { key: 'prazo_meses', label: 'Prazo (meses)', tipo: 'number', required: true, section: 'prazos', width: 'half' },
      { key: 'tipo_garantia', label: 'Modalidade de garantia', tipo: 'select', required: true, section: 'garantias', opcoes: ['Caução', 'Seguro Fiança', 'Fiador', 'Título de Capitalização', 'Sem garantia'], width: 'full' },
      { key: 'valor_caucao', label: 'Valor da caução (R$)', tipo: 'currency', required: false, section: 'garantias', width: 'half' },
      { key: 'animais', label: 'Animais de estimação', tipo: 'select', required: true, section: 'condicoes', opcoes: ['Não permitido', 'Permitido até 10kg', 'Permitido sem restrição'], width: 'half' },
      { key: 'peculiaridades', label: 'Cláusulas especiais', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },

  {
    id: 'loc-comercial', categoria: 'locacao',
    nome: 'Contrato de Locação Comercial', nome_en: 'Commercial Lease Agreement',
    descricao: 'Locação não-residencial com direito à renovatória. Inclui luvas, fundo de comércio e sublocação.',
    jurisdicao: 'BR', idiomas: ['pt', 'en', 'es'], icon: 'Building2', cor: '#7B9EC4',
    tags: ['comercial', 'loja', 'sala', 'renovatória'],
    campos: [
      { key: 'imovel_endereco', label: 'Endereço do imóvel comercial', tipo: 'text', required: true, section: 'objeto', width: 'full' },
      { key: 'uso_permitido', label: 'Ramo de atividade permitido', tipo: 'text', required: true, section: 'objeto', width: 'full' },
      { key: 'valor_aluguel', label: 'Valor do aluguel (R$)', tipo: 'currency', required: true, section: 'valores', width: 'half' },
      { key: 'valor_luvas', label: 'Luvas (R$)', tipo: 'currency', required: false, section: 'valores', width: 'half' },
      { key: 'data_inicio', label: 'Início', tipo: 'date', required: true, section: 'prazos', width: 'half' },
      { key: 'prazo_meses', label: 'Prazo (meses)', tipo: 'number', required: true, section: 'prazos', width: 'half' },
      { key: 'sublocacao', label: 'Permite sublocação', tipo: 'select', required: true, section: 'condicoes', opcoes: ['Proibida', 'Permitida com anuência', 'Permitida total'], width: 'half' },
      { key: 'peculiaridades', label: 'Cláusulas especiais', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },

  {
    id: 'loc-temporada', categoria: 'locacao',
    nome: 'Locação por Temporada', nome_en: 'Short-term / Vacation Rental',
    descricao: 'Locação temporária de até 90 dias — lazer, turismo ou tratamento médico.',
    jurisdicao: 'BR', idiomas: ['pt', 'en', 'es'], icon: 'Palmtree', cor: '#7B9EC4',
    tags: ['temporada', 'short-term', 'veraneio'],
    campos: [
      { key: 'imovel_endereco', label: 'Endereço do imóvel', tipo: 'text', required: true, section: 'objeto', width: 'full' },
      { key: 'data_checkin', label: 'Check-in', tipo: 'date', required: true, section: 'prazos', width: 'half' },
      { key: 'data_checkout', label: 'Check-out', tipo: 'date', required: true, section: 'prazos', width: 'half' },
      { key: 'valor_total', label: 'Valor total (R$)', tipo: 'currency', required: true, section: 'valores', width: 'half' },
      { key: 'num_hospedes', label: 'Número de hóspedes', tipo: 'number', required: true, section: 'condicoes', width: 'third' },
      { key: 'caucao', label: 'Caução (R$)', tipo: 'currency', required: false, section: 'garantias', width: 'half' },
      { key: 'peculiaridades', label: 'Regras da estada', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },

  // ════════ VENDA / COMPRA ════════
  {
    id: 'promessa-cv', categoria: 'venda', popular: true, internacional: true,
    nome: 'Promessa de Compra e Venda', nome_en: 'Purchase and Sale Agreement',
    descricao: 'Compromisso irretratável de compra e venda com sinal, condições suspensivas, prazo para escritura e multa.',
    jurisdicao: 'BR', idiomas: ['pt', 'en', 'es', 'ar', 'ja'], icon: 'FileSignature', cor: '#6BB87B',
    tags: ['compra e venda', 'sinal', 'arras', 'escritura'],
    campos: [
      { key: 'imovel_descricao', label: 'Descrição completa do imóvel', tipo: 'textarea', required: true, section: 'objeto', width: 'full' },
      { key: 'imovel_matricula', label: 'Nº Matrícula CRI', tipo: 'text', required: true, section: 'objeto', width: 'half' },
      { key: 'imovel_cartorio', label: 'Cartório de Registro', tipo: 'text', required: true, section: 'objeto', width: 'half' },
      { key: 'valor_total', label: 'Preço total (R$)', tipo: 'currency', required: true, section: 'valores', width: 'half' },
      { key: 'valor_sinal', label: 'Sinal / arras (R$)', tipo: 'currency', required: true, section: 'valores', width: 'half' },
      { key: 'forma_pagamento', label: 'Forma de pagamento', tipo: 'select', required: true, section: 'valores', opcoes: ['À vista', 'Financiamento bancário', 'Permuta parcial', 'Parcelado direto', 'FGTS + complemento'], width: 'full' },
      { key: 'prazo_escritura_dias', label: 'Prazo para escritura (dias)', tipo: 'number', required: true, section: 'prazos', width: 'half' },
      { key: 'data_posse', label: 'Data prevista de posse', tipo: 'date', required: false, section: 'prazos', width: 'half' },
      { key: 'multa_percentual', label: 'Multa rescisória (%)', tipo: 'number', required: true, section: 'condicoes', width: 'third', placeholder: '10' },
      { key: 'condicoes_suspensivas', label: 'Condições suspensivas', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
      { key: 'peculiaridades', label: 'Cláusulas especiais / itens incluídos', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },

  {
    id: 'cv-internacional', categoria: 'venda', popular: true, internacional: true,
    nome: 'International Property Purchase Agreement', nome_en: 'International Property Purchase Agreement',
    descricao: 'Compra e venda internacional com cláusulas de jurisdição, câmbio, due diligence e direito aplicável.',
    jurisdicao: 'INTL', idiomas: ['en', 'ar', 'ja', 'pt', 'es'], icon: 'Globe', cor: '#E8A87C',
    tags: ['international', 'cross-border', 'USD', 'AED', 'jurisdiction'],
    campos: [
      { key: 'property_address', label: 'Property full address', tipo: 'text', required: true, section: 'objeto', width: 'full' },
      { key: 'property_description', label: 'Property description', tipo: 'textarea', required: true, section: 'objeto', width: 'full' },
      { key: 'purchase_price_usd', label: 'Purchase price (USD)', tipo: 'currency', required: true, section: 'valores', width: 'half' },
      { key: 'deposit_amount', label: 'Deposit (USD)', tipo: 'currency', required: true, section: 'valores', width: 'half' },
      { key: 'currency_clause', label: 'Currency / FX clause', tipo: 'select', required: true, section: 'valores', opcoes: ['USD fixed', 'BRL with FX hedge', 'AED fixed', 'JPY fixed', 'Multi-currency'], width: 'full' },
      { key: 'applicable_law', label: 'Governing law', tipo: 'select', required: true, section: 'condicoes', opcoes: ['Brazilian Law', 'UAE Law', 'English Law', 'New York Law', 'ICC Arbitration'], width: 'full' },
      { key: 'closing_date', label: 'Closing date', tipo: 'date', required: true, section: 'prazos', width: 'half' },
      { key: 'due_diligence_days', label: 'Due diligence period (days)', tipo: 'number', required: true, section: 'prazos', width: 'half' },
      { key: 'special_conditions', label: 'Special conditions', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },

  {
    id: 'permuta', categoria: 'venda',
    nome: 'Contrato de Permuta Imobiliária', nome_en: 'Real Estate Exchange Agreement',
    descricao: 'Troca de imóveis com ou sem torna. Define valor de cada bem, responsabilidade por débitos e ITBI.',
    jurisdicao: 'BR', idiomas: ['pt', 'en'], icon: 'ArrowLeftRight', cor: '#6BB87B',
    tags: ['permuta', 'troca', 'torna'],
    campos: [
      { key: 'imovel_a_descricao', label: 'Imóvel A — descrição', tipo: 'textarea', required: true, section: 'objeto', width: 'full' },
      { key: 'imovel_a_valor', label: 'Valor avaliado — Imóvel A (R$)', tipo: 'currency', required: true, section: 'valores', width: 'half' },
      { key: 'imovel_b_descricao', label: 'Imóvel B — descrição', tipo: 'textarea', required: true, section: 'objeto', width: 'full' },
      { key: 'imovel_b_valor', label: 'Valor avaliado — Imóvel B (R$)', tipo: 'currency', required: true, section: 'valores', width: 'half' },
      { key: 'torna', label: 'Torna (R$)', tipo: 'currency', required: false, section: 'valores', width: 'half' },
      { key: 'peculiaridades', label: 'Condições especiais', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },

  // ════════ CAPTAÇÃO ════════
  {
    id: 'captacao-venda', categoria: 'captacao', popular: true,
    nome: 'Captação com Exclusividade — Venda', nome_en: 'Exclusive Listing Agreement',
    descricao: 'Autorização exclusiva para intermediação de venda. Inclui comissão, estratégia de divulgação e prazo de carência.',
    jurisdicao: 'BR', idiomas: ['pt', 'en', 'es'], icon: 'Target', cor: '#3B82F6',
    tags: ['captação', 'exclusividade', 'CRECI', 'comissão'],
    campos: [
      { key: 'imovel_descricao', label: 'Imóvel captado', tipo: 'textarea', required: true, section: 'objeto', width: 'full' },
      { key: 'preco_anuncio', label: 'Preço de anúncio (R$)', tipo: 'currency', required: true, section: 'valores', width: 'half' },
      { key: 'comissao_percentual', label: 'Comissão (%)', tipo: 'number', required: true, section: 'valores', width: 'half', placeholder: '6' },
      { key: 'prazo_exclusividade_dias', label: 'Prazo de exclusividade (dias)', tipo: 'number', required: true, section: 'prazos', width: 'half', placeholder: '90' },
      { key: 'acoes_divulgacao', label: 'Ações de divulgação previstas', tipo: 'textarea', required: true, section: 'condicoes', width: 'full' },
      { key: 'carencia_dias', label: 'Carência pós-vigência (dias)', tipo: 'number', required: false, section: 'condicoes', width: 'half', placeholder: '180' },
      { key: 'peculiaridades', label: 'Condições especiais', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },

  {
    id: 'captacao-locacao', categoria: 'captacao',
    nome: 'Captação com Exclusividade — Locação', nome_en: 'Exclusive Rental Listing',
    descricao: 'Autorização exclusiva para intermediação de locação com taxa de administração e gestão.',
    jurisdicao: 'BR', idiomas: ['pt', 'en'], icon: 'Target', cor: '#3B82F6',
    tags: ['captação', 'locação', 'administração'],
    campos: [
      { key: 'imovel_descricao', label: 'Imóvel', tipo: 'textarea', required: true, section: 'objeto', width: 'full' },
      { key: 'aluguel_pretendido', label: 'Aluguel pretendido (R$)', tipo: 'currency', required: true, section: 'valores', width: 'half' },
      { key: 'honorario_captacao', label: 'Honorário de captação (% aluguel)', tipo: 'number', required: true, section: 'valores', width: 'half', placeholder: '100' },
      { key: 'taxa_administracao', label: 'Taxa de administração mensal (%)', tipo: 'number', required: false, section: 'valores', width: 'half', placeholder: '8' },
      { key: 'prazo_dias', label: 'Prazo de exclusividade (dias)', tipo: 'number', required: true, section: 'prazos', width: 'half' },
      { key: 'peculiaridades', label: 'Condições especiais', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },

  // ════════ AVALIAÇÃO ════════
  {
    id: 'servicos-avaliacao', categoria: 'avaliacao', popular: true,
    nome: 'Serviços de Avaliação Imobiliária', nome_en: 'Real Estate Appraisal Agreement',
    descricao: 'Contrato para execução de laudo NBR 14653. Define metodologia, prazo, honorários e responsabilidade CNAI.',
    jurisdicao: 'BR', idiomas: ['pt', 'en'], icon: 'Scale', cor: '#A89EC4',
    tags: ['avaliação', 'NBR 14653', 'laudo', 'CNAI', 'CRECI'],
    campos: [
      { key: 'imovel_endereco', label: 'Imóvel a ser avaliado', tipo: 'text', required: true, section: 'objeto', width: 'full' },
      { key: 'finalidade_avaliacao', label: 'Finalidade', tipo: 'select', required: true, section: 'objeto', opcoes: ['Compra e Venda', 'Financiamento SFH/SFI', 'Partilha Judicial', 'Inventário', 'Seguro', 'Garantia Bancária', 'Fundo de Investimento', 'Desapropriação', 'Locação', 'Due Diligence'], width: 'full' },
      { key: 'metodologia', label: 'Metodologia aplicável', tipo: 'select', required: true, section: 'objeto', opcoes: ['Comparativo Direto', 'Evolutivo', 'Involutivo', 'Renda', 'Custo de Reprodução'], width: 'full' },
      { key: 'grau_fundamentacao', label: 'Grau de fundamentação NBR', tipo: 'select', required: true, section: 'objeto', opcoes: ['Grau I', 'Grau II', 'Grau III'], width: 'half' },
      { key: 'honorarios', label: 'Honorários (R$)', tipo: 'currency', required: true, section: 'valores', width: 'half' },
      { key: 'forma_pagamento_honorarios', label: 'Forma de pagamento', tipo: 'select', required: true, section: 'valores', opcoes: ['À vista na entrega', '50% início + 50% entrega', 'PIX', 'Boleto'], width: 'full' },
      { key: 'prazo_entrega_dias', label: 'Prazo para entrega (dias úteis)', tipo: 'number', required: true, section: 'prazos', width: 'half', placeholder: '10' },
      { key: 'responsavel_tecnico', label: 'Responsável técnico (nome + CRECI/CNAI)', tipo: 'text', required: true, section: 'condicoes', width: 'full' },
      { key: 'peculiaridades', label: 'Condições especiais', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },

  {
    id: 'pericia-judicial', categoria: 'avaliacao',
    nome: 'Aceite de Nomeação — Perito Judicial', nome_en: 'Court Expert Appointment Acceptance',
    descricao: 'Aceite formal de nomeação como perito avaliador judicial. Inclui honorários periciais e quesitos.',
    jurisdicao: 'BR', idiomas: ['pt'], icon: 'Gavel', cor: '#A89EC4',
    tags: ['perícia', 'judicial', 'TJ', 'perito'],
    campos: [
      { key: 'processo_numero', label: 'Número do processo', tipo: 'text', required: true, section: 'objeto', width: 'half' },
      { key: 'vara_juizo', label: 'Vara / Juízo', tipo: 'text', required: true, section: 'objeto', width: 'half' },
      { key: 'objeto_avaliacao', label: 'Imóvel objeto da perícia', tipo: 'textarea', required: true, section: 'objeto', width: 'full' },
      { key: 'honorarios_periciais', label: 'Honorários arbitrados (R$)', tipo: 'currency', required: true, section: 'valores', width: 'half' },
      { key: 'prazo_entrega_dias', label: 'Prazo para entrega (dias)', tipo: 'number', required: true, section: 'prazos', width: 'half' },
      { key: 'peculiaridades', label: 'Quesitos / Observações', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },

  // ════════ CRÉDITO ════════
  {
    id: 'correspondente-bancario', categoria: 'credito', popular: true,
    nome: 'Parceria — Correspondente Bancário', nome_en: 'Bank Correspondent Partnership',
    descricao: 'Parceria para captação de crédito imobiliário. Comissão por operação liquidada, compliance e LGPD.',
    jurisdicao: 'BR', idiomas: ['pt', 'en'], icon: 'CreditCard', cor: '#7B9EC4',
    tags: ['crédito', 'correspondente bancário', 'financiamento'],
    campos: [
      { key: 'banco_parceiro', label: 'Instituição financeira parceira', tipo: 'text', required: true, section: 'objeto', width: 'full' },
      { key: 'produtos_operados', label: 'Produtos operados', tipo: 'select', required: true, section: 'objeto', opcoes: ['SFH', 'SFI', 'Portabilidade', 'Refinanciamento', 'Home Equity', 'PJ'], width: 'full' },
      { key: 'comissao_liquidacao', label: 'Comissão por operação liquidada (%)', tipo: 'number', required: true, section: 'valores', width: 'half' },
      { key: 'meta_mensal', label: 'Meta mensal (R$)', tipo: 'currency', required: false, section: 'valores', width: 'half' },
      { key: 'prazo_contrato_meses', label: 'Vigência (meses)', tipo: 'number', required: true, section: 'prazos', width: 'half' },
      { key: 'peculiaridades', label: 'Condições especiais / compliance', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },

  // ════════ CONSULTORIA ════════
  {
    id: 'consultoria-estrategica', categoria: 'consultoria', popular: true, internacional: true,
    nome: 'Consultoria Estratégica Imobiliária', nome_en: 'Real Estate Strategic Advisory Agreement',
    descricao: 'Prestação de consultoria para fundos, investidores e incorporadoras. Inclui escopo, deliverables, NDA e honorários.',
    jurisdicao: 'BR', idiomas: ['pt', 'en', 'ar'], icon: 'Briefcase', cor: '#3B82F6',
    tags: ['consultoria', 'estratégica', 'fundos', 'NDA'],
    campos: [
      { key: 'escopo_descricao', label: 'Escopo dos serviços', tipo: 'textarea', required: true, section: 'objeto', width: 'full' },
      { key: 'deliverables', label: 'Entregáveis / produtos contratuais', tipo: 'textarea', required: true, section: 'objeto', width: 'full' },
      { key: 'honorarios_fase', label: 'Honorários por fase (R$)', tipo: 'textarea', required: true, section: 'valores', width: 'full' },
      { key: 'prazo_total_dias', label: 'Prazo total (dias)', tipo: 'number', required: true, section: 'prazos', width: 'half' },
      { key: 'nda_vigencia_anos', label: 'Vigência da confidencialidade (anos)', tipo: 'number', required: true, section: 'condicoes', width: 'half', placeholder: '5' },
      { key: 'peculiaridades', label: 'Limitação de responsabilidade / outras cláusulas', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },

  {
    id: 'due-diligence', categoria: 'consultoria', internacional: true,
    nome: 'Due Diligence Imobiliária', nome_en: 'Real Estate Due Diligence Agreement',
    descricao: 'Due diligence técnica, jurídica e mercadológica de ativos para fundos e investidores.',
    jurisdicao: 'BR', idiomas: ['pt', 'en', 'ar', 'ja'], icon: 'Search', cor: '#3B82F6',
    tags: ['due diligence', 'fundos', 'análise', 'SWF'],
    campos: [
      { key: 'ativo_descricao', label: 'Ativo(s) objeto da due diligence', tipo: 'textarea', required: true, section: 'objeto', width: 'full' },
      { key: 'escopo_dd', label: 'Escopo da análise', tipo: 'select', required: true, section: 'objeto', opcoes: ['Jurídica + Técnica + Mercado', 'Somente Técnica', 'Somente Mercadológica', 'Compliance + ESG', 'Completa 360°'], width: 'full' },
      { key: 'honorarios', label: 'Honorários (R$)', tipo: 'currency', required: true, section: 'valores', width: 'half' },
      { key: 'prazo_dias', label: 'Prazo (dias úteis)', tipo: 'number', required: true, section: 'prazos', width: 'half' },
      { key: 'peculiaridades', label: 'Especificações / acesso a documentos', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },

  // ════════ GESTÃO PATRIMONIAL ════════
  {
    id: 'gestao-patrimonial', categoria: 'gestao_patrimonial', internacional: true,
    nome: 'Gestão Patrimonial Imobiliária', nome_en: 'Real Estate Wealth Management Agreement',
    descricao: 'Gestão profissional de portfólio imobiliário para family offices e alta renda. Política de investimentos e relatórios.',
    jurisdicao: 'BR', idiomas: ['pt', 'en', 'ar'], icon: 'TrendingUp', cor: '#3B82F6',
    tags: ['wealth management', 'family office', 'portfólio'],
    campos: [
      { key: 'portfolio_descricao', label: 'Composição inicial do portfólio', tipo: 'textarea', required: true, section: 'objeto', width: 'full' },
      { key: 'patrimonio_total', label: 'Patrimônio sob gestão (R$)', tipo: 'currency', required: true, section: 'valores', width: 'half' },
      { key: 'taxa_gestao_anual', label: 'Taxa de gestão anual (%)', tipo: 'number', required: true, section: 'valores', width: 'half', placeholder: '1.5' },
      { key: 'politica_investimentos', label: 'Política de investimentos', tipo: 'textarea', required: true, section: 'condicoes', width: 'full' },
      { key: 'frequencia_relatorios', label: 'Frequência de relatórios', tipo: 'select', required: true, section: 'condicoes', opcoes: ['Mensal', 'Trimestral', 'Semestral'], width: 'half' },
      { key: 'prazo_anos', label: 'Prazo inicial (anos)', tipo: 'number', required: true, section: 'prazos', width: 'half' },
      { key: 'peculiaridades', label: 'Mandatos específicos / restrições', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },

  // ════════ FUNDO DE INVESTIMENTO ════════
  {
    id: 'swf-agreement', categoria: 'fundo_investimento', popular: true, internacional: true,
    nome: 'Sovereign Wealth Fund Advisory', nome_en: 'Sovereign Wealth Fund Real Estate Advisory',
    descricao: 'Assessoria para fundos soberanos em investimentos imobiliários no Brasil. NDA reforçado, jurisdição internacional e compliance OCDE.',
    jurisdicao: 'INTL', idiomas: ['en', 'ar', 'pt'], icon: 'Landmark', cor: '#3B82F6',
    tags: ['SWF', 'sovereign fund', 'OCDE', 'advisory', 'NDA'],
    campos: [
      { key: 'fund_name', label: 'Fund name / entity', tipo: 'text', required: true, section: 'objeto', width: 'full' },
      { key: 'investment_mandate', label: 'Investment mandate / strategy', tipo: 'textarea', required: true, section: 'objeto', width: 'full' },
      { key: 'target_aum_usd', label: 'Target AUM (USD)', tipo: 'currency', required: true, section: 'valores', width: 'half' },
      { key: 'advisory_fee_bps', label: 'Advisory fee (basis points/year)', tipo: 'number', required: true, section: 'valores', width: 'half', placeholder: '75' },
      { key: 'governing_law', label: 'Governing law', tipo: 'select', required: true, section: 'condicoes', opcoes: ['Brazilian Law', 'English Law', 'UAE Law', 'Delaware Law', 'ICC Arbitration'], width: 'full' },
      { key: 'confidentiality_years', label: 'Confidentiality period (years)', tipo: 'number', required: true, section: 'condicoes', width: 'half', placeholder: '10' },
      { key: 'term_years', label: 'Initial term (years)', tipo: 'number', required: true, section: 'prazos', width: 'half' },
      { key: 'special_conditions', label: 'Special conditions / OFAC compliance', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },

  // ════════ PARCERIA ════════
  {
    id: 'parceria-corretores', categoria: 'parceria', popular: true,
    nome: 'Parceria entre Corretores', nome_en: 'Co-brokerage Agreement',
    descricao: 'Split de comissão para co-corretagem. Define responsabilidades, lead, atendimento e confidencialidade.',
    jurisdicao: 'BR', idiomas: ['pt', 'en'], icon: 'Handshake', cor: '#E8A87C',
    tags: ['parceria', 'split', 'co-corretagem'],
    campos: [
      { key: 'negocio_descricao', label: 'Negócio objeto da parceria', tipo: 'textarea', required: true, section: 'objeto', width: 'full' },
      { key: 'split_parte_a', label: 'Split Parte A (%)', tipo: 'number', required: true, section: 'valores', width: 'half' },
      { key: 'split_parte_b', label: 'Split Parte B (%)', tipo: 'number', required: true, section: 'valores', width: 'half' },
      { key: 'responsavel_captacao', label: 'Responsável pela captação', tipo: 'select', required: true, section: 'condicoes', opcoes: ['Parte A', 'Parte B', 'Ambos'], width: 'half' },
      { key: 'peculiaridades', label: 'Condições especiais', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },

  // ════════ INTERNACIONAL ════════
  {
    id: 'uae-spa', categoria: 'internacional', popular: true, internacional: true,
    nome: 'UAE — Sale & Purchase Agreement', nome_en: 'UAE Real Estate SPA (RERA/DLD)',
    descricao: 'SPA para transações imobiliárias nos Emirados. Conforme RERA/DLD, inclui NOC, registration fee e payment plan.',
    jurisdicao: 'AE', idiomas: ['en', 'ar', 'pt'], icon: 'Globe', cor: '#E8A87C',
    tags: ['UAE', 'Dubai', 'DLD', 'RERA', 'SPA'],
    campos: [
      { key: 'property_reference', label: 'Property reference / DLD permit no.', tipo: 'text', required: true, section: 'objeto', width: 'half' },
      { key: 'property_description', label: 'Property description', tipo: 'textarea', required: true, section: 'objeto', width: 'full' },
      { key: 'purchase_price_aed', label: 'Purchase price (AED)', tipo: 'currency', required: true, section: 'valores', width: 'half' },
      { key: 'payment_plan', label: 'Payment plan', tipo: 'select', required: true, section: 'valores', opcoes: ['100% cash', '60/40 off-plan', 'Post-handover 3yr', 'UAE mortgage', 'Foreign mortgage'], width: 'full' },
      { key: 'handover_date', label: 'Handover date', tipo: 'date', required: true, section: 'prazos', width: 'half' },
      { key: 'noc_required', label: 'NOC required', tipo: 'select', required: true, section: 'condicoes', opcoes: ['Yes — developer NOC', 'No — freehold resale'], width: 'half' },
      { key: 'special_conditions', label: 'Special conditions', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },

  {
    id: 'japan-lease', categoria: 'internacional', internacional: true,
    nome: '日本不動産賃貸借契約', nome_en: 'Japan Property Lease Agreement',
    descricao: 'Contrato de locação no Japão. Inclui 礼金 (reikin), 敷金 (shikikin) e cláusulas conforme Lei de Arrendamento japonesa.',
    jurisdicao: 'JP', idiomas: ['ja', 'en', 'pt'], icon: 'MapPin', cor: '#E8A87C',
    tags: ['Japan', 'reikin', 'shikikin', 'lease'],
    campos: [
      { key: 'property_address_jp', label: '物件所在地 (Address)', tipo: 'text', required: true, section: 'objeto', width: 'full' },
      { key: 'monthly_rent_jpy', label: '月額賃料 Monthly rent (JPY)', tipo: 'currency', required: true, section: 'valores', width: 'half' },
      { key: 'reikin_months', label: '礼金 Key money (months)', tipo: 'number', required: false, section: 'valores', width: 'third', placeholder: '1' },
      { key: 'shikikin_months', label: '敷金 Security deposit (months)', tipo: 'number', required: false, section: 'garantias', width: 'third', placeholder: '2' },
      { key: 'lease_term_years', label: '契約期間 Lease term (years)', tipo: 'number', required: true, section: 'prazos', width: 'half', placeholder: '2' },
      { key: 'special_conditions', label: '特約事項 Special conditions', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },

  {
    id: 'us-listing', categoria: 'internacional', internacional: true,
    nome: 'US Exclusive Listing Agreement', nome_en: 'US Exclusive Right to Sell (MLS)',
    descricao: 'Exclusive listing agreement for US real estate, MLS-compatible. Commission split, co-op and buyer agent.',
    jurisdicao: 'US', idiomas: ['en', 'pt', 'es'], icon: 'Globe', cor: '#7B9EC4',
    tags: ['USA', 'MLS', 'NAR', 'listing', 'commission'],
    campos: [
      { key: 'property_address_us', label: 'Property address', tipo: 'text', required: true, section: 'objeto', width: 'full' },
      { key: 'list_price_usd', label: 'List price (USD)', tipo: 'currency', required: true, section: 'valores', width: 'half' },
      { key: 'commission_total', label: 'Total commission (%)', tipo: 'number', required: true, section: 'valores', width: 'half', placeholder: '6' },
      { key: 'listing_expiration', label: 'Listing expiration', tipo: 'date', required: true, section: 'prazos', width: 'half' },
      { key: 'mls_listing', label: 'MLS listing authorized', tipo: 'select', required: true, section: 'condicoes', opcoes: ['Yes — all portals', 'Broker network only', 'Pocket listing'], width: 'full' },
      { key: 'special_conditions', label: 'Special conditions', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },

  // ════════ NDA ════════
  {
    id: 'nda-bilateral', categoria: 'outros', popular: true, internacional: true,
    nome: 'NDA — Confidencialidade Bilateral', nome_en: 'Mutual Non-Disclosure Agreement',
    descricao: 'Acordo de sigilo mútuo para proteção de informações em negociações, parcerias e projetos. Válido internacionalmente.',
    jurisdicao: 'INTL', idiomas: ['pt', 'en', 'es', 'ar', 'ja'], icon: 'Lock', cor: '#4E5669',
    tags: ['NDA', 'confidencialidade', 'sigilo', 'bilateral'],
    campos: [
      { key: 'objeto_confidencial', label: 'Objeto das informações confidenciais', tipo: 'textarea', required: true, section: 'objeto', width: 'full' },
      { key: 'vigencia_anos', label: 'Vigência (anos)', tipo: 'number', required: true, section: 'prazos', width: 'half', placeholder: '5' },
      { key: 'jurisdicao_nda', label: 'Jurisdição aplicável', tipo: 'select', required: true, section: 'condicoes', opcoes: ['Brasil — LGPD', 'Direito Inglês', 'Direito dos EUA (NY)', 'Arbitragem ICC', 'UAE'], width: 'full' },
      { key: 'peculiaridades', label: 'Exclusões / exceções', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },

  {
    id: 'administracao-imovel', categoria: 'prestacao_servicos', popular: true,
    nome: 'Administração de Imóvel', nome_en: 'Property Management Agreement',
    descricao: 'Gestão completa — captação, cobranças, manutenção, prestação de contas e repasse ao proprietário.',
    jurisdicao: 'BR', idiomas: ['pt', 'en'], icon: 'Settings', cor: '#6BB87B',
    tags: ['administração', 'property management', 'repasse'],
    campos: [
      { key: 'imovel_descricao', label: 'Imóvel administrado', tipo: 'textarea', required: true, section: 'objeto', width: 'full' },
      { key: 'taxa_administracao', label: 'Taxa de administração (% aluguel)', tipo: 'number', required: true, section: 'valores', width: 'half', placeholder: '10' },
      { key: 'dia_repasse', label: 'Dia do repasse ao proprietário', tipo: 'select', required: true, section: 'valores', opcoes: ['5', '10', '15', '20'], width: 'third' },
      { key: 'prazo_contrato_meses', label: 'Prazo (meses)', tipo: 'number', required: true, section: 'prazos', width: 'half' },
      { key: 'peculiaridades', label: 'Escopo de serviços', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },

  // ════════ MODELO PERSONALIZADO ════════
  {
    id: 'modelo-personalizado', categoria: 'outros',
    nome: '+ Criar Modelo Personalizado', nome_en: 'Custom Contract',
    descricao: 'Descreva o contrato que precisa e a IA gera um modelo completo adequado ao seu contexto.',
    jurisdicao: 'BR', idiomas: ['pt', 'en', 'es', 'ar', 'ja'], icon: 'Sparkles', cor: '#3B82F6',
    tags: ['personalizado', 'custom', 'qualquer'],
    campos: [
      { key: 'tipo_contrato', label: 'Que tipo de contrato você precisa?', tipo: 'text', required: true, section: 'objeto', width: 'full', placeholder: 'Ex: Comodato, cessão de direitos, staging imobiliário...' },
      { key: 'descricao_objeto', label: 'Descreva o objeto do contrato', tipo: 'textarea', required: true, section: 'objeto', width: 'full' },
      { key: 'principais_clausulas', label: 'Principais cláusulas desejadas', tipo: 'textarea', required: true, section: 'condicoes', width: 'full' },
      { key: 'peculiaridades', label: 'Contexto adicional para a IA', tipo: 'textarea', required: false, section: 'condicoes', width: 'full' },
    ],
  },
]

export const getModeloById = (id: string) =>
  MODELOS_CONTRATOS.find(m => m.id === id)

export const getModelosByCategoria = (cat: string) =>
  cat === 'todos' ? MODELOS_CONTRATOS : MODELOS_CONTRATOS.filter(m => m.categoria === cat)

export const CATEGORIAS_LABEL: Record<string, string> = {
  locacao: 'Locação',
  venda: 'Venda / Compra',
  captacao: 'Captação',
  avaliacao: 'Avaliação',
  credito: 'Crédito',
  consultoria: 'Consultoria',
  prestacao_servicos: 'Serviços',
  parceria: 'Parceria',
  gestao_patrimonial: 'Gestão Patrimonial',
  fundo_investimento: 'Fundos de Investimento',
  internacional: 'Internacional',
  outros: 'Outros / NDA',
}

export const IDIOMAS_LABEL: Record<string, { label: string; flag: string; dir?: string; locale: string }> = {
  pt: { label: 'Português (BR)', flag: '🇧🇷', locale: 'pt-BR' },
  en: { label: 'English', flag: '🇺🇸', locale: 'en-US' },
  es: { label: 'Español', flag: '🇪🇸', locale: 'es-ES' },
  ar: { label: 'عربي', flag: '🇦🇪', dir: 'rtl', locale: 'ar-AE' },
  ja: { label: '日本語', flag: '🇯🇵', locale: 'ja-JP' },
}
