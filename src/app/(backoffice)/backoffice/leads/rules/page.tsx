// ============================================
// BLOCO 4 — SCRIPT 9: REGRAS DE PONTUAÇÃO
// ⚠️ COPIAR EXATAMENTE — NÃO MODIFICAR
// ============================================

/**
 * SALVAR EM: src/app/(backoffice)/backoffice/leads/rules/page.tsx
 */

'use client'

import { useState, useEffect } from 'react'
import {
    Settings,
    Zap,
    Target,
    Plus,
    ChevronRight,
    Building,
    MapPin,
    DollarSign,
    Mail,
    MessageSquare,
    Phone,
    Eye,
    Star,
    TrendingUp,
    Edit,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Info,
    Save,
    X,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader, KPICard, FilterTabs } from '@/app/(backoffice)/components/ui'
import type { FilterTab } from '@/app/(backoffice)/components/ui'

const REGRAS_INICIAIS = [
    {
        id: 1,
        nome: 'Engajamento Alto no Instagram',
        descricao: 'Lead interagiu com 3+ posts do IMI nos últimos 7 dias',
        gatilho: 'Interações Instagram ≥ 3 em 7 dias',
        pontos: 20,
        ativa: true,
        categoria: 'comportamento',
        icone: Zap,
        color: '#f97316',
        execucoes: 127,
    },
    {
        id: 2,
        nome: 'Perfil ICP — Alto Padrão',
        descricao: 'Lead atende ao perfil ideal: renda ≥ R$30k/mês, interesse em imóveis ≥ R$500k',
        gatilho: 'Budget declarado ≥ R$ 500.000',
        pontos: 35,
        ativa: true,
        categoria: 'perfil',
        icone: Target,
        color: '#3b82f6',
        execucoes: 89,
    },
    {
        id: 3,
        nome: 'Interesse em Boa Viagem',
        descricao: 'Lead sinalizou interesse em imóveis no bairro de Boa Viagem',
        gatilho: 'Localização: Boa Viagem selecionada',
        pontos: 15,
        ativa: true,
        categoria: 'localizacao',
        icone: MapPin,
        color: '#22c55e',
        execucoes: 201,
    },
    {
        id: 4,
        nome: 'Interesse em Pina / Candeias',
        descricao: 'Bairros de alta valorização e menor concorrência',
        gatilho: 'Localização: Pina ou Candeias selecionada',
        pontos: 10,
        ativa: true,
        categoria: 'localizacao',
        icone: MapPin,
        color: '#14b8a6',
        execucoes: 145,
    },
    {
        id: 5,
        nome: 'Email Aberto 3x na Semana',
        descricao: 'Lead abre consistentemente as newsletters da IMI',
        gatilho: 'Open rate ≥ 3 em 7 dias',
        pontos: 15,
        ativa: true,
        categoria: 'comportamento',
        icone: Mail,
        color: '#a855f7',
        execucoes: 64,
    },
    {
        id: 6,
        nome: 'WhatsApp Respondido',
        descricao: 'Lead respondeu mensagem do corretor via WhatsApp',
        gatilho: 'Resposta WhatsApp em < 2 horas',
        pontos: 25,
        ativa: true,
        categoria: 'comportamento',
        icone: MessageSquare,
        color: '#4ade80',
        execucoes: 43,
    },
    {
        id: 7,
        nome: 'Ligação Atendida',
        descricao: 'Lead atendeu ligação do consultor',
        gatilho: 'Chamada atendida registrada no CRM',
        pontos: 30,
        ativa: true,
        categoria: 'comportamento',
        icone: Phone,
        color: '#60a5fa',
        execucoes: 32,
    },
    {
        id: 8,
        nome: 'Visita ao Site: Página de Imóvel',
        descricao: 'Lead visitou página de produto específico no site',
        gatilho: 'Pageview /imoveis/* ≥ 2 sessões',
        pontos: 10,
        ativa: true,
        categoria: 'comportamento',
        icone: Eye,
        color: '#94a3b8',
        execucoes: 312,
    },
    {
        id: 9,
        nome: 'Interesse em Reserva Imperial',
        descricao: 'Lead demonstrou interesse no produto carro-chefe da IMI',
        gatilho: 'UTM campaign contém "reserva-imperial"',
        pontos: 20,
        ativa: true,
        categoria: 'produto',
        icone: Star,
        color: 'var(--bo-accent)',
        execucoes: 78,
    },
    {
        id: 10,
        nome: 'Lead Inativo 30 dias',
        descricao: 'Sem interação por 30 dias — reduz score',
        gatilho: 'Última interação > 30 dias',
        pontos: -20,
        ativa: true,
        categoria: 'decay',
        icone: TrendingUp,
        color: '#f87171',
        execucoes: 56,
    },
    {
        id: 11,
        nome: 'Empresa: Hospital / Clínica',
        descricao: 'Lead trabalha em empresa de saúde — perfil de alto poder aquisitivo',
        gatilho: 'Setor = Saúde (Hospital, Clínica, Consultório)',
        pontos: 15,
        ativa: false,
        categoria: 'perfil',
        icone: Building,
        color: '#f472b6',
        execucoes: 0,
    },
]

const CATEGORIAS_LABEL: Record<string, string> = {
    comportamento: 'Comportamento',
    perfil: 'Perfil',
    localizacao: 'Localização',
    produto: 'Produto',
    decay: 'Decaimento',
}

const LS_KEY = 'imi-lead-rules-state'

export default function LeadRulesPage() {
    const [regras, setRegras] = useState(REGRAS_INICIAIS)
    const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null)
    const [mostrarInativas, setMostrarInativas] = useState(false)

    // Load persisted toggle states from localStorage
    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Record<number, boolean>
            if (Object.keys(saved).length > 0) {
                setRegras(prev => prev.map(r => r.id in saved ? { ...r, ativa: saved[r.id] } : r))
            }
        } catch {}
    }, [])

    const toggleRegra = (id: number) => {
        setRegras(prev => {
            const next = prev.map(r => (r.id === id ? { ...r, ativa: !r.ativa } : r))
            // Persist state
            try {
                const state = Object.fromEntries(next.map(r => [r.id, r.ativa]))
                localStorage.setItem(LS_KEY, JSON.stringify(state))
            } catch {}
            return next
        })
    }

    const regrasFiltradas = regras.filter(r => {
        if (!mostrarInativas && !r.ativa) return false
        if (filtroCategoria && r.categoria !== filtroCategoria) return false
        return true
    })

    const stats = {
        total: regras.length,
        ativas: regras.filter(r => r.ativa).length,
        scoreMaximo: regras.filter(r => r.ativa && r.pontos > 0).reduce((a, r) => a + r.pontos, 0),
        execucoesTotais: regras.reduce((a, r) => a + r.execucoes, 0),
    }

    const categorias = [...new Set(regras.map(r => r.categoria))]

    return (
        <div className="space-y-5">
            {/* Header */}
            <PageIntelHeader
                moduleLabel="LEADS"
                title="Regras de Pontuação"
                subtitle="Configure como leads são qualificados automaticamente"
                actions={
                    <button
                        className="flex items-center gap-2 h-11 px-5 text-white rounded-xl font-semibold text-sm transition-colors"
                        style={{ background: 'var(--bo-accent)' }}
                    >
                        <Plus size={16} />
                        Nova Regra
                    </button>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <KPICard label="Total de Regras"    value={String(stats.total)}                                   icon={<Settings size={14} />} size="sm" />
                <KPICard label="Regras Ativas"      value={String(stats.ativas)}                                  icon={<Zap size={14} />} accent="green" size="sm" />
                <KPICard label="Score Máximo"       value={`${stats.scoreMaximo} pts`}                           icon={<Target size={14} />} accent="blue" size="sm" />
                <KPICard label="Execuções Totais"   value={stats.execucoesTotais.toLocaleString('pt-BR')}         icon={<TrendingUp size={14} />} size="sm" />
            </div>

            {/* Info box */}
            <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-blue-300">Como funciona o Lead Scoring</p>
                    <p className="text-xs text-blue-400 mt-0.5">
                        Cada lead começa com 0 pontos. As regras somam ou subtraem pontos automaticamente.
                        Leads com score ≥ 50 são classificados como <strong>Quentes</strong>,
                        20-49 como <strong>Mornos</strong>, e abaixo de 20 como <strong>Frios</strong>.
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-3">
                <FilterTabs
                    tabs={[
                        { id: '__all__', label: 'Todas', count: regras.length },
                        ...categorias.map(cat => ({
                            id: cat,
                            label: CATEGORIAS_LABEL[cat] || cat,
                            count: regras.filter(r => r.categoria === cat).length,
                        })),
                    ] as FilterTab[]}
                    active={filtroCategoria ?? '__all__'}
                    onChange={(v) => setFiltroCategoria(v === '__all__' ? null : v)}
                />
                <button
                    onClick={() => setMostrarInativas(!mostrarInativas)}
                    className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:opacity-80 ml-auto"
                    style={{ color: T.textMuted }}
                >
                    {mostrarInativas ? <ToggleRight size={16} style={{ color: T.accent }} /> : <ToggleLeft size={16} />}
                    Mostrar inativas
                </button>
            </div>

            {/* Lista de regras */}
            <div className="space-y-3">
                {regrasFiltradas.map(regra => {
                    const Icon = regra.icone
                    return (
                        <div
                            key={regra.id}
                            className={`rounded-2xl p-5 transition-all group ${!regra.ativa ? 'opacity-60' : ''}`}
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        >
                            <div className="flex items-start gap-4">
                                {/* Ícone */}
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${regra.color}18`, border: `1px solid ${regra.color}30` }}>
                                    <Icon size={22} style={{ color: regra.color }} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <div>
                                            <h3 className="text-sm font-bold" style={{ color: T.text }}>{regra.nome}</h3>
                                            <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>{regra.descricao}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {/* Score badge */}
                                            <span className={`px-2.5 py-1 rounded-lg text-sm font-bold ${regra.pontos > 0
                                                    ? 'bg-green-500/10 text-green-400'
                                                    : 'bg-red-500/10 text-red-400'
                                                }`}>
                                                {regra.pontos > 0 ? '+' : ''}{regra.pontos} pts
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mt-2">
                                        {/* Gatilho */}
                                        <div className="flex items-center gap-1.5">
                                            <Zap size={11} style={{ color: T.textMuted }} />
                                            <span className="text-xs font-mono px-2 py-0.5 rounded-md" style={{ color: T.textMuted, background: T.elevated }}>
                                                {regra.gatilho}
                                            </span>
                                        </div>

                                        {/* Categoria */}
                                        <span className="text-xs" style={{ color: T.textMuted }}>
                                            {CATEGORIAS_LABEL[regra.categoria]}
                                        </span>

                                        {/* Execuções */}
                                        {regra.execucoes > 0 && (
                                            <span className="text-xs" style={{ color: T.textMuted }}>
                                                {regra.execucoes} execuções
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Ações */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        className="w-8 h-8 flex items-center justify-center rounded-xl transition-all opacity-0 group-hover:opacity-100 hover:bg-white/10"
                                        title="Editar"
                                    >
                                        <Edit size={14} style={{ color: T.textMuted }} />
                                    </button>
                                    <button
                                        onClick={() => toggleRegra(regra.id)}
                                        className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium transition-colors"
                                        title={regra.ativa ? 'Desativar' : 'Ativar'}
                                    >
                                        {regra.ativa ? (
                                            <>
                                                <ToggleRight size={16} className="text-green-500" />
                                                <span className="text-green-400">Ativa</span>
                                            </>
                                        ) : (
                                            <>
                                                <ToggleLeft size={16} style={{ color: T.textMuted }} />
                                                <span style={{ color: T.textMuted }}>Inativa</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {regrasFiltradas.length === 0 && (
                    <div className="text-center py-12 rounded-2xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <Settings size={40} className="mx-auto mb-3" style={{ color: T.textMuted, opacity: 0.4 }} />
                        <p style={{ color: T.textMuted }}>Nenhuma regra encontrada</p>
                        <button className="mt-3 text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: T.accent }}>
                            + Criar primeira regra
                        </button>
                    </div>
                )}
            </div>

            {/* Score preview */}
            <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: T.text }}>
                    Simulador de Score
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    {[
                        { label: 'Lead Frio', range: '0–19 pts', bgColor: T.elevated, textColor: T.textMuted, desc: 'Nutrição automática' },
                        { label: 'Lead Morno', range: '20–49 pts', bgColor: 'rgba(249,115,22,0.1)', textColor: '#fb923c', desc: 'Follow-up em 48h' },
                        { label: 'Lead Quente', range: '50+ pts', bgColor: 'rgba(239,68,68,0.1)', textColor: '#f87171', desc: 'Contato imediato' },
                    ].map(cat => (
                        <div key={cat.label} className="rounded-xl p-4" style={{ background: cat.bgColor }}>
                            <p className="text-sm font-bold" style={{ color: cat.textColor }}>{cat.label}</p>
                            <p className="text-xs font-mono mt-1" style={{ color: cat.textColor }}>{cat.range}</p>
                            <p className="text-xs mt-2 opacity-70" style={{ color: cat.textColor }}>{cat.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
