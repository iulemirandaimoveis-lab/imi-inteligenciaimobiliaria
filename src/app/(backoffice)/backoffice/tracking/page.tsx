'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Link2, QrCode, MousePointer, Eye, Clock, TrendingUp, Users,
    Smartphone, Monitor, Tablet, MapPin, BarChart3, Loader2,
    RefreshCw, ArrowUpRight, FileText, Percent, Timer,
} from 'lucide-react'

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    border: 'var(--bo-border)',
    hover: 'var(--bo-hover)',
    accent: '#486581',
    accentBg: 'rgba(26,26,46,0.10)',
}

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

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
}

export default function TrackingDashboardPage() {
    const router = useRouter()
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<Analytics | null>(null)

    useEffect(() => { load() }, [timeRange])

    const load = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/tracking/analytics?time_range=${timeRange}`)
            if (res.ok) setData(await res.json())
        } catch (err) {
            console.error('Analytics load error:', err)
        } finally {
            setLoading(false)
        }
    }

    const deviceIcons: Record<string, any> = { mobile: Smartphone, desktop: Monitor, tablet: Tablet }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>
                        Tracking & Analytics
                    </h1>
                    <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                        Inteligência comportamental completa — visitantes, sessões, cliques e leads
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => router.push('/backoffice/tracking/qr')}
                        className="h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 text-white transition-all"
                        style={{ background: T.accent }}
                    >
                        <QrCode size={14} /> Novo QR Code
                    </button>
                    <button
                        onClick={() => router.push('/backoffice/tracking/links')}
                        className="h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                    >
                        <Link2 size={14} /> Links
                    </button>
                </div>
            </div>

            {/* Time Range + Refresh */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {(['7d', '30d', '90d'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className="h-8 px-3 rounded-lg text-[11px] font-semibold transition-all"
                            style={{
                                background: timeRange === range ? T.accent : T.elevated,
                                color: timeRange === range ? '#fff' : T.textMuted,
                                border: timeRange === range ? 'none' : `1px solid ${T.border}`,
                            }}
                        >
                            {range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : '90 dias'}
                        </button>
                    ))}
                </div>
                <button
                    onClick={load}
                    className="h-8 w-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                >
                    <RefreshCw size={13} style={{ color: T.textMuted }} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 size={28} className="animate-spin" style={{ color: T.accent }} />
                </div>
            ) : data ? (
                <>
                    {/* ── KPIs Row 1 ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {[
                            { icon: Eye, label: 'Page Views', value: data.kpis.totalPageViews.toLocaleString('pt-BR'), color: '#627D98' },
                            { icon: Users, label: 'Sessões', value: data.kpis.totalSessions.toLocaleString('pt-BR'), color: '#a78bfa' },
                            { icon: MousePointer, label: 'Cliques', value: data.kpis.totalClicks.toLocaleString('pt-BR'), color: '#f59e0b' },
                            { icon: TrendingUp, label: 'Leads', value: data.kpis.totalLeads.toLocaleString('pt-BR'), color: '#34d399' },
                            { icon: Timer, label: 'Tempo Médio', value: formatDuration(data.kpis.avgDurationSeconds), color: '#f472b6' },
                            { icon: Percent, label: 'Conversão', value: `${data.kpis.conversionRate}%`, color: '#c084fc' },
                        ].map(({ icon: Icon, label, value, color }) => (
                            <div
                                key={label}
                                className="rounded-xl p-4 transition-all"
                                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                            >
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <Icon size={14} style={{ color }} />
                                    <span className="text-[10px] font-medium" style={{ color: T.textMuted }}>{label}</span>
                                </div>
                                <div className="text-lg font-bold truncate" style={{ color: T.text }}>{value}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── KPIs Row 2 (secondary) ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Págs/Sessão', value: data.kpis.avgPagesPerSession.toString() },
                            { label: 'Bounce Rate', value: `${data.kpis.bounceRate}%` },
                            { label: 'Links Rastreados', value: data.kpis.totalTrackedLinks.toString() },
                            { label: 'Leads Convertidos', value: data.kpis.convertedLeads.toString() },
                        ].map(({ label, value }) => (
                            <div
                                key={label}
                                className="rounded-xl p-3 flex items-center justify-between"
                                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                            >
                                <span className="text-[10px] font-medium" style={{ color: T.textMuted }}>{label}</span>
                                <span className="text-sm font-bold" style={{ color: T.text }}>{value}</span>
                            </div>
                        ))}
                    </div>

                    {/* ── Daily Timeline ── */}
                    <div className="rounded-xl p-5" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        <h3 className="text-sm font-bold mb-4" style={{ color: T.text }}>Evolução Diária</h3>
                        {data.dailyTimeline.length > 0 ? (
                            <div className="flex items-end gap-[2px] h-28">
                                {data.dailyTimeline.slice(-30).map((day, i) => {
                                    const max = Math.max(...data.dailyTimeline.map(d => d.views + d.clicks), 1)
                                    const total = day.views + day.clicks
                                    const pct = (total / max) * 100
                                    return (
                                        <div
                                            key={i}
                                            className="flex-1 rounded-t transition-all hover:opacity-80 relative group"
                                            style={{
                                                height: `${Math.max(pct, 3)}%`,
                                                background: total > 0 ? (day.leads > 0 ? '#34d399' : T.accent) : T.hover,
                                                minWidth: 3,
                                            }}
                                            title={`${day.day}: ${day.views} views, ${day.clicks} cliques, ${day.leads} leads`}
                                        />
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-center py-8" style={{ color: T.textMuted }}>Sem dados no período</p>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: T.accent }} />
                                <span className="text-[10px]" style={{ color: T.textMuted }}>Views + Cliques</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#34d399' }} />
                                <span className="text-[10px]" style={{ color: T.textMuted }}>Dia com Lead</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Source + Device Row ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* By Source */}
                        <div className="rounded-xl p-5" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <h3 className="text-sm font-bold mb-4" style={{ color: T.text }}>Tráfego por Origem</h3>
                            <div className="space-y-3">
                                {data.bySource.length > 0 ? data.bySource.map(item => {
                                    const maxTotal = Math.max(...data.bySource.map(s => s.total), 1)
                                    const pct = Math.round((item.total / maxTotal) * 100)
                                    return (
                                        <div key={item.name}>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs font-semibold capitalize" style={{ color: T.text }}>
                                                    {item.name}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px]" style={{ color: T.textMuted }}>
                                                        {item.sessions}s · {item.clicks}c · {item.leads}l
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="h-1.5 rounded-full" style={{ background: T.hover }}>
                                                <div
                                                    className="h-full rounded-full transition-all duration-700"
                                                    style={{ width: `${pct}%`, background: T.accent }}
                                                />
                                            </div>
                                        </div>
                                    )
                                }) : (
                                    <p className="text-xs text-center py-6" style={{ color: T.textMuted }}>Sem dados</p>
                                )}
                            </div>
                        </div>

                        {/* By Device */}
                        <div className="rounded-xl p-5" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <h3 className="text-sm font-bold mb-4" style={{ color: T.text }}>Sessões por Dispositivo</h3>
                            <div className="space-y-3">
                                {data.byDevice.length > 0 ? data.byDevice.map(item => {
                                    const Icon = deviceIcons[item.name.toLowerCase()] || Monitor
                                    return (
                                        <div key={item.name}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                                                        style={{ background: T.accentBg }}
                                                    >
                                                        <Icon size={13} style={{ color: T.accent }} />
                                                    </div>
                                                    <span className="text-xs font-semibold capitalize" style={{ color: T.text }}>
                                                        {item.name}
                                                    </span>
                                                </div>
                                                <span
                                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                                    style={{ background: T.accentBg, color: T.accent }}
                                                >
                                                    {item.value} ({item.percentage}%)
                                                </span>
                                            </div>
                                            <div className="h-1.5 rounded-full" style={{ background: T.hover }}>
                                                <div
                                                    className="h-full rounded-full transition-all duration-700"
                                                    style={{ width: `${item.percentage}%`, background: '#627D98' }}
                                                />
                                            </div>
                                        </div>
                                    )
                                }) : (
                                    <p className="text-xs text-center py-6" style={{ color: T.textMuted }}>Sem dados</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Top Pages + Properties Row ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Top Pages */}
                        <div className="rounded-xl p-5" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <h3 className="text-sm font-bold mb-4" style={{ color: T.text }}>Páginas Mais Visitadas</h3>
                            <div className="space-y-2">
                                {data.topPages.length > 0 ? data.topPages.slice(0, 8).map((p, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between py-2 px-3 rounded-lg"
                                        style={{ background: i % 2 === 0 ? T.surface : 'transparent' }}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <FileText size={12} style={{ color: T.textMuted }} />
                                            <span className="text-xs font-medium truncate" style={{ color: T.text }}>
                                                {p.page}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-[10px] font-bold" style={{ color: T.accent }}>
                                                {p.views}
                                            </span>
                                            <span className="text-[10px]" style={{ color: T.textMuted }}>
                                                {formatDuration(p.avgDuration)}
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-xs text-center py-6" style={{ color: T.textMuted }}>Sem dados</p>
                                )}
                            </div>
                        </div>

                        {/* Top Properties */}
                        <div className="rounded-xl p-5" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <h3 className="text-sm font-bold mb-4" style={{ color: T.text }}>Imóveis Mais Visualizados</h3>
                            <div className="space-y-2">
                                {data.topProperties.length > 0 ? data.topProperties.map((p, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between py-2.5 px-3 rounded-lg"
                                        style={{ background: T.surface }}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <div
                                                className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
                                                style={{ background: T.accentBg, color: T.accent }}
                                            >
                                                #{i + 1}
                                            </div>
                                            <span className="text-xs font-semibold truncate" style={{ color: T.text }}>
                                                {p.slug.replace(/-/g, ' ')}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: T.accentBg, color: T.accent }}>
                                            {p.views} views
                                        </span>
                                    </div>
                                )) : (
                                    <p className="text-xs text-center py-6" style={{ color: T.textMuted }}>
                                        Nenhum imóvel visualizado ainda
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Top Campaigns ── */}
                    <div className="rounded-xl p-5" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        <h3 className="text-sm font-bold mb-4" style={{ color: T.text }}>Top Campanhas</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                        <th className="text-left py-2 px-3 text-[10px] font-bold uppercase" style={{ color: T.textMuted }}>Campanha</th>
                                        <th className="text-center py-2 px-3 text-[10px] font-bold uppercase" style={{ color: T.textMuted }}>Cliques</th>
                                        <th className="text-center py-2 px-3 text-[10px] font-bold uppercase" style={{ color: T.textMuted }}>Leads</th>
                                        <th className="text-center py-2 px-3 text-[10px] font-bold uppercase" style={{ color: T.textMuted }}>Conv. %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.topCampaigns.length > 0 ? data.topCampaigns.map((c, i) => (
                                        <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                                            <td className="py-2.5 px-3 text-xs font-medium" style={{ color: T.text }}>{c.campaign}</td>
                                            <td className="py-2.5 px-3 text-center text-xs" style={{ color: T.textMuted }}>{c.clicks}</td>
                                            <td className="py-2.5 px-3 text-center text-xs" style={{ color: T.textMuted }}>{c.leads}</td>
                                            <td className="py-2.5 px-3 text-center">
                                                <span
                                                    className="px-2 py-0.5 rounded text-[10px] font-bold"
                                                    style={{
                                                        background: c.conversionRate >= 5 ? 'rgba(52,211,153,0.1)' : T.accentBg,
                                                        color: c.conversionRate >= 5 ? '#34d399' : T.accent,
                                                    }}
                                                >
                                                    {c.conversionRate}%
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="py-6 text-center text-xs" style={{ color: T.textMuted }}>
                                                Nenhuma campanha no período
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <BarChart3 size={36} className="opacity-30" style={{ color: T.textMuted }} />
                    <p className="text-sm" style={{ color: T.textMuted }}>Erro ao carregar analytics</p>
                    <button onClick={load} className="text-xs font-semibold px-4 py-2 rounded-xl" style={{ color: T.accent }}>
                        Tentar novamente
                    </button>
                </div>
            )}
        </div>
    )
}
