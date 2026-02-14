'use client'

import { useParams } from 'next/navigation'
import PageHeader from '../../../components/PageHeader'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/Badge'
import { Badge } from '@/components/ui/Badge'
import { CardSkeleton } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Select'
import {
    Eye,
    Users,
    TrendingUp,
    MessageSquare,
    Instagram,
    Facebook,
    Globe,
    Mail,
    Phone,
} from 'lucide-react'
import { useDevelopments } from '@/hooks/use-developments'

// Mock analytics data (depois virá do Supabase)
const mockAnalytics = {
    views: {
        total: 2847,
        change: 18.2,
        trend: 'up' as const,
    },
    leads: {
        total: 124,
        change: 12.5,
        trend: 'up' as const,
    },
    conversion: {
        value: 4.36,
        change: -0.8,
        trend: 'down' as const,
    },
    engagement: {
        avgTime: '3m 42s',
        change: 22.3,
        trend: 'up' as const,
    },
    leadsBySource: [
        { source: 'Instagram', count: 42, icon: Instagram, color: 'text-pink-600 bg-pink-50' },
        { source: 'Facebook', count: 38, icon: Facebook, color: 'text-blue-600 bg-blue-50' },
        { source: 'Website', count: 28, icon: Globe, color: 'text-green-600 bg-green-50' },
        { source: 'Email', count: 12, icon: Mail, color: 'text-purple-600 bg-purple-50' },
        { source: 'WhatsApp', count: 4, icon: Phone, color: 'text-green-600 bg-green-50' },
    ],
    viewsByDay: [
        { day: 'Seg', views: 342 },
        { day: 'Ter', views: 428 },
        { day: 'Qua', views: 389 },
        { day: 'Qui', views: 512 },
        { day: 'Sex', views: 463 },
        { day: 'Sáb', views: 398 },
        { day: 'Dom', views: 315 },
    ],
}

export default function ImovelAnalyticsPage() {
    const params = useParams()
    const { developments, isLoading } = useDevelopments()
    const development = developments?.find((dev: any) => dev.id === params.id)

    if (isLoading) {
        return (
            <div className="space-y-6">
                <CardSkeleton />
            </div>
        )
    }

    if (!development) {
        return (
            <div className="space-y-6">
                <PageHeader title="Empreendimento não encontrado" />
                <Card>
                    <CardBody>
                        <p className="text-center text-imi-600 py-8">
                            O empreendimento solicitado não existe ou você não possui permissão para acessá-lo.
                        </p>
                    </CardBody>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Analytics & Performance"
                subtitle={`Inteligência de mercado: ${development.name}`}
                breadcrumbs={[
                    { name: 'Dashboard', href: '/backoffice/dashboard' },
                    { name: 'Imóveis', href: '/backoffice/imoveis' },
                    { name: development.name, href: `/backoffice/imoveis/${development.id}` },
                    { name: 'Analytics' },
                ]}
                action={
                    <Select
                        options={[
                            { value: '7d', label: 'Últimos 7 dias' },
                            { value: '30d', label: 'Últimos 30 dias' },
                            { value: '90d', label: 'Últimos 90 dias' },
                        ]}
                        defaultValue="7d"
                        className="w-48"
                    />
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    label="Visualizações"
                    value={mockAnalytics.views.total.toLocaleString('pt-BR')}
                    change={{
                        value: mockAnalytics.views.change,
                        trend: mockAnalytics.views.trend,
                        label: 'vs período anterior',
                    }}
                    icon={<Eye size={20} />}
                    variant="primary"
                />

                <KPICard
                    label="Leads Gerados"
                    value={mockAnalytics.leads.total.toString()}
                    change={{
                        value: mockAnalytics.leads.change,
                        trend: mockAnalytics.leads.trend,
                    }}
                    icon={<Users size={20} />}
                    variant="success"
                />

                <KPICard
                    label="Taxa de Conversão"
                    value={`${mockAnalytics.conversion.value}%`}
                    change={{
                        value: Math.abs(mockAnalytics.conversion.change),
                        trend: mockAnalytics.conversion.trend,
                    }}
                    icon={<TrendingUp size={20} />}
                    variant={mockAnalytics.conversion.trend === 'up' ? 'success' : 'warning'}
                />

                <KPICard
                    label="Tempo Médio"
                    value={mockAnalytics.engagement.avgTime}
                    change={{
                        value: mockAnalytics.engagement.change,
                        trend: mockAnalytics.engagement.trend,
                    }}
                    icon={<MessageSquare size={20} />}
                    variant="default"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Leads by Source */}
                <Card>
                    <CardHeader title="Leads por Origem" subtitle="Distribuição de canais de aquisição" />
                    <CardBody>
                        <div className="space-y-6">
                            {mockAnalytics.leadsBySource.map((item) => {
                                const Icon = item.icon
                                const total = mockAnalytics.leadsBySource.reduce((acc, i) => acc + i.count, 0)
                                const percentage = ((item.count / total) * 100).toFixed(1)

                                return (
                                    <div key={item.source} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center`}>
                                                    <Icon size={18} />
                                                </div>
                                                <span className="text-sm font-bold text-imi-900">
                                                    {item.source}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-imi-500">{percentage}%</span>
                                                <Badge variant="neutral" size="sm">{item.count} leads</Badge>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-imi-50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-accent-500 transition-all duration-700 ease-smooth"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardBody>
                </Card>

                {/* Views by Day */}
                <Card>
                    <CardHeader title="Visualizações Diárias" subtitle="Volume de tráfego na última semana" />
                    <CardBody>
                        <div className="space-y-6">
                            {mockAnalytics.viewsByDay.map((day) => {
                                const maxViews = Math.max(...mockAnalytics.viewsByDay.map((d) => d.views))
                                const percentage = (day.views / maxViews) * 100

                                return (
                                    <div key={day.day} className="flex items-center gap-4">
                                        <div className="w-12 text-xs font-black text-imi-400 uppercase tracking-widest">{day.day}</div>
                                        <div className="flex-1">
                                            <div className="h-10 bg-imi-50 rounded-xl overflow-hidden relative border border-imi-100/50">
                                                <div
                                                    className="h-full bg-gradient-to-r from-accent-400 to-accent-600 transition-all duration-700 ease-smooth flex items-center justify-end pr-4"
                                                    style={{ width: `${percentage}%` }}
                                                >
                                                    <span className="text-xs font-black text-white drop-shadow-sm">{day.views}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Performance Summary */}
            <Card className="bg-imi-950 text-white border-none shadow-elevated">
                <CardHeader title="Insights de Performance" className="text-white border-imi-800" />
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center text-center space-y-2 p-4">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-2">
                                <Calendar size={24} className="text-accent-400" />
                            </div>
                            <p className="text-[10px] font-black text-imi-400 uppercase tracking-[0.2em]">Melhor Dia</p>
                            <p className="text-xl font-bold text-white">Quinta-feira</p>
                            <p className="text-xs text-imi-300">Pico de 512 visualizações</p>
                        </div>

                        <div className="flex flex-col items-center text-center space-y-2 p-4 border-l border-r border-white/10">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-2">
                                <Instagram size={24} className="text-pink-400" />
                            </div>
                            <p className="text-[10px] font-black text-imi-400 uppercase tracking-[0.2em]">Canal Dominante</p>
                            <p className="text-xl font-bold text-white">Instagram Ads</p>
                            <p className="text-xs text-imi-300">42 leads qualificados (33.9%)</p>
                        </div>

                        <div className="flex flex-col items-center text-center space-y-2 p-4">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-2">
                                <Users size={24} className="text-green-400" />
                            </div>
                            <p className="text-[10px] font-black text-imi-400 uppercase tracking-[0.2em]">Período Crítico</p>
                            <p className="text-xl font-bold text-white">19:00 — 21:00</p>
                            <p className="text-xs text-imi-300">Máximo engajamento detectado</p>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    )
}

function Calendar({ size, className }: { size: number; className?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
    )
}
