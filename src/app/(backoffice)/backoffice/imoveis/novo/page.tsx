'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import DevelopmentForm from '@/components/backoffice/imoveis/DevelopmentForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewPropertyPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true)
        try {
            // Generate slug
            const slug = data.title
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                + '-' + Date.now().toString().slice(-4)

            const { data: newDev, error } = await supabase
                .from('developments')
                .insert([{
                    ...data,
                    slug,
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single()

            if (error) throw error

            toast.success('Empreendimento criado com sucesso!')
            // Redirect to edit page to add units/media
            router.push(`/backoffice/imoveis/${newDev.id}`)
        } catch (err: any) {
            console.error('Submission error:', err)
            toast.error('Erro ao salvar: ' + (err.message || 'Erro desconhecido'))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto pb-24 animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/backoffice/imoveis" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-gray-500" />
                </Link>
                <div>
                    <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">Novo Empreendimento</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Preencha os dados básicos para iniciar o cadastro.</p>
                </div>
            </div>

            <DevelopmentForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />
        </div>
    )
}
