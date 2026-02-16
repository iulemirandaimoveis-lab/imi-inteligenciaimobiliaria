'use client'

import { useState } from 'react'
import PageHeader from '../../components/PageHeader'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { KPICard, Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import {
    FileText,
    Clock,
    DollarSign,
    TrendingUp,
    CheckCircle,
    Users,
    Building2,
    PieChart,
    BarChart3,
    MapPin,
    Target,
    Zap
} from 'lucide-react'

// Mock data (depois virá do Supabase)
const mockAnalytics = {
    overview: {
        total: 124,
        pending: 23,
        completed: 87,
        cancelled: 14,
        avgTime: 3.2, // dias
        totalRevenue: 186000,
    },

    byType: [
        { type: 'Residencial', count: 78, percentage: 62.9, avgValue: 450000 },
        { type: 'Comercial', count: 31, percentage: 25.0, avgValue: 1200000 },
        { type: 'Terreno', count: 15, percentage: 12.1, avgValue: 320000 },
    ],

    byMethod: [
        { method: 'Comparativo', count: 68, percentage: 54.8 },
        { method: 'Renda', count: 31, percentage: 25.0 },
        { method: 'Custo', count: 25, percentage: 20.2 },
    ],

    monthlyTrend: [
        { month: 'Ago', total: 18, completed: 15, revenue: 27000 },
        { month: 'Set', total: 21, completed: 18, revenue: 31500 },
        { month: 'Out', total: 19, completed: 16, revenue: 28500 },
        { month: 'Nov', total: 24, completed: 20, revenue: 36000 },
        { month: 'Dez', total: 22, completed: 18, revenue: 33000 },
        { month: 'Jan', total: 20, completed: 17, revenue: 30000 },
    ],

    topClients: [
        { name: 'Construtora ABC', count: 12, revenue: 18000 },
        { name: 'Investimentos XYZ', count: 8, revenue: 12000 },
        { name: 'Imobiliária Central', count: 6, revenue: 9000 },
    ],

    avgByNeighborhood: [
        { neighborhood: 'Boa Viagem', avgValue: 520000, count: 28 },
        { neighborhood: 'Pina', avgValue: 480000, count: 19 },
        { neighborhood: 'Piedade', avgValue: 380000, count: 15 },
        { neighborhood: 'Setúbal', avgValue: 420000, count: 12 },
    ],
}

export default function AvaliacoesAnalyticsPage() {
    const [timeRange, setTimeRange] = useState('6m')
    const data = mockAnalytics

    const completionRate = ((data.overview.completed / data.overview.total) * 100).toFixed(1)

    return (
        <div className="space-y-6">
            <PageHeader
                title="Intelligence: Laudos & Avaliações"
                subtitle="Performance analítica do motor de avaliação imobiliária"
                breadcrumbs={[
                    { name: 'Dashboard', href: '/backoffice/backoffice/dashboard' },
                    { name: 'Avaliações', href: '/backoffice/backoffice/avaliacoes' },
                    { name: 'Analytics Strategist' },
                ]}
                action={
                    <div className="flex items-center gap-4">
                        <Select
                            className="w-48 bg-white"
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            options={[
                                { value: '30d', label: 'Ciclo: 30 dias' },
                                { value: '3m', label: 'Ciclo: 3 meses' },
                                { value: '6m', label: 'Ciclo: 6 meses' },
                                { value: 'year', label: 'Visão Anual' },
                            ]}
                        />
                        <Button variant="outline" icon={<Zap size={18} />} className="bg-white">Insight Rápido</Button>
                    </div>
                }
            />

            {/* KPI Scorecard Architecture */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    label="Volume de Laudos"
                    value={data.overview.total.toString()}
                    icon={<FileText />}
                    variant="primary"
                    className="shadow-elevated"
                />

                <KPICard
                    label="Taxa de Entrega"
                    value={`${completionRate}%`}
                    change={{ value: 4.2, label: 'vs. mês anterior', trend: 'up' }}
                    icon={<CheckCircle />}
                    variant="success"
                    className="shadow-elevated"
                />

                <KPICard
                    label="SLA Médio (Lead Time)"
                    value={`${data.overview.avgTime} Dias`}
                    change={{ value: -12, label: 'otimização de tempo', trend: 'up' }}
                    icon={<Clock />}
                    variant="info"
                    className="shadow-elevated"
                />

                <KPICard
                    label="Billing Total"
                    value={`R$ ${(data.overview.totalRevenue / 1000).toFixed(0)}k`}
                    icon={<DollarSign />}
                    variant="success"
                    className="bg-imi-950 border-imi-800 text-white shadow-glow"
                />
            </div>

            {/* Strategic Distribution Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Market Segmentation Strategy */}
                <Card className="shadow-elevated border-imi-50">
                    <CardHeader title="Segmentação de Ativos Evaluated" subtitle="Distribuição por tipologia de imóvel" />
                    <CardBody className="p-8">
                        <div className="space-y-8">
                            {data.byType.map((item) => (
                                <div key={item.type} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-imi-50 flex items-center justify-center text-imi-400">
                                                {item.type === 'Residencial' ? <Building2 size={18} /> : <Target size={18} />}
                                            </div>
                                            <span className="text-sm font-black text-imi-900 uppercase tracking-wider">
                                                {item.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-black text-accent-600">{item.percentage}%</span>
                                            <Badge variant="neutral" size="sm">{item.count} laudos</Badge>
                                        </div>
                                    </div>
                                    <div className="h-3 bg-imi-50 rounded-full overflow-hidden border border-imi-100">
                                        <div
                                            className="h-full bg-accent-500 transition-all duration-1000 ease-smooth rounded-full"
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest pl-1">
                                            Ticket Médio Avaliado: <span className="text-imi-900">R$ {(item.avgValue / 1000).toFixed(0)}k</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>

                {/* NBR Methodology Adherence */}
                <Card className="shadow-elevated border-imi-50">
                    <CardHeader title="Metodologias (NBR 14653)" subtitle="Consistência técnica dos laudos emitidos" />
                    <CardBody className="p-8">
                        <div className="space-y-8">
                            {data.byMethod.map((item) => (
                                <div key={item.method} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black text-imi-900 uppercase tracking-[0.1em]">
                                            Método {item.method}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-imi-400">{item.percentage}%</span>
                                            <Badge variant="primary" size="sm" dot>{item.count}</Badge>
                                        </div>
                                    </div>
                                    <div className="h-3 bg-imi-50 rounded-2xl overflow-hidden border border-imi-100/50">
                                        <div
                                            className="h-full bg-imi-950 transition-all duration-1000 ease-smooth rounded-2xl shadow-sm"
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Financial Velocity Timeline */}
            <Card className="shadow-elevated border-imi-50">
                <CardHeader title="Trend de Billing & Produtividade" subtitle="Sazonalidade e volume semestral" />
                <CardBody className="p-8">
                    <div className="space-y-6">
                        {data.monthlyTrend.map((month) => {
                            const maxTotal = Math.max(...data.monthlyTrend.map((m) => m.total))
                            const percentage = (month.total / maxTotal) * 100

                            return (
                                <div key={month.month} className="group">
                                    <div className="flex flex-col md:flex-row items-center gap-8">
                                        <div className="w-20 text-center md:text-left shrink-0">
                                            <span className="text-xs font-black uppercase text-imi-900 group-hover:text-accent-600 transition-colors">
                                                {month.month}
                                            </span>
                                        </div>
                                        <div className="flex-1 w-full relative">
                                            <div className="h-12 bg-imi-50 rounded-2xl overflow-hidden border border-imi-100/50">
                                                <div
                                                    className="h-full bg-accent-500/10 border-r-4 border-accent-500 transition-all duration-1000 ease-smooth"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                                <div className="absolute inset-y-0 left-6 flex items-center gap-4">
                                                    <span className="text-[10px] font-black text-imi-950 uppercase tracking-widest">{month.total} Demandas</span>
                                                    <span className="w-1 h-1 bg-imi-300 rounded-full"></span>
                                                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">{month.completed} Entregas</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-full md:w-32 text-right">
                                            <p className="text-[9px] font-black text-imi-300 uppercase tracking-widest mb-1">Faturamento</p>
                                            <p className="text-xl font-black text-imi-900">R$ {(month.revenue / 1000).toFixed(0)}k</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardBody>
            </Card>

            {/* Bottom Intelligence Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Client Retention High-Performance */}
                <Card className="shadow-elevated border-imi-50">
                    <CardHeader title="Top Contratantes: B2B Strategy" subtitle="Fidelização por volume de ordens" />
                    <CardBody className="p-8">
                        <div className="space-y-4">
                            {data.topClients.map((client, index) => (
                                <div key={client.name} className="flex items-center gap-6 p-6 bg-imi-50/50 rounded-3xl border border-imi-100/30 hover:bg-white hover:border-accent-200 transition-all group">
                                    <div className="w-12 h-12 rounded-2xl bg-imi-950 text-accent-500 flex items-center justify-center text-lg font-black shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-black text-imi-900 uppercase tracking-tight truncate">{client.name}</p>
                                        <p className="text-[10px] font-bold text-imi-400 uppercase tracking-[0.2em] mt-1">
                                            {client.count} Ordens de Avaliação
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-accent-700">
                                            R$ {(client.revenue / 1000).toFixed(0)}k
                                        </p>
                                        <p className="text-[9px] font-black text-imi-400 uppercase tracking-widest">Revenue Life-Time</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>

                {/* Geospatial Valuation Matrix */}
                <Card className="shadow-elevated border-imi-50">
                    <CardHeader title="Matriz de Valorização por Bairro" icon={<MapPin size={18} className="text-accent-500" />} />
                    <CardBody className="p-8">
                        <div className="space-y-6">
                            {data.avgByNeighborhood.map((item) => {
                                const maxValue = Math.max(...data.avgByNeighborhood.map((i) => i.avgValue))
                                const percentage = (item.avgValue / maxValue) * 100

                                return (
                                    <div key={item.neighborhood} className="space-y-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] font-black text-imi-950 uppercase tracking-widest">
                                                {item.neighborhood}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-black text-green-600">
                                                    R$ {(item.avgValue / 1000).toFixed(0)}k
                                                </span>
                                                <Badge variant="neutral" size="sm" className="bg-imi-50 text-[10px]">
                                                    {item.count} Lds
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="h-4 bg-imi-50 rounded-2xl overflow-hidden border border-imi-100/50">
                                            <div
                                                className="h-full bg-green-500 transition-all duration-1000 ease-smooth rounded-full shadow-sm"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Executive Summary Unit Economics */}
            <Card className="bg-imi-950 border-imi-800 shadow-glow overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <PieChart size={180} />
                </div>
                <CardHeader title="Executive Summary & Unit Economics" className="text-white border-white/10" />
                <CardBody className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10">
                            <p className="text-[10px] font-bold text-imi-400 uppercase tracking-widest mb-3">Efficiency Score</p>
                            <p className="text-5xl font-black text-green-400 mb-2">
                                {completionRate}<span className="text-xl">%</span>
                            </p>
                            <p className="text-xs text-imi-500 font-bold uppercase tracking-widest">
                                {data.overview.completed} Adregues / {data.overview.total} Demandas
                            </p>
                        </div>

                        <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10">
                            <p className="text-[10px] font-bold text-imi-400 uppercase tracking-widest mb-3">Unit Billing Médio</p>
                            <p className="text-5xl font-black text-accent-500 mb-2">
                                <span className="text-xl">R$</span>{(data.overview.totalRevenue / data.overview.total).toFixed(0)}
                            </p>
                            <p className="text-xs text-imi-500 font-bold uppercase tracking-widest">Por Laudo Emitido</p>
                        </div>

                        <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10">
                            <p className="text-[10px] font-bold text-imi-400 uppercase tracking-widest mb-3">Escalabilidade Mensal</p>
                            <p className="text-5xl font-black text-blue-400 mb-2">
                                {(data.overview.total / 6).toFixed(1)}
                            </p>
                            <p className="text-xs text-imi-500 font-bold uppercase tracking-widest">Avaliações / Mês (Histo)</p>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    )
}
