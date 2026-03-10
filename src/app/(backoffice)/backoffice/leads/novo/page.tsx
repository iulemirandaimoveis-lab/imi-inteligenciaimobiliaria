'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'

const origens = [
    'Site IMI', 'Instagram', 'Facebook', 'Google Ads',
    'Indicação', 'WhatsApp', 'Email Marketing', 'Evento', 'Telefone', 'Outro',
]

const tiposImovel = [
    'Apartamento', 'Casa', 'Cobertura', 'Studio', 'Loft', 'Terreno', 'Comercial',
]

const localizacoes = [
    'Boa Viagem', 'Pina', 'Piedade', 'Setúbal', 'Candeias',
    'Imbiribeira', 'Ipsep', 'Recife Antigo', 'Outro',
]

const faixasOrcamento = [
    { label: 'Até R$ 300k', min: 0, max: 300000, score: 3 },
    { label: 'R$ 300k - R$ 500k', min: 300000, max: 500000, score: 5 },
    { label: 'R$ 500k - R$ 800k', min: 500000, max: 800000, score: 7 },
    { label: 'R$ 800k - R$ 1.2M', min: 800000, max: 1200000, score: 8 },
    { label: 'Acima de R$ 1.2M', min: 1200000, max: 999999999, score: 10 },
]

const inputStyle: React.CSSProperties = {
    background: T.elevated,
    border: `1px solid ${T.border}`,
    color: T.text,
    width: '100%',
    height: '44px',
    borderRadius: '12px',
    padding: '0 14px 0 42px',
    fontSize: '14px',
    outline: 'none',
}

const inputStyleNoIcon: React.CSSProperties = {
    ...inputStyle,
    padding: '0 14px',
}

export default function NovoLeadPage() {
    const router = useRouter()

    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', cpf: '',
        origem: '', interesse: '', localizacao: '', orcamento: '', notes: '',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [score, setScore] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const calculateScore = (data = formData) => {
        let totalScore = 0
        if (data.email && data.email.includes('@')) totalScore += 2
        if (data.phone && data.phone.length >= 14) totalScore += 2
        if (['Site IMI', 'Indicação', 'Google Ads'].includes(data.origem)) totalScore += 1
        if (data.interesse) totalScore += 2
        if (data.localizacao && data.localizacao !== 'Outro') totalScore += 1
        const faixa = faixasOrcamento.find(f => f.label === data.orcamento)
        if (faixa) totalScore += faixa.score
        setScore(Math.min(totalScore, 20))
    }

    const handleChange = (field: string, value: string) => {
        const updated = { ...formData, [field]: value }
        setFormData(updated)
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
        setTimeout(() => calculateScore(updated), 50)
    }

    const formatPhone = (value: string) => {
        const n = value.replace(/\D/g, '')
        if (n.length <= 11) return n.replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
        return value
    }

    const formatCPF = (value: string) => {
        const n = value.replace(/\D/g, '')
        return n.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }

    const validate = () => {
        const newErrors: Record<string, string> = {}
        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório'
        if (!formData.email.trim()) newErrors.email = 'Email é obrigatório'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email inválido'
        if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório'
        if (!formData.origem) newErrors.origem = 'Origem é obrigatória'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return
        setIsSubmitting(true)
        try {
            const orcamentoFaixa = faixasOrcamento.find(f => f.label === formData.orcamento)
            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name, email: formData.email, phone: formData.phone,
                    source: formData.origem, interesse: formData.interesse,
                    localizacao: formData.localizacao,
                    budget_min: orcamentoFaixa?.min ?? null,
                    budget_max: orcamentoFaixa?.max != null && orcamentoFaixa.max < 999999999 ? orcamentoFaixa.max : null,
                    notes: formData.notes,
                    ai_score: score,
                }),
            })
            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || 'Falha ao salvar lead')
            }
            toast.success(`Lead criado! Score: ${score}/20 — ${getScoreLabel()}`)
            router.push('/backoffice/leads')
        } catch (e: any) {
            toast.error('Não foi possível cadastrar o lead. ' + e.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const getScoreColor = (): React.CSSProperties => {
        if (score >= 15) return { background: 'rgba(34,197,94,0.12)', border: '1.5px solid rgba(34,197,94,0.35)', color: '#4ADE80' }
        if (score >= 10) return { background: 'rgba(245,158,11,0.12)', border: '1.5px solid rgba(245,158,11,0.35)', color: '#FCD34D' }
        return { background: 'rgba(72,101,129,0.12)', border: '1.5px solid rgba(72,101,129,0.3)', color: '#7EA8CC' }
    }

    const getScoreLabel = () => {
        if (score >= 15) return 'Quente 🔥'
        if (score >= 10) return 'Morno ⚡'
        return 'Frio ❄️'
    }

    const cardStyle: React.CSSProperties = {
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: '16px',
        padding: '24px',
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                    >
                        <ArrowLeft size={18} style={{ color: T.textMuted }} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: T.text }}>Novo Lead</h1>
                        <p className="text-sm mt-0.5" style={{ color: T.textMuted }}>Cadastre um novo lead no sistema</p>
                    </div>
                </div>

                {/* Score Badge */}
                <div className="px-5 py-3 rounded-xl flex items-center gap-3" style={getScoreColor()}>
                    <Sparkles size={18} />
                    <div>
                        <p className="text-xs font-medium opacity-80">Score de Qualificação</p>
                        <p className="text-xl font-bold leading-tight">{score}/20</p>
                    </div>
                    <p className="text-sm font-bold ml-1">{getScoreLabel()}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Dados Pessoais */}
                    <div style={cardStyle}>
                        <h2 className="text-base font-bold mb-5" style={{ color: T.text }}>Dados Pessoais</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Nome */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.textMuted }}>Nome Completo *</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => handleChange('name', e.target.value)}
                                        placeholder="Ex: Maria Santos Silva"
                                        style={{ ...inputStyle, border: errors.name ? '1px solid #ef4444' : `1px solid ${T.border}` }}
                                    />
                                </div>
                                {errors.name && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} />{errors.name}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.textMuted }}>Email *</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => handleChange('email', e.target.value)}
                                        placeholder="email@exemplo.com"
                                        style={{ ...inputStyle, border: errors.email ? '1px solid #ef4444' : `1px solid ${T.border}` }}
                                    />
                                </div>
                                {errors.email && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} />{errors.email}</p>}
                            </div>

                            {/* Telefone */}
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.textMuted }}>Telefone *</label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={e => handleChange('phone', formatPhone(e.target.value))}
                                        placeholder="(81) 99999-9999"
                                        maxLength={15}
                                        style={{ ...inputStyle, border: errors.phone ? '1px solid #ef4444' : `1px solid ${T.border}` }}
                                    />
                                </div>
                                {errors.phone && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} />{errors.phone}</p>}
                            </div>

                            {/* CPF */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.textMuted }}>CPF (opcional)</label>
                                <div className="relative">
                                    <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                                    <input
                                        type="text"
                                        value={formData.cpf}
                                        onChange={e => handleChange('cpf', formatCPF(e.target.value))}
                                        placeholder="000.000.000-00"
                                        maxLength={14}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Interesse */}
                    <div style={cardStyle}>
                        <h2 className="text-base font-bold mb-5" style={{ color: T.text }}>Interesse</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Origem */}
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.textMuted }}>Origem do Lead *</label>
                                <div className="relative">
                                    <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                                    <select
                                        value={formData.origem}
                                        onChange={e => handleChange('origem', e.target.value)}
                                        style={{ ...inputStyle, border: errors.origem ? '1px solid #ef4444' : `1px solid ${T.border}`, paddingRight: '14px' }}
                                    >
                                        <option value="">Selecione...</option>
                                        {origens.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </div>
                                {errors.origem && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} />{errors.origem}</p>}
                            </div>

                            {/* Tipo de Imóvel */}
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.textMuted }}>Tipo de Imóvel</label>
                                <div className="relative">
                                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                                    <select
                                        value={formData.interesse}
                                        onChange={e => handleChange('interesse', e.target.value)}
                                        style={{ ...inputStyle, paddingRight: '14px' }}
                                    >
                                        <option value="">Selecione...</option>
                                        {tiposImovel.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Localização */}
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.textMuted }}>Localização Preferida</label>
                                <div className="relative">
                                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                                    <select
                                        value={formData.localizacao}
                                        onChange={e => handleChange('localizacao', e.target.value)}
                                        style={{ ...inputStyle, paddingRight: '14px' }}
                                    >
                                        <option value="">Selecione...</option>
                                        {localizacoes.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Orçamento */}
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.textMuted }}>Faixa de Orçamento</label>
                                <div className="relative">
                                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                                    <select
                                        value={formData.orcamento}
                                        onChange={e => handleChange('orcamento', e.target.value)}
                                        style={{ ...inputStyle, paddingRight: '14px' }}
                                    >
                                        <option value="">Selecione...</option>
                                        {faixasOrcamento.map(f => <option key={f.label} value={f.label}>{f.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Observações */}
                    <div style={cardStyle}>
                        <h2 className="text-base font-bold mb-4" style={{ color: T.text }}>Observações</h2>
                        <textarea
                            value={formData.notes}
                            onChange={e => handleChange('notes', e.target.value)}
                            placeholder="Adicione informações relevantes sobre o lead..."
                            rows={5}
                            style={{
                                background: T.elevated,
                                border: `1px solid ${T.border}`,
                                color: T.text,
                                width: '100%',
                                borderRadius: '12px',
                                padding: '12px 14px',
                                fontSize: '14px',
                                outline: 'none',
                                resize: 'vertical',
                            }}
                        />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6 space-y-5" style={cardStyle}>
                        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Resumo</h3>

                        {/* Status Inicial */}
                        <div>
                            <p className="text-xs mb-1.5" style={{ color: T.textMuted }}>Status Inicial</p>
                            <div className="px-3 py-2 rounded-lg text-sm font-medium" style={{ background: 'rgba(245,158,11,0.12)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.25)' }}>
                                Pendente
                            </div>
                        </div>

                        {/* Score Breakdown */}
                        <div>
                            <p className="text-xs mb-3" style={{ color: T.textMuted }}>Fatores de Qualificação</p>
                            <div className="space-y-2 text-sm">
                                {[
                                    { label: 'Email válido', active: formData.email.includes('@'), pts: '+2' },
                                    { label: 'Telefone', active: formData.phone.length >= 14, pts: '+2' },
                                    { label: 'Origem qualificada', active: ['Site IMI', 'Indicação', 'Google Ads'].includes(formData.origem), pts: '+1' },
                                    { label: 'Interesse definido', active: !!formData.interesse, pts: '+2' },
                                    { label: 'Localização', active: !!formData.localizacao && formData.localizacao !== 'Outro', pts: '+1' },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center justify-between">
                                        <span style={{ color: T.textMuted }}>{item.label}</span>
                                        <span style={{ color: item.active ? '#4ADE80' : T.textMuted, fontWeight: item.active ? 600 : 400 }}>
                                            {item.active ? item.pts : '0'}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between">
                                    <span style={{ color: T.textMuted }}>Orçamento</span>
                                    <span style={{ color: formData.orcamento ? '#4ADE80' : T.textMuted, fontWeight: formData.orcamento ? 600 : 400 }}>
                                        {formData.orcamento ? `+${faixasOrcamento.find(f => f.label === formData.orcamento)?.score || 0}` : '0'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Dica */}
                        <div className="rounded-xl p-4" style={{ background: 'rgba(72,101,129,0.08)', border: '1px solid rgba(72,101,129,0.2)' }}>
                            <div className="flex gap-3">
                                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: T.accent }} />
                                <div className="text-xs" style={{ color: '#8CA4B8' }}>
                                    <p className="font-semibold mb-0.5">Dica de Qualificação</p>
                                    <p>Leads com score acima de 15 têm 3× mais chances de conversão.</p>
                                </div>
                            </div>
                        </div>

                        {/* Botões */}
                        <div className="space-y-3 pt-2 border-t" style={{ borderColor: T.border }}>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                style={{ background: isSubmitting ? '#334E68' : '#1E3A5F', boxShadow: isSubmitting ? 'none' : '0 2px 8px rgba(30,58,95,0.4)' }}
                            >
                                {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> Salvando...</> : <><Save size={15} /> Criar Lead</>}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="w-full h-11 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}
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
