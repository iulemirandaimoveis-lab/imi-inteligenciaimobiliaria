'use client'

import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Building2,
  FileText,
  Target,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Dados executivos consolidados
const executiveData = {
  // Período
  period: {
    start: '2026-02-01',
    end: '2026-02-15',
    label: 'Fevereiro 2026 (15 dias)',
  },

  // KPIs Principais
  kpis: {
    leads: {
      total: 127,
      new: 45,
      growth: 18.2,
      conversionRate: 23.5,
      conversions: 30,
    },
    properties: {
      total: 34,
      active: 28,
      sold: 45,
      revenue: 29500000,
    },
    evaluations: {
      total: 8,
      completed: 3,
      pending: 2,
      inProgress: 2,
      avgTime: 3.2,
    },
    campaigns: {
      total: 5,
      active: 3,
      budget: 12000,
      spent: 8100,
      roi: 218519,
    },
    credit: {
      total: 4,
      approved: 2,
      analysis: 1,
      totalFinanced: 2235000,
    },
  },

  // Performance por Região (Recife)
  regionPerformance: [
    { region: 'Boa Viagem', leads: 45, conversions: 12, revenue: 8500000, growth: 15.3 },
    { region: 'Pina', leads: 28, conversions: 7, revenue: 3200000, growth: 12.1 },
    { region: 'Piedade', leads: 22, conversions: 5, revenue: 4800000, growth: 8.5 },
    { region: 'Setúbal', leads: 18, conversions: 3, revenue: 5400000, growth: -2.3 },
    { region: 'Candeias', leads: 14, conversions: 3, revenue: 2100000, growth: 22.7 },
  ],

  // Pipeline de Vendas
  pipeline: [
    { stage: 'Leads', count: 127, value: 0, conversionRate: 100 },
    { stage: 'Qualificados', count: 89, value: 0, conversionRate: 70 },
    { stage: 'Propostas', count: 47, value: 35000000, conversionRate: 37 },
    { stage: 'Negociação', count: 35, value: 28000000, conversionRate: 28 },
    { stage: 'Fechamento', count: 30, value: 24000000, conversionRate: 24 },
  ],

  // Top Performers (Empreendimentos)
  topPerformers: [
    { name: 'Reserva Atlantis', leads: 67, conversions: 12, revenue: 7800000 },
    { name: 'Villa Jardins', leads: 43, conversions: 7, revenue: 3360000 },
    { name: 'Smart Pina', leads: 12, conversions: 3, revenue: 1260000 },
    { name: 'Península Gardens', leads: 28, conversions: 4, revenue: 4800000 },
    { name: 'Ocean Blue', leads: 19, conversions: 4, revenue: 7400000 },
  ],

  // Métricas Financeiras
  financial: {
    totalRevenue: 29500000,
    projection: 65000000,
    avgTicket: 983333,
    marketingBudget: 12000,
    marketingSpent: 8100,
    marketingROI: 364098,
    operationalCost: 145000,
    netProfit: 29355000,
    profitMargin: 99.5,
  },

  // Atividades Recentes
  recentActivity: [
    { type: 'lead', description: 'Novo lead - Maria Santos (Boa Viagem)', time: '8 min atrás' },
    { type: 'sale', description: 'Venda concluída - Reserva Atlantis Apto 802', time: '2 horas atrás' },
    { type: 'evaluation', description: 'Laudo finalizado - AVL-2026-001', time: '3 horas atrás' },
    { type: 'credit', description: 'Crédito aprovado - João Pedro (R$ 595k)', time: '5 horas atrás' },
  ],
}

export default function RelatoriosPage() {
  const [periodFilter, setPeriodFilter] = useState('month')

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `R$ ${(price / 1000000).toFixed(1)}M`
    if (price >= 1000) return `R$ ${(price / 1000).toFixed(0)}k`
    return `R$ ${price.toFixed(0)}`
  }

  const formatPercent = (value: number) => {
    return value >= 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios Executivos</h1>
          <p className="text-sm text-gray-600 mt-1">{executiveData.period.label}</p>
        </div>
        <div className="flex gap-3">
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
          >
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
            <option value="quarter">Último Trimestre</option>
            <option value="year">Último Ano</option>
          </select>
          <button className="flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700">
            <Download size={20} />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* KPIs Grid Principal */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Leads */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Users size={24} />
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${executiveData.kpis.leads.growth > 0 ? 'bg-white/20' : 'bg-black/20'
              }`}>
              {formatPercent(executiveData.kpis.leads.growth)}
            </div>
          </div>
          <p className="text-3xl font-bold mb-1">{executiveData.kpis.leads.total}</p>
          <p className="text-sm text-blue-100">Leads Totais</p>
          <p className="text-xs text-blue-200 mt-2">{executiveData.kpis.leads.new} novos</p>
        </div>

        {/* Imóveis */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Building2 size={24} />
            <div className="px-2 py-1 rounded-full text-xs font-medium bg-white/20">
              {executiveData.kpis.properties.sold} vendas
            </div>
          </div>
          <p className="text-3xl font-bold mb-1">{executiveData.kpis.properties.total}</p>
          <p className="text-sm text-green-100">Empreendimentos</p>
          <p className="text-xs text-green-200 mt-2">{executiveData.kpis.properties.active} ativos</p>
        </div>

        {/* Avaliações */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <FileText size={24} />
            <div className="px-2 py-1 rounded-full text-xs font-medium bg-white/20">
              {executiveData.kpis.evaluations.avgTime}d médio
            </div>
          </div>
          <p className="text-3xl font-bold mb-1">{executiveData.kpis.evaluations.total}</p>
          <p className="text-sm text-purple-100">Avaliações</p>
          <p className="text-xs text-purple-200 mt-2">{executiveData.kpis.evaluations.completed} concluídas</p>
        </div>

        {/* Campanhas */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Target size={24} />
            <div className="px-2 py-1 rounded-full text-xs font-medium bg-white/20">
              ROI {executiveData.kpis.campaigns.roi.toLocaleString('pt-BR')}%
            </div>
          </div>
          <p className="text-3xl font-bold mb-1">{executiveData.kpis.campaigns.total}</p>
          <p className="text-sm text-orange-100">Campanhas</p>
          <p className="text-xs text-orange-200 mt-2">{executiveData.kpis.campaigns.active} ativas</p>
        </div>

        {/* Crédito */}
        <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign size={24} />
            <div className="px-2 py-1 rounded-full text-xs font-medium bg-white/20">
              {executiveData.kpis.credit.approved} aprovados
            </div>
          </div>
          <p className="text-3xl font-bold mb-1">{executiveData.kpis.credit.total}</p>
          <p className="text-sm text-accent-100">Créditos</p>
          <p className="text-xs text-accent-200 mt-2">{formatPrice(executiveData.kpis.credit.totalFinanced)}</p>
        </div>
      </div>

      {/* Métricas Financeiras */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(executiveData.financial.totalRevenue)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Projeção:</span>
            <span className="font-medium text-gray-900">{formatPrice(executiveData.financial.projection)}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(executiveData.financial.avgTicket)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">30 vendas</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Marketing ROI</p>
              <p className="text-2xl font-bold text-purple-900">{executiveData.financial.marketingROI.toLocaleString('pt-BR')}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Investido:</span>
            <span className="font-medium">{formatPrice(executiveData.financial.marketingSpent)}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Activity size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Margem Lucro</p>
              <p className="text-2xl font-bold text-green-900">{executiveData.financial.profitMargin.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Lucro:</span>
            <span className="font-medium text-green-700">{formatPrice(executiveData.financial.netProfit)}</span>
          </div>
        </div>
      </div>

      {/* Performance por Região & Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Região */}
        <div className="bg-white rounded-2xl p-6 border">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Performance por Região</h2>
          <div className="space-y-4">
            {executiveData.regionPerformance.map((region, index) => {
              const conversionRate = (region.conversions / region.leads) * 100
              const maxLeads = Math.max(...executiveData.regionPerformance.map(r => r.leads))
              const barWidth = (region.leads / maxLeads) * 100

              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900">{region.region}</span>
                      <span className={`text-xs font-medium ${region.growth > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {formatPercent(region.growth)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatPrice(region.revenue)}</p>
                      <p className="text-xs text-gray-600">{region.conversions} vendas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-500 rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 w-12 text-right">{region.leads} leads</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pipeline */}
        <div className="bg-white rounded-2xl p-6 border">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Pipeline de Vendas</h2>
          <div className="space-y-3">
            {executiveData.pipeline.map((stage, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{stage.stage}</span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{stage.count}</p>
                      {stage.value > 0 && (
                        <p className="text-xs text-gray-600">{formatPrice(stage.value)}</p>
                      )}
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-purple-500' :
                            index === 2 ? 'bg-orange-500' :
                              index === 3 ? 'bg-accent-500' :
                                'bg-green-500'
                        }`}
                      style={{ width: `${stage.conversionRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stage.conversionRate}% conversão</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-2xl p-6 border">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Top 5 Empreendimentos</h2>
        <div className="space-y-4">
          {executiveData.topPerformers.map((performer, index) => {
            const convRate = (performer.conversions / performer.leads) * 100

            return (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-accent-500 text-white rounded-lg flex items-center justify-center font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{performer.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{performer.leads} leads</span>
                    <span>•</span>
                    <span>{performer.conversions} vendas</span>
                    <span>•</span>
                    <span className="text-green-700 font-medium">{convRate.toFixed(1)}% conversão</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{formatPrice(performer.revenue)}</p>
                  <p className="text-xs text-gray-600">Receita</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
