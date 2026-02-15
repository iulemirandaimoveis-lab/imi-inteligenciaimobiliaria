'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  DollarSign,
  FileText,
  ArrowUpRight,
  Calendar,
  Activity,
  Target,
  Zap,
} from 'lucide-react'

// Dados reais de exemplo - Recife/PE
const dashboardData = {
  kpis: [
    {
      label: 'Leads este mês',
      value: '127',
      change: '+18.2%',
      trend: 'up',
      icon: Users,
      color: 'blue',
      subtitle: 'vs mês anterior',
    },
    {
      label: 'Empreendimentos ativos',
      value: '34',
      change: '+8.2%',
      trend: 'up',
      icon: Building2,
      color: 'green',
      subtitle: '12 em Boa Viagem',
    },
    {
      label: 'Taxa de conversão',
      value: '23.5%',
      change: '-2.1%',
      trend: 'down',
      icon: Target,
      color: 'orange',
      subtitle: '30 fechamentos',
    },
    {
      label: 'Receita projetada',
      value: 'R$ 2.4M',
      change: '+15.3%',
      trend: 'up',
      icon: DollarSign,
      color: 'purple',
      subtitle: 'Pipeline Q1 2026',
    },
  ],

  recentActivity: [
    {
      id: 1,
      type: 'lead',
      title: 'Novo lead capturado',
      description: 'Maria Santos - Apartamento 3Q em Boa Viagem',
      time: '8 minutos atrás',
      icon: Users,
      color: 'blue',
    },
    {
      id: 2,
      type: 'avaliacao',
      title: 'Avaliação concluída',
      description: 'Reserva Atlantis - Laudo NBR 14653 enviado',
      time: '2 horas atrás',
      icon: FileText,
      color: 'green',
    },
    {
      id: 3,
      type: 'credito',
      title: 'Crédito aprovado',
      description: 'João Silva - R$ 450k financiamento Caixa',
      time: '5 horas atrás',
      icon: DollarSign,
      color: 'purple',
    },
    {
      id: 4,
      type: 'imovel',
      title: 'Imóvel publicado',
      description: 'Villa Jardins - Lançamento oficial',
      time: 'Hoje, 09:30',
      icon: Building2,
      color: 'orange',
    },
  ],

  topPerformers: [
    {
      name: 'Boa Viagem',
      leads: 45,
      conversions: 12,
      rate: 26.7,
      trend: 'up',
    },
    {
      name: 'Pina',
      leads: 28,
      conversions: 7,
      rate: 25.0,
      trend: 'up',
    },
    {
      name: 'Piedade',
      leads: 22,
      conversions: 5,
      rate: 22.7,
      trend: 'neutral',
    },
    {
      name: 'Setúbal',
      leads: 18,
      conversions: 3,
      rate: 16.7,
      trend: 'down',
    },
    {
      name: 'Candeias',
      leads: 14,
      conversions: 3,
      rate: 21.4,
      trend: 'up',
    },
  ],

  upcomingTasks: [
    {
      id: 1,
      title: 'Visita técnica - Reserva Atlantis',
      time: 'Hoje, 14:00',
      priority: 'high',
      type: 'avaliacao',
    },
    {
      id: 2,
      title: 'Reunião cliente - Villa Jardins',
      time: 'Amanhã, 10:30',
      priority: 'high',
      type: 'consultoria',
    },
    {
      id: 3,
      title: 'Análise de crédito - Casa Piedade',
      time: '17 Fev, 09:00',
      priority: 'medium',
      type: 'credito',
    },
    {
      id: 4,
      title: 'Follow-up leads Instagram',
      time: '18 Fev, 15:00',
      priority: 'low',
      type: 'lead',
    },
  ],

  quickStats: [
    { label: 'Avaliacoes pendentes', value: 8, color: 'orange' },
    { label: 'Propostas em análise', value: 12, color: 'blue' },
    { label: 'Vistorias agendadas', value: 5, color: 'green' },
    { label: 'Contratos a assinar', value: 3, color: 'purple' },
  ],
}

export default function DashboardPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bom dia, Iule 👋
        </h1>
        <p className="text-gray-600">
          Aqui está o resumo das suas operações hoje
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardData.kpis.map((kpi, index) => {
          const Icon = kpi.icon
          const isPositive = kpi.trend === 'up'

          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all hover:shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-${kpi.color}-50 flex items-center justify-center`}>
                  <Icon className={`text-${kpi.color}-600`} size={24} />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isPositive
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                  }`}>
                  {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {kpi.change}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                <p className="text-sm font-medium text-gray-900">{kpi.label}</p>
                <p className="text-xs text-gray-500">{kpi.subtitle}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity - 2/3 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Atividade recente</h2>
                <button
                  onClick={() => router.push('/backoffice/leads')}
                  className="text-sm font-medium text-accent-600 hover:text-accent-700 flex items-center gap-1"
                >
                  Ver todas
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {dashboardData.recentActivity.map((activity) => {
                const Icon = activity.icon
                return (
                  <div
                    key={activity.id}
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-${activity.color}-50 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`text-${activity.color}-600`} size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Tasks - 1/3 */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Próximas tarefas</h2>
            </div>
            <div className="p-6 space-y-4">
              {dashboardData.upcomingTasks.map((task) => {
                const priorityColors = {
                  high: 'bg-red-50 text-red-700 border-red-200',
                  medium: 'bg-orange-50 text-orange-700 border-orange-200',
                  low: 'bg-blue-50 text-blue-700 border-blue-200',
                }

                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-900 flex-1">
                        {task.title}
                      </p>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityColors[task.priority]}`}>
                        {task.priority === 'high' && 'Alta'}
                        {task.priority === 'medium' && 'Média'}
                        {task.priority === 'low' && 'Baixa'}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {task.time}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Status rápido</h3>
            <div className="space-y-3">
              {dashboardData.quickStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{stat.label}</span>
                  <span className={`text-sm font-bold text-${stat.color}-600`}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance by Region */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Performance por região</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {dashboardData.topPerformers.map((region, index) => {
              const percentage = (region.conversions / region.leads) * 100

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900">
                        {index + 1}. {region.name}
                      </span>
                      {region.trend === 'up' && (
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp size={14} />
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {region.rate}% conversão
                      </p>
                      <p className="text-xs text-gray-500">
                        {region.conversions} de {region.leads} leads
                      </p>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
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
