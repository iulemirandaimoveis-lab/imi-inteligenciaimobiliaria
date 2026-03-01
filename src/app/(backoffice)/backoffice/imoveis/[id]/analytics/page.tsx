'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft, MousePointer, Users, Clock, Target,
    MapPin, Loader2, BarChart3, Link2, TrendingUp,
} from 'lucide-react'

const T = {
    bg: 'transparent', surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)', textDim: 'var(--bo-text-muted)',
    gold: '#486581',
}

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
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: T.gold }} />
            </div>
        )
    }

    if (!data) {
        return (
            <div className="text-center py-32" style={{ color: T.textDim }}>
                <BarChart3 size={40} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm">Nenhum dado de analytics encontrado</p>
                <button onClick={() => router.back()}
                    className="mt-4 text-sm font-semibold px-4 py-2 rounded-xl" style={{ color: T.gold }}>
                    Voltar
                </button>
            </div>
        )
    }

    const { kpis, performanceTemporal, fontesTrafico, devices, topLocations, topCampaigns, development } = data
    const location = [development.neighborhood, development.city, development.state].filter(Boolean).join(', ') || '—'

    const KPI_CARDS = [
        { label: 'Total Cliques', value: kpis.totalClicks.toLocaleString('pt-BR'), icon: MousePointer, color: '#A89EC4' },
        { label: 'Links Ativos', value: kpis.trackedLinksCount, icon: Link2, color: '#486581' },
        { label: 'Leads Gerados', value: kpis.totalLeads, icon: Users, color: '#E8A87C' },
        { label: 'Conversões', value: kpis.convertedLeads, icon: Target, color: '#6BB87B' },
        { label: 'Taxa Conversão', value: `${kpis.taxaConversao}%`, icon: TrendingUp, color: '#486581' },
        { label: 'Eventos', value: kpis.totalEvents, icon: BarChart3, color: '#A89EC4' },
    ]

    // Chart helpers
    const maxDailyClicks = Math.max(...performanceTemporal.map(d => d.clicks), 1)

    // Device totals
    const totalDeviceHits = Object.values(devices).reduce((s, v) => s + v, 0) || 1
    const deviceList = Object.entries(devices)
        .sort((a, b) => b[1] - a[1])
        .map(([device, count]) => ({
            device: device === 'mobile' ? 'Mobile' : device === 'desktop' ? 'Desktop' : device === 'tablet' ? 'Tablet' : device,
            count,
            percentage: Math.round((count / totalDeviceHits) * 100),
        }))

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <button onClick={() => router.push(`/backoffice/imoveis/${params.id}`)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textDim }}>
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: T.text }}>{development.name}</h1>
                        <p className="text-sm mt-0.5" style={{ color: T.textDim }}>
                            Analytics · {location}
                        </p>
                    </div>
                </div>
                <select value={periodoFilter} onChange={e => setPeriodoFilter(e.target.value)}
                    className="h-10 px-4 rounded-xl text-sm outline-none"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}>
                    <option value="7d">Últimos 7 dias</option>
                    <option value="30d">Últimos 30 dias</option>
                    <option value="90d">Últimos 90 dias</option>
                </select>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {KPI_CARDS.map(k => (
                    <div key={k.label} className="rounded-2xl p-4"
                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
                            style={{ background: `${k.color}18` }}>
                            <k.icon size={15} style={{ color: k.color }} />
                        </div>
                        <p className="text-xl font-bold" style={{ color: T.text }}>{k.value}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: T.textDim }}>{k.label}</p>
                    </div>
                ))}
            </div>

            {/* Performance Chart */}
            <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <h2 className="text-base font-bold mb-4" style={{ color: T.text }}>
                    Performance · Últimos {periodoFilter === '7d' ? '7' : periodoFilter === '90d' ? '90' : '30'} Dias
                </h2>
                {performanceTemporal.length === 0 || performanceTemporal.every(d => d.clicks === 0) ? (
                    <div className="text-center py-12" style={{ color: T.textDim }}>
                        <BarChart3 size={28} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhum dado de tracking nesse período</p>
                        <p className="text-xs mt-1">Crie links rastreáveis em Tracking → QR Code</p>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {performanceTemporal.slice(-14).map((day, idx) => {
                            const barWidth = (day.clicks / maxDailyClicks) * 100
                            return (
                                <div key={idx}>
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-[11px] w-16" style={{ color: T.textDim }}>
                                            {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                        </span>
                                        <div className="flex items-center gap-3 text-[11px]" style={{ color: T.textDim }}>
                                            <span>{day.clicks} cliques</span>
                                            <span style={{ color: T.gold, fontWeight: 600 }}>{day.leads} leads</span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${T.gold}15` }}>
                                        <div className="h-full rounded-full transition-all"
                                            style={{ width: `${barWidth}%`, background: T.gold }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Sources + Locations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Sources */}
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <h2 className="text-base font-bold mb-4" style={{ color: T.text }}>Fontes de Tráfego</h2>
                    {fontesTrafico.length === 0 ? (
                        <p className="text-sm py-8 text-center" style={{ color: T.textDim }}>Sem dados de fonte</p>
                    ) : (
                        <div className="space-y-3">
                            {fontesTrafico.map((f, idx) => (
                                <div key={idx}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium" style={{ color: T.text }}>{f.source}</span>
                                        <div className="text-right">
                                            <span className="text-sm font-bold" style={{ color: T.text }}>{f.visits}</span>
                                            <span className="text-xs ml-2" style={{ color: T.textDim }}>{f.percentage}%</span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${T.gold}15` }}>
                                        <div className="h-full rounded-full" style={{ width: `${f.percentage}%`, background: T.gold }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Locations */}
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <h2 className="text-base font-bold mb-4" style={{ color: T.text }}>Top Localizações</h2>
                    {topLocations.length === 0 ? (
                        <p className="text-sm py-8 text-center" style={{ color: T.textDim }}>Sem dados de localização</p>
                    ) : (
                        <div className="space-y-2">
                            {topLocations.map((loc, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} style={{ color: T.textDim }} />
                                        <span className="text-sm font-medium" style={{ color: T.text }}>{loc.city}</span>
                                    </div>
                                    <span className="text-sm font-bold" style={{ color: T.gold }}>{loc.percentage}%</span>
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
                    <h2 className="text-base font-bold mb-4" style={{ color: T.text }}>Dispositivos</h2>
                    {deviceList.length === 0 ? (
                        <p className="text-sm py-8 text-center" style={{ color: T.textDim }}>Sem dados de dispositivo</p>
                    ) : (
                        <div className="space-y-3">
                            {deviceList.map((d, idx) => (
                                <div key={idx}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium" style={{ color: T.text }}>{d.device}</span>
                                        <span className="text-sm font-bold" style={{ color: T.text }}>{d.percentage}%</span>
                                    </div>
                                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${T.gold}15` }}>
                                        <div className="h-full rounded-full" style={{ width: `${d.percentage}%`, background: '#A89EC4' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Campaigns */}
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <h2 className="text-base font-bold mb-4" style={{ color: T.text }}>Top Campanhas</h2>
                    {topCampaigns.length === 0 ? (
                        <p className="text-sm py-8 text-center" style={{ color: T.textDim }}>Nenhuma campanha rastreada</p>
                    ) : (
                        <div className="space-y-2">
                            {topCampaigns.map((c, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                    <span className="text-sm font-medium truncate mr-3" style={{ color: T.text }}>{c.name}</span>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className="text-xs" style={{ color: T.textDim }}>{c.clicks} cliques</span>
                                        <span className="text-xs font-semibold" style={{ color: T.gold }}>{c.leads} leads</span>
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
