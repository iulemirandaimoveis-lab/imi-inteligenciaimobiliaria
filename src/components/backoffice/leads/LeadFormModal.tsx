'use client'

import { useState, useEffect } from 'react'
import { X, Save, User, Mail, Phone, DollarSign, Building2, Tag, Calendar, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const supabase = createClient()

interface LeadFormData {
    name: string
    email: string
    phone: string
    status: string
    source: string
    interest: string
    capital: number | null
    development_id: string | null
    message: string
    assigned_to: string | null
    tags: string[]
}

const INITIAL_FORM_DATA: LeadFormData = {
    name: '',
    email: '',
    phone: '',
    status: 'new',
    source: 'website',
    interest: '',
    capital: null,
    development_id: null,
    message: '',
    assigned_to: null,
    tags: []
}

const SOURCES = [
    { value: 'website', label: 'Website' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'phone', label: 'Telefone' },
    { value: 'email', label: 'E-mail' },
    { value: 'referral', label: 'Indicação' },
    { value: 'social', label: 'Redes Sociais' },
    { value: 'event', label: 'Evento' },
    { value: 'other', label: 'Outro' }
]

const INTERESTS = [
    { value: 'apartment_2q', label: 'Apartamento 2Q' },
    { value: 'apartment_3q', label: 'Apartamento 3Q' },
    { value: 'apartment_4q', label: 'Apartamento 4Q+' },
    { value: 'house', label: 'Casa' },
    { value: 'commercial', label: 'Comercial' },
    { value: 'land', label: 'Terreno' },
    { value: 'investment', label: 'Investimento' },
    { value: 'other', label: 'Outro' }
]

const TAGS = [
    'Alto Padrão',
    'Primeira Compra',
    'Investidor',
    'Urgente',
    'FGTS',
    'Financiamento',
    'À Vista',
    'Permuta'
]

interface LeadFormModalProps {
    leadId?: string
    initialStatus?: string
    onClose: () => void
    onSuccess: () => void
}

export default function LeadFormModal({ leadId, initialStatus, onClose, onSuccess }: LeadFormModalProps) {
    const [formData, setFormData] = useState<LeadFormData>({
        ...INITIAL_FORM_DATA,
        status: initialStatus || 'new'
    })
    const [loading, setLoading] = useState(false)
    const [developments, setDevelopments] = useState<any[]>([])
    const [brokers, setBrokers] = useState<any[]>([])
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        loadDependencies()
        if (leadId) {
            loadLead(leadId)
        }
    }, [leadId])

    const loadDependencies = async () => {
        // Carregar empreendimentos
        const { data: devs } = await supabase
            .from('developments')
            .select('id, name')
            .eq('status', 'published')
            .order('name')

        setDevelopments(devs || [])

        // Carregar corretores
        const { data: brokerData } = await supabase
            .from('brokers')
            .select('user_id, name')
            .eq('status', 'active')
            .order('name')

        setBrokers(brokerData || [])
    }

    const loadLead = async (id: string) => {
        setLoading(true)
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            toast.error('Erro ao carregar lead')
            onClose()
            return
        }

        if (data) {
            setFormData({
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                status: data.status || 'new',
                source: data.source || 'website',
                interest: data.interest || '',
                capital: data.capital || null,
                development_id: data.development_id || null,
                message: data.message || '',
                assigned_to: data.assigned_to || null,
                tags: data.tags || []
            })
        }

        setLoading(false)
    }

    const handleInputChange = (field: keyof LeadFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
    }

    const toggleTag = (tag: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }))
    }

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório'

        if (!formData.email.trim()) {
            newErrors.email = 'E-mail é obrigatório'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'E-mail inválido'
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Telefone é obrigatório'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const calculateScore = (): number => {
        let score = 50 // Base score

        // Capital disponível (+30 points)
        if (formData.capital) {
            if (formData.capital >= 1000000) score += 30
            else if (formData.capital >= 500000) score += 20
            else if (formData.capital >= 200000) score += 10
        }

        // Interesse específico (+10 points)
        if (formData.interest && formData.interest !== 'other') score += 10

        // Desenvolvimento específico (+10 points)
        if (formData.development_id) score += 10

        // Tags de qualidade
        if (formData.tags.includes('Alto Padrão')) score += 15
        if (formData.tags.includes('Urgente')) score += 10
        if (formData.tags.includes('À Vista')) score += 15

        return Math.min(100, score)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validate()) {
            toast.error('Por favor, corrija os erros no formulário')
            return
        }

        setLoading(true)

        try {
            const score = calculateScore()
            const dataToSave = {
                ...formData,
                score,
                updated_at: new Date().toISOString()
            }

            if (leadId) {
                // Atualizar
                const { error } = await supabase
                    .from('leads')
                    .update(dataToSave)
                    .eq('id', leadId)

                if (error) throw error
                toast.success('Lead atualizado com sucesso!')
            } else {
                // Criar
                const { error } = await supabase
                    .from('leads')
                    .insert({
                        ...dataToSave,
                        created_at: new Date().toISOString()
                    })

                if (error) throw error
                toast.success('Lead criado com sucesso!')
            }

            onSuccess()
        } catch (error: any) {
            console.error('Erro ao salvar lead:', error)
            toast.error(error.message || 'Erro ao salvar lead')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-card-dark rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-card-dark border-b border-gray-100 dark:border-white/5 px-6 py-4 flex items-center justify-between z-10">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {leadId ? <User size={20} className="text-primary" /> : <UserPlus size={20} className="text-primary" />}
                        {leadId ? 'Editar Lead' : 'Novo Lead'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Informações Básicas */}
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-2">
                            <User size={18} className="text-primary" />
                            Informações Básicas
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nome Completo *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className={`w-full h-12 px-4 border bg-gray-50 dark:bg-input-dark dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errors.name ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 dark:border-white/10'
                                        }`}
                                    placeholder="João Silva"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    E-mail *
                                </label>
                                <div className="relative">
                                    <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className={`w-full h-12 pl-12 pr-4 border bg-gray-50 dark:bg-input-dark dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errors.email ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 dark:border-white/10'
                                            }`}
                                        placeholder="joao@email.com"
                                    />
                                </div>
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Telefone *
                                </label>
                                <div className="relative">
                                    <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className={`w-full h-12 pl-12 pr-4 border bg-gray-50 dark:bg-input-dark dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errors.phone ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 dark:border-white/10'
                                            }`}
                                        placeholder="(81) 99999-8888"
                                    />
                                </div>
                                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Qualificação */}
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-2">
                            <DollarSign size={18} className="text-green-600" />
                            Qualificação
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Capital Disponível
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                                    <input
                                        type="number"
                                        value={formData.capital || ''}
                                        onChange={(e) => handleInputChange('capital', e.target.value ? parseFloat(e.target.value) : null)}
                                        className="w-full h-12 pl-10 pr-4 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-input-dark dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="500000"
                                        step="1000"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Interesse
                                </label>
                                <select
                                    value={formData.interest}
                                    onChange={(e) => handleInputChange('interest', e.target.value)}
                                    className="w-full h-12 px-4 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-input-dark dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                                >
                                    <option value="">Selecione...</option>
                                    {INTERESTS.map((interest) => (
                                        <option key={interest.value} value={interest.value}>
                                            {interest.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Empreendimento
                                </label>
                                <select
                                    value={formData.development_id || ''}
                                    onChange={(e) => handleInputChange('development_id', e.target.value || null)}
                                    className="w-full h-12 px-4 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-input-dark dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                                >
                                    <option value="">Nenhum específico</option>
                                    {developments.map((dev) => (
                                        <option key={dev.id} value={dev.id}>
                                            {dev.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Origem
                                </label>
                                <select
                                    value={formData.source}
                                    onChange={(e) => handleInputChange('source', e.target.value)}
                                    className="w-full h-12 px-4 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-input-dark dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                                >
                                    {SOURCES.map((source) => (
                                        <option key={source.value} value={source.value}>
                                            {source.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <Tag size={16} className="text-primary" />
                            Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${formData.tags.includes(tag)
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-primary/50'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Atribuição */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Atribuir a Corretor
                        </label>
                        <div className="relative">
                            <Building2 size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select
                                value={formData.assigned_to || ''}
                                onChange={(e) => handleInputChange('assigned_to', e.target.value || null)}
                                className="w-full h-12 pl-12 pr-4 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-input-dark dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                            >
                                <option value="">Não atribuído</option>
                                {brokers.map((broker) => (
                                    <option key={broker.user_id} value={broker.user_id}>
                                        {broker.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Mensagem */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Mensagem / Observações
                        </label>
                        <textarea
                            value={formData.message}
                            onChange={(e) => handleInputChange('message', e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-input-dark dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            placeholder="Observações sobre o lead..."
                        />
                    </div>

                    {/* Score Preview */}
                    <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-purple-700 dark:text-purple-400">
                                Score Estimado:
                            </span>
                            <span className="text-2xl font-black text-purple-700 dark:text-purple-400">
                                {calculateScore()}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-6 border-t border-gray-100 dark:border-white/5">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 h-12 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/25"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    {leadId ? 'Atualizar' : 'Criar'} Lead
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-12 px-8 border border-gray-200 dark:border-white/10 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
