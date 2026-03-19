'use client'

import React, { useState } from 'react'
import { Plus, Trash2, Calendar, MessageSquare, History, Tag, ArrowRight } from 'lucide-react'
import { usePropertyEvents, createPropertyEvent, deletePropertyEvent } from '../hooks/useDetails'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PropertyEventsProps {
    propertyId: string
}

export default function PropertyEvents({ propertyId }: PropertyEventsProps) {
    const { events, isLoading, mutate } = usePropertyEvents(propertyId)
    const { showToast } = useToast()
    const [isAdding, setIsAdding] = useState(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [formData, setFormData] = useState<Record<string, any>>({
        title: '',
        description: '',
        event_type: 'atualizado',
        event_date: new Date().toISOString().split('T')[0]
    })

    async function handleAdd() {
        if (!formData.title) {
            showToast('Título é obrigatório', 'error')
            return
        }
        try {
            await createPropertyEvent({ ...formData, property_id: propertyId })
            showToast('Evento registrado na timeline do ativo', 'success')
            setIsAdding(false)
            setFormData({ title: '', description: '', event_type: 'atualizado', event_date: new Date().toISOString().split('T')[0] })
            mutate()
        } catch (err: unknown) {
            showToast((err instanceof Error ? err.message : 'Erro desconhecido') || 'Erro ao registrar evento', 'error')
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Deseja remover este registro da história do ativo?')) return
        try {
            await deletePropertyEvent(id)
            showToast('Evento removido', 'success')
            mutate()
        } catch (err: unknown) {
            showToast((err instanceof Error ? err.message : 'Erro desconhecido') || 'Erro ao remover evento', 'error')
        }
    }

    if (isLoading) return <div className="p-12 text-center animate-pulse text-slate-400">Carregando timeline...</div>

    return (
        <div className="max-w-4xl mx-auto py-6">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h2 className="text-xl font-bold text-imi-900 tracking-tight">Timeline do Ativo</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Histórico Técnico e Comercial</p>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Registrar Evento
                    </Button>
                )}
            </div>

            {isAdding && (
                <div className="mb-12 p-8 bg-slate-50 rounded-3xl border border-slate-100 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-imi-900 rounded-lg flex items-center justify-center">
                            <Plus className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-sm font-black text-imi-900 uppercase tracking-widest">Novo Protocolo</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Título do Acontecimento</label>
                            <input
                                className="w-full h-12 px-4 rounded-xl border border-white bg-white shadow-soft focus:ring-2 focus:ring-imi-500 transition-all font-bold text-imi-900"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ex: Lançamento oficial da Torre B"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Tipo de Registro</label>
                            <select
                                className="w-full h-12 px-4 rounded-xl border border-white bg-white shadow-soft font-bold text-xs"
                                value={formData.event_type}
                                onChange={e => setFormData({ ...formData, event_type: e.target.value })}
                            >
                                <option value="atualizado">⚙️ Atualização Técnica</option>
                                <option value="publicado">🚀 Publicação</option>
                                <option value="campanha_iniciada">📈 Início de Campanha</option>
                                <option value="ajuste_preco">💰 Ajuste de Valor</option>
                                <option value="vendido">🤝 Ativo Vendido</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Data</label>
                            <input
                                type="date"
                                className="w-full h-12 px-4 rounded-xl border border-white bg-white shadow-soft font-bold text-xs"
                                value={formData.event_date}
                                onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Relato Detalhado (Opcional)</label>
                            <textarea
                                className="w-full p-4 rounded-xl border border-white bg-white shadow-soft min-h-[100px] text-sm"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <Button onClick={handleAdd} className="flex-1">Persistir Protocolo</Button>
                        <Button onClick={() => setIsAdding(false)} variant="outline" className="flex-1">Cancelar</Button>
                    </div>
                </div>
            )}

            <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {events.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-100">
                        <History className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold text-sm">Este ativo ainda não possui histórico registrado.</p>
                    </div>
                ) : (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    events.map((event: any, index: number) => (
                        <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            {/* Dot */}
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 group-hover:bg-imi-900 group-hover:scale-110 transition-all duration-300 shadow-sm z-10 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                <Tag className="w-4 h-4 text-slate-400 group-hover:text-white" />
                            </div>

                            {/* Card */}
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-3xl border border-slate-100 shadow-soft hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <time className="text-[10px] font-black text-imi-500 uppercase tracking-widest">{format(new Date(event.event_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}</time>
                                    <button onClick={() => handleDelete(event.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-100 hover:text-red-600 transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2 py-0.5 bg-slate-50 text-[9px] font-black text-slate-400 rounded uppercase tracking-tighter border border-slate-100">{event.event_type}</span>
                                    <ArrowRight className="w-3 h-3 text-slate-200" />
                                    <h3 className="font-bold text-imi-900 tracking-tight">{event.title}</h3>
                                </div>
                                {event.description && (
                                    <p className="text-slate-500 text-xs leading-relaxed font-medium">
                                        {event.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
