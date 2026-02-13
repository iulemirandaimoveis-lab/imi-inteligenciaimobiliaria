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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-imi-100 p-6 h-96 animate-pulse">
                        <div className="h-6 bg-imi-100 rounded w-48 mb-4" />
                        <div className="h-full bg-imi-50 rounded" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Row 1: Funil + Origem */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funil de Conversão */}
                <div className="bg-white rounded-2xl border border-imi-100 p-6">
                    <h3 className="text-lg font-bold text-imi-900 mb-6">Funil de Conversão</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={funnelData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={100} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px'
                                }}
                            />
                            <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                                {funnelData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Origem dos Leads */}
                <div className="bg-white rounded-2xl border border-imi-100 p-6">
                    <h3 className="text-lg font-bold text-imi-900 mb-6">Origem dos Leads</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={sourceData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(props: any) => `${props.name} (${(props.percent * 100).toFixed(0)}%)`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {sourceData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={Object.values(COLORS)[index % Object.values(COLORS).length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 2: Performance por País */}
            <div className="bg-white rounded-2xl border border-imi-100 p-6">
                <h3 className="text-lg font-bold text-imi-900 mb-6">Performance por Jurisdição</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={countryData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke={COLORS.blue} />
                        <YAxis yAxisId="right" orientation="right" stroke={COLORS.green} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px'
                            }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="leads" fill={COLORS.blue} name="Leads" radius={[8, 8, 0, 0]} />
                        <Bar yAxisId="left" dataKey="developments" fill={COLORS.purple} name="Empreendimentos" radius={[8, 8, 0, 0]} />
                        <Bar yAxisId="right" dataKey="value" fill={COLORS.green} name="Valor (Mi)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Row 3: Timeline + Score */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Timeline de Performance */}
                <div className="bg-white rounded-2xl border border-imi-100 p-6">
                    <h3 className="text-lg font-bold text-imi-900 mb-6">Evolução (6 meses)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={timelineData}>
                            <defs>
                                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorConversoes" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="leads"
                                stroke={COLORS.blue}
                                fillOpacity={1}
                                fill="url(#colorLeads)"
                                name="Total Leads"
                            />
                            <Area
                                type="monotone"
                                dataKey="conversoes"
                                stroke={COLORS.green}
                                fillOpacity={1}
                                fill="url(#colorConversoes)"
                                name="Conversões"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Distribuição de Score */}
                <div className="bg-white rounded-2xl border border-imi-100 p-6">
                    <h3 className="text-lg font-bold text-imi-900 mb-6">Qualificação de Leads (Score)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={scoreData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px'
                                }}
                            />
                            <Bar dataKey="value" fill={COLORS.primary} name="Quantidade" radius={[8, 8, 0, 0]}>
                                {scoreData.map((entry, index) => {
                                    let color = COLORS.red
                                    if (entry.name.startsWith('61')) color = COLORS.yellow
                                    if (entry.name.startsWith('81')) color = COLORS.green
                                    return <Cell key={`cell-${index}`} fill={color} />
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
