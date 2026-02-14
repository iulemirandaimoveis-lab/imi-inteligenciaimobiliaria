'use client'

import { useEffect, useState } from 'react'
import {
    Building2,
    Users,
    TrendingUp,
    DollarSign,
    Globe,
    Target,
    Award,
    AlertCircle,
    ArrowUp,
    ArrowDown,
    Minus,
    Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeDevelopments, useRealtimeLeads } from '@/hooks/use-realtime-sync'

const supabase = createClient()

interface DashboardStats {
    // Empreendimentos
    totalDevelopments: number
    developmentsByCountry: Record<string, number>
    publishedDevelopments: number
    featuredDevelopments: number

    // Leads
    totalLeads: number
    leadsThisMonth: number
    leadsLastMonth: number
    avgScore: number
    leadsByStatus: Record<string, number>

    // Conversão
    conversionRate: number
    wonDeals: number

    // Financeiro
    pipelineValue: number
    avgTicket: number
    ticketByCountry: Record<string, number>
    projectedRevenue: number

    // Performance
    topSource: string
    topDevelopment: string
    topPerformingCountry: string
}

interface KPICardProps {
    title: string
    value: string | number
    subtitle?: string
    icon: any
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
    color?: string
    bgColor?: string
}

function KPICard({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'text-imi-600', bgColor = 'bg-imi-50' }: KPICardProps) {
    return (
        <div className="bg-white rounded-2xl border border-imi-100 p-8 hover:shadow-xl hover:shadow-imi-900/5 transition-all duration-300 group flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
                <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm border border-black/5`}>
                    <Icon size={22} className={color} strokeWidth={1.5} />
                </div>
                {trend && trendValue && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-tight ${trend === 'up' ? 'bg-green-500/10 text-green-700' :
                        trend === 'down' ? 'bg-red-500/10 text-red-700' :
                            'bg-gray-500/10 text-gray-700'
                        }`}>
                        {trend === 'up' && <ArrowUp size={12} strokeWidth={3} />}
                        {trend === 'down' && <ArrowDown size={12} strokeWidth={3} />}
                        {trend === 'neutral' && <Minus size={12} strokeWidth={3} />}
                        {trendValue}
                    </div>
                )}
            </div>

            <div className="flex-1">
                <div className="text-sm font-bold text-imi-400 uppercase tracking-[0.15em] mb-2 leading-none">
                    {title}
                </div>
                <div className="text-4xl font-display font-bold text-imi-950 tracking-tighter tabular-nums">
                    {value}
                </div>
            </div>

            {(subtitle) && (
                <div className="mt-8 pt-6 border-t border-imi-50 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-imi-500 uppercase tracking-widest">{subtitle}</span>
                </div>
            )}
        </div>
    )
}

export default function DashboardKPIs() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [alerts, setAlerts] = useState<Array<{ type: string; message: string; severity: 'high' | 'medium' | 'low' }>>([])

    // Real-time updates
    useRealtimeDevelopments(() => loadStats())
    useRealtimeLeads(() => loadStats())

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        setLoading(true)
        try {
            // Buscar empreendimentos
            const { data: developments, error: devError } = await supabase
                .from('developments')
                .select('id, name, status, region, featured, leads_count, views_count')

            if (devError) throw devError

            // Buscar leads
            const { data: leads, error: leadsError } = await supabase
                .from('leads')
                .select('id, status, score, capital, source, created_at, development_id')

            if (leadsError) throw leadsError

            // Calcular estatísticas
            const now = new Date()
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

            // Empreendimentos por país
            const devsByCountry: Record<string, number> = {}
            developments?.forEach(dev => {
                const country = getCountryFromRegion(dev.region)
                devsByCountry[country] = (devsByCountry[country] || 0) + 1
            })

            // Leads por período
            const leadsThisMonth = leads?.filter(l => new Date(l.created_at) >= thisMonth).length || 0
            const leadsLastMonth = leads?.filter(l => {
                const date = new Date(l.created_at)
                return date >= lastMonth && date <= lastMonthEnd
            }).length || 0

            // Leads por status
            const leadsByStatus: Record<string, number> = {}
            leads?.forEach(lead => {
                leadsByStatus[lead.status] = (leadsByStatus[lead.status] || 0) + 1
            })

            // Score médio
            const avgScore = leads && leads.length > 0
                ? leads.reduce((sum, l) => sum + (l.score || 0), 0) / leads.length
                : 0

            // Valor do pipeline
            const pipelineValue = leads
                ?.filter(l => l.status !== 'lost' && l.status !== 'won')
                .reduce((sum, l) => sum + (l.capital || 0), 0) || 0

            // Ticket médio
            const avgTicket = leads && leads.length > 0
                ? leads.reduce((sum, l) => sum + (l.capital || 0), 0) / leads.length
                : 0

            // Ticket por país (baseado em development vinculado)
            const ticketByCountry: Record<string, number> = {}
            leads?.forEach(lead => {
                if (lead.development_id && lead.capital) {
                    const dev = developments?.find(d => d.id === lead.development_id)
                    if (dev) {
                        const country = getCountryFromRegion(dev.region)
                        if (!ticketByCountry[country]) ticketByCountry[country] = 0
                        ticketByCountry[country] += lead.capital
                    }
                }
            })

            // Top source
            const sourceCount: Record<string, number> = {}
            leads?.forEach(lead => {
                sourceCount[lead.source] = (sourceCount[lead.source] || 0) + 1
            })
            const topSource = Object.entries(sourceCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

            // Top development (mais leads)
            const devLeadsCount: Record<string, { name: string; count: number }> = {}
            leads?.forEach(lead => {
                if (lead.development_id) {
                    const dev = developments?.find(d => d.id === lead.development_id)
                    if (dev) {
                        if (!devLeadsCount[lead.development_id]) {
                            devLeadsCount[lead.development_id] = { name: dev.name, count: 0 }
                        }
                        devLeadsCount[lead.development_id].count++
                    }
                }
            })
            const topDev = Object.values(devLeadsCount).sort((a, b) => b.count - a.count)[0]
            const topDevelopment = topDev?.name || 'N/A'

            // País com melhor performance
            const topPerformingCountry = Object.entries(devsByCountry).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Brasil'

            // Taxa de conversão
            const wonCount = leadsByStatus['won'] || 0
            const conversionRate = leads && leads.length > 0 ? (wonCount / leads.length) * 100 : 0

            // Receita projetada (pipeline * taxa de conversão estimada)
            const projectedRevenue = pipelineValue * (conversionRate / 100)

            setStats({
                totalDevelopments: developments?.length || 0,
                developmentsByCountry: devsByCountry,
                publishedDevelopments: developments?.filter(d => d.status === 'published').length || 0,
                featuredDevelopments: developments?.filter(d => d.featured).length || 0,

                totalLeads: leads?.length || 0,
                leadsThisMonth,
                leadsLastMonth,
                avgScore: Math.round(avgScore),
                leadsByStatus,

                conversionRate: parseFloat(conversionRate.toFixed(1)),
                wonDeals: wonCount,

                pipelineValue,
                avgTicket,
                ticketByCountry,
                projectedRevenue,

                topSource,
                topDevelopment,
                topPerformingCountry
            })

            // Gerar alertas
            generateAlerts(developments || [], leads || [], {
                leadsThisMonth,
                leadsLastMonth,
                avgScore,
                conversionRate
            })

        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error)
        } finally {
            setLoading(false)
        }
    }

    const generateAlerts = (developments: any[], leads: any[], metrics: any) => {
        const newAlerts: typeof alerts = []

        // Alert: Leads em queda
        if (metrics.leadsThisMonth < metrics.leadsLastMonth * 0.8) {
            newAlerts.push({
                type: 'leads_drop',
                message: `Leads caíram ${Math.round((1 - metrics.leadsThisMonth / metrics.leadsLastMonth) * 100)}% vs mês passado`,
                severity: 'high'
            })
        }

        // Alert: Score médio baixo
        if (metrics.avgScore < 50) {
            newAlerts.push({
                type: 'low_score',
                message: `Score médio está em ${metrics.avgScore} - Leads pouco qualificados`,
                severity: 'medium'
            })
        }

        // Alert: Conversão baixa
        if (metrics.conversionRate < 5 && leads.length > 10) {
            newAlerts.push({
                type: 'low_conversion',
                message: `Taxa de conversão em ${metrics.conversionRate}% - Revisar abordagem comercial`,
                severity: 'high'
            })
        }

        // Alert: Empreendimentos sem leads
        const devsWithoutLeads = developments.filter(d =>
            d.status === 'published' && (!d.leads_count || d.leads_count === 0)
        )
        if (devsWithoutLeads.length > 0) {
            newAlerts.push({
                type: 'no_leads',
                message: `${devsWithoutLeads.length} empreendimentos publicados sem leads`,
                severity: 'medium'
            })
        }

        setAlerts(newAlerts)
    }

    const getCountryFromRegion = (region: string): string => {
        if (!region) return 'Brasil'
        const regionLower = region.toLowerCase()
        if (regionLower.includes('usa') || regionLower.includes('eua') || regionLower.includes('florida') || regionLower.includes('miami')) return 'EUA'
        if (regionLower.includes('dubai') || regionLower.includes('uae') || regionLower.includes('emirados')) return 'Dubai'
        return 'Brasil'
    }

    const getTrend = (current: number, previous: number): { trend: 'up' | 'down' | 'neutral'; value: string } => {
        if (previous === 0) return { trend: 'neutral', value: '—' }
        const diff = ((current - previous) / previous) * 100
        if (Math.abs(diff) < 5) return { trend: 'neutral', value: '~' }
        return {
            trend: diff > 0 ? 'up' : 'down',
            value: `${Math.abs(Math.round(diff))}%`
        }
    }

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-imi-100 p-6 animate-pulse">
                        <div className="w-12 h-12 bg-imi-100 rounded-xl mb-4" />
                        <div className="h-8 bg-imi-100 rounded mb-2 w-20" />
                        <div className="h-4 bg-imi-100 rounded w-32" />
                    </div>
                ))}
            </div>
        )
    }

    if (!stats) return null

    const leadsTrend = getTrend(stats.leadsThisMonth, stats.leadsLastMonth)

    return (
        <div className="space-y-6">
            {/* Alertas Críticos */}
            {alerts.length > 0 && (
                <div className="space-y-2">
                    {alerts.map((alert, index) => (
                        <div
                            key={index}
                            className={`rounded-xl p-4 flex items-center gap-3 ${alert.severity === 'high' ? 'bg-red-50 border border-red-200' :
                                alert.severity === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                                    'bg-blue-50 border border-blue-200'
                                }`}
                        >
                            <AlertCircle size={20} className={
                                alert.severity === 'high' ? 'text-red-600' :
                                    alert.severity === 'medium' ? 'text-yellow-600' :
                                        'text-blue-600'
                            } />
                            <span className={`text-sm font-medium ${alert.severity === 'high' ? 'text-red-700' :
                                alert.severity === 'medium' ? 'text-yellow-700' :
                                    'text-blue-700'
                                }`}>
                                {alert.message}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* KPIs Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Empreendimentos Ativos"
                    value={stats.publishedDevelopments}
                    subtitle={`${stats.featuredDevelopments} em destaque`}
                    icon={Building2}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                />

                <KPICard
                    title="Leads Ativos"
                    value={stats.totalLeads}
                    subtitle={`${stats.leadsThisMonth} este mês`}
                    icon={Users}
                    trend={leadsTrend.trend}
                    trendValue={leadsTrend.value}
                    color="text-purple-600"
                    bgColor="bg-purple-50"
                />

                <KPICard
                    title="Taxa de Conversão"
                    value={`${stats.conversionRate}%`}
                    subtitle={`${stats.wonDeals} negócios fechados`}
                    icon={Target}
                    color="text-green-600"
                    bgColor="bg-green-50"
                />

                <KPICard
                    title="Score Médio"
                    value={stats.avgScore}
                    subtitle={`Qualificação de leads`}
                    icon={Award}
                    color="text-orange-600"
                    bgColor="bg-orange-50"
                />
            </div>

            {/* Performance por Jurisdição - Structured & Precise */}
            <div className="bg-white rounded-3xl border border-imi-100 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-10">
                    <h3 className="text-xl font-bold text-imi-950 flex items-center gap-3">
                        <Globe size={22} className="text-imi-500" strokeWidth={1.5} />
                        Performance por Jurisdição
                    </h3>
                    <div className="text-[10px] font-bold text-imi-400 uppercase tracking-widest bg-imi-50 px-3 py-1 rounded-full border border-imi-100">
                        Consolidado Global
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {['Brasil', 'EUA', 'Dubai'].map((country) => {
                        const devCount = stats.developmentsByCountry[country] || 0
                        const ticket = stats.ticketByCountry[country] || 0
                        const avgTicketCountry = ticket > 0 ? ticket / (devCount || 1) : 0

                        return (
                            <div key={country} className="border border-imi-100 rounded-3xl p-6 hover:bg-imi-50/50 transition-colors group">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-white border border-imi-100 shadow-sm flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all duration-300">
                                        {country === 'Brasil' && '🇧🇷'}
                                        {country === 'EUA' && '🇺🇸'}
                                        {country === 'Dubai' && '🇦🇪'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-imi-900 text-lg leading-none">{country}</div>
                                        <div className="text-[10px] font-bold text-imi-400 uppercase tracking-widest mt-1">{devCount} Unidades</div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-imi-100/50 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[11px] font-bold text-imi-400 uppercase tracking-wider">Investimento Médio</span>
                                        <span className="font-display font-bold text-imi-900 text-lg tabular-nums">
                                            {avgTicketCountry > 0 ? new Intl.NumberFormat('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRL',
                                                minimumFractionDigits: 0
                                            }).format(avgTicketCountry) : '—'}
                                        </span>
                                    </div>
                                    <div className="h-1 w-full bg-imi-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-imi-500 rounded-full"
                                            style={{ width: country === 'Brasil' ? '100%' : country === 'EUA' ? '65%' : '40%' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Financeiro - Depth & Distinction */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-[#0A0B0D] rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10" />

                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                            <DollarSign size={20} className="text-green-500" />
                        </div>
                        <div className="text-[11px] font-bold text-green-500/80 uppercase tracking-widest">Valor do Pipeline</div>
                    </div>

                    <div className="text-4xl font-display font-bold text-white tracking-tighter tabular-nums mb-3">
                        {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 0
                        }).format(stats.pipelineValue)}
                    </div>
                    <p className="text-xs text-imi-500 font-medium tracking-tight">Potencial total sob gestão estratégica</p>
                </div>

                <div className="bg-[#0A0B0D] rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-imi-500/10 rounded-full blur-3xl -mr-10 -mt-10" />

                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 rounded-xl bg-imi-500/20 border border-imi-500/30 flex items-center justify-center">
                            <TrendingUp size={20} className="text-imi-500" />
                        </div>
                        <div className="text-[11px] font-bold text-imi-500/80 uppercase tracking-widest">Receita Projetada</div>
                    </div>

                    <div className="text-4xl font-display font-bold text-white tracking-tighter tabular-nums mb-3">
                        {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 0
                        }).format(stats.projectedRevenue)}
                    </div>
                    <p className="text-xs text-imi-500 font-medium tracking-tight">Projeção conservadora baseada em conversão</p>
                </div>

                <div className="bg-white rounded-3xl border border-imi-100 p-8 shadow-sm group">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 rounded-xl bg-imi-50 border border-imi-100 flex items-center justify-center">
                            <Award size={20} className="text-imi-600" />
                        </div>
                        <div className="text-[11px] font-bold text-imi-600 uppercase tracking-widest">Ticket Médio Institucional</div>
                    </div>

                    <div className="text-4xl font-display font-bold text-imi-950 tracking-tighter tabular-nums mb-3">
                        {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 0
                        }).format(stats.avgTicket)}
                    </div>
                    <p className="text-xs text-imi-500 font-medium tracking-tight">Valor médio negociado globalmente</p>
                </div>
            </div>

            {/* Strategic Insights - Refined & Clear */}
            <div className="bg-imi-950 rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(196,157,91,0.1),transparent_70%)]" />

                <h3 className="text-xl font-bold text-white mb-10 relative z-10 flex items-center gap-3">
                    <Sparkles size={20} className="text-imi-500" />
                    Insights de Inteligência
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                    <div className="space-y-2">
                        <div className="text-[10px] font-bold text-imi-500 uppercase tracking-[0.2em] mb-4 opacity-80">Principal Canal</div>
                        <div className="text-2xl font-display font-bold text-white tracking-tight">{stats.topSource}</div>
                        <div className="h-1 w-12 bg-imi-500/30 rounded-full" />
                    </div>
                    <div className="space-y-2">
                        <div className="text-[10px] font-bold text-imi-500 uppercase tracking-[0.2em] mb-4 opacity-80">Ativo de Performance</div>
                        <div className="text-2xl font-display font-bold text-white tracking-tight truncate" title={stats.topDevelopment}>
                            {stats.topDevelopment}
                        </div>
                        <div className="h-1 w-12 bg-imi-500/30 rounded-full" />
                    </div>
                    <div className="space-y-2">
                        <div className="text-[10px] font-bold text-imi-500 uppercase tracking-[0.2em] mb-4 opacity-80">Região Estratégica</div>
                        <div className="text-2xl font-display font-bold text-white tracking-tight">{stats.topPerformingCountry}</div>
                        <div className="h-1 w-12 bg-imi-500/30 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    )
}
