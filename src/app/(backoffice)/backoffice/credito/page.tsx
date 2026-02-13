'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import EmptyState from '@/components/backoffice/EmptyState'
import { CreditCard, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function CreditoPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Crédito Imobiliário"
        description="Gestão de solicitações de financiamento."
        breadcrumbs={[{ label: 'Crédito' }]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden">
        <EmptyState
          icon={CreditCard}
          title="Nenhuma solicitação"
          description="Acompanhe processos de financiamento dos clientes."
          action={
             <Button variant="outline" size="sm" icon={<Plus size={16} />}>Nova Solicitação</Button>
          }
        />
      </div>
    </div>
  )
}
