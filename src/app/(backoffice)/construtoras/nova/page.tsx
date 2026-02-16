'use client'

import { useRouter } from 'next/navigation'
import PageHeader from '@/components/backoffice/PageHeader'
import DeveloperForm from '@/components/backoffice/construtoras/DeveloperForm'
import { useDeveloperActions } from '@/hooks/use-developers'
import { toast } from 'sonner'
import { useState } from 'react'

export default function NovaConstruturaPage() {
  const router = useRouter()
  const { createDeveloper } = useDeveloperActions()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      const result = await createDeveloper(data)
      toast.success('Construtora criada com sucesso!')
      // Redireciona para edição para liberar upload de logo
      router.push(`/backoffice/construtoras/${result.id}`)
    } catch (error) {
      console.error('Error creating developer:', error)
      toast.error('Erro ao criar construtora.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Nova Construtora"
        description="Cadastre um novo developer parceiro"
        breadcrumbs={[
          { label: 'Construtoras', href: '/backoffice/construtoras' },
          { label: 'Nova' }
        ]}
      />
      <DeveloperForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
