'use client'
import React from 'react'
import PageHeader from '@/components/backoffice/PageHeader'
import LeadsKanbanBoard from '@/components/backoffice/leads/LeadsKanbanBoard'

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline de Leads"
        description="Gestão visual do funil de vendas. Arraste e solte para mover os leads."
        breadcrumbs={[
          { label: 'Leads', href: '/backoffice/leads' },
          { label: 'Pipeline' }
        ]}
      />
      <LeadsKanbanBoard />
    </div>
  )
}
