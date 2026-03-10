'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
    ArrowLeft, Target, TrendingUp, TrendingDown, Users,
    DollarSign, Eye, Edit, Play, Pause, BarChart3,
    Instagram, Facebook, Globe, Mail, MessageSquare,
    Loader2, ChevronRight, Link as LinkIcon, Sparkles, Brain,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const T = {
    surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)',
    gold: 'var(--bo-accent)',
}

const TYPE_MAP: Record<string, { label: string; icon: any }> = {
    google_ads: { label: 'Google Ads', icon: Globe },
    facebook: { label: 'Facebook', icon: Facebook },
    instagram: { label: 'Instagram', icon: Instagram },
    email: { label: 'Email', icon: Mail },
    whatsapp: { label: 'WhatsApp', icon: MessageSquare },
    sms: { label: 'SMS', icon: MessageSquare },
    organic: { label: 'Orgânico', icon: TrendingUp },
    referral: { label: 'Indicação', icon: Users },
    event: { label: 'Evento', icon: Target },
    other: { label: 'Outro', icon: BarChart3 },
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: 'Ativa', color: '#4CAF7D', bg: 'rgba(76,175,125,0.10)' },
    paused: { label: 'Pausada', color: '#E8A87C', bg: 'rgba(232,168,124,0.10)' },
    completed: { label: 'Concluída', color: '#7B9EC4', bg: 'rgba(123,158,196,0.10)' },
    draft: { label: 'Rascunho', color: '#A89EC4', bg: 'rgba(168,158,196,0.10)' },
    archived: { label: 'Arquivada', color: '#6B7280', bg: 'rgba(107,114,128,0.10)' },
}

const fmtBRL = (v: number | null | undefined) => {
    if (v == null) return '—'
    if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`
    return `R$ ${v.toFixed(2)}`
}

const fmtN = (v: number | null | undefined) =>
    v == null ? '—' : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)

export default function CampanhaDetalhesPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [campanha, setCampanha] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'overview' | 'metricas'>('overview')
    const [aiAnalysis, setAiAnalysis] = useState<any>(null)
    const [aiLoading, setAiLoading] = useState(false)

    useEffect(() => {
        fetch(`/api/campanhas?id=${id}`)
            .then(r => r.json())
            .then(data => {
                if (!data.error) {
                    setCampanha(data)
                    // Fire Claude analysis immediately after loading
                    setAiLoading(true)
                    fetch('/api/ai/analyze', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'campanha', data }),
                    })
                        .then(r => r.json())
                        .then(res => { if (res.analysis) setAiAnalysis(res.analysis) })
                        .catch(() => { /* AI analysis non-critical */ })
                        .finally(() => setAiLoading(false))
                }
            })
            .catch(() => { toast.error('Erro ao carregar campanha') })
            .finally(() => setLoading(false))
    }, [id])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="animate-spin" size={22} style={{ color: T.gold }} />
            </div>
        )
    }

    if (!campanha) {
        return (
            <div className="rounded-2xl p-16 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <Target size={32} className="mx-auto mb-3 opacity-30" style={{ color: T.textSub }} />
                <p className="text-sm font-semibold" style={{ color: T.textSub }}>Campanha não encontrada</p>
                <Link href="/backoffice/campanhas" className="text-xs mt-2 inline-block hover:underline" style={{ color: T.gold }}>
                    Voltar às campanhas
                </Link>
            </div>
        )
    }

    const type = TYPE_MAP[campanha.channel] || TYPE_MAP.other
    const status = STATUS_MAP[campanha.status] || STATUS_MAP.draft
    const TypeIcon = type.icon
    const progressPct = campanha.budget ? Math.min((campanha.spent / campanha.budget) * 100, 100) : 0

    // Computed funnel from real data
    const funnel = [
        { stage: 'Impressões', count: campanha.impressions || 0 },
        { stage: 'Cliques', count: campanha.clicks || 0 },
        { stage: 'Leads', count: campanha.leads || 0 },
        { stage: 'Conversões', count: campanha.conversions || 0 },
    ]
    const maxFunnel = funnel[0].count || 1

    const KPIS = [
        { label: 'Impressões', value: fmtN(campanha.impressions), color: T.textSub },
        { label: 'Cliques', value: fmtN(campanha.clicks), color: '#7BA3C2' },
        { label: 'CTR', value: campanha.ctr != null ? `${Number(campanha.ctr).toFixed(1)}%` : '—', color: '#A89EC4' },
        { label: 'Leads', value: fmtN(campanha.leads), color: T.gold },
        { label: 'Conversões', value: fmtN(campanha.conversions), color: '#4CAF7D' },
        { label: 'CPL', value: fmtBRL(campanha.cost_per_lead), color: '#E8A87C' },
        { label: 'ROI', value: campanha.roi != null ? `${Number(campanha.roi).toFixed(0)}%` : '—', color: '#6BB87B' },
        { label: 'Orçamento', value: fmtBRL(campanha.budget), color: T.text },
    ]

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/backoffice/campanhas" className="text-xs font-medium hover:underline" style={{ color: T.textSub }}>
                            Campanhas
                        </Link>
                        <ChevronRight size={12} style={{ color: T.textSub }} />
                        <span className="text-xs font-medium" style={{ color: T.text }}>{campanha.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(72,101,129,0.12)' }}>
                            <TypeIcon size={16} style={{ color: T.gold }} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold leading-tight" style={{ color: T.text }}>{campanha.name}</h1>
                            <p className="text-xs mt-0.5" style={{ color: T.textSub }}>
                                {type.label}
                                {campanha.objective && <> · {campanha.objective}</>}
                                {campanha.start_date && <> · {new Date(campanha.start_date).toLocaleDateString('pt-BR')}</>}
                                {campanha.end_date && <> – {new Date(campanha.end_date).toLocaleDateString('pt-BR')}</>}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                        style={{ color: status.color, background: status.bg }}>
                        {status.label}
                    </span>
                    <button
                        onClick={() => router.push(`/backoffice/campanhas/${id}/editar`)}
                        className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold text-white"
                        style={{ background: T.gold }}>
                        <Edit size={14} /> Editar
                    </button>
                </div>
            </div>

            {/* KPI grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {KPIS.map((kpi, i) => (
                    <div key={i} className="rounded-2xl p-4"
                        style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <p className="text-[10px] mb-1 uppercase tracking-wider" style={{ color: T.textSub }}>{kpi.label}</p>
                        <p className="text-lg font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* Budget progress */}
            {campanha.budget > 0 && (
                <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-sm font-semibold" style={{ color: T.text }}>Orçamento utilizado</p>
                            <p className="text-xs" style={{ color: T.textSub }}>
                                {fmtBRL(campanha.spent)} de {fmtBRL(campanha.budget)} ({progressPct.toFixed(0)}%)
                            </p>
                        </div>
                        <p className="text-sm font-bold" style={{ color: T.text }}>
                            {fmtBRL((campanha.budget || 0) - (campanha.spent || 0))} restante
                        </p>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-all"
                            style={{
                                width: `${progressPct}%`,
                                background: progressPct > 90 ? '#E87C7C' : progressPct > 70 ? '#E8A87C' : T.gold,
                            }} />
                    </div>
                </div>
            )}

            {/* AI Insight Card */}
            <div className="rounded-2xl p-5" style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border-gold)' }}>
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(var(--imi-ai-gold-rgb),0.12)' }}>
                        {aiLoading ? <Loader2 size={13} className="animate-spin" style={{ color: 'var(--imi-ai-gold)' }} /> : <Sparkles size={13} style={{ color: 'var(--imi-ai-gold)' }} />}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--imi-ai-gold)' }}>
                        {aiLoading ? 'Analisando com Claude AI...' : 'AI Campaign Intelligence'}
                    </span>
                </div>
                {aiLoading ? (
                    <p className="text-xs" style={{ color: T.textSub }}>Processando dados da campanha...</p>
                ) : aiAnalysis ? (
                    <>
                        <p className="text-sm mb-3" style={{ color: T.text, lineHeight: 1.65 }}>{aiAnalysis.insight}</p>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            {aiAnalysis.status && (
                                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                    <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: T.textSub }}>Performance</p>
                                    <p className="text-sm font-bold" style={{
                                        color: aiAnalysis.status === 'excelente' ? '#10B981' : aiAnalysis.status === 'bom' ? '#3B82F6' : aiAnalysis.status === 'regular' ? '#F59E0B' : '#EF4444'
                                    }}>{aiAnalysis.status}</p>
                                </div>
                            )}
                            {aiAnalysis.score != null && (
                                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                    <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: T.textSub }}>Eficiência IA</p>
                                    <p className="text-sm font-bold" style={{ color: T.gold }}>{aiAnalysis.score}/100</p>
                                </div>
                            )}
                        </div>
                        {aiAnalysis.nextAction && (
                            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--bo-border)' }}>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: T.textSub }}>Próxima Ação</p>
                                <p className="text-xs font-medium" style={{ color: T.text }}>{aiAnalysis.nextAction}</p>
                            </div>
                        )}
                        {(aiAnalysis.cplAnalysis || aiAnalysis.budgetSuggestion) && (
                            <div className="mt-2 space-y-1.5">
                                {aiAnalysis.cplAnalysis && <p className="text-xs" style={{ color: T.textSub }}>💡 {aiAnalysis.cplAnalysis}</p>}
                                {aiAnalysis.budgetSuggestion && <p className="text-xs" style={{ color: T.textSub }}>💰 {aiAnalysis.budgetSuggestion}</p>}
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-xs" style={{ color: T.textSub }}>Análise IA não disponível para esta campanha.</p>
                )}
            </div>

            {/* UTM info if present */}
            {(campanha.utm_source || campanha.utm_campaign) && (
                <div className="rounded-2xl p-4 flex items-center gap-3"
                    style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <LinkIcon size={14} style={{ color: T.textSub }} />
                    <p className="text-xs" style={{ color: T.textSub }}>
                        {campanha.utm_source && <><span className="font-semibold">UTM Source:</span> {campanha.utm_source} </>}
                        {campanha.utm_campaign && <><span className="font-semibold">· Campaign:</span> {campanha.utm_campaign}</>}
                    </p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-6 border-b" style={{ borderColor: T.border }}>
                {(['overview', 'metricas'] as const).map(tab => (
                    <button key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="pb-3 px-1 text-sm font-medium border-b-2 transition-colors"
                        style={{
                            borderColor: activeTab === tab ? T.gold : 'transparent',
                            color: activeTab === tab ? T.gold : T.textSub,
                        }}>
                        {tab === 'overview' ? 'Visão Geral' : 'Métricas'}
                    </button>
                ))}
            </div>

            {/* Overview tab */}
            {activeTab === 'overview' && (
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Conversion funnel */}
                    <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <h2 className="text-sm font-bold mb-5" style={{ color: T.text }}>Funil de Conversão</h2>
                        <div className="space-y-4">
                            {funnel.map((stage, idx) => {
                                const pct = maxFunnel > 0 ? (stage.count / maxFunnel) * 100 : 0
                                const COLORS = [T.gold, '#7BA3C2', '#A89EC4', '#4CAF7D']
                                return (
                                    <div key={idx}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-medium" style={{ color: T.text }}>{stage.stage}</span>
                                            <span className="text-xs font-bold" style={{ color: T.textSub }}>
                                                {fmtN(stage.count)}
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                            <div className="h-full rounded-full"
                                                style={{ width: `${pct}%`, background: COLORS[idx] }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Campaign info */}
                    <div className="rounded-2xl p-6 space-y-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <h2 className="text-sm font-bold" style={{ color: T.text }}>Detalhes da Campanha</h2>
                        {[
                            { label: 'Canal', value: type.label },
                            { label: 'Status', value: status.label },
                            { label: 'Objetivo', value: campanha.objective || '—' },
                            { label: 'Orçamento diário', value: fmtBRL(campanha.daily_budget) },
                            { label: 'Início', value: campanha.start_date ? new Date(campanha.start_date).toLocaleDateString('pt-BR') : '—' },
                            { label: 'Fim', value: campanha.end_date ? new Date(campanha.end_date).toLocaleDateString('pt-BR') : '—' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-xs" style={{ color: T.textSub }}>{item.label}</span>
                                <span className="text-xs font-semibold" style={{ color: T.text }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Métricas tab */}
            {activeTab === 'metricas' && (
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <h2 className="text-sm font-bold mb-5" style={{ color: T.text }}>Métricas Detalhadas</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {[
                            { label: 'Impressões totais', value: fmtN(campanha.impressions) },
                            { label: 'Cliques totais', value: fmtN(campanha.clicks) },
                            { label: 'CTR (Click-through rate)', value: campanha.ctr != null ? `${Number(campanha.ctr).toFixed(2)}%` : '—' },
                            { label: 'Leads gerados', value: fmtN(campanha.leads) },
                            { label: 'Conversões', value: fmtN(campanha.conversions) },
                            { label: 'CPL (Custo por lead)', value: fmtBRL(campanha.cost_per_lead) },
                            { label: 'ROI', value: campanha.roi != null ? `${Number(campanha.roi).toFixed(0)}%` : '—' },
                            { label: 'Total investido', value: fmtBRL(campanha.spent) },
                            { label: 'Orçamento total', value: fmtBRL(campanha.budget) },
                            { label: 'Taxa de conversão', value: campanha.leads > 0 ? `${((campanha.conversions / campanha.leads) * 100).toFixed(1)}%` : '—' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl"
                                style={{ background: T.elevated }}>
                                <span className="text-xs" style={{ color: T.textSub }}>{item.label}</span>
                                <span className="text-sm font-bold" style={{ color: T.text }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
