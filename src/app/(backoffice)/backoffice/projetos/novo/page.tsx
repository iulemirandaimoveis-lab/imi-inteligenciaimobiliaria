'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Building2, MapPin, DollarSign, Calendar, Globe } from 'lucide-react'

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
        setIsSubmitting(true)
        // Simula save — conectar a Supabase em Step 7
        await new Promise(r => setTimeout(r, 1200))
        setIsSubmitting(false)
        router.push('/backoffice/projetos')
    }

    const inputClass = "w-full h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68] text-sm bg-white"
    const labelClass = "block text-sm font-medium text-gray-700 mb-1.5"

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Novo Projeto</h1>
                    <p className="text-sm text-gray-600 mt-0.5">Cadastrar empreendimento IMI</p>
                </div>
            </div>

            {/* Steps */}
            <div className="bg-white rounded-2xl p-4 border">
                <div className="flex items-center gap-2">
                    {steps.map((s, i) => {
                        const StepIcon = s.icon
                        return (
                            <button
                                key={i}
                                onClick={() => setCurrentStep(i)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${currentStep === i ? 'bg-accent-50 text-[#0F0F1E]' : i < currentStep ? 'text-green-700 bg-green-50' : 'text-gray-500'
                                    }`}
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
                <div className="bg-white rounded-2xl p-6 border space-y-5">
                    <h2 className="text-lg font-bold text-gray-900">Identificação do Projeto</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Nome do Projeto *</label>
                            <input type="text" className={inputClass} placeholder="Ex: Reserva Imperial" value={form.nome} onChange={e => updateField('nome', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>Tipo *</label>
                            <select className={inputClass} value={form.tipo} onChange={e => updateField('tipo', e.target.value)}>
                                <option value="">Selecionar tipo</option>
                                {tiposProjeto.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Status *</label>
                            <select className={inputClass} value={form.status} onChange={e => updateField('status', e.target.value)}>
                                {statusOpcoes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Descrição</label>
                            <textarea
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68] text-sm resize-none bg-white"
                                rows={4}
                                placeholder="Descreva o projeto, seu posicionamento e diferencial..."
                                value={form.descricao}
                                onChange={e => updateField('descricao', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Cobertura</label>
                            <select className={inputClass} value={form.cobertura} onChange={e => updateField('cobertura', e.target.value)}>
                                <option value="Regional">Regional (Nordeste)</option>
                                <option value="Nacional">Nacional</option>
                                <option value="Internacional">Internacional</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Website (opcional)</label>
                            <div className="relative">
                                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" className={`${inputClass} pl-9`} placeholder="reservaimperial.com.br" value={form.website} onChange={e => updateField('website', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 1: Localização */}
            {currentStep === 1 && (
                <div className="bg-white rounded-2xl p-6 border space-y-5">
                    <h2 className="text-lg font-bold text-gray-900">Localização</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Endereço / Localização *</label>
                            <input type="text" className={inputClass} placeholder="Ex: Litoral Norte PE — Catuama / Goiana" value={form.localizacao} onChange={e => updateField('localizacao', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>CEP</label>
                            <input type="text" className={inputClass} placeholder="00000-000" value={form.cep} onChange={e => updateField('cep', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>Área Total (m²)</label>
                            <input type="text" className={inputClass} placeholder="1.200.000" value={form.areaTotal} onChange={e => updateField('areaTotal', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>Número de Unidades</label>
                            <input type="number" className={inputClass} placeholder="320" value={form.unidades} onChange={e => updateField('unidades', e.target.value)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Financeiro */}
            {currentStep === 2 && (
                <div className="bg-white rounded-2xl p-6 border space-y-5">
                    <h2 className="text-lg font-bold text-gray-900">Dados Financeiros</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClass}>VGV (R$)</label>
                            <input type="number" className={inputClass} placeholder="480000000" value={form.vgv} onChange={e => updateField('vgv', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>Meta de Captação (R$)</label>
                            <input type="number" className={inputClass} placeholder="120000000" value={form.captacaoAlvo} onChange={e => updateField('captacaoAlvo', e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Perfil de Investidores-Alvo</label>
                            <input type="text" className={inputClass} placeholder="Ex: Sovereign Wealth Funds, Family Offices, ESG Funds" value={form.investidoresAlvo} onChange={e => updateField('investidoresAlvo', e.target.value)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Cronograma */}
            {currentStep === 3 && (
                <div className="bg-white rounded-2xl p-6 border space-y-5">
                    <h2 className="text-lg font-bold text-gray-900">Cronograma</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClass}>Data de Lançamento</label>
                            <input type="date" className={inputClass} value={form.dataLancamento} onChange={e => updateField('dataLancamento', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>Data de Entrega Prevista</label>
                            <input type="date" className={inputClass} value={form.dataEntrega} onChange={e => updateField('dataEntrega', e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Observações</label>
                            <textarea
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68] text-sm resize-none bg-white"
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
                    className="h-11 px-6 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40"
                >
                    Anterior
                </button>
                <span className="text-sm text-gray-500">{currentStep + 1} de {steps.length}</span>
                {currentStep < steps.length - 1 ? (
                    <button
                        onClick={() => setCurrentStep(currentStep + 1)}
                        className="h-11 px-6 bg-[#16162A] text-white rounded-xl text-sm font-medium hover:bg-[#0F0F1E] transition-colors"
                    >
                        Próximo
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 h-11 px-6 bg-[#16162A] text-white rounded-xl text-sm font-medium hover:bg-[#0F0F1E] transition-colors disabled:opacity-60"
                    >
                        <ArrowLeft className="rotate-180" size={16} />
                        {isSubmitting ? 'Salvando...' : 'Salvar Projeto'}
                    </button>
                )}
            </div>
        </div>
    )
}
