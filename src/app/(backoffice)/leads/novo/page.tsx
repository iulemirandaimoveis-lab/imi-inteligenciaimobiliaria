'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
    CheckCircle,
    TrendingUp,
} from 'lucide-react'

// ⚠️ Opções reais Recife
const origens = [
    'Site IMI Atlantis',
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

export default function NovoLeadPage() {
    const router = useRouter()

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
        notes: '',
    })

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [score, setScore] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Auto-calculate lead score
    const calculateScore = () => {
        let totalScore = 0

        // Email válido: +2
        if (formData.email && formData.email.includes('@')) totalScore += 2

        // Telefone preenchido: +2
        if (formData.phone && formData.phone.length >= 14) totalScore += 2

        // Origem qualificada: +1
        if (['Site IMI Atlantis', 'Indicação', 'Google Ads'].includes(formData.origem)) totalScore += 1

        // Interesse específico: +2
        if (formData.interesse) totalScore += 2

        // Localização definida: +1
        if (formData.localizacao && formData.localizacao !== 'Outro') totalScore += 1

        // Orçamento: variável (3-10)
        const faixa = faixasOrcamento.find(f => f.label === formData.orcamento)
        if (faixa) totalScore += faixa.score

        setScore(Math.min(totalScore, 20))
    }

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))

        // Clear error on change
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }

        // Recalculate score
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

        // TODO: Integrar com Supabase
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Simular sucesso
        alert(`Lead criado com sucesso!\nScore: ${score}/20\nStatus: ${score >= 15 ? 'Quente' : score >= 10 ? 'Morno' : 'Frio'}`)
        router.push('/backoffice/leads')
    }

    const getScoreColor = () => {
        if (score >= 15) return 'text-green-700 bg-green-50 border-green-200'
        if (score >= 10) return 'text-orange-700 bg-orange-50 border-orange-200'
        return 'text-blue-700 bg-blue-50 border-blue-200'
    }

    const getScoreLabel = () => {
        if (score >= 15) return 'Quente 🔥'
        if (score >= 10) return 'Morno ⚡'
        return 'Frio ❄️'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Novo Lead</h1>
                        <p className="text-sm text-gray-600 mt-1">Cadastre um novo lead no sistema</p>
                    </div>
                </div>

                {/* Score Badge */}
                <div className={`px-6 py-3 rounded-xl border-2 ${getScoreColor()}`}>
                    <div className="flex items-center gap-3">
                        <Sparkles size={20} />
                        <div>
                            <p className="text-xs font-medium">Score de Qualificação</p>
                            <p className="text-2xl font-bold">{score}/20</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold">{getScoreLabel()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Dados Pessoais */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-6">Dados Pessoais</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Nome */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nome Completo *
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        placeholder="Ex: Maria Santos Silva"
                                        className={`w-full h-11 pl-10 pr-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                            }`}
                                    />
                                </div>
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle size={14} />
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email *
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        placeholder="email@exemplo.com"
                                        className={`w-full h-11 pl-10 pr-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                            }`}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle size={14} />
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Telefone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Telefone *
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
                                        placeholder="(81) 99999-9999"
                                        maxLength={15}
                                        className={`w-full h-11 pl-10 pr-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 ${errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                            }`}
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle size={14} />
                                        {errors.phone}
                                    </p>
                                )}
                            </div>

                            {/* CPF */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    CPF (opcional)
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        value={formData.cpf}
                                        onChange={(e) => handleChange('cpf', formatCPF(e.target.value))}
                                        placeholder="000.000.000-00"
                                        maxLength={14}
                                        className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Interesse */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-6">Interesse</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Origem */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Origem do Lead *
                                </label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <select
                                        value={formData.origem}
                                        onChange={(e) => handleChange('origem', e.target.value)}
                                        className={`w-full h-11 pl-10 pr-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white ${errors.origem ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                            }`}
                                    >
                                        <option value="">Selecione...</option>
                                        {origens.map(origem => (
                                            <option key={origem} value={origem}>{origem}</option>
                                        ))}
                                    </select>
                                </div>
                                {errors.origem && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle size={14} />
                                        {errors.origem}
                                    </p>
                                )}
                            </div>

                            {/* Tipo de Imóvel */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo de Imóvel
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <select
                                        value={formData.interesse}
                                        onChange={(e) => handleChange('interesse', e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Localização Preferida
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <select
                                        value={formData.localizacao}
                                        onChange={(e) => handleChange('localizacao', e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Faixa de Orçamento
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <select
                                        value={formData.orcamento}
                                        onChange={(e) => handleChange('orcamento', e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
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

                    {/* Observações */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-6">Observações</h2>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="Adicione informações relevantes sobre o lead..."
                            rows={6}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
                        />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 sticky top-6 space-y-6">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                            Resumo
                        </h3>

                        {/* Status Inicial */}
                        <div>
                            <p className="text-xs text-gray-600 mb-2">Status Inicial</p>
                            <div className="px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium border border-orange-200">
                                Pendente
                            </div>
                        </div>

                        {/* Score Breakdown */}
                        <div>
                            <p className="text-xs text-gray-600 mb-3">Fatores de Qualificação</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Email válido</span>
                                    <span className={formData.email.includes('@') ? 'text-green-600' : 'text-gray-400'}>
                                        {formData.email.includes('@') ? '+2' : '0'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Telefone</span>
                                    <span className={formData.phone.length >= 14 ? 'text-green-600' : 'text-gray-400'}>
                                        {formData.phone.length >= 14 ? '+2' : '0'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Origem qualificada</span>
                                    <span className={['Site IMI Atlantis', 'Indicação', 'Google Ads'].includes(formData.origem) ? 'text-green-600' : 'text-gray-400'}>
                                        {['Site IMI Atlantis', 'Indicação', 'Google Ads'].includes(formData.origem) ? '+1' : '0'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Interesse definido</span>
                                    <span className={formData.interesse ? 'text-green-600' : 'text-gray-400'}>
                                        {formData.interesse ? '+2' : '0'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Localização</span>
                                    <span className={formData.localizacao && formData.localizacao !== 'Outro' ? 'text-green-600' : 'text-gray-400'}>
                                        {formData.localizacao && formData.localizacao !== 'Outro' ? '+1' : '0'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Orçamento</span>
                                    <span className={formData.orcamento ? 'text-green-600' : 'text-gray-400'}>
                                        {formData.orcamento ? `+${faixasOrcamento.find(f => f.label === formData.orcamento)?.score || 0}` : '0'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <div className="flex gap-3">
                                <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-900">
                                    <p className="font-medium mb-1">Dica de Qualificação</p>
                                    <p className="text-blue-700">
                                        Leads com score acima de 15 têm 3x mais chances de conversão.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3 pt-4 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-11 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Criar Lead
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="w-full h-11 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
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
