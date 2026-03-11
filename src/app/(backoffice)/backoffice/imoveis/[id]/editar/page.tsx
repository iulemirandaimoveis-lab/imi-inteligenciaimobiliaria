'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft, Building2, MapPin, Ruler, Home, DollarSign,
  Image as ImageIcon, Upload, Check, Calendar, Save,
  Loader2, AlertCircle, BedDouble, Bath, Car, Sparkles, Star,
  Play, FileText, X, CheckCircle, Globe, Eye, Zap, Link as LinkIcon, GripVertical,
} from 'lucide-react'
import Image from 'next/image'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { uploadFile, uploadMultipleFiles } from '@/lib/supabase-storage'
import { T } from '@/app/(backoffice)/lib/theme'

/* ── helpers ── */
function getYoutubeId(url: string): string | null {
  const regexps = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  ]
  for (const r of regexps) { const m = url.match(r); if (m) return m[1] }
  return null
}
function getYoutubeEmbedUrl(url: string): string | null {
  const id = getYoutubeId(url); return id ? `https://www.youtube.com/embed/${id}` : null
}

const TABS = [
  { id: 'basico',        label: 'Básico',           icon: Building2,  desc: 'Nome, tipo, status' },
  { id: 'detalhes',      label: 'Características',  icon: Home,       desc: 'Área, quartos, amenities' },
  { id: 'valores',       label: 'Valores',           icon: DollarSign, desc: 'Preço, disponibilidade' },
  { id: 'midia',         label: 'Mídia',             icon: ImageIcon,  desc: 'Fotos, vídeos, planta' },
] as const
type TabId = typeof TABS[number]['id']

const tiposImovel = ['Apartamento', 'Casa', 'Cobertura', 'Studio', 'Loft', 'Terreno', 'Comercial', 'Empreendimento', 'Flat', 'Penthouse', 'Villa']
const dbTypeToForm: Record<string, string> = {
  apartamento: 'Apartamento', apartment: 'Apartamento', casa: 'Casa', house: 'Casa',
  flat: 'Flat', lote: 'Terreno', land: 'Terreno', comercial: 'Comercial', commercial: 'Comercial',
  resort: 'Villa', penthouse: 'Penthouse', studio: 'Studio', mixed: 'Empreendimento',
}
const featuresOptions = [
  'Piscina', 'Academia', 'Salão de festas', 'Churrasqueira', 'Playground', 'Quadra esportiva',
  'Sauna', 'Espaço gourmet', 'Coworking', 'Pet place', 'Brinquedoteca', 'Salão de jogos',
  'Cinema', 'Spa', 'Jardim', 'Portaria 24h', 'Segurança', 'Elevador',
]

interface FormData {
  name: string; type: string; location: string; address: string
  developer: string; developer_id: string; description: string
  area: string; bedrooms: string; bathrooms: string; parking: string; floor: string
  features: string[]; priceMin: string; priceMax: string; pricePerSqm: string
  totalUnits: string; availableUnits: string; deliveryDate: string
  images: File[]; existingImages: string[]; existingFloorPlans: string[]
  floorPlans: File[]; existingBrochure: string; brochure: File | null
  logo: File | null; existingLogo: string
  status: string; status_commercial: string; is_highlighted: boolean
  videoUrl: string; videoShort: string; virtualTourUrl: string
}

const INITIAL: FormData = {
  name: '', type: '', location: '', address: '', developer: '', developer_id: '',
  description: '', area: '', bedrooms: '', bathrooms: '', parking: '', floor: '',
  features: [], priceMin: '', priceMax: '', pricePerSqm: '', totalUnits: '',
  availableUnits: '', deliveryDate: '', images: [], existingImages: [],
  existingFloorPlans: [], floorPlans: [], existingBrochure: '', brochure: null,
  logo: null, existingLogo: '', status: 'disponivel', status_commercial: 'draft',
  is_highlighted: false, videoUrl: '', videoShort: '', virtualTourUrl: '',
}

/* ── Sortable Image Item ── */
function SortableImageItem({
  url, index, onSetCover, onRemove,
}: { url: string; index: number; onSetCover: () => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  return (
    <div ref={setNodeRef} style={style}
      className="relative group rounded-xl overflow-hidden"
      {...attributes}>
      <div className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing w-6 h-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'rgba(0,0,0,0.6)' }} {...listeners}>
        <GripVertical size={12} color="white" />
      </div>
      <Image src={url} alt={`img ${index}`} width={200} height={120}
        className="w-full h-28 object-cover"
        style={{ border: `1px solid ${T.border}`, borderRadius: '0.75rem' }} />
      {index === 0 && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: T.accent, color: 'white' }}>Capa</div>
      )}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-2 pb-2">
        {index > 0 && (
          <button onClick={onSetCover}
            className="text-[10px] px-2 py-1 rounded-lg font-medium" style={{ background: T.accent, color: 'white' }}>
            Capa
          </button>
        )}
        <button onClick={onRemove}
          className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#EF444480' }}>
          <X size={14} color="white" />
        </button>
      </div>
    </div>
  )
}

export default function EditarImovelPage() {
  const router = useRouter()
  const params = useParams()
  const [activeTab, setActiveTab] = useState<TabId>('basico')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [formData, setFormData] = useState<FormData>(INITIAL)

  /* Load */
  useEffect(() => {
    if (!params.id) return
    ;(async () => {
      try {
        const res = await fetch(`/api/developments?id=${params.id}`)
        if (!res.ok) throw new Error('Erro ao carregar')
        const d = await res.json()
        const galleryImgs = Array.isArray(d.gallery_images) ? d.gallery_images :
          (Array.isArray(d.images) && typeof d.images[0] === 'string' ? d.images : [])
        setFormData({
          name: d.name || '', type: dbTypeToForm[d.tipo] || dbTypeToForm[d.property_type] || dbTypeToForm[d.type] || d.tipo || '',
          location: d.neighborhood || d.region || '', address: d.address || '',
          developer: d.developer || d.developers?.name || '', developer_id: d.developer_id || '',
          description: d.description || '', area: d.private_area?.toString() || d.area_from?.toString() || '',
          bedrooms: d.bedrooms?.toString() || '', bathrooms: d.bathrooms?.toString() || '',
          parking: d.parking_spaces?.toString() || '', floor: d.floor_count?.toString() || '',
          features: Array.isArray(d.features) ? d.features : [],
          priceMin: d.price_min?.toString() || d.price_from?.toString() || '',
          priceMax: d.price_max?.toString() || d.price_to?.toString() || '',
          pricePerSqm: d.price_per_sqm?.toString() || '',
          totalUnits: d.units_count?.toString() || d.total_units?.toString() || '',
          availableUnits: d.available_units?.toString() || '',
          deliveryDate: d.delivery_date ? d.delivery_date.substring(0, 7) : '',
          images: [], existingImages: galleryImgs,
          existingFloorPlans: Array.isArray(d.floor_plans) ? d.floor_plans : [],
          floorPlans: [], existingBrochure: d.brochure_url || '', brochure: null,
          logo: null, existingLogo: d.developers?.logo_url || '',
          status: d.status || 'disponivel', status_commercial: d.status_commercial || d.status_comercial || 'draft',
          is_highlighted: !!d.is_highlighted, videoUrl: d.video_url || '', videoShort: d.video_short_url || '',
          virtualTourUrl: d.virtual_tour_url || '',
        })
      } catch (err: any) {
        toast.error('Erro ao carregar dados do empreendimento')
      } finally { setIsLoading(false) }
    })()
  }, [params.id])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = formData.existingImages.indexOf(active.id as string)
      const newIndex = formData.existingImages.indexOf(over.id as string)
      set('existingImages', arrayMove(formData.existingImages, oldIndex, newIndex))
    }
  }

  const set = (field: keyof FormData, value: any) => setFormData(p => ({ ...p, [field]: value }))
  const toggleFeature = (f: string) => set('features', formData.features.includes(f) ? formData.features.filter(x => x !== f) : [...formData.features, f])

  const generateDescription = async () => {
    setAiGenerating(true)
    try {
      const res = await fetch('/api/ai/generate-description', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, type: formData.type, neighborhood: formData.location, area: formData.area, bedrooms: formData.bedrooms, bathrooms: formData.bathrooms, parking: formData.parking, features: formData.features, priceMin: formData.priceMin, deliveryDate: formData.deliveryDate }),
      })
      const data = await res.json()
      if (data.description) { set('description', data.description); toast.success('Descrição gerada com IA!') }
      else toast.error(data.error || 'Erro ao gerar')
    } catch { toast.error('Erro de conexão') }
    finally { setAiGenerating(false) }
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error('Nome é obrigatório'); setActiveTab('basico'); return }
    setIsSubmitting(true)
    try {
      let newImageUrls: string[] = []
      if (formData.images.length > 0) {
        toast.info(`Enviando ${formData.images.length} imagem(ns)...`)
        const r = await uploadMultipleFiles(formData.images, 'developments', `${params.id}`)
        newImageUrls = r.filter(x => !x.error).map(x => x.url)
        const failed = r.filter(x => x.error).length
        if (failed > 0) toast.warning(`${failed} imagem(ns) falharam`)
      }
      let newFpUrls: string[] = []
      if (formData.floorPlans.length > 0) {
        const r = await uploadMultipleFiles(formData.floorPlans, 'developments', 'plantas')
        newFpUrls = r.filter(x => !x.error).map(x => x.url)
      }
      let brochureUrl: string | null = formData.existingBrochure || null
      if (formData.brochure) {
        const r = await uploadFile(formData.brochure, 'media', 'developments/brochures')
        if (!r.error) brochureUrl = r.url
      }
      const allImages = [...formData.existingImages, ...newImageUrls]
      const res = await fetch('/api/developments', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: params.id, name: formData.name, type: formData.type,
          neighborhood: formData.location || null, address: formData.address || null,
          developer: formData.developer || null, developer_id: formData.developer_id || null,
          description: formData.description || null,
          private_area: Number(formData.area) || null, bedrooms: Number(formData.bedrooms) || null,
          bathrooms: Number(formData.bathrooms) || null, parking_spaces: Number(formData.parking) || null,
          floor_count: Number(formData.floor) || null, features: formData.features,
          price_min: Number(formData.priceMin) || null, price_max: Number(formData.priceMax) || null,
          price_from: Number(formData.priceMin) || null, price_to: Number(formData.priceMax) || null,
          price_per_sqm: Number(formData.pricePerSqm) || null,
          units_count: Number(formData.totalUnits) || null, available_units: Number(formData.availableUnits) || null,
          delivery_date: formData.deliveryDate ? new Date(formData.deliveryDate).toISOString() : null,
          status: formData.status, status_commercial: formData.status_commercial,
          is_highlighted: formData.is_highlighted, gallery_images: allImages,
          image: allImages[0] || null,
          floor_plans: [...formData.existingFloorPlans, ...newFpUrls],
          brochure_url: brochureUrl, video_url: formData.videoUrl || null, video_short_url: formData.videoShort || null,
          virtual_tour_url: formData.virtualTourUrl || null,
        }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erro ao atualizar') }
      setLastSaved(new Date())
      toast.success('Empreendimento salvo!')
      // Update file state
      const saved = await res.json()
      setFormData(p => ({ ...p, images: [], floorPlans: [], brochure: null }))
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message)
    } finally { setIsSubmitting(false) }
  }

  const inp = `w-full h-11 px-4 rounded-xl text-sm outline-none transition-all`
  const inpStyle = { background: T.elevated, border: `1px solid ${T.border}`, color: T.text }
  const focusStyle = { boxShadow: `0 0 0 2px ${T.accent}22` }

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 size={48} className="animate-spin mx-auto mb-4" style={{ color: T.accent }} />
        <p style={{ color: T.textDim }}>Carregando...</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-0">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 backdrop-blur-xl rounded-b-2xl mb-6" style={{ background: `${T.bg}ee`, borderBottom: `1px solid ${T.border}` }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ border: `1px solid ${T.border}`, background: T.surface }}>
              <ArrowLeft size={18} style={{ color: T.text }} />
            </button>
            <div>
              <p className="text-sm font-bold truncate max-w-[200px]" style={{ color: T.text }}>{formData.name || 'Sem nome'}</p>
              {lastSaved && <p className="text-[10px]" style={{ color: T.textDim }}>Salvo {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status quick-toggle */}
            <select value={formData.status_commercial} onChange={e => set('status_commercial', e.target.value)}
              className="h-9 px-3 rounded-xl text-xs font-semibold outline-none cursor-pointer"
              style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}>
              <option value="published">🟢 Publicado</option>
              <option value="draft">⚪ Rascunho</option>
              <option value="campaign">🟡 Campanha</option>
              <option value="private">🔒 Privado</option>
              <option value="sold">🏆 Vendido</option>
            </select>

            <button onClick={() => router.push(`/backoffice/imoveis/${params.id}`)}
              className="h-9 px-3 rounded-xl text-xs font-medium flex items-center gap-1.5"
              style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted }}>
              <Eye size={14} /> Ver
            </button>

            <button onClick={handleSubmit} disabled={isSubmitting}
              className="h-9 px-5 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-60 transition-all"
              style={{ background: isSubmitting ? T.textDim : T.accent }}>
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex px-4 gap-1 pb-0">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all rounded-t-xl relative"
                style={{ color: active ? T.accent : T.textDim, background: active ? T.surface : 'transparent' }}>
                <Icon size={15} />
                <span className="hidden sm:inline">{tab.label}</span>
                {active && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: T.accent }} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl p-6 md:p-8"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}>

          {/* ── BÁSICO ── */}
          {activeTab === 'basico' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>Nome do Empreendimento *</label>
                  <input value={formData.name} onChange={e => set('name', e.target.value)}
                    placeholder="Ex: Residencial Sky Gardens" className={inp} style={inpStyle} />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>Tipo de Imóvel *</label>
                  <select value={formData.type} onChange={e => set('type', e.target.value)} className={inp} style={inpStyle}>
                    <option value="">Selecione...</option>
                    {tiposImovel.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>Status Interno</label>
                  <select value={formData.status} onChange={e => set('status', e.target.value)} className={inp} style={inpStyle}>
                    {['disponivel', 'em_negociacao', 'reservado', 'vendido', 'lancamento', 'arquivado'].map(s =>
                      <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>Bairro / Região</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: T.textDim }} />
                    <input value={formData.location} onChange={e => set('location', e.target.value)}
                      placeholder="Boa Viagem, Pina, Derby..." className={inp} style={{ ...inpStyle, paddingLeft: '2.25rem' }} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>Construtora</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: T.textDim }} />
                    <input value={formData.developer} onChange={e => set('developer', e.target.value)}
                      placeholder="Nome da construtora" className={inp} style={{ ...inpStyle, paddingLeft: '2.25rem' }} />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>Endereço Completo</label>
                  <input value={formData.address} onChange={e => set('address', e.target.value)}
                    placeholder="Rua, número, complemento..." className={inp} style={inpStyle} />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>Descrição</label>
                    <button onClick={generateDescription} disabled={aiGenerating}
                      className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-semibold transition-all disabled:opacity-60"
                      style={{ background: `${T.accent}15`, color: T.accent, border: `1px solid ${T.accent}30` }}>
                      {aiGenerating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                      {aiGenerating ? 'Gerando...' : 'Gerar com IA'}
                    </button>
                  </div>
                  <textarea value={formData.description} onChange={e => set('description', e.target.value)}
                    rows={5} placeholder="Descreva o empreendimento..." className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={inpStyle} />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div onClick={() => set('is_highlighted', !formData.is_highlighted)}
                      className="w-5 h-5 rounded flex items-center justify-center transition-all"
                      style={{ background: formData.is_highlighted ? T.accent : T.elevated, border: `2px solid ${formData.is_highlighted ? T.accent : T.border}` }}>
                      {formData.is_highlighted && <Check size={12} color="white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: T.text }}>
                        <Star size={14} style={{ color: '#fbbf24', fill: formData.is_highlighted ? '#fbbf24' : 'none' }} />
                        Destaque na página inicial
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: T.textDim }}>Aparece na seção de imóveis em destaque</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ── DETALHES ── */}
          {activeTab === 'detalhes' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {[
                  { field: 'area', label: 'Área Privativa (m²)', icon: Ruler },
                  { field: 'bedrooms', label: 'Quartos', icon: BedDouble },
                  { field: 'bathrooms', label: 'Banheiros', icon: Bath },
                  { field: 'parking', label: 'Vagas', icon: Car },
                  { field: 'floor', label: 'Andar / Total Andares', icon: Building2 },
                ].map(({ field, label, icon: Icon }) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: T.textDim }} />
                      <input type="number" min="0" value={(formData as any)[field]} onChange={e => set(field as keyof FormData, e.target.value)}
                        className={inp} style={{ ...inpStyle, paddingLeft: '2.25rem' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: `1px solid ${T.border}` }} className="pt-6">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: T.textMuted }}>
                  Amenities e Diferenciais · <span style={{ color: T.accent }}>{formData.features.length} selecionados</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {featuresOptions.map(f => {
                    const active = formData.features.includes(f)
                    return (
                      <button key={f} type="button" onClick={() => toggleFeature(f)}
                        className="h-10 px-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                        style={{
                          background: active ? `${T.accent}20` : T.elevated,
                          color: active ? T.accent : T.textMuted,
                          border: `1px solid ${active ? T.accent : T.border}`,
                        }}>
                        {active && <CheckCircle size={12} />}
                        {f}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── VALORES ── */}
          {activeTab === 'valores' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { field: 'priceMin', label: 'Preço Mínimo (R$)', placeholder: '500000' },
                  { field: 'priceMax', label: 'Preço Máximo (R$)', placeholder: '2000000' },
                  { field: 'pricePerSqm', label: 'Preço por m² (R$)', placeholder: '12000' },
                  { field: 'totalUnits', label: 'Total de Unidades', placeholder: '120' },
                  { field: 'availableUnits', label: 'Unidades Disponíveis', placeholder: '80' },
                ].map(({ field, label, placeholder }) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>{label}</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: T.textDim }} />
                      <input type="number" min="0" placeholder={placeholder} value={(formData as any)[field]}
                        onChange={e => set(field as keyof FormData, e.target.value)}
                        className={inp} style={{ ...inpStyle, paddingLeft: '2.25rem' }} />
                    </div>
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>Previsão de Entrega</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: T.textDim }} />
                    <input type="month" value={formData.deliveryDate} onChange={e => set('deliveryDate', e.target.value)}
                      className={inp} style={{ ...inpStyle, paddingLeft: '2.25rem' }} />
                  </div>
                </div>
              </div>

              {/* Price preview */}
              {(formData.priceMin || formData.priceMax) && (
                <div className="rounded-2xl p-5" style={{ background: `${T.accent}10`, border: `1px solid ${T.accent}30` }}>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: T.accent }}>Preview de Preço</p>
                  <p className="text-2xl font-bold" style={{ color: T.text }}>
                    {formData.priceMin && !formData.priceMax && `R$ ${Number(formData.priceMin).toLocaleString('pt-BR')}`}
                    {formData.priceMin && formData.priceMax && `R$ ${Number(formData.priceMin).toLocaleString('pt-BR')} – R$ ${Number(formData.priceMax).toLocaleString('pt-BR')}`}
                    {!formData.priceMin && formData.priceMax && `Até R$ ${Number(formData.priceMax).toLocaleString('pt-BR')}`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── MÍDIA ── */}
          {activeTab === 'midia' && (
            <div className="space-y-8">
              {/* Fotos */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: T.text }}>Fotos do Empreendimento</h3>
                    <p className="text-xs mt-0.5" style={{ color: T.textDim }}>A primeira foto é a capa. Arraste para reordenar.</p>
                  </div>
                  <label className="cursor-pointer h-9 px-4 rounded-xl flex items-center gap-2 text-sm font-medium transition-all"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}>
                    <Upload size={15} /> Adicionar
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => {
                      const files = Array.from(e.target.files || [])
                      set('images', [...formData.images, ...files])
                    }} />
                  </label>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={formData.existingImages} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {formData.existingImages.map((url, i) => (
                        <SortableImageItem
                          key={url}
                          url={url}
                          index={i}
                          onSetCover={() => {
                            const imgs = [...formData.existingImages]
                            const [main] = imgs.splice(i, 1)
                            set('existingImages', [main, ...imgs])
                          }}
                          onRemove={() => set('existingImages', formData.existingImages.filter(x => x !== url))}
                        />
                      ))}
                      {formData.images.map((file, i) => (
                        <div key={i} className="relative group rounded-xl overflow-hidden" style={{ border: `2px dashed ${T.accent}40`, background: `${T.accent}08` }}>
                          <img src={URL.createObjectURL(file)} alt="nova" className="w-full h-28 object-cover" />
                          <div className="absolute top-2 right-2">
                            <button onClick={() => set('images', formData.images.filter((_, j) => j !== i))}
                              className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#EF444480' }}>
                              <X size={12} color="white" />
                            </button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 text-center text-[10px] py-1 font-medium" style={{ background: `${T.accent}80`, color: 'white' }}>Nova</div>
                        </div>
                      ))}
                      {formData.existingImages.length === 0 && formData.images.length === 0 && (
                        <label className="col-span-full cursor-pointer h-32 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:opacity-80"
                          style={{ border: `2px dashed ${T.border}`, background: T.elevated }}>
                          <ImageIcon size={28} style={{ color: T.textDim }} />
                          <span className="text-sm" style={{ color: T.textDim }}>Clique para adicionar fotos</span>
                          <input type="file" accept="image/*" multiple className="hidden" onChange={e => set('images', Array.from(e.target.files || []))} />
                        </label>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>

              {/* Vídeos */}
              <div style={{ borderTop: `1px solid ${T.border}` }} className="pt-6">
                <h3 className="text-sm font-bold mb-4" style={{ color: T.text }}>Vídeos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>
                      <Play size={11} className="inline mr-1" />Vídeo YouTube
                    </label>
                    <input value={formData.videoUrl} onChange={e => set('videoUrl', e.target.value)}
                      placeholder="https://youtube.com/watch?v=..." className={inp} style={inpStyle} />
                    {formData.videoUrl && getYoutubeEmbedUrl(formData.videoUrl) && (
                      <div className="mt-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                        <iframe src={getYoutubeEmbedUrl(formData.videoUrl)!} className="w-full h-40" allow="autoplay; encrypted-media" allowFullScreen />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>
                      <Zap size={11} className="inline mr-1" />Vídeo Curto (Shorts/Reels)
                    </label>
                    <input value={formData.videoShort} onChange={e => set('videoShort', e.target.value)}
                      placeholder="https://youtube.com/shorts/..." className={inp} style={inpStyle} />
                  </div>
                </div>
              </div>

              {/* Tour Virtual */}
              <div style={{ borderTop: `1px solid ${T.border}` }} className="pt-6">
                <h3 className="text-sm font-bold mb-4" style={{ color: T.text }}>Tour Virtual 360°</h3>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>
                    <LinkIcon size={11} className="inline mr-1" />Link Matterport / Kuula / iGuide
                  </label>
                  <input value={formData.virtualTourUrl} onChange={e => set('virtualTourUrl', e.target.value)}
                    placeholder="https://my.matterport.com/show/?m=..." className={inp} style={inpStyle} />
                  <p className="text-xs mt-1.5" style={{ color: T.textDim }}>Cole a URL do tour 360°. Matterport, Kuula, iGuide e similares são suportados.</p>
                </div>
                {formData.virtualTourUrl && (
                  <div className="mt-4 rounded-xl overflow-hidden" style={{ border: `1px solid ${T.accent}30`, background: `${T.accent}08` }}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10b981' }} />
                      <span className="text-xs font-medium flex-1 truncate" style={{ color: T.text }}>{formData.virtualTourUrl}</span>
                      <a href={formData.virtualTourUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: T.elevated, color: T.accent, border: `1px solid ${T.border}` }}>
                        Testar
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Plantas */}
              <div style={{ borderTop: `1px solid ${T.border}` }} className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold" style={{ color: T.text }}>Plantas do Imóvel</h3>
                  <label className="cursor-pointer h-9 px-4 rounded-xl flex items-center gap-2 text-sm font-medium"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}>
                    <Upload size={15} /> Adicionar planta
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => set('floorPlans', [...formData.floorPlans, ...Array.from(e.target.files || [])])} />
                  </label>
                </div>
                {(formData.existingFloorPlans.length > 0 || formData.floorPlans.length > 0) ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {formData.existingFloorPlans.map((url, i) => (
                      <div key={url} className="relative group rounded-xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                        <Image src={url} alt={`planta ${i}`} width={200} height={120} className="w-full h-28 object-cover" />
                        <button onClick={() => set('existingFloorPlans', formData.existingFloorPlans.filter(x => x !== url))}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          style={{ background: '#EF444480' }}><X size={12} color="white" /></button>
                      </div>
                    ))}
                    {formData.floorPlans.map((file, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden" style={{ border: `2px dashed ${T.accent}40` }}>
                        <img src={URL.createObjectURL(file)} alt="planta nova" className="w-full h-28 object-cover" />
                        <button onClick={() => set('floorPlans', formData.floorPlans.filter((_, j) => j !== i))}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: '#EF444480' }}><X size={12} color="white" /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 rounded-xl" style={{ border: `2px dashed ${T.border}`, background: T.elevated }}>
                    <FileText size={28} className="mx-auto mb-2" style={{ color: T.textDim }} />
                    <p className="text-sm" style={{ color: T.textDim }}>Nenhuma planta adicionada</p>
                  </div>
                )}
              </div>

              {/* Brochure */}
              <div style={{ borderTop: `1px solid ${T.border}` }} className="pt-6">
                <h3 className="text-sm font-bold mb-4" style={{ color: T.text }}>Brochure / Material PDF</h3>
                {formData.existingBrochure ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                    <FileText size={20} style={{ color: T.accent }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: T.text }}>Brochure atual</p>
                      <a href={formData.existingBrochure} target="_blank" rel="noopener" className="text-xs underline" style={{ color: T.accent }}>Ver PDF</a>
                    </div>
                    <button onClick={() => set('existingBrochure', '')} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430' }}>
                      Remover
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex items-center gap-3 p-4 rounded-xl transition-all hover:opacity-80"
                    style={{ border: `2px dashed ${T.border}`, background: T.elevated }}>
                    <FileText size={20} style={{ color: T.textDim }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: T.text }}>
                        {formData.brochure ? formData.brochure.name : 'Fazer upload do brochure'}
                      </p>
                      <p className="text-xs" style={{ color: T.textDim }}>PDF, máx. 50MB</p>
                    </div>
                    <input type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && set('brochure', e.target.files[0])} />
                  </label>
                )}
              </div>

              {/* Site visibility */}
              <div style={{ borderTop: `1px solid ${T.border}` }} className="pt-6">
                <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: `${T.accent}08`, border: `1px solid ${T.accent}20` }}>
                  <Globe size={18} style={{ color: T.accent }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: T.text }}>Visibilidade no site público</p>
                    <p className="text-xs" style={{ color: T.textDim }}>Controla se aparece em iulemirandaimoveis.com.br</p>
                  </div>
                  <select value={formData.status_commercial} onChange={e => set('status_commercial', e.target.value)}
                    className="h-9 px-3 rounded-xl text-sm outline-none"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}>
                    <option value="published">Publicado</option>
                    <option value="draft">Rascunho</option>
                    <option value="campaign">Campanha</option>
                    <option value="private">Privado</option>
                    <option value="sold">Vendido</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Bottom Save ── */}
      <div className="flex items-center justify-between py-4 px-2">
        <button onClick={() => router.push(`/backoffice/imoveis/${params.id}`)}
          className="text-sm flex items-center gap-1.5" style={{ color: T.textDim }}>
          <ArrowLeft size={14} /> Cancelar
        </button>
        <button onClick={handleSubmit} disabled={isSubmitting}
          className="h-11 px-8 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-60 transition-all"
          style={{ background: isSubmitting ? T.textDim : T.accent }}>
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}
