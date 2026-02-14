'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import PageHeader from '../../../../components/PageHeader'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { KPICard, Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { CardSkeleton } from '@/components/ui/EmptyState'
import {
  TrendingUp,
  Eye,
  MousePointer,
  Users,
  DollarSign,
  Target,
  Clock,
  CheckCircle,
} from 'lucide-react'

// Mock data (depois virá do Supabase)
const mockCampaign = {
  id: '1',
  name: 'Lançamento Reserva Atlantis',
  type: 'instagram',
  status: 'active',
  budget: 15000,
  spent: 8750,
  start_date: '2024-02-01',
  end_date: '2024-02-29',
}

const mockAnalytics = {
  impressions: 245000,
  clicks: 3420,
  ctr: 1.4, // %
  leads: 87,
  conversions: 12,
  conversion_rate: 13.79, // %
  cpl: 100.57, // custo por lead
  cpc: 2.56, // custo por click
  cpm: 35.71, // custo por mil impressões
  roi: 340, // %
  revenue: 38500, // receita estimada

  // By device
  deviceBreakdown: [
    { device: 'Mobile', impressions: 171500, clicks: 2394, leads: 61, percentage: 70 },
    { device: 'Desktop', impressions: 58800, clicks: 854, leads: 22, percentage: 24 },
    { device: 'Tablet', impressions: 14700, clicks: 172, leads: 4, percentage: 6 },
  ],

  // By day
  dailyMetrics: [
    { date: '2024-02-08', impressions: 18200, clicks: 254, leads: 7, spent: 650 },
    { date: '2024-02-09', impressions: 21500, clicks: 301, leads: 8, spent: 770 },
    { date: '2024-02-10', impressions: 19800, clicks: 277, leads: 6, spent: 710 },
    { date: '2024-02-11', impressions: 23400, clicks: 327, leads: 9, spent: 840 },
    { date: '2024-02-12', impressions: 20100, clicks: 281, leads: 7, spent: 720 },
    { date: '2024-02-13', impressions: 22600, clicks: 316, leads: 8, spent: 810 },
    { date: '2024-02-14', impressions: 19900, clicks: 278, leads: 7, spent: 710 },
  ],

  // Top performing ads
  topAds: [
    { id: '1', name: 'Carrossel Fachada', impressions: 48000, clicks: 890, ctr: 1.85 },
    { id: '2', name: 'Video Tour Virtual', impressions: 42000, clicks: 756, ctr: 1.8 },
    { id: '3', name: 'Stories Plantas', impressions: 38000, clicks: 608, ctr: 1.6 },
  ],

  // Demographics
  ageBreakdown: [
    { range: '18-24', percentage: 12, leads: 10 },
    { range: '25-34', percentage: 38, leads: 33 },
    { range: '35-44', percentage: 31, leads: 27 },
    { range: '45-54', percentage: 14, leads: 12 },
    { range: '55+', percentage: 5, leads: 5 },
  ],
}

export default function CampanhasAnalyticsPage() {
  const params = useParams()
  const [timeRange, setTimeRange] = useState('7d')

  const campaign = mockCampaign
  const analytics = mockAnalytics

  return (
    <div className="space-y-6">
      <PageHeader
        title="Intelligence & Analytics"
        subtitle={campaign.name}
        breadcrumbs={[
          { name: 'Dashboard', href: '/backoffice/backoffice/dashboard' },
          { name: 'Campanhas', href: '/backoffice/backoffice/campanhas' },
          { name: campaign.name },
          { name: 'Analytics' },
        ]}
        action={
          <div className="flex items-center gap-4">
            <Select
              className="w-48 bg-white"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              options={[
                { value: '7d', label: 'Janela: 7 dias' },
                { value: '30d', label: 'Janela: 30 dias' },
                { value: 'all', label: 'Todo o Período' },
              ]}
            />
            <Button variant="outline" icon={<TrendingUp size={18} />} className="bg-white">Relatório Full</Button>
          </div>
        }
      />

      {/* High-Level KPIs Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          label="Impressões"
          value={analytics.impressions.toLocaleString('pt-BR')}
          icon={<Eye />}
          variant="primary"
          className="shadow-elevated"
        />

        <KPICard
          label="Interação (Clicks)"
          value={analytics.clicks.toLocaleString('pt-BR')}
          change={{ value: analytics.ctr, label: `CTR: ${analytics.ctr}%`, trend: 'up' }}
          icon={<MousePointer />}
          variant="info"
          className="shadow-elevated"
        />

        <KPICard
          label="Leads Retidos"
          value={analytics.leads.toString()}
          change={{ value: analytics.conversion_rate, label: `Conv: ${analytics.conversion_rate}%`, trend: 'up' }}
          icon={<Users />}
          variant="success"
          className="shadow-elevated"
        />

        <KPICard
          label="ROI Realizado"
          value={`${analytics.roi}%`}
          change={{ value: 12, label: 'vs. previstos', trend: 'up' }}
          icon={<TrendingUp />}
          variant="success"
          className="bg-imi-950 border-imi-800 text-white shadow-glow"
        />
      </div>

      {/* Financial Unit Economics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-imi-50 bg-imi-50/20">
          <CardBody className="flex flex-col items-center py-6">
            <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-1">CPL (Custo/Lead)</p>
            <p className="text-2xl font-black text-imi-900 border-b-2 border-accent-500 pb-1">
              R$ {analytics.cpl.toFixed(2)}
            </p>
          </CardBody>
        </Card>

        <Card className="border-imi-50 bg-imi-50/20">
          <CardBody className="flex flex-col items-center py-6">
            <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-1">CPC (Custo/Click)</p>
            <p className="text-2xl font-black text-imi-900">
              R$ {analytics.cpc.toFixed(2)}
            </p>
          </CardBody>
        </Card>

        <Card className="border-imi-50 bg-imi-50/20">
          <CardBody className="flex flex-col items-center py-6">
            <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-1">CPM (Mil Impr.)</p>
            <p className="text-2xl font-black text-imi-900">
              R$ {analytics.cpm.toFixed(2)}
            </p>
          </CardBody>
        </Card>

        <Card className="bg-accent-500 border-accent-600 shadow-glow">
          <CardBody className="flex flex-col items-center py-6 text-white">
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Receita Estimada</p>
            <p className="text-2xl font-black">
              R$ {(analytics.revenue / 1000).toFixed(0)}k
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Strategic Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Device Distribution Strategy */}
        <Card className="shadow-elevated border-imi-50">
          <CardHeader title="Segmentação por Dispositivo" subtitle="Otimização de criativos baseada em hardware" />
          <CardBody className="p-8">
            <div className="space-y-8">
              {analytics.deviceBreakdown.map((item) => (
                <div key={item.device} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-imi-50 flex items-center justify-center text-imi-400">
                        {item.device === 'Mobile' ? <CheckCircle size={18} /> : <Eye size={18} />}
                      </div>
                      <span className="text-sm font-black text-imi-900 uppercase tracking-wider">
                        {item.device}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-accent-600">{item.percentage}%</span>
                      <Badge variant="primary" size="sm" dot>{item.leads} leads</Badge>
                    </div>
                  </div>
                  <div className="h-3 bg-imi-50 rounded-full overflow-hidden border border-imi-100">
                    <div
                      className="h-full bg-accent-500 transition-all duration-1000 ease-smooth rounded-full shadow-glow"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-6 text-[10px] font-bold text-imi-400 uppercase tracking-widest ml-14">
                    <span>{item.impressions.toLocaleString()} Impr.</span>
                    <span className="w-1 h-1 bg-imi-200 rounded-full"></span>
                    <span>{item.clicks} Clicks</span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Audience Age Profiling */}
        <Card className="shadow-elevated border-imi-50">
          <CardHeader title="Profiling por Faixa Etária" subtitle="Distribuição demográfica das conversões" />
          <CardBody className="p-8">
            <div className="space-y-6">
              {analytics.ageBreakdown.map((item) => (
                <div key={item.range} className="flex items-center gap-6">
                  <div className="w-16 text-xs font-black text-imi-400 uppercase tracking-tighter">
                    {item.range} anos
                  </div>
                  <div className="flex-1">
                    <div className="h-10 bg-imi-50 rounded-2xl overflow-hidden relative border border-imi-100">
                      <div
                        className="h-full bg-imi-950 transition-all duration-1000 ease-smooth flex items-center justify-end pr-4"
                        style={{ width: `${item.percentage}%` }}
                      >
                        <span className="text-[10px] font-black text-accent-400">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <Badge variant="neutral" size="sm">{item.leads} leads</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Daily Performance Timeline */}
      <Card className="shadow-elevated border-imi-50">
        <CardHeader title="Timeline de Performance Diária" subtitle="Monitoramento granular da última semana" />
        <CardBody className="p-8">
          <div className="space-y-6">
            {analytics.dailyMetrics.map((day) => {
              const maxImpressions = Math.max(
                ...analytics.dailyMetrics.map((d) => d.impressions)
              )
              const percentage = (day.impressions / maxImpressions) * 100
              const date = new Date(day.date)
              const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' })

              return (
                <div key={day.date} className="group">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 text-center md:text-left shrink-0">
                      <div className="text-xs font-black uppercase text-imi-900 group-hover:text-accent-600 transition-colors">{dayName}</div>
                      <div className="text-[10px] font-bold text-imi-400">
                        {date.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </div>
                    </div>
                    <div className="flex-1 w-full">
                      <div className="h-12 bg-imi-50 rounded-2xl overflow-hidden relative border border-imi-100/50">
                        <div
                          className="h-full bg-accent-500/10 border-r-4 border-accent-500 transition-all duration-1000 ease-smooth"
                          style={{ width: `${percentage}%` }}
                        />
                        <div className="absolute inset-y-0 left-4 flex items-center">
                          <span className="text-[10px] font-black text-imi-400 uppercase tracking-widest">
                            {(day.impressions / 1000).toFixed(1)}k Impr.
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8 text-right w-full md:w-64">
                      <div>
                        <p className="text-[9px] font-black text-imi-300 uppercase tracking-widest mb-1">Leads</p>
                        <p className="text-lg font-black text-accent-700">{day.leads}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-imi-300 uppercase tracking-widest mb-1">Investido</p>
                        <p className="text-lg font-black text-imi-900 border-b-2 border-imi-100">R$ {day.spent}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>

      {/* Top Assets Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-elevated border-imi-50 h-full">
            <CardHeader title="Ranking de Criativos" icon={<Target size={18} className="text-accent-500" />} />
            <CardBody className="p-8">
              <div className="space-y-4">
                {analytics.topAds.map((ad, index) => (
                  <div
                    key={ad.id}
                    className="flex items-center gap-6 p-6 bg-imi-50/50 rounded-3xl border border-imi-100/30 hover:bg-white hover:border-accent-200 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-imi-950 text-accent-500 flex items-center justify-center text-lg font-black flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-black text-imi-900">{ad.name}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] font-bold text-imi-400 uppercase tracking-widest">{ad.impressions.toLocaleString()} Impr.</span>
                        <span className="w-1 h-1 bg-imi-200 rounded-full"></span>
                        <span className="text-[10px] font-bold text-imi-400 uppercase tracking-widest">{ad.clicks} Clicks</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-green-600">{ad.ctr}%</p>
                      <p className="text-[9px] font-black text-imi-400 uppercase tracking-widest">CTR Estratégico</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Financial Unit Summary */}
        <Card className="bg-imi-950 border-imi-800 text-white shadow-glow h-full">
          <CardHeader title="Unit Economics" />
          <CardBody className="p-8">
            <div className="space-y-10">
              <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10">
                <p className="text-[10px] font-bold text-imi-400 uppercase tracking-[0.2em] mb-3">Capital Alocado</p>
                <p className="text-4xl font-black text-white mb-2">
                  R$ {campaign.spent.toLocaleString('pt-BR')}
                </p>
                <Badge variant="primary" size="sm" className="bg-white/10 text-white border-white/20">
                  {((campaign.spent / campaign.budget) * 100).toFixed(0)}% do Budget
                </Badge>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-imi-400">Ticket Médio Estimado</span>
                  <span className="text-sm font-black text-green-400">R$ 450k</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-imi-400">ROAS Identificado</span>
                  <span className="text-sm font-black text-accent-400">{((analytics.revenue / campaign.spent)).toFixed(2)}x</span>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-imi-400 uppercase tracking-widest">Profit Líquido (Simulação)</p>
                  <p className="text-xs font-bold text-green-400">+{((analytics.revenue - campaign.spent) / analytics.revenue * 100).toFixed(1)}% mrg.</p>
                </div>
                <p className="text-3xl font-black text-accent-500">
                  R$ {((analytics.revenue - campaign.spent) / 1000).toFixed(1)}k
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
