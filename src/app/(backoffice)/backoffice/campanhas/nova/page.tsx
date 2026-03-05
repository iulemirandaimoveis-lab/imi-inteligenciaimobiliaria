'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Target,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Image as ImageIcon,
  Link as LinkIcon,
  Save,
  Loader2,
  AlertCircle,
  Check,
  Sparkles,
  Instagram,
  Facebook,
  Mail,
  Search,
  MessageSquare,
  Globe,
  X,
  Upload,
} from 'lucide-react'

const T = {
  surface: 'var(--bo-surface)',
  elevated: 'var(--bo-elevated)',
  border: 'var(--bo-border)',
  text: 'var(--bo-text)',
  textMuted: 'var(--bo-text-muted)',
  hover: 'var(--bo-hover)',
  accent: '#486581',
}

type Step = 1 | 2 | 3

interface FormData {
  // Básico
  name: string
  objective: string
  channel: string
  startDate: string
  endDate: string

  // Orçamento
  budget: string
  dailyBudget: string
  expectedLeads: string
  costPerLead: string

  // Segmentação
  targetAudience: string
  ageRange: string
  location: string[]
  interests: string[]

  // Criativos
  adTitle: string
  adDescription: string
  callToAction: string
  landingPageUrl: string
  images: File[]

  // Tracking
  utmSource: string
  utmMedium: string
  utmCampaign: string
}

const canais = [
  { value: 'instagram', label: 'Instagram Ads', icon: Instagram, color: 'bg-pink-500' },
  { value: 'facebook', label: 'Facebook Ads', icon: Facebook, color: 'bg-blue-600' },
  { value: 'google', label: 'Google Ads', icon: Search, color: 'bg-red-500' },
  { value: 'email', label: 'Email Marketing', icon: Mail, color: 'bg-green-500' },
  { value: 'whatsapp', label: 'WhatsApp Business', icon: MessageSquare, color: 'bg-green-600' },
  { value: 'site', label: 'Site/Blog', icon: Globe, color: 'bg-purple-500' },
]

const objetivos = [
  'Geração de Leads',
  'Reconhecimento de Marca',
  'Tráfego para Site',
  'Conversão de Vendas',
  'Engajamento',
  'Visualizações de Vídeo',
]

const localizacoes = [
  'Boa Viagem',
  'Pina',
  'Piedade',
  'Setúbal',
  'Candeias',
  'Imbiribeira',
  'Recife (Toda cidade)',
  'Região Metropolitana',
]

const interessesOptions = [
  'Imóveis de Luxo',
  'Primeira Casa',
  'Investimento Imobiliário',
  'Apartamentos',
  'Casas',
  'Coberturas',
  'Praia',
  'Financiamento',
]

export default function NovaCampanhaPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    name: '',
    objective: '',
    channel: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    budget: '',
    dailyBudget: '',
    expectedLeads: '',
    costPerLead: '',
    targetAudience: '',
    ageRange: '25-45',
    location: [],
    interests: [],
    adTitle: '',
    adDescription: '',
    callToAction: 'Saiba Mais',
    landingPageUrl: '',
    images: [],
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
  })

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Auto-calculate
    if (field === 'budget' || field === 'expectedLeads') {
      const budget = field === 'budget' ? Number(value) : Number(formData.budget)
      const leads = field === 'expectedLeads' ? Number(value) : Number(formData.expectedLeads)
      if (budget > 0 && leads > 0) {
        setFormData(prev => ({ ...prev, costPerLead: (budget / leads).toFixed(2) }))
      }
    }
  }

  const toggleLocation = (loc: string) => {
    setFormData(prev => ({
      ...prev,
      location: prev.location.includes(loc)
        ? prev.location.filter(l => l !== loc)
        : [...prev.location, loc]
    }))
  }

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }))
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório'
      if (!formData.objective) newErrors.objective = 'Objetivo é obrigatório'
      if (!formData.channel) newErrors.channel = 'Canal é obrigatório'
      if (!formData.startDate) newErrors.startDate = 'Data de início é obrigatória'
    }

    if (step === 2) {
      if (!formData.budget) newErrors.budget = 'Orçamento é obrigatório'
      if (!formData.expectedLeads) newErrors.expectedLeads = 'Meta de leads é obrigatória'
    }

    if (step === 3) {
      if (!formData.adTitle.trim()) newErrors.adTitle = 'Título é obrigatório'
      if (!formData.adDescription.trim()) newErrors.adDescription = 'Descrição é obrigatória'
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
      const response = await fetch('/api/campanhas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro ao salvar')

      router.push('/backoffice/campanhas')
    } catch (error) {
      console.error('Erro ao salvar campanha:', error)
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(Number(numbers))
  }

  const steps = [
    { number: 1, label: 'Configuração', icon: Target },
    { number: 2, label: 'Orçamento', icon: DollarSign },
    { number: 3, label: 'Criativos', icon: ImageIcon },
  ]

  const progress = (currentStep / 3) * 100

  const selectedChannel = canais.find(c => c.value === formData.channel)

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
            <ArrowLeft size={20} style={{ color: T.text }} />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: T.text }}>Nova Campanha de Marketing</h1>
            <p className="text-sm mt-1" style={{ color: T.textMuted }}>Passo {currentStep} de 3</p>
          </div>
        </div>

        {selectedChannel && (
          <div className={`px-4 py-2 ${selectedChannel.color} text-white rounded-xl flex items-center gap-2`}>
            <selectedChannel.icon size={16} />
            <span className="text-sm font-medium">{selectedChannel.label}</span>
          </div>
        )}
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
                    isActive ? 'bg-blue-500 text-white' :
                      ''
                    }`}
                    style={!isCompleted && !isActive ? { background: T.elevated, color: T.textMuted } : {}}
                  >
                    {isCompleted ? <Check size={24} /> : <StepIcon size={24} />}
                  </div>
                  <p className={`text-sm font-medium mt-2 ${isActive ? 'text-blue-700' : isCompleted ? 'text-green-700' : ''
                    }`}
                    style={!isActive && !isCompleted ? { color: T.textMuted } : {}}
                  >
                    {step.label}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-4 rounded-full transition-all ${currentStep > step.number ? 'bg-green-500' : ''
                    }`}
                    style={currentStep <= step.number ? { background: T.elevated } : {}}
                  />
                )}
              </div>
            )
          })}
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: T.elevated }}>
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Form Content */}
      <div className="rounded-2xl p-8" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        {/* Step 1: Configuração */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6" style={{ color: T.text }}>Configuração da Campanha</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Nome da Campanha *
                </label>
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Ex: Lançamento Reserva Imperial - Instagram"
                    className={`w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-300 bg-red-50' : ''}`}
                    style={!errors.name ? { background: T.elevated, border: `1px solid ${T.border}`, color: T.text } : {}}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Objetivo */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Objetivo *
                </label>
                <select
                  value={formData.objective}
                  onChange={(e) => handleChange('objective', e.target.value)}
                  className={`w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.objective ? 'border-red-300 bg-red-50' : ''}`}
                  style={!errors.objective ? { background: T.elevated, border: `1px solid ${T.border}`, color: T.text } : {}}
                >
                  <option value="">Selecione...</option>
                  {objetivos.map(obj => (
                    <option key={obj} value={obj}>{obj}</option>
                  ))}
                </select>
                {errors.objective && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.objective}
                  </p>
                )}
              </div>

              {/* Canal */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Canal *
                </label>
                <select
                  value={formData.channel}
                  onChange={(e) => handleChange('channel', e.target.value)}
                  className={`w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.channel ? 'border-red-300 bg-red-50' : ''}`}
                  style={!errors.channel ? { background: T.elevated, border: `1px solid ${T.border}`, color: T.text } : {}}
                >
                  <option value="">Selecione...</option>
                  {canais.map(canal => (
                    <option key={canal.value} value={canal.value}>{canal.label}</option>
                  ))}
                </select>
                {errors.channel && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.channel}
                  </p>
                )}
              </div>

              {/* Data Início */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Data de Início *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    className={`w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.startDate ? 'border-red-300 bg-red-50' : ''}`}
                    style={!errors.startDate ? { background: T.elevated, border: `1px solid ${T.border}`, color: T.text } : {}}
                  />
                </div>
              </div>

              {/* Data Fim */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Data de Término
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Orçamento */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6" style={{ color: T.text }}>Orçamento e Metas</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Orçamento Total */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Orçamento Total *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleChange('budget', e.target.value)}
                    placeholder="5000"
                    className={`w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.budget ? 'border-red-300 bg-red-50' : ''}`}
                    style={!errors.budget ? { background: T.elevated, border: `1px solid ${T.border}`, color: T.text } : {}}
                  />
                </div>
                {formData.budget && (
                  <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                    {formatCurrency(formData.budget)}
                  </p>
                )}
                {errors.budget && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.budget}
                  </p>
                )}
              </div>

              {/* Orçamento Diário */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Orçamento Diário
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                  <input
                    type="number"
                    value={formData.dailyBudget}
                    onChange={(e) => handleChange('dailyBudget', e.target.value)}
                    placeholder="200"
                    className="w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                  />
                </div>
                {formData.dailyBudget && (
                  <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                    {formatCurrency(formData.dailyBudget)}/dia
                  </p>
                )}
              </div>

              {/* Meta de Leads */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Meta de Leads *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                  <input
                    type="number"
                    value={formData.expectedLeads}
                    onChange={(e) => handleChange('expectedLeads', e.target.value)}
                    placeholder="50"
                    className={`w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.expectedLeads ? 'border-red-300 bg-red-50' : ''}`}
                    style={!errors.expectedLeads ? { background: T.elevated, border: `1px solid ${T.border}`, color: T.text } : {}}
                  />
                </div>
                {errors.expectedLeads && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.expectedLeads}
                  </p>
                )}
              </div>

              {/* CPL Estimado */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Custo por Lead (CPL)
                </label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                  <input
                    type="text"
                    value={formData.costPerLead ? formatCurrency(formData.costPerLead) : ''}
                    readOnly
                    placeholder="Calculado automaticamente"
                    className="w-full h-11 pl-10 pr-4 rounded-xl font-medium"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                  />
                </div>
              </div>
            </div>

            {/* Segmentação */}
            <div className="pt-6 space-y-6" style={{ borderTop: `1px solid ${T.border}` }}>
              <h3 className="text-lg font-bold" style={{ color: T.text }}>Segmentação</h3>

              {/* Público-Alvo */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Público-Alvo
                </label>
                <textarea
                  value={formData.targetAudience}
                  onChange={(e) => handleChange('targetAudience', e.target.value)}
                  placeholder="Ex: Profissionais liberais, casais sem filhos, renda acima de R$ 10k"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>

              {/* Faixa Etária */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Faixa Etária
                </label>
                <select
                  value={formData.ageRange}
                  onChange={(e) => handleChange('ageRange', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                >
                  <option value="18-24">18-24 anos</option>
                  <option value="25-34">25-34 anos</option>
                  <option value="25-45">25-45 anos</option>
                  <option value="35-54">35-54 anos</option>
                  <option value="45-65">45-65 anos</option>
                  <option value="18-65">Todas as idades</option>
                </select>
              </div>

              {/* Localização */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: T.text }}>
                  Localização
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {localizacoes.map(loc => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => toggleLocation(loc)}
                      className={`h-10 px-4 rounded-lg text-sm font-medium transition-all ${formData.location.includes(loc)
                        ? 'bg-blue-500 text-white'
                        : ''
                        }`}
                      style={!formData.location.includes(loc) ? { border: `1px solid ${T.border}`, color: T.text } : {}}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: T.textMuted }}>
                  {formData.location.length} localização(ões) selecionada(s)
                </p>
              </div>

              {/* Interesses */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: T.text }}>
                  Interesses
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {interessesOptions.map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`h-10 px-4 rounded-lg text-sm font-medium transition-all ${formData.interests.includes(interest)
                        ? 'bg-blue-500 text-white'
                        : ''
                        }`}
                      style={!formData.interests.includes(interest) ? { border: `1px solid ${T.border}`, color: T.text } : {}}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: T.textMuted }}>
                  {formData.interests.length} interesse(s) selecionado(s)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Criativos */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6" style={{ color: T.text }}>Criativos e Tracking</h2>

            <div className="grid grid-cols-1 gap-6">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Título do Anúncio *
                </label>
                <input
                  type="text"
                  value={formData.adTitle}
                  onChange={(e) => handleChange('adTitle', e.target.value)}
                  placeholder="Ex: Seu Apartamento dos Sonhos em Boa Viagem"
                  maxLength={60}
                  className={`w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.adTitle ? 'border-red-300 bg-red-50' : ''}`}
                  style={!errors.adTitle ? { background: T.elevated, border: `1px solid ${T.border}`, color: T.text } : {}}
                />
                <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                  {formData.adTitle.length}/60 caracteres
                </p>
                {errors.adTitle && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.adTitle}
                  </p>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                  Descrição *
                </label>
                <textarea
                  value={formData.adDescription}
                  onChange={(e) => handleChange('adDescription', e.target.value)}
                  placeholder="Descreva os principais benefícios e diferenciais..."
                  rows={4}
                  maxLength={200}
                  className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.adDescription ? 'border-red-300 bg-red-50' : ''}`}
                  style={!errors.adDescription ? { background: T.elevated, border: `1px solid ${T.border}`, color: T.text } : {}}
                />
                <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                  {formData.adDescription.length}/200 caracteres
                </p>
                {errors.adDescription && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.adDescription}
                  </p>
                )}
              </div>

              {/* CTA */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                    Call to Action
                  </label>
                  <select
                    value={formData.callToAction}
                    onChange={(e) => handleChange('callToAction', e.target.value)}
                    className="w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                  >
                    <option value="Saiba Mais">Saiba Mais</option>
                    <option value="Agende Visita">Agende Visita</option>
                    <option value="Fale Conosco">Fale Conosco</option>
                    <option value="Baixar Material">Baixar Material</option>
                    <option value="Simular Financiamento">Simular Financiamento</option>
                  </select>
                </div>

                {/* Landing Page */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                    URL da Landing Page
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                    <input
                      type="url"
                      value={formData.landingPageUrl}
                      onChange={(e) => handleChange('landingPageUrl', e.target.value)}
                      placeholder="https://..."
                      className="w-full h-11 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                    />
                  </div>
                </div>
              </div>

              {/* Upload Imagens */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: T.text }}>
                  Imagens do Anúncio
                </label>
                <label className="block">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer" style={{ borderColor: T.border }}>
                    <Upload size={40} className="mx-auto mb-3" style={{ color: T.textMuted }} />
                    <p className="text-sm font-medium mb-1" style={{ color: T.text }}>
                      Clique para fazer upload
                    </p>
                    <p className="text-xs" style={{ color: T.textMuted }}>
                      JPG, PNG (1200x628px recomendado)
                    </p>
                  </div>
                </label>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {formData.images.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Criativo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center touch-always-visible opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* UTM Parameters */}
              <div className="pt-6" style={{ borderTop: `1px solid ${T.border}` }}>
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: T.text }}>
                  <Sparkles size={16} className="text-blue-600" />
                  Parâmetros UTM (Tracking)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: T.textMuted }}>
                      utm_source
                    </label>
                    <input
                      type="text"
                      value={formData.utmSource}
                      onChange={(e) => handleChange('utmSource', e.target.value)}
                      placeholder="instagram"
                      className="w-full h-10 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: T.textMuted }}>
                      utm_medium
                    </label>
                    <input
                      type="text"
                      value={formData.utmMedium}
                      onChange={(e) => handleChange('utmMedium', e.target.value)}
                      placeholder="paid"
                      className="w-full h-10 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: T.textMuted }}>
                      utm_campaign
                    </label>
                    <input
                      type="text"
                      value={formData.utmCampaign}
                      onChange={(e) => handleChange('utmCampaign', e.target.value)}
                      placeholder="reserva-imperial"
                      className="w-full h-10 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                    />
                  </div>
                </div>
              </div>
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
            className="flex items-center gap-2 h-11 px-6 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
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
                Criando Campanha...
              </>
            ) : (
              <>
                <Save size={20} />
                Criar Campanha
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
