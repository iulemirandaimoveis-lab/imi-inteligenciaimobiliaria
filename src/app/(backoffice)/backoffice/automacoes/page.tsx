'use client'

import React from 'react'
import PageHeader from '@/components/backoffice/PageHeader'
import Card from '@/components/ui/Card'
import { Zap } from 'lucide-react'

export default function AutomacoesPage() {
    return (
        <div className="animate-fade-in space-y-8">
            <PageHeader
                title="Automações do Sistema"
                description="Fluxos de trabalho automáticos e integração de processos globais."
                breadcrumbs={[
                    { label: 'Sistema', href: '/backoffice/settings' },
                    { label: 'Automações' }
                ]}
            />
            <Card className="min-h-[500px] flex items-center justify-center bg-white dark:bg-card-dark border-dashed border-2 border-gray-200 dark:border-white/10 rounded-[3rem] shadow-soft">
                <div className="text-center max-w-sm px-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6">
                        <Zap size={40} strokeWidth={2.5} />
                    </div>
                    <h3 className="font-display font-bold text-gray-900 dark:text-white text-2xl mb-3">Workflow Engine</h3>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                        Configure gatilhos e ações automáticas para automatizar o ciclo de vida do lead e alertas de estoque.
                    </p>
                </div>
            </Card>
        </div>
    )
}
