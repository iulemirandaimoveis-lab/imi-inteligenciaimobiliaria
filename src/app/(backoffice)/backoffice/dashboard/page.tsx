'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { LayoutDashboard, TrendingUp, Users, Building2 } from 'lucide-react'

export default function DashboardPage() {
  const stats = [
    { label: 'Empreendimentos', value: '24', icon: Building2 },
    { label: 'Leads Ativos', value: '156', icon: Users },
    { label: 'Taxa Conversão', value: '12.5%', icon: TrendingUp },
    { label: 'Ticket Médio', value: 'R$ 485k', icon: LayoutDashboard },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Visão geral de métricas e indicadores de performance."
        breadcrumbs={[{ label: 'Dashboard' }]}
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <stat.icon size={24} className="text-gray-400" />
            </div>
            <div className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
            <div className="text-sm text-gray-500 uppercase tracking-widest font-bold">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 shadow-soft">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Atividade Recente</h2>
        <p className="text-gray-500">Dashboard completo será implementado na próxima fase.</p>
      </div>
    </div>
  )
}
