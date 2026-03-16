'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    TrendingUp, Users, DollarSign, Target, Loader2, Brain,
    Award, AlertTriangle, Lightbulb, RefreshCw,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'

interface MemberPerf {
    id: string
    name: string
    role: string
    leads: number
    sales: number
    revenue: number
    conversion_rate: number
    pct_leads: number | null
    pct_vendas: number | null
    pct_receita: number | null
}

interface TeamTotals {
    totalLeads: number
    totalSales: number
    totalRevenue: number
    avgConversion: number
    memberCount: number
}

interface AIInsights {
    overall_health: string
    top_performer: { name: string; highlight: string }
    needs_attention: { name: string; issue: string; suggestion: string }[]
    team_insights: string[]
    coaching_tips: string[]
}

function fmtCurrency(v: number) {
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
    if (v >= 1_000) return `R$ ${Math.floor(v / 1_000)}k`
    return `R$ ${v.toLocaleString('pt-BR')}`
}

function ProgressBar({ pct, color }: { pct: number | null; color: string }) {
    if (pct === null) return <span className="text-[10px]" style={{ color: T.textDim }}>Sem meta</span>
    const clamped = Math.min(pct, 100)
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full" style={{ background: T.elevated }}>
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${clamped}%` }}
                    transition={{ duration: 0.6 }}
                />
            </div>
            <span className="text-[10px] font-bold w-8 text-right" style={{ color: pct >= 100 ? 'var(--bo-success)' : T.text }}>
                {pct}%
            </span>
        </div>
    )
}

export default function PerformanceDashboard() {
    const [loading, setLoading] = useState(true)
    const [performance, setPerformance] = useState<MemberPerf[]>([])
    const [totals, setTotals] = useState<TeamTotals | null>(null)
    const [aiInsights, setAiInsights] = useState<AIInsights | null>(null)
    const [aiLoading, setAiLoading] = useState(false)

    const fetchPerformance = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/equipe/performance')
            if (res.ok) {
                const data = await res.json()
                setPerformance(data.performance || [])
                setTotals(data.team_totals || null)
            }
        } catch { /* ignore */ }
        setLoading(false)
    }, [])

    const fetchAiInsights = useCallback(async () => {
        if (!performance.length || !totals) return
        setAiLoading(true)
        try {
            const res = await fetch('/api/ai/team-insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ performance, team_totals: totals }),
            })
            if (res.ok) {
                const data = await res.json()
                setAiInsights(data.insights)
            }
        } catch { /* ignore */ }
        setAiLoading(false)
    }, [performance, totals])

    useEffect(() => { fetchPerformance() }, [fetchPerformance])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin" style={{ color: T.accent }} />
            </div>
        )
    }

    if (!performance.length) {
        return (
            <div className="text-center py-16" style={{ color: T.textMuted }}>
                <Users size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Sem dados de performance disponíveis</p>
            </div>
        )
    }

    const healthColor = aiInsights?.overall_health === 'boa'
        ? 'var(--bo-success)'
        : aiInsights?.overall_health === 'preocupante' ? 'var(--bo-error)' : 'var(--bo-warning)'

    return (
        <div className="space-y-6" data-tour="performance">
            {/* Team KPIs */}
            {totals && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { icon: Users, label: 'Leads Totais', value: totals.totalLeads, color: T.accent },
                        { icon: Target, label: 'Vendas Totais', value: totals.totalSales, color: 'var(--bo-success)' },
                        { icon: DollarSign, label: 'Receita Total', value: fmtCurrency(totals.totalRevenue), color: 'var(--bo-warning)' },
                        { icon: TrendingUp, label: 'Taxa Conversão', value: `${totals.avgConversion}%`, color: T.accent },
                    ].map((kpi, i) => (
                        <div key={i} className="rounded-2xl p-4" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <div className="flex items-center gap-1.5 mb-2">
                                <kpi.icon size={12} style={{ color: kpi.color }} />
                                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>{kpi.label}</span>
                            </div>
                            <p className="text-xl font-bold" style={{ color: T.text }}>{kpi.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* AI Insights Button + Panel */}
            <div className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid rgba(59,130,246,0.2)` }}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Brain size={14} style={{ color: T.accent }} />
                        <span className="text-xs font-bold" style={{ color: T.text }}>Insights IA da Equipe</span>
                    </div>
                    <button
                        onClick={fetchAiInsights}
                        disabled={aiLoading}
                        className="text-[10px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all hover:brightness-110"
                        style={{ background: T.accent, color: '#fff' }}
                    >
                        {aiLoading ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                        {aiInsights ? 'Atualizar' : 'Gerar Insights'}
                    </button>
                </div>

                {aiInsights && (
                    <div className="space-y-3 mt-2">
                        {/* Health */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase" style={{ color: T.textMuted }}>Saúde:</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: healthColor, background: `${healthColor}15` }}>
                                {aiInsights.overall_health}
                            </span>
                        </div>

                        {/* Top performer */}
                        {aiInsights.top_performer && (
                            <div className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'rgba(74,222,128,0.06)' }}>
                                <Award size={12} className="mt-0.5" style={{ color: 'var(--bo-success)' }} />
                                <div>
                                    <span className="text-xs font-bold" style={{ color: T.text }}>{aiInsights.top_performer.name}</span>
                                    <p className="text-[10px]" style={{ color: T.textMuted }}>{aiInsights.top_performer.highlight}</p>
                                </div>
                            </div>
                        )}

                        {/* Needs attention */}
                        {aiInsights.needs_attention?.map((item, i) => (
                            <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'rgba(234,179,8,0.06)' }}>
                                <AlertTriangle size={12} className="mt-0.5" style={{ color: 'var(--bo-warning)' }} />
                                <div>
                                    <span className="text-xs font-bold" style={{ color: T.text }}>{item.name}: </span>
                                    <span className="text-[10px]" style={{ color: T.textMuted }}>{item.issue}</span>
                                    <p className="text-[10px] mt-0.5" style={{ color: T.accent }}>→ {item.suggestion}</p>
                                </div>
                            </div>
                        ))}

                        {/* Insights */}
                        {aiInsights.team_insights?.map((insight, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <Lightbulb size={11} className="mt-0.5" style={{ color: T.accent }} />
                                <span className="text-[11px]" style={{ color: T.textMuted }}>{insight}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Leaderboard */}
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                <div className="px-4 py-3" style={{ background: T.elevated }}>
                    <span className="text-xs font-bold" style={{ color: T.text }}>Ranking de Performance</span>
                </div>
                <div className="divide-y" style={{ borderColor: T.border }}>
                    {performance.map((m, i) => (
                        <div
                            key={m.id}
                            className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/[0.02]"
                        >
                            {/* Rank */}
                            <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{
                                    background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : T.elevated,
                                    color: i < 3 ? '#000' : T.textMuted,
                                }}
                            >
                                {i + 1}
                            </div>

                            {/* Name */}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate" style={{ color: T.text }}>{m.name}</p>
                                <p className="text-[10px]" style={{ color: T.textMuted }}>{m.role}</p>
                            </div>

                            {/* Metrics */}
                            <div className="hidden sm:grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-[9px] uppercase tracking-wider" style={{ color: T.textDim }}>Leads</p>
                                    <p className="text-xs font-bold" style={{ color: T.text }}>{m.leads}</p>
                                    <ProgressBar pct={m.pct_leads} color={T.accent} />
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase tracking-wider" style={{ color: T.textDim }}>Vendas</p>
                                    <p className="text-xs font-bold" style={{ color: T.text }}>{m.sales}</p>
                                    <ProgressBar pct={m.pct_vendas} color="var(--bo-success)" />
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase tracking-wider" style={{ color: T.textDim }}>Receita</p>
                                    <p className="text-xs font-bold" style={{ color: T.text }}>{fmtCurrency(m.revenue)}</p>
                                    <ProgressBar pct={m.pct_receita} color="var(--bo-warning)" />
                                </div>
                            </div>

                            {/* Conversion rate */}
                            <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold" style={{ color: m.conversion_rate >= 30 ? 'var(--bo-success)' : T.text }}>
                                    {m.conversion_rate}%
                                </p>
                                <p className="text-[9px]" style={{ color: T.textDim }}>conversão</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
