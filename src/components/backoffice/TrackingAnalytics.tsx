'use client'
import { useState, useEffect } from 'react'
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, Users, Eye, Clock, MapPin, Smartphone } from 'lucide-react'
const supabase = createClient()
const COLORS = ['#486581', '#7B9EC4', '#6BB87B', '#E8A87C', '#A89EC4', '#E57373']
interface TrackingAnalytics {
    totalClicks: number
    totalViews: number
    avgTimeOnPage: number
    conversionRate: number
    topSource: string
    topDevice: string
    topLocation: string
    clicksBySource: Array<{ name: string; value: number }>
    clicksByDevice: Array<{ name: string; value: number }>
    clicksByDay: Array<{ day: string; clicks: number }>
    topCampaigns: Array<{ campaign: string; clicks: number; conversions: number; roi: number }>
}
export default function TrackingAnalytics({ developmentId }: { developmentId?: string }) {
    const [analytics, setAnalytics] = useState<TrackingAnalytics | null>(null)
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
    useEffect(() => {
        loadAnalytics()
    }, [developmentId, timeRange])
    const loadAnalytics = async () => {
        setLoading(true)
        try {
            const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - daysAgo)
            // Buscar eventos de tracking
            let query = supabase
                .from('link_events')
                .select('*, tracked_link:tracked_links(*)')
                .gte('created_at', startDate.toISOString())
            if (developmentId) {
                // We need to filter by tracked_link.development_id. 
                // Supabase join filtering syntax: !inner join to filter parent by child condition
                // But here we are filtering child (link_events) by parent (tracked_link) property?
                // Actually, link_events has tracked_link_id. We need to find tracked_links for this developmentId first if we want to be efficient,
                // OR use the relationship filter. 
                // Let's use the straightforward approach supported by storing tracked_link_id directly or join filtering.
                // Assuming we are querying link_events, we can filter by the joined table column if we use !inner
                query = query.eq('tracked_link.development_id', developmentId)
                // Note: For this to work in Supabase/PostgREST, we normally need !inner on the select if filtering by referenced table.
                // select('*, tracked_link!inner(*)')
            }
            // To be safe and generic for now, let's adjust the query slightly to ensure it works with standard PostgREST
            // Re-constructing the query
            let baseQuery = supabase
                .from('link_events')
                .select('*, tracked_link:tracked_links!inner(*)') // !inner is required to filter by joined table properties
                .gte('created_at', startDate.toISOString())
            if (developmentId) {
                baseQuery = baseQuery.eq('tracked_link.development_id', developmentId)
            }
            const { data: events, error } = await baseQuery
            if (error) {
                throw error
            }
            if (!events || events.length === 0) {
                setAnalytics({
                    totalClicks: 0,
                    totalViews: 0,
                    avgTimeOnPage: 0,
                    conversionRate: 0,
                    topSource: 'N/A',
                    topDevice: 'N/A',
                    topLocation: 'N/A',
                    clicksBySource: [],
                    clicksByDevice: [],
                    clicksByDay: [],
                    topCampaigns: []
                })
                setLoading(false)
                return
            }
            // Processar dados
            const totalClicks = events.length
            const totalViews = events.filter(e => e.event_type === 'page_view').length
            // Tempo médio (simulado - em produção viria de um campo real)
            const avgTimeOnPage = events
                .filter(e => e.metadata?.time_on_page)
                .reduce((sum, e) => sum + (e.metadata.time_on_page || 0), 0) / (totalViews || 1) || 0
            // Conversões (leads gerados a partir de links)
            const conversions = events.filter(e => e.metadata?.converted).length
            const conversionRate = totalClicks > 0 ? (conversions / totalClicks) * 100 : 0
            // Top source
            const sourceCounts: Record<string, number> = {}
            events.forEach(e => {
                const source = e.utm_params?.source || 'direct'
                sourceCounts[source] = (sourceCounts[source] || 0) + 1
            })
            const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
            // Top device
            const deviceCounts: Record<string, number> = {}
            events.forEach(e => {
                const device = e.device_type || 'desktop'
                deviceCounts[device] = (deviceCounts[device] || 0) + 1
            })
            const topDevice = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
            // Top location
            const locationCounts: Record<string, number> = {}
            events.forEach(e => {
                const location = e.location || 'Unknown'
                locationCounts[location] = (locationCounts[location] || 0) + 1
            })
            const topLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
            // Clicks by source
            const clicksBySource = Object.entries(sourceCounts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)
            // Clicks by device
            const clicksByDevice = Object.entries(deviceCounts)
                .map(([name, value]) => ({
                    name: name === 'mobile' ? 'Mobile' : name === 'desktop' ? 'Desktop' : 'Tablet',
                    value
                }))
            // Clicks by day (últimos 7 dias)
            const lastDaysCount = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
            // For chart readability, if 90 days, maybe group by week? Keeping simple for now.
            const clicksByDayMap: Record<string, number> = {}
            events.forEach(e => {
                const day = e.created_at.split('T')[0]
                clicksByDayMap[day] = (clicksByDayMap[day] || 0) + 1
            })
            // Generate dates for the range
            const clicksByDay = []
            for (let i = lastDaysCount - 1; i >= 0; i--) {
                const date = new Date()
                date.setDate(date.getDate() - i)
                const dayKey = date.toISOString().split('T')[0]
                clicksByDay.push({
                    day: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                    clicks: clicksByDayMap[dayKey] || 0
                })
            }
            // Top campaigns
            const campaignStats: Record<string, { clicks: number; conversions: number }> = {}
            events.forEach(e => {
                const campaign = e.utm_params?.campaign || 'sem_campanha'
                if (!campaignStats[campaign]) {
                    campaignStats[campaign] = { clicks: 0, conversions: 0 }
                }
                campaignStats[campaign].clicks++
                if (e.metadata?.converted) {
                    campaignStats[campaign].conversions++
                }
            })
            const topCampaigns = Object.entries(campaignStats)
                .map(([campaign, stats]) => ({
                    campaign,
                    clicks: stats.clicks,
                    conversions: stats.conversions,
                    roi: stats.clicks > 0 ? (stats.conversions / stats.clicks) * 100 : 0
                }))
                .sort((a, b) => b.clicks - a.clicks)
                .slice(0, 5)
            setAnalytics({
                totalClicks,
                totalViews,
                avgTimeOnPage: Math.round(avgTimeOnPage),
                conversionRate: parseFloat(conversionRate.toFixed(2)),
                topSource,
                topDevice,
                topLocation,
                clicksBySource,
                clicksByDevice,
                clicksByDay,
                topCampaigns
            })
        } catch (error) {
        } finally {
            setLoading(false)
        }
    }
    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-imi-600">Carregando analytics...</p>
                </div>
            </div>
        )
    }
    if (!analytics) return null
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Time Range Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Analytics de Tracking</h2>
                <div className="flex gap-2">
                    {[
                        { value: '7d', label: '7 dias' },
                        { value: '30d', label: '30 dias' },
                        { value: '90d', label: '90 dias' }
                    ].map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setTimeRange(option.value as '7d' | '30d' | '90d')}
                            className={`px-4 py-2 rounded-xl font-medium transition-all text-sm ${timeRange === option.value
                                    ? 'bg-accent-500 text-white shadow-md'
                                    : 'border text-imi-700 hover:border-accent-300'
                                }`}
                            style={timeRange !== option.value ? { background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' } : undefined}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { icon: Eye, label: 'Total Eventos', value: analytics.totalClicks, color: 'var(--info)' },
                    { icon: Users, label: 'Visualizações de Página', value: analytics.totalViews, color: 'var(--success)' },
                    { icon: Clock, label: 'Tempo Médio', value: `${analytics.avgTimeOnPage}s`, color: 'var(--warning)' },
                    { icon: TrendingUp, label: 'Taxa de Conversão', value: `${analytics.conversionRate}%`, color: 'var(--warning)' },
                ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="rounded-2xl p-6 transition-shadow"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                        <div className="flex items-center gap-3 mb-2">
                            <Icon size={24} style={{ color }} />
                            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                        </div>
                        <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
                    </div>
                ))}
            </div>
            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Clicks by Source */}
                <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                    <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Tráfego por Origem</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analytics.clicksBySource}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {analytics.clicksBySource.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '10px', color: 'var(--text-primary)' }}
                                />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                {/* Clicks by Device */}
                <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                    <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Tráfego por Dispositivo</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.clicksByDevice} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)' }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '10px', color: 'var(--text-primary)' }}
                                />
                                <Bar dataKey="value" fill="#486581" radius={[8, 8, 0, 0]} barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            {/* Timeline */}
            <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Evolução Diária</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.clicksByDay} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} padding={{ left: 20, right: 20 }} tick={{ fill: 'var(--text-secondary)' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)' }} />
                            <Tooltip
                                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '10px', color: 'var(--text-primary)' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="clicks"
                                stroke="#486581"
                                strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 2, fill: 'var(--bg-surface)' }}
                                activeDot={{ r: 6 }}
                                name="Cliques/Eventos"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            {/* Top Campaigns */}
            <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Top Campanhas</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                                <th className="text-left py-3 px-4 text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Campanha</th>
                                <th className="text-center py-3 px-4 text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Eventos</th>
                                <th className="text-center py-3 px-4 text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Conversões</th>
                                <th className="text-center py-3 px-4 text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Taxa Conv.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analytics.topCampaigns.map((campaign, index) => (
                                <tr key={index} className="transition-colors"
                                    style={{ borderBottom: '1px solid var(--border-default)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                    <td className="py-4 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>{campaign.campaign}</td>
                                    <td className="py-4 px-4 text-center" style={{ color: 'var(--text-secondary)' }}>{campaign.clicks}</td>
                                    <td className="py-4 px-4 text-center" style={{ color: 'var(--text-secondary)' }}>{campaign.conversions}</td>
                                    <td className="py-4 px-4 text-center">
                                        <span className="px-3 py-1 rounded-full text-xs font-bold"
                                            style={{
                                                background: campaign.roi >= 5 ? 'var(--success-bg)' : campaign.roi >= 2 ? 'var(--warning-bg)' : 'var(--bg-active)',
                                                color: campaign.roi >= 5 ? 'var(--success)' : campaign.roi >= 2 ? 'var(--warning)' : 'var(--text-secondary)',
                                            }}>
                                            {campaign.roi.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {analytics.topCampaigns.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                                        Nenhuma campanha registrada no período.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { icon: TrendingUp, label: 'Top Origem', value: analytics.topSource, color: 'var(--info)' },
                    { icon: Smartphone, label: 'Top Dispositivo', value: analytics.topDevice, color: 'var(--warning)' },
                    { icon: MapPin, label: 'Top Localização', value: analytics.topLocation, color: 'var(--success)' },
                ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="rounded-2xl p-6" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                        <div className="flex items-center gap-3 mb-2">
                            <Icon size={20} style={{ color }} />
                            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                        </div>
                        <div className="text-2xl font-bold capitalize truncate" style={{ color: 'var(--text-primary)' }} title={value}>
                            {value}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
