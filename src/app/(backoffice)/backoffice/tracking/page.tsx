'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    MousePointerClick, Link2, QrCode, TrendingUp,
    Loader2, RefreshCw, ExternalLink, BarChart3, Building2,
    MapPin, Monitor, Smartphone, Tablet, Globe, Clock,
    Zap, ArrowRight, Users, Download, Calendar, Flame,
    Eye, FileText, Target, Activity,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
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
    byLocation: Array<{ city: string; clicks: number }>
    topPages: Array<{ page: string; views: number; avgDuration: number }>
    topProperties: Array<{ slug: string; views: number }>
    topCampaigns: Array<{ campaign: string; clicks: number; leads: number; conversionRate: number }>
    topLinks: Array<{ id: string; name: string; short_code: string; clicks: number; unique_clicks: number; channel: string }>
    byBroker: Array<{ broker_id: string; name: string; clicks: number; links: number }>
    byHour: Array<{ hour: number; clicks: number }>
    byDayOfWeek: Array<{ day: string; clicks: number }>
    recentFeed: Array<{
        id: string; device_type: string; browser: string; os: string
        location: string | null; city: string | null; region: string | null; country: string | null
        referrer: string | null; created_at: string; tracked_link_id: string
    }>
    leadScoreSummary: {
        total: number; ready: number; very_hot: number; hot: number; warm: number; cold: number
    }
    topLeadScores: Array<{
        fingerprint: string; score: number; category: string; intent: string
        urgency: string; sessions: number; clicks: number; development: string | null; last_seen: string
    }>
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

    // Realtime state
    const [realtimeClicks, setRealtimeClicks] = useState<Array<{
        id: string; device_type: string; browser: string; city: string | null
        created_at: string; tracked_link_id: string
    }>>([])
    const [realtimeCount, setRealtimeCount] = useState(0)
    const realtimeCountRef = useRef(0)

    // Supabase Realtime subscription for live click feed
    useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel('tracking-realtime')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'link_events',
                filter: 'event_type=eq.click',
            }, (payload) => {
                const evt = payload.new as any
                setRealtimeClicks(prev => [{
                    id: evt.id,
                    device_type: evt.device_type || 'desktop',
                    browser: evt.browser || 'desconhecido',
                    city: evt.metadata?.city || evt.location || null,
                    created_at: evt.created_at,
                    tracked_link_id: evt.tracked_link_id,
                }, ...prev].slice(0, 20))
                realtimeCountRef.current += 1
                setRealtimeCount(realtimeCountRef.current)
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

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
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            toast.loading('Exportando...')
                            fetch(`/api/tracking/export?time_range=${timeRange}&format=csv`)
                                .then(r => {
                                    if (!r.ok) throw new Error('Export failed')
                                    return r.blob()
                                })
                                .then(blob => {
                                    const url = URL.createObjectURL(blob)
                                    const a = document.createElement('a')
                                    a.href = url
                                    a.download = `tracking-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`
                                    a.click()
                                    URL.revokeObjectURL(url)
                                    toast.dismiss()
                                    toast.success('Exportado!')
                                })
                                .catch(() => { toast.dismiss(); toast.error('Erro ao exportar') })
                        }}
                        className="h-9 px-3 rounded-lg flex items-center gap-1.5 transition-all hover:opacity-80"
                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                        title="Exportar CSV"
                    >
                        <Download size={13} style={{ color: T.textMuted }} />
                        <span className="text-[10px] font-semibold hidden sm:inline" style={{ color: T.textMuted }}>CSV</span>
                    </button>
                    <button
                        onClick={load}
                        className="h-9 w-9 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                        title="Recarregar dados"
                    >
                        <RefreshCw size={13} style={{ color: T.textMuted }} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* ── Loading Skeleton ── */}
            {loading && (
                <div className="space-y-4 animate-pulse">
                    {/* KPI skeleton row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-24 rounded-lg"
                                style={{ background: T.surface, border: `1px solid ${T.border}` }}
                            >
                                <div className="p-4 space-y-3">
                                    <div className="h-3 w-20 rounded" style={{ background: T.elevated }} />
                                    <div className="h-6 w-16 rounded" style={{ background: T.elevated }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Secondary KPI skeleton */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-20 rounded-lg"
                                style={{ background: T.surface, border: `1px solid ${T.border}` }}
                            >
                                <div className="p-4 space-y-2">
                                    <div className="h-3 w-16 rounded" style={{ background: T.elevated }} />
                                    <div className="h-5 w-12 rounded" style={{ background: T.elevated }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Chart skeleton row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div
                            className="lg:col-span-2 h-[300px] rounded-lg"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        />
                        <div
                            className="h-[300px] rounded-lg"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        />
                    </div>
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

                    {/* ── Secondary KPIs ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.07, duration: 0.35 }}
                        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                    >
                        <KPICard
                            label="Sessões"
                            sublabel={TIME_LABELS[timeRange]}
                            value={formatNumber(data.kpis.totalSessions)}
                            icon={<Globe size={16} />}
                            accent="blue"
                            size="sm"
                        />
                        <KPICard
                            label="Page Views"
                            value={formatNumber(data.kpis.totalPageViews)}
                            icon={<BarChart3 size={16} />}
                            accent="ai"
                            size="sm"
                        />
                        <KPICard
                            label="Bounce Rate"
                            value={`${data.kpis.bounceRate}%`}
                            icon={<TrendingUp size={16} />}
                            accent={data.kpis.bounceRate > 70 ? 'hot' : 'warm'}
                            size="sm"
                        />
                        <KPICard
                            label="Tempo Médio"
                            value={data.kpis.avgDurationSeconds > 60
                                ? `${Math.floor(data.kpis.avgDurationSeconds / 60)}m ${data.kpis.avgDurationSeconds % 60}s`
                                : `${data.kpis.avgDurationSeconds}s`
                            }
                            icon={<Clock size={16} />}
                            accent="green"
                            size="sm"
                        />
                    </motion.div>

                    {/* ── Realtime + Funnel Row ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08, duration: 0.35 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
                    >
                        {/* Realtime Live Counter */}
                        <div
                            className="rounded-lg p-5"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <div className="relative">
                                    <Zap size={14} style={{ color: T.success }} />
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse" style={{ background: T.success }} />
                                </div>
                                <h3 className="text-sm font-bold" style={{ color: T.text }}>Tempo Real</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="text-center">
                                    <div className="text-3xl font-black" style={{ color: T.accent }}>
                                        {realtimeCount}
                                    </div>
                                    <p className="text-[10px] mt-1" style={{ color: T.textDim }}>
                                        cliques nesta sessão
                                    </p>
                                </div>
                                {realtimeClicks.length > 0 && (
                                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                                        <AnimatePresence>
                                            {realtimeClicks.slice(0, 5).map((click) => (
                                                <motion.div
                                                    key={click.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex items-center gap-2 px-2 py-1.5 rounded-md"
                                                    style={{ background: T.hover }}
                                                >
                                                    {click.device_type === 'mobile' ? <Smartphone size={10} style={{ color: T.textMuted }} /> : <Monitor size={10} style={{ color: T.textMuted }} />}
                                                    <span className="text-[10px] truncate flex-1" style={{ color: T.text }}>
                                                        {click.city || 'Desconhecido'} · {click.browser}
                                                    </span>
                                                    <span className="text-[9px] font-mono" style={{ color: T.textDim }}>agora</span>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                                {realtimeClicks.length === 0 && (
                                    <p className="text-[10px] text-center py-4" style={{ color: T.textMuted }}>
                                        Aguardando cliques...
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Conversion Funnel */}
                        <div
                            className="lg:col-span-2 rounded-lg p-5"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        >
                            <h3 className="text-sm font-bold mb-1" style={{ color: T.text }}>
                                Funil de Conversão
                            </h3>
                            <p className="text-[11px] mb-4" style={{ color: T.textDim }}>
                                Jornada: Cliques → Sessões → Leads
                            </p>
                            {(() => {
                                const k = data.kpis
                                const steps = [
                                    { label: 'Cliques', value: k.totalClicks, icon: MousePointerClick, color: CHART_PRIMARY },
                                    { label: 'Sessões', value: k.totalSessions, icon: Globe, color: CHART_SECONDARY },
                                    { label: 'Page Views', value: k.totalPageViews, icon: BarChart3, color: '#8B5CF6' },
                                    { label: 'Leads', value: k.totalLeads, icon: Users, color: CHART_TERTIARY },
                                ]
                                const maxVal = Math.max(...steps.map(s => s.value), 1)
                                return (
                                    <div className="flex items-end gap-3 justify-between">
                                        {steps.map((step, i) => {
                                            const pct = Math.max((step.value / maxVal) * 100, 8)
                                            const convRate = i > 0 && steps[i - 1].value > 0
                                                ? ((step.value / steps[i - 1].value) * 100).toFixed(1) + '%'
                                                : null
                                            const Icon = step.icon
                                            return (
                                                <div key={step.label} className="flex-1 flex flex-col items-center gap-1">
                                                    <span className="text-xs font-black" style={{ color: step.color }}>
                                                        {formatNumber(step.value)}
                                                    </span>
                                                    <div
                                                        className="w-full rounded-t-md transition-all"
                                                        style={{
                                                            height: `${Math.round(pct * 1.2)}px`,
                                                            minHeight: 12,
                                                            maxHeight: 120,
                                                            background: step.color,
                                                            opacity: 0.85,
                                                        }}
                                                    />
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Icon size={11} style={{ color: step.color }} />
                                                        <span className="text-[10px] font-semibold" style={{ color: T.text }}>
                                                            {step.label}
                                                        </span>
                                                    </div>
                                                    {convRate && (
                                                        <div className="flex items-center gap-0.5">
                                                            <ArrowRight size={8} style={{ color: T.textDim }} />
                                                            <span className="text-[9px] font-bold" style={{ color: T.textMuted }}>
                                                                {convRate}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })()}
                        </div>
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

                    {/* ── Top Links + Broker Ranking ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.16, duration: 0.35 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
                    >
                        {/* Top Links Comparativo */}
                        <div
                            className="rounded-lg p-5"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        >
                            <h3 className="text-sm font-bold flex items-center gap-2 mb-1" style={{ color: T.text }}>
                                <Link2 size={14} style={{ color: T.accent }} />
                                Top Links
                            </h3>
                            <p className="text-[11px] mb-4" style={{ color: T.textDim }}>
                                Links com mais cliques no período
                            </p>
                            {data.topLinks?.length > 0 ? (
                                <div className="space-y-2.5">
                                    {data.topLinks.slice(0, 8).map((link, i) => {
                                        const maxClicks = data.topLinks[0]?.clicks || 1
                                        const pct = Math.max(Math.round((link.clicks / maxClicks) * 100), 4)
                                        return (
                                            <Link key={link.id} href={`/backoffice/tracking/${link.id}`} className="block group">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="text-[10px] font-mono w-4 text-right shrink-0" style={{ color: T.textDim }}>
                                                            {i + 1}.
                                                        </span>
                                                        <span className="text-xs font-medium truncate group-hover:underline" style={{ color: T.text }}>
                                                            {link.name}
                                                        </span>
                                                        {link.channel && link.channel !== 'direct' && (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded shrink-0" style={{ background: T.hover, color: T.textMuted }}>
                                                                {link.channel}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] font-bold shrink-0 ml-2" style={{ color: T.accent }}>
                                                        {formatNumber(link.clicks)}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${pct}%`,
                                                            background: i === 0 ? T.accent : i === 1 ? CHART_SECONDARY : CHART_TERTIARY,
                                                            opacity: 1 - (i * 0.06),
                                                        }}
                                                    />
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-32">
                                    <p className="text-xs" style={{ color: T.textMuted }}>Nenhum link no período</p>
                                </div>
                            )}
                        </div>

                        {/* Ranking por Corretor */}
                        <div
                            className="rounded-lg p-5"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        >
                            <h3 className="text-sm font-bold flex items-center gap-2 mb-1" style={{ color: T.text }}>
                                <Users size={14} style={{ color: T.accent }} />
                                Ranking por Corretor
                            </h3>
                            <p className="text-[11px] mb-4" style={{ color: T.textDim }}>
                                Cliques gerados por cada corretor
                            </p>
                            {data.byBroker?.length > 0 ? (
                                <div className="space-y-3">
                                    {data.byBroker.map((broker, i) => {
                                        const maxClicks = data.byBroker[0]?.clicks || 1
                                        const pct = Math.max(Math.round((broker.clicks / maxClicks) * 100), 4)
                                        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
                                        return (
                                            <div key={broker.broker_id}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        {medal && <span className="text-sm">{medal}</span>}
                                                        <span className="text-xs font-semibold" style={{ color: T.text }}>
                                                            {broker.name}
                                                        </span>
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: T.hover, color: T.textDim }}>
                                                            {broker.links} link{broker.links !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-bold" style={{ color: T.accent }}>
                                                        {formatNumber(broker.clicks)}
                                                    </span>
                                                </div>
                                                <div className="h-2 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${pct}%`,
                                                            background: i === 0 ? T.accent : i === 1 ? CHART_SECONDARY : CHART_TERTIARY,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-32">
                                    <p className="text-xs" style={{ color: T.textMuted }}>Nenhum corretor com links</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* ── Peak Hours + Day of Week ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.17, duration: 0.35 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
                    >
                        {/* Peak Hours Heatmap */}
                        <div
                            className="rounded-lg p-5"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        >
                            <h3 className="text-sm font-bold flex items-center gap-2 mb-1" style={{ color: T.text }}>
                                <Clock size={14} style={{ color: T.accent }} />
                                Horários de Pico
                            </h3>
                            <p className="text-[11px] mb-4" style={{ color: T.textDim }}>
                                Distribuição de cliques por hora do dia
                            </p>
                            {data.byHour?.length > 0 ? (() => {
                                const maxH = Math.max(...data.byHour.map(h => h.clicks), 1)
                                return (
                                    <div className="flex items-end gap-[3px]" style={{ height: 100 }}>
                                        {data.byHour.map(h => {
                                            const pct = Math.max((h.clicks / maxH) * 100, 3)
                                            const isHot = h.clicks >= maxH * 0.7
                                            const isWarm = h.clicks >= maxH * 0.4
                                            return (
                                                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group relative">
                                                    <div
                                                        className="w-full rounded-t-sm transition-all cursor-default"
                                                        style={{
                                                            height: `${pct}%`,
                                                            minHeight: 3,
                                                            background: isHot ? T.accent : isWarm ? CHART_SECONDARY : T.elevated,
                                                            opacity: h.clicks === 0 ? 0.3 : 1,
                                                        }}
                                                        title={`${h.hour}h — ${h.clicks} clique${h.clicks !== 1 ? 's' : ''}`}
                                                    />
                                                    {h.hour % 3 === 0 && (
                                                        <span className="text-[8px]" style={{ color: T.textDim }}>
                                                            {h.hour}h
                                                        </span>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })() : (
                                <div className="flex items-center justify-center h-[100px]">
                                    <p className="text-xs" style={{ color: T.textMuted }}>Sem dados</p>
                                </div>
                            )}
                            {data.byHour?.length > 0 && (() => {
                                const peak = data.byHour.reduce((a, b) => b.clicks > a.clicks ? b : a)
                                return peak.clicks > 0 ? (
                                    <p className="text-[10px] mt-3 text-center" style={{ color: T.textMuted }}>
                                        Pico: <span style={{ color: T.accent, fontWeight: 700 }}>{peak.hour}h</span> com {peak.clicks} cliques
                                    </p>
                                ) : null
                            })()}
                        </div>

                        {/* Day of Week Distribution */}
                        <div
                            className="rounded-lg p-5"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        >
                            <h3 className="text-sm font-bold flex items-center gap-2 mb-1" style={{ color: T.text }}>
                                <Calendar size={14} style={{ color: T.accent }} />
                                Por Dia da Semana
                            </h3>
                            <p className="text-[11px] mb-4" style={{ color: T.textDim }}>
                                Quando seus links recebem mais cliques
                            </p>
                            {data.byDayOfWeek?.length > 0 ? (() => {
                                const maxD = Math.max(...data.byDayOfWeek.map(d => d.clicks), 1)
                                return (
                                    <div className="space-y-2.5">
                                        {data.byDayOfWeek.map((d, i) => {
                                            const pct = Math.max(Math.round((d.clicks / maxD) * 100), 2)
                                            const isBest = d.clicks === maxD && maxD > 0
                                            return (
                                                <div key={d.day}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-medium w-8" style={{ color: isBest ? T.accent : T.text }}>
                                                            {d.day}
                                                        </span>
                                                        <span className="text-[10px] font-bold" style={{ color: T.textMuted }}>
                                                            {d.clicks}
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                                                        <div
                                                            className="h-full rounded-full transition-all"
                                                            style={{
                                                                width: `${pct}%`,
                                                                background: isBest ? T.accent : CHART_SECONDARY,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })() : (
                                <div className="flex items-center justify-center h-32">
                                    <p className="text-xs" style={{ color: T.textMuted }}>Sem dados</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* ── Lead Intent Scores + By Source ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18, duration: 0.35 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
                    >
                        {/* Lead Intent Scores */}
                        <div
                            className="rounded-lg p-5"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        >
                            <h3 className="text-sm font-bold flex items-center gap-2 mb-1" style={{ color: T.text }}>
                                <Flame size={14} style={{ color: '#EF4444' }} />
                                Lead Scoring
                            </h3>
                            <p className="text-[11px] mb-4" style={{ color: T.textDim }}>
                                Visitantes classificados por engajamento
                            </p>

                            {/* Score Summary Pills */}
                            {data.leadScoreSummary && data.leadScoreSummary.total > 0 ? (
                                <>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {[
                                            { label: 'Ready', count: data.leadScoreSummary.ready, color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
                                            { label: 'Very Hot', count: data.leadScoreSummary.very_hot, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
                                            { label: 'Hot', count: data.leadScoreSummary.hot, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
                                            { label: 'Warm', count: data.leadScoreSummary.warm, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
                                            { label: 'Cold', count: data.leadScoreSummary.cold, color: T.textMuted, bg: T.elevated },
                                        ].filter(s => s.count > 0).map(s => (
                                            <span
                                                key={s.label}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                                                style={{ background: s.bg, color: s.color }}
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                                                {s.label}: {s.count}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Top Leads List */}
                                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                                        {data.topLeadScores?.slice(0, 10).map((lead, i) => {
                                            const catColor = lead.category === 'ready' ? '#22C55E'
                                                : lead.category === 'very_hot' ? '#EF4444'
                                                : lead.category === 'hot' ? '#F59E0B'
                                                : lead.category === 'warm' ? '#3B82F6' : T.textMuted
                                            return (
                                                <div
                                                    key={`${lead.fingerprint}-${i}`}
                                                    className="flex items-center gap-2 px-2.5 py-2 rounded-md transition-colors"
                                                    style={{ background: 'transparent' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = T.hover}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div
                                                        className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
                                                        style={{ background: catColor + '20', color: catColor }}
                                                    >
                                                        {lead.score}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] font-mono font-bold" style={{ color: T.text }}>
                                                                #{lead.fingerprint}
                                                            </span>
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: catColor + '15', color: catColor }}>
                                                                {lead.intent || lead.category}
                                                            </span>
                                                        </div>
                                                        {lead.development && (
                                                            <span className="text-[9px] truncate block mt-0.5" style={{ color: T.textDim }}>
                                                                {lead.development}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <span className="text-[9px] font-semibold block" style={{ color: T.textMuted }}>
                                                            {lead.clicks} clk · {lead.sessions} sess
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-32 gap-2">
                                    <Target size={20} style={{ color: T.textMuted, opacity: 0.4 }} />
                                    <p className="text-xs" style={{ color: T.textMuted }}>Nenhum lead score registrado</p>
                                </div>
                            )}
                        </div>

                        {/* By Source Breakdown */}
                        <div
                            className="rounded-lg p-5"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        >
                            <h3 className="text-sm font-bold flex items-center gap-2 mb-1" style={{ color: T.text }}>
                                <Activity size={14} style={{ color: T.accent }} />
                                Por Fonte de Tráfego
                            </h3>
                            <p className="text-[11px] mb-4" style={{ color: T.textDim }}>
                                Sessões, cliques e leads por origem
                            </p>
                            {data.bySource?.length > 0 ? (
                                <div className="space-y-3">
                                    {data.bySource.slice(0, 8).map((src, i) => {
                                        const maxTotal = data.bySource[0]?.total || 1
                                        const pct = Math.max(Math.round((src.total / maxTotal) * 100), 4)
                                        return (
                                            <div key={src.name}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold capitalize" style={{ color: T.text }}>
                                                            {src.name === 'direct' ? '🌐 Direto' : src.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[9px]" style={{ color: CHART_SECONDARY }}>
                                                            {src.sessions} sess
                                                        </span>
                                                        <span className="text-[9px]" style={{ color: T.accent }}>
                                                            {src.clicks} clk
                                                        </span>
                                                        {src.leads > 0 && (
                                                            <span className="text-[9px] font-bold" style={{ color: CHART_TERTIARY }}>
                                                                {src.leads} leads
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="h-1.5 rounded-full overflow-hidden flex gap-[1px]" style={{ background: T.elevated }}>
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${pct}%`,
                                                            background: i === 0 ? T.accent : i < 3 ? CHART_SECONDARY : T.textMuted,
                                                            opacity: 1 - (i * 0.08),
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-32">
                                    <p className="text-xs" style={{ color: T.textMuted }}>Sem dados de fonte</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* ── Top Pages + Top Imóveis ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.185, duration: 0.35 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
                    >
                        {/* Top Pages */}
                        <div
                            className="rounded-lg p-5"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        >
                            <h3 className="text-sm font-bold flex items-center gap-2 mb-1" style={{ color: T.text }}>
                                <FileText size={14} style={{ color: T.accent }} />
                                Páginas Mais Visitadas
                            </h3>
                            <p className="text-[11px] mb-4" style={{ color: T.textDim }}>
                                URLs com mais page views
                            </p>
                            {data.topPages?.length > 0 ? (
                                <div className="space-y-2 max-h-[280px] overflow-y-auto">
                                    {data.topPages.slice(0, 12).map((page, i) => {
                                        const maxViews = data.topPages[0]?.views || 1
                                        const pct = Math.max(Math.round((page.views / maxViews) * 100), 3)
                                        return (
                                            <div key={page.page}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[11px] font-medium truncate max-w-[200px]" style={{ color: T.text }}>
                                                        {page.page === '/' ? '🏠 Home' : page.page.replace(/^\/(imoveis|empreendimentos)\//, '')}
                                                    </span>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-[9px]" style={{ color: T.textDim }}>
                                                            {page.avgDuration > 0 ? `${page.avgDuration}s` : ''}
                                                        </span>
                                                        <span className="text-[10px] font-bold" style={{ color: T.accent }}>
                                                            {formatNumber(page.views)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="h-1 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${pct}%`,
                                                            background: i < 3 ? T.accent : CHART_SECONDARY,
                                                            opacity: 1 - (i * 0.06),
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-32">
                                    <p className="text-xs" style={{ color: T.textMuted }}>Nenhum page view no período</p>
                                </div>
                            )}
                        </div>

                        {/* Top Imóveis / Empreendimentos */}
                        <div
                            className="rounded-lg p-5"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        >
                            <h3 className="text-sm font-bold flex items-center gap-2 mb-1" style={{ color: T.text }}>
                                <Building2 size={14} style={{ color: T.accent }} />
                                Top Imóveis
                            </h3>
                            <p className="text-[11px] mb-4" style={{ color: T.textDim }}>
                                Empreendimentos com mais visualizações
                            </p>
                            {data.topProperties?.length > 0 ? (
                                <div className="space-y-3">
                                    {data.topProperties.slice(0, 10).map((prop, i) => {
                                        const maxViews = data.topProperties[0]?.views || 1
                                        const pct = Math.max(Math.round((prop.views / maxViews) * 100), 4)
                                        const medal = i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
                                        return (
                                            <div key={prop.slug}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        {medal && <span className="text-sm shrink-0">{medal}</span>}
                                                        <span className="text-xs font-semibold truncate capitalize" style={{ color: T.text }}>
                                                            {prop.slug.replace(/-/g, ' ')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0 ml-2">
                                                        <Eye size={10} style={{ color: T.textDim }} />
                                                        <span className="text-[10px] font-bold" style={{ color: T.accent }}>
                                                            {formatNumber(prop.views)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="h-2 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${pct}%`,
                                                            background: i === 0 ? T.accent : i < 3 ? CHART_SECONDARY : CHART_TERTIARY,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-32 gap-2">
                                    <Building2 size={20} style={{ color: T.textMuted, opacity: 0.4 }} />
                                    <p className="text-xs" style={{ color: T.textMuted }}>Nenhum empreendimento no período</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* ── Live Feed + Location ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.19, duration: 0.35 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
                    >
                        {/* Recent Access Feed */}
                        <div
                            className="lg:col-span-2 rounded-lg p-5"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: T.text }}>
                                        <Clock size={14} style={{ color: T.accent }} />
                                        Acessos Recentes
                                    </h3>
                                    <p className="text-[11px] mt-0.5" style={{ color: T.textDim }}>
                                        Últimos cliques em links rastreados
                                    </p>
                                </div>
                                <span
                                    className="text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1.5"
                                    style={{ background: `${T.success}15`, color: T.success }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.success }} />
                                    LIVE {realtimeCount > 0 ? `+${realtimeCount}` : ''}
                                </span>
                            </div>

                            <div className="space-y-1 max-h-[320px] overflow-y-auto">
                                {data.recentFeed?.length > 0 ? data.recentFeed.map((evt) => {
                                    const DeviceIcon = evt.device_type === 'mobile' ? Smartphone
                                        : evt.device_type === 'tablet' ? Tablet : Monitor
                                    const timeAgo = (() => {
                                        const diff = Date.now() - new Date(evt.created_at).getTime()
                                        if (diff < 60_000) return 'agora'
                                        if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`
                                        if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`
                                        return `${Math.floor(diff / 86_400_000)}d`
                                    })()
                                    return (
                                        <div
                                            key={evt.id}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors"
                                            style={{ background: 'transparent' }}
                                            onMouseEnter={e => e.currentTarget.style.background = T.hover}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div
                                                className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                                                style={{ background: T.accentBg }}
                                            >
                                                <DeviceIcon size={14} style={{ color: T.accent }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold" style={{ color: T.text }}>
                                                        {evt.city || evt.location || 'Local desconhecido'}
                                                    </span>
                                                    {evt.country && (
                                                        <span className="text-[10px]" style={{ color: T.textDim }}>
                                                            {evt.region ? `${evt.region}, ` : ''}{evt.country}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] mt-0.5" style={{ color: T.textDim }}>
                                                    {evt.browser} · {evt.os}
                                                    {evt.referrer ? ` · via ${(() => { try { return new URL(evt.referrer).hostname.replace('www.', '') } catch { return evt.referrer } })()}` : ''}
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-mono shrink-0" style={{ color: T.textMuted }}>
                                                {timeAgo}
                                            </span>
                                        </div>
                                    )
                                }) : (
                                    <div className="flex items-center justify-center h-32">
                                        <p className="text-xs" style={{ color: T.textMuted }}>Nenhum acesso no período</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Location Breakdown */}
                        <div
                            className="rounded-lg p-5"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        >
                            <h3 className="text-sm font-bold flex items-center gap-2 mb-1" style={{ color: T.text }}>
                                <MapPin size={14} style={{ color: T.accent }} />
                                Por Localização
                            </h3>
                            <p className="text-[11px] mb-4" style={{ color: T.textDim }}>
                                Cidades com mais cliques
                            </p>

                            {data.byLocation?.length > 0 ? (
                                <div className="space-y-2.5">
                                    {data.byLocation.map((loc, i) => {
                                        const maxClicks = data.byLocation[0]?.clicks || 1
                                        const pct = Math.round((loc.clicks / maxClicks) * 100)
                                        return (
                                            <div key={loc.city}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-medium truncate" style={{ color: T.text }}>
                                                        {i === 0 && <span style={{ color: T.accent }}>★ </span>}
                                                        {loc.city}
                                                    </span>
                                                    <span className="text-[10px] font-bold shrink-0 ml-2" style={{ color: T.textMuted }}>
                                                        {formatNumber(loc.clicks)}
                                                    </span>
                                                </div>
                                                <div
                                                    className="h-1.5 rounded-full overflow-hidden"
                                                    style={{ background: T.elevated }}
                                                >
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${pct}%`,
                                                            background: i === 0 ? T.accent : CHART_SECONDARY,
                                                            opacity: 1 - (i * 0.08),
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-32">
                                    <p className="text-xs" style={{ color: T.textMuted }}>Sem dados de localização</p>
                                </div>
                            )}
                        </div>
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
                                                    href={`/backoffice/tracking/links?campaign=${encodeURIComponent(c.campaign)}`}
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
