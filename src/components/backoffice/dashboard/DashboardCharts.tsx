'use client'

import { useEffect, useState } from 'react'
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
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import Badge from '@/components/ui/Badge'

const supabase = createClient()

const COLORS = {
    primary: '#C49D5B',
    blue: '#3B82F6',
    green: '#10B981',
    purple: '#8B5CF6',
    orange: '#F59E0B',
    red: '#EF4444',
    pink: '#EC4899',
    yellow: '#F59E0B'
}

const STAGE_COLORS = {
    new: COLORS.blue,
    contacted: COLORS.yellow,
    qualified: COLORS.purple,
    proposal: COLORS.orange,
    negotiation: COLORS.pink,
    won: COLORS.green,
    lost: COLORS.red
}

export default function DashboardCharts() {
    const [funnelData, setFunnelData] = useState<any[]>([])
    const [sourceData, setSourceData] = useState<any[]>([])
    const [countryData, setCountryData] = useState<any[]>([])
    const [timelineData, setTimelineData] = useState<any[]>([])
    const [scoreData, setScoreData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadChartData()
    }, [])

    const loadChartData = async () => {
        setLoading(true)

        try {
            // Buscar leads
            const { data: leads } = await supabase
                .from('leads')
                .select('id, status, source, score, capital, created_at, development_id')

            // Buscar developments
            const { data: developments } = await supabase
                .from('developments')
                .select('id, name, region, status')

            if (!leads || !developments) return

            // 1. FUNIL DE CONVERSÃO
            const funnelStages = [
                { name: 'Novo', key: 'new', color: STAGE_COLORS.new },
                { name: 'Contatado', key: 'contacted', color: STAGE_COLORS.contacted },
                { name: 'Qualificado', key: 'qualified', color: STAGE_COLORS.qualified },
                { name: 'Proposta', key: 'proposal', color: STAGE_COLORS.proposal },
                { name: 'Negociação', key: 'negotiation', color: STAGE_COLORS.negotiation },
                { name: 'Ganho', key: 'won', color: STAGE_COLORS.won },
                { name: 'Perdido', key: 'lost', color: STAGE_COLORS.lost }
            ]

            const funnel = funnelStages.map(stage => ({
                name: stage.name,
                count: leads.filter(l => l.status === stage.key).length,
                color: stage.color
            }))

            setFunnelData(funnel)

            // 2. ORIGEM DOS LEADS
            const sourceCounts: Record<string, number> = {}
            leads.forEach(lead => {
                const source = lead.source || 'Desconhecido'
                sourceCounts[source] = (sourceCounts[source] || 0) + 1
            })

            const sources = Object.entries(sourceCounts)
                .map(([name, value]) => ({ name: formatSourceName(name), value }))
                .sort((a, b) => b.value - a.value)

            setSourceData(sources)

            // 3. PERFORMANCE POR PAÍS
            const countryStats: Record<string, { leads: number; value: number; developments: number }> = {
                'Brasil': { leads: 0, value: 0, developments: 0 },
                'EUA': { leads: 0, value: 0, developments: 0 },
                'Dubai': { leads: 0, value: 0, developments: 0 }
            }

            developments.forEach(dev => {
                const country = getCountryFromRegion(dev.region)
                countryStats[country].developments++
            })

            leads.forEach(lead => {
                if (lead.development_id) {
                    const dev = developments.find(d => d.id === lead.development_id)
                    if (dev) {
                        const country = getCountryFromRegion(dev.region)
                        countryStats[country].leads++
                        countryStats[country].value += lead.capital || 0
                    }
                }
            })

            const countries = Object.entries(countryStats).map(([name, stats]) => ({
                name,
                leads: stats.leads,
                developments: stats.developments,
                value: stats.value / 1000000, // Converter para milhões
                icon: name === 'Brasil' ? '🇧🇷' : name === 'EUA' ? '🇺🇸' : '🇦🇪'
            }))

            setCountryData(countries)

            // 4. TIMELINE DE LEADS (últimos 6 meses)
            const months = []
            const now = new Date()
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
                const monthStr = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })

                const monthLeads = leads.filter(l => {
                    const leadDate = new Date(l.created_at)
                    return leadDate.getMonth() === date.getMonth() &&
                        leadDate.getFullYear() === date.getFullYear()
                })

                const wonLeads = monthLeads.filter(l => l.status === 'won')
                const totalValue = wonLeads.reduce((sum, l) => sum + (l.capital || 0), 0)

                months.push({
                    month: monthStr,
                    leads: monthLeads.length,
                    conversoes: wonLeads.length,
                    valor: totalValue / 1000 // Converter para milhares
                })
            }

            setTimelineData(months)

            // 5. DISTRIBUIÇÃO DE SCORE
            const scoreRanges = [
                { range: '0-20', min: 0, max: 20, count: 0 },
                { range: '21-40', min: 21, max: 40, count: 0 },
                { range: '41-60', min: 41, max: 60, count: 0 },
                { range: '61-80', min: 61, max: 80, count: 0 },
                { range: '81-100', min: 81, max: 100, count: 0 }
            ]

            leads.forEach(lead => {
                const score = lead.score || 0
                const range = scoreRanges.find(r => score >= r.min && score <= r.max)
                if (range) range.count++
            })

            setScoreData(scoreRanges.map(r => ({ name: r.range, value: r.count })))

        } catch (error) {
            console.error('Erro ao carregar dados dos gráficos:', error)
        } finally {
            setLoading(false)
        }
    }

    const getCountryFromRegion = (region: string): string => {
        if (!region) return 'Brasil'
        const regionLower = region.toLowerCase()
        if (regionLower.includes('usa') || regionLower.includes('eua') || regionLower.includes('florida')) return 'EUA'
        if (regionLower.includes('dubai') || regionLower.includes('uae')) return 'Dubai'
        return 'Brasil'
    }

    const formatSourceName = (source: string): string => {
        const names: Record<string, string> = {
            website: 'Website',
            whatsapp: 'WhatsApp',
            phone: 'Telefone',
            email: 'E-mail',
            referral: 'Indicação',
            social: 'Redes Sociais',
            event: 'Evento',
            other: 'Outro'
        }
        return names[source] || source
    }

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-[#0A0B0D] rounded-3xl border border-imi-100 dark:border-white/5 p-10 h-96 animate-pulse">
                        <div className="h-6 bg-imi-50 dark:bg-white/5 rounded-full w-48 mb-6" />
                        <div className="h-full bg-imi-50/50 dark:bg-white/5 rounded-2xl" />
                    </div>
                ))}
            </div>
        )
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#0A0B0D] border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
                    <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-2 font-display">{label}</p>
                    {payload.map((p: any, i: number) => (
                        <p key={i} className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
                            {p.name}: {p.value}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    return (
        <div className="space-y-8">
            {/* Row 1: Funil + Origem */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Funil de Conversão */}
                <div className="bg-white dark:bg-[#0A0B0D] rounded-3xl border border-imi-100 dark:border-white/5 p-10 shadow-sm hover:shadow-xl transition-all duration-500">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <p className="text-[10px] font-black text-imi-400 uppercase tracking-[0.2em] mb-1">Métricas de Ativos</p>
                            <h3 className="text-2xl font-display font-bold text-imi-950 dark:text-white tracking-tight">Fluxo de Conversão</h3>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={funnelData} layout="vertical" margin={{ left: -20, right: 20 }}>
                            <CartesianGrid strokeDasharray="0" vertical={false} stroke="#F8FAFC" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={120}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b', textAnchor: 'start' }}
                                dx={0}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
                            <Bar dataKey="count" radius={[0, 12, 12, 0]} barSize={24}>
                                {funnelData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Origem dos Leads */}
                <div className="bg-white dark:bg-[#0A0B0D] rounded-3xl border border-imi-100 dark:border-white/5 p-10 shadow-sm hover:shadow-xl transition-all duration-500">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <p className="text-[10px] font-black text-imi-400 uppercase tracking-[0.2em] mb-1">Canais de Aquisição</p>
                            <h3 className="text-2xl font-display font-bold text-imi-950 dark:text-white tracking-tight">Origem de Capital</h3>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                            <Pie
                                data={sourceData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={110}
                                paddingAngle={8}
                                dataKey="value"
                            >
                                {sourceData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={Object.values(COLORS)[index % Object.values(COLORS).length]}
                                        stroke="transparent"
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                formatter={(value) => <span className="text-[10px] font-bold text-imi-400 uppercase tracking-widest ml-1">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 2: Performance por País */}
            <div className="bg-white dark:bg-[#0A0B0D] rounded-3xl border border-imi-100 dark:border-white/5 p-10 shadow-sm hover:shadow-xl transition-all duration-500">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <p className="text-[10px] font-black text-imi-400 uppercase tracking-[0.2em] mb-1">Visão Continental</p>
                        <h3 className="text-2xl font-display font-bold text-imi-950 dark:text-white tracking-tight">Performance por Jurisdição</h3>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={countryData} margin={{ top: 20 }}>
                        <CartesianGrid strokeDasharray="0" vertical={false} stroke="#F8FAFC" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                            dy={10}
                        />
                        <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            formatter={(value) => <span className="text-[10px] font-bold text-imi-400 uppercase tracking-widest ml-2">{value}</span>}
                        />
                        <Bar yAxisId="left" dataKey="leads" fill={COLORS.blue} name="Leads" radius={[6, 6, 0, 0]} barSize={20} />
                        <Bar yAxisId="left" dataKey="developments" fill={COLORS.purple} name="Empreendimentos" radius={[6, 6, 0, 0]} barSize={20} />
                        <Bar yAxisId="right" dataKey="value" fill={COLORS.primary} name="Valor (Mi)" radius={[6, 6, 0, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Row 3: Timeline + Score */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Timeline de Performance */}
                <div className="bg-white dark:bg-[#0A0B0D] rounded-3xl border border-imi-100 dark:border-white/5 p-10 shadow-sm hover:shadow-xl transition-all duration-500">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <p className="text-[10px] font-black text-imi-400 uppercase tracking-[0.2em] mb-1">Série Histórica</p>
                            <h3 className="text-2xl font-display font-bold text-imi-950 dark:text-white tracking-tight">Evolução Estratégica</h3>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                        <AreaChart data={timelineData}>
                            <defs>
                                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.15} />
                                    <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorConversoes" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.15} />
                                    <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="0" vertical={false} stroke="#F8FAFC" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                dy={10}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="top"
                                align="right"
                                iconType="circle"
                                formatter={(value) => <span className="text-[10px] font-bold text-imi-400 uppercase tracking-widest ml-2">{value}</span>}
                            />
                            <Area
                                type="monotone"
                                dataKey="leads"
                                stroke={COLORS.blue}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorLeads)"
                                name="Total Leads"
                            />
                            <Area
                                type="monotone"
                                dataKey="conversoes"
                                stroke={COLORS.green}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorConversoes)"
                                name="Conversões"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Distribuição de Score */}
                <div className="bg-white dark:bg-[#0A0B0D] rounded-3xl border border-imi-100 dark:border-white/5 p-10 shadow-sm hover:shadow-xl transition-all duration-500">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <p className="text-[10px] font-black text-imi-400 uppercase tracking-[0.2em] mb-1">Poder de Fechamento</p>
                            <h3 className="text-2xl font-display font-bold text-imi-950 dark:text-white tracking-tight">Qualificação (Score)</h3>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={scoreData} margin={{ top: 20 }}>
                            <CartesianGrid strokeDasharray="0" vertical={false} stroke="#F8FAFC" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                dy={10}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
                            <Bar dataKey="value" name="Volume" radius={[12, 12, 0, 0]} barSize={32}>
                                {scoreData.map((entry, index) => {
                                    let color = COLORS.red
                                    if (entry.name.startsWith('61')) color = COLORS.yellow
                                    if (entry.name.startsWith('81')) color = COLORS.green
                                    return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8} />
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
