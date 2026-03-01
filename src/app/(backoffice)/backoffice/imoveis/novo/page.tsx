'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    ArrowLeft, ArrowRight, Building2, MapPin, Ruler, Home,
    DollarSign, Image as ImageIcon, Upload, Check, Calendar,
    Briefcase, X, Save, Loader2, AlertCircle, Sparkles,
    BedDouble, Bath, Car, Maximize, Globe, Flag,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

/* ───────── Dark Theme Tokens ───────── */
const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    border: 'var(--bo-border)',
    hover: 'var(--bo-hover)',
    accent: '#486581',
    accentBg: 'rgba(26,26,46,0.10)',
    accentHover: 'rgba(26,26,46,0.18)',
    error: '#f87171',
    errorBg: 'rgba(248,113,113,0.08)',
    success: '#34d399',
    successBg: 'rgba(52,211,153,0.10)',
}

type Step = 1 | 2 | 3 | 4

interface Developer {
    id: string
    name: string
    logo_url?: string | null
}

interface FormData {
    // Step 1: Básico + localização
    name: string
    type: string
    country: string
    state: string
    city: string
    neighborhood: string
    address: string
    developer_id: string
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
    description: string

    // Step 4: Mídia
    images: File[]
    logo: File | null
}

const tiposImovel = [
    'Apartamento', 'Casa', 'Cobertura', 'Studio', 'Loft',
    'Terreno', 'Comercial', 'Flat', 'Penthouse', 'Villa',
]

const featuresOptions = [
    'Piscina', 'Academia', 'Salão de festas', 'Churrasqueira',
    'Playground', 'Quadra esportiva', 'Sauna', 'Espaço gourmet',
    'Coworking', 'Pet place', 'Brinquedoteca', 'Salão de jogos',
    'Cinema', 'Spa', 'Jardim', 'Portaria 24h', 'Segurança',
    'Elevador', 'Rooftop', 'Beach Service', 'Concierge',
]

/* ───────── Styled Components ───────── */
function Input({
    icon: Icon, value, onChange, placeholder, error, type = 'text', className = '',
}: {
    icon?: any; value: string; onChange: (v: string) => void;
    placeholder?: string; error?: string; type?: string; className?: string
}) {
    return (
        <div className={className}>
            <div className="relative">
                {Icon && (
                    <Icon
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                        size={18}
                        style={{ color: T.textMuted }}
                    />
                )}
                <input
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full h-11 rounded-xl text-sm outline-none transition-all"
                    style={{
                        paddingLeft: Icon ? 40 : 14,
                        paddingRight: 14,
                        background: T.surface,
                        border: `1px solid ${error ? T.error : T.border}`,
                        color: T.text,
                    }}
                />
            </div>
            {error && (
                <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: T.error }}>
                    <AlertCircle size={12} /> {error}
                </p>
            )}
        </div>
    )
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <label className="block text-xs font-semibold mb-2" style={{ color: T.textMuted }}>
            {children} {required && <span style={{ color: T.accent }}>*</span>}
        </label>
    )
}

function Select({
    value, onChange, options, placeholder, icon: Icon, error,
}: {
    value: string; onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string; icon?: any; error?: string
}) {
    return (
        <div>
            <div className="relative">
                {Icon && (
                    <Icon
                        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        size={18}
                        style={{ color: T.textMuted }}
                    />
                )}
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full h-11 rounded-xl text-sm outline-none appearance-none transition-all cursor-pointer"
                    style={{
                        paddingLeft: Icon ? 40 : 14,
                        paddingRight: 14,
                        background: T.surface,
                        border: `1px solid ${error ? T.error : T.border}`,
                        color: value ? T.text : T.textMuted,
                    }}
                >
                    <option value="">{placeholder || 'Selecione...'}</option>
                    {options.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            </div>
            {error && (
                <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: T.error }}>
                    <AlertCircle size={12} /> {error}
                </p>
            )}
        </div>
    )
}

/* ───────── Main Page ───────── */
export default function NovoImovelPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState<Step>(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [developers, setDevelopers] = useState<Developer[]>([])
    const [isParsingPdf, setIsParsingPdf] = useState(false)

    const [formData, setFormData] = useState<FormData>({
        name: '', type: '',
        country: 'Brasil', state: '', city: '', neighborhood: '',
        address: '', developer_id: '', developer: '',
        area: '', bedrooms: '', bathrooms: '', parking: '', floor: '',
        features: [],
        priceMin: '', priceMax: '', pricePerSqm: '',
        totalUnits: '', availableUnits: '', deliveryDate: '',
        description: '',
        images: [], logo: null,
    })

    /* Load developers from Supabase */
    useEffect(() => {
        supabase
            .from('developers')
            .select('id, name, logo_url')
            .order('name')
            .then(({ data }) => {
                if (data) setDevelopers(data)
            })
    }, [])

    /* ─── Handlers ─── */
    const handleChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
    }

    const handleDeveloperChange = (devId: string) => {
        const dev = developers.find(d => d.id === devId)
        setFormData(prev => ({
            ...prev,
            developer_id: devId,
            developer: dev?.name || '',
        }))
        if (errors.developer_id) setErrors(prev => ({ ...prev, developer_id: '' }))
    }

    const toggleFeature = (feature: string) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.includes(feature)
                ? prev.features.filter(f => f !== feature)
                : [...prev.features, feature],
        }))
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }))
    }

    const removeImage = (index: number) => {
        setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
    }

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) setFormData(prev => ({ ...prev, logo: file }))
    }

    /* ─── PDF Auto-fill ─── */
    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setIsParsingPdf(true)
        try {
            const fd = new FormData()
            fd.append('file', file)
            const res = await fetch('/api/imoveis/pdf-parse', { method: 'POST', body: fd })
            if (!res.ok) throw new Error('Falha ao processar PDF')
            const { data } = await res.json()
            setFormData(prev => ({
                ...prev,
                name: data.name || prev.name,
                type: data.type || prev.type,
                neighborhood: data.location || data.neighborhood || prev.neighborhood,
                address: data.address || prev.address,
                developer: data.developer || prev.developer,
                area: data.area?.toString() || prev.area,
                bedrooms: data.bedrooms?.toString() || prev.bedrooms,
                bathrooms: data.bathrooms?.toString() || prev.bathrooms,
                parking: data.parking?.toString() || prev.parking,
                features: Array.isArray(data.features)
                    ? Array.from(new Set([...prev.features, ...data.features]))
                    : prev.features,
            }))
            toast.success('PDF processado! Campos preenchidos automaticamente.')
        } catch (err: any) {
            toast.error('Erro ao ler PDF: ' + err.message)
        } finally {
            setIsParsingPdf(false)
        }
    }

    /* ─── Validation ─── */
    const validateStep = (step: Step): boolean => {
        const e: Record<string, string> = {}
        if (step === 1) {
            if (!formData.name.trim()) e.name = 'Nome é obrigatório'
            if (!formData.type) e.type = 'Tipo é obrigatório'
            if (!formData.city.trim()) e.city = 'Cidade é obrigatória'
            if (!formData.address.trim()) e.address = 'Endereço é obrigatório'
        }
        if (step === 2) {
            if (!formData.area) e.area = 'Área é obrigatória'
            if (!formData.bedrooms) e.bedrooms = 'Quartos é obrigatório'
        }
        if (step === 3) {
            if (!formData.priceMin) e.priceMin = 'Preço mínimo é obrigatório'
            if (!formData.priceMax) e.priceMax = 'Preço máximo é obrigatório'
        }
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(4, prev + 1) as Step)
        }
    }
    const handlePrev = () => setCurrentStep(prev => Math.max(1, prev - 1) as Step)

    /* ─── Submit ─── */
    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return
        setIsSubmitting(true)
        try {
            let imageUrls: string[] = []
            if (formData.images.length > 0) {
                toast.info(`Enviando ${formData.images.length} imagem(ns)...`)
                const { uploadMultipleFiles } = await import('@/lib/supabase-storage')
                const results = await uploadMultipleFiles(formData.images, 'developments', 'new')
                imageUrls = results.filter(r => !r.error).map(r => r.url)
                const fails = results.filter(r => r.error).length
                if (fails > 0) toast.warning(`${fails} imagem(ns) falharam`)
            }

            const payload = {
                name: formData.name,
                type: formData.type,
                country: formData.country || 'Brasil',
                state: formData.state,
                city: formData.city,
                location: formData.neighborhood,
                address: formData.address,
                developer: formData.developer || null,
                developer_id: formData.developer_id || null,
                area: formData.area,
                bedrooms: formData.bedrooms,
                bathrooms: formData.bathrooms,
                parking: formData.parking,
                floor: formData.floor,
                features: formData.features,
                priceMin: formData.priceMin,
                priceMax: formData.priceMax,
                pricePerSqm: formData.pricePerSqm,
                totalUnits: formData.totalUnits,
                availableUnits: formData.availableUnits,
                deliveryDate: formData.deliveryDate,
                description: formData.description,
                gallery_images: imageUrls,
                image: imageUrls[0] || null,
            }

            const res = await fetch('/api/developments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || 'Erro ao salvar')
            }

            toast.success('Empreendimento cadastrado com sucesso!')
            router.push('/backoffice/imoveis')
        } catch (err: any) {
            toast.error('Erro ao salvar: ' + err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatCurrency = (value: string) => {
        const nums = value.replace(/\D/g, '')
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency', currency: 'BRL', minimumFractionDigits: 0,
        }).format(Number(nums))
    }

    /* ─── Step Config ─── */
    const steps = [
        { number: 1, label: 'Básico', icon: Building2 },
        { number: 2, label: 'Características', icon: Home },
        { number: 3, label: 'Valores', icon: DollarSign },
        { number: 4, label: 'Mídia', icon: ImageIcon },
    ]
    const progress = (currentStep / 4) * 100

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* ── Header ── */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                >
                    <ArrowLeft size={18} style={{ color: T.text }} />
                </button>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>
                        Novo Empreendimento
                    </h1>
                    <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>
                        Passo {currentStep} de 4
                    </p>
                </div>
            </div>

            {/* ── Step Progress ── */}
            <div
                className="rounded-2xl p-5"
                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
            >
                <div className="flex items-center justify-between mb-4">
                    {steps.map((step, index) => {
                        const StepIcon = step.icon
                        const isActive = currentStep === step.number
                        const isDone = currentStep > step.number
                        return (
                            <div key={step.number} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div
                                        className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                                        style={{
                                            background: isDone ? T.successBg : isActive ? T.accentBg : T.surface,
                                            border: `1.5px solid ${isDone ? T.success : isActive ? T.accent : T.border}`,
                                        }}
                                    >
                                        {isDone ? (
                                            <Check size={20} style={{ color: T.success }} />
                                        ) : (
                                            <StepIcon size={20} style={{ color: isActive ? T.accent : T.textMuted }} />
                                        )}
                                    </div>
                                    <p
                                        className="text-[11px] font-semibold mt-1.5"
                                        style={{ color: isActive ? T.accent : isDone ? T.success : T.textMuted }}
                                    >
                                        {step.label}
                                    </p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className="h-[2px] flex-1 mx-3 rounded-full transition-all"
                                        style={{ background: currentStep > step.number ? T.success : T.border }}
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.surface }}>
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, background: T.accent }}
                    />
                </div>
            </div>

            {/* ── Form Card ── */}
            <div
                className="rounded-2xl p-6 sm:p-8"
                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
            >
                {/* ── STEP 1: Básico + Localização ── */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-base font-bold" style={{ color: T.text }}>
                                Informações Básicas
                            </h2>
                            {/* PDF Auto-fill */}
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
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                                    style={{
                                        background: T.accentBg,
                                        color: T.accent,
                                        border: `1px solid ${T.accent}40`,
                                    }}
                                >
                                    {isParsingPdf ? (
                                        <><Loader2 size={14} className="animate-spin" /> Extraindo...</>
                                    ) : (
                                        <><Sparkles size={14} /> Preencher via PDF</>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Nome */}
                            <div className="md:col-span-2">
                                <Label required>Nome do Empreendimento</Label>
                                <Input
                                    icon={Building2}
                                    value={formData.name}
                                    onChange={v => handleChange('name', v)}
                                    placeholder="Ex: Reserva Imperial"
                                    error={errors.name}
                                />
                            </div>

                            {/* Tipo */}
                            <div>
                                <Label required>Tipo de Imóvel</Label>
                                <Select
                                    icon={Home}
                                    value={formData.type}
                                    onChange={v => handleChange('type', v)}
                                    options={tiposImovel.map(t => ({ value: t, label: t }))}
                                    placeholder="Selecione o tipo..."
                                    error={errors.type}
                                />
                            </div>

                            {/* Construtora (dynamic from Supabase) */}
                            <div>
                                <Label>Construtora / Incorporadora</Label>
                                <Select
                                    icon={Briefcase}
                                    value={formData.developer_id}
                                    onChange={handleDeveloperChange}
                                    options={developers.map(d => ({ value: d.id, label: d.name }))}
                                    placeholder={developers.length === 0 ? 'Carregando...' : 'Selecione...'}
                                />
                            </div>
                        </div>

                        {/* ── Localização Internacional ── */}
                        <div className="pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                            <div className="flex items-center gap-2 mb-4">
                                <Globe size={16} style={{ color: T.accent }} />
                                <h3 className="text-sm font-bold" style={{ color: T.text }}>
                                    Localização
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* País */}
                                <div>
                                    <Label>País</Label>
                                    <Input
                                        icon={Flag}
                                        value={formData.country}
                                        onChange={v => handleChange('country', v)}
                                        placeholder="Brasil"
                                    />
                                </div>

                                {/* Estado */}
                                <div>
                                    <Label>Estado / Província</Label>
                                    <Input
                                        value={formData.state}
                                        onChange={v => handleChange('state', v)}
                                        placeholder="PE, FL, Dubai..."
                                    />
                                </div>

                                {/* Cidade */}
                                <div>
                                    <Label required>Cidade</Label>
                                    <Input
                                        value={formData.city}
                                        onChange={v => handleChange('city', v)}
                                        placeholder="Recife, Miami, Lisboa..."
                                        error={errors.city}
                                    />
                                </div>

                                {/* Bairro */}
                                <div>
                                    <Label>Bairro / Região</Label>
                                    <Input
                                        icon={MapPin}
                                        value={formData.neighborhood}
                                        onChange={v => handleChange('neighborhood', v)}
                                        placeholder="Boa Viagem, Brickell..."
                                    />
                                </div>
                            </div>

                            {/* Endereço */}
                            <div className="mt-4">
                                <Label required>Endereço Completo</Label>
                                <Input
                                    icon={MapPin}
                                    value={formData.address}
                                    onChange={v => handleChange('address', v)}
                                    placeholder="Av. Boa Viagem, 3500"
                                    error={errors.address}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: Características ── */}
                {currentStep === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-base font-bold mb-2" style={{ color: T.text }}>
                            Características do Imóvel
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div>
                                <Label required>Área Privativa (m²)</Label>
                                <Input
                                    icon={Ruler} type="number"
                                    value={formData.area}
                                    onChange={v => handleChange('area', v)}
                                    placeholder="95" error={errors.area}
                                />
                            </div>
                            <div>
                                <Label required>Quartos</Label>
                                <Input
                                    icon={BedDouble} type="number"
                                    value={formData.bedrooms}
                                    onChange={v => handleChange('bedrooms', v)}
                                    placeholder="3" error={errors.bedrooms}
                                />
                            </div>
                            <div>
                                <Label>Banheiros</Label>
                                <Input
                                    icon={Bath} type="number"
                                    value={formData.bathrooms}
                                    onChange={v => handleChange('bathrooms', v)}
                                    placeholder="2"
                                />
                            </div>
                            <div>
                                <Label>Vagas de Garagem</Label>
                                <Input
                                    icon={Car} type="number"
                                    value={formData.parking}
                                    onChange={v => handleChange('parking', v)}
                                    placeholder="2"
                                />
                            </div>
                            <div>
                                <Label>Andar</Label>
                                <Input
                                    icon={Maximize}
                                    value={formData.floor}
                                    onChange={v => handleChange('floor', v)}
                                    placeholder="8º ao 24º"
                                />
                            </div>
                        </div>

                        {/* Features Grid */}
                        <div className="pt-5" style={{ borderTop: `1px solid ${T.border}` }}>
                            <Label>Características do Condomínio</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-3">
                                {featuresOptions.map(feature => {
                                    const selected = formData.features.includes(feature)
                                    return (
                                        <button
                                            key={feature}
                                            type="button"
                                            onClick={() => toggleFeature(feature)}
                                            className="h-9 px-3 rounded-lg text-xs font-medium transition-all"
                                            style={{
                                                background: selected ? T.accentBg : T.surface,
                                                color: selected ? T.accent : T.textMuted,
                                                border: `1px solid ${selected ? T.accent : T.border}`,
                                            }}
                                        >
                                            {feature}
                                        </button>
                                    )
                                })}
                            </div>
                            <p className="text-[11px] mt-2" style={{ color: T.textMuted }}>
                                {formData.features.length} selecionada(s)
                            </p>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: Valores ── */}
                {currentStep === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-base font-bold mb-2" style={{ color: T.text }}>
                            Valores e Disponibilidade
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <Label required>Preço Mínimo (R$)</Label>
                                <Input
                                    icon={DollarSign} type="number"
                                    value={formData.priceMin}
                                    onChange={v => handleChange('priceMin', v)}
                                    placeholder="450000" error={errors.priceMin}
                                />
                                {formData.priceMin && (
                                    <p className="text-[11px] mt-1" style={{ color: T.textMuted }}>
                                        {formatCurrency(formData.priceMin)}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label required>Preço Máximo (R$)</Label>
                                <Input
                                    icon={DollarSign} type="number"
                                    value={formData.priceMax}
                                    onChange={v => handleChange('priceMax', v)}
                                    placeholder="680000" error={errors.priceMax}
                                />
                                {formData.priceMax && (
                                    <p className="text-[11px] mt-1" style={{ color: T.textMuted }}>
                                        {formatCurrency(formData.priceMax)}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label>Preço por m²</Label>
                                <Input
                                    type="number"
                                    value={formData.pricePerSqm}
                                    onChange={v => handleChange('pricePerSqm', v)}
                                    placeholder="7200"
                                />
                                {formData.pricePerSqm && (
                                    <p className="text-[11px] mt-1" style={{ color: T.textMuted }}>
                                        {formatCurrency(formData.pricePerSqm)}/m²
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label>Previsão de Entrega</Label>
                                <Input
                                    icon={Calendar} type="month"
                                    value={formData.deliveryDate}
                                    onChange={v => handleChange('deliveryDate', v)}
                                />
                            </div>
                            <div>
                                <Label>Total de Unidades</Label>
                                <Input
                                    type="number"
                                    value={formData.totalUnits}
                                    onChange={v => handleChange('totalUnits', v)}
                                    placeholder="120"
                                />
                            </div>
                            <div>
                                <Label>Unidades Disponíveis</Label>
                                <Input
                                    type="number"
                                    value={formData.availableUnits}
                                    onChange={v => handleChange('availableUnits', v)}
                                    placeholder="45"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                            <Label>Descrição do Empreendimento</Label>
                            <textarea
                                value={formData.description}
                                onChange={e => handleChange('description', e.target.value)}
                                placeholder="Descreva o empreendimento, diferenciais, localização estratégica..."
                                rows={4}
                                className="w-full rounded-xl text-sm outline-none resize-none p-4"
                                style={{
                                    background: T.surface,
                                    border: `1px solid ${T.border}`,
                                    color: T.text,
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* ── STEP 4: Mídia ── */}
                {currentStep === 4 && (
                    <div className="space-y-6">
                        <h2 className="text-base font-bold mb-2" style={{ color: T.text }}>
                            Imagens e Logo
                        </h2>

                        {/* Upload Imagens */}
                        <div>
                            <Label>Fotos do Empreendimento</Label>
                            <label className="block cursor-pointer">
                                <input
                                    type="file" multiple accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                <div
                                    className="rounded-2xl p-8 text-center transition-all hover:opacity-80"
                                    style={{
                                        border: `2px dashed ${T.border}`,
                                        background: T.surface,
                                    }}
                                >
                                    <Upload size={36} className="mx-auto mb-3" style={{ color: T.textMuted }} />
                                    <p className="text-sm font-semibold" style={{ color: T.text }}>
                                        Clique para fazer upload
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                                        PNG, JPG até 10MB (mínimo 5 fotos recomendado)
                                    </p>
                                </div>
                            </label>

                            {formData.images.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                                    {formData.images.map((file, i) => (
                                        <div key={i} className="relative group rounded-xl overflow-hidden">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Preview ${i + 1}`}
                                                className="w-full h-28 object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(i)}
                                                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                style={{ background: T.error }}
                                            >
                                                <X size={12} className="text-white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Upload Logo */}
                        <div>
                            <Label>Logo da Construtora</Label>
                            <label className="block cursor-pointer">
                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                <div
                                    className="rounded-xl p-6 text-center transition-all hover:opacity-80"
                                    style={{
                                        border: `2px dashed ${T.border}`,
                                        background: T.surface,
                                    }}
                                >
                                    {formData.logo ? (
                                        <div className="flex items-center justify-center gap-4">
                                            <img
                                                src={URL.createObjectURL(formData.logo)}
                                                alt="Logo"
                                                className="h-16 object-contain"
                                            />
                                            <button
                                                type="button"
                                                onClick={e => { e.preventDefault(); handleChange('logo', null) }}
                                                className="text-xs font-semibold"
                                                style={{ color: T.error }}
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <ImageIcon size={28} className="mx-auto mb-2" style={{ color: T.textMuted }} />
                                            <p className="text-xs" style={{ color: T.textMuted }}>
                                                Clique para upload do logo
                                            </p>
                                        </>
                                    )}
                                </div>
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Navigation Buttons ── */}
            <div className="flex items-center justify-between pb-8">
                <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                >
                    <ArrowLeft size={16} /> Anterior
                </button>

                {currentStep < 4 ? (
                    <button
                        type="button"
                        onClick={handleNext}
                        className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white transition-all"
                        style={{ background: T.accent }}
                    >
                        Próximo <ArrowRight size={16} />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                        style={{ background: T.success }}
                    >
                        {isSubmitting ? (
                            <><Loader2 size={16} className="animate-spin" /> Publicando...</>
                        ) : (
                            <><Save size={16} /> Publicar Empreendimento</>
                        )}
                    </button>
                )}
            </div>
        </div>
    )
}
