'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  MapPin,
  Ruler,
  User,
  Mail,
  Phone,
  FileText,
  Upload,
  Check,
  Save,
  Loader2,
  AlertCircle,
  Home,
  DollarSign,
  Calendar,
  Sparkles,
  X,
  Image as ImageIcon,
} from 'lucide-react'

type Step = 1 | 2 | 3

interface FormData {
  // Imóvel
  propertyAddress: string
  propertyType: string
  propertyArea: string
  bedrooms: string
  bathrooms: string
  parking: string
  city: string
  state: string

  // Cliente
  clientName: string
  clientEmail: string
  clientPhone: string
  clientCPF: string

  // Avaliação
  purpose: string
  method: string
  requestDate: string
  deadline: string

  // Documentos
  documents: File[]
}

const tiposImovel = [
  'Apartamento',
  'Casa',
  'Cobertura',
  'Studio',
  'Loft',
  'Terreno',
  'Comercial',
  'Galpão',
]

const metodosAvaliacao = [
  'Comparativo Direto de Dados de Mercado',
  'Involutivo',
  'Evolutivo',
  'Renda',
  'Custo',
]

const finalidades = [
  'Compra e Venda',
  'Financiamento Bancário',
  'Garantia de Empréstimo',
  'Partilha de Bens',
  'Inventário',
  'Desapropriação',
  'Seguro',
  'Outra',
]

const T = {
  surface: 'var(--bo-surface)',
  elevated: 'var(--bo-elevated)',
  border: 'var(--bo-border)',
  text: 'var(--bo-text)',
  textMuted: 'var(--bo-text-muted)',
  hover: 'var(--bo-hover)',
  accent: '#486581',
}

export default function EditarAvaliacaoPage() {
  const router = useRouter()
  const params = useParams()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    // Imóvel
    propertyAddress: '',
    propertyType: '',
    propertyArea: '',
    bedrooms: '',
    bathrooms: '',
    parking: '',
    city: '',
    state: 'PE',

    // Cliente
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientCPF: '',

    // Avaliação
    purpose: '',
    method: '',
    requestDate: '',
    deadline: '',

    // Documentos
    documents: [],
  })

  // Load evaluation data on mount
  useEffect(() => {
    fetch(`/api/avaliacoes?id=${params.id}`)
      .then(r => r.json())
      .then((d: any) => {
        if (d && !d.error) {
          setFormData(prev => ({
            ...prev,
            propertyAddress: d.endereco || '',
            propertyType: d.tipo_imovel || '',
            propertyArea: d.area_privativa ? String(d.area_privativa) : '',
            bedrooms: d.quartos ? String(d.quartos) : '',
            bathrooms: d.banheiros ? String(d.banheiros) : '',
            parking: d.vagas ? String(d.vagas) : '',
            city: d.cidade || 'Recife',
            state: d.estado || 'PE',
            clientName: d.cliente_nome || '',
            clientEmail: d.cliente_email || '',
            clientPhone: d.cliente_telefone || '',
            clientCPF: d.cliente_cpf_cnpj || '',
            purpose: d.finalidade || '',
            method: d.metodologia || '',
            requestDate: d.created_at ? d.created_at.split('T')[0] : '',
            deadline: d.prazo_entrega || '',
            documents: [],
          }))
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [params.id])

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData(prev => ({ ...prev, documents: [...prev.documents, ...files] }))
  }

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }))
  }

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

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.propertyAddress.trim()) newErrors.propertyAddress = 'Endereço é obrigatório'
      if (!formData.propertyType) newErrors.propertyType = 'Tipo é obrigatório'
      if (!formData.propertyArea) newErrors.propertyArea = 'Área é obrigatória'
    }

    if (step === 2) {
      if (!formData.clientName.trim()) newErrors.clientName = 'Nome é obrigatório'
      if (!formData.clientEmail.trim()) newErrors.clientEmail = 'Email é obrigatório'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
        newErrors.clientEmail = 'Email inválido'
      }
    }

    if (step === 3) {
      if (!formData.purpose) newErrors.purpose = 'Finalidade é obrigatória'
      if (!formData.method) newErrors.method = 'Método é obrigatório'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(3, prev + 1) as Step)
    }
  }

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as Step)
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setIsSubmitting(true)

    try {
      const payload = {
        id: params.id,
        endereco: formData.propertyAddress,
        tipo_imovel: formData.propertyType,
        area_privativa: formData.propertyArea ? Number(formData.propertyArea) : null,
        quartos: formData.bedrooms ? Number(formData.bedrooms) : null,
        banheiros: formData.bathrooms ? Number(formData.bathrooms) : null,
        vagas: formData.parking ? Number(formData.parking) : null,
        cidade: formData.city,
        estado: formData.state,
        cliente_nome: formData.clientName,
        cliente_email: formData.clientEmail,
        cliente_telefone: formData.clientPhone,
        cliente_cpf_cnpj: formData.clientCPF,
        finalidade: formData.purpose,
        metodologia: formData.method,
        prazo_entrega: formData.deadline || null,
      }
      const response = await fetch('/api/avaliacoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro ao atualizar')

      router.push(`/backoffice/avaliacoes`)
    } catch (error) {
      console.error('Erro ao atualizar avaliação:', error)
      setIsSubmitting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const steps = [
    { number: 1, label: 'Imóvel', icon: Building2 },
    { number: 2, label: 'Cliente', icon: User },
    { number: 3, label: 'Avaliação', icon: FileText },
  ]

  const progress = (currentStep / 3) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ border: `1px solid ${T.border}` }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: T.text }}>Editar Avaliação Técnica</h1>
            <p className="text-sm mt-1" style={{ color: T.textMuted }}>Laudo NBR 14653 • Passo {currentStep} de 3</p>
          </div>
        </div>

        <div className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Geração com IA</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const StepIcon = step.icon
            const isActive = currentStep === step.number
            const isCompleted = currentStep > step.number

            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-green-500 text-white' :
                    isActive ? 'bg-purple-500 text-white' : ''
                    }`}
                    style={!isCompleted && !isActive ? { background: T.elevated, color: T.textMuted } : undefined}>
                    {isCompleted ? <Check size={24} /> : <StepIcon size={24} />}
                  </div>
                  <p className={`text-sm font-medium mt-2 ${isActive ? 'text-purple-700' : isCompleted ? 'text-green-700' : ''}`}
                    style={!isActive && !isCompleted ? { color: T.textMuted } : undefined}>
                    {step.label}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-4 rounded-full transition-all ${currentStep > step.number ? 'bg-green-500' : ''}`}
                    style={currentStep <= step.number ? { background: T.border } : undefined} />
                )}
              </div>
            )
          })}
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: T.elevated }}>
          <div
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Form Content */}
      <div className="rounded-2xl p-8" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        {/* Step 1: Imóvel */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6" style={{ color: T.text }}>Dados do Imóvel</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Endereço */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Endereço Completo *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3" size={20} style={{ color: T.textMuted }} />
                  <textarea
                    value={formData.propertyAddress}
                    onChange={(e) => handleChange('propertyAddress', e.target.value)}
                    placeholder="Ex: Av. Boa Viagem, 3500 - Apto 802, Boa Viagem"
                    rows={3}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none`}
                    style={{ background: T.elevated, border: `1px solid ${errors.propertyAddress ? '#fca5a5' : T.border}`, color: T.text }}
                  />
                </div>
                {errors.propertyAddress && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.propertyAddress}
                  </p>
                )}
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Tipo de Imóvel *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                  <select
                    value={formData.propertyType}
                    onChange={(e) => handleChange('propertyType', e.target.value)}
                    className={`w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    style={{ background: T.elevated, border: `1px solid ${errors.propertyType ? '#fca5a5' : T.border}`, color: T.text }}
                  >
                    <option value="">Selecione...</option>
                    {tiposImovel.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>
                {errors.propertyType && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.propertyType}
                  </p>
                )}
              </div>

              {/* Área */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Área Privativa (m²) *
                </label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                  <input
                    type="number"
                    value={formData.propertyArea}
                    onChange={(e) => handleChange('propertyArea', e.target.value)}
                    placeholder="95"
                    className={`w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    style={{ background: T.elevated, border: `1px solid ${errors.propertyArea ? '#fca5a5' : T.border}`, color: T.text }}
                  />
                </div>
                {errors.propertyArea && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.propertyArea}
                  </p>
                )}
              </div>

              {/* Quartos */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Quartos
                </label>
                <input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleChange('bedrooms', e.target.value)}
                  placeholder="3"
                  className="w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>

              {/* Banheiros */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Banheiros
                </label>
                <input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => handleChange('bathrooms', e.target.value)}
                  placeholder="2"
                  className="w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>

              {/* Vagas */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Vagas de Garagem
                </label>
                <input
                  type="number"
                  value={formData.parking}
                  onChange={(e) => handleChange('parking', e.target.value)}
                  placeholder="2"
                  className="w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>

              {/* Cidade */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Cidade
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Estado
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                >
                  <option value="PE">Pernambuco</option>
                  <option value="SP">São Paulo</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="MG">Minas Gerais</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Cliente */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6" style={{ color: T.text }}>Dados do Cliente</h2>

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
                    value={formData.clientName}
                    onChange={(e) => handleChange('clientName', e.target.value)}
                    placeholder="Ex: Maria Santos Silva"
                    className={`w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    style={{ background: T.elevated, border: `1px solid ${errors.clientName ? '#fca5a5' : T.border}`, color: T.text }}
                  />
                </div>
                {errors.clientName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.clientName}
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
                    value={formData.clientEmail}
                    onChange={(e) => handleChange('clientEmail', e.target.value)}
                    placeholder="email@exemplo.com"
                    className={`w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    style={{ background: T.elevated, border: `1px solid ${errors.clientEmail ? '#fca5a5' : T.border}`, color: T.text }}
                  />
                </div>
                {errors.clientEmail && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.clientEmail}
                  </p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                  <input
                    type="text"
                    value={formData.clientPhone}
                    onChange={(e) => handleChange('clientPhone', formatPhone(e.target.value))}
                    placeholder="(81) 99999-9999"
                    maxLength={15}
                    className="w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                  />
                </div>
              </div>

              {/* CPF */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  CPF/CNPJ
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                  <input
                    type="text"
                    value={formData.clientCPF}
                    onChange={(e) => handleChange('clientCPF', formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Avaliação */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6" style={{ color: T.text }}>Dados da Avaliação</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Finalidade */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Finalidade da Avaliação *
                </label>
                <select
                  value={formData.purpose}
                  onChange={(e) => handleChange('purpose', e.target.value)}
                  className={`w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  style={{ background: T.elevated, border: `1px solid ${errors.purpose ? '#fca5a5' : T.border}`, color: T.text }}
                >
                  <option value="">Selecione...</option>
                  {finalidades.map(fin => (
                    <option key={fin} value={fin}>{fin}</option>
                  ))}
                </select>
                {errors.purpose && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.purpose}
                  </p>
                )}
              </div>

              {/* Método */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Método de Avaliação *
                </label>
                <select
                  value={formData.method}
                  onChange={(e) => handleChange('method', e.target.value)}
                  className={`w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  style={{ background: T.elevated, border: `1px solid ${errors.method ? '#fca5a5' : T.border}`, color: T.text }}
                >
                  {metodosAvaliacao.map(met => (
                    <option key={met} value={met}>{met}</option>
                  ))}
                </select>
                {errors.method && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.method}
                  </p>
                )}
              </div>

              {/* Data Solicitação */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Data da Solicitação
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                  <input
                    type="date"
                    value={formData.requestDate}
                    onChange={(e) => handleChange('requestDate', e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                  />
                </div>
              </div>

              {/* Prazo */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Prazo de Entrega
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleChange('deadline', e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                  />
                </div>
              </div>
            </div>

            {/* Upload Documentos */}
            <div className="pt-6" style={{ borderTop: `1px solid ${T.border}` }}>
              <label className="block text-sm font-medium mb-3" style={{ color: T.text }}>
                Documentos (Escritura, IPTU, Fotos)
              </label>
              <label className="block">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleDocumentUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed rounded-2xl p-8 text-center hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer" style={{ borderColor: T.border }}>
                  <Upload size={40} className="mx-auto mb-3" style={{ color: T.textMuted }} />
                  <p className="text-sm font-medium mb-1" style={{ color: T.text }}>
                    Clique para fazer upload
                  </p>
                  <p className="text-xs" style={{ color: T.textMuted }}>
                    PDF, JPG, PNG, DOC (máx. 10MB cada)
                  </p>
                </div>
              </label>

              {/* Lista de Documentos */}
              {formData.documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.documents.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: T.elevated }}>
                      <FileText size={20} className="text-purple-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: T.text }}>{file.name}</p>
                        <p className="text-xs" style={{ color: T.textMuted }}>{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="flex items-center gap-2 h-11 px-6 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ border: `1px solid ${T.border}`, color: T.text }}
        >
          <ArrowLeft size={20} />
          Anterior
        </button>

        {currentStep < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 h-11 px-6 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            Próximo
            <ArrowRight size={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 h-11 px-6 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Criando Laudo...
              </>
            ) : (
              <>
                <Save size={20} />
                Salvar Alterações
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
