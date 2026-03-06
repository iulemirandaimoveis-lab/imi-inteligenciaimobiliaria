'use client'

import { useState, useEffect } from 'react'
import {
    TrendingUp, TrendingDown, BarChart3, Target,
    DollarSign, Users, MousePointerClick, ArrowUpRight,
    Calendar, Filter, ExternalLink, Zap
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
}

const CHANNELS = ['All Channels', 'Meta Ads', 'Google Ads', 'LinkedIn', 'WhatsApp']

const MOCK_CAMPAIGNS = [
    {
        id: 1,
        name: 'Luxury Penthouse – Lead Gen',
        property: 'Property: Residential Horizon',
        status: 'ACTIVE',
        statusColor: '#22C55E',
        statusBg: 'rgba(34,197,94,0.12)',
        leads: 142,
        cpl: 'R$ 18,20',
        cplColor: '#22C55E',
        ctr: '1.42%',
        spend: 'R$ 2.5k',
    },
    {
        id: 2,
        name: 'Search: Prime Location Houses',
        property: 'Property: Green Valley Estate',
        status: 'LEARNING',
        statusColor: '#F59E0B',
        statusBg: 'rgba(245,158,11,0.12)',
        leads: 68,
        cpl: 'R$ 42,50',
        cplColor: '#F87171',
        ctr: '8.12%',
        spend: 'R$ 2.8k',
    },
    {
        id: 3,
        name: 'Retargeting: High Net Worth',
        property: 'Property: Multi-Asset',
        status: 'PAUSED',
        statusColor: '#6B7280',
        statusBg: 'rgba(107,114,128,0.12)',
        leads: 12,
        cpl: 'R$ 15,10',
        cplColor: '#22C55E',
        ctr: '0.92%',
        spend: 'R$ 18k',
    },
]

// SVG bar chart data (Oct 01 – Oct 30)
const BAR_DATA = [18, 24, 15, 32, 28, 42, 35, 19, 26, 38, 41, 33, 27, 45, 38, 29, 36, 44, 42, 38, 27, 31, 40, 35, 29, 42, 38, 33, 30, 37]
const BAR_LABELS = ['OCT 01', '', '', '', 'OCT 15', '', '', '', '', 'OCT 30']

function BarChart() {
    const maxVal = Math.max(...BAR_DATA)
    const W = 280
    const H = 80
    const barW = W / BAR_DATA.length - 2
    const peakIdx = BAR_DATA.indexOf(maxVal)

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <svg
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                style={{ width: '100%', height: 80 }}
            >
                {BAR_DATA.map((v, i) => {
                    const barH = (v / maxVal) * (H - 10)
                    const x = i * (W / BAR_DATA.length)
                    const isPeak = i === peakIdx
                    return (
                        <g key={i}>
                            <rect
                                x={x + 1}
                                y={H - barH}
                                width={barW}
                                height={barH}
                                rx={3}
                                fill={isPeak ? '#3B82F6' : 'rgba(59,130,246,0.25)'}
                            />
                            {isPeak && (
                                <>
                                    <rect
                                        x={x - 8}
                                        y={H - barH - 20}
                                        width={26}
                                        height={16}
                                        rx={4}
                                        fill="#3B82F6"
                                    />
                                    <text x={x + 5} y={H - barH - 8} textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff">
                                        {v}
                                    </text>
                                </>
                            )}
                        </g>
                    )
                })}
            </svg>
            {/* X axis labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                {['OCT 01', 'OCT 15', 'OCT 30'].map(l => (
                    <span key={l} style={{ fontSize: 9, color: T.textMuted, fontWeight: 600 }}>{l}</span>
                ))}
            </div>
        </div>
    )
}

export default function AdsPerformancePage() {
    const [channel, setChannel] = useState('All Channels')
    const [totalLeads, setTotalLeads] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.from('leads').select('id', { count: 'exact', head: true }).then(({ count }) => {
            setTotalLeads(count || 0)
            setLoading(false)
        })
    }, [])

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
                    { label: 'Total Spend', value: 'R$ 12.550', trend: '+5.2%', up: true },
                    { label: 'Total Leads', value: loading ? '...' : String(totalLeads || 450), trend: '+12%', up: true },
                    { label: 'Avg. CPL', value: 'R$ 27,9', trend: '-2.1%', up: false },
                ].map((kpi, i) => (
                    <div key={kpi.label} style={{
                        padding: '14px 14px', borderRadius: 16,
                        background: i === 0 ? 'rgba(59,130,246,0.1)' : i === 1 ? 'rgba(59,130,246,0.1)' : T.elevated,
                        border: `1px solid ${i < 2 ? 'rgba(59,130,246,0.25)' : T.border}`,
                    }}>
                        <p style={{ fontSize: 9, fontWeight: 700, color: i < 2 ? 'rgba(147,197,253,0.7)' : T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                            {kpi.label}
                        </p>
                        <p style={{ fontSize: 18, fontWeight: 800, color: i < 2 ? '#fff' : T.text, letterSpacing: '-0.5px', marginBottom: 4 }}>
                            {kpi.value}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {kpi.up ? <TrendingUp size={11} style={{ color: '#4ade80' }} /> : <TrendingDown size={11} style={{ color: '#f87171' }} />}
                            <span style={{ fontSize: 10, fontWeight: 700, color: kpi.up ? '#4ade80' : '#f87171' }}>{kpi.trend}</span>
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Leads Trend Chart */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ borderRadius: 20, padding: '18px 18px 14px', background: T.elevated, border: `1px solid ${T.border}`, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Leads Trend</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} />
                            <span style={{ fontSize: 9, color: T.textMuted, fontWeight: 600 }}>LEADS</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(107,114,128,0.4)' }} />
                            <span style={{ fontSize: 9, color: T.textMuted, fontWeight: 600 }}>SPEND</span>
                        </div>
                    </div>
                </div>
                <BarChart />
            </motion.div>

            {/* Channel Tabs */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                style={{ marginBottom: 20, overflowX: 'auto', scrollbarWidth: 'none' }}>
                <div style={{ display: 'flex', gap: 6, paddingBottom: 4 }}>
                    {CHANNELS.map(ch => (
                        <button
                            key={ch}
                            onClick={() => setChannel(ch)}
                            style={{
                                padding: '8px 16px', borderRadius: 20, whiteSpace: 'nowrap',
                                fontSize: 12, fontWeight: 700,
                                background: channel === ch ? '#3B82F6' : T.elevated,
                                border: `1px solid ${channel === ch ? '#3B82F6' : T.border}`,
                                color: channel === ch ? '#fff' : T.textMuted,
                                cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                            }}
                        >
                            {ch}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Active Campaigns */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Active Campaigns</p>
                    <Link href="/backoffice/campanhas" style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6', textDecoration: 'none' }}>
                        View Reports
                    </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {MOCK_CAMPAIGNS.map((c, i) => (
                        <motion.div
                            key={c.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.06 }}
                            style={{ borderRadius: 18, padding: '16px', background: T.elevated, border: `1px solid ${T.border}` }}
                        >
                            {/* Campaign header */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 14, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {c.name}
                                    </p>
                                    <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{c.property}</p>
                                </div>
                                <span style={{
                                    padding: '4px 10px', borderRadius: 8,
                                    fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                                    color: c.statusColor, background: c.statusBg, flexShrink: 0, marginLeft: 8,
                                }}>
                                    {c.status}
                                </span>
                            </div>

                            {/* Stats grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
                                {[
                                    { label: 'LEADS', value: String(c.leads), color: T.text },
                                    { label: 'CPL', value: c.cpl, color: c.cplColor },
                                    { label: 'CTR', value: c.ctr, color: T.text },
                                    { label: 'SPEND', value: c.spend, color: T.text },
                                ].map(stat => (
                                    <div key={stat.label}>
                                        <p style={{ fontSize: 8, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                                            {stat.label}
                                        </p>
                                        <p style={{ fontSize: 14, fontWeight: 700, color: stat.color }}>
                                            {stat.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* New campaign CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    style={{ marginTop: 16 }}
                >
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
