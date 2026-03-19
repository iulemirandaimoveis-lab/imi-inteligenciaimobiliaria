'use client'

import { Building2, DollarSign, Package, TrendingUp } from 'lucide-react'
import { useDevelopments } from '@/hooks/use-developments'
import { Development } from '@/types/development'

export default function PropertyKPIs() {
    const { developments, isLoading } = useDevelopments({})

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 animate-pulse">
                        <div className="h-12 w-12 bg-slate-200 rounded-xl mb-4"></div>
                        <div className="h-8 bg-slate-200 rounded mb-2"></div>
                        <div className="h-4 bg-slate-200 rounded w-20"></div>
                    </div>
                ))}
            </div>
        )
    }

    const total = developments?.length || 0
    const active = developments?.filter(d => d.status_commercial === 'published').length || 0

    // Safe calculations with fallbacks
    const totalValue = developments?.reduce((sum, d) => sum + ((d.price_from || 0) * (d.units_count || 0)), 0) || 0

    const avgPrice = total > 0
        ? (developments?.reduce((sum, d) => sum + (d.price_from || 0), 0) || 0) / total
        : 0

    const totalUnits = developments?.reduce((sum, d) => sum + (d.units_count || 0), 0) || 0

    // Handling views which might be 'views' in DB but 'views_count' in type, or vice versa
    const totalViews = developments?.reduce((sum, d) => sum + ((d as Record<string, unknown>).views || (d as Record<string, unknown>).views_count || 0), 0) || 0
    const totalLeads = developments?.reduce((sum, d) => sum + (d.leads_count || 0), 0) || 0

    const kpis = [
        {
            title: 'Total Imóveis',
            value: total,
            subtitle: `${active} ativos`,
            icon: Building2,
            color: 'bg-imi-900',
        },
        {
            title: 'Valor Total',
            value: new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                notation: 'compact',
                maximumFractionDigits: 1
            }).format(totalValue),
            subtitle: `Média ${new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                notation: 'compact',
                maximumFractionDigits: 1
            }).format(avgPrice)}`,
            icon: DollarSign,
            color: 'bg-accent-500', // Assuming accent-500 exists or using a fallback if not defined in tailwind config. User provided it.
        },
        {
            title: 'Total Unidades',
            value: totalUnits.toLocaleString('pt-BR'),
            subtitle: `${total > 0 ? (totalUnits / total).toFixed(0) : 0} por empreendimento`,
            icon: Package,
            color: 'bg-imi-700',
        },
        {
            title: 'Performance',
            value: totalViews.toLocaleString('pt-BR'),
            subtitle: `${totalLeads} leads gerados`,
            icon: TrendingUp,
            color: 'bg-imi-500',
        },
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpis.map((kpi) => (
                <div
                    key={kpi.title}
                    className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 ${kpi.color} text-white rounded-xl flex items-center justify-center`}>
                            <kpi.icon className="w-6 h-6" strokeWidth={2} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-imi-900 mb-1">{kpi.value}</div>
                    <div className="text-sm text-slate-600">{kpi.title}</div>
                    <div className="text-xs text-slate-500 mt-1">{kpi.subtitle}</div>
                </div>
            ))}
        </div>
    )
}
