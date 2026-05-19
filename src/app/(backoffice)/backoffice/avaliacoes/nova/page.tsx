'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { T, inputStyle, cardStyle } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-is-mobile'
import {
  ArrowLeft, ArrowRight, Building2, MapPin, Search, Plus, Trash2,
  FileText, Save, Loader2, Eye, Check,
  BarChart2, Download, Scale, ChevronDown, Camera, X, Image as ImageIcon
} from 'lucide-react'

interface PhotoUpload {
  id: string
  file: File
  preview: string
  caption: string
  url?: string
  uploading?: boolean
}

// ============================================================
// TYPES
// ============================================================
type Step = 1 | 2 | 3 | 4 | 5 | 6

interface ComparableEntry {
  id?: string
  address: string
  neighborhood: string
  city: string
  state: string
  area_sqm: string
  bedrooms: string
  bathrooms: string
  parking_spots: string
  asking_price: string
  source: string
  source_url: string
  // factors
  offer_factor: number
  area_factor: number
  location_factor: number
  age_factor: number
  floor_factor: number
  parking_factor: number
  extra_factor: number
  // computed
  price_per_sqm?: number
  homogenized_price_per_sqm?: number
}

interface CalcResult {
  average_price_per_sqm: number
  median_price_per_sqm: number
  std_deviation: number
  coefficient_of_variation: number
  estimated_value: number
  confidence_grade: 'I' | 'II' | 'III'
  comparables: Array<{ homogenized_price_per_sqm: number }>
}

interface Development {
  id: string
  name: string
  address?: string
  location?: string
}

// ============================================================
// CONSTANTS
// ============================================================
const PURPOSES = ['Venda', 'Financiamento', 'Judicial', 'Inventário', 'Doação', 'Garantia']
const SOURCES = ['OLX', 'ZAP Imóveis', 'Viva Real', 'Imovelweb', 'Quinto Andar', 'Imobiliária', 'Outro']
const STEPS: { num: Step; label: string; icon: React.ReactNode }[] = [
  { num: 1, label: 'Imóvel', icon: <Building2 size={16} /> },
  { num: 2, label: 'Finalidade', icon: <FileText size={16} /> },
  { num: 3, label: 'Comparandos', icon: <MapPin size={16} /> },
  { num: 4, label: 'Fatores', icon: <Scale size={16} /> },
  { num: 5, label: 'Revisão', icon: <BarChart2 size={16} /> },
  { num: 6, label: 'Gerar', icon: <Download size={16} /> },
]

const emptyComparable = (): ComparableEntry => ({
  address: '', neighborhood: '', city: '', state: '',
  area_sqm: '', bedrooms: '', bathrooms: '', parking_spots: '',
  asking_price: '', source: '', source_url: '',
  offer_factor: 0.90, area_factor: 1.0, location_factor: 1.0,
  age_factor: 1.0, floor_factor: 1.0, parking_factor: 1.0, extra_factor: 1.0,
})

// ============================================================
// HELPERS
// ============================================================
const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtBRL = (v: number) => 'R$ ' + fmt(v)

function computePricePerSqm(c: ComparableEntry): number {
  const area = parseFloat(c.area_sqm) || 0
  const price = parseFloat(c.asking_price) || 0
  return area > 0 ? price / area : 0
}

function computeHomogenized(c: ComparableEntry): number {
  const ppsm = computePricePerSqm(c)
  return ppsm * c.offer_factor * c.area_factor * c.location_factor
    * c.age_factor * c.floor_factor * c.parking_factor * c.extra_factor
}

// ============================================================
// COMPONENT
// ============================================================
export default function NovaPTAMPage() {
  const mobile = useIsMobile()

  // Wizard state
  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [valuationId, setValuationId] = useState<string | null>(null)

  // Step 1: property
  const [developments, setDevelopments] = useState<Development[]>([])
  const [devSearch, setDevSearch] = useState('')
  const [selectedDev, setSelectedDev] = useState<Development | null>(null)
  const [subjectArea, setSubjectArea] = useState('')
  const [showDevDropdown, setShowDevDropdown] = useState(false)

  // Photos (part of step 1)
  const [photos, setPhotos] = useState<PhotoUpload[]>([])
  const photoInputRef = useRef<HTMLInputElement>(null)

  // Step 2: purpose
  const [purpose, setPurpose] = useState('Venda')
  const [requesterName, setRequesterName] = useState('')

  // Step 3: comparables
  const [comparables, setComparables] = useState<ComparableEntry[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newComp, setNewComp] = useState<ComparableEntry>(emptyComparable())

  // Step 5: results
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null)

  // Fetch developments
  useEffect(() => {
    const supabase = createClient()
    supabase.from('developments').select('id, name, address, location')
      .order('name').limit(200)
      .then(({ data }) => {
        if (data) setDevelopments(data as Development[])
      })
  }, [])

  const filteredDevs = developments.filter(d =>
    d.name.toLowerCase().includes(devSearch.toLowerCase())
  )

  // Navigation
  const canNext = useCallback((): boolean => {
    switch (step) {
      case 1: return !!selectedDev && parseFloat(subjectArea) > 0
      case 2: return !!purpose
      case 3: return comparables.length >= 3
      case 4: return comparables.length >= 3
      case 5: return !!calcResult
      default: return true
    }
  }, [step, selectedDev, subjectArea, purpose, comparables, calcResult])

  const goNext = () => { if (step < 6) setStep((step + 1) as Step) }
  const goPrev = () => { if (step > 1) setStep((step - 1) as Step) }

  // Add comparable
  const addComparable = () => {
    if (!newComp.address || !newComp.area_sqm || !newComp.asking_price) {
      toast.error('Preencha endereço, área e preço')
      return
    }
    const entry = {
      ...newComp,
      price_per_sqm: computePricePerSqm(newComp),
      homogenized_price_per_sqm: computeHomogenized(newComp),
    }
    setComparables(prev => [...prev, entry])
    setNewComp(emptyComparable())
    setShowAddForm(false)
    toast.success('Comparando adicionado')
  }

  const removeComparable = (idx: number) => {
    setComparables(prev => prev.filter((_, i) => i !== idx))
  }

  // Update factor on a comparable
  const updateFactor = (idx: number, field: keyof ComparableEntry, val: number) => {
    setComparables(prev => prev.map((c, i) => {
      if (i !== idx) return c
      const updated = { ...c, [field]: val }
      updated.homogenized_price_per_sqm = computeHomogenized(updated)
      return updated
    }))
  }

  // Calculate (client-side for preview, then save via API)
  const doCalculate = useCallback(() => {
    const values = comparables.map(c => computeHomogenized(c))
    if (values.length === 0) return
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const sorted = [...values].sort((a, b) => a - b)
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)]
    const variance = values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / (values.length - 1)
    const std = Math.sqrt(variance)
    const cv = (std / avg) * 100
    let grade: 'I' | 'II' | 'III' = 'I'
    if (comparables.length >= 5 && cv <= 30) grade = 'II'
    if (comparables.length >= 6 && cv <= 25) grade = 'III'

    const area = parseFloat(subjectArea) || 0
    setCalcResult({
      average_price_per_sqm: avg,
      median_price_per_sqm: median,
      std_deviation: std,
      coefficient_of_variation: cv,
      estimated_value: avg * area,
      confidence_grade: grade,
      comparables: values.map(v => ({ homogenized_price_per_sqm: v })),
    })
  }, [comparables, subjectArea])

  // Trigger calc when entering step 5
  useEffect(() => {
    if (step === 5) doCalculate()
  }, [step, doCalculate])

  // Photo upload handlers
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newPhotos: PhotoUpload[] = files.slice(0, 10 - photos.length).map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      caption: '',
    }))
    setPhotos(prev => [...prev, ...newPhotos])
    if (e.target) e.target.value = ''
  }

  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id)
      if (photo) URL.revokeObjectURL(photo.preview)
      return prev.filter(p => p.id !== id)
    })
  }

  const uploadPhotosToStorage = async (): Promise<{ url: string; name: string; caption: string }[]> => {
    const supabase = createClient()
    const uploaded: { url: string; name: string; caption: string }[] = []

    for (const photo of photos) {
      if (photo.url) {
        uploaded.push({ url: photo.url, name: photo.file.name, caption: photo.caption })
        continue
      }
      try {
        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, uploading: true } : p))
        const ext = photo.file.name.split('.').pop() || 'jpg'
        const path = `ptam-photos/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`
        const { error } = await supabase.storage
          .from('avaliacoes')
          .upload(path, photo.file, { cacheControl: '3600', upsert: false })

        if (error) {
          console.warn('[PHOTO_UPLOAD]', error.message)
          continue
        }

        const { data: { publicUrl } } = supabase.storage.from('avaliacoes').getPublicUrl(path)
        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, url: publicUrl, uploading: false } : p))
        uploaded.push({ url: publicUrl, name: photo.file.name, caption: photo.caption })
      } catch (err) {
        console.warn('[PHOTO_UPLOAD_ERR]', err)
        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, uploading: false } : p))
      }
    }

    return uploaded
  }

  // Save everything to DB
  const saveToDatabase = async () => {
    setSaving(true)
    try {
      // 0. Upload photos
      const uploadedPhotos = photos.length > 0 ? await uploadPhotosToStorage() : []

      // 1. Create valuation
      const res1 = await fetch('/api/valuations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          development_id: selectedDev?.id || null,
          purpose,
          requester_name: requesterName,
          method: 'comparative_direct',
          subject_area_sqm: parseFloat(subjectArea) || null,
          photos: uploadedPhotos,
        }),
      })
      const { data: val } = await res1.json()
      if (!val?.id) throw new Error('Falha ao criar avaliação')
      setValuationId(val.id)

      // 2. Add comparables
      for (const c of comparables) {
        await fetch(`/api/valuations/${val.id}/comparables`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: c.address,
            neighborhood: c.neighborhood,
            city: c.city,
            state: c.state,
            area_sqm: parseFloat(c.area_sqm) || 0,
            bedrooms: parseInt(c.bedrooms) || 0,
            bathrooms: parseInt(c.bathrooms) || 0,
            parking_spots: parseInt(c.parking_spots) || 0,
            asking_price: parseFloat(c.asking_price) || 0,
            source: c.source,
            source_url: c.source_url,
            offer_factor: c.offer_factor,
            area_factor: c.area_factor,
            location_factor: c.location_factor,
            age_factor: c.age_factor,
            floor_factor: c.floor_factor,
            parking_factor: c.parking_factor,
            extra_factor: c.extra_factor,
          }),
        })
      }

      // 3. Calculate
      setCalculating(true)
      const res3 = await fetch(`/api/valuations/${val.id}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_area_sqm: parseFloat(subjectArea) }),
      })
      const { data: result } = await res3.json()
      if (result) setCalcResult(result)
      setCalculating(false)

      toast.success('PTAM salvo com sucesso!')
    } catch (err) {
      console.error('[SAVE]', err)
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  // Preview HTML
  const openPreview = () => {
    const id = valuationId
    if (id) {
      window.open(`/api/valuations/${id}/export?format=html`, '_blank')
    } else {
      toast.error('Salve a avaliação primeiro')
    }
  }

  // ============================================================
  // STYLES
  // ============================================================
  const btnPrimary: React.CSSProperties = {
    background: `linear-gradient(135deg, ${T.gold}, #D4B86A)`,
    color: '#050B14',
    border: 'none',
    borderRadius: 10,
    padding: '10px 24px',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  }
  const btnSecondary: React.CSSProperties = {
    background: 'transparent',
    color: T.text,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: '10px 24px',
    fontWeight: 500,
    fontSize: 14,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: T.textMuted, marginBottom: 4, display: 'block', fontWeight: 500,
  }
  const sectionCard: React.CSSProperties = {
    ...cardStyle,
    padding: mobile ? 16 : 24,
    marginBottom: 16,
  }

  // ============================================================
  // RENDER STEPS
  // ============================================================

  const renderStep1 = () => (
    <div style={sectionCard}>
      <h3 style={{ color: T.text, fontSize: 18, marginBottom: 16, fontFamily: T.font.display }}>
        <Building2 size={20} style={{ marginRight: 8, verticalAlign: 'middle', color: T.gold }} />
        Imóvel Avaliando
      </h3>

      {/* Development search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <label style={labelStyle}>Empreendimento</label>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: T.textMuted }} />
          <input
            style={{ ...inputStyle, paddingLeft: 36 }}
            placeholder="Buscar empreendimento..."
            value={selectedDev ? selectedDev.name : devSearch}
            onChange={e => { setDevSearch(e.target.value); setSelectedDev(null); setShowDevDropdown(true) }}
            onFocus={() => setShowDevDropdown(true)}
          />
          {selectedDev && (
            <button
              onClick={() => { setSelectedDev(null); setDevSearch('') }}
              style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer' }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        {showDevDropdown && !selectedDev && filteredDevs.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
            maxHeight: 200, overflowY: 'auto',
          }}>
            {filteredDevs.slice(0, 20).map(d => (
              <button
                key={d.id}
                onClick={() => { setSelectedDev(d); setShowDevDropdown(false); setDevSearch('') }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
                  background: 'transparent', border: 'none', color: T.text, cursor: 'pointer',
                  borderBottom: `1px solid ${T.borderLight}`, fontSize: 13,
                }}
              >
                <strong>{d.name}</strong>
                <br />
                <span style={{ fontSize: 11, color: T.textMuted }}>{d.address || d.location || ''}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedDev && (
        <div style={{ padding: 12, background: T.accentBg, borderRadius: 8, marginBottom: 16, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{selectedDev.name}</div>
          <div style={{ fontSize: 12, color: T.textMuted }}>{selectedDev.address || selectedDev.location || ''}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div>
          <label style={labelStyle}>Área do Imóvel (m²) *</label>
          <input
            style={inputStyle}
            type="number"
            placeholder="Ex: 85"
            value={subjectArea}
            onChange={e => setSubjectArea(e.target.value)}
          />
        </div>
      </div>

      {/* Photo upload */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>
            <Camera size={14} style={{ marginRight: 4, verticalAlign: 'middle', color: T.gold }} />
            Fotos do Imóvel ({photos.length}/10)
          </label>
          {photos.length < 10 && (
            <button
              type="button"
              style={{ ...btnSecondary, padding: '6px 14px', fontSize: 12 }}
              onClick={() => photoInputRef.current?.click()}
            >
              <Plus size={14} /> Adicionar
            </button>
          )}
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handlePhotoSelect}
        />
        {photos.length === 0 ? (
          <div
            onClick={() => photoInputRef.current?.click()}
            style={{
              border: `2px dashed ${T.border}`,
              borderRadius: 10,
              padding: '20px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              color: T.textMuted,
              fontSize: 12,
            }}
          >
            <ImageIcon size={28} style={{ opacity: 0.4, display: 'block', margin: '0 auto 8px' }} />
            Clique para adicionar fotos do imóvel (opcional, máx. 10)
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: 8,
          }}>
            {photos.map(photo => (
              <div key={photo.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                <img
                  src={photo.preview}
                  alt={photo.caption || photo.file.name}
                  style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
                />
                {photo.uploading && (
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Loader2 size={20} style={{ color: T.gold }} className="animate-spin" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  style={{
                    position: 'absolute', top: 4, right: 4,
                    background: 'rgba(0,0,0,0.6)', border: 'none',
                    borderRadius: '50%', width: 22, height: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#fff',
                  }}
                >
                  <X size={12} />
                </button>
                <input
                  value={photo.caption}
                  onChange={e => setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, caption: e.target.value } : p))}
                  placeholder="Legenda..."
                  style={{
                    width: '100%', padding: '4px 6px', fontSize: 10,
                    background: T.surfaceAlt, border: 'none', color: T.text,
                    outline: 'none',
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div style={sectionCard}>
      <h3 style={{ color: T.text, fontSize: 18, marginBottom: 16, fontFamily: T.font.display }}>
        <FileText size={20} style={{ marginRight: 8, verticalAlign: 'middle', color: T.gold }} />
        Finalidade da Avaliação
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Finalidade *</label>
          <div style={{ position: 'relative' }}>
            <select
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              style={{ ...inputStyle, appearance: 'none', paddingRight: 32 }}
            >
              {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: 12, color: T.textMuted, pointerEvents: 'none' }} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Nome do Solicitante</label>
          <input
            style={inputStyle}
            placeholder="Nome do solicitante..."
            value={requesterName}
            onChange={e => setRequesterName(e.target.value)}
          />
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div style={sectionCard}>
      <h3 style={{ color: T.text, fontSize: 18, marginBottom: 16, fontFamily: T.font.display }}>
        <MapPin size={20} style={{ marginRight: 8, verticalAlign: 'middle', color: T.gold }} />
        Comparandos ({comparables.length})
      </h3>

      {comparables.length < 3 && (
        <div style={{ padding: 12, background: 'rgba(200,164,74,0.08)', borderRadius: 8, marginBottom: 16, fontSize: 13, color: T.textGold }}>
          Mínimo de 3 comparandos necessários. Atualmente: {comparables.length}
        </div>
      )}

      {/* List existing */}
      {comparables.map((c, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: 12, background: T.surfaceAlt, borderRadius: 8, marginBottom: 8,
          border: `1px solid ${T.borderLight}`,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
              #{i + 1} - {c.address}{c.neighborhood ? `, ${c.neighborhood}` : ''}
            </div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
              {c.area_sqm} m² | {fmtBRL(parseFloat(c.asking_price) || 0)} | {fmt(computePricePerSqm(c))} R$/m²
              {c.source ? ` | ${c.source}` : ''}
            </div>
          </div>
          <button onClick={() => removeComparable(i)} style={{ background: 'none', border: 'none', color: T.error, cursor: 'pointer', padding: 8 }}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      {/* Add form */}
      {showAddForm ? (
        <div style={{ padding: 16, background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}`, marginTop: 12 }}>
          <h4 style={{ color: T.textGold, fontSize: 14, marginBottom: 12 }}>Novo Comparando</h4>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Endereço *</label>
              <input style={inputStyle} placeholder="Rua..." value={newComp.address} onChange={e => setNewComp({ ...newComp, address: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Bairro</label>
              <input style={inputStyle} placeholder="Bairro..." value={newComp.neighborhood} onChange={e => setNewComp({ ...newComp, neighborhood: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Cidade</label>
              <input style={inputStyle} placeholder="Cidade..." value={newComp.city} onChange={e => setNewComp({ ...newComp, city: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Estado</label>
              <input style={inputStyle} placeholder="UF" maxLength={2} value={newComp.state} onChange={e => setNewComp({ ...newComp, state: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <label style={labelStyle}>Área (m²) *</label>
              <input style={inputStyle} type="number" placeholder="85" value={newComp.area_sqm} onChange={e => setNewComp({ ...newComp, area_sqm: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Preço Pedido (R$) *</label>
              <input style={inputStyle} type="number" placeholder="450000" value={newComp.asking_price} onChange={e => setNewComp({ ...newComp, asking_price: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Quartos</label>
              <input style={inputStyle} type="number" placeholder="2" value={newComp.bedrooms} onChange={e => setNewComp({ ...newComp, bedrooms: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Banheiros</label>
              <input style={inputStyle} type="number" placeholder="1" value={newComp.bathrooms} onChange={e => setNewComp({ ...newComp, bathrooms: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Vagas</label>
              <input style={inputStyle} type="number" placeholder="1" value={newComp.parking_spots} onChange={e => setNewComp({ ...newComp, parking_spots: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Fonte</label>
              <div style={{ position: 'relative' }}>
                <select style={{ ...inputStyle, appearance: 'none', paddingRight: 32 }} value={newComp.source} onChange={e => setNewComp({ ...newComp, source: e.target.value })}>
                  <option value="">Selecionar...</option>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: 12, color: T.textMuted, pointerEvents: 'none' }} />
              </div>
            </div>
            <div style={{ gridColumn: mobile ? undefined : 'span 2' }}>
              <label style={labelStyle}>URL da Fonte</label>
              <input style={inputStyle} placeholder="https://..." value={newComp.source_url} onChange={e => setNewComp({ ...newComp, source_url: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button style={btnPrimary} onClick={addComparable}><Plus size={16} /> Adicionar</button>
            <button style={btnSecondary} onClick={() => setShowAddForm(false)}>Cancelar</button>
          </div>
        </div>
      ) : (
        <button
          style={{ ...btnSecondary, marginTop: 12, width: '100%', justifyContent: 'center' }}
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={16} /> Adicionar Comparando
        </button>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div style={sectionCard}>
      <h3 style={{ color: T.text, fontSize: 18, marginBottom: 16, fontFamily: T.font.display }}>
        <Scale size={20} style={{ marginRight: 8, verticalAlign: 'middle', color: T.gold }} />
        Fatores de Homogeneização
      </h3>
      <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 16 }}>
        Ajuste os fatores conforme NBR 14653-2. Valores entre 0.50 e 1.50.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              <th style={{ padding: '8px 6px', textAlign: 'left', color: T.textGold, fontSize: 11 }}>#</th>
              <th style={{ padding: '8px 6px', textAlign: 'left', color: T.textGold, fontSize: 11 }}>Endereço</th>
              <th style={{ padding: '8px 6px', textAlign: 'center', color: T.textGold, fontSize: 11 }}>R$/m²</th>
              <th style={{ padding: '8px 6px', textAlign: 'center', color: T.textGold, fontSize: 11 }}>Oferta</th>
              <th style={{ padding: '8px 6px', textAlign: 'center', color: T.textGold, fontSize: 11 }}>Área</th>
              <th style={{ padding: '8px 6px', textAlign: 'center', color: T.textGold, fontSize: 11 }}>Local.</th>
              <th style={{ padding: '8px 6px', textAlign: 'center', color: T.textGold, fontSize: 11 }}>Idade</th>
              <th style={{ padding: '8px 6px', textAlign: 'center', color: T.textGold, fontSize: 11 }}>Pav.</th>
              <th style={{ padding: '8px 6px', textAlign: 'center', color: T.textGold, fontSize: 11 }}>Vagas</th>
              <th style={{ padding: '8px 6px', textAlign: 'center', color: T.textGold, fontSize: 11 }}>Extra</th>
              <th style={{ padding: '8px 6px', textAlign: 'center', color: T.textGold, fontSize: 11 }}>Hom. R$/m²</th>
            </tr>
          </thead>
          <tbody>
            {comparables.map((c, i) => {
              const factorInput = (field: keyof ComparableEntry) => (
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="1.5"
                  value={c[field] as number}
                  onChange={e => updateFactor(i, field, parseFloat(e.target.value) || 1)}
                  style={{
                    ...inputStyle,
                    width: 60,
                    padding: '4px 6px',
                    fontSize: 12,
                    textAlign: 'center',
                  }}
                />
              )
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                  <td style={{ padding: '8px 6px', color: T.textMuted }}>{i + 1}</td>
                  <td style={{ padding: '8px 6px', color: T.text, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.address}
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'center', color: T.text }}>{fmt(computePricePerSqm(c))}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'center' }}>{factorInput('offer_factor')}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'center' }}>{factorInput('area_factor')}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'center' }}>{factorInput('location_factor')}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'center' }}>{factorInput('age_factor')}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'center' }}>{factorInput('floor_factor')}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'center' }}>{factorInput('parking_factor')}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'center' }}>{factorInput('extra_factor')}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'center', color: T.textGold, fontWeight: 600 }}>
                    {fmt(computeHomogenized(c))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderStep5 = () => {
    if (!calcResult) return <div style={sectionCard}><p style={{ color: T.textMuted }}>Calculando...</p></div>

    const cv = calcResult.coefficient_of_variation
    const cvColor = cv <= 25 ? T.success : cv <= 30 ? T.warning : T.error
    const gradeColor = calcResult.confidence_grade === 'III' ? T.success
      : calcResult.confidence_grade === 'II' ? T.warning : T.error

    return (
      <div>
        <div style={sectionCard}>
          <h3 style={{ color: T.text, fontSize: 18, marginBottom: 16, fontFamily: T.font.display }}>
            <BarChart2 size={20} style={{ marginRight: 8, verticalAlign: 'middle', color: T.gold }} />
            Resultado da Análise
          </h3>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Média R$/m²', value: fmt(calcResult.average_price_per_sqm), color: T.textGold },
              { label: 'Mediana R$/m²', value: fmt(calcResult.median_price_per_sqm), color: T.text },
              { label: 'Desvio Padrão', value: fmt(calcResult.std_deviation), color: T.text },
              { label: 'CV%', value: fmt(calcResult.coefficient_of_variation) + '%', color: cvColor },
              { label: 'Elementos', value: String(comparables.length), color: T.text },
              { label: 'Grau', value: calcResult.confidence_grade, color: gradeColor },
            ].map((s, i) => (
              <div key={i} style={{ padding: 14, background: T.surfaceAlt, borderRadius: 10, textAlign: 'center', border: `1px solid ${T.borderLight}` }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: T.font.display }}>{s.value}</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Estimated value */}
          <div style={{
            padding: 24, background: 'linear-gradient(135deg, #050B14, #0d2240)',
            borderRadius: 12, textAlign: 'center', border: `2px solid ${T.gold}`,
          }}>
            <div style={{ fontSize: 12, color: T.textMuted }}>Valor de Mercado Estimado</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: T.gold, fontFamily: T.font.display, margin: '8px 0' }}>
              {fmtBRL(calcResult.estimated_value)}
            </div>
            <div style={{ fontSize: 12, color: T.textMuted }}>
              {fmtBRL(calcResult.average_price_per_sqm)}/m² x {subjectArea} m²
            </div>
            <span style={{
              display: 'inline-block', marginTop: 12,
              background: T.gold, color: '#050B14',
              padding: '4px 16px', borderRadius: 20,
              fontWeight: 700, fontSize: 13,
            }}>
              Grau {calcResult.confidence_grade} - NBR 14653
            </span>
          </div>
        </div>

        {/* Confidence interval */}
        <div style={sectionCard}>
          <h4 style={{ color: T.text, fontSize: 14, marginBottom: 12 }}>Intervalo de Confiança (80%)</h4>
          {(() => {
            const lower = calcResult.estimated_value * 0.85
            const upper = calcResult.estimated_value * 1.15
            const range = upper - lower
            const midPct = ((calcResult.estimated_value - lower) / range) * 100
            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.textMuted, marginBottom: 4 }}>
                  <span>{fmtBRL(lower)}</span>
                  <span style={{ color: T.textGold, fontWeight: 600 }}>{fmtBRL(calcResult.estimated_value)}</span>
                  <span>{fmtBRL(upper)}</span>
                </div>
                <div style={{ height: 8, background: T.surfaceAlt, borderRadius: 4, position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: '100%', borderRadius: 4,
                    background: `linear-gradient(90deg, ${T.error}, ${T.warning}, ${T.success}, ${T.warning}, ${T.error})`,
                    opacity: 0.3,
                  }} />
                  <div style={{
                    position: 'absolute', top: -3, width: 14, height: 14,
                    borderRadius: '50%', background: T.gold, border: '2px solid #fff',
                    left: `calc(${midPct}% - 7px)`,
                  }} />
                </div>
              </div>
            )
          })()}
        </div>

        {/* Comparables summary */}
        <div style={sectionCard}>
          <h4 style={{ color: T.text, fontSize: 14, marginBottom: 12 }}>Resumo dos Comparandos</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ padding: 6, textAlign: 'left', color: T.textGold }}>#</th>
                  <th style={{ padding: 6, textAlign: 'left', color: T.textGold }}>Endereço</th>
                  <th style={{ padding: 6, textAlign: 'right', color: T.textGold }}>R$/m²</th>
                  <th style={{ padding: 6, textAlign: 'right', color: T.textGold }}>Hom. R$/m²</th>
                </tr>
              </thead>
              <tbody>
                {comparables.map((c, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                    <td style={{ padding: 6, color: T.textMuted }}>{i + 1}</td>
                    <td style={{ padding: 6, color: T.text }}>{c.address}</td>
                    <td style={{ padding: 6, textAlign: 'right', color: T.text }}>{fmt(computePricePerSqm(c))}</td>
                    <td style={{ padding: 6, textAlign: 'right', color: T.textGold, fontWeight: 600 }}>{fmt(computeHomogenized(c))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const renderStep6 = () => (
    <div style={sectionCard}>
      <h3 style={{ color: T.text, fontSize: 18, marginBottom: 16, fontFamily: T.font.display }}>
        <Download size={20} style={{ marginRight: 8, verticalAlign: 'middle', color: T.gold }} />
        Gerar PTAM
      </h3>

      {!valuationId ? (
        <div>
          <p style={{ color: T.textMuted, fontSize: 13, marginBottom: 16 }}>
            Salve a avaliação no banco de dados para gerar o parecer técnico.
          </p>
          <button
            style={{ ...btnPrimary, width: '100%', justifyContent: 'center', opacity: saving ? 0.6 : 1 }}
            onClick={saveToDatabase}
            disabled={saving}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Salvando...' : 'Salvar Avaliação'}
          </button>
        </div>
      ) : (
        <div>
          <div style={{ padding: 14, background: T.accentBg, borderRadius: 8, marginBottom: 16, border: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={18} style={{ color: T.success }} />
              <span style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>Avaliação salva com sucesso!</span>
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>ID: {valuationId}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', gap: 12 }}>
            <button style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }} onClick={openPreview}>
              <Eye size={16} /> Visualizar PTAM
            </button>
            <button
              style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }}
              onClick={() => {
                const link = document.createElement('a')
                link.href = `/api/valuations/${valuationId}/export?format=html`
                link.download = `PTAM-${valuationId}.html`
                link.click()
              }}
            >
              <Download size={16} /> Download HTML
            </button>
          </div>

          {calcResult && (
            <div style={{ marginTop: 20, padding: 16, background: T.surfaceAlt, borderRadius: 10, textAlign: 'center', border: `1px solid ${T.borderLight}` }}>
              <div style={{ fontSize: 12, color: T.textMuted }}>Valor Final</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: T.gold, fontFamily: T.font.display }}>{fmtBRL(calcResult.estimated_value)}</div>
              <div style={{ fontSize: 12, color: T.textMuted }}>Grau {calcResult.confidence_grade}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div style={{ minHeight: '100vh', padding: mobile ? '0 12px 80px' : '0 24px 40px' }}>
      <PageIntelHeader
        moduleLabel="AVALIACAO"
        title="Novo PTAM"
        subtitle="Parecer Técnico de Avaliação Mercadológica - NBR 14653"
        breadcrumbs={[
          { label: 'Backoffice', href: '/backoffice' },
          { label: 'Avaliações', href: '/backoffice/avaliacoes' },
          { label: 'Novo PTAM' },
        ]}
      />

      {/* Step indicator */}
      <div style={{
        display: 'flex', gap: mobile ? 2 : 4, marginBottom: 24,
        overflowX: 'auto', paddingBottom: 4,
      }}>
        {STEPS.map(s => {
          const active = s.num === step
          const done = s.num < step
          return (
            <button
              key={s.num}
              onClick={() => {
                if (s.num <= step || done) setStep(s.num)
              }}
              style={{
                flex: mobile ? undefined : 1,
                minWidth: mobile ? 48 : undefined,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: mobile ? '8px 10px' : '10px 14px',
                borderRadius: 8,
                border: active ? `1px solid ${T.gold}` : `1px solid ${T.borderLight}`,
                background: active ? T.accentBg : done ? 'rgba(34,197,94,0.06)' : 'transparent',
                color: active ? T.gold : done ? T.success : T.textMuted,
                cursor: s.num <= step ? 'pointer' : 'default',
                fontSize: 12, fontWeight: active ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {done ? <Check size={14} /> : s.icon}
              {!mobile && <span>{s.label}</span>}
            </button>
          )
        })}
      </div>

      {/* Step content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}
      {step === 6 && renderStep6()}

      {/* Navigation */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: 20,
        ...(mobile ? { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: T.surface, borderTop: `1px solid ${T.border}`, zIndex: 40 } : {}),
      }}>
        <button
          style={{ ...btnSecondary, opacity: step === 1 ? 0.4 : 1 }}
          onClick={goPrev}
          disabled={step === 1}
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        {step < 6 ? (
          <button
            style={{ ...btnPrimary, opacity: canNext() ? 1 : 0.4 }}
            onClick={goNext}
            disabled={!canNext()}
          >
            Próximo <ArrowRight size={16} />
          </button>
        ) : null}
      </div>
    </div>
  )
}
