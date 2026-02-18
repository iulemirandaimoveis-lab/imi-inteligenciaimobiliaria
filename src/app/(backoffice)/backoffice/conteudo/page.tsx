'use client'

import React from 'react'
import PageHeader from '@/components/backoffice/PageHeader'
import { FileText, Calendar, Sparkles, Plus } from 'lucide-react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/backoffice/EmptyState'

export default function ConteudoPage() {
    return (
        <div className="space-y-8 animate-fade-in">
            <PageHeader
                title="Gestão de Conteúdo"
                description="Planejamento e publicação de materiais."
                message="Centralize todas as suas estratégias de conteúdo em um único local."
                breadcrumbs={[{ label: 'Conteúdo' }]}
                action={
                    <Link href="/backoffice/conteudo/novo">
                        <Button icon={<Plus size={18} />}>Novo Conteúdo</Button>
                    </Link>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/backoffice/conteudo/calendario" className="group">
                    <Card className="h-full hover:scale-[1.02] transition-transform cursor-pointer border-transparent hover:border-primary/20 bg-gradient-to-br from-white to-gray-50 dark:from-card-dark dark:to-card-darker">
                        <div className="flex flex-col items-center text-center p-6">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
                                <Calendar size={24} />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Calendário Editorial</h3>
                            <p className="text-sm text-gray-500">Planeje e visualize suas publicações em uma timeline interativa.</p>
                        </div>
                    </Card>
                </Link>

                <Link href="/backoffice/conteudo/automacao" className="group">
                    <Card className="h-full hover:scale-[1.02] transition-transform cursor-pointer border-transparent hover:border-purple-500/20 bg-gradient-to-br from-white to-gray-50 dark:from-card-dark dark:to-card-darker">
                        <div className="flex flex-col items-center text-center p-6">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/10 flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform shadow-glow-purple">
                                <Sparkles size={24} />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Automação com IA</h3>
                            <p className="text-sm text-gray-500">Gere conteúdo automaticamente utilizando inteligência artificial.</p>
                        </div>
                    </Card>
                </Link>

                <Link href="/backoffice/conteudo/novo" className="group">
                    <Card className="h-full hover:scale-[1.02] transition-transform cursor-pointer border-transparent hover:border-green-500/20 bg-gradient-to-br from-white to-gray-50 dark:from-card-dark dark:to-card-darker">
                        <div className="flex flex-col items-center text-center p-6">
                            <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/10 flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform">
                                <FileText size={24} />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Novo Conteúdo</h3>
                            <p className="text-sm text-gray-500">Crie artigos, posts e materiais ricos manualmente.</p>
                        </div>
                    </Card>
                </Link>
            </div>

            <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-white/5">
                    <h3 className="font-bold text-gray-900 dark:text-white">Conteúdos Recentes</h3>
                </div>
                <EmptyState
                    icon={FileText}
                    title="Nenhum conteúdo publicado"
                    description="Comece criando seu primeiro post ou artigo."
                    action={
                        <Link href="/backoffice/conteudo/novo">
                            <Button variant="outline" size="sm" icon={<Plus size={16} />}>Criar Agora</Button>
                        </Link>
                    }
                />
            </div>
        </div>
    )
}
