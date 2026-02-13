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
    Minus
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

function KPICard({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'text-accent-600', bgColor = 'bg-accent-50' }: KPICardProps) {
    return (
        <div className="bg-white rounded-2xl border border-imi-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}>
                    <Icon size={24} className={color} />
                </div>
                {trend && trendValue && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${trend === 'up' ? 'bg-green-50 text-green-700' :
                            trend === 'down' ? 'bg-red-50 text-red-700' :
                                'bg-gray-50 text-gray-700'
                        }`}>
                        {trend === 'up' && <ArrowUp size={12} />}
                        {trend === 'down' && <ArrowDown size={12} />}
                        {trend === 'neutral' && <Minus size={12} />}
                        {trendValue}
                    </div>
                )}
            </div>

            <div className="text-3xl font-bold text-imi-900 mb-1">
                {value}
            </div>

            <div className="text-sm text-imi-600">
                {title}
            </div>

            {subtitle && (
                <div className="text-xs text-imi-500 mt-2 pt-2 border-t border-imi-100">
                    {subtitle}
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

            {/* Performance por Jurisdição */}
            <div className="bg-white rounded-2xl border border-imi-100 p-6">
                <h3 className="text-lg font-bold text-imi-900 mb-6 flex items-center gap-2">
                    <Globe size={24} className="text-accent-600" />
                    Performance por Jurisdição
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['Brasil', 'EUA', 'Dubai'].map((country) => {
                        const devCount = stats.developmentsByCountry[country] || 0
                        const ticket = stats.ticketByCountry[country] || 0
                        const avgTicketCountry = ticket > 0 ? ticket / devCount : 0

                        return (
                            <div key={country} className="border border-imi-100 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="text-2xl">
                                        {country === 'Brasil' && '🇧🇷'}
                                        {country === 'EUA' && '🇺🇸'}
                                        {country === 'Dubai' && '🇦🇪'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-imi-900">{country}</div>
                                        <div className="text-xs text-imi-500">{devCount} empreendimentos</div>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-imi-600">Ticket Médio:</span>
                                        <span className="font-medium text-imi-900">
                                            {avgTicketCountry > 0 ? new Intl.NumberFormat('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRL',
                                                minimumFractionDigits: 0
                                            }).format(avgTicketCountry) : '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Financeiro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                            <DollarSign size={24} className="text-white" />
                        </div>
                        <div className="text-sm font-medium text-green-700">Valor Pipeline</div>
                    </div>
                    <div className="text-3xl font-bold text-green-900">
                        {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 0
                        }).format(stats.pipelineValue)}
                    </div>
                    <div className="text-xs text-green-600 mt-2">
                        Potencial em negociação
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                            <TrendingUp size={24} className="text-white" />
                        </div>
                        <div className="text-sm font-medium text-purple-700">Receita Projetada</div>
                    </div>
                    <div className="text-3xl font-bold text-purple-900">
                        {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 0
                        }).format(stats.projectedRevenue)}
                    </div>
                    <div className="text-xs text-purple-600 mt-2">
                        Base: taxa conversão atual
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                            <Award size={24} className="text-white" />
                        </div>
                        <div className="text-sm font-medium text-blue-700">Ticket Médio</div>
                    </div>
                    <div className="text-3xl font-bold text-blue-900">
                        {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 0
                        }).format(stats.avgTicket)}
                    </div>
                    <div className="text-xs text-blue-600 mt-2">
                        Média geral
                    </div>
                </div>
            </div>

            {/* Insights */}
            <div className="bg-accent-50 border border-accent-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-accent-900 mb-4">Insights Estratégicos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <div className="text-accent-600 font-medium mb-1">Top Fonte</div>
                        <div className="text-accent-900 font-bold">{stats.topSource}</div>
                    </div>
                    <div>
                        <div className="text-accent-600 font-medium mb-1">Empreendimento Destaque</div>
                        <div className="text-accent-900 font-bold truncate">{stats.topDevelopment}</div>
                    </div>
                    <div>
                        <div className="text-accent-600 font-medium mb-1">Melhor País</div>
                        <div className="text-accent-900 font-bold">{stats.topPerformingCountry}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
