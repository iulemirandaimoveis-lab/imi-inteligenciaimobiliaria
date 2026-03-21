'use client'

import { useState, useEffect } from 'react'
import {
    Bot, Brain, Sparkles, Zap, Play, Pause, Settings,
    MessageSquare, Users, Building2, BarChart3, Mail,
    FileText, Search, TrendingUp, Clock, CheckCircle2,
    AlertCircle, ChevronRight, Plus, Cpu, Globe
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { getStatusConfig } from '@/app/(backoffice)/lib/constants'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { KPICard } from '@/app/(backoffice)/components/ui/KPICard'
import { toast } from 'sonner'

// ── Agent definitions ─────────────────────────────────────────────
const AGENTS = [
    {
        id: 'lead-qualifier',
        name: 'Agente Qualificador',
        description: 'Analisa leads automaticamente e classifica por temperatura, perfil e probabilidade de conversão.',
        icon: Users,
        color: '#3B82F6',
        colorRaw: '59,130,246',
        status: 'active' as const,
        model: 'Claude Sonnet',
        tasksToday: 0,
        successRate: 94,
        lastRun: '\u2014',
        tools: ['Supabase', 'WhatsApp', 'Email'],
        category: 'captacao',
    },
    {
        id: 'content-creator',
        name: 'Agente de Conteúdo',
        description: 'Cria posts, legendas, hashtags e textos de e-mail com base no portfólio de imóveis e métricas de engajamento.',
        icon: FileText,
        color: '#8B5CF6',
        colorRaw: '139,92,246',
        status: 'active' as const,
        model: 'Claude Sonnet',
        tasksToday: 0,
        successRate: 98,
        lastRun: '\u2014',
        tools: ['Instagram', 'LinkedIn', 'Email'],
        category: 'conteudo',
    },
    {
        id: 'market-analyst',
        name: 'Agente de Mercado',
        description: 'Monitora índices INCC, FIPE ZAP e SECOVI, gera relatórios de inteligência de preços por bairro.',
        icon: TrendingUp,
        color: '#10B981',
        colorRaw: '16,185,129',
        status: 'idle' as const,
        model: 'Claude Sonnet',
        tasksToday: 0,
        successRate: 100,
        lastRun: '\u2014',
        tools: ['FIPE ZAP', 'SECOVI', 'Supabase'],
        category: 'inteligencia',
    },
    {
        id: 'property-matcher',
        name: 'Agente Matchmaker',
        description: 'Cruza o perfil do lead com o portfólio de imóveis e sugere as 3 melhores opções com justificativa personalizada.',
        icon: Building2,
        color: '#F59E0B',
        colorRaw: '245,158,11',
        status: 'active' as const,
        model: 'Claude Haiku',
        tasksToday: 0,
        successRate: 87,
        lastRun: '\u2014',
        tools: ['Supabase', 'WhatsApp'],
        category: 'conversao',
    },
    {
        id: 'followup-agent',
        name: 'Agente Follow-up',
        description: 'Detecta leads sem resposta há mais de 48h e envia mensagens personalizadas de reengajamento no momento certo.',
        icon: MessageSquare,
        color: 'var(--error)',
        colorRaw: '239,68,68',
        status: 'idle' as const,
        model: 'Claude Haiku',
        tasksToday: 0,
        successRate: 73,
        lastRun: '\u2014',
        tools: ['WhatsApp', 'Email', 'Supabase'],
        category: 'conversao',
    },
    {
        id: 'report-agent',
        name: 'Agente de Relatórios',
        description: 'Gera relatórios executivos semanais com análise de performance, tendências e recomendações estratégicas.',
        icon: BarChart3,
        color: '#06B6D4',
        colorRaw: '6,182,212',
        status: 'scheduled' as const,
        model: 'Claude Sonnet',
        tasksToday: 0,
        successRate: 100,
        lastRun: '\u2014',
        tools: ['Supabase', 'Email', 'PDF'],
        category: 'inteligencia',
    },
    {
        id: 'hormozi-advisor',
        name: 'Hormozi Advisor',
        description: 'Estrategista de negócios com a filosofia Hormozi. Diagnóstico brutal de gargalos, alavancas de crescimento e plano de ação para escalar receita.',
        icon: Brain,
        color: '#F59E0B',
        colorRaw: '245,158,11',
        status: 'idle' as const,
        model: 'Claude Opus',
        tasksToday: 0,
        successRate: 92,
        lastRun: '—',
        tools: ['Análise', 'Frameworks', 'Diagnóstico'],
        category: 'squads',
    },
    {
        id: 'hormozi-copy',
        name: 'Hormozi Copy',
        description: 'Copywriting direto ao ponto. Value Equation aplicada em headlines, bullets e CTAs. Sem fluff, sem hype — apenas lógica e valor esmagador.',
        icon: FileText,
        color: '#8B5CF6',
        colorRaw: '139,92,246',
        status: 'idle' as const,
        model: 'Claude Sonnet',
        tasksToday: 0,
        successRate: 96,
        lastRun: '—',
        tools: ['Copy', 'Landing Pages', 'Emails'],
        category: 'squads',
    },
    {
        id: 'hormozi-leads',
        name: 'Hormozi Leads',
        description: 'Geração de leads como Hormozi: audiências frias → quentes → clientes. Lead magnets irresistíveis, sequências de follow-up e qualificação agressiva.',
        icon: Users,
        color: '#10B981',
        colorRaw: '16,185,129',
        status: 'idle' as const,
        model: 'Claude Sonnet',
        tasksToday: 0,
        successRate: 88,
        lastRun: '—',
        tools: ['Lead Gen', 'Qualificação', 'Follow-up'],
        category: 'squads',
    },
    {
        id: 'hormozi-closer',
        name: 'Hormozi Closer',
        description: 'Fechamento de vendas high-ticket com frameworks Hormozi. Scripts de objeção, CLOSER framework e técnicas de reframe para negociações imobiliárias premium.',
        icon: TrendingUp,
        color: '#EF4444',
        colorRaw: '239,68,68',
        status: 'idle' as const,
        model: 'Claude Sonnet',
        tasksToday: 0,
        successRate: 85,
        lastRun: '—',
        tools: ['Vendas', 'Scripts', 'Objeções'],
        category: 'squads',
    },
    {
        id: 'hormozi-offers',
        name: 'Hormozi Offers',
        description: 'Criação de Grand Slams — ofertas tão boas que o cliente se sente idiota em dizer não. Value stacking, bônus estratégicos e preço psicológico.',
        icon: Sparkles,
        color: '#F97316',
        colorRaw: '249,115,22',
        status: 'idle' as const,
        model: 'Claude Opus',
        tasksToday: 0,
        successRate: 91,
        lastRun: '—',
        tools: ['Ofertas', 'Value Stack', 'Pricing'],
        category: 'squads',
    },
    {
        id: 'hormozi-ads',
        name: 'Hormozi Ads',
        description: 'Criativos e copy para anúncios Meta/Google com metodologia Hormozi. Hooks que param o scroll, provas sociais irresistíveis e CTAs diretos.',
        icon: Zap,
        color: '#3B82F6',
        colorRaw: '59,130,246',
        status: 'idle' as const,
        model: 'Claude Sonnet',
        tasksToday: 0,
        successRate: 89,
        lastRun: '—',
        tools: ['Meta Ads', 'Google Ads', 'Criativos'],
        category: 'squads',
    },
    {
        id: 'hormozi-hooks',
        name: 'Hormozi Hooks',
        description: 'Hooks ultra-específicos que geram curiosidade e parada de scroll. 30+ formatos testados. Aplica o princípio "Big Three": Medo, Curiosidade, Inveja.',
        icon: MessageSquare,
        color: '#06B6D4',
        colorRaw: '6,182,212',
        status: 'idle' as const,
        model: 'Claude Haiku',
        tasksToday: 0,
        successRate: 94,
        lastRun: '—',
        tools: ['Social Media', 'Vídeos', 'Copy'],
        category: 'squads',
    },
    {
        id: 'hormozi-audit',
        name: 'Hormozi Audit',
        description: 'Auditoria completa do negócio IMI: funil de vendas, copy, ofertas, follow-up, team performance. Entrega diagnóstico com prioridades de A a Z.',
        icon: BarChart3,
        color: '#A78BFA',
        colorRaw: '167,139,250',
        status: 'idle' as const,
        model: 'Claude Opus',
        tasksToday: 0,
        successRate: 97,
        lastRun: '—',
        tools: ['Auditoria', 'Analytics', 'Relatórios'],
        category: 'squads',
    },
]

const CATEGORIES = [
    { id: 'todos', label: 'Todos' },
    { id: 'captacao', label: 'Captação' },
    { id: 'conversao', label: 'Conversão' },
    { id: 'conteudo', label: 'Conteúdo' },
    { id: 'inteligencia', label: 'Inteligência' },
    { id: 'squads', label: 'Squads' },
]

const STATUS_ICONS_IA: Record<string, React.ElementType> = { active: CheckCircle2, idle: Clock, scheduled: Clock, error: AlertCircle }
const STATUS_MAP = Object.fromEntries(
    Object.entries({ active: 'Ativo', idle: 'Em espera', scheduled: 'Agendado', error: 'Erro' }).map(([key, label]) => {
        const cfg = getStatusConfig(key)
        return [key, { label, color: cfg.dot, bg: `${cfg.dot}1f`, icon: STATUS_ICONS_IA[key] || Clock }]
    })
) as Record<string, { label: string; color: string; bg: string; icon: React.ElementType }>

export default function AgentesIAPage() {
    const [category, setCategory] = useState('todos')
    const [runningAgents, setRunningAgents] = useState<Set<string>>(new Set())
    const [agentStats, setAgentStats] = useState<Record<string, { tasksToday: number }>>({})

    useEffect(() => {
        fetch('/api/ai/agents/stats')
            .then(r => r.json())
            .then(data => { if (data?.agents) setAgentStats(data.agents) })
            .catch(() => {})
    }, [])

    const filtered = category === 'todos' ? AGENTS : AGENTS.filter(a => a.category === category)
    const activeCount = AGENTS.filter(a => a.status === 'active').length
    const totalTasksToday = AGENTS.reduce((s, a) => s + a.tasksToday + (agentStats[a.id]?.tasksToday || 0), 0)
    const avgSuccess = Math.round(AGENTS.reduce((s, a) => s + a.successRate, 0) / AGENTS.length)

    // Maps each agent to a task_type + sample prompt for the AI Router
    const AGENT_TASKS: Record<string, { task_type: string; prompt: string }> = {
        'lead-qualifier': {
            task_type: 'analise_lead',
            prompt: 'Analise o perfil de lead padrão para imóveis premium em Boa Viagem, Recife. Retorne JSON com score, perfil, necessidades, imovel_ideal, proximo_passo e urgencia.',
        },
        'content-creator': {
            task_type: 'legenda',
            prompt: 'Crie uma legenda para Instagram sobre lançamento de apartamento premium em Boa Viagem com vista para o mar. 280 caracteres. Tom sofisticado.',
        },
        'market-analyst': {
            task_type: 'custom',
            prompt: 'Analise as tendências do mercado imobiliário premium de Recife (Boa Viagem, Pina, Setúbal) para o 1º semestre de 2026. Destaque variações de preço/m², oferta e demanda.',
        },
        'property-matcher': {
            task_type: 'descricao',
            prompt: 'Escreva uma descrição técnica e elegante para um apartamento de 120m², 3 quartos, 2 vagas, frente mar, no Edifício Acqua Premium, Boa Viagem, R$ 1.2M.',
        },
        'followup-agent': {
            task_type: 'email',
            prompt: 'Escreva um email de reengajamento para um lead que visitou apartamentos em Boa Viagem há 5 dias sem responder. Tom consultivo, CTA para agendar visita.',
        },
        'report-agent': {
            task_type: 'custom',
            prompt: 'Gere um resumo executivo semanal fictício para a IMI com: leads captados (47), visitas realizadas (12), propostas enviadas (3), conversões (1). Inclua recomendações estratégicas.',
        },
        'hormozi-advisor': {
            task_type: 'custom',
            prompt: 'Como Hormozi Advisor, analise o negócio de uma imobiliária premium em Recife (IMI — Inteligência Imobiliária). Identifique os 3 principais gargalos e as 3 maiores alavancas de crescimento para chegar a R$1M/mês em receita. Seja direto, use frameworks Hormozi.',
        },
        'hormozi-copy': {
            task_type: 'legenda',
            prompt: 'Escreva copy no estilo Hormozi para uma landing page de apartamentos premium em Boa Viagem, Recife. Ticket médio R$1.2M. Aplique a Value Equation. 300 palavras. Seja específico e elimine o fluff.',
        },
        'hormozi-leads': {
            task_type: 'custom',
            prompt: 'Crie uma estratégia de geração de leads Hormozi para imóveis premium em Recife. Inclua: 3 lead magnets irresistíveis, sequência de follow-up de 7 dias e critérios de qualificação. Foco em compradores com R$500k+.',
        },
        'hormozi-closer': {
            task_type: 'custom',
            prompt: 'Aplique o CLOSER framework de Hormozi para uma negociação de apartamento de R$1.2M em Boa Viagem. O lead está interessado mas diz "está caro". Script completo de objeção + reframe + fechamento.',
        },
        'hormozi-offers': {
            task_type: 'custom',
            prompt: 'Crie uma Grand Slam Offer estilo Hormozi para o serviço de consultoria imobiliária da IMI. Value stack com bônus, garantias e preço estratégico para ticket de R$5.000-R$15.000 em assessoria.',
        },
        'hormozi-ads': {
            task_type: 'custom',
            prompt: 'Crie 3 criativos para Meta Ads de imóveis premium em Recife (IMI). Formato: Hook + Corpo + CTA. Aplique o método Hormozi de especificidade máxima. Target: investidores 35-55 anos, renda R$20k+/mês.',
        },
        'hormozi-hooks': {
            task_type: 'custom',
            prompt: 'Gere 10 hooks estilo Hormozi para conteúdo sobre investimento imobiliário em Recife. Use os 3 gatilhos: Medo (de perder), Curiosidade (segredo), Inveja (outros já fizeram). Seja ultra-específico.',
        },
        'hormozi-audit': {
            task_type: 'custom',
            prompt: 'Execute uma auditoria Hormozi completa da IMI (imobiliária premium Recife). Analise: funil de vendas, ofertas, copy, follow-up, team performance. Priorize as TOP 5 mudanças que gerariam mais receita em 90 dias.',
        },
    }

    async function handleRunAgent(agentId: string, agentName: string) {
        setRunningAgents(prev => new Set(prev).add(agentId))
        toast.success(`${agentName} iniciado`, { description: 'Conectando ao AI Router…' })

        const agentTask = AGENT_TASKS[agentId] || {
            task_type: 'custom',
            prompt: `Execute uma tarefa de demonstração para o agente ${agentName}.`,
        }

        try {
            const res = await fetch('/api/ai/router', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_type: agentTask.task_type,
                    prompt: agentTask.prompt,
                }),
            })

            const data = await res.json()

            if (res.ok && data.success) {
                const preview = (data.result as string)?.slice(0, 120)
                toast.success(`${agentName} concluído`, {
                    description: preview ? `${preview}…` : 'Tarefa executada com sucesso.',
                    duration: 6000,
                })
            } else {
                throw new Error(data.error || 'Erro desconhecido')
            }
        } catch (err: unknown) {
            toast.error(`${agentName} falhou`, {
                description: (err as Error)?.message || 'Não foi possível executar o agente.',
            })
        } finally {
            setRunningAgents(prev => {
                const next = new Set(prev)
                next.delete(agentId)
                return next
            })
        }
    }

    return (
        <div data-tour="agents" style={{ color: T.text }}>
            <PageIntelHeader
                title="Agentes IA"
                subtitle="Agentes autônomos com memória, ferramentas e raciocínio multi-step · Powered by Agno"
                actions={
                    <button
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'var(--btn-primary-bg)', color: '#fff',
                            border: 'none', borderRadius: 10, padding: '8px 14px',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}
                        onClick={() => toast.info('Em breve: criar agente personalizado')}
                    >
                        <Plus size={14} />
                        Novo Agente
                    </button>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <KPICard label="Agentes Ativos" value={activeCount} icon={<Bot size={14} />} accent="green" size="sm" />
                <KPICard label="Tarefas Hoje" value={totalTasksToday} icon={<Zap size={14} />} accent="blue" size="sm" />
                <KPICard label="Taxa de Sucesso" value={`${avgSuccess}%`} icon={<CheckCircle2 size={14} />} accent="cold" size="sm" delta={3} deltaLabel="vs semana" />
                <KPICard label="Modelos" value="Claude" icon={<Cpu size={14} />} accent="ai" size="sm" sublabel="Anthropic" />
            </div>

            {/* Agno banner */}
            <div
                className="rounded-lg p-4 mb-6 flex items-center gap-4"
                style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.10) 0%, rgba(59,130,246,0.08) 100%)',
                    border: '1px solid rgba(139,92,246,0.20)',
                }}
            >
                <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                    <Brain size={20} style={{ color: '#A78BFA' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                        Infraestrutura Agno
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Agentes com memória persistente, ferramentas externas, raciocínio step-by-step e execução paralela.
                        Cada agente tem seu próprio contexto, histórico de sessão e capacidade de chamar APIs em cadeia.
                    </div>
                </div>
                <a
                    href="https://www.agno.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 11, fontWeight: 600, color: '#A78BFA',
                        textDecoration: 'none', flexShrink: 0,
                    }}
                >
                    <Globe size={12} />
                    agno.com
                </a>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 mb-5 flex-wrap">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        style={{
                            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.15s',
                            background: category === cat.id ? 'var(--accent-400)' : 'var(--bg-elevated)',
                            color: category === cat.id ? '#fff' : 'var(--text-secondary)',
                            border: `1px solid ${category === cat.id ? 'transparent' : 'var(--border-default)'}`,
                        }}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Agent cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(agent => {
                    const StatusIcon = STATUS_MAP[agent.status].icon
                    const AgentIcon = agent.icon
                    const isRunning = runningAgents.has(agent.id)

                    return (
                        <div
                            key={agent.id}
                            className="rounded-lg overflow-hidden transition-all duration-200"
                            style={{
                                background: 'var(--bg-elevated)',
                                border: `1px solid var(--border-default)`,
                                boxShadow: 'none',
                            }}
                        >
                            {/* Card header */}
                            <div
                                className="p-4"
                                style={{
                                    background: `linear-gradient(135deg, rgba(${agent.colorRaw},0.10) 0%, rgba(${agent.colorRaw},0.03) 100%)`,
                                    borderBottom: '1px solid var(--border-default)',
                                }}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div
                                        style={{
                                            width: 40, height: 40, borderRadius: 12,
                                            background: `rgba(${agent.colorRaw},0.15)`,
                                            border: `1px solid rgba(${agent.colorRaw},0.25)`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        <AgentIcon size={20} style={{ color: agent.color }} />
                                    </div>

                                    {/* Status pill */}
                                    <span
                                        className="flex items-center gap-1 px-2 py-1 rounded-[6px]"
                                        style={{
                                            background: STATUS_MAP[agent.status].bg,
                                            color: STATUS_MAP[agent.status].color,
                                            fontSize: 10, fontWeight: 700,
                                        }}
                                    >
                                        <StatusIcon size={9} />
                                        {STATUS_MAP[agent.status].label}
                                    </span>
                                </div>

                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                    {agent.name}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    {agent.description}
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="px-4 py-3 flex items-center gap-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                                        Tarefas hoje
                                    </div>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                                        {agent.tasksToday + (agentStats[agent.id]?.tasksToday || 0)}
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                                        Sucesso
                                    </div>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: agent.successRate >= 90 ? 'var(--success)' : agent.successRate >= 70 ? 'var(--warning)' : 'var(--error)' }}>
                                        {agent.successRate}%
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                                        Modelo
                                    </div>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {agent.model}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-3 flex items-center justify-between">
                                {/* Tools */}
                                <div className="flex items-center gap-1">
                                    {agent.tools.map(tool => (
                                        <span
                                            key={tool}
                                            style={{
                                                fontSize: 9, fontWeight: 600, padding: '2px 6px',
                                                borderRadius: 6, background: 'var(--bg-hover)',
                                                color: 'var(--text-secondary)', border: '1px solid var(--border-default)',
                                            }}
                                        >
                                            {tool}
                                        </span>
                                    ))}
                                </div>

                                {/* Run button */}
                                <button
                                    onClick={() => handleRunAgent(agent.id, agent.name)}
                                    disabled={isRunning}
                                    className="flex items-center gap-1.5"
                                    style={{
                                        padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                        cursor: isRunning ? 'not-allowed' : 'pointer',
                                        background: isRunning ? 'var(--bg-hover)' : `rgba(${agent.colorRaw},0.15)`,
                                        color: isRunning ? 'var(--text-secondary)' : agent.color,
                                        border: `1px solid rgba(${agent.colorRaw},0.25)`,
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {isRunning ? (
                                        <>
                                            <span className="animate-spin inline-block w-3 h-3 border border-current border-t-transparent rounded-full" />
                                            Rodando…
                                        </>
                                    ) : (
                                        <>
                                            <Play size={10} />
                                            Executar
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Last run */}
                            <div
                                className="px-4 pb-3"
                                style={{ fontSize: 10, color: 'var(--text-secondary)' }}
                            >
                                Última execução: {agent.lastRun}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Hormozi Squad banner */}
            {(category === 'todos' || category === 'squads') && (
                <div
                    className="mt-2 mb-4 rounded-lg p-4 flex items-center gap-4"
                    style={{
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(249,115,22,0.06) 100%)',
                        border: '1px solid rgba(245,158,11,0.18)',
                    }}
                >
                    <div style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Zap size={20} style={{ color: '#F59E0B' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                            Hormozi Squad · 8 Agentes Especialistas
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            Frameworks de Alex Hormozi: Grand Slam Offers, $100M Leads, CLOSER, Value Equation.
                            Cada agente implementa uma parte do sistema Hormozi para escalar a IMI.
                        </div>
                    </div>
                </div>
            )}

            {/* Coming soon */}
            <div
                className="mt-6 rounded-lg p-6 text-center"
                style={{
                    background: 'var(--bg-elevated)',
                    border: '1px dashed var(--border-default)',
                }}
            >
                <Sparkles size={24} style={{ color: 'var(--text-secondary)', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Crie seu próprio agente
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 320, margin: '0 auto 16px' }}>
                    Defina ferramentas, memória, instruções e integrações. O agente opera 24h com lógica personalizada.
                </div>
                <button
                    onClick={() => toast.info('Em breve: builder de agentes personalizado')}
                    style={{
                        padding: '8px 20px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                        background: 'var(--btn-primary-bg)', color: '#fff', border: 'none', cursor: 'pointer',
                    }}
                >
                    Em breve
                </button>
            </div>
        </div>
    )
}
