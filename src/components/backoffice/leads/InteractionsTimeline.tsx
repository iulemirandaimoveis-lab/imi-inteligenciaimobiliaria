'use client'

import React, { useState, useEffect } from 'react'
import {
    Plus,
    Phone,
    Mail,
    MessageSquare,
    Calendar,
    FileText,
    CheckCircle,
    Clock,
    User,
    Save,
    X,
    History
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const supabase = createClient()

interface Interaction {
    id: string
    lead_id: string
    type: 'call' | 'email' | 'whatsapp' | 'visit' | 'meeting' | 'note'
    title: string
    description: string
    outcome: string | null
    next_action: string | null
    next_action_date: string | null
    created_by: string
    created_at: string
    user?: {
        name: string
    }
}

const INTERACTION_TYPES = [
    { value: 'call', label: 'Ligação', icon: Phone, color: 'text-blue-600', bg: 'bg-blue-50', borderColor: 'border-blue-200' },
    { value: 'email', label: 'E-mail', icon: Mail, color: 'text-purple-600', bg: 'bg-purple-50', borderColor: 'border-purple-200' },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-50', borderColor: 'border-green-200' },
    { value: 'visit', label: 'Visita', icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50', borderColor: 'border-orange-200' },
    { value: 'meeting', label: 'Reunião', icon: User, color: 'text-pink-600', bg: 'bg-pink-50', borderColor: 'border-pink-200' },
    { value: 'note', label: 'Anotação', icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50', borderColor: 'border-gray-200' }
]

interface InteractionsTimelineProps {
    leadId: string
}

export default function InteractionsTimeline({ leadId }: InteractionsTimelineProps) {
    const [interactions, setInteractions] = useState<Interaction[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        type: 'call' as const,
        title: '',
        description: '',
        outcome: '',
        next_action: '',
        next_action_date: ''
    })

    useEffect(() => {
        loadInteractions()
    }, [leadId])

    const loadInteractions = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('lead_interactions')
            .select(`
        *,
        user:created_by (
            raw_user_meta_data
        )
      `) // Ajuste para buscar nome do usuário se profile não estiver configurado, ou view
        // Fallback para auth.users se view não acessível diretamente, mas idealmente seria profiles
        // Como a query original usava auth.users(name) que não é padrão no supabase-js client diretamente (precisa de view)
        // Vou simplificar assumindo que o hook traz os dados ou ajustaremos conforme a estrutura real.
        // Tentativa segura:

        //   .select(`*, user:profiles(name)`) // Se profiles existir

        // Por enquanto, usando uma query simples e tratando o user no frontend se necessário
        // Mas para manter a compatibilidade com o request original que pedia `user:auth.users(name)`:
        // O Supabase não permite join direto com auth.users via client a menos que existam FKs e views públicas.
        // Vou usar uma query padrão e tentar buscar o nome se possível, ou usar um placeholder.

        const { data: interactionsData, error: interactionsError } = await supabase
            .from('lead_interactions')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false })

        if (interactionsError) {
            console.error('Error loading interactions:', interactionsError)
        } else {
            // Tentar enriquecer com dados de usuário se possível
            // Por simplicidade e segurança, vamos focar nos dados da interação
            setInteractions(interactionsData || [])
        }
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.title.trim() || !formData.description.trim()) {
            toast.error('Preencha título e descrição')
            return
        }

        setIsSubmitting(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            toast.error('Usuário não autenticado')
            setIsSubmitting(false)
            return
        }

        const { error } = await supabase
            .from('lead_interactions')
            .insert({
                lead_id: leadId,
                ...formData,
                next_action_date: formData.next_action_date || null, // Garantir null se vazio
                created_by: user.id,
                created_at: new Date().toISOString()
            })

        if (error) {
            console.error('Error creating interaction:', error)
            toast.error('Erro ao criar interação')
        } else {
            toast.success('Interação registrada!')
            setShowForm(false)
            setFormData({
                type: 'call',
                title: '',
                description: '',
                outcome: '',
                next_action: '',
                next_action_date: ''
            })
            loadInteractions()
        }
        setIsSubmitting(false)
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Carregando histórico...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <History size={20} className="text-primary" />
                    Histórico de Interações
                </h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={`h-10 px-4 rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm ${showForm
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300'
                            : 'bg-primary text-white hover:bg-primary-dark hover:shadow-primary/25'
                        }`}
                >
                    {showForm ? <X size={16} /> : <Plus size={16} />}
                    {showForm ? 'Cancelar' : 'Nova Interação'}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-6 space-y-4 shadow-sm animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tipo *
                            </label>
                            <div className="relative">
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    className="w-full h-12 px-4 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-input-dark dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                                >
                                    {INTERACTION_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    {/* Ícone do tipo selecionado */}
                                    {INTERACTION_TYPES.find(t => t.value === formData.type)?.icon({ size: 18, className: 'text-gray-500' })}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Título *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full h-12 px-4 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-input-dark dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Ex: Primeira ligação"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Descrição *
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-input-dark dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            placeholder="Detalhe a interação..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Resultado
                            </label>
                            <input
                                type="text"
                                value={formData.outcome}
                                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                                className="w-full h-12 px-4 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-input-dark dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Ex: Cliente interessado"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Próxima Ação
                            </label>
                            <input
                                type="text"
                                value={formData.next_action}
                                onChange={(e) => setFormData({ ...formData, next_action: e.target.value })}
                                className="w-full h-12 px-4 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-input-dark dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Ex: Agendar visita"
                            />
                        </div>
                    </div>

                    {formData.next_action && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Data da Próxima Ação
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.next_action_date}
                                onChange={(e) => setFormData({ ...formData, next_action_date: e.target.value })}
                                className="w-full h-12 px-4 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-input-dark dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 h-12 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save size={20} />
                            )}
                            Registrar Interação
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="h-12 px-6 border border-gray-200 dark:border-white/10 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Timeline */}
            <div className="space-y-4">
                {interactions.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <Clock size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Nenhuma interação registrada</h4>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">Registre o primeiro contato para iniciar o histórico deste lead.</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center gap-2 h-12 px-6 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-lg hover:shadow-primary/25"
                        >
                            <Plus size={20} />
                            Primeira Interação
                        </button>
                    </div>
                ) : (
                    <div className="relative pt-2">
                        {/* Timeline Line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-white/10" />

                        {interactions.map((interaction, index) => {
                            const typeConfig = INTERACTION_TYPES.find(t => t.value === interaction.type) || INTERACTION_TYPES[5]
                            const Icon = typeConfig.icon

                            return (
                                <div key={interaction.id} className="relative pl-16 pb-8 group">
                                    {/* Icon */}
                                    <div className={`absolute left-0 w-12 h-12 rounded-full ${typeConfig.bg} dark:bg-opacity-20 flex items-center justify-center border-4 border-white dark:border-background-dark z-10 shadow-sm`}>
                                        <Icon size={20} className={typeConfig.color} />
                                    </div>

                                    {/* Content */}
                                    <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-100 dark:border-white/5 p-6 hover:shadow-md transition-shadow relative">
                                        {/* Seta indicativa */}
                                        <div className="absolute top-6 -left-2 w-4 h-4 bg-white dark:bg-card-dark border-b border-l border-gray-100 dark:border-white/5 transform rotate-45"></div>

                                        <div className="flex items-start justify-between mb-3 relative z-10">
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white text-lg">{interaction.title}</h4>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <User size={12} />
                                                        {interaction.user?.name || 'Usuário'}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {formatDistanceToNow(new Date(interaction.created_at), {
                                                            addSuffix: true,
                                                            locale: ptBR
                                                        })}
                                                    </span>
                                                    <span className="hidden sm:inline opacity-50">
                                                        ({format(new Date(interaction.created_at), 'dd/MM/yyyy HH:mm')})
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${typeConfig.bg} ${typeConfig.color} dark:bg-opacity-10 border ${typeConfig.borderColor} dark:border-opacity-20`}>
                                                {typeConfig.label}
                                            </span>
                                        </div>

                                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 whitespace-pre-wrap leading-relaxed">
                                            {interaction.description}
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {interaction.outcome && (
                                                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-green-700 dark:text-green-400 mb-1 uppercase tracking-wide">
                                                        <CheckCircle size={14} />
                                                        Resultado
                                                    </div>
                                                    <p className="text-sm text-green-800 dark:text-green-300 font-medium">{interaction.outcome}</p>
                                                </div>
                                            )}

                                            {interaction.next_action && (
                                                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-400 mb-1 uppercase tracking-wide">
                                                        <Calendar size={14} />
                                                        Próxima Ação
                                                    </div>
                                                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">{interaction.next_action}</p>
                                                    {interaction.next_action_date && (
                                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {format(new Date(interaction.next_action_date), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
