'use client'

import React from 'react'
import PageHeader from '@/components/backoffice/PageHeader'
import { Sparkles } from 'lucide-react'

export default function AutomacaoPage() {
    return (
        <div className="space-y-8 animate-fade-in">
            <PageHeader
                title="Automação IA"
                description="Geração automática de conteúdo com inteligência artificial."
                message="Potencialize sua criação de conteúdo com nosso assistente inteligente."
                breadcrumbs={[
                    { label: 'Conteúdo', href: '/backoffice/conteudo' },
                    { label: 'Automação IA' }
                ]}
            />
            <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-6 shadow-glow">
                    <Sparkles size={32} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Automação Inteligente</h2>
                <p className="text-gray-500 max-w-md">Em breve você poderá gerar posts, captions e roteiros completos utilizando nossos modelos de IA treinados.</p>
                <span className="mt-6 px-4 py-1.5 bg-purple-50 dark:bg-purple-900/10 rounded-full text-xs font-bold text-purple-600 uppercase tracking-widest border border-purple-100 dark:border-purple-500/20">Breve</span>
            </div>
        </div>
    )
}
