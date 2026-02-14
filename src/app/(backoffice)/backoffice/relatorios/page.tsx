'use client'

import { useState } from 'react'
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
  Download,
  FileText,
  TrendingUp,
  Building2,
  Users,
  DollarSign,
  Calendar,
  Target,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

// Mock data consolidado (depois virá do Supabase)
const mockData = {
  period: {
    start: '2024-02-01',
    end: '2024-02-14',
  },

  // KPIs Gerais
  overview: {
    totalLeads: 247,
    leadsChange: 18.5,
    totalProperties: 34,
    propertiesChange: 8.2,
    totalRevenue: 2400000,
    revenueChange: 22.4,
    conversionRate: 4.8,
    conversionChange: -0.3,
  },

  // Leads por Origem
  leadsBySource: [
    { source: 'Instagram', count: 89, percentage: 36, conversions: 12 },
    { source: 'Facebook', count: 67, percentage: 27, conversions: 8 },
    { source: 'Google Ads', count: 45, percentage: 18, conversions: 5 },
    { source: 'Website', count: 28, percentage: 11, conversions: 3 },
    { source: 'Email', count: 18, percentage: 8, conversions: 2 },
  ],

  // Performance por Empreendimento
  propertiesPerformance: [
    {
      id: '1',
      name: 'Reserva Atlantis',
      leads: 87,
      conversions: 12,
      conversionRate: 13.8,
      revenue: 890000,
    },
    {
      id: '2',
      name: 'Villa Jardins',
      leads: 64,
      conversions: 8,
      conversionRate: 12.5,
      revenue: 720000,
    },
    {
      id: '3',
      name: 'Lançamento Piedade',
      leads: 52,
      conversions: 5,
      conversionRate: 9.6,
      revenue: 480000,
    },
    {
      id: '4',
      name: 'Solar do Parque',
      leads: 44,
      conversions: 5,
      conversionRate: 11.4,
      revenue: 310000,
    },
  ],

  // Atividades Recentes
  recentActivity: [
    {
      type: 'lead',
      description: '12 novos leads hoje',
      time: '2 horas atrás',
      trend: 'up',
    },
    {
      type: 'conversion',
      description: '3 conversões confirmadas',
      time: '5 horas atrás',
      trend: 'up',
    },
    {
      type: 'property',
      description: '2 empreendimentos publicados',
      time: '1 dia atrás',
      trend: 'neutral',
    },
    {
      type: 'campaign',
      description: 'Campanha Instagram atingiu meta',
      time: '2 dias atrás',
      trend: 'up',
    },
  ],

  // Funil de Conversão
  funnel: [
    { stage: 'Visitantes', count: 12847, percentage: 100 },
    { stage: 'Leads', count: 247, percentage: 1.9 },
    { stage: 'Qualificados', count: 98, percentage: 0.76 },
    { stage: 'Propostas', count: 42, percentage: 0.33 },
    { stage: 'Fechados', count: 15, percentage: 0.12 },
  ],

  // Performance Mensal
  monthlyTrend: [
    { month: 'Ago', leads: 189, conversions: 8, revenue: 620000 },
    { month: 'Set', leads: 214, conversions: 11, revenue: 890000 },
    { month: 'Out', leads: 198, conversions: 9, revenue: 710000 },
    { month: 'Nov', leads: 223, conversions: 13, revenue: 1020000 },
    { month: 'Dez', leads: 256, conversions: 14, revenue: 1180000 },
    { month: 'Jan', leads: 247, conversions: 15, revenue: 1240000 },
  ],

  // Top Corretores
  topBrokers: [
    { name: 'Ana Paula', leads: 45, conversions: 8, revenue: 680000 },
    { name: 'Carlos Silva', leads: 38, conversions: 6, revenue: 520000 },
    { name: 'Marina Costa', leads: 32, conversions: 5, revenue: 410000 },
  ],
}

export default function RelatoriosPage() {
  const [timeRange, setTimeRange] = useState('30d')
  const data = mockData

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios & Business Intelligence"
        subtitle="Visão consolidada do ecossistema IMI Atlantis"
        breadcrumbs={[
          { name: 'Dashboard', href: '/backoffice/backoffice/dashboard' },
          { name: 'Relatórios BI' },
        ]}
        action={
          <div className="flex items-center gap-3">
            <Select
              className="w-48 bg-white"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              options={[
                { value: '7d', label: 'Últimos 7 dias' },
                { value: '30d', label: 'Últimos 30 dias' },
                { value: '90d', label: 'Últimos 90 dias' },
                { value: 'year', label: 'Visão Anual' },
              ]}
            />
            <Button variant="outline" icon={<Download size={18} />} className="bg-white">
              Exportar
            </Button>
          </div>
        }
      />

      {/* Primary Analytics Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          label="Volume de Leads"
          value={data.overview.totalLeads.toString()}
          change={{
            value: data.overview.leadsChange,
            trend: 'up',
            label: 'vs. ciclo anterior',
          }}
          icon={<Users />}
          variant="primary"
          className="shadow-elevated"
        />

        <KPICard
          label="Portfólio Ativo"
          value={data.overview.totalProperties.toString()}
          change={{
            value: data.overview.propertiesChange,
            trend: 'up',
          }}
          icon={<Building2 />}
          variant="success"
          className="shadow-elevated"
        />

        <KPICard
          label="GMV do Período"
          value={`R$ ${(data.overview.totalRevenue / 1000000).toFixed(1)}M`}
          change={{
            value: data.overview.revenueChange,
            trend: 'up',
          }}
          icon={<DollarSign />}
          variant="success"
          className="bg-imi-950 border-imi-800 text-white shadow-glow"
        />

        <KPICard
          label="Health Score (Conv)"
          value={`${data.overview.conversionRate}%`}
          change={{
            value: Math.abs(data.overview.conversionChange),
            trend: 'down',
          }}
          icon={<TrendingUp />}
          variant="warning"
          className="shadow-elevated"
        />
      </div>

      {/* Distribution & Funnel Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attribution by Source */}
        <Card className="shadow-elevated border-imi-50">
          <CardHeader
            title="Atribuição de Leads por Origem"
            subtitle="Análise multicanal de tração digital"
          />
          <CardBody className="p-8">
            <div className="space-y-8">
              {data.leadsBySource.map((item) => (
                <div key={item.source} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-imi-900 uppercase tracking-wider">
                      {item.source}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-accent-600">{item.percentage}%</span>
                      <Badge variant="neutral" size="sm">{item.count} leads</Badge>
                    </div>
                  </div>
                  <div className="h-3 bg-imi-50 rounded-full overflow-hidden border border-imi-100">
                    <div
                      className="h-full bg-accent-500 transition-all duration-1000 ease-smooth rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-imi-400 uppercase tracking-widest pl-1">
                    <span>{item.conversions} Conversões Confirmadas</span>
                    <span className="text-green-600">
                      {((item.conversions / item.count) * 100).toFixed(1)}% Taxa de Sucesso
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Conversion Funnel Engineering */}
        <Card className="shadow-elevated border-imi-50">
          <CardHeader title="Funil de Conversão High-Level" subtitle="Eficiência do pipeline de vendas" />
          <CardBody className="p-8">
            <div className="space-y-5">
              {data.funnel.map((stage, index) => {
                const isLast = index === data.funnel.length - 1
                return (
                  <div key={stage.stage} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-imi-400 uppercase tracking-[0.2em]">
                        {stage.stage}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-imi-900">
                          {stage.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="relative h-12 bg-imi-50 rounded-2xl overflow-hidden border border-imi-100/50">
                      <div
                        className={`h-full transition-all duration-1000 ease-smooth flex items-center px-6 ${isLast ? 'bg-green-500 shadow-glow' : 'bg-imi-950'
                          }`}
                        style={{ width: `${Math.max(15, stage.percentage * 8)}%` }}
                      >
                        <span className={`text-sm font-black ${isLast ? 'text-white' : 'text-accent-400'}`}>
                          {stage.count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Asset Performance Grid */}
      <Card className="shadow-elevated border-imi-50">
        <CardHeader
          title="Performance Proativa por Ativo"
          subtitle="Top performance de conversão por empreendimento"
        />
        <CardBody className="p-0">
          <TableContainer className="border-none shadow-none">
            <Table>
              <TableHeader className="bg-imi-50/50">
                <TableRow>
                  <TableHead className="py-6 text-[10px] font-black uppercase text-imi-400 tracking-widest">Empreendimento</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase text-imi-400 tracking-widest">Leads</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase text-imi-400 tracking-widest">Conversões</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase text-imi-400 tracking-widest text-center">Efficiency Rate</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase text-imi-400 tracking-widest text-right">Volume (Receita)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.propertiesPerformance.map((property) => (
                  <TableRow key={property.id} className="hover:bg-imi-50/30 transition-colors">
                    <TableCell className="py-6">
                      <span className="font-black text-imi-900 uppercase tracking-tighter">
                        {property.name}
                      </span>
                    </TableCell>
                    <TableCell className="py-6">
                      <Badge variant="neutral" size="sm" className="bg-imi-50">{property.leads}</Badge>
                    </TableCell>
                    <TableCell className="py-6">
                      <Badge variant="success" size="sm" dot>{property.conversions}</Badge>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <div className="flex flex-col items-center">
                        <span
                          className={`text-sm font-black ${property.conversionRate >= 12
                              ? 'text-green-600'
                              : property.conversionRate >= 10
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                        >
                          {property.conversionRate}%
                        </span>
                        <div className="w-16 h-1 bg-imi-100 rounded-full mt-1">
                          <div
                            className={`h-full rounded-full ${property.conversionRate >= 12 ? 'bg-green-500' : 'bg-yellow-500'}`}
                            style={{ width: `${property.conversionRate * 5}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-right">
                      <span className="text-sm font-black text-imi-950">
                        R$ {(property.revenue / 1000).toFixed(0)}k
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>

      {/* Bottom Growth Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Unit Economics Trend */}
        <Card className="shadow-elevated border-imi-50">
          <CardHeader title="Trend de Growth Mensal" subtitle="Visão semestral de geração de valor" />
          <CardBody className="p-8">
            <div className="space-y-5">
              {data.monthlyTrend.map((month) => {
                const maxRevenue = Math.max(...data.monthlyTrend.map((m) => m.revenue))
                const percentage = (month.revenue / maxRevenue) * 100

                return (
                  <div key={month.month} className="group">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-imi-400 group-hover:text-accent-600 transition-colors">
                      <span className="w-12">{month.month}</span>
                      <div className="flex items-center gap-6">
                        <span>{month.leads} Leads</span>
                        <span className="text-green-600">{month.conversions} Conv.</span>
                        <span className="text-imi-950">R$ {(month.revenue / 1000).toFixed(0)}k</span>
                      </div>
                    </div>
                    <div className="h-4 bg-imi-50 rounded-2xl overflow-hidden border border-imi-100/50">
                      <div
                        className="h-full bg-accent-500 transition-all duration-1000 ease-smooth rounded-full shadow-sm"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>

        {/* Real-time Activity Pulse */}
        <Card className="shadow-elevated border-imi-50">
          <CardHeader title="Pulse: Atividades Estratégicas" subtitle="Timeline de operações recentes" />
          <CardBody className="p-8">
            <div className="space-y-6">
              {data.recentActivity.map((activity, index) => {
                const icons: Record<string, any> = {
                  lead: Users,
                  conversion: Target,
                  property: Building2,
                  campaign: BarChart3,
                }
                const Icon = icons[activity.type]
                const TrendIcon =
                  activity.trend === 'up' ? ArrowUpRight : ArrowDownRight

                return (
                  <div key={index} className="flex items-center gap-6 group">
                    <div className="w-14 h-14 rounded-2xl bg-imi-50 border border-imi-100 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-500 transition-all duration-500">
                      <Icon size={22} className="text-imi-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-imi-900 group-hover:translate-x-1 transition-transform">
                        {activity.description}
                      </p>
                      <p className="text-[10px] font-bold text-imi-400 uppercase tracking-widest mt-1">{activity.time}</p>
                    </div>
                    {activity.trend !== 'neutral' && (
                      <div className={`p-2 rounded-lg ${activity.trend === 'up' ? 'bg-green-50' : 'bg-red-50'}`}>
                        <TrendIcon
                          size={18}
                          className={
                            activity.trend === 'up' ? 'text-green-600' : 'text-red-600'
                          }
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* High Performance Brokers Ranking */}
      {data.topBrokers.length > 0 && (
        <Card className="bg-imi-950 border-imi-800 shadow-glow">
          <CardHeader title="Top Performance: Consultores" className="text-white border-white/10" />
          <CardBody className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {data.topBrokers.map((broker, index) => (
                <div
                  key={broker.name}
                  className="p-8 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-accent-500 text-white flex items-center justify-center text-xl font-black shadow-glow">
                      {index + 1}
                    </div>
                    <Badge variant="primary" className="bg-white/10 text-accent-400 border-accent-900">Elite</Badge>
                  </div>

                  <p className="text-xl font-black text-white uppercase tracking-tighter mb-6 group-hover:text-accent-400 transition-colors">
                    {broker.name}
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-imi-400">Leads Retidos</span>
                      <span className="text-sm font-black text-white">{broker.leads}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-imi-400">Conversões Confirmadas</span>
                      <span className="text-sm font-black text-green-400">{broker.conversions}</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-accent-500">Volume Total</span>
                      <span className="text-lg font-black text-white">R$ {(broker.revenue / 1000).toFixed(0)}k</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
