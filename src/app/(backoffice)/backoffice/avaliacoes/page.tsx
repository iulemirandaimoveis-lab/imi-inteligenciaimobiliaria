'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import EmptyState from '@/components/backoffice/EmptyState'
import { FileText, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import Link from 'next/link'

export default function AvaliacoesPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Avaliações Imobiliárias"
        description="Gestão de laudos e PTAMS (NBR 14653)."
        breadcrumbs={[{ label: 'Avaliações' }]}
        action={
            <Link href="/backoffice/avaliacoes/nova">
                <Button icon={<Plus size={18} />}>Nova Avaliação</Button>
            </Link>
        }
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden">
        <EmptyState
          icon={FileText}
          title="Nenhuma avaliação registrada"
          description="Crie laudos profissionais de avaliação imobiliária."
          action={
            <Link href="/backoffice/avaliacoes/nova">
                <Button variant="outline" size="sm" icon={<Plus size={16} />}>Novo Laudo</Button>
            </Link>
          }
        />
      </div>
    </div>
  )
}
