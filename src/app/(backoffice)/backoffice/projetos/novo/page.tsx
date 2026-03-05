'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Save, Building2, MapPin, DollarSign, Calendar, Globe } from 'lucide-react'

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    hover: 'var(--bo-hover)',
    accent: 'var(--bo-accent)',
}

const tiposProjeto = [
    'Loteamento Premium',
    'Residencial Alto Padrão',
    'Multiuso',
    'Comercial',
    'Incorporação',
    'Resort / Turismo',
]

const statusOpcoes = [
    { value: 'planejamento', label: 'Planejamento' },
    { value: 'estruturacao', label: 'Estruturação' },
    { value: 'lancamento', label: 'Lançamento' },
    { value: 'construcao', label: 'Em Construção' },
    { value: 'concluido', label: 'Concluído' },
]

export default function NovoProjetoPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)

    const [form, setForm] = useState({
        nome: '',
        tipo: '',
        status: 'planejamento',
        localizacao: '',
        cep: '',
        descricao: '',
        areaTotal: '',
        unidades: '',
        vgv: '',
        captacaoAlvo: '',
        dataLancamento: '',
        dataEntrega: '',
        cobertura: 'Regional',
        investidoresAlvo: '',
        website: '',
        observacoes: '',
    })

    const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

    const steps = [
        { label: 'Identificação', icon: Building2 },
        { label: 'Localização', icon: MapPin },
        { label: 'Financeiro', icon: DollarSign },
        { label: 'Cronograma', icon: Calendar },
    ]

    const handleSubmit = async () => {
        if (!form.nome.trim()) {
            toast.error('Nome do projeto é obrigatório')
            setCurrentStep(0)
            return
        }
        setIsSubmitting(true)
        try {
            const res = await fetch('/api/projetos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: form.nome.trim(),
                    tipo: form.tipo || null,
                    descricao: form.descricao || null,
                    cidade: form.localizacao || null,
                    status: form.status || 'planejamento',
                    unidades: form.unidades ? Number(form.unidades) : 0,
                    area_total_m2: form.areaTotal ? parseFloat(form.areaTotal.replace(/\./g, '').replace(',', '.')) : null,
                    vgv: form.vgv ? parseFloat(form.vgv) : 0,
                    data_lancamento: form.dataLancamento || null,
                    data_entrega_prev: form.dataEntrega || null,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erro ao criar projeto')
            toast.success('Projeto criado com sucesso!')
            router.push('/backoffice/projetos')
        } catch (err: any) {
            toast.error(err.message || 'Erro ao salvar projeto')
        } finally {
            setIsSubmitting(false)
        }
    }

    const inputStyle = {
        background: T.elevated,
        border: `1px solid ${T.border}`,
        color: T.text,
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()}
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                    style={{ border: `1px solid ${T.border}`, color: T.text, background: T.surface }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: T.text }}>Novo Projeto</h1>
                    <p className="text-sm mt-0.5" style={{ color: T.textMuted }}>Cadastrar empreendimento IMI</p>
                </div>
            </div>

            {/* Steps */}
            <div className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-2">
                    {steps.map((s, i) => {
                        const StepIcon = s.icon
                        return (
                            <button
                                key={i}
                                onClick={() => setCurrentStep(i)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center"
                                style={{
                                    background: currentStep === i ? T.elevated : 'transparent',
                                    color: currentStep === i ? T.text : i < currentStep ? '#10B981' : T.textMuted,
                                    border: currentStep === i ? `1px solid ${T.border}` : '1px solid transparent',
                                }}
                            >
                                <StepIcon size={16} />
                                <span className="hidden sm:inline">{s.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Step 0: Identificação */}
            {currentStep === 0 && (
                <div className="rounded-2xl p-6 space-y-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <h2 className="text-lg font-bold" style={{ color: T.text }}>Identificação do Projeto</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1.5" style={{ color: T.textMuted }}>Nome do Projeto *</label>
                            <input type="text"
                                className="w-full h-11 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#334E68]"
                                style={inputStyle}
                                placeholder="Ex: Reserva Imperial" value={form.nome} onChange={e => updateField('nome', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: T.textMuted }}>Tipo *</label>
                            <select className="w-full h-11 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#334E68]"
                                style={inputStyle}
                                value={form.tipo} onChange={e => updateField('tipo', e.target.value)}>
                                <option value="">Selecionar tipo</option>
                                {tiposProjeto.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: T.textMuted }}>Status *</label>
                            <select className="w-full h-11 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#334E68]"
                                style={inputStyle}
                                value={form.status} onChange={e => updateField('status', e.target.value)}>
                                {statusOpcoes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1.5" style={{ color: T.textMuted }}>Descrição</label>
                            <textarea
                                className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-[#334E68]"
                                style={inputStyle}
                                rows={4}
                                placeholder="Descreva o projeto, seu posicionamento e diferencial..."
                                value={form.descricao}
                                onChange={e => updateField('descricao', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: T.textMuted }}>Cobertura</label>
                            <select className="w-full h-11 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#334E68]"
                                style={inputStyle}
                                value={form.cobertura} onChange={e => updateField('cobertura', e.target.value)}>
                                <option value="Regional">Regional (Nordeste)</option>
                                <option value="Nacional">Nacional</option>
                                <option value="Internacional">Internacional</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: T.textMuted }}>Website (opcional)</label>
                            <div className="relative">
                                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                                <input type="text"
                                    className="w-full h-11 pl-9 pr-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#334E68]"
                                    style={inputStyle}
                                    placeholder="reservaimperial.com.br" value={form.website} onChange={e => updateField('website', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 1: Localização */}
            {currentStep === 1 && (
                <div className="rounded-2xl p-6 space-y-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <h2 className="text-lg font-bold" style={{ color: T.text }}>Localização</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1.5" style={{ color: T.textMuted }}>Endereço / Localização *</label>
                            <input type="text"
                                className="w-full h-11 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#334E68]"
                                style={inputStyle}
                                placeholder="Ex: Litoral Norte PE — Catuama / Goiana" value={form.localizacao} onChange={e => updateField('localizacao', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: T.textMuted }}>CEP</label>
                            <input type="text"
                                className="w-full h-11 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#334E68]"
                                style={inputStyle}
                                placeholder="00000-000" value={form.cep} onChange={e => updateField('cep', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: T.textMuted }}>Área Total (m²)</label>
                            <input type="text"
                                className="w-full h-11 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#334E68]"
                                style={inputStyle}
                                placeholder="1.200.000" value={form.areaTotal} onChange={e => updateField('areaTotal', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: T.textMuted }}>Número de Unidades</label>
                            <input type="number"
                                className="w-full h-11 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#334E68]"
                                style={inputStyle}
                                placeholder="320" value={form.unidades} onChange={e => updateField('unidades', e.target.value)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Financeiro */}
            {currentStep === 2 && (
                <div className="rounded-2xl p-6 space-y-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <h2 className="text-lg font-bold" style={{ color: T.text }}>Dados Financeiros</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: T.textMuted }}>VGV (R$)</label>
                            <input type="number"
                                className="w-full h-11 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#334E68]"
                                style={inputStyle}
                                placeholder="480000000" value={form.vgv} onChange={e => updateField('vgv', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: T.textMuted }}>Meta de Captação (R$)</label>
                            <input type="number"
                                className="w-full h-11 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#334E68]"
                                style={inputStyle}
                                placeholder="120000000" value={form.captacaoAlvo} onChange={e => updateField('captacaoAlvo', e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1.5" style={{ color: T.textMuted }}>Perfil de Investidores-Alvo</label>
                            <input type="text"
                                className="w-full h-11 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#334E68]"
                                style={inputStyle}
                                placeholder="Ex: Sovereign Wealth Funds, Family Offices, ESG Funds" value={form.investidoresAlvo} onChange={e => updateField('investidoresAlvo', e.target.value)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Cronograma */}
            {currentStep === 3 && (
                <div className="rounded-2xl p-6 space-y-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <h2 className="text-lg font-bold" style={{ color: T.text }}>Cronograma</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: T.textMuted }}>Data de Lançamento</label>
                            <input type="date"
                                className="w-full h-11 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#334E68]"
                                style={inputStyle}
                                value={form.dataLancamento} onChange={e => updateField('dataLancamento', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: T.textMuted }}>Data de Entrega Prevista</label>
                            <input type="date"
                                className="w-full h-11 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#334E68]"
                                style={inputStyle}
                                value={form.dataEntrega} onChange={e => updateField('dataEntrega', e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1.5" style={{ color: T.textMuted }}>Observações</label>
                            <textarea
                                className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-[#334E68]"
                                style={inputStyle}
                                rows={3}
                                placeholder="Notas adicionais sobre o cronograma..."
                                value={form.observacoes}
                                onChange={e => updateField('observacoes', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="h-11 px-6 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
                    style={{ border: `1px solid ${T.border}`, color: T.text, background: T.surface }}
                >
                    Anterior
                </button>
                <span className="text-sm" style={{ color: T.textMuted }}>{currentStep + 1} de {steps.length}</span>
                {currentStep < steps.length - 1 ? (
                    <button
                        onClick={() => setCurrentStep(currentStep + 1)}
                        className="h-11 px-6 text-white rounded-xl text-sm font-medium transition-colors"
                        style={{ background: T.accent }}
                    >
                        Próximo
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 h-11 px-6 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
                        style={{ background: T.accent }}
                    >
                        <ArrowLeft className="rotate-180" size={16} />
                        {isSubmitting ? 'Salvando...' : 'Salvar Projeto'}
                    </button>
                )}
            </div>
        </div>
    )
}
