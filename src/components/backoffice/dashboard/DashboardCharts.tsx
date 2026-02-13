'use client'

import React, { useState, useEffect } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area,
    FunnelChart,
    Funnel,
    LabelList
} from 'recharts'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const COLORS = ['#D4AF37', '#1A1A1A', '#4A5568', '#718096', '#A0AEC0', '#CBD5E0', '#E2E8F0']

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] font-bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    )
}

export default function DashboardCharts() {
    const [loading, setLoading] = useState(true)
    const [funnelData, setFunnelData] = useState<any[]>([])
    const [sourceData, setSourceData] = useState<any[]>([])
    const [countryData, setCountryData] = useState<any[]>([])
    const [timelineData, setTimelineData] = useState<any[]>([])
    const [scoreData, setScoreData] = useState<any[]>([])

    useEffect(() => {
        loadChartData()
    }, [])

    const loadChartData = async () => {
        setLoading(true)
        try {
            const { data: leads } = await supabase.from('leads').select('*')
            const { data: developments } = await supabase.from('developments').select('id, region')

            if (!leads) return

            // 1. Funil de Conversão (7 estágios)
            const stages = [
                { value: 'new', name: 'Novo', fill: '#CBD5E0' },
                { value: 'contacted', name: 'Contato', fill: '#A0AEC0' },
                { value: 'qualified', name: 'Qualificado', fill: '#718096' },
                { value: 'visiting', name: 'Visita', fill: '#4A5568' },
                { value: 'negotiating', name: 'Negociação', fill: '#D4AF37' },
                { value: 'proposal', name: 'Proposta', fill: '#B8962D' },
                { value: 'won', name: 'Fechado', fill: '#1A1A1A' }
            ]

            const countsByStage = stages.map(stage => ({
                name: stage.name,
                value: leads.filter(l => l.status === stage.value).length,
                fill: stage.fill
            })).filter(s => s.value > 0).sort((a, b) => b.value - a.value)

            setFunnelData(countsByStage)

            // 2. Origem de Leads (Pizza)
            const sourceCount: Record<string, number> = {}
            leads.forEach(l => {
                const src = l.source || 'Direto'
                sourceCount[src] = (sourceCount[src] || 0) + 1
            })
            setSourceData(Object.entries(sourceCount).map(([name, value]) => ({ name, value })))

            // 3. Performance por País (Barras)
            const countryStats: Record<string, { count: number; won: number }> = {
                'Brasil': { count: 0, won: 0 },
                'EUA': { count: 0, won: 0 },
                'Dubai': { count: 0, won: 0 }
            }

            leads.forEach(l => {
                if (l.development_id) {
                    const dev = developments?.find(d => d.id === l.development_id)
                    const region = dev?.region?.toLowerCase() || ''
                    let country = 'Brasil'
                    if (region.includes('usa') || region.includes('eua') || region.includes('florida')) country = 'EUA'
                    else if (region.includes('dubai') || region.includes('emirados')) country = 'Dubai'

                    countryStats[country].count++
                    if (l.status === 'won') countryStats[country].won++
                }
            })
            setCountryData(Object.entries(countryStats).map(([name, stats]) => ({
                name,
                leads: stats.count,
                vendas: stats.won
            })))

            // 4. Timeline de Evolução (6 meses)
            const months = []
            for (let i = 5; i >= 0; i--) {
                const d = new Date()
                d.setMonth(d.getMonth() - i)
                months.push({
                    label: d.toLocaleDateString('pt-BR', { month: 'short' }),
                    month: d.getMonth(),
                    year: d.getFullYear(),
                    count: 0
                })
            }

            leads.forEach(l => {
                const date = new Date(l.created_at)
                const timelineMonth = months.find(m => m.month === date.getMonth() && m.year === date.getFullYear())
                if (timelineMonth) timelineMonth.count++
            })
            setTimelineData(months.map(m => ({ name: m.label, leads: m.count })))

            // 5. Distribuição de Score
            const scores = [
                { range: '0-20', label: 'Frio', count: 0, color: '#EF4444' },
                { range: '21-40', label: 'Morno', count: 0, color: '#F59E0B' },
                { range: '41-60', label: 'Interesse', count: 0, color: '#3B82F6' },
                { range: '61-80', label: 'Quente', count: 0, color: '#10B981' },
                { range: '81-100', label: 'VIP', count: 0, color: '#D4AF37' }
            ]

            leads.forEach(l => {
                const score = l.score || 0
                if (score <= 20) scores[0].count++
                else if (score <= 40) scores[1].count++
                else if (score <= 60) scores[2].count++
                else if (score <= 80) scores[3].count++
                else scores[4].count++
            })
            setScoreData(scores)

        } catch (error) {
            console.error('Erro ao carregar gráficos:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="h-96 flex items-center justify-center">Carregando inteligência...</div>

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Funil de Conversão */}
            <div className="bg-white p-6 rounded-2xl border border-imi-100 shadow-soft">
                <h3 className="text-lg font-bold text-imi-900 mb-6">Funil de Conversão Patrimonial</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <FunnelChart>
                            <Tooltip />
                            <Funnel
                                dataKey="value"
                                data={funnelData}
                                isAnimationActive
                            >
                                <LabelList position="right" fill="#888" stroke="none" dataKey="name" />
                            </Funnel>
                        </FunnelChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Origem de Leads */}
            <div className="bg-white p-6 rounded-2xl border border-imi-100 shadow-soft">
                <h3 className="text-lg font-bold text-imi-900 mb-6">Origem Estratégica</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={sourceData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {sourceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-4 mt-2">
                        {sourceData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-xs text-imi-600">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Performance por País */}
            <div className="bg-white p-6 rounded-2xl border border-imi-100 shadow-soft">
                <h3 className="text-lg font-bold text-imi-900 mb-6">Performance por Jurisdição</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={countryData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                            <Tooltip cursor={{ fill: '#F8FAFC' }} />
                            <Bar dataKey="leads" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={40} />
                            <Bar dataKey="vendas" fill="#1A1A1A" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-accent-600" />
                            <span className="text-xs text-imi-600">Leads</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-background-dark" />
                            <span className="text-xs text-imi-600">Vendas</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline de Evolução */}
            <div className="bg-white p-6 rounded-2xl border border-imi-100 shadow-soft">
                <h3 className="text-lg font-bold text-imi-900 mb-6">Evolução da Carteira (6 Meses)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timelineData}>
                            <defs>
                                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                            <Tooltip />
                            <Area type="monotone" dataKey="leads" stroke="#D4AF37" fillOpacity={1} fill="url(#colorLeads)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Distribuição de Score */}
            <div className="bg-white p-6 rounded-2xl border border-imi-100 shadow-soft lg:col-span-2">
                <h3 className="text-lg font-bold text-imi-900 mb-6">Distribuição de Qualificação (Score IMI)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={scoreData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                            <Tooltip />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={60}>
                                {scoreData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-6 mt-6">
                        {scoreData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-xs font-bold text-imi-700">{entry.label}</span>
                                <span className="text-[10px] text-imi-400">({entry.range})</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
