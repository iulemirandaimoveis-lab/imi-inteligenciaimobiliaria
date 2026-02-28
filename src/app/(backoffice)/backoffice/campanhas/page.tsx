'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Search,
    Plus,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    MousePointer,
    Target,
    Eye,
    Edit,
    Play,
    Pause,
    BarChart3,
    Instagram,
    Facebook,
    Globe,
    Mail,
    MessageSquare,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Campanhas reais Recife
const campanhasData = [
    {
        id: 1,
        name: 'Lançamento Reserva Atlantis',
        status: 'ativa',
        platform: 'Instagram',
        objective: 'Conversão',
        startDate: '2026-02-01',
        endDate: '2026-02-29',
        budget: 5000,
        spent: 3200,
        impressions: 45000,
        clicks: 1350,
        leads: 67,
        conversions: 12,
        revenue: 7800000,
        ctr: 3.0,
        cpc: 2.37,
        cpl: 47.76,
        cpa: 266.67,
        roi: 243750,
    },
    {
        id: 2,
        name: 'Google Ads Boa Viagem',
        status: 'ativa',
        platform: 'Google',
        objective: 'Leads',
        startDate: '2026-02-01',
        endDate: '2026-02-29',
        budget: 3000,
        spent: 2100,
        impressions: 28000,
        clicks: 840,
        leads: 43,
        conversions: 8,
        revenue: 3400000,
        ctr: 3.0,
        cpc: 2.5,
        cpl: 48.84,
        cpa: 262.5,
        roi: 161905,
    },
    {
        id: 3,
        name: 'Facebook Villa Jardins',
        status: 'ativa',
        platform: 'Facebook',
        objective: 'Reconhecimento',
        startDate: '2026-02-10',
        endDate: '2026-03-10',
        budget: 2000,
        spent: 800,
        impressions: 52000,
        clicks: 1560,
        leads: 28,
        conversions: 3,
        revenue: 1440000,
        ctr: 3.0,
        cpc: 0.51,
        cpl: 28.57,
        cpa: 266.67,
        roi: 180000,
    },
    {
        id: 4,
        name: 'Email Marketing Piedade',
        status: 'pausada',
        platform: 'Email',
        objective: 'Conversão',
        startDate: '2021-05-15',
        endDate: '2026-02-15',
        budget: 800,
        spent: 800,
        impressions: 12000,
        clicks: 480,
        leads: 18,
        conversions: 5,
        revenue: 2125000,
        ctr: 4.0,
        cpc: 1.67,
        cpl: 44.44,
        cpa: 160,
        roi: 265625,
    },
    {
        id: 5,
        name: 'WhatsApp Business Pina',
        status: 'concluida',
        platform: 'WhatsApp',
        objective: 'Conversão',
        startDate: '2026-01-20',
        endDate: '2026-02-10',
        budget: 1200,
        spent: 1200,
        impressions: 8000,
        clicks: 320,
        leads: 22,
        conversions: 7,
        revenue: 2940000,
        ctr: 4.0,
        cpc: 3.75,
        cpl: 54.55,
        cpa: 171.43,
        roi: 245000,
    },
]

// ⚠️ NÃO MODIFICAR - Stats totais
const totalStats = {
    budget: campanhasData.reduce((acc, c) => acc + c.budget, 0),
    spent: campanhasData.reduce((acc, c) => acc + c.spent, 0),
    impressions: campanhasData.reduce((acc, c) => acc + c.impressions, 0),
    clicks: campanhasData.reduce((acc, c) => acc + c.clicks, 0),
    leads: campanhasData.reduce((acc, c) => acc + c.leads, 0),
    conversions: campanhasData.reduce((acc, c) => acc + c.conversions, 0),
    revenue: campanhasData.reduce((acc, c) => acc + c.revenue, 0),
    avgCTR: '0',
    avgCPC: '0',
    avgCPL: '0',
    avgROI: '0'
}

totalStats.avgCTR = ((totalStats.clicks / totalStats.impressions) * 100).toFixed(2)
totalStats.avgCPC = (totalStats.spent / totalStats.clicks).toFixed(2)
totalStats.avgCPL = (totalStats.spent / totalStats.leads).toFixed(2)
totalStats.avgROI = (((totalStats.revenue - totalStats.spent) / totalStats.spent) * 100).toFixed(0)

export default function CampanhasPage() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [platformFilter, setPlatformFilter] = useState('all')

    const filteredCampanhas = campanhasData.filter(camp => {
        const matchesSearch = camp.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || camp.status === statusFilter
        const matchesPlatform = platformFilter === 'all' || camp.platform === platformFilter
        return matchesSearch && matchesStatus && matchesPlatform
    })

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; color: string; bg: string; icon: any }> = {
            ativa: { label: 'Ativa', color: 'text-green-700', bg: 'bg-green-50', icon: Play },
            pausada: { label: 'Pausada', color: 'text-orange-700', bg: 'bg-orange-50', icon: Pause },
            concluida: { label: 'Concluída', color: 'text-blue-700', bg: 'bg-blue-50', icon: Target },
        }
        return configs[status] || configs.ativa
    }

    const getPlatformIcon = (platform: string) => {
        const icons: Record<string, any> = {
            Instagram: Instagram,
            Facebook: Facebook,
            Google: Globe,
            Email: Mail,
            WhatsApp: MessageSquare,
        }
        return icons[platform] || Globe
    }

    const formatPrice = (price: number) => {
        if (price >= 1000000) return `R$ ${(price / 1000000).toFixed(1)}M`
        if (price >= 1000) return `R$ ${(price / 1000).toFixed(1)}k`
        return `R$ ${price.toFixed(2)}`
    }

    const formatNumber = (num: number) => {
        if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
        return num.toString()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Campanhas de Marketing</h1>
                    <p className="text-sm text-gray-600 mt-1">Gerencie e analise suas campanhas</p>
                </div>
                <button
                    onClick={() => router.push('/backoffice/campanhas/nova')}
                    className="flex items-center gap-2 h-11 px-6 bg-[#16162A] text-white rounded-xl font-medium hover:bg-[#0F0F1E] transition-all"
                >
                    <Plus size={20} />
                    Nova Campanha
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Orçamento Total</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(totalStats.budget)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Investido</p>
                    <p className="text-2xl font-bold text-[#0F0F1E]">{formatPrice(totalStats.spent)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Impressões</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(totalStats.impressions)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Cliques</p>
                    <p className="text-2xl font-bold text-blue-700">{formatNumber(totalStats.clicks)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Leads</p>
                    <p className="text-2xl font-bold text-purple-700">{totalStats.leads}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Conversões</p>
                    <p className="text-2xl font-bold text-green-700">{totalStats.conversions}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Receita</p>
                    <p className="text-2xl font-bold text-green-700">{formatPrice(totalStats.revenue)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">ROI Médio</p>
                    <p className="text-2xl font-bold text-green-700">{totalStats.avgROI}%</p>
                </div>
            </div>

            {/* Métricas Médias */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <p className="text-xs text-blue-700 font-medium mb-1">CTR Médio</p>
                    <p className="text-2xl font-bold text-blue-900">{totalStats.avgCTR}%</p>
                    <p className="text-xs text-blue-600 mt-1">Click-through rate</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <p className="text-xs text-purple-700 font-medium mb-1">CPC Médio</p>
                    <p className="text-2xl font-bold text-purple-900">{formatPrice(parseFloat(totalStats.avgCPC))}</p>
                    <p className="text-xs text-purple-600 mt-1">Custo por clique</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                    <p className="text-xs text-orange-700 font-medium mb-1">CPL Médio</p>
                    <p className="text-2xl font-bold text-orange-900">{formatPrice(parseFloat(totalStats.avgCPL))}</p>
                    <p className="text-xs text-orange-600 mt-1">Custo por lead</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <p className="text-xs text-green-700 font-medium mb-1">Taxa Conversão</p>
                    <p className="text-2xl font-bold text-green-900">
                        {((totalStats.conversions / totalStats.leads) * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-green-600 mt-1">Leads → Vendas</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar campanhas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white"
                    >
                        <option value="all">Todos os status</option>
                        <option value="ativa">Ativa</option>
                        <option value="pausada">Pausada</option>
                        <option value="concluida">Concluída</option>
                    </select>
                    <select
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value)}
                        className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white"
                    >
                        <option value="all">Todas as plataformas</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Google">Google</option>
                        <option value="Email">Email</option>
                        <option value="WhatsApp">WhatsApp</option>
                    </select>
                </div>
            </div>

            {/* Lista de Campanhas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredCampanhas.map((campanha) => {
                    const statusConfig = getStatusConfig(campanha.status)
                    const PlatformIcon = getPlatformIcon(campanha.platform)
                    const StatusIcon = statusConfig.icon
                    const progressPercent = (campanha.spent / campanha.budget) * 100
                    const roiPositive = campanha.roi > 0

                    return (
                        <div
                            key={campanha.id}
                            className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                            onClick={() => router.push(`/backoffice/campanhas/${campanha.id}`)}
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-accent-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <PlatformIcon size={20} className="text-[#3B82F6]" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-1">{campanha.name}</h3>
                                            <p className="text-sm text-gray-600">{campanha.objective} • {campanha.platform}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.color}`}>
                                        <StatusIcon size={12} />
                                        {statusConfig.label}
                                    </div>
                                </div>

                                {/* Budget Progress */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Orçamento</span>
                                        <span className="font-medium text-gray-900">
                                            {formatPrice(campanha.spent)} / {formatPrice(campanha.budget)}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${progressPercent > 90 ? 'bg-red-500' : progressPercent > 70 ? 'bg-orange-500' : 'bg-[#1A1A2E]'
                                                }`}
                                            style={{ width: `${Math.min(progressPercent, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Impressões</p>
                                    <p className="text-lg font-bold text-gray-900">{formatNumber(campanha.impressions)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Cliques</p>
                                    <p className="text-lg font-bold text-blue-700">{formatNumber(campanha.clicks)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">CTR</p>
                                    <p className="text-lg font-bold text-purple-700">{campanha.ctr.toFixed(1)}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Leads</p>
                                    <p className="text-lg font-bold text-[#0F0F1E]">{campanha.leads}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Conversões</p>
                                    <p className="text-lg font-bold text-green-700">{campanha.conversions}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Taxa Conv.</p>
                                    <p className="text-lg font-bold text-green-700">
                                        {((campanha.conversions / campanha.leads) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>

                            {/* Footer - ROI */}
                            <div className={`p-6 border-t flex items-center justify-between ${roiPositive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                }`}>
                                <div>
                                    <p className={`text-xs font-medium mb-1 ${roiPositive ? 'text-green-700' : 'text-red-700'}`}>
                                        Retorno sobre Investimento
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <p className={`text-2xl font-bold ${roiPositive ? 'text-green-900' : 'text-red-900'}`}>
                                            {campanha.roi.toLocaleString('pt-BR')}%
                                        </p>
                                        {roiPositive ? (
                                            <TrendingUp size={20} className="text-green-700" />
                                        ) : (
                                            <TrendingDown size={20} className="text-red-700" />
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-600 mb-1">Receita Gerada</p>
                                    <p className={`text-lg font-bold ${roiPositive ? 'text-green-900' : 'text-gray-900'}`}>
                                        {formatPrice(campanha.revenue)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Empty State */}
            {filteredCampanhas.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma campanha encontrada</h3>
                    <p className="text-gray-600 mb-6">Tente ajustar os filtros ou criar uma nova campanha</p>
                    <button
                        onClick={() => router.push('/backoffice/campanhas/nova')}
                        className="inline-flex items-center gap-2 h-11 px-6 bg-[#16162A] text-white rounded-xl font-medium hover:bg-[#0F0F1E]"
                    >
                        <Plus size={20} />
                        Nova Campanha
                    </button>
                </div>
            )}
        </div>
    )
}
