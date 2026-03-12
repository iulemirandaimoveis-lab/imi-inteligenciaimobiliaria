'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, ArrowRight, Save, Loader2, Check,
    User, Home, Calculator, FileText,
    AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'

const supabase = createClient()

const STEPS = [
    { id: 1, name: 'Cliente', description: 'Dados pessoais', icon: User },
    { id: 2, name: 'Imóvel', description: 'Informações do registro', icon: Home },
    { id: 3, name: 'Engenharia de Crédito', description: 'Análise de capacidade', icon: Calculator },
    { id: 4, name: 'Dossiê', description: 'Instruções finais', icon: FileText },
]

const inputClass = 'w-full h-11 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--bo-accent)] transition-all'
const inputStyle = { background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)', color: 'var(--bo-text)' }
const inputErrorStyle = { background: 'var(--bo-elevated)', border: `1px solid ${T.error}`, color: 'var(--bo-text)' }

function Label({ children }: { children: React.ReactNode }) {
    return (
        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: T.textMuted }}>
            {children}
        </label>
    )
}

function FieldError({ msg }: { msg?: string }) {
    if (!msg) return null
    return (
        <p className="mt-1 text-xs flex items-center gap-1" style={{ color: T.error }}>
            <AlertCircle size={12} /> {msg}
        </p>
    )
}

export default function CreditoNovoPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        client_name: '',
        client_email: '',
        client_phone: '',
        client_cpf: '',
        client_birthdate: '',
        client_marital_status: '',
        property_type: '',
        property_value: '',
        property_address: '',
        property_city: '',
        property_state: '',
        requested_amount: '',
        income: '',
        employment_type: '',
        employment_time: '',
        has_fgts: 'no',
        fgts_value: '',
        notes: '',
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    }

    const validateStep = (step: number) => {
        const newErrors: Record<string, string> = {}
        if (step === 1) {
            if (!formData.client_name.trim()) newErrors.client_name = 'Nome completo é obrigatório'
            if (!formData.client_email.trim()) newErrors.client_email = 'E-mail é obrigatório para notificações'
            if (!formData.client_phone.trim()) newErrors.client_phone = 'Telefone de contato é obrigatório'
            if (!formData.client_cpf.trim()) newErrors.client_cpf = 'CPF é fundamental para análise bancária'
        }
        if (step === 2) {
            if (!formData.property_type) newErrors.property_type = 'Selecione a tipologia do ativo'
            if (!formData.property_value) newErrors.property_value = 'Valor de avaliação é obrigatório'
            if (!formData.property_city.trim()) newErrors.property_city = 'Cidade da garantia é obrigatória'
        }
        if (step === 3) {
            if (!formData.requested_amount) newErrors.requested_amount = 'Informe o valor total do crédito'
            if (!formData.income) newErrors.income = 'Renda mensal comprovada é obrigatória'
            if (!formData.employment_type) newErrors.employment_type = 'Selecione o regime de ocupação'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
            toast.error('Por favor, preencha todos os campos obrigatórios.')
        }
    }

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1))
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return
        setIsSubmitting(true)
        try {
            // Build full address from parts
            const fullAddress = [formData.property_address, formData.property_city, formData.property_state]
                .filter(Boolean).join(', ')

            const { error } = await supabase.from('credit_applications').insert({
                client_name: formData.client_name,
                client_email: formData.client_email,
                client_phone: formData.client_phone.replace(/\D/g, ''),
                client_cpf: formData.client_cpf.replace(/\D/g, ''),
                client_income: Number(formData.income) || null,
                client_occupation: formData.employment_type || null,
                property_type: formData.property_type,
                property_value: Number(formData.property_value),
                property_address: fullAddress || null,
                financed_amount: Number(formData.requested_amount) || null,
                status: 'pending',
                documents: {
                    birthdate: formData.client_birthdate || null,
                    marital_status: formData.client_marital_status || null,
                    employment_time: formData.employment_time || null,
                    has_fgts: formData.has_fgts === 'yes',
                    fgts_value: formData.has_fgts === 'yes' ? Number(formData.fgts_value) : null,
                    notes: formData.notes || null,
                },
                timeline: [{
                    date: new Date().toISOString(),
                    event: 'Solicitação criada via backoffice',
                    status: 'pending',
                }],
            })
            if (error) throw error
            toast.success('Solicitação de crédito enviada para análise com sucesso!')
            router.push('/backoffice/credito')
        } catch (error: any) {
            console.error('Erro ao salvar:', error)
            toast.error(`Falha ao processar solicitação: ${error.message || 'Erro de conexão'}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const progress = (currentStep / STEPS.length) * 100
    const currentStepData = STEPS[currentStep - 1]
    const StepIcon = currentStepData.icon

    return (
        <div className="space-y-6">
            {/* Sticky step header */}
            <div className="sticky top-0 z-20 rounded-2xl px-5 py-4"
                style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: 'blur(12px)' }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                            style={{ border: `1px solid ${T.border}`, background: T.elevated }}
                        >
                            <ArrowLeft size={16} style={{ color: T.text }} />
                        </button>
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>
                                PROTOCOLAR CRÉDITO
                            </p>
                            <h1 className="text-sm font-bold leading-tight flex items-center gap-2" style={{ color: T.text }}>
                                <StepIcon size={13} style={{ color: T.accent }} />
                                {currentStepData.name}
                                <span className="text-xs font-normal" style={{ color: T.textMuted }}>
                                    Etapa {currentStep}/{STEPS.length}
                                </span>
                            </h1>
                        </div>
                    </div>
                    {/* Step indicators */}
                    <div className="flex items-center gap-2">
                        {STEPS.map(s => {
                            const Icon = s.icon
                            const done = currentStep > s.id
                            const active = currentStep === s.id
                            return (
                                <div key={s.id} className="flex items-center gap-1.5">
                                    <div
                                        className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                                        style={
                                            done
                                                ? { background: T.success, color: '#fff' }
                                                : active
                                                    ? { background: T.accent, color: '#fff' }
                                                    : { background: T.elevated, color: T.textMuted, border: `1px solid ${T.border}` }
                                        }
                                    >
                                        {done ? <Check size={12} strokeWidth={3} /> : <Icon size={12} />}
                                    </div>
                                    {s.id < STEPS.length && (
                                        <div className="w-6 h-0.5 rounded-full"
                                            style={{ background: currentStep > s.id ? T.success : T.border }} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                    <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, background: T.accent }} />
                </div>
            </div>

            {/* Form card */}
            <div className="rounded-2xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                {/* Card header */}
                <div className="px-8 py-5" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: T.textMuted }}>
                        Sessão {currentStep}
                    </p>
                    <h2 className="text-base font-bold" style={{ color: T.text }}>{currentStepData.name}</h2>
                    <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>{currentStepData.description}</p>
                </div>

                <div className="p-8">
                    {/* Step 1: Cliente */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div>
                                <Label>Nome Completo do Proponente *</Label>
                                <input name="client_name" type="text" value={formData.client_name} onChange={handleChange}
                                    placeholder="Ex: João Roberto de Albuquerque"
                                    className={inputClass}
                                    style={errors.client_name ? inputErrorStyle : inputStyle} />
                                <FieldError msg={errors.client_name} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label>E-mail de Notificação *</Label>
                                    <input name="client_email" type="email" value={formData.client_email} onChange={handleChange}
                                        placeholder="cliente@email.com" className={inputClass}
                                        style={errors.client_email ? inputErrorStyle : inputStyle} />
                                    <FieldError msg={errors.client_email} />
                                </div>
                                <div>
                                    <Label>Telefone WhatsApp *</Label>
                                    <input name="client_phone" type="tel" value={formData.client_phone} onChange={handleChange}
                                        placeholder="(00) 00000-0000" className={inputClass}
                                        style={errors.client_phone ? inputErrorStyle : inputStyle} />
                                    <FieldError msg={errors.client_phone} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label>CPF Individual *</Label>
                                    <input name="client_cpf" type="text" value={formData.client_cpf} onChange={handleChange}
                                        placeholder="000.000.000-00" className={`${inputClass} font-mono`}
                                        style={errors.client_cpf ? inputErrorStyle : inputStyle} />
                                    <FieldError msg={errors.client_cpf} />
                                </div>
                                <div>
                                    <Label>Data de Nascimento</Label>
                                    <input name="client_birthdate" type="date" value={formData.client_birthdate} onChange={handleChange}
                                        className={inputClass} style={inputStyle} />
                                </div>
                            </div>

                            <div>
                                <Label>Estado Civil</Label>
                                <select name="client_marital_status" value={formData.client_marital_status} onChange={handleChange}
                                    className={inputClass} style={inputStyle}>
                                    <option value="">Selecione o status</option>
                                    <option value="solteiro">Solteiro(a)</option>
                                    <option value="casado">Casado(a) / União Estável</option>
                                    <option value="divorciado">Divorciado(a)</option>
                                    <option value="viuvo">Viúvo(a)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Imóvel */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label>Tipologia do Imóvel *</Label>
                                    <select name="property_type" value={formData.property_type} onChange={handleChange}
                                        className={inputClass}
                                        style={errors.property_type ? inputErrorStyle : inputStyle}>
                                        <option value="">Selecione o tipo de ativo</option>
                                        <option value="Apartamento">Apartamento</option>
                                        <option value="Casa">Casa de Condomínio / Rua</option>
                                        <option value="Terreno">Lote / Terreno</option>
                                        <option value="Comercial">Ativo Comercial</option>
                                    </select>
                                    <FieldError msg={errors.property_type} />
                                </div>
                                <div>
                                    <Label>Valor de Mercado Estimado (R$) *</Label>
                                    <input name="property_value" type="number" value={formData.property_value} onChange={handleChange}
                                        placeholder="450000" className={inputClass}
                                        style={errors.property_value ? inputErrorStyle : inputStyle} />
                                    <FieldError msg={errors.property_value} />
                                </div>
                            </div>

                            <div>
                                <Label>Endereço da Garantia</Label>
                                <input name="property_address" type="text" value={formData.property_address} onChange={handleChange}
                                    placeholder="Rua, número, bairro e complemento"
                                    className={inputClass} style={inputStyle} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label>Cidade *</Label>
                                    <input name="property_city" type="text" value={formData.property_city} onChange={handleChange}
                                        className={inputClass}
                                        style={errors.property_city ? inputErrorStyle : inputStyle} />
                                    <FieldError msg={errors.property_city} />
                                </div>
                                <div>
                                    <Label>Unidade Federativa</Label>
                                    <select name="property_state" value={formData.property_state} onChange={handleChange}
                                        className={inputClass} style={inputStyle}>
                                        <option value="">Selecione o estado</option>
                                        <option value="PE">Pernambuco</option>
                                        <option value="SP">São Paulo</option>
                                        <option value="RJ">Rio de Janeiro</option>
                                        <option value="CE">Ceará</option>
                                        <option value="BA">Bahia</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Engenharia de Crédito */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div>
                                <Label>Valor Total Solicitado (LTV) *</Label>
                                <input name="requested_amount" type="number" value={formData.requested_amount} onChange={handleChange}
                                    className={inputClass}
                                    style={errors.requested_amount ? inputErrorStyle : inputStyle} />
                                <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                                    Projeção: geralmente até 80% do valor do ativo imobiliário
                                </p>
                                <FieldError msg={errors.requested_amount} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label>Renda Mensal Comprovada (R$) *</Label>
                                    <input name="income" type="number" value={formData.income} onChange={handleChange}
                                        className={inputClass}
                                        style={errors.income ? inputErrorStyle : inputStyle} />
                                    <FieldError msg={errors.income} />
                                </div>
                                <div>
                                    <Label>Regime de Ocupação *</Label>
                                    <select name="employment_type" value={formData.employment_type} onChange={handleChange}
                                        className={inputClass}
                                        style={errors.employment_type ? inputErrorStyle : inputStyle}>
                                        <option value="">Selecione o regime</option>
                                        <option value="CLT">Assalariado (CLT)</option>
                                        <option value="Empresário">Empresário / Sócio Quotista</option>
                                        <option value="Autônomo">Profissional Liberal / Autônomo</option>
                                        <option value="Servidor Público">Servidor Público Federal/Est/Mun</option>
                                    </select>
                                    <FieldError msg={errors.employment_type} />
                                </div>
                            </div>

                            <div>
                                <Label>Tempo de Atividade no Cargo / Empresa</Label>
                                <input name="employment_time" type="text" value={formData.employment_time} onChange={handleChange}
                                    placeholder="Ex: 5 anos e 2 meses"
                                    className={inputClass} style={inputStyle} />
                            </div>

                            <div className="rounded-2xl p-5" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                <div className="flex flex-col md:flex-row items-start gap-6">
                                    <div className="flex-1">
                                        <Label>Utilizar Saldo de FGTS na Operação?</Label>
                                        <select name="has_fgts" value={formData.has_fgts} onChange={handleChange}
                                            className={inputClass} style={inputStyle}>
                                            <option value="no">Não utilizar FGTS</option>
                                            <option value="yes">Sim, utilizar como entrada/amortização</option>
                                        </select>
                                    </div>
                                    {formData.has_fgts === 'yes' && (
                                        <div className="flex-1">
                                            <Label>Saldo FGTS Disponível (R$)</Label>
                                            <input name="fgts_value" type="number" value={formData.fgts_value} onChange={handleChange}
                                                placeholder="0.00"
                                                className={inputClass} style={inputStyle} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Dossiê */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div>
                                <Label>Observações Técnicas e Contexto</Label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={6}
                                    placeholder="Insira aqui detalhes sobre a composição de renda, outros proponentes ou particularidades do imóvel..."
                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--bo-accent)] transition-all resize-none"
                                    style={inputStyle}
                                />
                            </div>

                            <div className="rounded-2xl p-6"
                                style={{ background: T.elevated, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.accent}` }}>
                                <div className="flex items-start gap-4">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                        style={{ background: 'rgba(var(--imi-ai-gold-rgb, 72,101,129),0.15)' }}>
                                        <Check size={16} style={{ color: T.accent }} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.text }}>
                                            Protocolo de Instrução de Dossiê
                                        </p>
                                        <p className="text-xs leading-relaxed mb-4" style={{ color: T.textMuted }}>
                                            Ao salvar esta solicitação, o sistema gerará um número de protocolo. Prepare os seguintes documentos originais digitalizados:
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2">
                                            {[
                                                'Documentos de Identidade (RG/CNH)',
                                                'Comprovante de Residência Atualizado',
                                                'Holerites / DECORE (Últimos 3 meses)',
                                                'IRPF Completo com Recibo de Entrega',
                                            ].map(doc => (
                                                <div key={doc} className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />
                                                    <span className="text-xs" style={{ color: T.textMuted }}>{doc}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer navigation */}
                <div className="px-8 py-5 flex items-center justify-between"
                    style={{ borderTop: `1px solid ${T.border}` }}>
                    <button
                        type="button"
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                        className="flex items-center gap-2 h-11 px-6 rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
                        style={{ border: `1px solid ${T.border}`, background: T.elevated, color: T.text }}
                    >
                        <ArrowLeft size={18} />
                        Etapa Anterior
                    </button>

                    {currentStep < STEPS.length ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="flex items-center gap-2 h-11 px-8 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                            style={{ background: T.accent }}
                        >
                            Continuar
                            <ArrowRight size={18} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 h-11 px-8 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ background: T.accent }}
                        >
                            {isSubmitting ? (
                                <><Loader2 size={18} className="animate-spin" /> Enviando...</>
                            ) : (
                                <><Save size={18} /> Efetivar Análise Bancária</>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
