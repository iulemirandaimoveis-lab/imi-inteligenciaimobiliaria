'use client'

import { useState, useEffect } from 'react'
import {
    TrendingUp, TrendingDown, BarChart3, Target,
    DollarSign, Users, MousePointerClick, ArrowUpRight,
    Zap, Loader2, Plus,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { T } from '@/app/(backoffice)/lib/theme'
import { getStatusConfig } from '@/app/(backoffice)/lib/constants'
import { PageIntelHeader, KPICard, StatusBadge } from '@/app/(backoffice)/components/ui'

const STATUS_MAP = Object.fromEntries(
    Object.entries({ active: 'ATIVO', paused: 'PAUSADO', ended: 'ENCERRADO', draft: 'RASCUNHO', learning: 'LEARNING' }).map(([key, label]) => {
        const cfg = getStatusConfig(key)
        return [key, { label, color: cfg.dot, bg: `${cfg.dot}1f` }]
    })
) as Record<string, { label: string; color: string; bg: string }>

const CHANNELS = ['Todos', 'Meta Ads', 'Google Ads', 'LinkedIn', 'WhatsApp']

const fmtBRL = (v: number | null) => {
    if (!v) return '—'
    if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1).replace('.', ',')}M`
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(1).replace('.', ',')}k`
    return `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`
}

function LeadsBarChart({ data }: { data: number[] }) {
    if (!data.length) return null
    const maxVal = Math.max(...data, 1)
    const W = 280
    const H = 80
    const barW = W / data.length - 2
    const peakIdx = data.indexOf(maxVal)

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 80 }}>
                {data.map((v, i) => {
                    const barH = (v / maxVal) * (H - 10)
                    const x = i * (W / data.length)
                    const isPeak = i === peakIdx
                    return (
                        <g key={i}>
                            <rect x={x + 1} y={H - barH} width={barW} height={barH} rx={3}
                                fill={isPeak ? '#3B82F6' : 'rgba(59,130,246,0.25)'} />
                            {isPeak && (
                                <>
                                    <rect x={x - 8} y={H - barH - 20} width={26} height={16} rx={4} fill="#3B82F6" />
                                    <text x={x + 5} y={H - barH - 8} textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff">{v}</text>
                                </>
                            )}
                        </g>
                    )
                })}
            </svg>
        </div>
    )
}

export default function AdsPerformancePage() {
    const [channel, setChannel] = useState('Todos')
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [totalLeads, setTotalLeads] = useState(0)
    const [totalSpent, setTotalSpent] = useState(0)
    const [avgCPL, setAvgCPL] = useState(0)
    const [leadsChart, setLeadsChart] = useState<number[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const supabase = createClient()
        const since30 = new Date()
        since30.setDate(since30.getDate() - 30)

        Promise.all([
            supabase
                .from('campaigns')
                .select('id, name, channel, status, budget, spent, cost_per_lead, expected_leads, objective, start_date, end_date')
                .neq('status', 'archived')
                .order('created_at', { ascending: false }),
            supabase
                .from('leads')
                .select('id', { count: 'exact', head: true }),
            supabase
                .from('leads')
                .select('created_at')
                .gte('created_at', since30.toISOString())
                .order('created_at', { ascending: true }),
        ]).then(([{ data: cmpns }, { count: leadCount }, { data: recentLeads }]) => {
            const cList = cmpns || []
            setCampaigns(cList)
            setTotalLeads(leadCount || 0)

            const spent = cList.reduce((s, c) => s + Number(c.spent || 0), 0)
            setTotalSpent(spent)

            const cpls = cList.filter(c => c.cost_per_lead > 0).map(c => Number(c.cost_per_lead))
            setAvgCPL(cpls.length > 0 ? cpls.reduce((s, v) => s + v, 0) / cpls.length : 0)

            // Build 30-day leads chart
            const buckets: Record<string, number> = {}
            for (let i = 29; i >= 0; i--) {
                const d = new Date()
                d.setDate(d.getDate() - i)
                buckets[d.toISOString().split('T')[0]] = 0
            }
            for (const l of recentLeads || []) {
                const day = l.created_at.split('T')[0]
                if (day in buckets) buckets[day]++
            }
            setLeadsChart(Object.values(buckets))
            setLoading(false)
        })
    }, [])

    const filtered = campaigns.filter(c => {
        if (channel === 'Todos') return true
        return (c.channel || '').toLowerCase().includes(channel.split(' ')[0].toLowerCase())
    })

    return (
        <div className="space-y-5 pb-12">

            {/* Header */}
            <PageIntelHeader
                moduleLabel="ADS PERFORMANCE"
                title="Ads Performance"
                subtitle="Monitoramento em tempo real de campanhas pagas e orgânicas"
                actions={
                    <Link
                        href="/backoffice/campanhas/nova"
                        className="bo-btn bo-btn-primary"
                        style={{ background: 'var(--bo-accent)' }}
                    >
                        <Plus size={14} /> Nova Campanha
                    </Link>
                }
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <KPICard label="Total Gasto"  value={loading ? '—' : fmtBRL(totalSpent)}                      icon={<DollarSign size={14} />} accent="blue" size="sm" />
                <KPICard label="Total Leads"  value={loading ? '—' : totalLeads.toLocaleString('pt-BR')}      icon={<Users size={14} />}      accent="green" size="sm" />
                <KPICard label="CPL Médio"    value={loading ? '—' : fmtBRL(avgCPL)}                          icon={<MousePointerClick size={14} />} size="sm" />
            </div>

            {/* Leads Trend Chart — 30 dias reais */}
            <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="rounded-2xl p-5"
                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
            >
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold" style={{ color: T.text }}>Leads — Últimos 30 dias</p>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#3B82F6' }} />
                        <span className="text-[9px] font-semibold uppercase" style={{ color: T.textMuted }}>Leads</span>
                    </div>
                </div>
                {loading ? (
                    <div className="h-20 flex items-center justify-center">
                        <Loader2 size={20} className="animate-spin" style={{ color: T.textMuted }} />
                    </div>
                ) : (
                    <LeadsBarChart data={leadsChart} />
                )}
            </motion.div>

            {/* Channel Tabs */}
            <div className="chip-scroll-row">
                {CHANNELS.map(ch => (
                    <button
                        key={ch}
                        onClick={() => setChannel(ch)}
                        className="flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all"
                        style={{
                            background: channel === ch ? T.accent : T.elevated,
                            border: `1px solid ${channel === ch ? T.accent : T.border}`,
                            color: channel === ch ? '#fff' : T.textMuted,
                        }}
                    >
                        {ch}
                    </button>
                ))}
            </div>

            {/* Active Campaigns */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold" style={{ color: T.text }}>
                        Campanhas {filtered.length > 0 ? `(${filtered.length})` : ''}
                    </p>
                    <Link href="/backoffice/campanhas" className="text-[11px] font-semibold" style={{ color: T.accent }}>
                        Ver relatórios →
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-2.5">
                        {[1, 2].map(i => (
                            <div key={i} className="animate-pulse rounded-2xl h-24" style={{ background: T.elevated, border: `1px solid ${T.border}` }} />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-10 rounded-2xl" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        <BarChart3 size={32} className="mx-auto mb-2" style={{ color: T.textMuted, opacity: 0.3 }} />
                        <p className="text-sm" style={{ color: T.textMuted }}>Nenhuma campanha encontrada</p>
                        <p className="text-xs mt-1 opacity-70" style={{ color: T.textMuted }}>Crie a primeira campanha para ver métricas</p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {filtered.map((c, i) => {
                            const st = STATUS_MAP[c.status] || STATUS_MAP.draft
                            return (
                                <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + i * 0.06 }}
                                    className="rounded-2xl p-4"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}`, borderLeft: `3px solid ${st.color}` }}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate" style={{ color: T.text }}>{c.name}</p>
                                            <p className="text-[11px] mt-0.5" style={{ color: T.textMuted }}>
                                                {c.channel || 'Canal não definido'}
                                                {c.objective ? ` · ${c.objective}` : ''}
                                            </p>
                                        </div>
                                        <span
                                            className="flex-shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase"
                                            style={{ color: st.color, background: st.bg }}
                                        >
                                            {st.label}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { label: 'META', value: c.expected_leads ? String(c.expected_leads) : '—' },
                                            { label: 'CPL', value: c.cost_per_lead ? fmtBRL(Number(c.cost_per_lead)) : '—' },
                                            { label: 'GASTO', value: c.spent ? fmtBRL(Number(c.spent)) : '—' },
                                            { label: 'BUDGET', value: c.budget ? fmtBRL(Number(c.budget)) : '—' },
                                        ].map(stat => (
                                            <div key={stat.label}>
                                                <p className="text-[8px] font-bold uppercase tracking-wider mb-0.5" style={{ color: T.textMuted }}>{stat.label}</p>
                                                <p className="text-sm font-bold font-mono" style={{ color: T.text }}>{stat.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <Link
                                        href={`/backoffice/campanhas/${c.id}`}
                                        className="inline-flex items-center gap-1 mt-3 text-[11px] font-bold"
                                        style={{ color: T.accent }}
                                    >
                                        Ver detalhes <ArrowUpRight size={11} />
                                    </Link>
                                </motion.div>
                            )
                        })}
                    </div>
                )}

                {/* New campaign CTA */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-4">
                    <Link
                        href="/backoffice/campanhas/nova"
                        className="flex items-center justify-center gap-2 h-13 rounded-2xl text-sm font-bold text-white"
                        style={{ background: 'var(--bo-accent)', boxShadow: '0 4px 20px rgba(59,130,246,0.3)', height: 52 }}
                    >
                        <Zap size={16} />
                        Nova Campanha
                    </Link>
                </motion.div>
            </div>
        </div>
    )
}
