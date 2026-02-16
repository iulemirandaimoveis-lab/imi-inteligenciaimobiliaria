'use client'

import React from 'react'
import PageHeader from '@/components/backoffice/PageHeader'
import { Phone, CheckCircle, XCircle, Search, Filter, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/backoffice/EmptyState'
import Link from 'next/link'

export default function ConsultoriasPage() {
    return (
        <div className="space-y-8 animate-fade-in custom-scrollbar">
            <PageHeader
                title="Consultorias & Suporte"
                description="Gestão de solicitações de atendimento especializado."
                breadcrumbs={[{ label: 'Consultorias' }]}
                action={
                    <Link href="/backoffice/consultorias/nova">
                        <Button icon={<Plus size={18} />}>Nova Solicitação</Button>
                    </Link>
                }
            />

            <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden">
                <EmptyState
                    icon={Phone}
                    title="Nenhuma consultoria agendada"
                    description="As solicitações de consultoria aparecerão aqui."
                    action={
                        <Link href="/backoffice/consultorias/nova">
                            <Button variant="outline" size="sm" icon={<Plus size={16} />}>Agendar Suporte</Button>
                        </Link>
                    }
                />
            </div>
        </div>
    )
}
