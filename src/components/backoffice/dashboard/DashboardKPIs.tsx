'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Users,
    DollarSign,
    TrendingUp,
    ShoppingBag,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react'

const supabase = createClient()

interface KPIStats {
    totalLeads: number
    leadsGrowth: number
    totalSales: number
    salesGrowth: number
    pipelineValue: number
    pipelineGrowth: number
    conversionRate: number
    conversionGrowth: number
}

function KpiCard({
    title,
    value,
    growth,
    prefix = '',
    suffix = '',
    icon: Icon,
    color,
    loading
}: {
    title: string
    value: number | string
    growth: number
    prefix?: string
    suffix?: string
    icon: any
    color: string
    loading?: boolean
}) {
    if (loading) {
        return (
            <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm animate-pulse">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-white/10" />
                    <div className="w-16 h-6 rounded bg-gray-200 dark:bg-white/10" />
                </div>
                <div className="w-24 h-8 rounded bg-gray-200 dark:bg-white/10 mb-2" />
                <div className="w-32 h-4 rounded bg-gray-200 dark:bg-white/10" />
            </div>
        )
    }

    const isPositive = growth >= 0
    const GrowthIcon = isPositive ? ArrowUpRight : ArrowDownRight
    const growthColor = isPositive ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'

    return (
        <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} transition-transform group-hover:scale-110 duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${growthColor}`}>
                    <GrowthIcon size={14} />
                    {Math.abs(growth)}%
                    <span className="hidden xl:inline font-normal opacity-75">vs mês anterior</span>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</h3>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {prefix}{value}{suffix}
                </div>
            </div>
        </div>
    )
}

export default function DashboardKPIs() {
    const [stats, setStats] = useState<KPIStats>({
        totalLeads: 0,
        leadsGrowth: 0,
        totalSales: 0,
        salesGrowth: 0,
        pipelineValue: 0,
        pipelineGrowth: 0,
        conversionRate: 0,
        conversionGrowth: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            // Em produção real, isso viria de uma RPC function agregada para performance
            // Aqui simularemos com queries simples para demonstrar

            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

            // Current Month Leads
            const { count: currentLeads } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfMonth)

            // Last Month Leads
            const { count: lastLeads } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfLastMonth)
                .lte('created_at', endOfLastMonth)

            // Pipeline Value (All active leads)
            const { data: pipelineData } = await supabase
                .from('leads')
                .select('capital')
                .neq('status', 'lost')
                .neq('status', 'won')

            const pipelineTotal = pipelineData?.reduce((sum, lead) => sum + (lead.capital || 0), 0) || 0

            // Sales (Won leads)
            const { count: salesCount } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'won')
                .gte('created_at', startOfMonth)

            // Calculate logic...
            // Para fins de demonstração rápida, vamos usar dados mockados se estiver vazio
            // ou calcular variações simples
            const leadsGrowth = lastLeads ? ((currentLeads || 0) - lastLeads) / lastLeads * 100 : 0

            setStats({
                totalLeads: currentLeads || 0,
                leadsGrowth: Number(leadsGrowth.toFixed(1)),
                totalSales: salesCount || 0,
                salesGrowth: 12.5, // Mocked for visuals
                pipelineValue: pipelineTotal,
                pipelineGrowth: 5.2, // Mocked
                conversionRate: currentLeads ? ((salesCount || 0) / currentLeads) * 100 : 0,
                conversionGrowth: -2.1
            })
            setLoading(false)
        }

        fetchStats()
    }, [])

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <KpiCard
                title="Totais de Leads (Mês)"
                value={stats.totalLeads}
                growth={stats.leadsGrowth}
                icon={Users}
                color="bg-blue-500"
                loading={loading}
            />
            <KpiCard
                title="Vendas Realizadas"
                value={stats.totalSales}
                growth={stats.salesGrowth}
                icon={ShoppingBag}
                color="bg-green-500"
                loading={loading}
            />
            <KpiCard
                title="Valor em Pipeline"
                value={new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(stats.pipelineValue)}
                prefix="R$ "
                growth={stats.pipelineGrowth}
                icon={DollarSign}
                color="bg-purple-500"
                loading={loading}
            />
            <KpiCard
                title="Taxa de Conversão"
                value={stats.conversionRate.toFixed(1)}
                suffix="%"
                growth={stats.conversionGrowth}
                icon={TrendingUp}
                color="bg-orange-500"
                loading={loading}
            />
        </div>
    )
}
