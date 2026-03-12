'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    ArrowLeft, ArrowRight, Building2, MapPin, Ruler, Home,
    DollarSign, Image as ImageIcon, Upload, Check, Calendar,
    Briefcase, X, Save, Loader2, AlertCircle, Sparkles,
    BedDouble, Bath, Car, Maximize, Globe, Flag, Star, FileText,
    Play, Link as LinkIcon, Cloud, CloudOff, Zap,
} from 'lucide-react'

/* ── YouTube helpers ── */
function getYoutubeId(url: string): string | null {
    const regexps = [
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
        /youtu\.be\/([a-zA-Z0-9_-]+)/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    ]
    for (const r of regexps) {
        const m = url.match(r)
        if (m) return m[1]
    }
    return null
}

function getYoutubeEmbedUrl(url: string): string | null {
    const id = getYoutubeId(url)
    return id ? `https://www.youtube.com/embed/${id}` : null
}
import { createClient } from '@/lib/supabase/client'
import { T } from '@/app/(backoffice)/lib/theme'

const supabase = createClient()

/* ───────── Dark Theme Tokens ───────── */
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
    condition: 'lancamento' | 'em_construcao' | 'pronto' | 'seminovo' | 'usado'
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

    // Step 3: Status
    status_commercial: string
    is_highlighted: boolean

    // Step 4: Mídia
    images: File[]
    logo: File | null
    floorPlans: File[]
    brochure: File | null
    videoUrl: string
    videoShort: string
}

/* ── Property type visual cards ── */
const PROPERTY_TYPES = [
    { value: 'Apartamento', label: 'Apartamento', icon: Building2, desc: 'Condomínio, residencial' },
    { value: 'Casa', label: 'Casa', icon: Home, desc: 'Unifamiliar, terreno' },
    { value: 'Cobertura', label: 'Cobertura', icon: Star, desc: 'Último andar, rooftop' },
    { value: 'Studio', label: 'Studio/Flat', icon: Maximize, desc: 'Compacto, investimento' },
    { value: 'Loft', label: 'Loft', icon: Globe, desc: 'Pé direito duplo' },
    { value: 'Terreno', label: 'Terreno/Lote', icon: Flag, desc: 'Loteamento, gleba' },
    { value: 'Comercial', label: 'Comercial', icon: Briefcase, desc: 'Sala, loja, andar' },
    { value: 'Villa', label: 'Villa/Resort', icon: Star, desc: 'Premium, resort' },
]

/* ── Condition options ── */
const CONDITION_OPTIONS = [
    { value: 'lancamento', label: '🚀 Lançamento', color: '#A78BFA' },
    { value: 'em_construcao', label: '🏗️ Em Construção', color: '#FBBF24' },
    { value: 'pronto', label: '✅ Pronto p/ Morar', color: '#4ADE80' },
    { value: 'seminovo', label: '⭐ Seminovo', color: '#F59E0B' },
    { value: 'usado', label: '🏠 Usado/Revenda', color: '#94A3B8' },
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
        condition: 'lancamento',
        country: 'Brasil', state: '', city: '', neighborhood: '',
        address: '', developer_id: '', developer: '',
        area: '', bedrooms: '', bathrooms: '', parking: '', floor: '',
        features: [],
        priceMin: '', priceMax: '', pricePerSqm: '',
        totalUnits: '', availableUnits: '', deliveryDate: '',
        description: '',
        status_commercial: 'published',
        is_highlighted: false,
        images: [], logo: null,
        floorPlans: [], brochure: null,
        videoUrl: '', videoShort: '',
    })
    const [draftSaved, setDraftSaved] = useState(false)
    const [hasDraft, setHasDraft] = useState(false)
    const [aiGenerating, setAiGenerating] = useState(false)

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

    const handleFloorPlanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        setFormData(prev => ({ ...prev, floorPlans: [...prev.floorPlans, ...files] }))
    }

    const removeFloorPlan = (index: number) => {
        setFormData(prev => ({ ...prev, floorPlans: prev.floorPlans.filter((_, i) => i !== index) }))
    }

    const handleBrochureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) setFormData(prev => ({ ...prev, brochure: file }))
    }

    const generateDescription = async () => {
        if (!formData.name && !formData.type) {
            toast.error('Preencha nome e tipo antes de gerar')
            return
        }
        setAiGenerating(true)
        try {
            const res = await fetch('/api/ai/generate-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    type: formData.type,
                    neighborhood: formData.neighborhood,
                    city: formData.city,
                    state: formData.state,
                    area: formData.area,
                    bedrooms: formData.bedrooms,
                    bathrooms: formData.bathrooms,
                    parking: formData.parking,
                    features: formData.features,
                    priceMin: formData.priceMin,
                    deliveryDate: formData.deliveryDate,
                }),
            })
            const data = await res.json()
            if (data.description) {
                handleChange('description', data.description)
                toast.success('Descrição gerada com IA!')
            } else {
                toast.error(data.error || 'Erro ao gerar descrição')
            }
        } catch {
            toast.error('Erro de conexão')
        } finally {
            setAiGenerating(false)
        }
    }

    const setMainImage = (index: number) => {
        setFormData(prev => {
            const imgs = [...prev.images]
            const [main] = imgs.splice(index, 1)
            return { ...prev, images: [main, ...imgs] }
        })
    }

    /* ─── Auto-save draft (text fields only) ─── */
    useEffect(() => {
        const existing = localStorage.getItem('imi-draft-imovel')
        if (existing) setHasDraft(true)
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            const draft = {
                name: formData.name, type: formData.type,
                condition: formData.condition,
                country: formData.country, state: formData.state,
                city: formData.city, neighborhood: formData.neighborhood,
                address: formData.address,
                developer_id: formData.developer_id, developer: formData.developer,
                area: formData.area, bedrooms: formData.bedrooms,
                bathrooms: formData.bathrooms, parking: formData.parking, floor: formData.floor,
                features: formData.features,
                priceMin: formData.priceMin, priceMax: formData.priceMax,
                pricePerSqm: formData.pricePerSqm, totalUnits: formData.totalUnits,
                availableUnits: formData.availableUnits, deliveryDate: formData.deliveryDate,
                description: formData.description,
                status_commercial: formData.status_commercial,
                is_highlighted: formData.is_highlighted,
                videoUrl: formData.videoUrl, videoShort: formData.videoShort,
            }
            if (Object.values(draft).some(v => v && v !== 'Brasil' && v !== 'lancamento' && (typeof v === 'boolean' ? v : typeof v === 'string' ? v.trim() : Array.isArray(v) ? v.length > 0 : false))) {
                localStorage.setItem('imi-draft-imovel', JSON.stringify(draft))
                setDraftSaved(true)
                setTimeout(() => setDraftSaved(false), 2000)
            }
        }, 3000)
        return () => clearTimeout(timer)
    }, [formData])

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

    /* ─── Draft restore ─── */
    const restoreDraft = () => {
        const raw = localStorage.getItem('imi-draft-imovel')
        if (!raw) return
        try {
            const draft = JSON.parse(raw)
            setFormData(prev => ({ ...prev, ...draft }))
            setHasDraft(false)
            toast.success('Rascunho restaurado!')
        } catch { }
    }

    const discardDraft = () => {
        localStorage.removeItem('imi-draft-imovel')
        setHasDraft(false)
    }

    /* ─── Quick mode — jump to step 3 ─── */
    const handleModoRapido = () => {
        // Save whatever is in the draft so far
        const draft = {
            name: formData.name, type: formData.type,
            condition: formData.condition,
            country: formData.country, state: formData.state,
            city: formData.city, neighborhood: formData.neighborhood,
            address: formData.address,
            developer_id: formData.developer_id, developer: formData.developer,
            area: formData.area, bedrooms: formData.bedrooms,
            bathrooms: formData.bathrooms, parking: formData.parking, floor: formData.floor,
            features: formData.features,
            priceMin: formData.priceMin, priceMax: formData.priceMax,
            pricePerSqm: formData.pricePerSqm, totalUnits: formData.totalUnits,
            availableUnits: formData.availableUnits, deliveryDate: formData.deliveryDate,
            description: formData.description,
            status_commercial: formData.status_commercial,
            is_highlighted: formData.is_highlighted,
            videoUrl: formData.videoUrl, videoShort: formData.videoShort,
        }
        localStorage.setItem('imi-draft-imovel', JSON.stringify(draft))
        setCurrentStep(3)
        toast.success('Modo Rápido ativado — direto aos Valores!')
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
            const { uploadMultipleFiles, uploadFile } = await import('@/lib/supabase-storage')

            let imageUrls: string[] = []
            if (formData.images.length > 0) {
                toast.info(`Enviando ${formData.images.length} foto(s)...`)
                const results = await uploadMultipleFiles(formData.images, 'media', 'developments/gallery')
                imageUrls = results.filter(r => !r.error).map(r => r.url)
                const fails = results.filter(r => r.error).length
                if (fails > 0) toast.warning(`${fails} foto(s) falharam`)
            }

            let floorPlanUrls: string[] = []
            if (formData.floorPlans.length > 0) {
                toast.info(`Enviando ${formData.floorPlans.length} planta(s)...`)
                const results = await uploadMultipleFiles(formData.floorPlans, 'media', 'developments/plantas')
                floorPlanUrls = results.filter(r => !r.error).map(r => r.url)
            }

            let brochureUrl: string | null = null
            if (formData.brochure) {
                toast.info('Enviando brochure...')
                const result = await uploadFile(formData.brochure, 'media', 'developments/brochures')
                if (!result.error) brochureUrl = result.url
            }

            const payload = {
                name: formData.name,
                type: formData.type,
                condition: formData.condition,
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
                status_commercial: formData.status_commercial,
                is_highlighted: formData.is_highlighted,
                gallery_images: imageUrls,
                image: imageUrls[0] || null,
                floor_plans: floorPlanUrls,
                brochure_url: brochureUrl,
                video_url: formData.videoUrl || null,
                video_short_url: formData.videoShort || null,
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

            localStorage.removeItem('imi-draft-imovel')
            toast.success('Empreendimento cadastrado com sucesso!')
            router.push('/backoffice/imoveis')
        } catch (err: any) {
            toast.error('Erro ao salvar: ' + err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const getCurrencyConfig = () => {
        const c = formData.country.toLowerCase()
        if (c.includes('usa') || c.includes('united states') || c.includes('estados unidos') || c.includes('eua')) return { code: 'USD', locale: 'en-US', symbol: 'US$' }
        if (c.includes('saudi') || c.includes('arabia') || c.includes('saudita') || c.includes('ksa')) return { code: 'SAR', locale: 'ar-SA', symbol: 'SAR' }
        return { code: 'BRL', locale: 'pt-BR', symbol: 'R$' }
    }

    const formatCurrency = (value: string) => {
        const nums = value.replace(/\D/g, '')
        const { code, locale } = getCurrencyConfig()
        return new Intl.NumberFormat(locale, {
            style: 'currency', currency: code, minimumFractionDigits: 0,
        }).format(Number(nums))
    }

    /* ─── Step Config ─── */
    const steps = [
        { number: 1, label: 'Tipo', icon: Building2 },
        { number: 2, label: 'Dados', icon: Home },
        { number: 3, label: 'Valores', icon: DollarSign },
        { number: 4, label: 'Fotos', icon: ImageIcon },
    ]
    const progress = (currentStep / 4) * 100

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* ── Draft restore banner ── */}
            {hasDraft && (
                <div
                    className="flex items-center justify-between px-5 py-3 rounded-2xl"
                    style={{ background: T.accentBg, border: `1px solid ${T.accent}40` }}
                >
                    <div className="flex items-center gap-2">
                        <Cloud size={16} style={{ color: T.accent }} />
                        <span className="text-sm font-medium" style={{ color: T.text }}>
                            Você tem um rascunho não enviado.
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={restoreDraft}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg"
                            style={{ background: T.accent, color: 'white' }}
                        >
                            Restaurar
                        </button>
                        <button
                            onClick={discardDraft}
                            className="text-xs font-medium"
                            style={{ color: T.textMuted }}
                        >
                            Descartar
                        </button>
                    </div>
                </div>
            )}

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
                                        {step.number} {step.label}
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
                {/* ── STEP 1: Tipo + Condição + Localização ── */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        {/* Modo Rápido alert */}
                        <div
                            className="flex items-center justify-between px-4 py-3 rounded-xl"
                            style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}
                        >
                            <p className="text-xs" style={{ color: T.textMuted }}>
                                Tem pressa? Pule direto para os valores e publique em segundos.
                            </p>
                            <button
                                type="button"
                                onClick={handleModoRapido}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ml-3 flex-shrink-0 transition-all hover:opacity-80"
                                style={{ background: '#A78BFA22', color: '#A78BFA', border: '1px solid #A78BFA44' }}
                            >
                                <Zap size={12} /> Modo Rápido
                            </button>
                        </div>

                        {/* PDF Auto-fill card */}
                        <div
                            className="relative overflow-hidden rounded-2xl p-5"
                            style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.18)' }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold" style={{ color: T.text }}>
                                        Preencha automaticamente com PDF do empreendimento ⚡
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                                        Faça upload do material e a IA extrai nome, tipo, localização e características
                                    </p>
                                </div>
                                <div className="relative flex-shrink-0 ml-4">
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
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                                        style={{
                                            background: 'rgba(96,165,250,0.15)',
                                            color: '#60A5FA',
                                            border: '1px solid rgba(96,165,250,0.3)',
                                        }}
                                    >
                                        {isParsingPdf ? (
                                            <><Loader2 size={14} className="animate-spin" /> Extraindo...</>
                                        ) : (
                                            <><Sparkles size={14} /> Enviar PDF</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Type visual card grid */}
                        <div>
                            <Label required>Tipo de Imóvel</Label>
                            {errors.type && (
                                <p className="mb-2 text-xs flex items-center gap-1" style={{ color: T.error }}>
                                    <AlertCircle size={12} /> {errors.type}
                                </p>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {PROPERTY_TYPES.map(pt => {
                                    const Icon = pt.icon
                                    const isSelected = formData.type === pt.value
                                    return (
                                        <button
                                            key={pt.value}
                                            type="button"
                                            onClick={() => handleChange('type', pt.value)}
                                            className="flex flex-col items-start gap-1.5 p-4 rounded-xl text-left transition-all hover:opacity-90"
                                            style={{
                                                background: isSelected ? 'rgba(96,165,250,0.12)' : T.surface,
                                                border: `1.5px solid ${isSelected ? '#60A5FA' : T.border}`,
                                            }}
                                        >
                                            <Icon
                                                size={22}
                                                style={{ color: isSelected ? '#60A5FA' : T.textMuted }}
                                            />
                                            <span
                                                className="text-sm font-semibold leading-tight"
                                                style={{ color: isSelected ? '#60A5FA' : T.text }}
                                            >
                                                {pt.label}
                                            </span>
                                            <span
                                                className="text-[11px] leading-tight"
                                                style={{ color: T.textMuted }}
                                            >
                                                {pt.desc}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Condition toggle row */}
                        <div>
                            <Label>Estado do Imóvel</Label>
                            <div className="flex flex-wrap gap-2">
                                {CONDITION_OPTIONS.map(opt => {
                                    const isSelected = formData.condition === opt.value
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleChange('condition', opt.value)}
                                            className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
                                            style={{
                                                background: isSelected ? opt.color + '22' : T.surface,
                                                color: isSelected ? opt.color : T.textMuted,
                                                border: `1.5px solid ${isSelected ? opt.color : T.border}`,
                                            }}
                                        >
                                            {opt.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Name + Developer */}
                        <div className="pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
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

                                {/* Construtora (dynamic from Supabase) */}
                                <div className="md:col-span-2">
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
                                <Label required>Preço Mínimo ({getCurrencyConfig().symbol})</Label>
                                <Input
                                    icon={DollarSign} type="number"
                                    value={formData.priceMin}
                                    onChange={v => handleChange('priceMin', v)}
                                    placeholder={getCurrencyConfig().code === 'BRL' ? '450000' : getCurrencyConfig().code === 'USD' ? '250000' : '937500'}
                                    error={errors.priceMin}
                                />
                                {formData.priceMin && (
                                    <p className="text-[11px] mt-1" style={{ color: T.textMuted }}>
                                        {formatCurrency(formData.priceMin)}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label required>Preço Máximo ({getCurrencyConfig().symbol})</Label>
                                <Input
                                    icon={DollarSign} type="number"
                                    value={formData.priceMax}
                                    onChange={v => handleChange('priceMax', v)}
                                    placeholder={getCurrencyConfig().code === 'BRL' ? '680000' : getCurrencyConfig().code === 'USD' ? '450000' : '1687500'}
                                    error={errors.priceMax}
                                />
                                {formData.priceMax && (
                                    <p className="text-[11px] mt-1" style={{ color: T.textMuted }}>
                                        {formatCurrency(formData.priceMax)}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label>Preço por m² ({getCurrencyConfig().symbol})</Label>
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
                            <div>
                                <Label>Visibilidade</Label>
                                <Select
                                    value={formData.status_commercial}
                                    onChange={v => handleChange('status_commercial', v)}
                                    options={[
                                        { value: 'published', label: 'Publicado (visível no site)' },
                                        { value: 'draft', label: 'Rascunho (oculto)' },
                                        { value: 'campaign', label: 'Campanha' },
                                        { value: 'private', label: 'Privado' },
                                        { value: 'sold', label: 'Vendido' },
                                    ]}
                                    placeholder="Status de publicação"
                                />
                            </div>
                        </div>

                        {/* Price hint */}
                        {formData.neighborhood && (
                            <div className="rounded-xl p-3" style={{ background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.15)' }}>
                                <p className="text-[11px]" style={{ color: T.textMuted }}>
                                    💡 Imóveis similares em <strong style={{ color: T.text }}>{formData.neighborhood}</strong>: consulte o mercado para precificação ideal.
                                </p>
                            </div>
                        )}

                        {/* Destaque na Home */}
                        <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: formData.is_highlighted ? 'rgba(245,158,11,0.15)' : T.elevated }}>
                                    <Star size={16} style={{ color: formData.is_highlighted ? '#f59e0b' : T.textMuted }} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: T.text }}>Destaque na Página Inicial</p>
                                    <p className="text-xs" style={{ color: T.textMuted }}>Aparece na seção "Empreendimentos em Destaque" do site público</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleChange('is_highlighted', !formData.is_highlighted)}
                                className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
                                style={{ background: formData.is_highlighted ? '#f59e0b' : T.border }}
                            >
                                <div
                                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                                    style={{ left: formData.is_highlighted ? '22px' : '2px' }}
                                />
                            </button>
                        </div>

                        {/* Description */}
                        <div className="pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                            <div className="flex items-center justify-between mb-2">
                                <Label>Descrição do Empreendimento</Label>
                                <button
                                    type="button"
                                    onClick={generateDescription}
                                    disabled={aiGenerating}
                                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all disabled:opacity-60"
                                    style={{ background: T.accentBg, color: T.accent, border: `1px solid ${T.accent}40` }}
                                >
                                    {aiGenerating
                                        ? <Loader2 size={12} className="animate-spin" />
                                        : <Sparkles size={12} />}
                                    {aiGenerating ? 'Gerando...' : 'Gerar com IA'}
                                </button>
                            </div>
                            <textarea
                                value={formData.description}
                                onChange={e => handleChange('description', e.target.value)}
                                placeholder="Descreva o empreendimento, ou clique em 'Gerar com IA' para criar automaticamente..."
                                rows={5}
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
                    <div className="space-y-8">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-base font-bold" style={{ color: T.text }}>
                                Mídia do Empreendimento
                            </h2>
                            {/* Auto-save indicator */}
                            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: draftSaved ? T.success : T.textMuted }}>
                                {draftSaved ? <><Cloud size={13} /> Salvo</> : <><CloudOff size={13} /> Rascunho automático</>}
                            </div>
                        </div>

                        {/* ── Fotos ── */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label>Fotos do Empreendimento</Label>
                                {formData.images.length > 0 && (
                                    <span className="text-[11px]" style={{ color: T.textMuted }}>
                                        ★ = imagem de capa
                                    </span>
                                )}
                            </div>
                            <label className="block cursor-pointer">
                                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                                <div
                                    className="rounded-2xl p-7 text-center transition-all hover:opacity-80"
                                    style={{ border: `2px dashed ${T.border}`, background: T.surface }}
                                >
                                    <Upload size={32} className="mx-auto mb-2" style={{ color: T.textMuted }} />
                                    <p className="text-sm font-semibold" style={{ color: T.text }}>
                                        Clique para adicionar fotos
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                                        PNG, JPG, WebP — mínimo 5 fotos recomendado
                                    </p>
                                </div>
                            </label>

                            {formData.images.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                                    {formData.images.map((file, i) => (
                                        <div key={i} className="relative group rounded-xl overflow-hidden">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Foto ${i + 1}`}
                                                className="w-full h-28 object-cover"
                                            />
                                            {/* Star = main image */}
                                            <button
                                                type="button"
                                                onClick={() => setMainImage(i)}
                                                className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center transition-all"
                                                style={{ background: i === 0 ? '#f59e0b' : 'rgba(0,0,0,0.5)' }}
                                                title={i === 0 ? 'Capa atual' : 'Definir como capa'}
                                            >
                                                <Star size={11} fill={i === 0 ? 'white' : 'none'} className="text-white" />
                                            </button>
                                            {/* Delete */}
                                            <button
                                                type="button"
                                                onClick={() => removeImage(i)}
                                                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center touch-always-visible opacity-0 group-hover:opacity-100 transition-opacity"
                                                style={{ background: T.error }}
                                            >
                                                <X size={11} className="text-white" />
                                            </button>
                                            {i === 0 && (
                                                <div className="absolute bottom-0 inset-x-0 text-[10px] font-bold text-center py-0.5"
                                                    style={{ background: 'rgba(245,158,11,0.85)', color: 'white' }}>
                                                    CAPA
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Vídeo YouTube ── */}
                        <div className="pt-6" style={{ borderTop: `1px solid ${T.border}` }}>
                            <Label>Vídeo Principal (YouTube)</Label>
                            <Input
                                icon={Play}
                                value={formData.videoUrl}
                                onChange={v => handleChange('videoUrl', v)}
                                placeholder="https://youtube.com/watch?v=... ou youtu.be/..."
                            />
                            {formData.videoUrl && getYoutubeEmbedUrl(formData.videoUrl) && (
                                <div className="mt-3 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                                    <iframe
                                        src={getYoutubeEmbedUrl(formData.videoUrl)!}
                                        className="w-full h-full"
                                        allowFullScreen
                                        title="Preview vídeo"
                                    />
                                </div>
                            )}
                            {formData.videoUrl && !getYoutubeEmbedUrl(formData.videoUrl) && (
                                <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: T.error }}>
                                    <AlertCircle size={12} /> URL do YouTube inválida
                                </p>
                            )}
                        </div>

                        {/* ── Short / Reels ── */}
                        <div>
                            <Label>Short / Reels (YouTube Shorts)</Label>
                            <Input
                                icon={LinkIcon}
                                value={formData.videoShort}
                                onChange={v => handleChange('videoShort', v)}
                                placeholder="https://youtube.com/shorts/..."
                            />
                        </div>

                        {/* ── Plantas ── */}
                        <div className="pt-6" style={{ borderTop: `1px solid ${T.border}` }}>
                            <Label>Plantas do Imóvel</Label>
                            <label className="block cursor-pointer">
                                <input type="file" multiple accept="image/*" onChange={handleFloorPlanUpload} className="hidden" />
                                <div
                                    className="rounded-xl p-6 text-center transition-all hover:opacity-80"
                                    style={{ border: `2px dashed ${T.border}`, background: T.surface }}
                                >
                                    <ImageIcon size={28} className="mx-auto mb-2" style={{ color: T.textMuted }} />
                                    <p className="text-sm font-semibold" style={{ color: T.text }}>
                                        Adicionar plantas
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                                        PNG, JPG — planta tipo, cobertura, subsolo
                                    </p>
                                </div>
                            </label>
                            {formData.floorPlans.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                                    {formData.floorPlans.map((file, i) => (
                                        <div key={i} className="relative group rounded-xl overflow-hidden">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Planta ${i + 1}`}
                                                className="w-full h-28 object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeFloorPlan(i)}
                                                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center touch-always-visible opacity-0 group-hover:opacity-100 transition-opacity"
                                                style={{ background: T.error }}
                                            >
                                                <X size={11} className="text-white" />
                                            </button>
                                            <div className="absolute bottom-0 inset-x-0 text-[10px] font-bold text-center py-0.5 truncate px-2"
                                                style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                                                {file.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Brochure PDF ── */}
                        <div>
                            <Label>Brochure / Material Digital (PDF)</Label>
                            <label className="block cursor-pointer">
                                <input type="file" accept=".pdf,image/*" onChange={handleBrochureUpload} className="hidden" />
                                <div
                                    className="rounded-xl p-5 transition-all hover:opacity-80"
                                    style={{ border: `2px dashed ${T.border}`, background: T.surface }}
                                >
                                    {formData.brochure ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ background: T.accentBg }}>
                                                <FileText size={20} style={{ color: T.accent }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate" style={{ color: T.text }}>
                                                    {formData.brochure.name}
                                                </p>
                                                <p className="text-xs" style={{ color: T.textMuted }}>
                                                    {(formData.brochure.size / 1024 / 1024).toFixed(1)} MB
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={e => { e.preventDefault(); handleChange('brochure', null) }}
                                                className="text-xs font-semibold flex-shrink-0"
                                                style={{ color: T.error }}
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <FileText size={24} style={{ color: T.textMuted }} />
                                            <div>
                                                <p className="text-sm font-semibold" style={{ color: T.text }}>
                                                    Clique para adicionar brochure
                                                </p>
                                                <p className="text-xs" style={{ color: T.textMuted }}>
                                                    PDF, PNG — será disponibilizado no site
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </label>
                        </div>

                        {/* ── Logo da Construtora ── */}
                        <div className="pt-6" style={{ borderTop: `1px solid ${T.border}` }}>
                            <Label>Logo da Construtora (sobreposto ao imóvel)</Label>
                            <label className="block cursor-pointer">
                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                <div
                                    className="rounded-xl p-5 text-center transition-all hover:opacity-80"
                                    style={{ border: `2px dashed ${T.border}`, background: T.surface }}
                                >
                                    {formData.logo ? (
                                        <div className="flex items-center justify-center gap-4">
                                            <img src={URL.createObjectURL(formData.logo)} alt="Logo" className="h-14 object-contain" />
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
                                            <ImageIcon size={24} className="mx-auto mb-1.5" style={{ color: T.textMuted }} />
                                            <p className="text-xs" style={{ color: T.textMuted }}>
                                                Upload do logo da construtora
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
            <div className="flex items-center justify-between pb-32 lg:pb-8">
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
