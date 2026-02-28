'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  Briefcase,
  X,
  Save,
  Loader2,
  AlertCircle,
  BedDouble,
  Bath,
  Car,
  Maximize,
} from 'lucide-react'

type Step = 1 | 2 | 3 | 4

interface FormData {
  name: string
  type: string
  location: string
  address: string
  developer: string
  area: string
  bedrooms: string
  bathrooms: string
  parking: string
  floor: string
  features: string[]
  priceMin: string
  priceMax: string
  pricePerSqm: string
  totalUnits: string
  availableUnits: string
  deliveryDate: string
  images: File[]
  existingImages: string[]
  logo: File | null
  existingLogo: string
}

// Mock data (seria carregado do Supabase)
const mockDevelopmentData = {
  id: 1,
  name: 'Reserva Atlantis',
  type: 'Apartamento',
  location: 'Boa Viagem',
  address: 'Av. Boa Viagem, 3500',
  developer: 'Grupo IMI',
  area: '95',
  bedrooms: '3',
  bathrooms: '2',
  parking: '2',
  floor: '8º ao 24º',
  features: ['Piscina', 'Academia', 'Salão de festas', 'Churrasqueira', 'Playground', 'Portaria 24h'],
  priceMin: '580000',
  priceMax: '850000',
  pricePerSqm: '7200',
  totalUnits: '120',
  availableUnits: '45',
  deliveryDate: '2027-06',
  existingImages: [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
  ],
  existingLogo: 'https://via.placeholder.com/200x80?text=IMI+Logo',
}

// Opções (mesmas do /novo)
const tiposImovel = ['Apartamento', 'Casa', 'Cobertura', 'Studio', 'Loft', 'Terreno', 'Comercial']
const localizacoes = ['Boa Viagem', 'Pina', 'Piedade', 'Setúbal', 'Candeias', 'Imbiribeira', 'Ipsep', 'Recife Antigo']
const construtoras = ['Grupo IMI', 'Moura Dubeux', 'Queiroz Galvão', 'Cyrela', 'MRV', 'Rossi', 'Tenda', 'Outra']
const featuresOptions = [
  'Piscina', 'Academia', 'Salão de festas', 'Churrasqueira', 'Playground', 'Quadra esportiva',
  'Sauna', 'Espaço gourmet', 'Coworking', 'Pet place', 'Brinquedoteca', 'Salão de jogos',
  'Cinema', 'Spa', 'Jardim', 'Portaria 24h', 'Segurança', 'Elevador',
]

export default function EditarImovelPage() {
  const router = useRouter()
  const params = useParams()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(true)
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
    existingImages: [],
    logo: null,
    existingLogo: '',
  })

  // Load data on mount
  useEffect(() => {
    setTimeout(() => {
      setFormData({
        ...mockDevelopmentData,
        images: [],
        logo: null,
      })
      setIsLoading(false)
    }, 500)
  }, [params.id])

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

  const removeNewImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const removeExistingImage = (url: string) => {
    setFormData(prev => ({
      ...prev,
      existingImages: prev.existingImages.filter(img => img !== url)
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

    // TODO: Upload new images to Supabase Storage
    // TODO: Update Supabase database
    await new Promise(resolve => setTimeout(resolve, 2000))

    alert('Empreendimento atualizado com sucesso!')
    router.push(`/backoffice/imoveis/${params.id}`)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={48} className="text-[#3B82F6] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados do empreendimento...</p>
        </div>
      </div>
    )
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
            <h1 className="text-2xl font-bold text-gray-900">Editar Empreendimento</h1>
            <p className="text-sm text-gray-600 mt-1">{formData.name} • Passo {currentStep} de 4</p>
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
                    isActive ? 'bg-[#1A1A2E] text-white' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                    {isCompleted ? <Check size={24} /> : <StepIcon size={24} />}
                  </div>
                  <p className={`text-sm font-medium mt-2 ${isActive ? 'text-[#0F0F1E]' : isCompleted ? 'text-green-700' : 'text-gray-500'
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
            className="h-full bg-[#1A1A2E] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100">
        {/* Step 1: Básico */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Informações Básicas</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className={`w-full h-11 pl-10 pr-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Imóvel *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white ${errors.type ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                >
                  <option value="">Selecione...</option>
                  {tiposImovel.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bairro *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className={`w-full h-11 pl-10 pr-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white ${errors.location ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                  >
                    <option value="">Selecione...</option>
                    {localizacoes.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço Completo *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] ${errors.address ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Construtora/Incorporadora *
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={formData.developer}
                    onChange={(e) => handleChange('developer', e.target.value)}
                    className={`w-full h-11 pl-10 pr-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white ${errors.developer ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                  >
                    <option value="">Selecione...</option>
                    {construtoras.map(construtora => (
                      <option key={construtora} value={construtora}>{construtora}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Características */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Características do Imóvel</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    className={`w-full h-11 pl-10 pr-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] ${errors.area ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                  />
                </div>
              </div>

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
                    className={`w-full h-11 pl-10 pr-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] ${errors.bedrooms ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                  />
                </div>
              </div>

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
                    className={`w-full h-11 pl-10 pr-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] ${errors.bathrooms ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                  />
                </div>
              </div>

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
                    className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>
              </div>

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
                    className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>
              </div>
            </div>

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
                      ? 'bg-[#1A1A2E] text-white'
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
                    className={`w-full h-11 pl-10 pr-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] ${errors.priceMin ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                  />
                </div>
                {formData.priceMin && (
                  <p className="text-xs text-gray-600 mt-1">
                    {formatCurrency(formData.priceMin)}
                  </p>
                )}
              </div>

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
                    className={`w-full h-11 pl-10 pr-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] ${errors.priceMax ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                  />
                </div>
                {formData.priceMax && (
                  <p className="text-xs text-gray-600 mt-1">
                    {formatCurrency(formData.priceMax)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço por m²
                </label>
                <input
                  type="number"
                  value={formData.pricePerSqm}
                  onChange={(e) => handleChange('pricePerSqm', e.target.value)}
                  className="w-full h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
                {formData.pricePerSqm && (
                  <p className="text-xs text-gray-600 mt-1">
                    {formatCurrency(formData.pricePerSqm)}/m²
                  </p>
                )}
              </div>

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
                    className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total de Unidades *
                </label>
                <input
                  type="number"
                  value={formData.totalUnits}
                  onChange={(e) => handleChange('totalUnits', e.target.value)}
                  className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] ${errors.totalUnits ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidades Disponíveis
                </label>
                <input
                  type="number"
                  value={formData.availableUnits}
                  onChange={(e) => handleChange('availableUnits', e.target.value)}
                  className="w-full h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Mídia */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Imagens e Logo</h2>

            {/* Existing Images */}
            {formData.existingImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Imagens Atuais
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.existingImages.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Imagem ${index + 1}`}
                        className="w-full h-32 object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(url)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Adicionar Novas Fotos
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
                    PNG, JPG até 10MB
                  </p>
                </div>
              </label>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {formData.images.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Nova ${index + 1}`}
                        className="w-full h-32 object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logo */}
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
                        alt="Novo logo"
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
                  ) : formData.existingLogo ? (
                    <div className="flex items-center justify-center gap-4">
                      <img
                        src={formData.existingLogo}
                        alt="Logo atual"
                        className="h-16 object-contain"
                      />
                      <p className="text-sm text-gray-600">Clique para alterar</p>
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
            className="flex items-center gap-2 h-11 px-6 bg-[#16162A] text-white rounded-xl font-medium hover:bg-[#0F0F1E] transition-colors"
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
                Salvando...
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
    </div >
  )
}
