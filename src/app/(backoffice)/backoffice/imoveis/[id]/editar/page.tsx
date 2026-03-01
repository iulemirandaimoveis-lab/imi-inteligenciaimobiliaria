'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
import { uploadFile, uploadMultipleFiles } from '@/lib/supabase-storage'

type Step = 1 | 2 | 3 | 4

interface FormData {
  name: string
  type: string
  location: string
  address: string
  developer: string
  developer_id: string
  description: string
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
  status: string
  is_highlighted: boolean
}

const tiposImovel = ['Apartamento', 'Casa', 'Cobertura', 'Studio', 'Loft', 'Terreno', 'Comercial', 'Empreendimento']
const localizacoes = ['Boa Viagem', 'Pina', 'Piedade', 'Setúbal', 'Candeias', 'Imbiribeira', 'Ipsep', 'Recife Antigo', 'Ponta de Pedra', 'Casa Forte', 'Espinheiro', 'Graças', 'Derby', 'Aflitos']
const statusOptions = ['disponivel', 'em_negociacao', 'reservado', 'vendido', 'lancamento']
const featuresOptions = [
  'Piscina', 'Academia', 'Salão de festas', 'Churrasqueira', 'Playground', 'Quadra esportiva',
  'Sauna', 'Espaço gourmet', 'Coworking', 'Pet place', 'Brinquedoteca', 'Salão de jogos',
  'Cinema', 'Spa', 'Jardim', 'Portaria 24h', 'Segurança', 'Elevador',
]

const T = {
  surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
  border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
  text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)', textDim: 'var(--bo-text-muted)',
  gold: '#486581',
}

export default function EditarImovelPage() {
  const router = useRouter()
  const params = useParams()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    name: '', type: '', location: '', address: '', developer: '', developer_id: '', description: '',
    area: '', bedrooms: '', bathrooms: '', parking: '', floor: '', features: [],
    priceMin: '', priceMax: '', pricePerSqm: '', totalUnits: '', availableUnits: '', deliveryDate: '',
    images: [], existingImages: [], logo: null, existingLogo: '',
    status: 'disponivel', is_highlighted: false,
  })

  // Load real data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`/api/developments?id=${params.id}`)
        if (!res.ok) throw new Error('Erro ao carregar')
        const d = await res.json()

        const galleryImgs = Array.isArray(d.gallery_images) ? d.gallery_images :
          (Array.isArray(d.images) && typeof d.images[0] === 'string' ? d.images : [])

        setFormData({
          name: d.name || '',
          type: d.tipo || d.property_type || d.type || '',
          location: d.neighborhood || d.region || '',
          address: d.address || '',
          developer: d.developer || d.developers?.name || '',
          developer_id: d.developer_id || '',
          description: d.description || '',
          area: d.private_area?.toString() || d.area_from?.toString() || '',
          bedrooms: d.bedrooms?.toString() || '',
          bathrooms: d.bathrooms?.toString() || '',
          parking: d.parking_spaces?.toString() || '',
          floor: '',
          features: Array.isArray(d.features) ? d.features : [],
          priceMin: d.price_min?.toString() || '',
          priceMax: d.price_max?.toString() || '',
          pricePerSqm: d.price_per_sqm?.toString() || '',
          totalUnits: d.units_count?.toString() || '',
          availableUnits: d.available_units?.toString() || '',
          deliveryDate: d.delivery_date ? d.delivery_date.substring(0, 7) : '',
          images: [],
          existingImages: galleryImgs,
          logo: null,
          existingLogo: d.developers?.logo_url || d.developer_logo || '',
          status: d.status || 'disponivel',
          is_highlighted: !!d.is_highlighted,
        })
      } catch (err: any) {
        console.error(err)
        toast.error('Erro ao carregar dados do empreendimento')
      } finally {
        setIsLoading(false)
      }
    }
    if (params.id) loadData()
  }, [params.id])

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
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
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const removeExistingImage = (url: string) => {
    setFormData(prev => ({ ...prev, existingImages: prev.existingImages.filter(img => img !== url) }))
  }

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {}
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório'
      if (!formData.type) newErrors.type = 'Tipo é obrigatório'
    }
    if (step === 3) {
      if (!formData.priceMin && !formData.priceMax) newErrors.priceMin = 'Informe ao menos um preço'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep(prev => Math.min(4, prev + 1) as Step) }
  const handlePrev = () => { setCurrentStep(prev => Math.max(1, prev - 1) as Step) }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return
    setIsSubmitting(true)

    try {
      // 1. Upload new images to Supabase Storage
      let newImageUrls: string[] = []
      if (formData.images.length > 0) {
        toast.info(`Enviando ${formData.images.length} imagem(ns)...`)
        const uploadResults = await uploadMultipleFiles(
          formData.images,
          'developments',
          `${params.id}`
        )
        newImageUrls = uploadResults.filter(r => !r.error).map(r => r.url)
        const failedCount = uploadResults.filter(r => r.error).length
        if (failedCount > 0) toast.warning(`${failedCount} imagem(ns) falharam no upload`)
      }

      // 2. Combine existing + new images
      const allImages = [...formData.existingImages, ...newImageUrls]

      // 3. Build update payload
      const updatePayload: Record<string, any> = {
        id: params.id,
        name: formData.name,
        tipo: formData.type,
        property_type: formData.type,
        neighborhood: formData.location || null,
        address: formData.address || null,
        developer: formData.developer || null,
        developer_id: formData.developer_id || null,
        description: formData.description || null,
        private_area: Number(formData.area) || null,
        bedrooms: Number(formData.bedrooms) || null,
        bathrooms: Number(formData.bathrooms) || null,
        parking_spaces: Number(formData.parking) || null,
        features: formData.features,
        price_min: Number(formData.priceMin) || null,
        price_max: Number(formData.priceMax) || null,
        price_per_sqm: Number(formData.pricePerSqm) || null,
        units_count: Number(formData.totalUnits) || null,
        available_units: Number(formData.availableUnits) || null,
        delivery_date: formData.deliveryDate ? new Date(formData.deliveryDate).toISOString() : null,
        status: formData.status,
        is_highlighted: formData.is_highlighted,
        gallery_images: allImages,
        image: allImages[0] || null,
      }

      // 4. PUT to API
      const res = await fetch('/api/developments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao atualizar')
      }

      toast.success('Empreendimento atualizado com sucesso!')
      router.push(`/backoffice/imoveis/${params.id}`)
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao salvar: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(Number(numbers))
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
          <Loader2 size={48} className="animate-spin mx-auto mb-4" style={{ color: T.gold }} />
          <p style={{ color: T.textDim }}>Carregando dados do empreendimento...</p>
        </div>
      </div>
    )
  }

  const inputStyle = `w-full h-11 px-4 rounded-xl text-sm outline-none transition-all`
  const inputBg = { background: T.elevated, border: `1px solid ${T.border}`, color: T.text }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ border: `1px solid ${T.border}`, background: T.surface }}>
            <ArrowLeft size={20} style={{ color: T.text }} />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: T.text }}>Editar Empreendimento</h1>
            <p className="text-sm mt-0.5" style={{ color: T.textDim }}>{formData.name} · Passo {currentStep} de 4</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const StepIcon = step.icon
            const isActive = currentStep === step.number
            const isCompleted = currentStep > step.number
            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                    style={{ background: isCompleted ? '#6BB87B' : isActive ? T.gold : T.elevated, color: isCompleted || isActive ? 'white' : T.textDim }}>
                    {isCompleted ? <Check size={24} /> : <StepIcon size={24} />}
                  </div>
                  <p className="text-sm font-medium mt-2" style={{ color: isActive ? T.gold : isCompleted ? '#6BB87B' : T.textDim }}>{step.label}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="h-1 flex-1 mx-4 rounded-full" style={{ background: currentStep > step.number ? '#6BB87B' : T.border }} />
                )}
              </div>
            )
          })}
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: T.elevated }}>
          <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, background: T.gold }} />
        </div>
      </div>

      {/* Form Content */}
      <div className="rounded-2xl p-8" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        {/* Step 1 */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold" style={{ color: T.text }}>Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: T.textSub }}>Nome do Empreendimento *</label>
                <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)}
                  className={inputStyle} style={{ ...inputBg, borderColor: errors.name ? '#EF4444' : T.border }} />
                {errors.name && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle size={14} />{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.textSub }}>Tipo de Imóvel *</label>
                <select value={formData.type} onChange={e => handleChange('type', e.target.value)}
                  className={inputStyle} style={{ ...inputBg, borderColor: errors.type ? '#EF4444' : T.border }}>
                  <option value="">Selecione...</option>
                  {tiposImovel.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.type && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle size={14} />{errors.type}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.textSub }}>Status</label>
                <select value={formData.status} onChange={e => handleChange('status', e.target.value)} className={inputStyle} style={inputBg}>
                  {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.textSub }}>Bairro</label>
                <select value={formData.location} onChange={e => handleChange('location', e.target.value)} className={inputStyle} style={inputBg}>
                  <option value="">Selecione...</option>
                  {localizacoes.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: T.textSub }}>Construtora</label>
                <input type="text" value={formData.developer} onChange={e => handleChange('developer', e.target.value)} className={inputStyle} style={inputBg} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: T.textSub }}>Endereço Completo</label>
                <input type="text" value={formData.address} onChange={e => handleChange('address', e.target.value)} className={inputStyle} style={inputBg} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: T.textSub }}>Descrição</label>
                <textarea value={formData.description} onChange={e => handleChange('description', e.target.value)}
                  rows={4} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={inputBg} />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.is_highlighted} onChange={e => handleChange('is_highlighted', e.target.checked)}
                    className="w-5 h-5 rounded accent-[#334E68]" />
                  <span className="text-sm font-medium" style={{ color: T.text }}>Destaque na página inicial</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold" style={{ color: T.text }}>Características do Imóvel</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { field: 'area', label: 'Área Privativa (m²)', icon: Ruler, type: 'number' },
                { field: 'bedrooms', label: 'Quartos', icon: BedDouble, type: 'number' },
                { field: 'bathrooms', label: 'Banheiros', icon: Bath, type: 'number' },
                { field: 'parking', label: 'Vagas', icon: Car, type: 'number' },
                { field: 'floor', label: 'Andar', icon: Maximize, type: 'text' },
              ].map(({ field, label, icon: Icon, type }) => (
                <div key={field}>
                  <label className="block text-sm font-medium mb-2" style={{ color: T.textSub }}>{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: T.textDim }} />
                    <input type={type} value={(formData as any)[field]} onChange={e => handleChange(field as keyof FormData, e.target.value)}
                      className={inputStyle} style={{ ...inputBg, paddingLeft: '2.5rem' }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-6" style={{ borderTop: `1px solid ${T.border}` }}>
              <label className="block text-sm font-medium mb-4" style={{ color: T.textSub }}>Características do Condomínio</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {featuresOptions.map(feature => (
                  <button key={feature} type="button" onClick={() => toggleFeature(feature)}
                    className="h-10 px-4 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: formData.features.includes(feature) ? T.gold : T.elevated,
                      color: formData.features.includes(feature) ? 'white' : T.textSub,
                      border: `1px solid ${formData.features.includes(feature) ? T.borderGold : T.border}`,
                    }}>
                    {feature}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: T.textDim }}>{formData.features.length} selecionada(s)</p>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold" style={{ color: T.text }}>Valores e Disponibilidade</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { field: 'priceMin', label: 'Preço Mínimo', icon: DollarSign, type: 'number', errKey: 'priceMin' },
                { field: 'priceMax', label: 'Preço Máximo', icon: DollarSign, type: 'number', errKey: '' },
                { field: 'pricePerSqm', label: 'Preço por m²', icon: null, type: 'number', errKey: '' },
                { field: 'deliveryDate', label: 'Previsão de Entrega', icon: Calendar, type: 'month', errKey: '' },
                { field: 'totalUnits', label: 'Total de Unidades', icon: null, type: 'number', errKey: '' },
                { field: 'availableUnits', label: 'Unidades Disponíveis', icon: null, type: 'number', errKey: '' },
              ].map(({ field, label, icon: Icon, type, errKey }) => (
                <div key={field}>
                  <label className="block text-sm font-medium mb-2" style={{ color: T.textSub }}>{label}</label>
                  <div className="relative">
                    {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: T.textDim }} />}
                    <input type={type} value={(formData as any)[field]} onChange={e => handleChange(field as keyof FormData, e.target.value)}
                      className={inputStyle} style={{ ...inputBg, paddingLeft: Icon ? '2.5rem' : '1rem', borderColor: errors[errKey] ? '#EF4444' : T.border }} />
                  </div>
                  {(formData as any)[field] && type === 'number' && field.startsWith('price') && (
                    <p className="text-xs mt-1" style={{ color: T.textDim }}>{formatCurrency((formData as any)[field])}{field === 'pricePerSqm' ? '/m²' : ''}</p>
                  )}
                  {errors[errKey] && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle size={14} />{errors[errKey]}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4 */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold" style={{ color: T.text }}>Imagens</h2>
            {formData.existingImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: T.textSub }}>Imagens Atuais ({formData.existingImages.length})</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.existingImages.map((url, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                      <img src={url} alt={`Imagem ${index + 1}`} className="w-full h-32 object-cover" />
                      <button type="button" onClick={() => removeExistingImage(url)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: T.textSub }}>Adicionar Novas Fotos</label>
              <label className="block cursor-pointer">
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                <div className="border-2 border-dashed rounded-2xl p-8 text-center transition-all hover:opacity-80" style={{ borderColor: T.border }}>
                  <Upload size={40} className="mx-auto mb-3" style={{ color: T.textDim }} />
                  <p className="text-sm font-medium mb-1" style={{ color: T.text }}>Clique para fazer upload</p>
                  <p className="text-xs" style={{ color: T.textDim }}>PNG, JPG, WebP até 50MB</p>
                </div>
              </label>
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {formData.images.map((file, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                      <img src={URL.createObjectURL(file)} alt={`Nova ${index + 1}`} className="w-full h-32 object-cover" />
                      <button type="button" onClick={() => removeNewImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={14} />
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
        <button type="button" onClick={handlePrev} disabled={currentStep === 1}
          className="flex items-center gap-2 h-11 px-6 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ border: `1px solid ${T.border}`, color: T.text, background: T.surface }}>
          <ArrowLeft size={20} /> Anterior
        </button>
        {currentStep < 4 ? (
          <button type="button" onClick={handleNext}
            className="flex items-center gap-2 h-11 px-6 rounded-xl font-medium text-white transition-colors"
            style={{ background: T.gold }}>
            Próximo <ArrowRight size={20} />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={isSubmitting}
            className="flex items-center gap-2 h-11 px-6 rounded-xl font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: '#6BB87B' }}>
            {isSubmitting ? <><Loader2 size={20} className="animate-spin" />Salvando...</> : <><Save size={20} />Salvar Alterações</>}
          </button>
        )}
      </div>
    </div>
  )
}
