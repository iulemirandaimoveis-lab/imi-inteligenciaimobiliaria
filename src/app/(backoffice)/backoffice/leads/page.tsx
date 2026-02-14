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
        <div className="flex flex-col h-[calc(100vh-theme(spacing.32))] gap-8">
            <div className="flex-none">
                <PageHeader
                    title="Central de Oportunidades"
                    description="Gestão integrada de leads e inteligência de capital."
                    breadcrumbs={[{ label: 'Leads' }]}
                    action={
                        <div className="flex items-center gap-4">
                            <Link href="/backoffice/leads/kanban">
                                <Button variant="outline" icon={<Columns size={18} />}>Pipeline Visual</Button>
                            </Link>
                            <Button icon={<Plus size={18} />}>Registrar Oportunidade</Button>
                        </div>
                    }
                />
            </div>

            <div className="flex-1 flex overflow-hidden bg-white dark:bg-[#0A0B0D] rounded-[40px] border border-imi-100 dark:border-white/5 shadow-2xl relative">
                {/* Sidebar Filters - Discrete Authority */}
                <aside className="w-80 border-r border-imi-50 dark:border-white/5 hidden lg:flex flex-col bg-imi-50/30 dark:bg-black/20 p-8">
                    <div className="mb-10">
                        <p className="text-[10px] font-black text-imi-400 uppercase tracking-[0.2em] mb-6 ml-2">Fluxos de Filtro</p>
                        <nav className="space-y-2">
                            <button onClick={() => setStatusFilter('all')} className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-xs font-bold transition-all ${statusFilter === 'all' ? 'bg-white dark:bg-white/5 text-imi-600 shadow-md border border-imi-100/50' : 'text-imi-400 hover:text-imi-600 hover:bg-white/50'}`}>
                                <span className="flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <Inbox size={18} strokeWidth={1.5} /> Todos os Ativos
                                </span>
                                <Badge size="sm" variant={statusFilter === 'all' ? 'primary' : 'default'} className="transition-all">{leads.length}</Badge>
                            </button>
                            <button onClick={() => setStatusFilter('new')} className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-xs font-bold transition-all ${statusFilter === 'new' ? 'bg-white dark:bg-white/5 text-imi-600 shadow-md border border-imi-100/50' : 'text-imi-400 hover:text-imi-600 hover:bg-white/50'}`}>
                                <span className="flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <Star size={18} strokeWidth={1.5} /> Recém Capturados
                                </span>
                                <Badge size="sm" variant={statusFilter === 'new' ? 'primary' : 'default'} className="transition-all">{leads.filter((l: any) => l.status === 'new').length}</Badge>
                            </button>
                        </nav>
                    </div>

                    <div className="mt-auto pt-8 border-t border-imi-100/50">
                        <div className="p-6 bg-imi-950 rounded-3xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-imi-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
                            <p className="text-[9px] font-bold text-imi-500 uppercase tracking-widest mb-3 relative z-10">Meta de Conversão</p>
                            <div className="text-2xl font-display font-bold text-white mb-3 relative z-10">64%</div>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative z-10">
                                <div className="h-full bg-imi-500 w-[64%]" />
                            </div>
                        </div>
                    </div>
                </aside>

                {/* List View - Refined Items */}
                <div className={`${selectedLeadId ? 'hidden md:flex' : 'flex'} flex-1 flex-col border-r border-imi-50 dark:border-white/5 min-w-0 bg-white`}>
                    <div className="p-8 border-b border-imi-50 sticky top-0 bg-white/80 dark:bg-[#0A0B0D]/80 backdrop-blur-md z-10">
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-imi-300 group-focus-within:text-imi-500 transition-colors" size={18} strokeWidth={1.5} />
                            <input
                                type="text"
                                placeholder="Consultar base estratégica..."
                                className="w-full h-12 pl-14 pr-6 bg-imi-50/50 dark:bg-white/5 border border-transparent rounded-[1.25rem] text-sm focus:outline-none focus:bg-white focus:border-imi-100 focus:shadow-sm placeholder-imi-300 text-imi-950 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                        {isLoading ? (
                            <div className="flex flex-col gap-4">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-24 bg-imi-50/50 rounded-3xl animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            filteredLeads.map((lead: any) => (
                                <div
                                    key={lead.id}
                                    onClick={() => setSelectedLeadId(lead.id)}
                                    className={`p-6 rounded-3xl cursor-pointer transition-all duration-300 border ${selectedLeadId === lead.id
                                        ? 'bg-white border-imi-100 shadow-xl shadow-imi-950/5 -translate-y-0.5'
                                        : 'bg-transparent border-transparent hover:bg-imi-50/50 hover:border-imi-50'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className={`text-sm font-bold tracking-tight ${selectedLeadId === lead.id ? 'text-imi-600' : 'text-imi-900 dark:text-white'}`}>{lead.name}</h4>
                                        <span className="text-[10px] text-imi-400 font-bold uppercase tracking-wider">{format(new Date(lead.created_at), 'dd MMM')}</span>
                                    </div>
                                    <p className="text-xs text-imi-500 dark:text-gray-400 truncate mb-4 font-medium">{lead.interest || 'Sem interesse definido'}</p>
                                    <div className="flex items-center gap-3">
                                        <Badge size="sm" variant={lead.status === 'new' ? 'primary' : 'outline'}>
                                            {lead.status === 'new' ? 'Novo' : lead.status}
                                        </Badge>
                                        {lead.ai_score && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-imi-50 text-[10px] font-black text-imi-600 border border-imi-100">
                                                SCORE {lead.ai_score}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        {filteredLeads.length === 0 && !isLoading && (
                            <div className="py-20 text-center">
                                <div className="w-16 h-16 bg-imi-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-imi-200">
                                    <Inbox size={32} strokeWidth={1} />
                                </div>
                                <p className="text-sm font-bold text-imi-400 uppercase tracking-widest">Nenhum Lead Encontrado</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail View - Cockpit Authority */}
                <div className={`${selectedLeadId ? 'flex' : 'hidden'} lg:flex flex-[1.6] flex-col bg-imi-50/20 dark:bg-black/40 overflow-y-auto custom-scrollbar relative`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(196,157,91,0.03),transparent_50%)] pointer-events-none" />

                    {selectedLead ? (
                        <div className="p-10 md:p-14 space-y-12 animate-in fade-in slide-in-from-right-8 duration-500 relative z-10">
                            {/* Detail Header */}
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                <div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 rounded-[2rem] bg-imi-950 text-white flex items-center justify-center text-xl font-display font-bold shadow-xl shadow-imi-950/20">
                                            {selectedLead.name.charAt(0)}
                                        </div>
                                        <div>
                                            <Badge variant="primary" size="sm" className="mb-2">LEAD QUALIFICADO</Badge>
                                            <h2 className="text-4xl font-display font-bold text-imi-950 dark:text-white tracking-tighter leading-tight">{selectedLead.name}</h2>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <a href={`mailto:${selectedLead.email}`} className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-white/5 rounded-2xl border border-imi-100 dark:border-white/5 text-sm font-bold text-imi-700 hover:border-imi-500 transition-all shadow-sm">
                                            <Mail size={16} className="text-imi-500" strokeWidth={1.5} /> {selectedLead.email}
                                        </a>
                                        <a href={`tel:${selectedLead.phone}`} className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-white/5 rounded-2xl border border-imi-100 dark:border-white/5 text-sm font-bold text-imi-700 hover:border-imi-500 transition-all shadow-sm">
                                            <Phone size={16} className="text-imi-500" strokeWidth={1.5} /> {selectedLead.phone}
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Button variant="secondary" onClick={() => setSelectedLeadId(null)} className="lg:hidden">Voltar</Button>
                                    <Button variant="primary">Gerenciar Leads</Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="bg-white rounded-3xl p-8 border border-imi-100 shadow-sm group hover:shadow-xl transition-all duration-500">
                                    <p className="text-[10px] text-imi-400 uppercase tracking-[0.2em] font-black mb-4">Status Atual</p>
                                    <Badge variant="primary" size="lg" className="w-full justify-start py-4 rounded-xl">{selectedLead.status}</Badge>
                                </div>
                                <div className="bg-white rounded-3xl p-8 border border-imi-100 shadow-sm group hover:shadow-xl transition-all duration-500">
                                    <p className="text-[10px] text-imi-400 uppercase tracking-[0.2em] font-black mb-4">Score de IA</p>
                                    <div className="flex items-end gap-3">
                                        <span className="text-4xl font-display font-bold text-imi-950 leading-none">{selectedLead.ai_score || '—'}</span>
                                        <span className="text-xs font-bold text-imi-400 uppercase pb-1">Pontos</span>
                                    </div>
                                </div>
                                <div className="bg-white rounded-3xl p-8 border border-imi-100 shadow-sm group hover:shadow-xl transition-all duration-500">
                                    <p className="text-[10px] text-imi-400 uppercase tracking-[0.2em] font-black mb-4">Interesse</p>
                                    <p className="text-base font-bold text-imi-950 leading-tight">{selectedLead.interest || 'Negociação Geral'}</p>
                                </div>
                            </div>

                            {/* Timeline / Notes */}
                            <div className="space-y-8 bg-white rounded-[40px] p-10 border border-imi-100 shadow-sm">
                                <h3 className="font-display font-bold text-imi-950 dark:text-white text-2xl tracking-tight">Dossiê & Histórico</h3>

                                <div className="space-y-6">
                                    <p className="text-[10px] font-black text-imi-400 uppercase tracking-[0.2em]">Notas Estratégicas</p>
                                    {selectedLead.notes ? (
                                        <div className="bg-imi-50 border-l-4 border-imi-500 p-8 rounded-r-3xl text-base font-medium text-imi-800 leading-relaxed italic">
                                            "{selectedLead.notes}"
                                        </div>
                                    ) : (
                                        <p className="text-sm text-imi-300 font-medium ml-4 italic">Nenhuma observação registrada neste dossiê.</p>
                                    )}
                                </div>

                                <div className="space-y-8 pt-8 border-t border-imi-50">
                                    <p className="text-[10px] font-black text-imi-400 uppercase tracking-[0.2em]">Linha do Tempo</p>
                                    <div className="relative pl-10 border-l-2 border-imi-100 space-y-12">
                                        <div className="relative">
                                            <div className="absolute -left-[51px] top-1 w-5 h-5 rounded-full bg-imi-500 border-4 border-white shadow-xl"></div>
                                            <p className="text-[10px] font-bold text-imi-400 uppercase tracking-widest mb-3">{format(new Date(selectedLead.created_at), 'dd MMM yyyy, HH:mm')}</p>
                                            <p className="text-lg font-bold text-imi-950">Evento: Captura de Oportunidade</p>
                                            <p className="text-sm text-imi-500 font-medium">Origem do contato via ecossistema {selectedLead.source || 'Privado'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-imi-400 p-12 text-center">
                            <div className="w-24 h-24 bg-white rounded-[2.5rem] border border-imi-100 shadow-sm flex items-center justify-center mb-10 text-imi-200">
                                <Inbox size={40} strokeWidth={1} />
                            </div>
                            <h3 className="font-display font-bold text-2xl mb-4 text-imi-950 dark:text-white tracking-tight">Configuração de Cockpit</h3>
                            <p className="text-base text-imi-500 max-w-sm font-medium leading-relaxed">Selecione um ativo na base de dados para iniciar a auditoria de detalhes e histórico.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
