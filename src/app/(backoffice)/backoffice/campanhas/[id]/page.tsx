'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  MousePointer,
  DollarSign,
  Eye,
  Edit,
  Play,
  Pause,
  Copy,
  Download,
  Calendar,
  MapPin,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Dados da campanha mockados
const campanhaData = {
  id: 1,
  name: 'Lançamento Reserva Imperial',
  status: 'ativa',
  platform: 'Instagram',
  objective: 'Conversão',
  startDate: '2026-02-01',
  endDate: '2026-02-29',
  budget: 5000,
  spent: 3200,

  // KPIs principais
  impressions: 45000,
  clicks: 1350,
  ctr: 3.0,
  cpc: 2.37,
  leads: 67,
  cpl: 47.76,
  conversions: 12,
  cpa: 266.67,
  revenue: 7800000,
  roi: 243750,

  // Performance temporal (últimos 14 dias)
  performanceTemporal: [
    { date: '2026-02-05', impressions: 2800, clicks: 84, leads: 4, conversions: 1 },
    { date: '2026-02-06', impressions: 3100, clicks: 93, leads: 5, conversions: 1 },
    { date: '2026-02-07', impressions: 2950, clicks: 89, leads: 4, conversions: 0 },
    { date: '2026-02-08', impressions: 3400, clicks: 102, leads: 6, conversions: 1 },
    { date: '2026-02-09', impressions: 3200, clicks: 96, leads: 5, conversions: 1 },
    { date: '2026-02-10', impressions: 3600, clicks: 108, leads: 7, conversions: 1 },
    { date: '2026-02-11', impressions: 3300, clicks: 99, leads: 5, conversions: 1 },
    { date: '2026-02-12', impressions: 3800, clicks: 114, leads: 8, conversions: 2 },
    { date: '2026-02-13', impressions: 3500, clicks: 105, leads: 6, conversions: 1 },
    { date: '2026-02-14', impressions: 3700, clicks: 111, leads: 7, conversions: 1 },
  ],

  // Funil de conversão
  funnel: [
    { stage: 'Impressões', count: 45000, percentage: 100 },
    { stage: 'Cliques', count: 1350, percentage: 3.0 },
    { stage: 'Leads', count: 67, percentage: 4.96 },
    { stage: 'Conversões', count: 12, percentage: 17.9 },
  ],

  // Demographics
  demographics: {
    age: [
      { range: '25-34', percentage: 38 },
      { range: '35-44', percentage: 32 },
      { range: '45-54', percentage: 18 },
      { range: '18-24', percentage: 8 },
      { range: '55+', percentage: 4 },
    ],
    gender: [
      { label: 'Feminino', percentage: 56 },
      { label: 'Masculino', percentage: 44 },
    ],
    location: [
      { city: 'Boa Viagem', percentage: 42 },
      { city: 'Pina', percentage: 24 },
      { city: 'Piedade', percentage: 18 },
      { city: 'Setúbal', percentage: 10 },
      { city: 'Outros', percentage: 6 },
    ],
  },

  // Leads gerados
  leadsGerados: [
    { id: 1, name: 'Maria Santos Silva', score: 92, status: 'convertido', date: '2026-02-12' },
    { id: 2, name: 'João Pedro Almeida', score: 85, status: 'negociacao', date: '2026-02-11' },
    { id: 3, name: 'Ana Carolina Ferreira', score: 78, status: 'qualificado', date: '2026-02-10' },
    { id: 4, name: 'Roberto Carlos Mendes', score: 88, status: 'convertido', date: '2026-02-14' },
  ],

  // Comparação com média
  mediaCampanhas: {
    ctr: 2.1,
    cpc: 3.2,
    cpl: 65.0,
    conversionRate: 12.5,
    roi: 180000,
  },
}

export default function CampanhaDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const [activeTab, setActiveTab] = useState<'overview' | 'metricas' | 'leads'>('overview')

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `R$ ${(price / 1000000).toFixed(1)}M`
    if (price >= 1000) return `R$ ${(price / 1000).toFixed(1)}k`
    return `R$ ${price.toFixed(2)}`
  }

  const progressPercent = (campanhaData.spent / campanhaData.budget) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{campanhaData.name}</h1>
              <span className={`px-3 py-1 rounded-lg text-xs font-medium ${campanhaData.status === 'ativa' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
                }`}>
                {campanhaData.status === 'ativa' ? 'Ativa' : 'Pausada'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{campanhaData.platform}</span>
              <span>•</span>
              <span>{campanhaData.objective}</span>
              <span>•</span>
              <span>{new Date(campanhaData.startDate).toLocaleDateString('pt-BR')} - {new Date(campanhaData.endDate).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="h-10 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Download size={16} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button className="h-10 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Copy size={16} />
            <span className="hidden sm:inline">Duplicar</span>
          </button>
          <button
            onClick={() => router.push(`/backoffice/campanhas/${params.id}/editar`)}
            className="h-10 px-4 bg-[#16162A] text-white rounded-lg hover:bg-[#0F0F1E] transition-colors flex items-center gap-2"
          >
            <Edit size={16} />
            <span className="hidden sm:inline">Editar</span>
          </button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Impressões</p>
          <p className="text-2xl font-bold text-gray-900">{campanhaData.impressions.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Cliques</p>
          <p className="text-2xl font-bold text-blue-700">{campanhaData.clicks.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">CTR</p>
          <p className="text-2xl font-bold text-purple-700">{campanhaData.ctr.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">CPC</p>
          <p className="text-2xl font-bold text-gray-900">{formatPrice(campanhaData.cpc)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Leads</p>
          <p className="text-2xl font-bold text-[#0F0F1E]">{campanhaData.leads}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">CPL</p>
          <p className="text-2xl font-bold text-orange-700">{formatPrice(campanhaData.cpl)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Conversões</p>
          <p className="text-2xl font-bold text-green-700">{campanhaData.conversions}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">ROI</p>
          <p className="text-2xl font-bold text-green-700">{campanhaData.roi.toLocaleString('pt-BR')}%</p>
        </div>
      </div>

      {/* Budget Progress */}
      <div className="bg-white rounded-xl p-6 border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Orçamento</p>
            <p className="text-xs text-gray-600">
              {formatPrice(campanhaData.spent)} de {formatPrice(campanhaData.budget)} ({progressPercent.toFixed(0)}%)
            </p>
          </div>
          <p className="text-lg font-bold text-[#0F0F1E]">
            {formatPrice(campanhaData.budget - campanhaData.spent)} restante
          </p>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${progressPercent > 90 ? 'bg-red-500' : progressPercent > 70 ? 'bg-orange-500' : 'bg-[#102A43]'
              }`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {['overview', 'metricas', 'leads'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-[#334E68] text-[#486581]' : 'border-transparent text-gray-600'
                }`}
            >
              {tab === 'overview' ? 'Visão Geral' : tab === 'metricas' ? 'Métricas' : 'Leads Gerados'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funil de Conversão */}
          <div className="bg-white rounded-2xl p-6 border">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Funil de Conversão</h2>
            <div className="space-y-4">
              {campanhaData.funnel.map((stage, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{stage.stage}</span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{stage.count.toLocaleString('pt-BR')}</p>
                      {idx > 0 && (
                        <p className="text-xs text-gray-600">{stage.percentage.toFixed(1)}% conversão</p>
                      )}
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${idx === 0 ? 'bg-blue-500' :
                          idx === 1 ? 'bg-purple-500' :
                            idx === 2 ? 'bg-orange-500' :
                              'bg-green-500'
                        }`}
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Demographics - Idade */}
          <div className="bg-white rounded-2xl p-6 border">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Idade do Público</h2>
            <div className="space-y-4">
              {campanhaData.demographics.age.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{item.range}</span>
                    <span className="text-sm font-bold text-gray-900">{item.percentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#102A43] rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Demographics - Localização */}
          <div className="bg-white rounded-2xl p-6 border">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Top Localizações</h2>
            <div className="space-y-3">
              {campanhaData.demographics.location.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">{item.city}</span>
                  </div>
                  <span className="text-sm font-bold text-[#0F0F1E]">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Comparação com Média */}
          <div className="bg-white rounded-2xl p-6 border">
            <h2 className="text-lg font-bold text-gray-900 mb-6">vs Média das Campanhas</h2>
            <div className="space-y-4">
              {[
                { metric: 'CTR', value: campanhaData.ctr, avg: campanhaData.mediaCampanhas.ctr, suffix: '%' },
                { metric: 'CPC', value: campanhaData.cpc, avg: campanhaData.mediaCampanhas.cpc, suffix: '', isPrice: true },
                { metric: 'CPL', value: campanhaData.cpl, avg: campanhaData.mediaCampanhas.cpl, suffix: '', isPrice: true },
                { metric: 'Conversão', value: (campanhaData.conversions / campanhaData.leads) * 100, avg: campanhaData.mediaCampanhas.conversionRate, suffix: '%' },
              ].map((item, idx) => {
                const better = item.metric === 'CPC' || item.metric === 'CPL' ? item.value < item.avg : item.value > item.avg

                return (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{item.metric}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        Média: {item.isPrice ? formatPrice(item.avg) : item.avg.toFixed(1) + item.suffix}
                      </span>
                      <span className={`text-sm font-bold flex items-center gap-1 ${better ? 'text-green-600' : 'text-red-600'}`}>
                        {better ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {item.isPrice ? formatPrice(item.value) : item.value.toFixed(1) + item.suffix}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leads' && (
        <div className="bg-white rounded-xl border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold text-gray-900">Leads Gerados ({campanhaData.leadsGerados.length})</h2>
          </div>
          <div className="divide-y">
            {campanhaData.leadsGerados.map(lead => (
              <div key={lead.id} className="p-6 hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/backoffice/leads/${lead.id}`)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">{lead.name}</p>
                    <p className="text-sm text-gray-600">{new Date(lead.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">Score: {lead.score}</p>
                      <span className={`text-xs px-2 py-1 rounded ${lead.status === 'convertido' ? 'bg-green-50 text-green-700' :
                          lead.status === 'negociacao' ? 'bg-orange-50 text-orange-700' :
                            'bg-blue-50 text-blue-700'
                        }`}>
                        {lead.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
