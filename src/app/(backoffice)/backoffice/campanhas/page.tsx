'use client'

import React from 'react'
import PageHeader from '@/components/backoffice/PageHeader'
import { Megaphone, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/backoffice/EmptyState'
import Link from 'next/link'

export default function CampanhasPage() {
    return (
        <div className="space-y-8 animate-fade-in custom-scrollbar">
            <PageHeader
                title="Gestão de Campanhas"
                description="Controle de campanhas de marketing e ROI."
                breadcrumbs={[{ label: 'Campanhas' }]}
                action={
                    <Link href="/backoffice/campanhas/nova">
                        <Button icon={<Plus size={18} />}>Nova Campanha</Button>
                    </Link>
                }
            />

            <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden">
                <EmptyState
                    icon={Megaphone}
                    title="Nenhuma campanha ativa"
                    description="Crie campanhas para monitorar seus resultados."
                    action={
                        <Link href="/backoffice/campanhas/nova">
                            <Button variant="outline" size="sm" icon={<Plus size={16} />}>Criar Agora</Button>
                        </Link>
                    }
                />
            </div>
        </div>
    )
}
