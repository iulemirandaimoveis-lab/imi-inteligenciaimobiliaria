'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  MousePointerClick,
  Eye,
  Target,
  Calendar,
  Download,
  Share2,
  Play,
  Pause,
  Edit,
  BarChart3,
  PieChart,
  Activity,
  Zap,
} from 'lucide-react'

const T = {
  surface: 'var(--bo-surface)',
  elevated: 'var(--bo-elevated)',
  border: 'var(--bo-border)',
  text: 'var(--bo-text)',
  textMuted: 'var(--bo-text-muted)',
  hover: 'var(--bo-hover)',
  accent: '#486581',
}

// Mock data (seria carregado do Supabase)
const mockCampaignData = {
  id: 1,
  name: 'Lançamento Reserva Imperial - Instagram',
  status: 'active',
  channel: 'Instagram Ads',
  startDate: '2026-02-01',
  endDate: '2026-02-28',
  budget: 5000,
  spent: 3250,

  // Métricas
  impressions: 125000,
  clicks: 3750,
  leads: 52,
  conversions: 8,

  // Calculados
  ctr: 3.0, // (clicks / impressions) * 100
  cpl: 62.5, // spent / leads
  cpc: 0.87, // spent / clicks
  conversionRate: 15.4, // (conversions / leads) * 100
  roi: 160, // ((revenue - spent) / spent) * 100

  // Performance diária (últimos 7 dias)
  dailyStats: [
    { date: '09/02', impressions: 5200, clicks: 156, leads: 3, spent: 180 },
    { date: '10/02', impressions: 6100, clicks: 183, leads: 4, spent: 210 },
    { date: '11/02', impressions: 5800, clicks: 174, leads: 2, spent: 195 },
    { date: '12/02', impressions: 6500, clicks: 195, leads: 5, spent: 225 },
    { date: '13/02', impressions: 7200, clicks: 216, leads: 6, spent: 250 },
    { date: '14/02', impressions: 6800, clicks: 204, leads: 4, spent: 230 },
    { date: '15/02', impressions: 7100, clicks: 213, leads: 5, spent: 240 },
  ],

  // Distribuição por dispositivo
  deviceStats: [
    { device: 'Mobile', percentage: 68, leads: 35 },
    { device: 'Desktop', percentage: 28, leads: 15 },
    { device: 'Tablet', percentage: 4, leads: 2 },
  ],

  // Top criativos
  topCreatives: [
    { id: 1, name: 'Fachada Noturna', impressions: 45000, clicks: 1350, ctr: 3.0 },
    { id: 2, name: 'Área de Lazer', impressions: 38000, clicks: 1140, ctr: 3.0 },
    { id: 3, name: 'Planta 3 Quartos', impressions: 42000, clicks: 1260, ctr: 3.0 },
  ],
}

export default function CampanhaAnalyticsPage() {
  const router = useRouter()
  const params = useParams()
  const [timeRange, setTimeRange] = useState('7d')

  const campaign = mockCampaignData
  const budgetUsed = (campaign.spent / campaign.budget) * 100
  const daysRemaining = 13 // Calculado da endDate

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ border: `1px solid ${T.border}` }}
          >
            <ArrowLeft size={20} style={{ color: T.text }} />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: T.text }}>{campaign.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                ● Ativa
              </span>
              <span className="text-sm" style={{ color: T.textMuted }}>
                {campaign.channel}
              </span>
              <span className="text-sm" style={{ color: T.textMuted }}>
                {campaign.startDate} - {campaign.endDate}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="h-10 px-4 rounded-xl font-medium flex items-center gap-2"
            style={{ border: `1px solid ${T.border}`, color: T.text }}
          >
            <Download size={18} />
            Exportar
          </button>
          <button
            className="h-10 px-4 rounded-xl font-medium flex items-center gap-2"
            style={{ border: `1px solid ${T.border}`, color: T.text }}
          >
            <Share2 size={18} />
            Compartilhar
          </button>
          <button
            onClick={() => router.push(`/backoffice/campanhas/${params.id}/editar`)}
            className="h-10 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <Edit size={18} />
            Editar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Investimento */}
        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <DollarSign size={20} className="text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: T.textMuted }}>Orçamento</p>
              <p className="text-sm font-medium" style={{ color: T.textMuted }}>{formatCurrency(campaign.budget)}</p>
            </div>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: T.text }}>
            {formatCurrency(campaign.spent)}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: T.elevated }}>
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${budgetUsed}%` }}
              />
            </div>
            <span className="text-xs font-medium" style={{ color: T.textMuted }}>{budgetUsed.toFixed(0)}%</span>
          </div>
        </div>

        {/* Leads */}
        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Users size={20} className="text-green-600" />
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp size={16} />
              <span className="text-sm font-medium">+12%</span>
            </div>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: T.text }}>
            {campaign.leads}
          </p>
          <p className="text-sm" style={{ color: T.textMuted }}>
            Leads Gerados • CPL {formatCurrency(campaign.cpl)}
          </p>
        </div>

        {/* CTR */}
        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <MousePointerClick size={20} className="text-purple-600" />
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp size={16} />
              <span className="text-sm font-medium">+8%</span>
            </div>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: T.text }}>
            {campaign.ctr.toFixed(1)}%
          </p>
          <p className="text-sm" style={{ color: T.textMuted }}>
            CTR • {formatNumber(campaign.clicks)} cliques
          </p>
        </div>

        {/* ROI */}
        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-orange-600" />
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp size={16} />
              <span className="text-sm font-medium">+24%</span>
            </div>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: T.text }}>
            {campaign.roi}%
          </p>
          <p className="text-sm" style={{ color: T.textMuted }}>
            ROI • {campaign.conversions} conversões
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Diária */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold" style={{ color: T.text }}>Performance Diária</h3>
              <p className="text-sm mt-1" style={{ color: T.textMuted }}>Últimos 7 dias</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${timeRange === '7d' ? 'bg-blue-100 text-blue-700' : ''
                  }`}
                style={timeRange !== '7d' ? { color: T.textMuted } : {}}
              >
                7 dias
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${timeRange === '30d' ? 'bg-blue-100 text-blue-700' : ''
                  }`}
                style={timeRange !== '30d' ? { color: T.textMuted } : {}}
              >
                30 dias
              </button>
            </div>
          </div>

          {/* Simple Bar Chart */}
          <div className="space-y-3">
            {campaign.dailyStats.map((stat, index) => {
              const maxLeads = Math.max(...campaign.dailyStats.map(s => s.leads))
              const width = (stat.leads / maxLeads) * 100

              return (
                <div key={index} className="flex items-center gap-4">
                  <span className="text-xs font-medium w-12" style={{ color: T.textMuted }}>{stat.date}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-8 rounded-lg overflow-hidden" style={{ background: T.elevated }}>
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end pr-2"
                          style={{ width: `${width}%` }}
                        >
                          {width > 20 && (
                            <span className="text-xs font-bold text-white">{stat.leads}</span>
                          )}
                        </div>
                      </div>
                      {width <= 20 && (
                        <span className="text-xs font-bold w-6" style={{ color: T.text }}>{stat.leads}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right w-24">
                    <p className="text-xs font-medium" style={{ color: T.text }}>{formatCurrency(stat.spent)}</p>
                    <p className="text-xs" style={{ color: T.textMuted }}>{formatNumber(stat.clicks)} cliques</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 pt-6" style={{ borderTop: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs" style={{ color: T.textMuted }}>Leads por dia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: T.elevated }} />
              <span className="text-xs" style={{ color: T.textMuted }}>Investimento diário</span>
            </div>
          </div>
        </div>

        {/* Device Distribution */}
        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="mb-6">
            <h3 className="text-lg font-bold" style={{ color: T.text }}>Por Dispositivo</h3>
            <p className="text-sm mt-1" style={{ color: T.textMuted }}>Distribuição de leads</p>
          </div>

          {/* Donut Chart Simulation */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                {/* Mobile - 68% */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#486581"
                  strokeWidth="20"
                  strokeDasharray="251.2"
                  strokeDashoffset="0"
                />
                {/* Desktop - 28% */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="20"
                  strokeDasharray="70.3 180.9"
                  strokeDashoffset="-170.8"
                />
                {/* Tablet - 4% */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="20"
                  strokeDasharray="10 241.2"
                  strokeDashoffset="-241.1"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: T.text }}>{campaign.leads}</p>
                  <p className="text-xs" style={{ color: T.textMuted }}>Total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            {campaign.deviceStats.map((device, index) => {
              const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500']
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${colors[index]}`} />
                    <span className="text-sm font-medium" style={{ color: T.text }}>{device.device}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: T.text }}>{device.percentage}%</p>
                    <p className="text-xs" style={{ color: T.textMuted }}>{device.leads} leads</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Criativos */}
        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold" style={{ color: T.text }}>Top Criativos</h3>
              <p className="text-sm mt-1" style={{ color: T.textMuted }}>Melhor performance</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <BarChart3 size={20} className="text-purple-600" />
            </div>
          </div>

          <div className="space-y-4">
            {campaign.topCreatives.map((creative, index) => (
              <div key={creative.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: T.elevated }}>
                <div className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold"
                  style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: T.text }}>{creative.name}</p>
                  <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                    {formatNumber(creative.impressions)} impressões • {formatNumber(creative.clicks)} cliques
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: T.text }}>{creative.ctr.toFixed(1)}%</p>
                  <p className="text-xs" style={{ color: T.textMuted }}>CTR</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Métricas Adicionais */}
        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold" style={{ color: T.text }}>Métricas Adicionais</h3>
              <p className="text-sm mt-1" style={{ color: T.textMuted }}>Performance geral</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Activity size={20} className="text-green-600" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Impressões */}
            <div className="p-4 rounded-xl" style={{ background: T.elevated }}>
              <div className="flex items-center gap-2 mb-2">
                <Eye size={16} style={{ color: T.textMuted }} />
                <p className="text-xs font-medium" style={{ color: T.textMuted }}>Impressões</p>
              </div>
              <p className="text-xl font-bold" style={{ color: T.text }}>{formatNumber(campaign.impressions)}</p>
            </div>

            {/* CPC */}
            <div className="p-4 rounded-xl" style={{ background: T.elevated }}>
              <div className="flex items-center gap-2 mb-2">
                <MousePointerClick size={16} style={{ color: T.textMuted }} />
                <p className="text-xs font-medium" style={{ color: T.textMuted }}>CPC Médio</p>
              </div>
              <p className="text-xl font-bold" style={{ color: T.text }}>{formatCurrency(campaign.cpc)}</p>
            </div>

            {/* Taxa de Conversão */}
            <div className="p-4 rounded-xl" style={{ background: T.elevated }}>
              <div className="flex items-center gap-2 mb-2">
                <Target size={16} style={{ color: T.textMuted }} />
                <p className="text-xs font-medium" style={{ color: T.textMuted }}>Conversão</p>
              </div>
              <p className="text-xl font-bold" style={{ color: T.text }}>{campaign.conversionRate.toFixed(1)}%</p>
            </div>

            {/* Dias Restantes */}
            <div className="p-4 rounded-xl" style={{ background: T.elevated }}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} style={{ color: T.textMuted }} />
                <p className="text-xs font-medium" style={{ color: T.textMuted }}>Dias Restantes</p>
              </div>
              <p className="text-xl font-bold" style={{ color: T.text }}>{daysRemaining}</p>
            </div>
          </div>

          {/* Projeção */}
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-blue-600" />
              <p className="text-xs font-bold text-blue-900">Projeção Final</p>
            </div>
            <p className="text-sm text-gray-700">
              Com o ritmo atual, você deve atingir <span className="font-bold text-blue-700">~85 leads</span> até o fim da campanha.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
