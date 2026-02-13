'use client'

import { useRouter } from 'next/navigation'
import PageHeader from '@/components/backoffice/PageHeader'
import DeveloperForm from '@/components/backoffice/construtoras/DeveloperForm'
import { useDeveloper, useDeveloperActions } from '@/hooks/use-developers'
import { toast } from 'sonner'
import { useState } from 'react'

export default function ConstruturaPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { developer, isLoading } = useDeveloper(params.id)
  const { updateDeveloper } = useDeveloperActions()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      await updateDeveloper(params.id, data)
      toast.success('Construtora atualizada com sucesso!')
      router.refresh()
    } catch (error) {
      console.error('Error updating developer:', error)
      toast.error('Erro ao salvar alterações.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div>Carregando...</div>
  }

  if (!developer) {
    return <div>Construtora não encontrada.</div>
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title={developer.name}
        description={`Gerenciamento da construtora #${developer.id.split('-')[0]}`}
        breadcrumbs={[
          { label: 'Construtoras', href: '/backoffice/construtoras' },
          { label: 'Detalhes' }
        ]}
      />
      <DeveloperForm
        initialData={developer}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
