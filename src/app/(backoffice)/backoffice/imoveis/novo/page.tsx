'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  MapPin,
  Ruler,
  Home,
  DollarSign,
  Image as ImageIcon,
  Upload,
  Check,
  Calendar,
  User,
  Briefcase,
  X,
  Save,
  Loader2,
  AlertCircle,
  Sparkles,
  BedDouble,
  Bath,
  Car,
  Maximize,
  FileText,
} from 'lucide-react'

type Step = 1 | 2 | 3 | 4

interface FormData {
  // Step 1: Básico
  name: string
  type: string
  location: string
  address: string
  developer: string

  // Step 2: Características
  area: string
  bedrooms: string
  bathrooms: string
  parking: string
  floor: string
  features: string[]

  // Step 3: Valores
  priceMin: string
  priceMax: string
  pricePerSqm: string
  totalUnits: string
  availableUnits: string
  deliveryDate: string

  // Step 4: Mídia
  images: File[]
  logo: File | null
}

// ⚠️ Dados reais Recife
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
]

const construtoras = [
  'Grupo IMI',
  'Moura Dubeux',
  'Queiroz Galvão',
  'Cyrela',
  'MRV',
  'Rossi',
  'Tenda',
  'Outra',
]

const featuresOptions = [
  'Piscina',
  'Academia',
  'Salão de festas',
  'Churrasqueira',
  'Playground',
  'Quadra esportiva',
  'Sauna',
  'Espaço gourmet',
  'Coworking',
  'Pet place',
  'Brinquedoteca',
  'Salão de jogos',
  'Cinema',
  'Spa',
  'Jardim',
  'Portaria 24h',
  'Segurança',
  'Elevador',
]

export default function NovoImovelPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: '',
    location: '',
    address: '',
    developer: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    parking: '',
    floor: '',
    features: [],
    priceMin: '',
    priceMax: '',
    pricePerSqm: '',
    totalUnits: '',
    availableUnits: '',
    deliveryDate: '',
    images: [],
    logo: null,
  })

  const [isParsingPdf, setIsParsingPdf] = useState(false)

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsParsingPdf(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/imoveis/pdf-parse', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Falha ao processar PDF')
      }

      const { data } = await res.json()

      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        type: data.type || prev.type,
        location: data.location || prev.location,
        address: data.address || prev.address,
        developer: data.developer || prev.developer,
        area: data.area?.toString() || prev.area,
        bedrooms: data.bedrooms?.toString() || prev.bedrooms,
        bathrooms: data.bathrooms?.toString() || prev.bathrooms,
        parking: data.parking?.toString() || prev.parking,
        features: Array.isArray(data.features) ? Array.from(new Set([...prev.features, ...data.features])) : prev.features,
      }))

      toast.success('PDF processado com sucesso! Os campos foram preenchidos.')
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao ler o PDF: ' + err.message)
    } finally {
      setIsParsingPdf(false)
    }
  }

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, logo: file }))
    }
  }

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório'
      if (!formData.type) newErrors.type = 'Tipo é obrigatório'
      if (!formData.location) newErrors.location = 'Localização é obrigatória'
      if (!formData.address.trim()) newErrors.address = 'Endereço é obrigatório'
      if (!formData.developer) newErrors.developer = 'Construtora é obrigatória'
    }

    if (step === 2) {
      if (!formData.area) newErrors.area = 'Área é obrigatória'
      if (!formData.bedrooms) newErrors.bedrooms = 'Quartos é obrigatório'
      if (!formData.bathrooms) newErrors.bathrooms = 'Banheiros é obrigatório'
    }

    if (step === 3) {
      if (!formData.priceMin) newErrors.priceMin = 'Preço mínimo é obrigatório'
      if (!formData.priceMax) newErrors.priceMax = 'Preço máximo é obrigatório'
      if (!formData.totalUnits) newErrors.totalUnits = 'Total de unidades é obrigatório'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(4, prev + 1) as Step)
    }
  }

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as Step)
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setIsSubmitting(true)

    try {
      // 1. Upload images to Supabase Storage if any
      let imageUrls: string[] = []
      if (formData.images.length > 0) {
        toast.info(`Enviando ${formData.images.length} imagem(ns)...`)
        const { uploadMultipleFiles } = await import('@/lib/supabase-storage')
        const uploadResults = await uploadMultipleFiles(
          formData.images,
          'developments',
          'new'
        )
        imageUrls = uploadResults.filter(r => !r.error).map(r => r.url)
        const failedCount = uploadResults.filter(r => r.error).length
        if (failedCount > 0) toast.warning(`${failedCount} imagem(ns) falharam no upload`)
      }

      // 2. Send to API
      const payload = {
        ...formData,
        images: undefined,
        logo: undefined,
        gallery_images: imageUrls,
        image: imageUrls[0] || null,
      }

      const res = await fetch('/api/developments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Erro ao salvar no banco')
      }

      toast.success('Empreendimento cadastrado com sucesso!')
      router.push('/backoffice/imoveis')
    } catch (err: any) {
      console.error(err)
      toast.error('Ocorreu um erro ao salvar o imóvel: ' + err.message)
    } finally {
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
    { number: 1, label: 'Básico', icon: Building2 },
    { number: 2, label: 'Características', icon: Home },
    { number: 3, label: 'Valores', icon: DollarSign },
    { number: 4, label: 'Mídia', icon: ImageIcon },
  ]

  const progress = (currentStep / 4) * 100

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
            <h1 className="text-2xl font-bold text-gray-900">Novo Empreendimento</h1>
            <p className="text-sm text-gray-600 mt-1">Passo {currentStep} de 4</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const StepIcon = step.icon
            const isActive = currentStep === step.number
            const isCompleted = currentStep > step.number

            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-green-500 text-white' :
                    isActive ? 'bg-accent-500 text-white' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                    {isCompleted ? <Check size={24} /> : <StepIcon size={24} />}
                  </div>
                  <p className={`text-sm font-medium mt-2 ${isActive ? 'text-accent-700' : isCompleted ? 'text-green-700' : 'text-gray-500'
                    }`}>
                    {step.label}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-4 rounded-full transition-all ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                )}
              </div>
            )
          })}
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100">
        {/* Step 1: Básico */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Informações Básicas</h2>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isParsingPdf}
                />
                <button
                  type="button"
                  disabled={isParsingPdf}
                  className="flex items-center gap-2 px-4 py-2 bg-accent-50 text-accent-700 hover:bg-accent-100 border border-accent-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isParsingPdf ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Extraindo dados do PDF...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Preencher via PDF / Ebook
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Empreendimento *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Ex: Reserva Atlantis"
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

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Imóvel *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white ${errors.type ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                >
                  <option value="">Selecione...</option>
                  {tiposImovel.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.type}
                  </p>
                )}
              </div>

              {/* Localização */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bairro *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className={`w-full h-11 pl-10 pr-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white ${errors.location ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                  >
                    <option value="">Selecione...</option>
                    {localizacoes.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.location}
                  </p>
                )}
              </div>

              {/* Endereço */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço Completo *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Ex: Av. Boa Viagem, 3500"
                  className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 ${errors.address ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.address}
                  </p>
                )}
              </div>

              {/* Construtora */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Construtora/Incorporadora *
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={formData.developer}
                    onChange={(e) => handleChange('developer', e.target.value)}
                    className={`w-full h-11 pl-10 pr-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white ${errors.developer ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                  >
                    <option value="">Selecione...</option>
                    {construtoras.map(construtora => (
                      <option key={construtora} value={construtora}>{construtora}</option>
                    ))}
                  </select>
                </div>
                {errors.developer && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.developer}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Características */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Características do Imóvel</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Área */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Área Privativa (m²) *
                </label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="number"
                    value={formData.area}
                    onChange={(e) => handleChange('area', e.target.value)}
                    placeholder="95"
                    className={`w-full h-11 pl-10 pr-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 ${errors.area ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                  />
                </div>
                {errors.area && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.area}
                  </p>
                )}
              </div>

              {/* Quartos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quartos *
                </label>
                <div className="relative">
                  <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => handleChange('bedrooms', e.target.value)}
                    placeholder="3"
                    className={`w-full h-11 pl-10 pr-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 ${errors.bedrooms ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                  />
                </div>
                {errors.bedrooms && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.bedrooms}
                  </p>
                )}
              </div>

              {/* Banheiros */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banheiros *
                </label>
                <div className="relative">
                  <Bath className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => handleChange('bathrooms', e.target.value)}
                    placeholder="2"
                    className={`w-full h-11 pl-10 pr-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 ${errors.bathrooms ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                  />
                </div>
                {errors.bathrooms && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.bathrooms}
                  </p>
                )}
              </div>

              {/* Vagas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vagas de Garagem
                </label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="number"
                    value={formData.parking}
                    onChange={(e) => handleChange('parking', e.target.value)}
                    placeholder="2"
                    className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
              </div>

              {/* Andar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Andar
                </label>
                <div className="relative">
                  <Maximize className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={(e) => handleChange('floor', e.target.value)}
                    placeholder="8º ao 24º"
                    className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="pt-6 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Características do Condomínio
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {featuresOptions.map(feature => (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => toggleFeature(feature)}
                    className={`h-10 px-4 rounded-lg text-sm font-medium transition-all ${formData.features.includes(feature)
                      ? 'bg-accent-500 text-white'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {feature}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                {formData.features.length} característica(s) selecionada(s)
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Valores */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Valores e Disponibilidade</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preço Mínimo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço Mínimo *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="number"
                    value={formData.priceMin}
                    onChange={(e) => handleChange('priceMin', e.target.value)}
                    placeholder="450000"
                    className={`w-full h-11 pl-10 pr-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 ${errors.priceMin ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                  />
                </div>
                {formData.priceMin && (
                  <p className="text-xs text-gray-600 mt-1">
                    {formatCurrency(formData.priceMin)}
                  </p>
                )}
                {errors.priceMin && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.priceMin}
                  </p>
                )}
              </div>

              {/* Preço Máximo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço Máximo *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="number"
                    value={formData.priceMax}
                    onChange={(e) => handleChange('priceMax', e.target.value)}
                    placeholder="680000"
                    className={`w-full h-11 pl-10 pr-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 ${errors.priceMax ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                  />
                </div>
                {formData.priceMax && (
                  <p className="text-xs text-gray-600 mt-1">
                    {formatCurrency(formData.priceMax)}
                  </p>
                )}
                {errors.priceMax && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.priceMax}
                  </p>
                )}
              </div>

              {/* Preço/m² */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço por m²
                </label>
                <input
                  type="number"
                  value={formData.pricePerSqm}
                  onChange={(e) => handleChange('pricePerSqm', e.target.value)}
                  placeholder="7200"
                  className="w-full h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
                {formData.pricePerSqm && (
                  <p className="text-xs text-gray-600 mt-1">
                    {formatCurrency(formData.pricePerSqm)}/m²
                  </p>
                )}
              </div>

              {/* Data de Entrega */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Previsão de Entrega
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="month"
                    value={formData.deliveryDate}
                    onChange={(e) => handleChange('deliveryDate', e.target.value)}
                    className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
              </div>

              {/* Total de Unidades */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total de Unidades *
                </label>
                <input
                  type="number"
                  value={formData.totalUnits}
                  onChange={(e) => handleChange('totalUnits', e.target.value)}
                  placeholder="120"
                  className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 ${errors.totalUnits ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                />
                {errors.totalUnits && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.totalUnits}
                  </p>
                )}
              </div>

              {/* Unidades Disponíveis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidades Disponíveis
                </label>
                <input
                  type="number"
                  value={formData.availableUnits}
                  onChange={(e) => handleChange('availableUnits', e.target.value)}
                  placeholder="45"
                  className="w-full h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Mídia */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Imagens e Logo</h2>

            {/* Upload Imagens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Fotos do Empreendimento
              </label>
              <label className="block">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-accent-400 hover:bg-accent-50 transition-all cursor-pointer">
                  <Upload size={40} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Clique para fazer upload
                  </p>
                  <p className="text-xs text-gray-600">
                    PNG, JPG até 10MB (mínimo 5 fotos recomendado)
                  </p>
                </div>
              </label>

              {/* Preview Imagens */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {formData.images.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Logo da Construtora
              </label>
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-accent-400 hover:bg-accent-50 transition-all cursor-pointer">
                  {formData.logo ? (
                    <div className="flex items-center justify-center gap-4">
                      <img
                        src={URL.createObjectURL(formData.logo)}
                        alt="Logo preview"
                        className="h-16 object-contain"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          handleChange('logo', null)
                        }}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Clique para fazer upload do logo</p>
                    </>
                  )}
                </div>
              </label>
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
          className="flex items-center gap-2 h-11 px-6 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={20} />
          Anterior
        </button>

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 transition-colors"
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
                Publicando...
              </>
            ) : (
              <>
                <Save size={20} />
                Publicar Empreendimento
              </>
            )}
          </button>
        )}
      </div>
    </div >
  )
}
