'use client'

import { useState } from 'react'
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
        tasksToday: 47,
        successRate: 94,
        lastRun: '2 min atrás',
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
        tasksToday: 23,
        successRate: 98,
        lastRun: '15 min atrás',
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
        tasksToday: 8,
        successRate: 100,
        lastRun: '2h atrás',
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
        tasksToday: 31,
        successRate: 87,
        lastRun: '5 min atrás',
        tools: ['Supabase', 'WhatsApp'],
        category: 'conversao',
    },
    {
        id: 'followup-agent',
        name: 'Agente Follow-up',
        description: 'Detecta leads sem resposta há mais de 48h e envia mensagens personalizadas de reengajamento no momento certo.',
        icon: MessageSquare,
        color: 'var(--bo-error)',
        colorRaw: '239,68,68',
        status: 'idle' as const,
        model: 'Claude Haiku',
        tasksToday: 12,
        successRate: 73,
        lastRun: '1h atrás',
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
        tasksToday: 3,
        successRate: 100,
        lastRun: 'Seg passada',
        tools: ['Supabase', 'Email', 'PDF'],
        category: 'inteligencia',
    },
]

const CATEGORIES = [
    { id: 'todos', label: 'Todos' },
    { id: 'captacao', label: 'Captação' },
    { id: 'conversao', label: 'Conversão' },
    { id: 'conteudo', label: 'Conteúdo' },
    { id: 'inteligencia', label: 'Inteligência' },
]

const STATUS_ICONS_IA: Record<string, any> = { active: CheckCircle2, idle: Clock, scheduled: Clock, error: AlertCircle }
const STATUS_MAP = Object.fromEntries(
    Object.entries({ active: 'Ativo', idle: 'Em espera', scheduled: 'Agendado', error: 'Erro' }).map(([key, label]) => {
        const cfg = getStatusConfig(key)
        return [key, { label, color: cfg.dot, bg: `${cfg.dot}1f`, icon: STATUS_ICONS_IA[key] || Clock }]
    })
) as Record<string, { label: string; color: string; bg: string; icon: any }>

export default function AgentesIAPage() {
    const [category, setCategory] = useState('todos')
    const [runningAgents, setRunningAgents] = useState<Set<string>>(new Set())

    const filtered = category === 'todos' ? AGENTS : AGENTS.filter(a => a.category === category)
    const activeCount = AGENTS.filter(a => a.status === 'active').length
    const totalTasksToday = AGENTS.reduce((s, a) => s + a.tasksToday, 0)
    const avgSuccess = Math.round(AGENTS.reduce((s, a) => s + a.successRate, 0) / AGENTS.length)

    function handleRunAgent(agentId: string, agentName: string) {
        setRunningAgents(prev => new Set(prev).add(agentId))
        toast.success(`${agentName} iniciado`, { description: 'O agente começará em instantes…' })
        setTimeout(() => {
            setRunningAgents(prev => {
                const next = new Set(prev)
                next.delete(agentId)
                return next
            })
            toast.success(`${agentName} concluído`, { description: 'Tarefa executada com sucesso.' })
        }, 3000)
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
                            background: 'var(--bo-accent)', color: '#fff',
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
                className="rounded-2xl p-4 mb-6 flex items-center gap-4"
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
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bo-text)', marginBottom: 2 }}>
                        Infraestrutura Agno
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--bo-text-muted)' }}>
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
                            background: category === cat.id ? 'var(--bo-accent)' : 'var(--bo-elevated)',
                            color: category === cat.id ? '#fff' : 'var(--bo-text-muted)',
                            border: `1px solid ${category === cat.id ? 'transparent' : 'var(--bo-border)'}`,
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
                            className="rounded-2xl overflow-hidden transition-all duration-200"
                            style={{
                                background: 'var(--bo-elevated)',
                                border: `1px solid var(--bo-border)`,
                                boxShadow: 'var(--bo-card-shadow)',
                            }}
                        >
                            {/* Card header */}
                            <div
                                className="p-4"
                                style={{
                                    background: `linear-gradient(135deg, rgba(${agent.colorRaw},0.10) 0%, rgba(${agent.colorRaw},0.03) 100%)`,
                                    borderBottom: '1px solid var(--bo-border)',
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
                                        className="flex items-center gap-1 px-2 py-1 rounded-full"
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

                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--bo-text)', marginBottom: 4 }}>
                                    {agent.name}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--bo-text-muted)', lineHeight: 1.5 }}>
                                    {agent.description}
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="px-4 py-3 flex items-center gap-4" style={{ borderBottom: '1px solid var(--bo-border)' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                                        Tarefas hoje
                                    </div>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--bo-text)' }}>
                                        {agent.tasksToday}
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                                        Sucesso
                                    </div>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: agent.successRate >= 90 ? 'var(--bo-success)' : agent.successRate >= 70 ? 'var(--bo-warning)' : 'var(--bo-error)' }}>
                                        {agent.successRate}%
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                                        Modelo
                                    </div>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--bo-text)' }}>
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
                                                borderRadius: 4, background: 'var(--bo-hover)',
                                                color: 'var(--bo-text-muted)', border: '1px solid var(--bo-border)',
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
                                        background: isRunning ? 'var(--bo-hover)' : `rgba(${agent.colorRaw},0.15)`,
                                        color: isRunning ? 'var(--bo-text-muted)' : agent.color,
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
                                style={{ fontSize: 10, color: 'var(--bo-text-muted)' }}
                            >
                                Última execução: {agent.lastRun}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Coming soon */}
            <div
                className="mt-6 rounded-2xl p-6 text-center"
                style={{
                    background: 'var(--bo-elevated)',
                    border: '1px dashed var(--bo-border)',
                }}
            >
                <Sparkles size={24} style={{ color: 'var(--bo-text-muted)', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bo-text)', marginBottom: 4 }}>
                    Crie seu próprio agente
                </div>
                <div style={{ fontSize: 12, color: 'var(--bo-text-muted)', maxWidth: 320, margin: '0 auto 16px' }}>
                    Defina ferramentas, memória, instruções e integrações. O agente opera 24h com lógica personalizada.
                </div>
                <button
                    onClick={() => toast.info('Em breve: builder de agentes personalizado')}
                    style={{
                        padding: '8px 20px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                        background: 'var(--bo-accent)', color: '#fff', border: 'none', cursor: 'pointer',
                    }}
                >
                    Em breve
                </button>
            </div>
        </div>
    )
}
