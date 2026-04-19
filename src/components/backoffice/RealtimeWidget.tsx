'use client'

// =============================================================================
// RealtimeWidget — Visitantes Ativos em Tempo Real
// =============================================================================
// Substitui: GA4 Real-Time tab, Hotjar Live Feed, Plausible Live Visitors
//
// Mostra:
//   • Visitantes ao vivo (último minuto)
//   • Sessões ativas nos últimos 5 min
//   • Top páginas em tempo real
//   • Feed de eventos ao vivo
//   • Atividade por minuto (sparkline)
//   • Breakdown por source e dispositivo
//
// Auto-atualiza a cada 30s (sem WebSocket — polling leve)
// =============================================================================

import { useState, useEffect, useCallback } from 'react'
import { Activity, Users, Globe, Monitor, Smartphone, Tablet, Eye, RefreshCw } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { T } from '@/app/(backoffice)/lib/theme'

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface RealtimeData {
    activeSessions: number
    activeVisitors: number
    liveNow: number
    last30: {
        sessions:    number
        pageViews:   number
        clicks:      number
        formSubmits: number
    }
    topPages: Array<{ path: string; title: string | null; views: number }>
    topSources: Array<{ source: string; sessions: number }>
    byCountry: Array<{ country: string; events: number }>
    byDevice: Array<{ device: string; count: number }>
    activityByMinute: Array<{ minute: string; events: number }>
    liveFeed: Array<{
        id:      string
        session: string
        type:    string
        label:   string
        name:    string | null
        page:    string
        country: string | null
        device:  string
        browser: string | null
        at:      string
    }>
    updatedAt: string
}

const DEVICE_ICONS: Record<string, React.ElementType> = {
    mobile:  Smartphone,
    tablet:  Tablet,
    desktop: Monitor,
}

const EVENT_TYPE_COLORS: Record<string, string> = {
    page_view:         '#486581',
    cta_click:         '#C8A44A',
    form_submit:       '#6BB87B',
    scroll:            '#7B9EC4',
    engagement:        '#A89EC4',
    external_link:     '#E8A87C',
    lead:              '#E57373',
    backoffice_action: '#81C784',
}

function formatMinute(iso: string): string {
    try {
        const d = new Date(iso)
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    } catch { return iso.slice(11, 16) }
}

function timeAgo(iso: string): string {
    const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 60) return `${diff}s`
    if (diff < 3600) return `${Math.round(diff / 60)}min`
    return `${Math.round(diff / 3600)}h`
}

// ── Componente Principal ──────────────────────────────────────────────────────

export default function RealtimeWidget() {
    const [data, setData]       = useState<RealtimeData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError]     = useState<string | null>(null)
    const [lastFetch, setLastFetch] = useState<Date | null>(null)

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/analytics/realtime', { cache: 'no-store' })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const json = await res.json()
            setData(json)
            setError(null)
            setLastFetch(new Date())
        } catch (err) {
            setError('Não foi possível carregar os dados em tempo real.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 30_000) // atualiza a cada 30s
        return () => clearInterval(interval)
    }, [fetchData])

    if (loading) {
        return (
            <div
                className="rounded-xl border flex items-center justify-center h-48"
                style={{ borderColor: T.border, background: T.surface }}
            >
                <RefreshCw className="animate-spin text-gray-500" size={20} />
            </div>
        )
    }

    if (error || !data) {
        return (
            <div
                className="rounded-xl border p-6 text-center"
                style={{ borderColor: T.border, background: T.surface }}
            >
                <p style={{ color: T.textMuted }} className="text-sm">
                    {error || 'Sem dados de tempo real disponíveis.'}
                </p>
                <button
                    onClick={fetchData}
                    className="mt-3 text-xs px-3 py-1 rounded"
                    style={{ background: T.surfaceAlt, color: T.text }}
                >
                    Tentar novamente
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                    </span>
                    <h3 className="text-sm font-semibold" style={{ color: T.text }}>
                        Ao Vivo Agora
                    </h3>
                    {lastFetch && (
                        <span className="text-xs" style={{ color: T.textMuted }}>
                            · atualizado há {timeAgo(lastFetch.toISOString())}
                        </span>
                    )}
                </div>
                <button
                    onClick={fetchData}
                    className="p-1.5 rounded hover:opacity-70 transition-opacity"
                    style={{ color: T.textMuted }}
                    title="Atualizar"
                >
                    <RefreshCw size={13} />
                </button>
            </div>

            {/* KPIs Principais */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Ao vivo */}
                <div
                    className="rounded-xl border p-4 flex flex-col gap-1"
                    style={{ borderColor: 'rgba(107,184,123,0.3)', background: 'rgba(107,184,123,0.06)' }}
                >
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs" style={{ color: T.textMuted }}>Agora (1 min)</span>
                    </div>
                    <span className="text-3xl font-bold" style={{ color: '#6BB87B' }}>
                        {data.liveNow}
                    </span>
                    <span className="text-xs" style={{ color: T.textMuted }}>sessões ativas</span>
                </div>

                {/* 5 min */}
                <div
                    className="rounded-xl border p-4 flex flex-col gap-1"
                    style={{ borderColor: T.border, background: T.surface }}
                >
                    <div className="flex items-center gap-1.5">
                        <Users size={12} style={{ color: T.textMuted }} />
                        <span className="text-xs" style={{ color: T.textMuted }}>Últimos 5 min</span>
                    </div>
                    <span className="text-3xl font-bold" style={{ color: T.text }}>
                        {data.activeSessions}
                    </span>
                    <span className="text-xs" style={{ color: T.textMuted }}>sessões</span>
                </div>

                {/* 30 min page views */}
                <div
                    className="rounded-xl border p-4 flex flex-col gap-1"
                    style={{ borderColor: T.border, background: T.surface }}
                >
                    <div className="flex items-center gap-1.5">
                        <Eye size={12} style={{ color: T.textMuted }} />
                        <span className="text-xs" style={{ color: T.textMuted }}>30 min — Pageviews</span>
                    </div>
                    <span className="text-3xl font-bold" style={{ color: T.text }}>
                        {data.last30.pageViews}
                    </span>
                    <span className="text-xs" style={{ color: T.textMuted }}>visualizações</span>
                </div>

                {/* 30 min form submits */}
                <div
                    className="rounded-xl border p-4 flex flex-col gap-1"
                    style={{ borderColor: T.border, background: T.surface }}
                >
                    <div className="flex items-center gap-1.5">
                        <Activity size={12} style={{ color: T.textMuted }} />
                        <span className="text-xs" style={{ color: T.textMuted }}>30 min — Forms</span>
                    </div>
                    <span className="text-3xl font-bold" style={{ color: '#C8A44A' }}>
                        {data.last30.formSubmits}
                    </span>
                    <span className="text-xs" style={{ color: T.textMuted }}>formulários</span>
                </div>
            </div>

            {/* Sparkline de atividade */}
            {data.activityByMinute.length > 0 && (
                <div
                    className="rounded-xl border p-4"
                    style={{ borderColor: T.border, background: T.surface }}
                >
                    <p className="text-xs mb-3" style={{ color: T.textMuted }}>
                        Atividade — últimos 30 minutos
                    </p>
                    <ResponsiveContainer width="100%" height={60}>
                        <AreaChart data={data.activityByMinute}>
                            <defs>
                                <linearGradient id="rtGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#6BB87B" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6BB87B" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="minute"
                                tickFormatter={formatMinute}
                                tick={{ fontSize: 9, fill: 'rgba(142,153,171,0.6)' }}
                                interval="preserveStartEnd"
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{ background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11 }}
                                labelFormatter={formatMinute}
                                formatter={(v: number) => [`${v} eventos`, '']}
                            />
                            <Area
                                type="monotone"
                                dataKey="events"
                                stroke="#6BB87B"
                                strokeWidth={1.5}
                                fill="url(#rtGrad)"
                                dot={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Linha inferior: Top Páginas + Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top Páginas ao vivo */}
                <div
                    className="rounded-xl border p-4"
                    style={{ borderColor: T.border, background: T.surface }}
                >
                    <p className="text-xs font-medium mb-3" style={{ color: T.textMuted }}>
                        Páginas mais visitadas agora
                    </p>
                    {data.topPages.length === 0 ? (
                        <p className="text-xs" style={{ color: T.textDim }}>Nenhuma visualização recente</p>
                    ) : (
                        <ul className="space-y-2">
                            {data.topPages.slice(0, 8).map((p, i) => (
                                <li key={p.path} className="flex items-center gap-2">
                                    <span
                                        className="text-xs w-4 text-right shrink-0"
                                        style={{ color: T.textDim }}
                                    >
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className="text-xs truncate"
                                            style={{ color: T.text }}
                                            title={p.path}
                                        >
                                            {p.path === '/' ? 'Home' : p.path}
                                        </p>
                                    </div>
                                    <span
                                        className="text-xs font-medium shrink-0"
                                        style={{ color: T.textMuted }}
                                    >
                                        {p.views}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Feed ao vivo */}
                <div
                    className="rounded-xl border p-4"
                    style={{ borderColor: T.border, background: T.surface }}
                >
                    <p className="text-xs font-medium mb-3" style={{ color: T.textMuted }}>
                        Feed de eventos ao vivo
                    </p>
                    {data.liveFeed.length === 0 ? (
                        <p className="text-xs" style={{ color: T.textDim }}>Nenhum evento recente</p>
                    ) : (
                        <ul className="space-y-2 max-h-56 overflow-y-auto">
                            {data.liveFeed.map((e) => {
                                const DeviceIcon = DEVICE_ICONS[e.device] || Monitor
                                const dotColor = EVENT_TYPE_COLORS[e.type] || '#8E99AB'
                                return (
                                    <li key={e.id} className="flex items-start gap-2">
                                        <span
                                            className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                                            style={{ background: dotColor }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs truncate" style={{ color: T.text }}>
                                                <span style={{ color: dotColor }}>{e.label}</span>
                                                {e.name && e.name !== e.type && (
                                                    <span style={{ color: T.textMuted }}> · {e.name}</span>
                                                )}
                                            </p>
                                            <p className="text-xs" style={{ color: T.textDim }}>
                                                {e.page === '/' ? 'Home' : e.page.slice(0, 40)}
                                                {e.country && ` · ${e.country}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <DeviceIcon size={10} style={{ color: T.textDim }} />
                                            <span className="text-xs" style={{ color: T.textDim }}>
                                                {timeAgo(e.at)}
                                            </span>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {/* Fontes e Países */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Top Fontes */}
                {data.topSources.length > 0 && (
                    <div
                        className="rounded-xl border p-4"
                        style={{ borderColor: T.border, background: T.surface }}
                    >
                        <p className="text-xs font-medium mb-3" style={{ color: T.textMuted }}>
                            Fontes de tráfego agora
                        </p>
                        <ul className="space-y-2">
                            {data.topSources.map(s => (
                                <li key={s.source} className="flex items-center justify-between gap-2">
                                    <span className="text-xs capitalize" style={{ color: T.text }}>
                                        {s.source}
                                    </span>
                                    <span className="text-xs" style={{ color: T.textMuted }}>
                                        {s.sessions} sess.
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Top Países */}
                {data.byCountry.length > 0 && (
                    <div
                        className="rounded-xl border p-4"
                        style={{ borderColor: T.border, background: T.surface }}
                    >
                        <p className="text-xs font-medium mb-3" style={{ color: T.textMuted }}>
                            <Globe size={11} className="inline mr-1" />
                            Países
                        </p>
                        <ul className="space-y-2">
                            {data.byCountry.slice(0, 6).map(c => (
                                <li key={c.country} className="flex items-center justify-between gap-2">
                                    <span className="text-xs" style={{ color: T.text }}>
                                        {c.country}
                                    </span>
                                    <span className="text-xs" style={{ color: T.textMuted }}>
                                        {c.events}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}
