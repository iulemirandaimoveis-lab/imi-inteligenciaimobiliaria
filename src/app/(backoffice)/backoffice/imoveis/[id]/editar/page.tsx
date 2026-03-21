'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft, Building2, MapPin, Ruler, Home, DollarSign,
  Image as ImageIcon, Upload, Check, Calendar, Save,
  Loader2, AlertCircle, BedDouble, Bath, Car, Sparkles, Star,
  Play, FileText, X, CheckCircle, Globe, Eye, Zap, GripVertical,
  Maximize,
} from 'lucide-react'
import Image from 'next/image'
import { uploadFile, uploadMultipleImages } from '@/lib/supabase-storage'
import type { ImageUploadFileStatus } from '@/lib/supabase-storage'
import UploadProgressPanel from '@/app/(backoffice)/components/ui/UploadProgressPanel'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  rectSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { MobileGlobalStyles, MobileBottomNav } from '../../mobile-ui'

/* ── Sortable gallery image ── */
interface SortableGalleryItemProps {
  id: string
  url: string // URL or blob URL
  label?: string
  isCover: boolean
  onSetCover: () => void
  onDelete: () => void
  onPreview: () => void
}
function SortableGalleryItem({ id, url, label, isCover, onSetCover, onDelete, onPreview }: SortableGalleryItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 30 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} className="relative group rounded-lg overflow-hidden"
      {...attributes}>
      <div className="w-full h-28 relative" style={{ border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden' }}>
        <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
        {/* Drag handle */}
        <div {...listeners} className="absolute top-2 left-2 w-6 h-6 rounded-[6px] flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <GripVertical size={12} color="white" />
        </div>
        {/* Index badge */}
        <div className="absolute top-2 left-10 w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>
          {parseInt(id.replace('img-', '')) + 1}
        </div>
        {/* Cover badge */}
        {isCover && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-[6px] text-[10px] font-bold"
            style={{ background: T.accent, color: 'white' }}>Capa</div>
        )}
        {/* "Nova" label */}
        {label && (
          <div className="absolute bottom-0 left-0 right-0 text-center text-[10px] py-0.5 font-medium"
            style={{ background: `${T.accent}80`, color: 'white' }}>{label}</div>
        )}
        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
          <button type="button" onClick={onPreview}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}>
            <Maximize size={12} color="white" />
          </button>
          {!isCover && (
            <button type="button" onClick={onSetCover}
              className="text-[10px] px-2 py-1 rounded-lg font-medium"
              style={{ background: T.accent, color: 'white' }}>
              Capa
            </button>
          )}
          <button type="button" onClick={onDelete}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: '#EF444480' }}>
            <X size={12} color="white" />
          </button>
        </div>
      </div>
    </div>
  )
}

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

/* ── Field error message ── */
function ErrMsg({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-xs flex items-center gap-1" style={{ color: 'var(--error, #f87171)' }}><AlertCircle size={11} />{msg}</p>
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
const featuresOptions = Array.from(new Set([
  'Piscina', 'Academia', 'Salão de festas', 'Churrasqueira', 'Playground', 'Quadra esportiva',
  'Sauna', 'Espaço gourmet', 'Coworking', 'Pet place', 'Brinquedoteca', 'Salão de jogos',
  'Cinema', 'Spa', 'Jardim', 'Portaria 24h', 'Segurança', 'Elevador',
  'Bicicletário', 'Varanda gourmet', 'Área de lazer', 'Rooftop',
]))

// Unified gallery item: either an existing URL or a new File
interface GalleryItem {
  type: 'existing' | 'new'
  url: string      // URL for existing, blob URL for new
  file?: File      // only for new items
}

interface FormData {
  name: string; type: string; location: string; address: string
  cep: string; street: string; streetNumber: string; complement: string
  neighborhood: string; city: string; stateUf: string
  developer: string; developer_id: string; description: string
  area: string; bedrooms: string; bathrooms: string; parking: string; floor: string
  features: string[]; priceMin: string; priceMax: string; pricePerSqm: string
  totalUnits: string; availableUnits: string; deliveryDate: string
  galleryItems: GalleryItem[]; existingFloorPlans: string[]
  floorPlans: File[]; existingBrochure: string; brochure: File | null
  logo: File | null; existingLogo: string
  status: string; status_commercial: string; is_highlighted: boolean
  videoUrl: string; videoShort: string
}

const INITIAL: FormData = {
  name: '', type: '', location: '', address: '',
  cep: '', street: '', streetNumber: '', complement: '', neighborhood: '', city: '', stateUf: '',
  developer: '', developer_id: '',
  description: '', area: '', bedrooms: '', bathrooms: '', parking: '', floor: '',
  features: [], priceMin: '', priceMax: '', pricePerSqm: '', totalUnits: '',
  availableUnits: '', deliveryDate: '', galleryItems: [],
  existingFloorPlans: [], floorPlans: [], existingBrochure: '', brochure: null,
  logo: null, existingLogo: '', status: 'disponivel', status_commercial: 'draft',
  is_highlighted: false, videoUrl: '', videoShort: '',
}

/* ── Gallery Tab with Drag-and-Drop (Fotos + Vídeos + Plantas + Brochure) ── */
function GalleryTabContent({ formData, set, params }: { formData: FormData; set: (k: keyof FormData, v: FormData[keyof FormData]) => void; params: { id: string } }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const inp = `w-full h-11 px-4 rounded-[6px] text-sm outline-none transition-all`
  const inpStyle = { background: T.elevated, border: `1px solid ${T.border}`, color: T.text }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const galleryIds = useMemo(
    () => formData.galleryItems.map((_, i) => `img-${i}`),
    [formData.galleryItems.length]
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = parseInt((active.id as string).replace('img-', ''))
    const newIdx = parseInt((over.id as string).replace('img-', ''))
    const reordered = arrayMove([...formData.galleryItems], oldIdx, newIdx)
    set('galleryItems', reordered)
    toast.success('Ordem atualizada!')
  }

  const addNewFiles = (files: File[]) => {
    const newItems: GalleryItem[] = files.map(f => ({
      type: 'new' as const,
      url: URL.createObjectURL(f),
      file: f,
    }))
    set('galleryItems', [...formData.galleryItems, ...newItems])
  }

  return (
    <div className="space-y-8">
      {/* ── Fotos com Drag-and-Drop ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold" style={{ color: T.text }}>Fotos do Empreendimento</h3>
            <p className="text-xs mt-0.5" style={{ color: T.textDim }}>
              Arraste para reordenar. A 1ª foto é a capa. {formData.galleryItems.length} foto(s).
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: T.textDim }}>
              Formatos: JPG, PNG, WEBP · Máx. 10MB por imagem
            </p>
          </div>
          <label className="cursor-pointer h-9 px-4 rounded flex items-center gap-2 text-sm font-medium transition-all"
            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}>
            <Upload size={15} /> Adicionar
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => {
              const files = Array.from(e.target.files || [])
              if (files.length > 0) addNewFiles(files)
              e.target.value = ''
            }} />
          </label>
        </div>

        {formData.galleryItems.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={galleryIds} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {formData.galleryItems.map((item, i) => (
                  <SortableGalleryItem
                    key={`img-${i}`}
                    id={`img-${i}`}
                    url={item.url}
                    label={item.type === 'new' ? 'Nova' : undefined}
                    isCover={i === 0}
                    onSetCover={() => {
                      const items = [...formData.galleryItems]
                      const [moved] = items.splice(i, 1)
                      set('galleryItems', [moved, ...items])
                    }}
                    onDelete={() => {
                      set('galleryItems', formData.galleryItems.filter((_, j) => j !== i))
                    }}
                    onPreview={() => setPreviewUrl(item.url)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <label className="cursor-pointer h-32 rounded-[6px] flex flex-col items-center justify-center gap-2 transition-all hover:opacity-80"
            style={{ border: `2px dashed ${T.border}`, background: T.elevated }}>
            <ImageIcon size={28} style={{ color: T.textDim }} />
            <span className="text-sm" style={{ color: T.textDim }}>Clique para adicionar fotos</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => {
              addNewFiles(Array.from(e.target.files || []))
              e.target.value = ''
            }} />
          </label>
        )}

        {formData.galleryItems.length > 1 && (
          <p className="text-[10px] mt-2 flex items-center gap-1" style={{ color: T.textDim }}>
            <GripVertical size={10} /> Arraste as imagens para reordenar
          </p>
        )}
      </div>

      {/* ── Vídeos ── */}
      <div style={{ borderTop: `1px solid ${T.border}` }} className="pt-6">
        <h3 className="text-sm font-bold mb-4" style={{ color: T.text }}>Vídeos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>
              <Play size={11} className="inline mr-1" />Tour Virtual (YouTube)
            </label>
            <input value={formData.videoUrl} onChange={e => set('videoUrl', e.target.value)}
              placeholder="https://youtube.com/watch?v=..." className={inp} style={inpStyle} />
            {formData.videoUrl && getYoutubeEmbedUrl(formData.videoUrl) && (
              <div className="mt-3 rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
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

      {/* ── Plantas ── */}
      <div style={{ borderTop: `1px solid ${T.border}` }} className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: T.text }}>Plantas do Imóvel</h3>
          <label className="cursor-pointer h-9 px-4 rounded flex items-center gap-2 text-sm font-medium"
            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}>
            <Upload size={15} /> Adicionar planta
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => set('floorPlans', [...formData.floorPlans, ...Array.from(e.target.files || [])])} />
          </label>
        </div>
        {(formData.existingFloorPlans.length > 0 || formData.floorPlans.length > 0) ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {formData.existingFloorPlans.map((url, i) => (
              <div key={url} className="relative group rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                <img src={url} alt={`planta ${i}`} className="w-full h-28 object-cover" loading="lazy" />
                <button type="button" onClick={() => set('existingFloorPlans', formData.existingFloorPlans.filter(x => x !== url))}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  style={{ background: '#EF444480' }}><X size={12} color="white" /></button>
              </div>
            ))}
            {formData.floorPlans.map((file, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden" style={{ border: `2px dashed ${T.accent}40` }}>
                <img src={URL.createObjectURL(file)} alt="planta nova" className="w-full h-28 object-cover" />
                <button type="button" onClick={() => set('floorPlans', formData.floorPlans.filter((_, j) => j !== i))}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: '#EF444480' }}><X size={12} color="white" /></button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 rounded-lg" style={{ border: `2px dashed ${T.border}`, background: T.elevated }}>
            <FileText size={28} className="mx-auto mb-2" style={{ color: T.textDim }} />
            <p className="text-sm" style={{ color: T.textDim }}>Nenhuma planta adicionada</p>
            <p className="text-xs mt-1" style={{ color: T.textDim }}>JPG, PNG, WEBP · Máx. 10MB</p>
          </div>
        )}
      </div>

      {/* ── Brochure ── */}
      <div style={{ borderTop: `1px solid ${T.border}` }} className="pt-6">
        <h3 className="text-sm font-bold mb-4" style={{ color: T.text }}>Brochure / Material PDF</h3>
        {formData.existingBrochure ? (
          <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
            <FileText size={20} style={{ color: T.accent }} />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: T.text }}>Brochure atual</p>
              <a href={formData.existingBrochure} target="_blank" rel="noopener" className="text-xs underline" style={{ color: T.accent }}>Ver PDF</a>
            </div>
            <button type="button" onClick={() => set('existingBrochure', '')} className="text-xs px-3 py-1.5 rounded"
              style={{ background: '#EF444415', color: 'var(--error)', border: '1px solid #EF444430' }}>
              Remover
            </button>
          </div>
        ) : (
          <label className="cursor-pointer flex items-center gap-3 p-4 rounded-[6px] transition-all hover:opacity-80"
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

      {/* ── Visibilidade ── */}
      <div style={{ borderTop: `1px solid ${T.border}` }} className="pt-6">
        <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: `${T.accent}08`, border: `1px solid ${T.accent}20` }}>
          <Globe size={18} style={{ color: T.accent }} />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: T.text }}>Visibilidade no site público</p>
            <p className="text-xs" style={{ color: T.textDim }}>Controla se aparece em iulemirandaimoveis.com.br</p>
          </div>
          <select value={formData.status_commercial} onChange={e => set('status_commercial', e.target.value)}
            className="h-9 px-3 rounded text-sm outline-none"
            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}>
            <option value="published">Publicado</option>
            <option value="draft">Rascunho</option>
            <option value="campaign">Campanha</option>
            <option value="private">Privado</option>
            <option value="sold">Vendido</option>
          </select>
        </div>
      </div>

      {/* ── Preview Modal ── */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-5xl w-full">
            <button onClick={() => setPreviewUrl(null)}
              className="absolute -top-12 right-0 p-2 rounded-full"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              <X size={24} color="white" />
            </button>
            <img src={previewUrl} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl mx-auto"
              onClick={e => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function EditarImovelPage() {
  const router = useRouter()
  const params = useParams()
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState<TabId>('basico')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [formData, setFormData] = useState<FormData>(INITIAL)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateAll = (): boolean => {
    const errs: Record<string, string> = {}
    const pMin = Number(formData.priceMin)
    const pMax = Number(formData.priceMax)
    const total = Number(formData.totalUnits)
    const avail = Number(formData.availableUnits)
    const beds  = Number(formData.bedrooms)
    const baths = Number(formData.bathrooms)
    const park  = Number(formData.parking)

    if (formData.priceMin && formData.priceMax && pMax < pMin)
      errs.priceMax = 'Preço máximo deve ser ≥ ao mínimo'
    if (formData.totalUnits && formData.availableUnits && avail > total)
      errs.availableUnits = 'Disponíveis não pode exceder o total'
    if (formData.bedrooms && beds < 0)
      errs.bedrooms = 'Não pode ser negativo'
    if (formData.bathrooms && baths < 0)
      errs.bathrooms = 'Não pode ser negativo'
    if (formData.parking && park < 0)
      errs.parking = 'Não pode ser negativo'

    setValidationErrors(errs)
    return Object.keys(errs).length === 0
  }

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
          cep: d.cep || '', street: d.street || '', streetNumber: d.street_number || '',
          complement: d.complement || '', neighborhood: d.neighborhood || d.region || '',
          city: d.city || '', stateUf: d.state_uf || '',
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
          galleryItems: galleryImgs.map((url: string) => ({ type: 'existing' as const, url })),
          existingFloorPlans: Array.isArray(d.floor_plans) ? d.floor_plans : [],
          floorPlans: [], existingBrochure: d.brochure_url || '', brochure: null,
          logo: null, existingLogo: d.developers?.logo_url || '',
          status: d.status || 'disponivel', status_commercial: d.status_commercial || d.status_comercial || 'draft',
          is_highlighted: !!d.is_highlighted, videoUrl: d.video_url || '', videoShort: d.video_short_url || '',
        })
      } catch (_err: unknown) {
        toast.error('Erro ao carregar dados do empreendimento')
      } finally { setIsLoading(false) }
    })()
  }, [params.id])

  const set = (field: keyof FormData, value: FormData[keyof FormData]) => {
    setFormData(p => ({ ...p, [field]: value }))
    if (validationErrors[field]) setValidationErrors(p => { const n = { ...p }; delete n[field]; return n })
  }
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
    if (!validateAll()) {
      toast.error('Corrija os erros de validação antes de salvar')
      // Navigate to the tab that has errors
      if (validationErrors.priceMax || validationErrors.availableUnits) setActiveTab('valores')
      else if (validationErrors.bedrooms || validationErrors.bathrooms || validationErrors.parking) setActiveTab('detalhes')
      return
    }
    setIsSubmitting(true)
    try {
      // Upload new gallery images (preserving order from galleryItems)
      const newFiles = formData.galleryItems.filter(g => g.type === 'new' && g.file)
      let newImageUrls: Map<string, string> = new Map() // blobUrl → uploadedUrl
      if (newFiles.length > 0) {
        toast.info(`Comprimindo e enviando ${newFiles.length} imagem(ns)...`)
        const files = newFiles.map(g => g.file!)
        const r = await uploadMultipleImages(files, {
          bucket: 'media',
          folder: `developments/${params.id}`,
          concurrency: 3,
          maxRetries: 2,
        })
        newFiles.forEach((g, i) => {
          if (!r[i]?.error) newImageUrls.set(g.url, r[i].url)
        })
        const failed = r.filter(x => x.error).length
        if (failed > 0) toast.warning(`${failed} imagem(ns) falharam`)
      }
      // Build final image array in the exact user-defined order
      const allImages = formData.galleryItems
        .map(g => g.type === 'existing' ? g.url : newImageUrls.get(g.url) || null)
        .filter(Boolean) as string[]

      let newFpUrls: string[] = []
      if (formData.floorPlans.length > 0) {
        const r = await uploadMultipleImages(formData.floorPlans, {
          bucket: 'media',
          folder: `developments/${params.id}/plantas`,
          concurrency: 3,
        })
        newFpUrls = r.filter(x => !x.error).map(x => x.url)
      }
      let brochureUrl: string | null = formData.existingBrochure || null
      if (formData.brochure) {
        const r = await uploadFile(formData.brochure, 'media', 'developments/brochures')
        if (!r.error) brochureUrl = r.url
      }
      const res = await fetch('/api/developments', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: params.id, name: formData.name, type: formData.type,
          address: [formData.street, formData.streetNumber, formData.complement].filter(Boolean).join(', ') || formData.address || null,
          neighborhood: formData.neighborhood || formData.location || null,
          cep: formData.cep || null, street: formData.street || null,
          street_number: formData.streetNumber || null, complement: formData.complement || null,
          city: formData.city || null, state_uf: formData.stateUf || null,
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
        }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erro ao atualizar') }
      setLastSaved(new Date())
      toast.success('Empreendimento salvo!')
      // Convert newly-uploaded items to existing items (with real URLs)
      setFormData(p => ({
        ...p,
        galleryItems: allImages.map(url => ({ type: 'existing' as const, url })),
        floorPlans: [], brochure: null,
      }))
    } catch (err: unknown) {
      toast.error('Erro ao salvar: ' + (err instanceof Error ? err.message : String(err)))
    } finally { setIsSubmitting(false) }
  }

  const inp = `w-full h-11 px-4 rounded-[6px] text-sm outline-none transition-all`
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

  const currentTabIndex = TABS.findIndex(t => t.id === activeTab)
  const totalTabs = TABS.length

  return (
    <div className="max-w-6xl mx-auto space-y-0" style={{ paddingTop: isMobile ? 72 : undefined, paddingBottom: isMobile ? 96 : undefined }}>
      {isMobile && <MobileGlobalStyles />}
      {isMobile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          height: 56, background: 'var(--bg-surface)',
          borderBottom: '1px solid rgba(61,111,255,0.12)',
          display: 'flex', alignItems: 'center', padding: '0 4px 0 4px', gap: 8,
        }}>
          <button
            onClick={() => router.back()}
            style={{
              width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)',
              borderRadius: 6, flexShrink: 0,
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 15, color: 'var(--imi-cream)', margin: 0, lineHeight: 1.2 }}>
              Editar Imóvel
            </p>
            <p style={{ fontFamily: 'var(--font-outfit, sans-serif)', fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
              {currentTabIndex + 1}/{totalTabs} — {TABS[currentTabIndex]?.label}
            </p>
          </div>
        </div>
      )}
      {!isMobile && <PageIntelHeader
        moduleLabel="IMÓVEIS"
        title="Editar Imóvel"
        subtitle={formData.name || 'Carregando...'}
        breadcrumbs={[
          { label: 'Imóveis', href: '/backoffice/imoveis' },
          { label: 'Editar' },
        ]}
      />}

      {/* ── Sticky Header ── */}
      <div className="sticky top-14 lg:top-0 z-20 backdrop-blur-xl rounded-b-2xl mb-6" style={{ background: `${T.bg}ee`, borderBottom: `1px solid ${T.border}` }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-bold truncate max-w-[200px]" style={{ color: T.text }}>{formData.name || 'Sem nome'}</p>
              {lastSaved && <p className="text-[10px]" style={{ color: T.textDim }}>Salvo {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap overflow-hidden min-w-0">
            {/* Status quick-toggle */}
            <select value={formData.status_commercial} onChange={e => set('status_commercial', e.target.value)}
              className="h-9 px-3 rounded text-xs font-semibold outline-none cursor-pointer"
              style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}>
              <option value="published">🟢 Publicado</option>
              <option value="draft">⚪ Rascunho</option>
              <option value="campaign">🟡 Campanha</option>
              <option value="private">🔒 Privado</option>
              <option value="sold">🏆 Vendido</option>
            </select>

            <button onClick={() => router.push(`/backoffice/imoveis/${params.id}`)}
              className="h-9 px-3 rounded text-xs font-medium flex items-center gap-1.5"
              style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted }}>
              <Eye size={14} /> Ver
            </button>

            <button onClick={handleSubmit} disabled={isSubmitting}
              className="h-9 px-5 rounded text-sm font-bold text-white flex items-center gap-2 disabled:opacity-60 transition-all"
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
          className="rounded-lg p-6 md:p-8"
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
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>Construtora</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: T.textDim }} />
                    <input value={formData.developer} onChange={e => set('developer', e.target.value)}
                      placeholder="Nome da construtora" className={inp} style={{ ...inpStyle, paddingLeft: '2.25rem' }} />
                  </div>
                </div>

                {/* ── Endereço estruturado com ViaCEP ── */}
                <div className="md:col-span-2 space-y-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>Endereço Completo</label>

                  {/* CEP + auto-fill */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] text-muted mb-1" style={{ color: T.textDim }}>CEP</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: T.textDim }} />
                        <input
                          value={formData.cep || ''}
                          onChange={async (e) => {
                            const raw = e.target.value.replace(/\D/g, '').slice(0, 8)
                            const masked = raw.length > 5 ? `${raw.slice(0,5)}-${raw.slice(5)}` : raw
                            set('cep', masked)
                            if (raw.length === 8) {
                              try {
                                const r = await fetch(`https://viacep.com.br/ws/${raw}/json/`)
                                const d = await r.json()
                                if (!d.erro) {
                                  set('street', d.logradouro || '')
                                  set('neighborhood', d.bairro || '')
                                  set('city', d.localidade || '')
                                  set('stateUf', d.uf || '')
                                  toast.success('Endereço preenchido automaticamente')
                                }
                              } catch { /* silent */ }
                            }
                          }}
                          placeholder="00000-000"
                          className={inp}
                          style={inpStyle}
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] mb-1" style={{ color: T.textDim }}>Logradouro</label>
                      <input value={formData.street || ''} onChange={e => set('street', e.target.value)}
                        placeholder="Rua, Avenida, Alameda..." className={inp} style={inpStyle} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] mb-1" style={{ color: T.textDim }}>Número</label>
                      <input value={formData.streetNumber || ''} onChange={e => set('streetNumber', e.target.value)}
                        placeholder="Ex: 123" className={inp} style={inpStyle} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] mb-1" style={{ color: T.textDim }}>Complemento</label>
                      <input value={formData.complement || ''} onChange={e => set('complement', e.target.value)}
                        placeholder="Apto, sala, bloco..." className={inp} style={inpStyle} />
                    </div>
                    <div>
                      <label className="block text-[11px] mb-1" style={{ color: T.textDim }}>UF</label>
                      <input value={formData.stateUf || ''} onChange={e => set('stateUf', e.target.value)}
                        placeholder="PE" maxLength={2} className={inp} style={{ ...inpStyle, textTransform: 'uppercase' }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] mb-1" style={{ color: T.textDim }}>Bairro</label>
                      <input value={formData.neighborhood || formData.location || ''} onChange={e => { set('neighborhood', e.target.value); set('location', e.target.value) }}
                        placeholder="Boa Viagem, Pina..." className={inp} style={inpStyle} />
                    </div>
                    <div>
                      <label className="block text-[11px] mb-1" style={{ color: T.textDim }}>Cidade</label>
                      <input value={formData.city || ''} onChange={e => set('city', e.target.value)}
                        placeholder="Recife" className={inp} style={inpStyle} />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>Descrição</label>
                    <button onClick={generateDescription} disabled={aiGenerating}
                      className="flex items-center gap-1.5 h-7 px-3 rounded text-xs font-semibold transition-all disabled:opacity-60"
                      style={{ background: `${T.accent}15`, color: T.accent, border: `1px solid ${T.accent}30` }}>
                      {aiGenerating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                      {aiGenerating ? 'Gerando...' : 'Gerar com IA'}
                    </button>
                  </div>
                  <textarea value={formData.description} onChange={e => set('description', e.target.value)}
                    rows={5} placeholder="Descreva o empreendimento..." className="w-full px-4 py-3 rounded-[6px] text-sm outline-none resize-none" style={inpStyle} />
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
                        <Star size={14} style={{ color: 'var(--warning)', fill: formData.is_highlighted ? 'var(--warning)' : 'none' }} />
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
                  { field: 'area',      label: 'Área Privativa (m²)',   icon: Ruler },
                  { field: 'bedrooms',  label: 'Quartos',               icon: BedDouble },
                  { field: 'bathrooms', label: 'Banheiros',             icon: Bath },
                  { field: 'parking',   label: 'Vagas',                 icon: Car },
                  { field: 'floor',     label: 'Andar / Total Andares', icon: Building2 },
                ].map(({ field, label, icon: Icon }) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: validationErrors[field] ? 'var(--error,#f87171)' : T.textDim }} />
                      <input
                        type="number" min="0"
                        value={formData[field as keyof FormData] as string}
                        onChange={e => set(field as keyof FormData, e.target.value)}
                        className={inp}
                        style={{
                          ...inpStyle,
                          paddingLeft: '2.25rem',
                          borderColor: validationErrors[field] ? 'rgba(248,113,113,0.6)' : undefined,
                        }}
                      />
                    </div>
                    <ErrMsg msg={validationErrors[field]} />
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
                        className="h-10 px-3 rounded-[6px] text-sm font-medium transition-all flex items-center gap-2"
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
                  { field: 'priceMin',       label: 'Preço Mínimo (R$)',      placeholder: '500000',  icon: DollarSign },
                  { field: 'priceMax',       label: 'Preço Máximo (R$)',       placeholder: '2000000', icon: DollarSign },
                  { field: 'pricePerSqm',    label: 'Preço por m² (R$)',       placeholder: '12000',   icon: DollarSign },
                  { field: 'totalUnits',     label: 'Total de Unidades',       placeholder: '120',     icon: Home },
                  { field: 'availableUnits', label: 'Unidades Disponíveis',    placeholder: '80',      icon: Home },
                ].map(({ field, label, placeholder, icon: FieldIcon }) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>{label}</label>
                    <div className="relative">
                      <FieldIcon className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: validationErrors[field] ? 'var(--error,#f87171)' : T.textDim }} />
                      <input
                        type="number" min="0"
                        placeholder={placeholder}
                        value={formData[field as keyof FormData] as string}
                        onChange={e => set(field as keyof FormData, e.target.value)}
                        className={inp}
                        style={{
                          ...inpStyle,
                          paddingLeft: '2.25rem',
                          borderColor: validationErrors[field] ? 'rgba(248,113,113,0.6)' : undefined,
                        }}
                      />
                    </div>
                    <ErrMsg msg={validationErrors[field]} />
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
              {(formData.priceMin || formData.priceMax) && (() => {
                const pMin = Number(formData.priceMin)
                const pMax = Number(formData.priceMax)
                const isInverted = formData.priceMin && formData.priceMax && pMax < pMin
                return (
                  <div className="rounded-lg p-5" style={{
                    background: isInverted ? 'rgba(248,113,113,0.08)' : `${T.accent}10`,
                    border: `1px solid ${isInverted ? 'rgba(248,113,113,0.35)' : T.accent + '30'}`,
                  }}>
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isInverted ? 'var(--error,#f87171)' : T.accent }}>
                      {isInverted ? '⚠ Faixa de preço inválida' : 'Preview de Preço'}
                    </p>
                    {isInverted ? (
                      <p className="text-sm font-medium" style={{ color: 'var(--error,#f87171)' }}>
                        Preço mínimo (R$ {pMin.toLocaleString('pt-BR')}) é maior que o máximo (R$ {pMax.toLocaleString('pt-BR')}). Corrija antes de salvar.
                      </p>
                    ) : (
                      <p className="text-2xl font-bold" style={{ color: T.text }}>
                        {formData.priceMin && !formData.priceMax && `R$ ${pMin.toLocaleString('pt-BR')}`}
                        {formData.priceMin && formData.priceMax && `R$ ${pMin.toLocaleString('pt-BR')} – R$ ${pMax.toLocaleString('pt-BR')}`}
                        {!formData.priceMin && formData.priceMax && `Até R$ ${pMax.toLocaleString('pt-BR')}`}
                      </p>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {/* ── MÍDIA ── */}
          {activeTab === 'midia' && (
            <GalleryTabContent formData={formData} set={set} params={{ id: String(params.id) }} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Bottom Save (desktop only) ── */}
      {!isMobile && (
        <div className="flex items-center justify-between py-4 pb-32 lg:pb-4 px-2">
          <button onClick={() => router.push(`/backoffice/imoveis/${params.id}`)}
            className="text-sm flex items-center gap-1.5" style={{ color: T.textDim }}>
            <ArrowLeft size={14} /> Cancelar
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting}
            className="h-11 px-8 rounded text-sm font-bold text-white flex items-center gap-2 disabled:opacity-60 transition-all"
            style={{ background: isSubmitting ? T.textDim : T.accent }}>
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      )}
      {isMobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: 'rgba(11,25,40,0.92)', backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(61,111,255,0.12)',
          padding: '12px 16px',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          display: 'flex', gap: 10,
        }}>
          {currentTabIndex > 0 && (
            <button
              onClick={() => setActiveTab(TABS[currentTabIndex - 1].id)}
              style={{
                flex: '0 0 auto', height: 52, paddingLeft: 20, paddingRight: 20,
                borderRadius: 6, background: 'rgba(61,111,255,0.08)',
                border: '1px solid rgba(61,111,255,0.25)', color: 'var(--accent-400)',
                fontFamily: 'var(--font-outfit, sans-serif)', fontSize: 13, fontWeight: 700,
                letterSpacing: '0.5px', cursor: 'pointer', touchAction: 'manipulation',
              }}
            >
              ← Anterior
            </button>
          )}
          <button
            onClick={currentTabIndex < totalTabs - 1 ? () => setActiveTab(TABS[currentTabIndex + 1].id) : handleSubmit}
            style={{
              flex: 1, height: 52, borderRadius: 6,
              background: currentTabIndex < totalTabs - 1 ? 'var(--accent-400)' : 'var(--success)',
              border: 'none', color: currentTabIndex < totalTabs - 1 ? T.text : 'white',
              fontFamily: 'var(--font-outfit, sans-serif)', fontSize: 13, fontWeight: 800,
              letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', touchAction: 'manipulation',
            }}
          >
            {currentTabIndex < totalTabs - 1 ? 'Próximo →' : isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      )}
    </div>
  )
}
