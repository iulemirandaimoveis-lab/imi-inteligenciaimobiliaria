'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '../../components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/Badge'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import {
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table'
import {
  Link2,
  MousePointer,
  Eye,
  Clock,
  TrendingUp,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  ExternalLink,
} from 'lucide-react'

// Mock data (depois virá do Supabase)
const mockAnalytics = {
  kpis: {
    totalClicks: 3248,
    clicksChange: 18.2,
    totalViews: 12847,
    viewsChange: 12.5,
    avgTime: 342, // segundos
    timeChange: 8.3,
    conversionRate: 2.53,
    conversionChange: -0.4,
  },
  clicksBySource: [
    { source: 'Instagram', clicks: 1243, percentage: 38.3 },
    { source: 'Facebook', clicks: 892, percentage: 27.5 },
    { source: 'Google', clicks: 654, percentage: 20.1 },
    { source: 'WhatsApp', clicks: 289, percentage: 8.9 },
    { source: 'Email', clicks: 170, percentage: 5.2 },
  ],
  clicksByDevice: [
    { device: 'Mobile', clicks: 1948, percentage: 60.0, icon: Smartphone },
    { device: 'Desktop', clicks: 975, percentage: 30.0, icon: Monitor },
    { device: 'Tablet', clicks: 325, percentage: 10.0, icon: Tablet },
  ],
  topCampaigns: [
    {
      id: '1',
      name: 'Reserva Atlantis - Instagram Stories',
      clicks: 847,
      conversions: 42,
      roi: 8.2,
      link: 'https://imi.co/ra-ig-stories',
    },
    {
      id: '2',
      name: 'Villa Jardins - Facebook Ads',
      clicks: 623,
      conversions: 28,
      roi: 5.4,
      link: 'https://imi.co/vj-fb-ads',
    },
    {
      id: '3',
      name: 'Lançamento Piedade - Google Ads',
      clicks: 512,
      conversions: 31,
      roi: 7.1,
      link: 'https://imi.co/lp-gads',
    },
    {
      id: '4',
      name: 'Email Newsletter - Setembro',
      clicks: 289,
      conversions: 12,
      roi: 3.8,
      link: 'https://imi.co/newsletter-set',
    },
  ],
  topLocations: [
    { city: 'Recife', state: 'PE', clicks: 1847 },
    { city: 'São Paulo', state: 'SP', clicks: 523 },
    { city: 'Rio de Janeiro', state: 'RJ', clicks: 312 },
    { city: 'Fortaleza', state: 'CE', clicks: 198 },
    { city: 'Salvador', state: 'BA', clicks: 142 },
  ],
  timeline: [
    { date: '2024-02-08', clicks: 412 },
    { date: '2024-02-09', clicks: 458 },
    { date: '2024-02-10', clicks: 389 },
    { date: '2024-02-11', clicks: 523 },
    { date: '2024-02-12', clicks: 467 },
    { date: '2024-02-13', clicks: 502 },
    { date: '2024-02-14', clicks: 497 },
  ],
}

export default function TrackingDashboardPage() {
  const router = useRouter()
  const [timeRange, setTimeRange] = useState('7d')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tracking & Analytics"
        subtitle="Monitore o desempenho dos seus links e campanhas"
        breadcrumbs={[
          { label: 'Dashboard', href: '/backoffice/dashboard' },
          { label: 'Tracking' },
        ]}
        action={
          <Button
            icon={<Link2 size={20} />}
            onClick={() => router.push('/backoffice/tracking/links')}
          >
            Gerenciar Links
          </Button>
        }
      />

      {/* Period Selector */}
      <div className="flex justify-end">
        <Select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          options={[
            { value: '7d', label: 'Últimos 7 dias' },
            { value: '30d', label: 'Últimos 30 dias' },
            { value: '90d', label: 'Últimos 90 dias' },
          ]}
          className="w-48"
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          label="Total de Cliques"
          value={mockAnalytics.kpis.totalClicks.toLocaleString('pt-BR')}
          change={{
            value: mockAnalytics.kpis.clicksChange,
            trend: 'up',
            label: 'vs período anterior',
          }}
          icon={<MousePointer size={20} />}
          variant="primary"
        />

        <KPICard
          label="Visualizações de Página"
          value={mockAnalytics.kpis.totalViews.toLocaleString('pt-BR')}
          change={{
            value: mockAnalytics.kpis.viewsChange,
            trend: 'up',
          }}
          icon={<Eye size={20} />}
          variant="success"
        />

        <KPICard
          label="Tempo Médio"
          value={`${Math.floor(mockAnalytics.kpis.avgTime / 60)}m ${mockAnalytics.kpis.avgTime % 60}s`}
          change={{
            value: mockAnalytics.kpis.timeChange,
            trend: 'up',
          }}
          icon={<Clock size={20} />}
          variant="primary"
        />

        <KPICard
          label="Taxa de Conversão"
          value={`${mockAnalytics.kpis.conversionRate}%`}
          change={{
            value: Math.abs(mockAnalytics.kpis.conversionChange),
            trend: 'down',
          }}
          icon={<TrendingUp size={20} />}
          variant="warning"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clicks by Source */}
        <Card>
          <CardHeader title="Cliques por Origem" subtitle="Distribuição por canal de tráfego" />
          <CardBody>
            <div className="space-y-6">
              {mockAnalytics.clicksBySource.map((item) => (
                <div key={item.source} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-imi-900">
                      {item.source}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-imi-500">{item.percentage}%</span>
                      <Badge variant="neutral" size="sm">{item.clicks.toLocaleString()}</Badge>
                    </div>
                  </div>
                  <div className="h-2 bg-imi-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-500 transition-all duration-700 ease-smooth"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Clicks by Device */}
        <Card>
          <CardHeader title="Cliques por Dispositivo" subtitle="Acessos por categoria de hardware" />
          <CardBody>
            <div className="space-y-6">
              {mockAnalytics.clicksByDevice.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.device} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-imi-50 border border-imi-100 flex items-center justify-center text-imi-600">
                          <Icon size={18} />
                        </div>
                        <span className="text-sm font-bold text-imi-900">
                          {item.device}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-imi-500">{item.percentage}%</span>
                        <Badge variant="neutral" size="sm">{item.clicks.toLocaleString()}</Badge>
                      </div>
                    </div>
                    <div className="h-2 bg-imi-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-700 ease-smooth"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card>
        <CardHeader title="Evolução dos Cliques" subtitle="Volume diário na última semana" />
        <CardBody>
          <div className="space-y-4">
            {mockAnalytics.timeline.map((day) => {
              const maxClicks = Math.max(...mockAnalytics.timeline.map((d) => d.clicks))
              const percentage = (day.clicks / maxClicks) * 100
              const date = new Date(day.date)
              const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' })

              return (
                <div key={day.date} className="flex items-center gap-4">
                  <div className="w-20 text-xs font-black text-imi-400 uppercase tracking-widest">
                    <div className="text-imi-900">{dayName}</div>
                    <div className="text-[10px] font-medium opacity-60">
                      {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="h-10 bg-imi-50 rounded-xl overflow-hidden relative border border-imi-100/50">
                      <div
                        className="h-full bg-gradient-to-r from-accent-400 to-accent-600 transition-all duration-700 ease-smooth flex items-center justify-end pr-4"
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-xs font-black text-white drop-shadow-sm">
                          {day.clicks}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>

      {/* Top Campaigns */}
      <Card>
        <CardHeader title="Performance por Campanha" subtitle="Métricas detalhadas dos links ativos" />
        <CardBody>
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha Principal</TableHead>
                  <TableHead>Cliques</TableHead>
                  <TableHead>Conversões</TableHead>
                  <TableHead>ROI Est.</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAnalytics.topCampaigns.map((campaign) => (
                  <TableRow key={campaign.id} className="hover:bg-gray-50">
                    <TableCell>
                      <span className="font-bold text-imi-900">{campaign.name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral" size="sm">{campaign.clicks.toLocaleString()}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="success" size="sm" dot>{campaign.conversions}</Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-sm font-black ${campaign.roi >= 5
                          ? 'text-green-600'
                          : campaign.roi >= 2
                            ? 'text-yellow-600'
                            : 'text-red-600'
                          }`}
                      >
                        {campaign.roi}x
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<ExternalLink size={16} />}
                        onClick={() => window.open(campaign.link, '_blank')}
                      >
                        Explorar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>

      {/* Top Locations */}
      <Card className="bg-imi-50/50">
        <CardHeader
          title="Geolocalização de Acessos"
          subtitle="Ranking de cidades com maior interesse"
        />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockAnalytics.topLocations.map((location, index) => (
              <div
                key={`${location.city}-${location.state}`}
                className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-imi-100 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-100 text-accent-700 flex items-center justify-center text-sm font-black">
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-imi-900 truncate">
                    {location.city}, {location.state}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-imi-500 font-medium">
                    <MapPin size={12} />
                    {location.clicks.toLocaleString()} cliques
                  </div>
                </div>
                <Badge variant="primary" size="sm">Forte</Badge>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
