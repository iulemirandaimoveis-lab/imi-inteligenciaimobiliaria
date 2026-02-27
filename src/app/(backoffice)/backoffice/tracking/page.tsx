'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Link2, QrCode, MousePointer, Eye, Clock, TrendingUp,
    Smartphone, Monitor, Tablet, MapPin, ExternalLink,
    BarChart3, Loader2, RefreshCw
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    border: 'var(--bo-border)',
    hover: 'var(--bo-hover)',
    accent: '#C49D5B',
    accentBg: 'rgba(196,157,91,0.10)',
}

interface Analytics {
    totalClicks: number
    totalLinks: number
    clicksBySource: Array<{ name: string; value: number; percentage: number }>
    clicksByDevice: Array<{ name: string; value: number; percentage: number }>
    clicksByDay: Array<{ day: string; clicks: number }>
    topCampaigns: Array<{ campaign: string; clicks: number; conversions: number; conversionRate: number }>
    topLocations: Array<{ city: string; clicks: number }>
}

export default function TrackingDashboardPage() {
    const router = useRouter()
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
    const [loading, setLoading] = useState(true)
    const [analytics, setAnalytics] = useState<Analytics | null>(null)

    useEffect(() => { loadAnalytics() }, [timeRange])

    const loadAnalytics = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/qr/analytics?time_range=${timeRange}`)
            const data = await res.json()
            if (res.ok) setAnalytics(data)
        } catch (err) {
            console.error('Error loading analytics:', err)
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
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>Tracking & Analytics</h1>
                    <p className="text-sm mt-1" style={{ color: T.textMuted }}>
                        Monitore o desempenho dos seus links e campanhas
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => router.push('/backoffice/tracking/qr')}
                        className="h-10 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 text-white transition-all"
                        style={{ background: T.accent, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                    >
                        <QrCode size={16} />
                        Novo QR Code
                    </button>
                    <button
                        onClick={() => router.push('/backoffice/tracking/links')}
                        className="h-10 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                    >
                        <Link2 size={16} />
                        Gerenciar Links
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
                            className="h-9 px-4 rounded-xl text-xs font-semibold transition-all"
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
                    onClick={loadAnalytics}
                    className="h-9 w-9 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                >
                    <RefreshCw size={14} style={{ color: T.textMuted }} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 size={32} className="animate-spin" style={{ color: T.accent }} />
                </div>
            ) : analytics ? (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { icon: MousePointer, label: 'Total de Cliques', value: analytics.totalClicks.toLocaleString('pt-BR'), color: 'var(--s-cold, #60a5fa)' },
                            { icon: Link2, label: 'Links Ativos', value: analytics.totalLinks.toLocaleString('pt-BR'), color: 'var(--s-done, #34d399)' },
                            { icon: TrendingUp, label: 'Top Campanha', value: analytics.topCampaigns[0]?.campaign || 'N/A', color: 'var(--s-warm, #fbbf24)' },
                            { icon: MapPin, label: 'Top Localização', value: analytics.topLocations[0]?.city || 'N/A', color: 'var(--s-pend, #a78bfa)' },
                        ].map(({ icon: Icon, label, value, color }) => (
                            <div
                                key={label}
                                className="rounded-xl p-5 transition-all"
                                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon size={18} style={{ color }} />
                                    <span className="text-xs font-medium" style={{ color: T.textMuted }}>{label}</span>
                                </div>
                                <div className="text-2xl font-bold truncate" style={{ color: T.text }}>
                                    {value}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* By Source */}
                        <div className="rounded-xl p-6" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <h3 className="text-sm font-bold mb-5" style={{ color: T.text }}>Cliques por Origem</h3>
                            <div className="space-y-4">
                                {analytics.clicksBySource.length > 0 ? analytics.clicksBySource.map(item => (
                                    <div key={item.name}>
                                        <div className="flex justify-between mb-1.5">
                                            <span className="text-xs font-semibold capitalize" style={{ color: T.text }}>{item.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold" style={{ color: T.textMuted }}>{item.percentage}%</span>
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: T.accentBg, color: T.accent }}>
                                                    {item.value}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 rounded-full" style={{ background: T.hover }}>
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${item.percentage}%`, background: T.accent }}
                                            />
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-xs text-center py-8" style={{ color: T.textMuted }}>Sem dados no período</p>
                                )}
                            </div>
                        </div>

                        {/* By Device */}
                        <div className="rounded-xl p-6" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <h3 className="text-sm font-bold mb-5" style={{ color: T.text }}>Cliques por Dispositivo</h3>
                            <div className="space-y-4">
                                {analytics.clicksByDevice.length > 0 ? analytics.clicksByDevice.map(item => {
                                    const Icon = deviceIcons[item.name.toLowerCase()] || Monitor
                                    return (
                                        <div key={item.name}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: T.accentBg }}>
                                                        <Icon size={14} style={{ color: T.accent }} />
                                                    </div>
                                                    <span className="text-xs font-semibold capitalize" style={{ color: T.text }}>{item.name}</span>
                                                </div>
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: T.accentBg, color: T.accent }}>
                                                    {item.value} ({item.percentage}%)
                                                </span>
                                            </div>
                                            <div className="h-1.5 rounded-full" style={{ background: T.hover }}>
                                                <div
                                                    className="h-full rounded-full transition-all duration-700"
                                                    style={{ width: `${item.percentage}%`, background: '#60a5fa' }}
                                                />
                                            </div>
                                        </div>
                                    )
                                }) : (
                                    <p className="text-xs text-center py-8" style={{ color: T.textMuted }}>Sem dados no período</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Daily Timeline */}
                    <div className="rounded-xl p-6" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        <h3 className="text-sm font-bold mb-5" style={{ color: T.text }}>Evolução Diária</h3>
                        {analytics.clicksByDay.length > 0 ? (
                            <div className="flex items-end gap-1 h-32">
                                {analytics.clicksByDay.slice(-30).map((day, i) => {
                                    const max = Math.max(...analytics.clicksByDay.map(d => d.clicks), 1)
                                    const pct = (day.clicks / max) * 100
                                    return (
                                        <div
                                            key={i}
                                            className="flex-1 rounded-t transition-all hover:opacity-80 group relative"
                                            style={{
                                                height: `${Math.max(pct, 4)}%`,
                                                background: day.clicks > 0 ? T.accent : T.hover,
                                                minWidth: 4,
                                            }}
                                            title={`${day.day}: ${day.clicks} cliques`}
                                        />
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-center py-8" style={{ color: T.textMuted }}>Sem dados no período</p>
                        )}
                    </div>

                    {/* Top Campaigns */}
                    <div className="rounded-xl p-6" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        <h3 className="text-sm font-bold mb-5" style={{ color: T.text }}>Top Campanhas</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                        <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Campanha</th>
                                        <th className="text-center py-2 px-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Cliques</th>
                                        <th className="text-center py-2 px-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Conversões</th>
                                        <th className="text-center py-2 px-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Conv. %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.topCampaigns.length > 0 ? analytics.topCampaigns.map((c, i) => (
                                        <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                                            <td className="py-3 px-3 text-sm font-medium" style={{ color: T.text }}>{c.campaign}</td>
                                            <td className="py-3 px-3 text-center text-sm" style={{ color: T.textMuted }}>{c.clicks}</td>
                                            <td className="py-3 px-3 text-center text-sm" style={{ color: T.textMuted }}>{c.conversions}</td>
                                            <td className="py-3 px-3 text-center">
                                                <span
                                                    className="px-2 py-0.5 rounded text-xs font-bold"
                                                    style={{
                                                        background: c.conversionRate >= 5 ? 'var(--s-done-bg, rgba(52,211,153,0.1))' : T.accentBg,
                                                        color: c.conversionRate >= 5 ? 'var(--s-done, #34d399)' : T.accent,
                                                    }}
                                                >
                                                    {c.conversionRate}%
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-xs" style={{ color: T.textMuted }}>
                                                Nenhuma campanha no período
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Top Locations */}
                    {analytics.topLocations.length > 0 && (
                        <div className="rounded-xl p-6" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <h3 className="text-sm font-bold mb-5" style={{ color: T.text }}>Geolocalização</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {analytics.topLocations.map((loc, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 p-3 rounded-xl"
                                        style={{ background: T.hover, border: `1px solid ${T.border}` }}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                                            style={{ background: T.accentBg, color: T.accent }}
                                        >
                                            #{i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{loc.city}</p>
                                            <div className="flex items-center gap-1">
                                                <MapPin size={10} style={{ color: T.textMuted }} />
                                                <span className="text-[10px]" style={{ color: T.textMuted }}>{loc.clicks} cliques</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <BarChart3 size={40} className="opacity-30" style={{ color: T.textMuted }} />
                    <p className="text-sm" style={{ color: T.textMuted }}>Erro ao carregar analytics</p>
                    <button
                        onClick={loadAnalytics}
                        className="text-sm font-semibold px-4 py-2 rounded-xl"
                        style={{ color: T.accent }}
                    >
                        Tentar novamente
                    </button>
                </div>
            )}
        </div>
    )
}
