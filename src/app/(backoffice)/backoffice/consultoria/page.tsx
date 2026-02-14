'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Plus, Edit, Trash2, CheckCircle, Clock, X,
    Calendar, Phone, Mail, User, MessageSquare,
    ChevronRight, Filter, Search, Ghost, UserCheck,
    CalendarDays
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Toast, { useToast } from '@/components/ui/Toast'

interface Consultation {
    id: string
    name: string
    email: string
    phone: string | null
    description: string | null
    status: string
    created_at: string
}

export default function ConsultationPage() {
    const supabase = createClient()
    const { toasts, showToast, removeToast } = useToast()
    const [consultations, setConsultations] = useState<Consultation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingConsultation, setEditingConsultation] = useState<Consultation | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [filterStatus, setFilterStatus] = useState<string>('all')

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        description: '',
        status: 'pending'
    })

    const fetchConsultations = useCallback(async () => {
        setIsLoading(true)
        try {
            let query = supabase
                .from('consultations')
                .select('*')
                .order('created_at', { ascending: false })

            if (filterStatus !== 'all') {
                query = query.eq('status', filterStatus)
            }

            const { data, error } = await query
            if (error) throw error
            setConsultations(data || [])
        } catch (err: any) {
            showToast('Erro ao carregar consultorias', 'error')
        } finally {
            setIsLoading(false)
        }
    }, [supabase, filterStatus, showToast])

    useEffect(() => {
        fetchConsultations()
    }, [fetchConsultations])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!formData.name || !formData.email) { showToast('Nome e Email são obrigatórios', 'error'); return }

        setIsSaving(true)
        try {
            if (editingConsultation) {
                const { error } = await supabase.from('consultations').update(formData).eq('id', editingConsultation.id)
                if (error) throw error
                showToast('Consultoria atualizada', 'success')
            } else {
                const { error } = await supabase.from('consultations').insert([formData])
                if (error) throw error
                showToast('Consultoria agendada', 'success')
            }

            setIsModalOpen(false)
            resetForm()
            fetchConsultations()
        } catch (err: any) {
            showToast(err.message || 'Erro ao salvar', 'error')
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Excluir este agendamento?')) return
        try {
            const { error } = await supabase.from('consultations').delete().eq('id', id)
            if (error) throw error
            showToast('Removido com sucesso', 'success')
            fetchConsultations()
        } catch (err: any) {
            showToast('Erro ao excluir', 'error')
        }
    }

    function resetForm() {
        setFormData({ name: '', email: '', phone: '', description: '', status: 'pending' })
        setEditingConsultation(null)
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6 p-8 h-[60vh] justify-center items-center">
                <div className="w-10 h-10 border-4 border-imi-100 border-t-accent-500 rounded-full animate-spin" />
                <p className="text-imi-300 font-bold uppercase tracking-widest text-xs">Acessando Agenda...</p>
            </div>
        )
    }

    return (
        <div className="space-y-10 pb-20">
            {toasts.map(toast => (
                <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
            ))}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <span className="text-[10px] font-black text-imi-400 uppercase tracking-[0.3em]">Gestão de Atendimento</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-imi-900 font-display tracking-tight">
                        Agenda & <span className="text-accent-500">Consultoria</span>
                    </h1>
                </div>

                <div className="flex gap-3">
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="h-14 px-8 bg-imi-900 text-white rounded-2xl shadow-elevated group active:scale-95 transition-all">
                        <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform" />
                        Novo Agendamento
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
                {['all', 'pending', 'scheduled', 'completed', 'cancelled'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status
                            ? 'bg-imi-900 text-white shadow-soft scale-105'
                            : 'bg-white border border-imi-100 text-imi-400 hover:bg-imi-50'
                            }`}
                    >
                        {status === 'all' ? 'Todos' : status}
                    </button>
                ))}
            </div>

            {/* List */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 gap-6"
            >
                {consultations.length === 0 ? (
                    <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-imi-100">
                        <Ghost className="mx-auto text-imi-100 mb-6" size={64} />
                        <p className="text-imi-400 font-medium tracking-wide">Nenhum atendimento agendado nesta categoria.</p>
                    </div>
                ) : (
                    consultations.map((item) => (
                        <motion.div
                            key={item.id}
                            variants={itemVariants}
                            className="bg-white rounded-[2.5rem] p-10 border border-imi-100 shadow-soft hover:shadow-card-hover transition-all duration-500 group flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8"
                        >
                            <div className="flex items-center gap-6 flex-1">
                                <div className="w-20 h-20 bg-imi-50 rounded-3xl flex items-center justify-center text-imi-900 group-hover:bg-imi-900 group-hover:text-white transition-all duration-500">
                                    <User size={32} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-2xl font-bold text-imi-900">{item.name}</h3>
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-imi-100 text-imi-900'}`}>{item.status}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-xs font-medium text-imi-400 italic">
                                        <span className="flex items-center gap-2"><Mail size={14} /> {item.email}</span>
                                        {item.phone && <span className="flex items-center gap-2"><Phone size={14} /> {item.phone}</span>}
                                        <span className="flex items-center gap-2"><CalendarDays size={14} /> {new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 lg:max-w-md">
                                <p className="text-sm text-imi-500 line-clamp-2 leading-relaxed bg-imi-50/50 p-4 rounded-2xl border border-imi-50 italic">
                                    {item.description || 'Sem observações adicionais.'}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => { setEditingConsultation(item); setFormData({ name: item.name, email: item.email, phone: item.phone || '', description: item.description || '', status: item.status }); setIsModalOpen(true); }} className="w-12 h-12 rounded-2xl bg-imi-50 flex items-center justify-center text-imi-400 hover:text-imi-900 transition-all border border-transparent hover:border-imi-100">
                                    <Edit size={20} />
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-300 hover:text-red-600 transition-all border border-transparent hover:border-red-100">
                                    <Trash2 size={20} />
                                </button>
                                <button className="w-14 h-12 rounded-2xl bg-imi-900 text-white flex items-center justify-center hover:bg-accent-500 hover:text-imi-900 transition-all shadow-soft">
                                    <ChevronRight size={24} />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </motion.div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-imi-900/40 backdrop-blur-md z-50 flex items-center justify-end p-0 sm:p-4 overflow-hidden">
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="bg-white w-full max-w-2xl h-full shadow-2xl overflow-y-auto"
                        >
                            <div className="p-12 space-y-10">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-3xl font-bold text-imi-900 font-display">Registrar Atendimento</h2>
                                    <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-2xl bg-imi-50 flex items-center justify-center text-imi-400">
                                        <X size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="space-y-6">
                                        <Input label="Nome Completo *" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: Roberto Carlos" className="h-14 rounded-2xl border-imi-100" />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input label="Email *" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="email@dominio.com" className="h-14 rounded-2xl border-imi-100" />
                                            <Input label="WhatsApp" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="(00) 00000-0000" className="h-14 rounded-2xl border-imi-100" />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-imi-400 uppercase tracking-widest block">Status do Lead</label>
                                            <select value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full h-14 bg-white border border-imi-100 rounded-2xl px-6 outline-none focus:ring-2 focus:ring-accent-500/20 transition-all font-bold text-sm">
                                                <option value="pending">Pendente</option>
                                                <option value="scheduled">Agendado</option>
                                                <option value="completed">Concluído</option>
                                                <option value="cancelled">Cancelado</option>
                                            </select>
                                        </div>

                                        <Textarea label="Descrição do Interesse" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={6} className="rounded-3xl border-imi-100 p-8 text-lg" placeholder="Detalhes da consultoria ou serviço desejado..." />
                                    </div>

                                    <div className="pt-10">
                                        <Button type="submit" disabled={isSaving} className="w-full h-16 bg-imi-900 text-white rounded-3xl shadow-elevated font-black text-xs uppercase tracking-widest hover:bg-accent-500 hover:text-imi-900 transition-all">
                                            {isSaving ? 'Processando...' : 'Confirmar Agendamento'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
