'use client'

import React from 'react'
import PageHeader from '@/components/backoffice/PageHeader'
import DashboardKPIs from '@/components/backoffice/dashboard/DashboardKPIs'
import SalesChart from '@/components/backoffice/dashboard/SalesChart'
import LeadsChart from '@/components/backoffice/dashboard/LeadsChart'
import RecentActivityFeed from '@/components/backoffice/dashboard/RecentActivityFeed'

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Dashboard Geral"
        description="Visão consolidada do desempenho comercial e pipeline."
      />

      <DashboardKPIs />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div>
          <LeadsChart />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RecentActivityFeed />
        </div>
        {/* Placeholder para futuras seções (ex: Top Corretores, Próximas Tarefas) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl border border-primary/10 p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
          <h3 className="text-xl font-bold text-primary mb-2">Próximos Passos</h3>
          <p className="text-gray-500 max-w-md">
            Continue evoluindo seu CRM. Próximas funcionalidades sugeridas: Automação de E-mails, Integração Whatsapp e Relatórios Personalizados.
          </p>
        </div>
      </div>
    </div>
  )
}
