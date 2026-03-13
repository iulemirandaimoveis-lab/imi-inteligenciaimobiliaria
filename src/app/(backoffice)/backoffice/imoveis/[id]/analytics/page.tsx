'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft, MousePointer, Users, Clock, Target,
    MapPin, Loader2, BarChart3, Link2, TrendingUp,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'

interface AnalyticsData {
    development: { id: string; name: string; slug?: string; city?: string; state?: string; neighborhood?: string }
    kpis: {
        totalClicks: number; totalEvents: number; totalLeads: number
        convertedLeads: number; taxaConversao: number; trackedLinksCount: number
    }
    performanceTemporal: { date: string; views: number; clicks: number; leads: number }[]
    fontesTrafico: { source: string; visits: number; percentage: number }[]
    devices: Record<string, number>
    topLocations: { city: string; percentage: number }[]
    topCampaigns: { name: string; clicks: number; leads: number }[]
    timeRange: string
}

export default function ImovelAnalyticsPage() {
    const params = useParams()
    const router = useRouter()
    const [periodoFilter, setPeriodoFilter] = useState('30d')
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchAnalytics() {
            setLoading(true)
            try {
                const res = await fetch(`/api/developments/analytics?id=${params.id}&range=${periodoFilter}`)
                if (!res.ok) throw new Error('Falha ao carregar')
                const result = await res.json()
                setData(result)
            } catch (err) {
                console.error('Erro ao buscar analytics:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchAnalytics()
    }, [params.id, periodoFilter])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: T.accent }} />
            </div>
        )
    }

    if (!data) {
        return (
            <div className="text-center py-32" style={{ color: T.textDim }}>
                <BarChart3 size={40} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm">Nenhum dado de analytics encontrado</p>
                <button onClick={() => router.back()}
                    className="mt-4 text-sm font-semibold px-4 py-2 rounded-xl" style={{ color: T.accent }}>
                    Voltar
                </button>
            </div>
        )
    }

    const { kpis, performanceTemporal, fontesTrafico, devices, topLocations, topCampaigns, development } = data
    const location = [development.neighborhood, development.city, development.state].filter(Boolean).join(', ') || '—'

    const KPI_CARDS = [
        { label: 'Total Cliques', value: kpis.totalClicks.toLocaleString('pt-BR'), icon: MousePointer, color: '#A89EC4' },
        { label: 'Links Ativos', value: kpis.trackedLinksCount, icon: Link2, color: 'var(--bo-accent)' },
        { label: 'Leads Gerados', value: kpis.totalLeads, icon: Users, color: '#E8A87C' },
        { label: 'Conversões', value: kpis.convertedLeads, icon: Target, color: 'var(--bo-success)' },
        { label: 'Taxa Conversão', value: `${kpis.taxaConversao}%`, icon: TrendingUp, color: 'var(--bo-accent)' },
        { label: 'Eventos', value: kpis.totalEvents, icon: BarChart3, color: '#A89EC4' },
    ]

    // Chart helpers
    const maxDailyClicks = Math.max(...performanceTemporal.map(d => d.clicks), 1)
    const maxDailyLeads = Math.max(...performanceTemporal.map(d => d.leads), 1)

    // Device totals
    const totalDeviceHits = Object.values(devices).reduce((s, v) => s + v, 0) || 1
    const deviceList = Object.entries(devices)
        .sort((a, b) => b[1] - a[1])
        .map(([device, count]) => ({
            device: device === 'mobile' ? 'Mobile' : device === 'desktop' ? 'Desktop' : device === 'tablet' ? 'Tablet' : device,
            count,
            percentage: Math.round((count / totalDeviceHits) * 100),
        }))

    const periodLabel = periodoFilter === '7d' ? '7' : periodoFilter === '90d' ? '90' : '30'

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Back nav */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.push(`/backoffice/imoveis/${params.id}`)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textDim }}
                >
                    <ArrowLeft size={17} />
                </button>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: T.textMuted }}>
                    {development.name} / Analytics
                </span>
            </div>

            {/* Header */}
            <PageIntelHeader
                moduleLabel="PERFORMANCE ANALYTICS"
                title={`Analytics · ${development.name}`}
                subtitle={`${location} · Últimos ${periodLabel} dias`}
                live
                actions={
                    <select
                        value={periodoFilter}
                        onChange={e => setPeriodoFilter(e.target.value)}
                        className="h-10 px-4 rounded-xl text-sm outline-none"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                    >
                        <option value="7d">Últimos 7 dias</option>
                        <option value="30d">Últimos 30 dias</option>
                        <option value="90d">Últimos 90 dias</option>
                    </select>
                }
            />

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {KPI_CARDS.map(k => (
                    <div
                        key={k.label}
                        className="rounded-2xl p-4"
                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                    >
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                            style={{ background: `${k.color}18` }}
                        >
                            <k.icon size={15} style={{ color: k.color }} />
                        </div>
                        <p className="text-2xl font-bold" style={{ color: T.text }}>{k.value}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: T.textDim }}>
                            {k.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* Performance Chart — Bloomberg bar chart style */}
            <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: T.textMuted }}>
                            Performance Temporal
                        </p>
                        <h2 className="text-base font-bold" style={{ color: T.text }}>
                            Cliques & Leads · Últimos {periodLabel} Dias
                        </h2>
                    </div>
                    <div className="flex items-center gap-4 text-[11px]">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: T.accent }} />
                            <span style={{ color: T.textDim }}>Cliques</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--bo-success)' }} />
                            <span style={{ color: T.textDim }}>Leads</span>
                        </div>
                    </div>
                </div>
                {performanceTemporal.length === 0 || performanceTemporal.every(d => d.clicks === 0) ? (
                    <div className="text-center py-12" style={{ color: T.textDim }}>
                        <BarChart3 size={28} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhum dado de tracking nesse período</p>
                        <p className="text-xs mt-1">Crie links rastreáveis em Tracking → QR Code</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {performanceTemporal.slice(-14).map((day, idx) => {
                            const clickWidth = (day.clicks / maxDailyClicks) * 100
                            const leadWidth = maxDailyLeads > 0 ? (day.leads / maxDailyLeads) * 100 : 0
                            return (
                                <div key={idx} className="grid grid-cols-[72px_1fr_auto] items-center gap-3">
                                    <span className="text-[11px] font-medium text-right" style={{ color: T.textDim }}>
                                        {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                    </span>
                                    <div className="space-y-1">
                                        {/* Clicks bar */}
                                        <div className="h-2 rounded-full overflow-hidden" style={{ background: `${T.accent}15` }}>
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{ width: `${clickWidth}%`, background: T.accent }}
                                            />
                                        </div>
                                        {/* Leads bar */}
                                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(107,184,123,0.15)' }}>
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{ width: `${leadWidth}%`, background: 'var(--bo-success)' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-right min-w-[56px]">
                                        <div className="text-[11px] font-bold" style={{ color: T.text }}>{day.clicks}</div>
                                        {day.leads > 0 && (
                                            <div className="text-[10px] font-semibold" style={{ color: 'var(--bo-success)' }}>{day.leads}L</div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Sources + Locations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Traffic Sources */}
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: T.textMuted }}>
                        Fontes de Tráfego
                    </p>
                    <h3 className="text-sm font-bold mb-5" style={{ color: T.text }}>Origem dos Acessos</h3>
                    {fontesTrafico.length === 0 ? (
                        <p className="text-sm py-8 text-center" style={{ color: T.textDim }}>Sem dados de fonte</p>
                    ) : (
                        <div className="space-y-4">
                            {fontesTrafico.map((f, idx) => (
                                <div key={idx}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm font-semibold" style={{ color: T.text }}>{f.source}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold" style={{ color: T.text }}>{f.visits}</span>
                                            <span
                                                className="text-xs font-bold px-2 py-0.5 rounded-full"
                                                style={{ background: `${T.accent}18`, color: T.accent }}
                                            >
                                                {f.percentage}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${T.accent}15` }}>
                                        <div className="h-full rounded-full" style={{ width: `${f.percentage}%`, background: T.accent }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Locations */}
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: T.textMuted }}>
                        Localização
                    </p>
                    <h3 className="text-sm font-bold mb-5" style={{ color: T.text }}>Top Localizações</h3>
                    {topLocations.length === 0 ? (
                        <p className="text-sm py-8 text-center" style={{ color: T.textDim }}>Sem dados de localização</p>
                    ) : (
                        <div className="space-y-2">
                            {topLocations.map((loc, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 rounded-xl"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ background: `${T.accent}18` }}
                                        >
                                            <MapPin size={12} style={{ color: T.accent }} />
                                        </div>
                                        <span className="text-sm font-medium" style={{ color: T.text }}>{loc.city}</span>
                                    </div>
                                    <span
                                        className="text-sm font-bold px-2 py-0.5 rounded-lg"
                                        style={{ background: `${T.accent}15`, color: T.accent }}
                                    >
                                        {loc.percentage}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Devices + Campaigns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Devices */}
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: T.textMuted }}>
                        Dispositivos
                    </p>
                    <h3 className="text-sm font-bold mb-5" style={{ color: T.text }}>Breakdown por Dispositivo</h3>
                    {deviceList.length === 0 ? (
                        <p className="text-sm py-8 text-center" style={{ color: T.textDim }}>Sem dados de dispositivo</p>
                    ) : (
                        <div className="space-y-4">
                            {deviceList.map((d, idx) => (
                                <div key={idx}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm font-semibold" style={{ color: T.text }}>{d.device}</span>
                                        <span className="text-sm font-bold" style={{ color: T.text }}>{d.percentage}%</span>
                                    </div>
                                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(168,158,196,0.15)' }}>
                                        <div className="h-full rounded-full" style={{ width: `${d.percentage}%`, background: '#A89EC4' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Campaigns */}
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: T.textMuted }}>
                        Campanhas
                    </p>
                    <h3 className="text-sm font-bold mb-5" style={{ color: T.text }}>Top Campanhas</h3>
                    {topCampaigns.length === 0 ? (
                        <p className="text-sm py-8 text-center" style={{ color: T.textDim }}>Nenhuma campanha rastreada</p>
                    ) : (
                        <div className="space-y-2">
                            {topCampaigns.map((c, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3.5 rounded-xl"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div
                                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                            style={{ background: `${T.accent}18`, color: T.accent }}
                                        >
                                            {idx + 1}
                                        </div>
                                        <span className="text-sm font-medium truncate" style={{ color: T.text }}>{c.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0 ml-3">
                                        <div className="text-right">
                                            <div className="text-xs font-bold" style={{ color: T.text }}>{c.clicks}</div>
                                            <div className="text-[10px]" style={{ color: T.textDim }}>cliques</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold" style={{ color: 'var(--bo-success)' }}>{c.leads}</div>
                                            <div className="text-[10px]" style={{ color: T.textDim }}>leads</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
