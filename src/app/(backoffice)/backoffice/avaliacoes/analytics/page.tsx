'use client'

import { useState } from 'react'
import PageHeader from '../../../components/PageHeader'
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

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    hover: 'var(--bo-hover)',
    accent: 'var(--bo-accent)',
}

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
                    { label: 'Dashboard', href: '/backoffice/dashboard' },
                    { label: 'Avaliações', href: '/backoffice/avaliacoes' },
                    { label: 'Analytics Strategist' },
                ]}
                action={
                    <div className="flex items-center gap-4">
                        <Select
                            className="w-48"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            options={[
                                { value: '30d', label: 'Ciclo: 30 dias' },
                                { value: '3m', label: 'Ciclo: 3 meses' },
                                { value: '6m', label: 'Ciclo: 6 meses' },
                                { value: 'year', label: 'Visão Anual' },
                            ]}
                        />
                        <Button variant="outline" icon={<Zap size={18} />} style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}>Insight Rápido</Button>
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
                    variant="primary"
                    className="shadow-elevated"
                />

                <KPICard
                    label="Billing Total"
                    value={`R$ ${(data.overview.totalRevenue / 1000).toFixed(0)}k`}
                    icon={<DollarSign />}
                    variant="success"
                    style={{ background: '#0D1117', border: '1px solid #334E68' }}
                />
            </div>

            {/* Strategic Distribution Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Market Segmentation Strategy */}
                <Card className="shadow-elevated" style={{ border: `1px solid ${T.border}` }}>
                    <CardHeader title="Segmentação de Ativos Evaluated" subtitle="Distribuição por tipologia de imóvel" />
                    <CardBody className="p-8">
                        <div className="space-y-8">
                            {data.byType.map((item) => (
                                <div key={item.type} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: T.elevated, color: T.textMuted }}>
                                                {item.type === 'Residencial' ? <Building2 size={18} /> : <Target size={18} />}
                                            </div>
                                            <span className="text-sm font-black uppercase tracking-wider" style={{ color: T.text }}>
                                                {item.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-black text-[var(--bo-accent)]">{item.percentage}%</span>
                                            <Badge variant="neutral" size="sm">{item.count} laudos</Badge>
                                        </div>
                                    </div>
                                    <div className="h-3 rounded-full overflow-hidden" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                        <div
                                            className="h-full bg-[#102A43] transition-all duration-1000 ease-smooth rounded-full"
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest pl-1" style={{ color: T.textMuted }}>
                                            Ticket Médio Avaliado: <span style={{ color: T.text }}>R$ {(item.avgValue / 1000).toFixed(0)}k</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>

                {/* NBR Methodology Adherence */}
                <Card className="shadow-elevated" style={{ border: `1px solid ${T.border}` }}>
                    <CardHeader title="Metodologias (NBR 14653)" subtitle="Consistência técnica dos laudos emitidos" />
                    <CardBody className="p-8">
                        <div className="space-y-8">
                            {data.byMethod.map((item) => (
                                <div key={item.method} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black uppercase tracking-[0.1em]" style={{ color: T.text }}>
                                            Método {item.method}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black" style={{ color: T.textMuted }}>{item.percentage}%</span>
                                            <Badge variant="primary" size="sm" dot>{item.count}</Badge>
                                        </div>
                                    </div>
                                    <div className="h-3 rounded-2xl overflow-hidden" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                        <div
                                            className="h-full transition-all duration-1000 ease-smooth rounded-2xl shadow-sm"
                                            style={{ width: `${item.percentage}%`, background: T.text }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Financial Velocity Timeline */}
            <Card className="shadow-elevated" style={{ border: `1px solid ${T.border}` }}>
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
                                            <span className="text-xs font-black uppercase group-hover:text-[var(--bo-accent)] transition-colors" style={{ color: T.text }}>
                                                {month.month}
                                            </span>
                                        </div>
                                        <div className="flex-1 w-full relative">
                                            <div className="h-12 rounded-2xl overflow-hidden" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                                <div
                                                    className="h-full bg-[#102A43]/10 border-r-4 border-[#334E68] transition-all duration-1000 ease-smooth"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                                <div className="absolute inset-y-0 left-6 flex items-center gap-4">
                                                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.text }}>{month.total} Demandas</span>
                                                    <span className="w-1 h-1 rounded-full" style={{ background: T.border }}></span>
                                                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">{month.completed} Entregas</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-full md:w-32 text-right">
                                            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: T.textMuted }}>Faturamento</p>
                                            <p className="text-xl font-black" style={{ color: T.text }}>R$ {(month.revenue / 1000).toFixed(0)}k</p>
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
                <Card className="shadow-elevated" style={{ border: `1px solid ${T.border}` }}>
                    <CardHeader title="Top Contratantes: B2B Strategy" subtitle="Fidelização por volume de ordens" />
                    <CardBody className="p-8">
                        <div className="space-y-4">
                            {data.topClients.map((client, index) => (
                                <div key={client.name} className="flex items-center gap-6 p-6 rounded-3xl transition-all group" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 shadow-lg group-hover:scale-110 transition-transform" style={{ background: T.surface, color: 'var(--bo-accent)' }}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-black uppercase tracking-tight truncate" style={{ color: T.text }}>{client.name}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1" style={{ color: T.textMuted }}>
                                            {client.count} Ordens de Avaliação
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black" style={{ color: T.text }}>
                                            R$ {(client.revenue / 1000).toFixed(0)}k
                                        </p>
                                        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Revenue Life-Time</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>

                {/* Geospatial Valuation Matrix */}
                <Card className="shadow-elevated" style={{ border: `1px solid ${T.border}` }}>
                    <CardHeader title="Matriz de Valorização por Bairro" />
                    <CardBody className="p-8">
                        <div className="space-y-6">
                            {data.avgByNeighborhood.map((item) => {
                                const maxValue = Math.max(...data.avgByNeighborhood.map((i) => i.avgValue))
                                const percentage = (item.avgValue / maxValue) * 100

                                return (
                                    <div key={item.neighborhood} className="space-y-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: T.text }}>
                                                {item.neighborhood}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-black text-green-600">
                                                    R$ {(item.avgValue / 1000).toFixed(0)}k
                                                </span>
                                                <Badge variant="neutral" size="sm" className="text-[10px]">
                                                    {item.count} Lds
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="h-4 rounded-2xl overflow-hidden" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
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
            <Card className="overflow-hidden relative" style={{ background: '#0D1117', border: '1px solid #334E68' }}>
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <PieChart size={180} />
                </div>
                <CardHeader title="Executive Summary & Unit Economics" className="text-white border-white/10" />
                <CardBody className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="text-center p-8 rounded-3xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Efficiency Score</p>
                            <p className="text-5xl font-black text-green-400 mb-2">
                                {completionRate}<span className="text-xl">%</span>
                            </p>
                            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                {data.overview.completed} Entregas / {data.overview.total} Demandas
                            </p>
                        </div>

                        <div className="text-center p-8 rounded-3xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Unit Billing Médio</p>
                            <p className="text-5xl font-black text-[var(--bo-accent)] mb-2">
                                <span className="text-xl">R$</span>{(data.overview.totalRevenue / data.overview.total).toFixed(0)}
                            </p>
                            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>Por Laudo Emitido</p>
                        </div>

                        <div className="text-center p-8 rounded-3xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Escalabilidade Mensal</p>
                            <p className="text-5xl font-black text-blue-400 mb-2">
                                {(data.overview.total / 6).toFixed(1)}
                            </p>
                            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>Avaliações / Mês (Histo)</p>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    )
}
