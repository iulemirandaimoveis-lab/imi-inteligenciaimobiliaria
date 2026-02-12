'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import DevelopmentForm from '@/components/backoffice/imoveis/DevelopmentForm'
import PropertyUnitsManager from '@/components/backoffice/imoveis/PropertyUnitsManager'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useDevelopment } from '@/hooks/use-developments'

export default function EditPropertyPage({ params }: { params: { id: string } }) {
    const { id } = params
    const { development, isLoading, mutate } = useDevelopment(id)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true)
        try {
            const { error } = await supabase
                .from('developments')
                .update({
                    ...data,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)

            if (error) throw error

            toast.success('Empreendimento atualizado com sucesso!')
            mutate() // Refresh data
        } catch (err: any) {
            console.error('Update error:', err)
            toast.error('Erro ao salvar: ' + (err.message || 'Erro desconhecido'))
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return <div className="flex items-center justify-center p-20 text-gray-400"><Loader2 className="animate-spin" size={32} /></div>
    }

    if (!development) {
        return <div className="p-10 text-center">Empreendimento não encontrado.</div>
    }

    return (
        <div className="max-w-5xl mx-auto pb-40 animate-fade-in space-y-12">
            <div className="flex items-center gap-4">
                <Link href="/backoffice/imoveis" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-gray-500" />
                </Link>
                <div>
                    <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">Editar Empreendimento</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie informações, mídia e inventário.</p>
                </div>
            </div>

            {/* Main Form */}
            <DevelopmentForm
                initialData={development}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />

            {/* Units Manager Section */}
            <div className="border-t border-gray-100 pt-12">
                <PropertyUnitsManager propertyId={id} />
            </div>
        </div>
    )
}
