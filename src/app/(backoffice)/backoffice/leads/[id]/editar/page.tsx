'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    MapPin,
    Building2,
    DollarSign,
    Tag,
    FileText,
    Save,
    Sparkles,
    AlertCircle,
    Loader2,
    TrendingUp,
    Briefcase,
    Users,
    Clock,
    MessageSquare,
} from 'lucide-react'

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    hover: 'var(--bo-hover)',
    accent: 'var(--bo-accent)',
}

// ⚠️ Opções reais Recife (mesmas do /novo)
const origens = [
    'Site IMI',
    'Instagram',
    'Facebook',
    'Google Ads',
    'Indicação',
    'WhatsApp',
    'Email Marketing',
    'Evento',
    'Telefone',
    'Outro',
]

const tiposImovel = [
    'Apartamento',
    'Casa',
    'Cobertura',
    'Studio',
    'Loft',
    'Terreno',
    'Comercial',
]

const localizacoes = [
    'Boa Viagem',
    'Pina',
    'Piedade',
    'Setúbal',
    'Candeias',
    'Imbiribeira',
    'Ipsep',
    'Recife Antigo',
    'Outro',
]

const faixasOrcamento = [
    { label: 'Até R$ 300k', min: 0, max: 300000, score: 3 },
    { label: 'R$ 300k - R$ 500k', min: 300000, max: 500000, score: 5 },
    { label: 'R$ 500k - R$ 800k', min: 500000, max: 800000, score: 7 },
    { label: 'R$ 800k - R$ 1.2M', min: 800000, max: 1200000, score: 8 },
    { label: 'Acima de R$ 1.2M', min: 1200000, max: 999999999, score: 10 },
]

const statusOptions = [
    { value: 'pendente', label: 'Pendente', color: 'orange' },
    { value: 'qualificado', label: 'Qualificado', color: 'blue' },
    { value: 'proposta', label: 'Proposta Enviada', color: 'purple' },
    { value: 'negociacao', label: 'Em Negociação', color: 'yellow' },
    { value: 'ganho', label: 'Ganho', color: 'green' },
    { value: 'perdido', label: 'Perdido', color: 'red' },
]

const supabase = createClient()

// Helper: convert budget_min/budget_max numbers to faixa label
function getBudgetLabel(budgetMin: number | null, budgetMax: number | null): string {
    if (!budgetMin && !budgetMax) return ''
    if (budgetMax && budgetMax <= 300000) return 'Até R$ 300k'
    if (budgetMin && budgetMin >= 300000 && budgetMax && budgetMax <= 500000) return 'R$ 300k - R$ 500k'
    if (budgetMin && budgetMin >= 500000 && budgetMax && budgetMax <= 800000) return 'R$ 500k - R$ 800k'
    if (budgetMin && budgetMin >= 800000 && budgetMax && budgetMax <= 1200000) return 'R$ 800k - R$ 1.2M'
    if (budgetMin && budgetMin >= 1200000) return 'Acima de R$ 1.2M'
    return ''
}

export default function EditarLeadPage() {
    const router = useRouter()
    const params = useParams()
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        cpf: '',
        origem: '',
        interesse: '',
        localizacao: '',
        orcamento: '',
        status: '',
        occupation: '',
        company: '',
        maritalStatus: '',
        children: '',
        preferredContact: '',
        bestTime: '',
        notes: '',
    })

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [score, setScore] = useState(0)

    // Load real lead data on mount
    useEffect(() => {
        async function fetchLead() {
            try {
                const { data, error } = await supabase
                    .from('leads')
                    .select('*')
                    .eq('id', params.id)
                    .single()

                if (error || !data) throw new Error('Lead não encontrado')

                setFormData({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    cpf: data.cpf || '',
                    origem: data.source || data.origin || '',
                    interesse: data.interest_type || '',
                    localizacao: data.interest_location || '',
                    orcamento: getBudgetLabel(data.budget_min ?? data.capital ?? null, data.budget_max ?? null),
                    status: data.status || '',
                    occupation: data.occupation || '',
                    company: data.company || '',
                    maritalStatus: data.marital_status || '',
                    children: data.children != null ? String(data.children) : '',
                    preferredContact: data.preferred_contact || '',
                    bestTime: data.best_time || '',
                    notes: data.notes || '',
                })
            } catch (err: any) {
                toast.error('Erro ao carregar lead')
                router.push('/backoffice/leads')
            } finally {
                setIsLoading(false)
            }
        }
        if (params.id) fetchLead()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id])

    // Auto-calculate lead score
    const calculateScore = () => {
        let totalScore = 0

        if (formData.email && formData.email.includes('@')) totalScore += 2
        if (formData.phone && formData.phone.length >= 14) totalScore += 2
        if (['Site IMI', 'Indicação', 'Google Ads'].includes(formData.origem)) totalScore += 1
        if (formData.interesse) totalScore += 2
        if (formData.localizacao && formData.localizacao !== 'Outro') totalScore += 1

        const faixa = faixasOrcamento.find(f => f.label === formData.orcamento)
        if (faixa) totalScore += faixa.score

        setScore(Math.min(totalScore, 20))
    }

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))

        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }

        setTimeout(calculateScore, 100)
    }

    // Máscaras
    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        if (numbers.length <= 11) {
            return numbers
                .replace(/^(\d{2})(\d)/g, '($1) $2')
                .replace(/(\d{5})(\d)/, '$1-$2')
        }
        return value
    }

    const formatCPF = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        return numbers
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }

    const validate = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório'
        if (!formData.email.trim()) newErrors.email = 'Email é obrigatório'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email inválido'
        }
        if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório'
        if (!formData.origem) newErrors.origem = 'Origem é obrigatória'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validate()) {
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch('/api/leads', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: params.id, ...formData }),
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Erro ao atualizar')

            router.push(`/backoffice/leads/${params.id}`)
        } catch (error) {
            console.error('Erro ao atualizar lead:', error)
            setIsSubmitting(false)
        }
    }

    const getScoreColor = () => {
        if (score >= 15) return 'text-green-400'
        if (score >= 10) return 'text-orange-400'
        return 'text-blue-400'
    }

    const getScoreLabel = () => {
        if (score >= 15) return 'Quente 🔥'
        if (score >= 10) return 'Morno ⚡'
        return 'Frio ❄️'
    }

    const inputStyle = {
        background: T.elevated,
        border: `1px solid ${T.border}`,
        color: T.text,
    }

    const inputErrorStyle = {
        background: T.elevated,
        border: '1px solid #ef4444',
        color: T.text,
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 size={48} className="animate-spin mx-auto mb-4" style={{ color: T.accent }} />
                    <p style={{ color: T.textMuted }}>Carregando dados do lead...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                        style={{ border: `1px solid ${T.border}` }}
                        onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                        <ArrowLeft size={20} style={{ color: T.text }} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: T.text }}>Editar Lead</h1>
                        <p className="text-sm mt-1" style={{ color: T.textMuted }}>{formData.name}</p>
                    </div>
                </div>

                {/* Score Badge */}
                <div className="px-6 py-3 rounded-xl" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-3">
                        <Sparkles size={20} style={{ color: T.accent }} />
                        <div>
                            <p className="text-xs font-medium" style={{ color: T.textMuted }}>Score de Qualificação</p>
                            <p className={`text-2xl font-bold ${getScoreColor()}`}>{score}/20</p>
                        </div>
                        <div className="text-right">
                            <p className={`text-sm font-bold ${getScoreColor()}`}>{getScoreLabel()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Dados Pessoais */}
                    <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <h2 className="text-lg font-bold mb-6" style={{ color: T.text }}>Dados Pessoais</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Nome */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                                    Nome Completo *
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                                        style={errors.name ? inputErrorStyle : inputStyle}
                                    />
                                </div>
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                                        <AlertCircle size={14} />
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                                    Email *
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                                        style={errors.email ? inputErrorStyle : inputStyle}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                                        <AlertCircle size={14} />
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Telefone */}
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                                    Telefone *
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
                                        maxLength={15}
                                        className="w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                                        style={errors.phone ? inputErrorStyle : inputStyle}
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                                        <AlertCircle size={14} />
                                        {errors.phone}
                                    </p>
                                )}
                            </div>

                            {/* CPF */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                                    CPF
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                                    <input
                                        type="text"
                                        value={formData.cpf}
                                        onChange={(e) => handleChange('cpf', formatCPF(e.target.value))}
                                        maxLength={14}
                                        className="w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            {/* Profissão */}
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                                    Profissão
                                </label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                                    <input
                                        type="text"
                                        value={formData.occupation}
                                        onChange={(e) => handleChange('occupation', e.target.value)}
                                        placeholder="Ex: Médica Cardiologista"
                                        className="w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            {/* Empresa */}
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                                    Empresa
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                                    <input
                                        type="text"
                                        value={formData.company}
                                        onChange={(e) => handleChange('company', e.target.value)}
                                        placeholder="Ex: Hospital Português"
                                        className="w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            {/* Estado Civil */}
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                                    Estado Civil
                                </label>
                                <select
                                    value={formData.maritalStatus}
                                    onChange={(e) => handleChange('maritalStatus', e.target.value)}
                                    className="w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                                    style={inputStyle}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Solteiro(a)">Solteiro(a)</option>
                                    <option value="Casado(a)">Casado(a)</option>
                                    <option value="Divorciado(a)">Divorciado(a)</option>
                                    <option value="Viúvo(a)">Viúvo(a)</option>
                                </select>
                            </div>

                            {/* Filhos */}
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                                    Número de Filhos
                                </label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.children}
                                        onChange={(e) => handleChange('children', e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Interesse */}
                    <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <h2 className="text-lg font-bold mb-6" style={{ color: T.text }}>Interesse</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Status */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                                    Status do Lead
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => handleChange('status', e.target.value)}
                                    className="w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                                    style={inputStyle}
                                >
                                    {statusOptions.map(status => (
                                        <option key={status.value} value={status.value}>{status.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Origem */}
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                                    Origem *
                                </label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                                    <select
                                        value={formData.origem}
                                        onChange={(e) => handleChange('origem', e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                                        style={errors.origem ? inputErrorStyle : inputStyle}
                                    >
                                        <option value="">Selecione...</option>
                                        {origens.map(origem => (
                                            <option key={origem} value={origem}>{origem}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Tipo de Imóvel */}
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                                    Tipo de Imóvel
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                                    <select
                                        value={formData.interesse}
                                        onChange={(e) => handleChange('interesse', e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                                        style={inputStyle}
                                    >
                                        <option value="">Selecione...</option>
                                        {tiposImovel.map(tipo => (
                                            <option key={tipo} value={tipo}>{tipo}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Localização */}
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                                    Localização
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                                    <select
                                        value={formData.localizacao}
                                        onChange={(e) => handleChange('localizacao', e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                                        style={inputStyle}
                                    >
                                        <option value="">Selecione...</option>
                                        {localizacoes.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Orçamento */}
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                                    Orçamento
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                                    <select
                                        value={formData.orcamento}
                                        onChange={(e) => handleChange('orcamento', e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                                        style={inputStyle}
                                    >
                                        <option value="">Selecione...</option>
                                        {faixasOrcamento.map(faixa => (
                                            <option key={faixa.label} value={faixa.label}>{faixa.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preferências de Contato */}
                    <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <h2 className="text-lg font-bold mb-6" style={{ color: T.text }}>Preferências de Contato</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                                    Canal Preferido
                                </label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                                    <select
                                        value={formData.preferredContact}
                                        onChange={(e) => handleChange('preferredContact', e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                                        style={inputStyle}
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="WhatsApp">WhatsApp</option>
                                        <option value="Telefone">Telefone</option>
                                        <option value="E-mail">E-mail</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                                    Melhor Horário
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                                    <select
                                        value={formData.bestTime}
                                        onChange={(e) => handleChange('bestTime', e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                                        style={inputStyle}
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Manhã (8h-12h)">Manhã (8h-12h)</option>
                                        <option value="Tarde (14h-17h)">Tarde (14h-17h)</option>
                                        <option value="Noite (18h-21h)">Noite (18h-21h)</option>
                                        <option value="Qualquer horário">Qualquer horário</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Observações */}
                    <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <h2 className="text-lg font-bold mb-6" style={{ color: T.text }}>Observações</h2>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="Adicione informações relevantes sobre o lead..."
                            rows={6}
                            className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68] resize-none"
                            style={inputStyle}
                        />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="rounded-2xl p-6 sticky top-6 space-y-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: T.text }}>
                            Alterações
                        </h3>

                        {/* Info */}
                        <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
                            <div className="flex gap-3">
                                <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-blue-300 mb-1">Histórico Preservado</p>
                                    <p className="text-blue-400">
                                        Todas as alterações são registradas na timeline do lead.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-11 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ background: 'var(--accent-500)' }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Salvar Alterações
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="w-full h-11 rounded-xl font-medium transition-colors"
                                style={{ border: `1px solid ${T.border}`, color: T.text }}
                                onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
