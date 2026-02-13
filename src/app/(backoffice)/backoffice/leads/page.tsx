'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Inbox, Star, Columns, Mail, Phone, ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import { format } from 'date-fns'
import PageHeader from '@/components/backoffice/PageHeader'

const supabase = createClient()

export default function LeadsPage() {
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState('all')

    const { data: leads = [], isLoading } = useSWR('leads_inbox', async () => {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false })
        if (error) throw error
        return data || []
    })

    const filteredLeads = leads.filter((lead: any) =>
        statusFilter === 'all' || lead.status === statusFilter
    )

    const selectedLead = leads.find((l: any) => l.id === selectedLeadId)

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.24))]">
            <div className="flex-none mb-6">
                <PageHeader
                    title="Gestão de Leads"
                    description="Central unificada de oportunidades."
                    breadcrumbs={[{ label: 'Leads' }]}
                    action={
                        <div className="flex items-center gap-2">
                            <Link href="/backoffice/leads/kanban">
                                <Button variant="outline" icon={<Columns size={18} />}>Kanban View</Button>
                            </Link>
                            <Button icon={<Plus size={18} />}>Novo Lead</Button>
                        </div>
                    }
                />
            </div>

            <div className="flex-1 flex overflow-hidden bg-white dark:bg-card-dark rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-soft">
                {/* Sidebar Filters */}
                <aside className="w-64 border-r border-gray-100 dark:border-white/5 hidden lg:flex flex-col bg-gray-50/50 dark:bg-card-darker/50 p-4">
                    <nav className="space-y-1">
                        <button onClick={() => setStatusFilter('all')} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-all ${statusFilter === 'all' ? 'bg-white dark:bg-white/5 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                            <span className="flex items-center gap-3"><Inbox size={18} /> Todos</span>
                            <Badge size="sm" variant="ghost">{leads.length}</Badge>
                        </button>
                        <button onClick={() => setStatusFilter('new')} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-all ${statusFilter === 'new' ? 'bg-white dark:bg-white/5 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                            <span className="flex items-center gap-3"><Star size={18} /> Novos</span>
                            <Badge size="sm" variant="ghost">{leads.filter((l: any) => l.status === 'new').length}</Badge>
                        </button>
                    </nav>
                </aside>

                {/* List View */}
                <div className={`${selectedLeadId ? 'hidden md:flex' : 'flex'} flex-1 flex-col border-r border-gray-100 dark:border-white/5 min-w-0`}>
                    <div className="p-4 border-b border-gray-100 dark:border-white/5 sticky top-0 bg-white/80 dark:bg-card-dark/80 backdrop-blur-sm z-10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar nos leads..."
                                className="w-full pl-10 pr-4 h-10 bg-gray-50 dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 placeholder-gray-400 dark:text-white transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {isLoading ? (
                            <div className="flex justify-center p-8"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span></div>
                        ) : (
                            filteredLeads.map((lead: any) => (
                                <div
                                    key={lead.id}
                                    onClick={() => setSelectedLeadId(lead.id)}
                                    className={`p-4 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-all border border-transparent ${selectedLeadId === lead.id ? 'bg-primary/5 dark:bg-primary/10 border-primary/20 shadow-sm' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`text-sm font-bold ${selectedLeadId === lead.id ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>{lead.name}</h4>
                                        <span className="text-[10px] text-gray-400 font-medium">{format(new Date(lead.created_at), 'dd MMM')}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">{lead.interest || 'Sem interesse definido'}</p>
                                    <div className="flex gap-2">
                                        <Badge size="sm" variant={lead.status === 'new' ? 'primary' : 'outline'}>
                                            {lead.status === 'new' ? 'Novo' : lead.status}
                                        </Badge>
                                        {lead.ai_score && <Badge size="sm" variant="warning">Score {lead.ai_score}</Badge>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Detail View (Preview) */}
                <div className={`${selectedLeadId ? 'flex' : 'hidden'} lg:flex flex-[1.5] flex-col bg-gray-50/50 dark:bg-card-darker/50 overflow-y-auto custom-scrollbar`}>
                    {selectedLead ? (
                        <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Detail Header */}
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white">{selectedLead.name}</h2>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setSelectedLeadId(null)} className="md:hidden">Voltar</Button>
                                        <Button variant="primary" size="sm">Editar</Button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm">
                                    <span className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-300">
                                        <Mail size={14} className="text-primary" /> {selectedLead.email}
                                    </span>
                                    <span className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-300">
                                        <Phone size={14} className="text-primary" /> {selectedLead.phone}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Card padding="md" className="bg-white dark:bg-card-dark shadow-sm border-gray-100 dark:border-white/5">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-1">Status</p>
                                    <Badge variant="primary" size="lg">{selectedLead.status}</Badge>
                                </Card>
                                <Card padding="md" className="bg-white dark:bg-card-dark shadow-sm border-gray-100 dark:border-white/5">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-1">Score IA</p>
                                    <div className="text-2xl font-bold text-primary">{selectedLead.ai_score || '-'}</div>
                                </Card>
                            </div>

                            {/* Timeline / Notes */}
                            <div className="space-y-4">
                                <h3 className="font-display font-bold text-gray-900 dark:text-white text-lg">Histórico & Notas</h3>
                                {selectedLead.notes ? (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/10 p-6 rounded-2xl border border-yellow-100 dark:border-yellow-900/20 text-sm text-yellow-800 dark:text-yellow-200 shadow-sm">
                                        {selectedLead.notes}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">Nenhuma nota registrada.</p>
                                )}

                                {/* Fake Timeline Items */}
                                <div className="relative pl-6 border-l-2 border-gray-100 dark:border-white/5 space-y-8 pt-2">
                                    <div className="relative">
                                        <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-white dark:ring-card-darker shadow-glow"></div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{format(new Date(selectedLead.created_at), 'dd MMM yyyy, HH:mm')}</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Lead capturado via {selectedLead.source || 'Website'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <Inbox size={32} strokeWidth={1.5} className="opacity-50" />
                            </div>
                            <h3 className="font-display font-bold text-xl mb-2 text-gray-900 dark:text-white">Selecione um Lead</h3>
                            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">Clique em um lead da lista ao lado para visualizar os detalhes completos.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
