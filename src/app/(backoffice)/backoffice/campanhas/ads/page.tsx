'use client'

import { useState, useEffect } from 'react'
import {
    TrendingUp, TrendingDown, BarChart3, Target,
    DollarSign, Users, MousePointerClick, ArrowUpRight,
    Zap, Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    active:   { label: 'ATIVO',    color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
    paused:   { label: 'PAUSADO',  color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
    ended:    { label: 'ENCERRADO',color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    draft:    { label: 'RASCUNHO', color: '#818CF8', bg: 'rgba(129,140,248,0.12)' },
    learning: { label: 'LEARNING', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
}

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
        <div style={{ maxWidth: 640, paddingBottom: 48 }}>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BarChart3 size={20} style={{ color: '#3B82F6' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: '-0.3px' }}>Ads Performance</h1>
                        <p style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>IMI Intelligence OS</p>
                    </div>
                </div>
            </motion.div>

            {/* KPI Cards */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
                {[
                    { label: 'Total Gasto', value: loading ? '...' : fmtBRL(totalSpent) },
                    { label: 'Total Leads', value: loading ? '...' : totalLeads.toLocaleString('pt-BR') },
                    { label: 'CPL Médio', value: loading ? '...' : fmtBRL(avgCPL) },
                ].map((kpi, i) => (
                    <div key={kpi.label} style={{
                        padding: '14px 14px', borderRadius: 16,
                        background: i < 2 ? 'rgba(59,130,246,0.1)' : T.elevated,
                        border: `1px solid ${i < 2 ? 'rgba(59,130,246,0.25)' : T.border}`,
                    }}>
                        <p style={{ fontSize: 9, fontWeight: 700, color: i < 2 ? 'rgba(147,197,253,0.7)' : T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                            {kpi.label}
                        </p>
                        <p style={{ fontSize: 18, fontWeight: 800, color: i < 2 ? '#fff' : T.text, letterSpacing: '-0.5px' }}>
                            {kpi.value}
                        </p>
                    </div>
                ))}
            </motion.div>

            {/* Leads Trend Chart — 30 dias reais */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ borderRadius: 20, padding: '18px 18px 14px', background: T.elevated, border: `1px solid ${T.border}`, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Leads — Últimos 30 dias</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} />
                        <span style={{ fontSize: 9, color: T.textMuted, fontWeight: 600 }}>LEADS</span>
                    </div>
                </div>
                {loading ? (
                    <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader2 size={20} className="animate-spin" style={{ color: T.textMuted }} />
                    </div>
                ) : (
                    <LeadsBarChart data={leadsChart} />
                )}
            </motion.div>

            {/* Channel Tabs */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                style={{ marginBottom: 20, overflowX: 'auto', scrollbarWidth: 'none' }}>
                <div style={{ display: 'flex', gap: 6, paddingBottom: 4 }}>
                    {CHANNELS.map(ch => (
                        <button key={ch} onClick={() => setChannel(ch)}
                            style={{
                                padding: '8px 16px', borderRadius: 20, whiteSpace: 'nowrap',
                                fontSize: 12, fontWeight: 700,
                                background: channel === ch ? '#3B82F6' : T.elevated,
                                border: `1px solid ${channel === ch ? '#3B82F6' : T.border}`,
                                color: channel === ch ? '#fff' : T.textMuted,
                                cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                            }}>
                            {ch}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Active Campaigns */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
                        Campanhas {filtered.length > 0 ? `(${filtered.length})` : ''}
                    </p>
                    <Link href="/backoffice/campanhas" style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6', textDecoration: 'none' }}>
                        Ver relatórios →
                    </Link>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[1, 2].map(i => (
                            <div key={i} style={{ height: 100, borderRadius: 18, background: T.elevated, border: `1px solid ${T.border}`, opacity: 0.5 }} />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', borderRadius: 18, background: T.elevated, border: `1px solid ${T.border}` }}>
                        <BarChart3 size={32} style={{ color: T.textMuted, opacity: 0.3, margin: '0 auto 8px' }} />
                        <p style={{ fontSize: 13, color: T.textMuted }}>Nenhuma campanha encontrada</p>
                        <p style={{ fontSize: 12, color: T.textMuted, marginTop: 4, opacity: 0.7 }}>Crie a primeira campanha para ver métricas</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {filtered.map((c, i) => {
                            const st = STATUS_MAP[c.status] || STATUS_MAP.draft
                            return (
                                <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + i * 0.06 }}
                                    style={{ borderRadius: 18, padding: '16px', background: T.elevated, border: `1px solid ${T.border}` }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 14, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {c.name}
                                            </p>
                                            <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                                                {c.channel || 'Canal não definido'}
                                                {c.objective ? ` · ${c.objective}` : ''}
                                            </p>
                                        </div>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: 8, fontSize: 9, fontWeight: 800,
                                            textTransform: 'uppercase', letterSpacing: '0.08em',
                                            color: st.color, background: st.bg, flexShrink: 0, marginLeft: 8,
                                        }}>{st.label}</span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
                                        {[
                                            { label: 'LEADS META', value: c.expected_leads ? String(c.expected_leads) : '—' },
                                            { label: 'CPL', value: c.cost_per_lead ? fmtBRL(Number(c.cost_per_lead)) : '—' },
                                            { label: 'GASTO', value: c.spent ? fmtBRL(Number(c.spent)) : '—' },
                                            { label: 'BUDGET', value: c.budget ? fmtBRL(Number(c.budget)) : '—' },
                                        ].map(stat => (
                                            <div key={stat.label}>
                                                <p style={{ fontSize: 8, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                                                    {stat.label}
                                                </p>
                                                <p style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                                                    {stat.value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <Link href={`/backoffice/campanhas/${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: 11, fontWeight: 700, color: '#3B82F6', textDecoration: 'none' }}>
                                        Ver detalhes <ArrowUpRight size={12} />
                                    </Link>
                                </motion.div>
                            )
                        })}
                    </div>
                )}

                {/* New campaign CTA */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ marginTop: 16 }}>
                    <Link href="/backoffice/campanhas/nova" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        height: 52, borderRadius: 16,
                        background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                        color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
                        boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
                    }}>
                        <Zap size={18} />
                        Nova Campanha
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    )
}
