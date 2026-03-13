// ── Contextual Onboarding Tips Registry ─────────────────────
// Organized by module. Each tip targets a specific DOM element via CSS selector.

export interface ContextualTip {
    id: string
    module: string
    route: string              // route prefix where this tip appears
    targetSelector: string     // CSS selector for the element to highlight
    title: string
    description: string
    position: 'top' | 'bottom' | 'left' | 'right'
    order: number
}

export const ONBOARDING_TIPS: ContextualTip[] = [
    // ── Dashboard ──────────────────────────────────────────────
    {
        id: 'dash-kpis',
        module: 'dashboard',
        route: '/backoffice/dashboard',
        targetSelector: '[data-tour="kpis"]',
        title: 'KPIs em Tempo Real',
        description: 'Acompanhe honorários, leads, portfólio e taxa de conclusão. Os dados atualizam automaticamente.',
        position: 'bottom',
        order: 1,
    },
    {
        id: 'dash-chart',
        module: 'dashboard',
        route: '/backoffice/dashboard',
        targetSelector: '[data-tour="chart"]',
        title: 'Gráfico de Performance',
        description: 'Visualize leads vs receita ao longo do tempo. Filtre por 1M, 3M, 6M ou 1 ano.',
        position: 'bottom',
        order: 2,
    },
    {
        id: 'dash-alerts',
        module: 'dashboard',
        route: '/backoffice/dashboard',
        targetSelector: '[data-tour="alerts"]',
        title: 'Alertas Inteligentes',
        description: 'A IA monitora anomalias e oportunidades — alertas aparecem aqui automaticamente.',
        position: 'top',
        order: 3,
    },

    // ── Leads ──────────────────────────────────────────────────
    {
        id: 'leads-inbox',
        module: 'leads',
        route: '/backoffice/leads/inbox',
        targetSelector: '[data-tour="lead-list"]',
        title: 'Inbox de Leads com IA',
        description: 'Leads qualificados automaticamente por IA. Temperatura (🔥 quente, ❄️ frio) e score de 0-100.',
        position: 'right',
        order: 1,
    },
    {
        id: 'leads-scoring',
        module: 'leads',
        route: '/backoffice/leads/inbox',
        targetSelector: '[data-tour="filters"]',
        title: 'Filtragem Inteligente',
        description: 'Filtre por temperatura, fonte, status. Ordene por score IA para priorizar os mais quentes.',
        position: 'bottom',
        order: 2,
    },
    {
        id: 'leads-kanban',
        module: 'leads',
        route: '/backoffice/leads/kanban',
        targetSelector: '[data-tour="kanban"]',
        title: 'Pipeline Kanban',
        description: 'Arraste leads entre colunas para gerenciar seu funil de vendas visualmente.',
        position: 'bottom',
        order: 1,
    },
    {
        id: 'leads-behavior',
        module: 'leads',
        route: '/backoffice/leads/behavior',
        targetSelector: '[data-tour="kpis"]',
        title: 'Comportamento dos Leads',
        description: 'Analise engajamento, fontes de aquisição e padrões de comportamento dos seus leads.',
        position: 'bottom',
        order: 1,
    },

    // ── Imóveis ────────────────────────────────────────────────
    {
        id: 'imoveis-grid',
        module: 'imoveis',
        route: '/backoffice/imoveis',
        targetSelector: '[data-tour="imoveis-list"]',
        title: 'Portfólio de Imóveis',
        description: 'Todos os empreendimentos do portfólio. Use filtros e busca para encontrar rapidamente.',
        position: 'bottom',
        order: 1,
    },
    {
        id: 'imoveis-actions',
        module: 'imoveis',
        route: '/backoffice/imoveis',
        targetSelector: '[data-tour="actions"]',
        title: 'Ações Rápidas',
        description: 'Cadastre novo imóvel, importe via PDF da construtora, ou filtre por status.',
        position: 'bottom',
        order: 2,
    },
    {
        id: 'imoveis-novo',
        module: 'imoveis',
        route: '/backoffice/imoveis/novo',
        targetSelector: '[data-tour="wizard"]',
        title: 'Wizard de Cadastro',
        description: '4 passos: Básico → Detalhes → Valores → Mídia. A IA pode gerar descrições automaticamente.',
        position: 'bottom',
        order: 1,
    },

    // ── Campanhas ──────────────────────────────────────────────
    {
        id: 'campanhas-ads',
        module: 'campanhas',
        route: '/backoffice/campanhas/ads',
        targetSelector: '[data-tour="kpis"]',
        title: 'Performance de Ads',
        description: 'Dados sincronizados do Meta Ads — impressões, cliques, CPL e ROI em tempo real.',
        position: 'bottom',
        order: 1,
    },
    {
        id: 'campanhas-sync',
        module: 'campanhas',
        route: '/backoffice/campanhas',
        targetSelector: '[data-tour="actions"]',
        title: 'Sincronizar Meta Ads',
        description: 'Clique em "Sincronizar" para importar campanhas do Facebook/Instagram automaticamente.',
        position: 'bottom',
        order: 1,
    },

    // ── Financeiro ─────────────────────────────────────────────
    {
        id: 'fin-overview',
        module: 'financeiro',
        route: '/backoffice/financeiro',
        targetSelector: '[data-tour="kpis"]',
        title: 'Visão Financeira',
        description: 'Receitas, despesas e saldo consolidado. Lance entradas e saídas pelo formulário rápido.',
        position: 'bottom',
        order: 1,
    },
    {
        id: 'fin-metas',
        module: 'financeiro',
        route: '/backoffice/financeiro/metas',
        targetSelector: '[data-tour="goals"]',
        title: 'Metas Mensais',
        description: 'Defina metas de receita e avaliações. Acompanhe o progresso em barras de meta vs realizado.',
        position: 'bottom',
        order: 1,
    },
    {
        id: 'fin-receber',
        module: 'financeiro',
        route: '/backoffice/financeiro/receber',
        targetSelector: '[data-tour="kpis"]',
        title: 'Contas a Receber',
        description: 'Honorários e comissões pendentes. Marque como recebido direto pelo menu de ações (⋯).',
        position: 'bottom',
        order: 1,
    },

    // ── Equipe ─────────────────────────────────────────────────
    {
        id: 'equipe-grid',
        module: 'equipe',
        route: '/backoffice/equipe',
        targetSelector: '[data-tour="team-list"]',
        title: 'Gestão de Equipe',
        description: 'Gerencie corretores, gerentes e admins. Veja status online, CRECI e contato de cada membro.',
        position: 'bottom',
        order: 1,
    },
    {
        id: 'equipe-performance',
        module: 'equipe',
        route: '/backoffice/equipe',
        targetSelector: '[data-tour="performance"]',
        title: 'Performance da Equipe',
        description: 'Ranking de corretores com leads, conversões e receita. IA gera insights de coaching.',
        position: 'bottom',
        order: 2,
    },

    // ── Inteligência ───────────────────────────────────────────
    {
        id: 'ia-central',
        module: 'inteligencia',
        route: '/backoffice/ia',
        targetSelector: '[data-tour="ia-hub"]',
        title: 'Central de IA',
        description: 'Hub da inteligência artificial. Gere conteúdo, qualifique leads, analise mercado — tudo com IA.',
        position: 'bottom',
        order: 1,
    },
    {
        id: 'ia-agentes',
        module: 'inteligencia',
        route: '/backoffice/ia/agentes',
        targetSelector: '[data-tour="agents"]',
        title: 'Agentes de IA',
        description: 'Configure agentes autônomos: follow-up de leads, geração de conteúdo, relatórios automáticos.',
        position: 'bottom',
        order: 1,
    },
    {
        id: 'ia-automacoes',
        module: 'inteligencia',
        route: '/backoffice/automacoes',
        targetSelector: '[data-tour="automations"]',
        title: 'Automações',
        description: 'Crie workflows automáticos: novo lead → qualificar → notificar → agendar follow-up.',
        position: 'bottom',
        order: 1,
    },

    // ── Projetos ───────────────────────────────────────────────
    {
        id: 'projetos-list',
        module: 'projetos',
        route: '/backoffice/projetos',
        targetSelector: '[data-tour="projetos-list"]',
        title: 'Projetos & Lançamentos',
        description: 'Gerencie lançamentos imobiliários com plantas, tabela de preços e disponibilidade de unidades.',
        position: 'bottom',
        order: 1,
    },
    {
        id: 'projetos-pdf',
        module: 'projetos',
        route: '/backoffice/projetos',
        targetSelector: '[data-tour="pdf-import"]',
        title: 'Importar PDF da Construtora',
        description: 'A IA extrai plantas, preços e unidades automaticamente do PDF do empreendimento.',
        position: 'bottom',
        order: 2,
    },

    // ── Operação ───────────────────────────────────────────────
    {
        id: 'avaliacoes-list',
        module: 'operacao',
        route: '/backoffice/avaliacoes',
        targetSelector: '[data-tour="avaliacoes-list"]',
        title: 'Avaliações Imobiliárias',
        description: 'Laudos técnicos conforme NBR 14653-2. A IA auxilia na geração do parecer técnico.',
        position: 'bottom',
        order: 1,
    },
    {
        id: 'contratos-list',
        module: 'operacao',
        route: '/backoffice/contratos',
        targetSelector: '[data-tour="contratos-list"]',
        title: 'Contratos',
        description: 'Gerencie contratos de venda, locação e serviço. Acompanhe status e vencimentos.',
        position: 'bottom',
        order: 1,
    },
    {
        id: 'credito-ops',
        module: 'operacao',
        route: '/backoffice/credito',
        targetSelector: '[data-tour="credito-list"]',
        title: 'Crédito Imobiliário',
        description: 'Acompanhe operações de crédito, simule financiamentos e gerencie aprovações bancárias.',
        position: 'bottom',
        order: 1,
    },

    // ── Configurações ──────────────────────────────────────────
    {
        id: 'config-integracoes',
        module: 'config',
        route: '/backoffice/integracoes',
        targetSelector: '[data-tour="integrations"]',
        title: 'Integrações',
        description: 'Conecte WhatsApp, Meta Ads, portais imobiliários e outras ferramentas ao IMI.',
        position: 'bottom',
        order: 1,
    },
    {
        id: 'config-settings',
        module: 'config',
        route: '/backoffice/settings',
        targetSelector: '[data-tour="settings"]',
        title: 'Configurações Gerais',
        description: 'Gerencie organização, corretores, permissões, logs de sistema e configurações de IA.',
        position: 'bottom',
        order: 1,
    },

    // ── Agenda ─────────────────────────────────────────────────
    {
        id: 'agenda-calendar',
        module: 'agenda',
        route: '/backoffice/agenda',
        targetSelector: '[data-tour="calendar"]',
        title: 'Agenda Inteligente',
        description: 'Organize vistorias, reuniões e visitas. A IA sugere horários baseado nos leads mais quentes.',
        position: 'bottom',
        order: 1,
    },

    // ── Conteúdo ───────────────────────────────────────────────
    {
        id: 'conteudo-criador',
        module: 'conteudo',
        route: '/backoffice/conteudo/criador',
        targetSelector: '[data-tour="content-creator"]',
        title: 'Criador de Conteúdo IA',
        description: 'Gere posts para Instagram, LinkedIn e Newsletter automaticamente com IA.',
        position: 'bottom',
        order: 1,
    },
]

// ── Module metadata ──────────────────────────────────────────
export const MODULES: Record<string, { label: string; icon: string }> = {
    dashboard:    { label: 'Dashboard',      icon: 'BarChart3' },
    leads:        { label: 'Leads',          icon: 'Users' },
    imoveis:      { label: 'Imóveis',        icon: 'Building2' },
    campanhas:    { label: 'Campanhas',      icon: 'Megaphone' },
    financeiro:   { label: 'Financeiro',     icon: 'DollarSign' },
    equipe:       { label: 'Equipe',         icon: 'Users' },
    inteligencia: { label: 'Inteligência',   icon: 'Brain' },
    projetos:     { label: 'Projetos',       icon: 'FolderKanban' },
    operacao:     { label: 'Operação',       icon: 'FileText' },
    config:       { label: 'Configurações',  icon: 'Settings' },
    agenda:       { label: 'Agenda',         icon: 'Calendar' },
    conteudo:     { label: 'Conteúdo',       icon: 'Sparkles' },
}

export function getTipsForRoute(pathname: string): ContextualTip[] {
    return ONBOARDING_TIPS
        .filter(tip => pathname.startsWith(tip.route))
        .sort((a, b) => a.order - b.order)
}

export function getModuleForRoute(pathname: string): string | null {
    const tip = ONBOARDING_TIPS.find(t => pathname.startsWith(t.route))
    return tip?.module ?? null
}
