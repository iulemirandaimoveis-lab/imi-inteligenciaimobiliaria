'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    MousePointerClick, Link2, QrCode, TrendingUp,
    Loader2, RefreshCw, ExternalLink, BarChart3, Building2,
} from 'lucide-react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader, KPICard } from '@/app/(backoffice)/components/ui'

/* ─── Types ─── */
interface Analytics {
    kpis: {
        totalPageViews: number
        totalSessions: number
        totalClicks: number
        totalLeads: number
        convertedLeads: number
        avgPagesPerSession: number
        avgDurationSeconds: number
        bounceRate: number
        conversionRate: number
        totalTrackedLinks: number
    }
    dailyTimeline: Array<{ day: string; views: number; sessions: number; clicks: number; leads: number }>
    bySource: Array<{ name: string; sessions: number; clicks: number; leads: number; total: number }>
    byDevice: Array<{ name: string; value: number; percentage: number }>
    topPages: Array<{ page: string; views: number; avgDuration: number }>
    topProperties: Array<{ slug: string; views: number }>
    topCampaigns: Array<{ campaign: string; clicks: number; leads: number; conversionRate: number }>
}

type TimeRange = '7d' | '30d' | '90d'

/* ─── Constants ─── */
const CHART_PRIMARY = '#C49D5B'
const CHART_SECONDARY = '#5B9BD5'
const CHART_TERTIARY = '#22C55E'
const CHART_QUATERNARY = '#F59E0B'

const PIE_COLORS = [CHART_PRIMARY, CHART_SECONDARY, CHART_TERTIARY, CHART_QUATERNARY, '#8B5CF6']

const TIME_LABELS: Record<TimeRange, string> = {
    '7d': '7 dias',
    '30d': '30 dias',
    '90d': '90 dias',
}

/* ─── Helpers ─── */
function formatDay(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function formatNumber(n: number): string {
    return n.toLocaleString('pt-BR')
}

/* ─── Custom Tooltip ─── */
function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div
            className="rounded-lg px-3 py-2 shadow-lg"
            style={{ background: T.elevated, border: `1px solid ${T.border}` }}
        >
            <p className="text-[10px] font-semibold mb-1" style={{ color: T.textMuted }}>
                {label}
            </p>
            {payload.map((entry: any, i: number) => (
                <p key={i} className="text-xs font-bold" style={{ color: entry.color }}>
                    {entry.name}: {formatNumber(entry.value)}
                </p>
            ))}
        </div>
    )
}

/* ─── Page ─── */
export default function TrackingDashboardPage() {
    const [timeRange, setTimeRange] = useState<TimeRange>('30d')
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<Analytics | null>(null)
    const [error, setError] = useState(false)

    const load = () => {
        setLoading(true)
        setError(false)
        fetch(`/api/tracking/analytics?time_range=${timeRange}`)
            .then(r => {
                if (!r.ok) throw new Error('fetch failed')
                return r.json()
            })
            .then((d: Analytics) => { setData(d); setLoading(false) })
            .catch(() => { setError(true); setLoading(false) })
    }

    useEffect(() => { load() }, [timeRange])

    /* ─── Derived chart data ─── */
    const timelineData = useMemo(() => {
        if (!data?.dailyTimeline) return []
        return data.dailyTimeline.map(d => ({
            ...d,
            label: formatDay(d.day),
        }))
    }, [data?.dailyTimeline])

    const deviceData = useMemo(() => {
        if (!data?.byDevice) return []
        return data.byDevice.map(d => ({
            name: d.name.charAt(0).toUpperCase() + d.name.slice(1),
            value: d.value,
            percentage: d.percentage,
        }))
    }, [data?.byDevice])

    const campaignData = useMemo(() => {
        if (!data?.topCampaigns) return []
        return data.topCampaigns.slice(0, 8).map(c => ({
            name: c.campaign.length > 20 ? c.campaign.slice(0, 20) + '...' : c.campaign,
            fullName: c.campaign,
            clicks: c.clicks,
            leads: c.leads,
            conversionRate: c.conversionRate,
        }))
    }, [data?.topCampaigns])

    /* ─── Render ─── */
    return (
        <div className="space-y-4 max-w-7xl mx-auto">
            {/* ── Header ── */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <PageIntelHeader
                    moduleLabel="TRACKING · INTELLIGENCE"
                    title="Analytics & Tracking"
                    subtitle="Cliques, QR Codes, campanhas e conversões — inteligência de rastreamento em tempo real"
                    live
                    actions={
                        <div className="flex gap-2">
                            <Link
                                href="/backoffice/tracking/qr"
                                className="h-10 px-4 rounded-[6px] text-xs font-semibold flex items-center gap-2 text-white transition-all hover:opacity-90"
                                style={{ background: T.accent }}
                            >
                                <QrCode size={14} /> Gerar QR Code
                            </Link>
                            <Link
                                href="/backoffice/tracking/links"
                                className="h-10 px-4 rounded-[6px] text-xs font-semibold flex items-center gap-2 transition-all hover:opacity-80"
                                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                            >
                                <Link2 size={14} /> Links
                            </Link>
                        </div>
                    }
                />
            </motion.div>

            {/* ── Time Range + Refresh ── */}
            <div className="flex items-center justify-between">
                <div
                    className="inline-flex rounded-lg overflow-hidden"
                    style={{ border: `1px solid ${T.border}` }}
                >
                    {(['7d', '30d', '90d'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className="h-9 px-4 text-[11px] font-semibold transition-all"
                            style={{
                                background: timeRange === range ? T.accent : T.surface,
                                color: timeRange === range ? '#fff' : T.textMuted,
                                borderRight: range !== '90d' ? `1px solid ${T.border}` : 'none',
                            }}
                        >
                            {TIME_LABELS[range]}
                        </button>
                    ))}
                </div>
                <button
                    onClick={load}
                    className="h-9 w-9 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                    title="Recarregar dados"
                >
                    <RefreshCw size={13} style={{ color: T.textMuted }} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* ── Loading ── */}
            {loading && (
                <div className="flex items-center justify-center h-64">
                    <Loader2 size={28} className="animate-spin" style={{ color: T.accent }} />
                </div>
            )}

            {/* ── Error ── */}
            {!loading && error && (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <BarChart3 size={36} className="opacity-30" style={{ color: T.textMuted }} />
                    <p className="text-sm" style={{ color: T.textMuted }}>Erro ao carregar analytics</p>
                    <button onClick={load} className="text-xs font-semibold px-4 py-2 rounded-[6px]" style={{ color: T.accent }}>
                        Tentar novamente
                    </button>
                </div>
            )}

            {/* ── Dashboard Content ── */}
            {!loading && !error && data && (
                <>
                    {/* ── KPI Grid ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05, duration: 0.35 }}
                        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                    >
                        <KPICard
                            label="Total Cliques"
                            sublabel={TIME_LABELS[timeRange]}
                            value={formatNumber(data.kpis.totalClicks)}
                            icon={<MousePointerClick size={16} />}
                            accent="gold"
                        />
                        <KPICard
                            label="Links Ativos"
                            value={formatNumber(data.kpis.totalTrackedLinks)}
                            icon={<Link2 size={16} />}
                            accent="info"
                        />
                        <KPICard
                            label="Imóvel Top"
                            sublabel={data.topProperties?.[0]?.slug?.replace(/-/g, ' ') || 'Nenhum'}
                            value={data.topProperties?.[0] ? formatNumber(data.topProperties[0].views) + ' views' : '—'}
                            icon={<Building2 size={16} />}
                            accent="warm"
                        />
                        <KPICard
                            label="Taxa de Conversão"
                            sublabel={`${data.kpis.convertedLeads} leads convertidos`}
                            value={`${data.kpis.conversionRate}%`}
                            icon={<TrendingUp size={16} />}
                            accent="success"
                        />
                    </motion.div>

                    {/* ── Charts Row: Area + Pie ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.35 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
                    >
                        {/* Area Chart — Cliques por Dia */}
                        <div
                            className="lg:col-span-2 rounded-lg p-5"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        >
                            <h3 className="text-sm font-bold mb-1" style={{ color: T.text }}>
                                Cliques por Dia
                            </h3>
                            <p className="text-[11px] mb-4" style={{ color: T.textDim }}>
                                Evolução de cliques e sessões no período
                            </p>

                            {timelineData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={240}>
                                    <AreaChart data={timelineData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gradClicks" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={CHART_PRIMARY} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={CHART_PRIMARY} stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gradSessions" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={CHART_SECONDARY} stopOpacity={0.2} />
                                                <stop offset="95%" stopColor={CHART_SECONDARY} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                                            tickLine={false}
                                            axisLine={false}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="clicks"
                                            name="Cliques"
                                            stroke={CHART_PRIMARY}
                                            strokeWidth={2}
                                            fill="url(#gradClicks)"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="sessions"
                                            name="Sessões"
                                            stroke={CHART_SECONDARY}
                                            strokeWidth={1.5}
                                            fill="url(#gradSessions)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[240px]">
                                    <p className="text-xs" style={{ color: T.textMuted }}>Sem dados no período</p>
                                </div>
                            )}
                        </div>

                        {/* Pie Chart — Por Dispositivo */}
                        <div
                            className="rounded-lg p-5"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        >
                            <h3 className="text-sm font-bold mb-1" style={{ color: T.text }}>
                                Por Dispositivo
                            </h3>
                            <p className="text-[11px] mb-4" style={{ color: T.textDim }}>
                                Distribuição de sessões
                            </p>

                            {deviceData.length > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <PieChart>
                                            <Pie
                                                data={deviceData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={75}
                                                paddingAngle={3}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {deviceData.map((_, i) => (
                                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<ChartTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>

                                    {/* Legend */}
                                    <div className="space-y-2 mt-2">
                                        {deviceData.map((d, i) => (
                                            <div key={d.name} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                                                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                                                    />
                                                    <span className="text-xs font-medium" style={{ color: T.text }}>
                                                        {d.name}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-bold" style={{ color: T.textMuted }}>
                                                    {d.percentage}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-[180px]">
                                    <p className="text-xs" style={{ color: T.textMuted }}>Sem dados</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* ── Bar Chart — Top Campanhas ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.35 }}
                        className="rounded-lg p-5"
                        style={{ background: T.surface, border: `1px solid ${T.border}` }}
                    >
                        <h3 className="text-sm font-bold mb-1" style={{ color: T.text }}>
                            Top Campanhas
                        </h3>
                        <p className="text-[11px] mb-4" style={{ color: T.textDim }}>
                            Cliques e leads por campanha UTM
                        </p>

                        {campaignData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={Math.max(200, campaignData.length * 40)}>
                                <BarChart
                                    data={campaignData}
                                    layout="vertical"
                                    margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={140}
                                        tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="clicks" name="Cliques" fill={CHART_PRIMARY} radius={[0, 4, 4, 0]} barSize={16} />
                                    <Bar dataKey="leads" name="Leads" fill={CHART_TERTIARY} radius={[0, 4, 4, 0]} barSize={16} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[200px]">
                                <p className="text-xs" style={{ color: T.textMuted }}>Nenhuma campanha no período</p>
                            </div>
                        )}
                    </motion.div>

                    {/* ── Table — Links Recentes ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.35 }}
                        className="rounded-lg p-5"
                        style={{ background: T.surface, border: `1px solid ${T.border}` }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-bold" style={{ color: T.text }}>
                                    Links Recentes
                                </h3>
                                <p className="text-[11px] mt-0.5" style={{ color: T.textDim }}>
                                    Campanhas com maior engajamento
                                </p>
                            </div>
                            <Link
                                href="/backoffice/tracking/links"
                                className="text-[11px] font-semibold flex items-center gap-1 transition-all hover:opacity-80"
                                style={{ color: T.accent }}
                            >
                                Ver todos <ExternalLink size={11} />
                            </Link>
                        </div>

                        <div className="overflow-x-auto -mx-5 px-5">
                            <table className="w-full min-w-[600px]">
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                        {['Campanha', 'Cliques', 'Leads', 'Conversão', 'Ações'].map(col => (
                                            <th
                                                key={col}
                                                className={`py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider ${col === 'Ações' ? 'text-right' : col === 'Campanha' ? 'text-left' : 'text-center'}`}
                                                style={{ color: T.textMuted }}
                                            >
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.topCampaigns.length > 0 ? data.topCampaigns.map((c, i) => (
                                        <tr
                                            key={i}
                                            className="transition-colors"
                                            style={{ borderBottom: `1px solid ${T.border}` }}
                                            onMouseEnter={e => { e.currentTarget.style.background = T.hover }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                                        >
                                            <td className="py-3 px-3">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                                                        style={{ background: T.accentBg }}
                                                    >
                                                        <Link2 size={12} style={{ color: T.accent }} />
                                                    </div>
                                                    <span className="text-xs font-semibold truncate max-w-[200px]" style={{ color: T.text }}>
                                                        {c.campaign}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <span className="text-xs font-bold" style={{ color: T.text }}>
                                                    {formatNumber(c.clicks)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <span className="text-xs" style={{ color: T.textMuted }}>
                                                    {formatNumber(c.leads)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <span
                                                    className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold"
                                                    style={{
                                                        background: c.conversionRate >= 5 ? T.successBg : T.accentBg,
                                                        color: c.conversionRate >= 5 ? T.success : T.accent,
                                                    }}
                                                >
                                                    {c.conversionRate}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-right">
                                                <Link
                                                    href={`/backoffice/tracking/${encodeURIComponent(c.campaign)}`}
                                                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-md transition-all hover:opacity-80"
                                                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}
                                                >
                                                    Detalhes <ExternalLink size={10} />
                                                </Link>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-10 text-center text-xs" style={{ color: T.textMuted }}>
                                                Nenhum link rastreado no período
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    )
}
