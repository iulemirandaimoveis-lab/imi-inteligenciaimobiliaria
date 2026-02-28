'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  Users,
  Calendar,
  MapPin,
  Clock,
  Target,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Analytics mockados
const analyticsData = {
  imovel: {
    id: 1,
    name: 'Reserva Atlantis',
    location: 'Boa Viagem, Recife/PE',
  },

  // KPIs últimos 30 dias
  kpis: {
    visualizacoes: 2847,
    cliques: 456,
    leads: 67,
    conversoes: 12,
    taxaConversao: 17.9,
    tempoMedioPagina: 245, // segundos
  },

  // Performance temporal (últimos 30 dias)
  performanceTemporal: [
    { date: '2026-01-20', views: 82, clicks: 13, leads: 2 },
    { date: '2026-01-21', views: 95, clicks: 15, leads: 3 },
    { date: '2026-01-22', views: 88, clicks: 14, leads: 2 },
    { date: '2026-01-23', views: 91, clicks: 16, leads: 3 },
    { date: '2026-01-24', views: 78, clicks: 12, leads: 1 },
    { date: '2026-01-25', views: 105, clicks: 18, leads: 4 },
    { date: '2026-01-26', views: 112, clicks: 20, leads: 5 },
    { date: '2026-01-27', views: 98, clicks: 17, leads: 3 },
    { date: '2026-01-28', views: 102, clicks: 18, leads: 4 },
    { date: '2026-01-29', views: 89, clicks: 15, leads: 2 },
    { date: '2026-01-30', views: 94, clicks: 16, leads: 3 },
    { date: '2026-01-31', views: 108, clicks: 19, leads: 4 },
    { date: '2026-02-01', views: 115, clicks: 21, leads: 5 },
    { date: '2026-02-02', views: 102, clicks: 18, leads: 3 },
    { date: '2026-02-03', views: 96, clicks: 17, leads: 3 },
    { date: '2026-02-04', views: 88, clicks: 15, leads: 2 },
    { date: '2026-02-05', views: 91, clicks: 16, leads: 2 },
    { date: '2026-02-06', views: 105, clicks: 19, leads: 4 },
    { date: '2026-02-07', views: 99, clicks: 17, leads: 3 },
    { date: '2026-02-08', views: 110, clicks: 20, leads: 4 },
    { date: '2026-02-09', views: 103, clicks: 18, leads: 3 },
    { date: '2026-02-10', views: 95, clicks: 16, leads: 2 },
    { date: '2026-02-11', views: 89, clicks: 15, leads: 2 },
    { date: '2026-02-12', views: 108, clicks: 19, leads: 4 },
    { date: '2026-02-13', views: 112, clicks: 21, leads: 5 },
    { date: '2026-02-14', views: 98, clicks: 17, leads: 3 },
    { date: '2026-02-15', views: 92, clicks: 16, leads: 2 },
    { date: '2026-02-16', views: 87, clicks: 14, leads: 2 },
    { date: '2026-02-17', views: 94, clicks: 16, leads: 3 },
    { date: '2026-02-18', views: 101, clicks: 18, leads: 3 },
  ],

  // Fontes de tráfego
  fontesTrafico: [
    { source: 'Google Orgânico', visits: 1245, percentage: 43.7 },
    { source: 'Instagram', visits: 682, percentage: 24.0 },
    { source: 'Acesso Direto', visits: 456, percentage: 16.0 },
    { source: 'Facebook', visits: 312, percentage: 11.0 },
    { source: 'Email Marketing', visits: 152, percentage: 5.3 },
  ],

  // Demografia visitantes
  demografia: {
    idade: [
      { range: '25-34', percentage: 42 },
      { range: '35-44', percentage: 35 },
      { range: '45-54', percentage: 15 },
      { range: '18-24', percentage: 5 },
      { range: '55+', percentage: 3 },
    ],
    localizacao: [
      { city: 'Recife', percentage: 68 },
      { city: 'São Paulo', percentage: 12 },
      { city: 'Rio de Janeiro', percentage: 8 },
      { city: 'Fortaleza', percentage: 6 },
      { city: 'Outros', percentage: 6 },
    ],
  },

  // Dias e horários mais ativos
  horariosAtivos: [
    { hour: '08h-12h', visits: 856 },
    { hour: '12h-18h', visits: 1245 },
    { hour: '18h-22h', visits: 612 },
    { hour: '22h-08h', visits: 134 },
  ],

  diasSemana: [
    { day: 'Seg', visits: 412 },
    { day: 'Ter', visits: 438 },
    { day: 'Qua', visits: 445 },
    { day: 'Qui', visits: 421 },
    { day: 'Sex', visits: 398 },
    { day: 'Sáb', visits: 356 },
    { day: 'Dom', visits: 377 },
  ],
}

export default function ImovelAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const [periodoFilter, setPeriodoFilter] = useState('30d')

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}min ${secs}s`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push(`/backoffice/imoveis/${params.id}`)}
            className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">{analyticsData.imovel.name}</h1>
            <p className="text-sm text-gray-600 mt-1">
              Analytics e performance de visualizações
            </p>
          </div>
        </div>

        <select
          value={periodoFilter}
          onChange={(e) => setPeriodoFilter(e.target.value)}
          className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white"
        >
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="90d">Últimos 90 dias</option>
        </select>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={16} className="text-blue-600" />
            <p className="text-xs text-gray-600">Visualizações</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{analyticsData.kpis.visualizacoes.toLocaleString('pt-BR')}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-2 mb-2">
            <MousePointer size={16} className="text-purple-600" />
            <p className="text-xs text-gray-600">Cliques</p>
          </div>
          <p className="text-2xl font-bold text-purple-700">{analyticsData.kpis.cliques}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-orange-600" />
            <p className="text-xs text-gray-600">Leads</p>
          </div>
          <p className="text-2xl font-bold text-orange-700">{analyticsData.kpis.leads}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-green-600" />
            <p className="text-xs text-gray-600">Conversões</p>
          </div>
          <p className="text-2xl font-bold text-green-700">{analyticsData.kpis.conversoes}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-[#3B82F6]" />
            <p className="text-xs text-gray-600">Taxa Conversão</p>
          </div>
          <p className="text-2xl font-bold text-[#0F0F1E]">{analyticsData.kpis.taxaConversao}%</p>
        </div>

        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-gray-600" />
            <p className="text-xs text-gray-600">Tempo Médio</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatTime(analyticsData.kpis.tempoMedioPagina)}</p>
        </div>
      </div>

      {/* Gráfico Performance */}
      <div className="bg-white rounded-2xl p-6 border">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Performance Últimos 30 Dias</h2>
        <div className="space-y-2">
          {analyticsData.performanceTemporal.slice(-10).map((day, idx) => {
            const maxViews = Math.max(...analyticsData.performanceTemporal.map(d => d.views))
            const barWidth = (day.views / maxViews) * 100

            return (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 w-24">
                    {new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>{day.views} views</span>
                    <span>{day.clicks} clicks</span>
                    <span className="font-medium text-[#0F0F1E]">{day.leads} leads</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1A1A2E] rounded-full transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Fontes de Tráfego e Demografia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fontes */}
        <div className="bg-white rounded-2xl p-6 border">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Fontes de Tráfego</h2>
          <div className="space-y-4">
            {analyticsData.fontesTrafico.map((fonte, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{fonte.source}</span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{fonte.visits}</p>
                    <p className="text-xs text-gray-600">{fonte.percentage}%</p>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${fonte.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Localização */}
        <div className="bg-white rounded-2xl p-6 border">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Top Localizações</h2>
          <div className="space-y-3">
            {analyticsData.demografia.localizacao.map((loc, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">{loc.city}</span>
                </div>
                <span className="text-sm font-bold text-[#0F0F1E]">{loc.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Horários e Dias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horários */}
        <div className="bg-white rounded-2xl p-6 border">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Horários Mais Ativos</h2>
          <div className="space-y-3">
            {analyticsData.horariosAtivos.map((horario, idx) => {
              const maxVisits = Math.max(...analyticsData.horariosAtivos.map(h => h.visits))
              const barWidth = (horario.visits / maxVisits) * 100

              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{horario.hour}</span>
                    <span className="text-sm font-bold text-gray-900">{horario.visits} visitas</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Dias da Semana */}
        <div className="bg-white rounded-2xl p-6 border">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Dias da Semana</h2>
          <div className="space-y-3">
            {analyticsData.diasSemana.map((dia, idx) => {
              const maxVisits = Math.max(...analyticsData.diasSemana.map(d => d.visits))
              const barWidth = (dia.visits / maxVisits) * 100

              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{dia.day}</span>
                    <span className="text-sm font-bold text-gray-900">{dia.visits} visitas</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
