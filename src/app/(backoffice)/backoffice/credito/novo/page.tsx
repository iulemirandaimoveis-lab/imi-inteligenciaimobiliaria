'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '../../../components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Save, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const supabase = createClient()

const steps = [
    { id: 1, name: 'Cliente', description: 'Dados pessoais' },
    { id: 2, name: 'Imóvel', description: 'Informações do registro' },
    { id: 3, name: 'Engenharia de Crédito', description: 'Análise de capacidade' },
    { id: 4, name: 'Dossiê', description: 'Instruções finais' },
]

export default function CreditoNovoPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        // Step 1: Cliente
        client_name: '',
        client_email: '',
        client_phone: '',
        client_cpf: '',
        client_birthdate: '',
        client_marital_status: '',

        // Step 2: Imóvel
        property_type: '',
        property_value: '',
        property_address: '',
        property_city: '',
        property_state: '',

        // Step 3: Financiamento
        requested_amount: '',
        income: '',
        employment_type: '',
        employment_time: '',
        has_fgts: 'no',
        fgts_value: '',

        // Step 4: Observações
        notes: '',
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }))
        }
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
            setCurrentStep((prev) => Math.min(prev + 1, steps.length))
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
            toast.error('Por favor, preencha todos os campos obrigatórios da etapa atual.')
        }
    }

    const handlePrevious = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1))
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return

        setIsSubmitting(true)

        try {
            const { error } = await supabase.from('credit_requests').insert({
                client_name: formData.client_name,
                client_email: formData.client_email,
                client_phone: formData.client_phone.replace(/\D/g, ''),
                client_cpf: formData.client_cpf.replace(/\D/g, ''),
                client_birthdate: formData.client_birthdate || null,
                client_marital_status: formData.client_marital_status || null,
                property_type: formData.property_type,
                property_value: Number(formData.property_value),
                property_address: formData.property_address || null,
                property_city: formData.property_city,
                property_state: formData.property_state || null,
                requested_amount: Number(formData.requested_amount),
                income: Number(formData.income),
                employment_type: formData.employment_type,
                employment_time: formData.employment_time || null,
                has_fgts: formData.has_fgts === 'yes',
                fgts_value: formData.has_fgts === 'yes' ? Number(formData.fgts_value) : null,
                notes: formData.notes || null,
                status: 'pending',
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

    return (
        <div className="space-y-6">
            <PageHeader
                title="Protocolar Solicitação de Crédito"
                subtitle="Inicie um novo fluxo de análise bancária para seu cliente"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/backoffice/dashboard' },
                    { label: 'Crédito', href: '/backoffice/credito' },
                    { label: 'Nova Operação' },
                ]}
            />

            {/* Steps Progress Visualizer */}
            <Card className="border-none bg-transparent shadow-none">
                <CardBody className="px-0">
                    <div className="flex items-center justify-between gap-4">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col md:flex-row items-center gap-3">
                                    <div
                                        className={`
                      w-12 h-12 rounded-2xl flex items-center justify-center
                      text-lg font-black transition-all duration-500 shadow-sm
                      ${currentStep > step.id
                                                ? 'bg-green-500 text-white rotate-[360deg]'
                                                : currentStep === step.id
                                                    ? 'bg-[#102A43] text-white scale-110 shadow-glow'
                                                    : 'bg-white text-imi-300 border border-imi-100'
                                            }
                    `}
                                    >
                                        {currentStep > step.id ? <Check size={24} strokeWidth={4} /> : step.id}
                                    </div>
                                    <div className="hidden lg:block">
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${currentStep >= step.id ? 'text-imi-950' : 'text-imi-300'}`}>Etapa {step.id}</p>
                                        <p className={`text-sm font-bold truncate ${currentStep >= step.id ? 'text-imi-900' : 'text-imi-400'}`}>{step.name}</p>
                                    </div>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className="flex-1 mx-6 h-1 bg-imi-100 rounded-full overflow-hidden hidden sm:block">
                                        <div
                                            className={`h-full transition-all duration-700 ease-smooth ${currentStep > step.id ? 'bg-green-500 w-full' : 'bg-accent-200 w-0'
                                                }`}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>

            {/* Dynamic Form Content */}
            <Card className="shadow-elevated border-imi-50">
                <CardHeader
                    title={`Sessão ${currentStep}: ${steps[currentStep - 1].name}`}
                    subtitle={steps[currentStep - 1].description}
                    className="bg-imi-50/50"
                />
                <CardBody className="p-8">
                    {/* Step 1: Cliente */}
                    {currentStep === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <Input
                                label="Nome Completo do Proponente *"
                                name="client_name"
                                value={formData.client_name}
                                onChange={handleChange}
                                error={errors.client_name}
                                placeholder="Ex: João Roberto de Albuquerque"
                                className="h-14"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Input
                                    label="E-mail de Notificação *"
                                    name="client_email"
                                    type="email"
                                    value={formData.client_email}
                                    onChange={handleChange}
                                    error={errors.client_email}
                                    placeholder="cliente@email.com"
                                    className="h-14"
                                />

                                <Input
                                    label="Telefone WhatsApp *"
                                    name="client_phone"
                                    value={formData.client_phone}
                                    onChange={handleChange}
                                    error={errors.client_phone}
                                    placeholder="(00) 00000-0000"
                                    className="h-14"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Input
                                    label="CPF Individual *"
                                    name="client_cpf"
                                    value={formData.client_cpf}
                                    onChange={handleChange}
                                    error={errors.client_cpf}
                                    placeholder="000.000.000-00"
                                    className="h-14"
                                />

                                <Input
                                    label="Data de Nascimento"
                                    name="client_birthdate"
                                    type="date"
                                    value={formData.client_birthdate}
                                    onChange={handleChange}
                                    className="h-14"
                                />
                            </div>

                            <Select
                                label="Estado Civil Biológico"
                                name="client_marital_status"
                                value={formData.client_marital_status}
                                onChange={handleChange}
                                className="h-14"
                                options={[
                                    { value: '', label: 'Selecione o status' },
                                    { value: 'solteiro', label: 'Solteiro(a)' },
                                    { value: 'casado', label: 'Casado(a) / União Estável' },
                                    { value: 'divorciado', label: 'Divorciado(a)' },
                                    { value: 'viuvo', label: 'Viúvo(a)' },
                                ]}
                            />
                        </div>
                    )}

                    {/* Step 2: Imóvel */}
                    {currentStep === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Select
                                    label="Tipologia do Imóvel *"
                                    name="property_type"
                                    value={formData.property_type}
                                    onChange={handleChange}
                                    error={errors.property_type}
                                    className="h-14"
                                    options={[
                                        { value: '', label: 'Selecione o tipo de ativo' },
                                        { value: 'Apartamento', label: 'Apartamento' },
                                        { value: 'Casa', label: 'Casa de Condomínio / Rua' },
                                        { value: 'Terreno', label: 'Lote / Terreno' },
                                        { value: 'Comercial', label: 'Ativo Comercial' },
                                    ]}
                                />

                                <Input
                                    label="Valor de Mercado Estimado (R$) *"
                                    name="property_value"
                                    type="number"
                                    value={formData.property_value}
                                    onChange={handleChange}
                                    error={errors.property_value}
                                    placeholder="EX: 450000"
                                    className="h-14"
                                    hint="Valor total de avaliação do bem"
                                />
                            </div>

                            <Input
                                label="Endereço da Garantia"
                                name="property_address"
                                value={formData.property_address}
                                onChange={handleChange}
                                placeholder="Rua, número, bairro e complemento"
                                className="h-14"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Input
                                    label="Cidade *"
                                    name="property_city"
                                    value={formData.property_city}
                                    onChange={handleChange}
                                    error={errors.property_city}
                                    className="h-14"
                                />

                                <Select
                                    label="Unidade Federativa"
                                    name="property_state"
                                    value={formData.property_state}
                                    onChange={handleChange}
                                    className="h-14"
                                    options={[
                                        { value: '', label: 'Selecione o estado' },
                                        { value: 'PE', label: 'Pernambuco' },
                                        { value: 'SP', label: 'São Paulo' },
                                        { value: 'RJ', label: 'Rio de Janeiro' },
                                        { value: 'CE', label: 'Ceará' },
                                        { value: 'BA', label: 'Bahia' },
                                    ]}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Financiamento */}
                    {currentStep === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <Input
                                label="Valor Total Solicitado (LTV) *"
                                name="requested_amount"
                                type="number"
                                value={formData.requested_amount}
                                onChange={handleChange}
                                error={errors.requested_amount}
                                className="h-14"
                                hint="Projeção: Geralmente até 80% do valor do ativo imobiliário"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Input
                                    label="Renda Mensal Comprovada (R$) *"
                                    name="income"
                                    type="number"
                                    value={formData.income}
                                    onChange={handleChange}
                                    error={errors.income}
                                    className="h-14"
                                />

                                <Select
                                    label="Regime de Ocupação *"
                                    name="employment_type"
                                    value={formData.employment_type}
                                    onChange={handleChange}
                                    error={errors.employment_type}
                                    className="h-14"
                                    options={[
                                        { value: '', label: 'Selecione o regime' },
                                        { value: 'CLT', label: 'Assalariado (CLT)' },
                                        { value: 'Empresário', label: 'Empresário / Sócio Quotista' },
                                        { value: 'Autônomo', label: 'Profissional Liberal / Autônomo' },
                                        { value: 'Servidor Público', label: 'Servidor Público Federal/Est/Mun' },
                                    ]}
                                />
                            </div>

                            <Input
                                label="Tempo de Atividade no Cargo / Empresa"
                                name="employment_time"
                                value={formData.employment_time}
                                onChange={handleChange}
                                placeholder="Ex: 5 anos e 2 meses"
                                className="h-14"
                            />

                            <div className="bg-imi-50/50 p-6 rounded-2xl border border-imi-100">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className="flex-1">
                                        <Select
                                            label="Utilizar Saldo de FGTS na Operação?"
                                            name="has_fgts"
                                            value={formData.has_fgts}
                                            onChange={handleChange}
                                            className="bg-white"
                                            options={[
                                                { value: 'no', label: 'Não utilizar FGTS' },
                                                { value: 'yes', label: 'Sim, utilizar como entrada/amortização' },
                                            ]}
                                        />
                                    </div>

                                    {formData.has_fgts === 'yes' && (
                                        <div className="flex-1 animate-in zoom-in duration-300">
                                            <Input
                                                label="Saldo FGTS Disponível (R$)"
                                                name="fgts_value"
                                                type="number"
                                                value={formData.fgts_value}
                                                onChange={handleChange}
                                                placeholder="0.00"
                                                className="bg-white"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Documentos */}
                    {currentStep === 4 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <Textarea
                                label="Observações Técnicas e Contexto"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={8}
                                placeholder="Insira aqui detalhes sobre a composição de renda, outros proponentes ou particularidades do imóvel..."
                                className="bg-imi-50/30"
                            />

                            <div className="p-8 bg-imi-950 rounded-2xl border border-imi-800 shadow-elevated">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#102A43]/20 flex items-center justify-center shrink-0">
                                        <Check size={20} className="text-accent-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white uppercase tracking-widest mb-3">Protocolo de Instrução de Dossiê</p>
                                        <p className="text-sm text-imi-300 leading-relaxed mb-4">
                                            Ao salvar esta solicitação, o sistema gerará um número de protocolo. Prepare os seguintes documentos originais digitalizados:
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2">
                                            <div className="flex items-center gap-2 text-xs text-imi-400">
                                                <span className="w-1 h-1 bg-[#102A43] rounded-full"></span>
                                                Documentos de Identidade (RG/CNH)
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-imi-400">
                                                <span className="w-1 h-1 bg-[#102A43] rounded-full"></span>
                                                Comprovante de Residência Atualizado
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-imi-400">
                                                <span className="w-1 h-1 bg-[#102A43] rounded-full"></span>
                                                Holerites / DECORE (Últimos 3 meses)
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-imi-400">
                                                <span className="w-1 h-1 bg-[#102A43] rounded-full"></span>
                                                IRPF Completo com Recibo de Entrega
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardBody>

                <CardFooter className="bg-imi-50/30 p-8 border-t border-imi-100">
                    <div className="flex items-center justify-between w-full">
                        <Button
                            variant="outline"
                            onClick={handlePrevious}
                            disabled={currentStep === 1}
                            icon={<ArrowLeft size={18} />}
                            className="h-14 px-8 border-imi-200 text-imi-500"
                        >
                            Etapa Anterior
                        </Button>

                        {currentStep < steps.length ? (
                            <Button onClick={handleNext} icon={<ArrowRight size={18} />} className="h-14 px-12 shadow-glow">
                                Continuar
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                loading={isSubmitting}
                                icon={<Save size={18} />}
                                className="h-14 px-16 shadow-glow"
                            >
                                Efetivar Análise Bancária
                            </Button>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
