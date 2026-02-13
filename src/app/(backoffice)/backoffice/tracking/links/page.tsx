'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import EmptyState from '@/components/backoffice/EmptyState'
import { Link as LinkIcon, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function LinksPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Links Rastreáveis"
        description="Gestão de URLs parametrizadas (UTM)."
        breadcrumbs={[
          { label: 'Tracking', href: '/backoffice/tracking' },
          { label: 'Links' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden">
        <EmptyState
          icon={LinkIcon}
          title="Nenhum link criado"
          description="Crie campanhas de links para rastrear suas conversões."
          action={
            <Button variant="outline" size="sm" icon={<Plus size={16} />}>Criar Link</Button>
          }
        />
      </div>
    </div>
  )
}
