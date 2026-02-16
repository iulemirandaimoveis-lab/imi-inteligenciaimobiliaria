'use client'
import PageHeader from '../components/PageHeader'
import EmptyState from '@/components/backoffice/EmptyState'
import Button from '@/components/ui/Button'
import { Building2, Plus } from 'lucide-react'
import Link from 'next/link'

export default function ConstrutarasPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Construtoras"
        subtitle="Gestão de construtoras e incorporadoras parceiras."
        breadcrumbs={[{ name: 'Construtoras' }]}
        action={
          <Link href="/backoffice/construtoras/nova">
            <Button icon={<Plus size={18} />}>Nova Construtora</Button>
          </Link>
        }
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden">
        <EmptyState
          icon={Building2}
          title="Nenhuma construtora cadastrada"
          description="Cadastre construtoras para vincular aos empreendimentos."
          action={
            <Link href="/backoffice/construtoras/nova">
              <Button variant="outline" size="sm" icon={<Plus size={16} />}>Cadastrar Agora</Button>
            </Link>
          }
        />
      </div>
    </div>
  )
}
