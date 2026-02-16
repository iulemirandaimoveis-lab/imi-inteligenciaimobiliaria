'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import EmptyState from '@/components/backoffice/EmptyState'
import { UserCircle, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function UsuariosPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Usuários Administrativos"
        breadcrumbs={[
          { label: 'Configurações', href: '/backoffice/settings' },
          { label: 'Usuários' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden">
        <EmptyState
          icon={UserCircle}
          title="Nenhum usuário adicional"
          description="Gerencie os administradores do sistema."
          action={
            <Button variant="outline" size="sm" icon={<Plus size={16} />}>Adicionar Admin</Button>
          }
        />
      </div>
    </div>
  )
}
