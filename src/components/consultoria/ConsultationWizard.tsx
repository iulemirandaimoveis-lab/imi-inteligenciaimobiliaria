'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Globe,
    Building2,
    Users,
    Shield,
    DollarSign,
    FileText,
    ArrowRight,
    CheckCircle,
    AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const supabase = createClient()

interface ConsultationFormData {
    // Cliente
    client_name: string
    client_email: string
    client_phone: string
    client_type: 'individual' | 'business' | 'family_office'

    // Perfil
    estimated_patrimony: string
    has_international_income: boolean
    occupation: string

    // Objetivos
    consultation_type: 'acquisition' | 'holding' | 'llc' | 'dubai' | 'succession' | 'governance' | 'full_structure'
    jurisdictions: string[] // Brasil, EUA, Dubai, Paraguai, Panama
    main_goal: string

    // Estruturação
    needs_lawyer: boolean
    needs_accountant: boolean
    needs_bpo: boolean

    // Timing
    urgency: 'immediate' | 'short_term' | 'medium_term' | 'long_term'
    budget_range: string

    // Detalhes
    message: string
    preferred_contact: 'email' | 'phone' | 'whatsapp' | 'meeting'
}

const INITIAL_FORM: ConsultationFormData = {
    client_name: '',
    client_email: '',
    client_phone: '',
    client_type: 'individual',
    estimated_patrimony: '',
    has_international_income: false,
    occupation: '',
    consultation_type: 'full_structure',
    jurisdictions: [],
    main_goal: '',
    needs_lawyer: false,
    needs_accountant: false,
    needs_bpo: false,
    urgency: 'medium_term',
    budget_range: '',
    message: '',
    preferred_contact: 'whatsapp'
}

const CONSULTATION_TYPES = [
    {
        value: 'acquisition',
        label: 'Aquisição Estratégica',
        description: 'Compra de imóvel internacional com estrutura jurídica',
        icon: Building2,
        color: 'blue'
    },
    {
        value: 'holding',
        label: 'Holding Patrimonial Brasil',
        description: 'Estruturação societária e planejamento tributário',
        icon: Shield,
        color: 'green'
    },
    {
        value: 'llc',
        label: 'LLC nos EUA',
        description: 'Constituição de empresa americana (Wyoming, Delaware)',
        icon: Globe,
        color: 'purple'
    },
    {
        value: 'dubai',
        label: 'Estrutura Dubai/UAE',
        description: 'Golden Visa e estruturação nos Emirados',
        icon: Globe,
        color: 'orange'
    },
    {
        value: 'succession',
        label: 'Planejamento Sucessório',
        description: 'Governança familiar e proteção patrimonial',
        icon: Users,
        color: 'pink'
    },
    {
        value: 'governance',
        label: 'Family Governance',
        description: 'Organização e gestão do patrimônio familiar',
        icon: FileText,
        color: 'indigo'
    },
    {
        value: 'full_structure',
        label: 'Arquitetura Completa',
        description: 'Estruturação patrimonial internacional integrada',
        icon: DollarSign,
        color: 'yellow'
    }
]

const JURISDICTIONS = [
    { value: 'brasil', label: 'Brasil 🇧🇷', description: 'Holding e planejamento local' },
    { value: 'usa', label: 'EUA 🇺🇸', description: 'LLC, renda passiva, green card' },
    { value: 'dubai', label: 'Dubai 🇦🇪', description: 'Golden Visa, free zones' },
    { value: 'paraguai', label: 'Paraguai 🇵🇾', description: 'Residência facilitada' },
    { value: 'panama', label: 'Panamá 🇵🇦', description: 'Estruturas offshore' }
]

export default function ConsultationWizard() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState<ConsultationFormData>(INITIAL_FORM)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleInputChange = (field: keyof ConsultationFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
    }

    const toggleJurisdiction = (jurisdiction: string) => {
        setFormData(prev => ({
            ...prev,
            jurisdictions: prev.jurisdictions.includes(jurisdiction)
                ? prev.jurisdictions.filter(j => j !== jurisdiction)
                : [...prev.jurisdictions, jurisdiction]
        }))
    }

    const validateStep = (currentStep: number): boolean => {
        const newErrors: Record<string, string> = {}

        if (currentStep === 1) {
            if (!formData.client_name.trim()) newErrors.client_name = 'Nome obrigatório'
            if (!formData.client_email.trim()) newErrors.client_email = 'E-mail obrigatório'
            if (!formData.client_phone.trim()) newErrors.client_phone = 'Telefone obrigatório'
        }

        if (currentStep === 2) {
            if (!formData.consultation_type) newErrors.consultation_type = 'Selecione um tipo'
            if (formData.jurisdictions.length === 0) newErrors.jurisdictions = 'Selecione ao menos uma jurisdição'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(prev => prev + 1)
        }
    }

    const handleSubmit = async () => {
        if (!validateStep(step)) return

        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('consultations')
                .insert({
                    ...formData,
                    status: 'pending',
                    created_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error

            toast.success('Solicitação enviada com sucesso!')
            toast.info('Entraremos em contato em até 24h')

            router.push(`/backoffice/consultations/${data.id}`)

        } catch (error: any) {
            console.error('Erro ao criar consultoria:', error)
            toast.error('Erro ao enviar solicitação')
        } finally {
            setLoading(false)
        }
    }

    const renderStep1 = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-imi-900 mb-2">Dados do Cliente</h2>
                <p className="text-imi-600">Informações básicas para início da consultoria</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-imi-700 mb-2">
                    Nome Completo *
                </label>
                <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => handleInputChange('client_name', e.target.value)}
                    className={`w-full h-12 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all ${errors.client_name ? 'border-red-300 focus:ring-red-200' : 'border-imi-200'
                        }`}
                    placeholder="Seu nome completo"
                />
                {errors.client_name && <p className="mt-1 text-sm text-red-600">{errors.client_name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-imi-700 mb-2">
                        E-mail *
                    </label>
                    <input
                        type="email"
                        value={formData.client_email}
                        onChange={(e) => handleInputChange('client_email', e.target.value)}
                        className={`w-full h-12 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all ${errors.client_email ? 'border-red-300 focus:ring-red-200' : 'border-imi-200'
                            }`}
                        placeholder="seu@email.com"
                    />
                    {errors.client_email && <p className="mt-1 text-sm text-red-600">{errors.client_email}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-imi-700 mb-2">
                        Telefone/WhatsApp *
                    </label>
                    <input
                        type="tel"
                        value={formData.client_phone}
                        onChange={(e) => handleInputChange('client_phone', e.target.value)}
                        className={`w-full h-12 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all ${errors.client_phone ? 'border-red-300 focus:ring-red-200' : 'border-imi-200'
                            }`}
                        placeholder="(00) 00000-0000"
                    />
                    {errors.client_phone && <p className="mt-1 text-sm text-red-600">{errors.client_phone}</p>}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-imi-700 mb-2">
                    Perfil do Cliente
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                        { value: 'individual', label: 'Pessoa Física' },
                        { value: 'business', label: 'Empresário' },
                        { value: 'family_office', label: 'Família Empresária' }
                    ].map((type) => (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => handleInputChange('client_type', type.value)}
                            className={`p-4 rounded-xl border-2 transition-all text-sm font-medium ${formData.client_type === type.value
                                    ? 'border-accent-500 bg-accent-50 text-accent-700'
                                    : 'border-imi-200 hover:border-accent-300'
                                }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-imi-700 mb-2">
                        Patrimônio Estimado
                    </label>
                    <select
                        value={formData.estimated_patrimony}
                        onChange={(e) => handleInputChange('estimated_patrimony', e.target.value)}
                        className="w-full h-12 px-4 border border-imi-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
                    >
                        <option value="">Selecione...</option>
                        <option value="500k-1m">R$ 500k - R$ 1M</option>
                        <option value="1m-3m">R$ 1M - R$ 3M</option>
                        <option value="3m-5m">R$ 3M - R$ 5M</option>
                        <option value="5m-10m">R$ 5M - R$ 10M</option>
                        <option value="10m+">Acima de R$ 10M</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-imi-700 mb-2">
                        Profissão/Ocupação
                    </label>
                    <input
                        type="text"
                        value={formData.occupation}
                        onChange={(e) => handleInputChange('occupation', e.target.value)}
                        className="w-full h-12 px-4 border border-imi-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                        placeholder="Ex: Médico, Empresário"
                    />
                </div>
            </div>

            <div>
                <label className="flex items-center gap-3 cursor-pointer p-4 border border-imi-100 rounded-xl hover:bg-imi-50 transition-colors">
                    <input
                        type="checkbox"
                        checked={formData.has_international_income}
                        onChange={(e) => handleInputChange('has_international_income', e.target.checked)}
                        className="w-5 h-5 text-accent-500 border-imi-300 rounded focus:ring-accent-500"
                    />
                    <span className="text-sm font-medium text-imi-700">
                        Possui renda ou ativos internacionais
                    </span>
                </label>
            </div>
        </div>
    )

    const renderStep2 = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-imi-900 mb-2">Tipo de Estruturação</h2>
                <p className="text-imi-600">Selecione o tipo de consultoria desejada</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CONSULTATION_TYPES.map((type) => {
                    const Icon = type.icon
                    const isSelected = formData.consultation_type === type.value

                    // Helper para cores dinâmicas (Tailwind precisa de classes completas ou safelist, 
                    // mas vamos usar estilo inline para simplicidade/garantia aqui ou classes fixas)
                    // Usando classes fixas baseadas na prop color seria o ideal se configurado no tailwind.config
                    // Vou usar classes padrão do Tailwind condicionalmente.

                    let bgClass = 'bg-gray-100 text-gray-600'
                    if (type.color === 'blue') bgClass = 'bg-blue-100 text-blue-600'
                    if (type.color === 'green') bgClass = 'bg-green-100 text-green-600'
                    if (type.color === 'purple') bgClass = 'bg-purple-100 text-purple-600'
                    if (type.color === 'orange') bgClass = 'bg-orange-100 text-orange-600'
                    if (type.color === 'pink') bgClass = 'bg-pink-100 text-pink-600'
                    if (type.color === 'indigo') bgClass = 'bg-indigo-100 text-indigo-600'
                    if (type.color === 'yellow') bgClass = 'bg-yellow-100 text-yellow-600'

                    if (isSelected) {
                        bgClass = 'bg-accent-500 text-white'
                    }

                    return (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => handleInputChange('consultation_type', type.value)}
                            className={`p-6 rounded-2xl border-2 transition-all text-left group ${isSelected
                                    ? 'border-accent-500 bg-accent-50 shadow-lg scale-[1.02]'
                                    : 'border-imi-200 hover:border-accent-300 hover:shadow-md'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${bgClass}`}>
                                    <Icon size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-imi-900 mb-1 group-hover:text-accent-600 transition-colors">{type.label}</h3>
                                    <p className="text-sm text-imi-600">{type.description}</p>
                                </div>
                                {isSelected && (
                                    <CheckCircle size={20} className="text-accent-500 flex-shrink-0" />
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>
            {errors.consultation_type && <p className="text-sm text-red-600 text-center">{errors.consultation_type}</p>}

            <div>
                <label className="block text-sm font-medium text-imi-700 mb-3">
                    Jurisdições de Interesse *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {JURISDICTIONS.map((jurisdiction) => {
                        const isSelected = formData.jurisdictions.includes(jurisdiction.value)

                        return (
                            <button
                                key={jurisdiction.value}
                                type="button"
                                onClick={() => toggleJurisdiction(jurisdiction.value)}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${isSelected
                                        ? 'border-accent-500 bg-accent-50'
                                        : 'border-imi-200 hover:border-accent-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-imi-900">{jurisdiction.label}</span>
                                    {isSelected && <CheckCircle size={16} className="text-accent-500" />}
                                </div>
                                <p className="text-xs text-imi-600">{jurisdiction.description}</p>
                            </button>
                        )
                    })}
                </div>
                {errors.jurisdictions && <p className="mt-2 text-sm text-red-600">{errors.jurisdictions}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-imi-700 mb-2">
                    Objetivo Principal
                </label>
                <textarea
                    value={formData.main_goal}
                    onChange={(e) => handleInputChange('main_goal', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-imi-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
                    placeholder="Descreva seu objetivo com a estruturação patrimonial..."
                />
            </div>
        </div>
    )

    const renderStep3 = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-imi-900 mb-2">Coordenação Multidisciplinar</h2>
                <p className="text-imi-600">Estrutura de apoio necessária</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                <div className="flex gap-3">
                    <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                        <p className="font-medium mb-2">Rede Técnica Coordenada pela IMI</p>
                        <p className="text-blue-600">
                            Coordenamos uma rede de especialistas certificados para garantir
                            compliance e eficiência em toda a estruturação.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <label className={`flex items-start gap-3 cursor-pointer p-4 border rounded-xl transition-all ${formData.needs_lawyer ? 'border-accent-500 bg-accent-50' : 'border-imi-200 hover:bg-imi-50'
                    }`}>
                    <input
                        type="checkbox"
                        checked={formData.needs_lawyer}
                        onChange={(e) => handleInputChange('needs_lawyer', e.target.checked)}
                        className="w-5 h-5 text-accent-500 border-imi-300 rounded focus:ring-accent-500 mt-0.5"
                    />
                    <div>
                        <span className="block font-medium text-imi-900">Advogado Tributarista Internacional</span>
                        <span className="text-sm text-imi-600">Estruturação jurídica e compliance</span>
                    </div>
                </label>

                <label className={`flex items-start gap-3 cursor-pointer p-4 border rounded-xl transition-all ${formData.needs_accountant ? 'border-accent-500 bg-accent-50' : 'border-imi-200 hover:bg-imi-50'
                    }`}>
                    <input
                        type="checkbox"
                        checked={formData.needs_accountant}
                        onChange={(e) => handleInputChange('needs_accountant', e.target.checked)}
                        className="w-5 h-5 text-accent-500 border-imi-300 rounded focus:ring-accent-500 mt-0.5"
                    />
                    <div>
                        <span className="block font-medium text-imi-900">Contador Especializado</span>
                        <span className="text-sm text-imi-600">Holdings, LLCs e operações internacionais</span>
                    </div>
                </label>

                <label className={`flex items-start gap-3 cursor-pointer p-4 border rounded-xl transition-all ${formData.needs_bpo ? 'border-accent-500 bg-accent-50' : 'border-imi-200 hover:bg-imi-50'
                    }`}>
                    <input
                        type="checkbox"
                        checked={formData.needs_bpo}
                        onChange={(e) => handleInputChange('needs_bpo', e.target.checked)}
                        className="w-5 h-5 text-accent-500 border-imi-300 rounded focus:ring-accent-500 mt-0.5"
                    />
                    <div>
                        <span className="block font-medium text-imi-900">BPO Financeiro</span>
                        <span className="text-sm text-imi-600">Consolidação e gestão patrimonial</span>
                    </div>
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-imi-700 mb-2">
                        Urgência
                    </label>
                    <select
                        value={formData.urgency}
                        onChange={(e) => handleInputChange('urgency', e.target.value as any)}
                        className="w-full h-12 px-4 border border-imi-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
                    >
                        <option value="immediate">Imediata ({'<'} 1 mês)</option>
                        <option value="short_term">Curto Prazo (1-3 meses)</option>
                        <option value="medium_term">Médio Prazo (3-6 meses)</option>
                        <option value="long_term">Longo Prazo ({'>'} 6 meses)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-imi-700 mb-2">
                        Orçamento Disponível
                    </label>
                    <select
                        value={formData.budget_range}
                        onChange={(e) => handleInputChange('budget_range', e.target.value)}
                        className="w-full h-12 px-4 border border-imi-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
                    >
                        <option value="">Selecione...</option>
                        <option value="10k-30k">R$ 10k - R$ 30k</option>
                        <option value="30k-50k">R$ 30k - R$ 50k</option>
                        <option value="50k-100k">R$ 50k - R$ 100k</option>
                        <option value="100k+">Acima de R$ 100k</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-imi-700 mb-2">
                    Forma de Contato Preferencial
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { value: 'whatsapp', label: 'WhatsApp' },
                        { value: 'phone', label: 'Telefone' },
                        { value: 'email', label: 'E-mail' },
                        { value: 'meeting', label: 'Reunião' }
                    ].map((contact) => (
                        <button
                            key={contact.value}
                            type="button"
                            onClick={() => handleInputChange('preferred_contact', contact.value)}
                            className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${formData.preferred_contact === contact.value
                                    ? 'border-accent-500 bg-accent-50 text-accent-700'
                                    : 'border-imi-200 hover:border-accent-300'
                                }`}
                        >
                            {contact.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-imi-700 mb-2">
                    Informações Adicionais
                </label>
                <textarea
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-imi-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
                    placeholder="Detalhes relevantes sobre sua situação..."
                />
            </div>
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto">
            {/* Progress */}
            <div className="mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${s === step
                                    ? 'bg-accent-500 text-white scale-110 shadow-lg shadow-accent-500/30'
                                    : s < step
                                        ? 'bg-green-500 text-white'
                                        : 'bg-imi-100 text-imi-400'
                                }`}>
                                {s < step ? <CheckCircle size={20} /> : s}
                            </div>
                            {s < 3 && (
                                <div className={`w-16 h-1 mx-2 transition-colors duration-500 ${s < step ? 'bg-green-500' : 'bg-imi-200'}`} />
                            )}
                        </div>
                    ))}
                </div>
                <div className="text-center text-sm text-imi-600 font-medium">
                    Passo {step} de 3
                </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl border border-imi-100 p-8 shadow-sm">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}

                {/* Navigation */}
                <div className="flex justify-between pt-8 border-t border-imi-100 mt-8">
                    {step > 1 ? (
                        <button
                            type="button"
                            onClick={() => setStep(prev => prev - 1)}
                            className="h-12 px-8 border border-imi-200 rounded-xl font-medium text-imi-700 hover:bg-imi-50 transition-colors"
                        >
                            ← Voltar
                        </button>
                    ) : <div />}

                    {step < 3 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="h-12 px-8 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 transition-colors flex items-center gap-2 shadow-lg shadow-accent-500/20"
                        >
                            Próximo
                            <ArrowRight size={20} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="h-12 px-8 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-green-500/20"
                        >
                            {loading ? 'Enviando...' : 'Solicitar Consultoria'}
                            {!loading && <CheckCircle size={20} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
