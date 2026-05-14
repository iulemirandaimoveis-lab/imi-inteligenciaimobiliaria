'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
    Globe, Users, Eye, Clock, TrendingUp, TrendingDown,
    Monitor, Smartphone, Tablet, MapPin, BarChart3,
    RefreshCw, Download, ArrowRight, Chrome, Flame,
    Activity, MousePointer, Layers, LogIn, LogOut,
    Repeat, UserPlus, Navigation, Percent,
} from 'lucide-react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader, KPICard } from '@/app/(backoffice)/components/ui'
import { toast } from 'sonner'

/* ─── Types ─── */
interface WebAnalytics {
    kpis: {
        totalPageViews: number
        totalSessions: number
        uniqueSessions: number
        bounceRate: number
        avgDurationSeconds: number
        avgPagesPerSession: number
        newVisitors: number
        returnVisitors: number
        returnRate: number
        hasGeoData: boolean
    }
    dailyTimeline: Array<{ day: string; pageViews: number; sessions: number }>
    byDevice: Array<{ name: string; value: number; pct: number }>
    byBrowser: Array<{ name: string; value: number; pct: number }>
    byOS: Array<{ name: string; value: number; pct: number }>
    byCountry: Array<{ country: string; sessions: number; pct: number }>
    byCity: Array<{ city: string; sessions: number; country: string }>
    bySource: Array<{ source: string; sessions: number; pageViews: number }>
    topPages: Array<{ path: string; views: number; avgDuration: number }>
    topEntryPages: Array<{ path: string; sessions: number }>
    topExitPages: Array<{ path: string; sessions: number }>
    topProperties: Array<{ slug: string; views: number }>
    byHour: Array<{ hour: number; views: number }>
    byDayOfWeek: Array<{ day: string; views: number }>
    recentVisitors: Array<{
        session_id: string; device_type: string; browser: string; os: string
        country: string | null; city: string | null; region: string | null
        first_page: string; page_count: number; total_duration: number
        utm_source: string | null; is_return_visit: boolean; created_at: string
    }>
    scrollDepthDist: Array<{ range: string; views: number }>
}

type TimeRange = '7d' | '30d' | '90d'

/* ─── Constants ─── */
const C1 = '#C49D5B'
const C2 = '#5B9BD5'
const C3 = '#22C55E'
const C4 = '#F59E0B'
const C5 = '#8B5CF6'
const PIE_COLORS = [C1, C2, C3, C4, C5]

const TIME_LABELS: Record<TimeRange, string> = { '7d': '7 dias', '30d': '30 dias', '90d': '90 dias' }

/* ─── Helpers ─── */
const fmt = (n: number) => n.toLocaleString('pt-BR')
const fmtDur = (s: number) => s > 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`
const fmtDay = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

const COUNTRY_FLAGS: Record<string, string> = {
    BR: '🇧🇷', US: '🇺🇸', PT: '🇵🇹', AR: '🇦🇷', MX: '🇲🇽', DE: '🇩🇪',
    FR: '🇫🇷', GB: '🇬🇧', ES: '🇪🇸', IT: '🇮🇹', JP: '🇯🇵', CN: '🇨🇳',
    CA: '🇨🇦', AU: '🇦🇺', NL: '🇳🇱', IN: '🇮🇳', CL: '🇨🇱', CO: '🇨🇴',
    UY: '🇺🇾', PE: '🇵🇪', AE: '🇦🇪', CH: '🇨🇭', BE: '🇧🇪', SE: '🇸🇪',
}
const flag = (code: string) => COUNTRY_FLAGS[code] ?? '🌍'

function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-lg px-3 py-2 shadow-lg text-xs" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
            <p className="font-semibold mb-1" style={{ color: T.textMuted }}>{label}</p>
            {payload.map((e: any, i: number) => (
                <p key={i} className="font-bold" style={{ color: e.color }}>{e.name}: {fmt(e.value)}</p>
            ))}
        </div>
    )
}

function Section({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-lg p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-0.5" style={{ color: T.text }}>
                <span style={{ color: C1 }}>{icon}</span>
                {title}
            </h3>
            {subtitle && <p className="text-[11px] mb-4" style={{ color: T.textDim }}>{subtitle}</p>}
            {!subtitle && <div className="mb-4" />}
            {children}
        </div>
    )
}

function BarList({ items, maxVal, labelKey, valueKey, colorFn }: {
    items: any[]; maxVal: number; labelKey: string; valueKey: string; colorFn?: (i: number) => string
}) {
    return (
        <div className="space-y-2.5">
            {items.map((item, i) => {
                const pct = Math.max(Math.round((item[valueKey] / Math.max(maxVal, 1)) * 100), 3)
                const color = colorFn ? colorFn(i) : (i === 0 ? C1 : i < 3 ? C2 : T.textMuted)
                return (
                    <div key={`${item[labelKey]}-${i}`}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium truncate max-w-[200px]" style={{ color: T.text }}>{item[labelKey]}</span>
                            <span className="text-[10px] font-bold shrink-0 ml-2" style={{ color }}>{fmt(item[valueKey])}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color, opacity: 1 - i * 0.06 }} />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

/* ─── Page ─── */
export default function WebsiteAnalyticsPage() {
    const [timeRange, setTimeRange] = useState<TimeRange>('30d')
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<WebAnalytics | null>(null)
    const [error, setError] = useState(false)
    const [activeTab, setActiveTab] = useState<'overview' | 'geo' | 'pages' | 'tech' | 'visitors'>('overview')

    const load = () => {
        setLoading(true)
        setError(false)
        fetch(`/api/tracking/website-analytics?time_range=${timeRange}`)
            .then(r => { if (!r.ok) throw new Error(); return r.json() })
            .then((d: WebAnalytics) => { setData(d); setLoading(false) })
            .catch(() => { setError(true); setLoading(false) })
    }

    useEffect(() => { load() }, [timeRange])

    const timeline = useMemo(() => data?.dailyTimeline?.map(d => ({ ...d, label: fmtDay(d.day) })) ?? [], [data?.dailyTimeline])

    return (
        <div className="space-y-4 max-w-7xl mx-auto">
            {/* ── Header ── */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <PageIntelHeader
                    moduleLabel="WEBSITE · ANALYTICS"
                    title="Analytics do Website"
                    subtitle="Visitantes, origem, dispositivos e comportamento — rastreamento próprio server-side"
                    live
                    actions={
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    toast.loading('Exportando...')
                                    fetch(`/api/tracking/export?time_range=${timeRange}&format=csv`)
                                        .then(r => { if (!r.ok) throw new Error(); return r.blob() })
                                        .then(blob => {
                                            const url = URL.createObjectURL(blob)
                                            const a = document.createElement('a')
                                            a.href = url; a.download = `website-analytics-${timeRange}.csv`; a.click()
                                            URL.revokeObjectURL(url); toast.dismiss(); toast.success('Exportado!')
                                        })
                                        .catch(() => { toast.dismiss(); toast.error('Erro ao exportar') })
                                }}
                                className="h-10 px-4 rounded-[6px] text-xs font-semibold flex items-center gap-2 transition-all hover:opacity-80"
                                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}
                            >
                                <Download size={13} /> CSV
                            </button>
                        </div>
                    }
                />
            </motion.div>

            {/* ── Controls ── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="inline-flex rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                    {(['7d', '30d', '90d'] as const).map(r => (
                        <button key={r} onClick={() => setTimeRange(r)}
                            className="h-9 px-4 text-[11px] font-semibold transition-all"
                            style={{ background: timeRange === r ? C1 : T.surface, color: timeRange === r ? '#fff' : T.textMuted, borderRight: r !== '90d' ? `1px solid ${T.border}` : 'none' }}>
                            {TIME_LABELS[r]}
                        </button>
                    ))}
                </div>
                <button onClick={load} className="h-9 w-9 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                    <RefreshCw size={13} style={{ color: T.textMuted }} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 overflow-x-auto pb-1" style={{ borderBottom: `1px solid ${T.border}` }}>
                {([
                    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
                    { id: 'geo', label: 'Geolocalização', icon: MapPin },
                    { id: 'pages', label: 'Páginas', icon: Layers },
                    { id: 'tech', label: 'Tecnologia', icon: Monitor },
                    { id: 'visitors', label: 'Visitantes', icon: Users },
                ] as const).map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className="flex items-center gap-2 h-9 px-4 text-[11px] font-semibold whitespace-nowrap rounded-t-lg transition-all"
                        style={{ color: activeTab === tab.id ? C1 : T.textMuted, borderBottom: activeTab === tab.id ? `2px solid ${C1}` : '2px solid transparent' }}>
                        <tab.icon size={12} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Loading ── */}
            {loading && (
                <div className="animate-pulse space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-lg" style={{ background: T.surface }} />)}
                    </div>
                    <div className="h-[280px] rounded-lg" style={{ background: T.surface }} />
                </div>
            )}

            {/* ── Error ── */}
            {!loading && error && (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <BarChart3 size={36} className="opacity-30" style={{ color: T.textMuted }} />
                    <p className="text-sm" style={{ color: T.textMuted }}>Erro ao carregar analytics</p>
                    <button onClick={load} className="text-xs font-semibold px-4 py-2 rounded-[6px]" style={{ color: C1 }}>Tentar novamente</button>
                </div>
            )}

            {/* ── Content ── */}
            {!loading && !error && data && (
                <>
                    {/* ── KPI Strip (always visible) ── */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard label="Page Views" sublabel={TIME_LABELS[timeRange]} value={fmt(data.kpis.totalPageViews)} icon={<Eye size={16} />} accent="gold" />
                        <KPICard label="Sessões" value={fmt(data.kpis.totalSessions)} icon={<Activity size={16} />} accent="info" />
                        <KPICard label="Bounce Rate" value={`${data.kpis.bounceRate}%`} icon={<TrendingUp size={16} />} accent={data.kpis.bounceRate > 70 ? 'hot' : 'warm'} />
                        <KPICard label="Tempo Médio" value={fmtDur(data.kpis.avgDurationSeconds)} icon={<Clock size={16} />} accent="success" />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.3 }}
                        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard label="Páginas/Sessão" value={String(data.kpis.avgPagesPerSession)} icon={<Layers size={16} />} accent="ai" size="sm" />
                        <KPICard label="Novos Visitantes" value={fmt(data.kpis.newVisitors)} icon={<UserPlus size={16} />} accent="blue" size="sm" />
                        <KPICard label="Retornantes" value={fmt(data.kpis.returnVisitors)} sublabel={`${data.kpis.returnRate}% do total`} icon={<Repeat size={16} />} accent="warm" size="sm" />
                        <KPICard label="Cobertura Geo"
                            value={data.kpis.hasGeoData ? `${data.byCountry.length} países` : 'Coletando...'}
                            sublabel={data.kpis.hasGeoData ? 'dados geográficos ativos' : 'populando com novos acessos'}
                            icon={<MapPin size={16} />} accent={data.kpis.hasGeoData ? 'success' : 'warm'} size="sm" />
                    </motion.div>

                    {/* ══════════════ TAB: OVERVIEW ══════════════ */}
                    {activeTab === 'overview' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="space-y-5">
                            {/* Timeline Chart */}
                            <div className="rounded-lg p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                <h3 className="text-sm font-bold mb-0.5" style={{ color: T.text }}>Tráfego ao longo do tempo</h3>
                                <p className="text-[11px] mb-4" style={{ color: T.textDim }}>Page Views e Sessões por dia</p>
                                <ResponsiveContainer width="100%" height={250}>
                                    <AreaChart data={timeline} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gPV" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={C1} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={C1} stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gSess" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={C2} stopOpacity={0.2} />
                                                <stop offset="95%" stopColor={C2} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={T.borderSubtle} />
                                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: T.textDim }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                        <YAxis tick={{ fontSize: 10, fill: T.textDim }} tickLine={false} axisLine={false} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Area type="monotone" dataKey="pageViews" name="Page Views" stroke={C1} strokeWidth={2} fill="url(#gPV)" />
                                        <Area type="monotone" dataKey="sessions" name="Sessões" stroke={C2} strokeWidth={1.5} fill="url(#gSess)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Source + Scroll Depth */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <Section title="Fontes de Tráfego" subtitle="De onde os visitantes vêm" icon={<Navigation size={14} />}>
                                    {data.bySource.length > 0 ? (
                                        <BarList items={data.bySource} maxVal={data.bySource[0]?.sessions ?? 1} labelKey="source" valueKey="sessions" />
                                    ) : <Empty text="Sem dados de origem" />}
                                </Section>

                                <Section title="Profundidade de Scroll" subtitle="Quanto os visitantes rolam a página" icon={<MousePointer size={14} />}>
                                    {data.scrollDepthDist.some(d => d.views > 0) ? (
                                        <div className="space-y-3">
                                            {data.scrollDepthDist.map((d, i) => {
                                                const total = data.scrollDepthDist.reduce((s, x) => s + x.views, 0)
                                                const pct = total > 0 ? Math.round((d.views / total) * 100) : 0
                                                return (
                                                    <div key={d.range}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs font-medium" style={{ color: T.text }}>{d.range}%</span>
                                                            <span className="text-[10px] font-bold" style={{ color: PIE_COLORS[i] }}>{pct}%</span>
                                                        </div>
                                                        <div className="h-2 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                                                            <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, background: PIE_COLORS[i] }} />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : <Empty text="Sem dados de scroll" />}
                                </Section>
                            </div>

                            {/* Peak Hours + Day of Week */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <Section title="Horários de Pico" subtitle="Quando o site recebe mais visitas" icon={<Clock size={14} />}>
                                    {(() => {
                                        const maxH = Math.max(...data.byHour.map(h => h.views), 1)
                                        const peak = data.byHour.reduce((a, b) => b.views > a.views ? b : a)
                                        return (
                                            <>
                                                <div className="flex items-end gap-[3px]" style={{ height: 90 }}>
                                                    {data.byHour.map(h => {
                                                        const pct = Math.max((h.views / maxH) * 100, 3)
                                                        const isHot = h.views >= maxH * 0.7
                                                        return (
                                                            <div key={h.hour} className="flex-1 flex flex-col items-center gap-0.5">
                                                                <div className="w-full rounded-t-sm transition-all" title={`${h.hour}h — ${h.views} views`}
                                                                    style={{ height: `${pct}%`, minHeight: 3, background: isHot ? C1 : C2, opacity: h.views === 0 ? 0.2 : 0.85 }} />
                                                                {h.hour % 3 === 0 && <span className="text-[8px]" style={{ color: T.textDim }}>{h.hour}h</span>}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                                {peak.views > 0 && (
                                                    <p className="text-[10px] mt-3 text-center" style={{ color: T.textMuted }}>
                                                        Pico: <span style={{ color: C1, fontWeight: 700 }}>{peak.hour}h</span> com {peak.views} views
                                                    </p>
                                                )}
                                            </>
                                        )
                                    })()}
                                </Section>

                                <Section title="Por Dia da Semana" subtitle="Distribuição semanal de visitas" icon={<BarChart3 size={14} />}>
                                    <BarList items={data.byDayOfWeek} maxVal={Math.max(...data.byDayOfWeek.map(d => d.views), 1)} labelKey="day" valueKey="views" />
                                </Section>
                            </div>
                        </motion.div>
                    )}

                    {/* ══════════════ TAB: GEO ══════════════ */}
                    {activeTab === 'geo' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="space-y-5">
                            {!data.kpis.hasGeoData && (
                                <div className="rounded-lg p-4 flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                    <MapPin size={16} style={{ color: C4, marginTop: 1, flexShrink: 0 }} />
                                    <div>
                                        <p className="text-xs font-bold" style={{ color: C4 }}>Dados geográficos em coleta</p>
                                        <p className="text-[11px] mt-0.5" style={{ color: T.textMuted }}>
                                            Os dados de país/cidade são capturados pelos headers Vercel e estarão disponíveis para novos acessos ao site. Dados históricos não possuem geo.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {/* By Country */}
                                <Section title="Por País" subtitle="Sessões por país de origem" icon={<Globe size={14} />}>
                                    {data.byCountry.length > 0 ? (
                                        <div className="space-y-2.5 max-h-[360px] overflow-y-auto">
                                            {data.byCountry.map((c, i) => {
                                                const pct = Math.max(Math.round((c.sessions / (data.byCountry[0]?.sessions ?? 1)) * 100), 3)
                                                return (
                                                    <div key={c.country}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-base">{flag(c.country)}</span>
                                                                <span className="text-xs font-semibold" style={{ color: T.text }}>{c.country}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px]" style={{ color: T.textDim }}>{c.pct}%</span>
                                                                <span className="text-[10px] font-bold" style={{ color: i === 0 ? C1 : T.textMuted }}>{fmt(c.sessions)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                                                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: i === 0 ? C1 : C2, opacity: 1 - i * 0.05 }} />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : <Empty text="Sem dados de país (populando com novos acessos)" />}
                                </Section>

                                {/* By City */}
                                <Section title="Por Cidade" subtitle="Top cidades por sessões" icon={<MapPin size={14} />}>
                                    {data.byCity.length > 0 ? (
                                        <div className="space-y-2.5 max-h-[360px] overflow-y-auto">
                                            {data.byCity.map((c, i) => {
                                                const pct = Math.max(Math.round((c.sessions / (data.byCity[0]?.sessions ?? 1)) * 100), 3)
                                                return (
                                                    <div key={`${c.city}-${c.country}`}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-sm">{flag(c.country)}</span>
                                                                <span className="text-xs font-medium" style={{ color: T.text }}>{c.city}</span>
                                                            </div>
                                                            <span className="text-[10px] font-bold" style={{ color: i === 0 ? C1 : T.textMuted }}>{fmt(c.sessions)}</span>
                                                        </div>
                                                        <div className="h-1 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                                                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: i === 0 ? C1 : C2, opacity: 1 - i * 0.05 }} />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : <Empty text="Sem dados de cidade (populando com novos acessos)" />}
                                </Section>
                            </div>
                        </motion.div>
                    )}

                    {/* ══════════════ TAB: PÁGINAS ══════════════ */}
                    {activeTab === 'pages' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="space-y-5">
                            {/* Top Pages */}
                            <Section title="Páginas Mais Visitadas" subtitle="URLs com mais page views no período" icon={<Eye size={14} />}>
                                {data.topPages.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[500px]">
                                            <thead>
                                                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                                    {['Página', 'Views', 'Tempo Médio'].map(col => (
                                                        <th key={col} className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider ${col === 'Página' ? 'text-left' : 'text-right'}`}
                                                            style={{ color: T.textMuted }}>{col}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.topPages.map((p, i) => (
                                                    <tr key={p.path} style={{ borderBottom: `1px solid ${T.border}` }}
                                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.elevated }}
                                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                                                        <td className="py-2.5 px-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-mono w-4 text-right shrink-0" style={{ color: T.textDim }}>{i + 1}.</span>
                                                                <span className="text-xs font-medium" style={{ color: T.text }}>
                                                                    {p.path === '/' ? '🏠 Home' : p.path.replace(/^\/(pt|en|es|ja|ar)\//, '/').replace(/\/(imoveis|empreendimentos)\//, '/imóvel/')}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right">
                                                            <span className="text-xs font-bold" style={{ color: i < 3 ? C1 : T.text }}>{fmt(p.views)}</span>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right">
                                                            <span className="text-[10px]" style={{ color: T.textMuted }}>{p.avgDuration > 0 ? fmtDur(p.avgDuration) : '—'}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : <Empty text="Nenhuma página visitada no período" />}
                            </Section>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {/* Entry Pages */}
                                <Section title="Páginas de Entrada" subtitle="Onde os visitantes começam a sessão" icon={<LogIn size={14} />}>
                                    {data.topEntryPages.length > 0 ? (
                                        <BarList items={data.topEntryPages.map(p => ({ ...p, label: p.path === '/' ? 'Home' : p.path.split('/').pop() || p.path }))}
                                            maxVal={data.topEntryPages[0]?.sessions ?? 1} labelKey="label" valueKey="sessions" />
                                    ) : <Empty text="Sem dados de entrada" />}
                                </Section>

                                {/* Exit Pages */}
                                <Section title="Páginas de Saída" subtitle="Onde os visitantes encerram a sessão" icon={<LogOut size={14} />}>
                                    {data.topExitPages.length > 0 ? (
                                        <BarList items={data.topExitPages.map(p => ({ ...p, label: p.path === '/' ? 'Home' : p.path.split('/').pop() || p.path }))}
                                            maxVal={data.topExitPages[0]?.sessions ?? 1} labelKey="label" valueKey="sessions" />
                                    ) : <Empty text="Sem dados de saída" />}
                                </Section>
                            </div>

                            {/* Top Properties */}
                            {data.topProperties.length > 0 && (
                                <Section title="Empreendimentos Mais Vistos" subtitle="Imóveis com mais page views no período" icon={<Flame size={14} />}>
                                    <BarList items={data.topProperties.map(p => ({ ...p, label: p.slug.replace(/-/g, ' ') }))}
                                        maxVal={data.topProperties[0]?.views ?? 1} labelKey="label" valueKey="views"
                                        colorFn={i => i === 0 ? C1 : i === 1 ? C4 : i === 2 ? C3 : C2} />
                                </Section>
                            )}
                        </motion.div>
                    )}

                    {/* ══════════════ TAB: TECNOLOGIA ══════════════ */}
                    {activeTab === 'tech' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="space-y-5">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                {/* By Device */}
                                <Section title="Dispositivos" subtitle="Desktop, mobile e tablet" icon={<Monitor size={14} />}>
                                    {data.byDevice.length > 0 ? (
                                        <>
                                            <ResponsiveContainer width="100%" height={160}>
                                                <PieChart>
                                                    <Pie data={data.byDevice} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                                                        {data.byDevice.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                                    </Pie>
                                                    <Tooltip content={<ChartTooltip />} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="space-y-2 mt-2">
                                                {data.byDevice.map((d, i) => (
                                                    <div key={d.name} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                            <span className="text-xs capitalize" style={{ color: T.text }}>{d.name}</span>
                                                        </div>
                                                        <span className="text-[10px] font-bold" style={{ color: T.textMuted }}>{d.pct}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : <Empty text="Sem dados" />}
                                </Section>

                                {/* By Browser */}
                                <Section title="Navegadores" subtitle="Chrome, Safari, Firefox..." icon={<Chrome size={14} />}>
                                    {data.byBrowser.length > 0 ? (
                                        <BarList items={data.byBrowser} maxVal={data.byBrowser[0]?.value ?? 1} labelKey="name" valueKey="value" />
                                    ) : <Empty text="Sem dados" />}
                                </Section>

                                {/* By OS */}
                                <Section title="Sistemas Operacionais" subtitle="Windows, iOS, Android..." icon={<Smartphone size={14} />}>
                                    {data.byOS.length > 0 ? (
                                        <BarList items={data.byOS} maxVal={data.byOS[0]?.value ?? 1} labelKey="name" valueKey="value" />
                                    ) : <Empty text="Sem dados" />}
                                </Section>
                            </div>

                            {/* Device bar chart */}
                            {data.byDevice.length > 0 && (
                                <Section title="Evolução por Dispositivo" subtitle="Tendência de uso de dispositivos no período" icon={<TrendingUp size={14} />}>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={timeline} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={T.borderSubtle} />
                                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: T.textDim }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                            <YAxis tick={{ fontSize: 10, fill: T.textDim }} tickLine={false} axisLine={false} />
                                            <Tooltip content={<ChartTooltip />} />
                                            <Bar dataKey="sessions" name="Sessões" fill={C1} radius={[4, 4, 0, 0]} barSize={8} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Section>
                            )}
                        </motion.div>
                    )}

                    {/* ══════════════ TAB: VISITANTES ══════════════ */}
                    {activeTab === 'visitors' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="space-y-5">
                            {/* New vs Return */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                <Section title="Novos vs Retornantes" subtitle="Fidelização do público" icon={<Repeat size={14} />}>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Novos visitantes', value: data.kpis.newVisitors, total: data.kpis.totalSessions, color: C1 },
                                            { label: 'Retornantes', value: data.kpis.returnVisitors, total: data.kpis.totalSessions, color: C3 },
                                        ].map(item => {
                                            const pct = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0
                                            return (
                                                <div key={item.label}>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-xs font-medium" style={{ color: T.text }}>{item.label}</span>
                                                        <span className="text-xs font-bold" style={{ color: item.color }}>{fmt(item.value)} ({pct}%)</span>
                                                    </div>
                                                    <div className="h-3 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                                                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: item.color }} />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </Section>

                                {/* Session Quality */}
                                <Section title="Qualidade da Sessão" subtitle="Engajamento dos visitantes" icon={<Percent size={14} />}>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Bounce Rate', value: `${data.kpis.bounceRate}%`, color: data.kpis.bounceRate > 70 ? '#EF4444' : C3 },
                                            { label: 'Páginas / Sessão', value: String(data.kpis.avgPagesPerSession), color: C1 },
                                            { label: 'Duração Média', value: fmtDur(data.kpis.avgDurationSeconds), color: C2 },
                                            { label: 'Total de Sessões', value: fmt(data.kpis.totalSessions), color: T.textMuted },
                                        ].map(m => (
                                            <div key={m.label} className="flex items-center justify-between px-3 py-2 rounded-md" style={{ background: T.elevated }}>
                                                <span className="text-xs" style={{ color: T.textMuted }}>{m.label}</span>
                                                <span className="text-xs font-bold" style={{ color: m.color }}>{m.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Section>

                                {/* Placeholder for future: real-time count */}
                                <Section title="Sessões por Dia" subtitle="Evolução de visitantes únicos" icon={<Users size={14} />}>
                                    <ResponsiveContainer width="100%" height={160}>
                                        <AreaChart data={timeline} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={C3} stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor={C3} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="label" tick={{ fontSize: 9, fill: T.textDim }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                            <YAxis tick={{ fontSize: 9, fill: T.textDim }} tickLine={false} axisLine={false} />
                                            <Tooltip content={<ChartTooltip />} />
                                            <Area type="monotone" dataKey="sessions" name="Sessões" stroke={C3} strokeWidth={2} fill="url(#gU)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Section>
                            </div>

                            {/* Recent Visitors Feed */}
                            <Section title="Visitantes Recentes" subtitle="Últimas sessões registradas no site" icon={<Activity size={14} />}>
                                {data.recentVisitors.length > 0 ? (
                                    <div className="space-y-1 max-h-[420px] overflow-y-auto">
                                        {data.recentVisitors.map(v => {
                                            const DevIcon = v.device_type === 'mobile' ? Smartphone : v.device_type === 'tablet' ? Tablet : Monitor
                                            const timeAgo = (() => {
                                                const diff = Date.now() - new Date(v.created_at).getTime()
                                                if (diff < 60_000) return 'agora'
                                                if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`
                                                if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`
                                                return `${Math.floor(diff / 86_400_000)}d`
                                            })()
                                            return (
                                                <div key={v.session_id}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors"
                                                    style={{ background: 'transparent' }}
                                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.elevated }}
                                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                                                    <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: `${C1}18` }}>
                                                        <DevIcon size={14} style={{ color: C1 }} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-xs font-semibold" style={{ color: T.text }}>
                                                                {v.city || v.country ? `${v.city ?? ''}${v.city && v.country ? ', ' : ''}${v.country ? flag(v.country) : ''}` : 'Local desconhecido'}
                                                            </span>
                                                            {v.is_return_visit && (
                                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${C3}18`, color: C3 }}>retorno</span>
                                                            )}
                                                            {v.utm_source && (
                                                                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: T.elevated, color: T.textMuted }}>
                                                                    via {v.utm_source}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] mt-0.5" style={{ color: T.textDim }}>
                                                            {v.browser} · {v.os} · {v.page_count}p
                                                            {v.total_duration > 0 && ` · ${fmtDur(v.total_duration)}`}
                                                            <span className="ml-1.5 opacity-60">{v.first_page}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-mono shrink-0" style={{ color: T.textMuted }}>{timeAgo}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : <Empty text="Nenhum visitante no período" />}
                            </Section>
                        </motion.div>
                    )}
                </>
            )}
        </div>
    )
}

function Empty({ text }: { text: string }) {
    return (
        <div className="flex items-center justify-center h-32">
            <p className="text-xs" style={{ color: T.textMuted }}>{text}</p>
        </div>
    )
}
