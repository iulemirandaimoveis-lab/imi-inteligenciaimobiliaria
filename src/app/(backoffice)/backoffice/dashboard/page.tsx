'use client'

import React from 'react'
import PageHeader from '@/components/backoffice/PageHeader'
import DashboardKPIs from '@/components/backoffice/dashboard/DashboardKPIs'
import DashboardCharts from '@/components/backoffice/dashboard/DashboardCharts'
import DashboardRecentActivity from '@/components/backoffice/dashboard/DashboardRecentActivity'
import { LayoutDashboard } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-10 animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Centro de comando estratégico de inteligência patrimonial e institucional."
        breadcrumbs={[
          { label: 'Backoffice', href: '/backoffice' },
          { label: 'Dashboard' }
        ]}
      />

      {/* Seção de Resumo Estratégico (KPIs) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-imi-400 uppercase tracking-[0.2em]">Inteligência em Tempo Real</h2>
          <div className="h-px flex-1 bg-imi-100 mx-6 hidden md:block" />
        </div>
        <DashboardKPIs />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Gráficos e Insights (2/3) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-imi-400 uppercase tracking-[0.2em]">Análise de Performance</h2>
            <div className="h-px flex-1 bg-imi-100 mx-6" />
          </div>
          <DashboardCharts />
        </div>

        {/* Atividade Recente (1/3) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-imi-400 uppercase tracking-[0.2em]">Fluxo de Atividade</h2>
            <div className="h-px flex-1 bg-imi-100 mx-6 hidden xl:block" />
          </div>
          <DashboardRecentActivity />
        </div>
      </div>
    </div>
  )
}
