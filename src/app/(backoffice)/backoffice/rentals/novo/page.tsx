'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Save, Loader2, Home, DollarSign, Users,
  Bed, Bath, Clock, Building2, MapPin, Wifi, Camera, Upload, X, Link as LinkIcon, FileVideo,
} from 'lucide-react'
import { toast } from 'sonner'
import { uploadMultipleImages, uploadFile } from '@/lib/supabase-storage'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { T } from '@/app/(backoffice)/lib/theme'

/* ── Types ─────────────────────────────────────────────── */
interface Development {
  id: string
  name: string
  city?: string
  neighborhood?: string
}

type PropertyType = 'apartment' | 'house' | 'studio' | 'commercial' | 'room' | 'penthouse'
type ListingMode = 'short_stay' | 'traditional' | 'hybrid' | 'seasonal'
type PropertyStatus = 'active' | 'maintenance' | 'blocked' | 'inactive'

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartamento' },
  { value: 'house', label: 'Casa' },
  { value: 'studio', label: 'Studio' },
  { value: 'penthouse', label: 'Cobertura' },
  { value: 'room', label: 'Quarto' },
  { value: 'commercial', label: 'Comercial' },
]

const LISTING_MODES: { value: ListingMode; label: string }[] = [
  { value: 'short_stay', label: 'Temporada Curta' },
  { value: 'traditional', label: 'Tradicional' },
  { value: 'hybrid', label: 'Hibrido' },
  { value: 'seasonal', label: 'Sazonal' },
]

const STATUS_OPTIONS: { value: PropertyStatus; label: string }[] = [
  { value: 'active', label: 'Ativo' },
  { value: 'maintenance', label: 'Em manutencao' },
  { value: 'blocked', label: 'Bloqueado' },
  { value: 'inactive', label: 'Inativo' },
]

/* ── Styles ────────────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 13,
  fontFamily: 'var(--font-sans)',
  color: T.text,
  background: T.elevated,
  border: `1px solid ${T.border}`,
  borderRadius: 6,
  outline: 'none',
  transition: 'border-color 0.2s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  fontFamily: 'var(--font-mono)',
  color: T.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 6,
}

const sectionTitleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 14,
  fontWeight: 700,
  fontFamily: "var(--font-body, 'Outfit', sans-serif)",
  color: T.text,
  marginBottom: 16,
  paddingBottom: 10,
  borderBottom: `1px solid ${T.border}`,
}

const cardStyle: React.CSSProperties = {
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  padding: 24,
  marginBottom: 16,
}

/* ── Page ──────────────────────────────────────────────── */
export default function NovoImovelRentalPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [developments, setDevelopments] = useState<Development[]>([])
  const [loadingDevs, setLoadingDevs] = useState(true)

  // Form state
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [developmentId, setDevelopmentId] = useState('')
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment')
  const [listingMode, setListingMode] = useState<ListingMode>('short_stay')
  const [status, setStatus] = useState<PropertyStatus>('active')
  const [dailyRate, setDailyRate] = useState('')
  const [monthlyRate, setMonthlyRate] = useState('')
  const [cleaningFee, setCleaningFee] = useState('')
  const [maxGuests, setMaxGuests] = useState('4')
  const [bedrooms, setBedrooms] = useState('1')
  const [bathrooms, setBathrooms] = useState('1')
  const [checkInTime, setCheckInTime] = useState('15:00')
  const [checkOutTime, setCheckOutTime] = useState('11:00')
  const [ownerName, setOwnerName] = useState('')
  const [managementFee, setManagementFee] = useState('20')
  const [airbnbId, setAirbnbId] = useState('')
  const [bookingId, setBookingId] = useState('')
  const [directBooking, setDirectBooking] = useState(true)
  const [rules, setRules] = useState('')

  // Media state
  const [images, setImages] = useState<File[]>([])
  const [floorPlans, setFloorPlans] = useState<File[]>([])
  const [brochure, setBrochure] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoShortUrl, setVideoShortUrl] = useState('')
  const [uploadingMedia, setUploadingMedia] = useState(false)

  // Load developments for the dropdown
  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()
      supabase
        .from('developments')
        .select('id, name, city, neighborhood')
        .order('name')
        .then(({ data }) => {
          setDevelopments(data ?? [])
          setLoadingDevs(false)
        })
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Informe o nome do imovel')
      return
    }

    setSaving(true)
    try {
      // Upload media
      setUploadingMedia(true)
      let photoUrls: string[] = []
      let floorPlanUrls: string[] = []
      let brochureUrl: string | null = null

      if (images.length > 0) {
        const results = await uploadMultipleImages(images, { bucket: 'media', folder: 'rentals' })
        photoUrls = results.filter(r => !r.error).map(r => r.url)
      }
      if (floorPlans.length > 0) {
        const results = await uploadMultipleImages(floorPlans, { bucket: 'media', folder: 'rentals/floor-plans' })
        floorPlanUrls = results.filter(r => !r.error).map(r => r.url)
      }
      if (brochure) {
        const result = await uploadFile(brochure, 'media', 'rentals/brochures')
        if (!result.error) brochureUrl = result.url
      }
      setUploadingMedia(false)

      const body = {
        name: name.trim(),
        address: address.trim() || undefined,
        development_id: developmentId || undefined,
        property_type: propertyType,
        listing_mode: listingMode,
        status,
        daily_rate: dailyRate ? parseFloat(dailyRate) : undefined,
        monthly_rate: monthlyRate ? parseFloat(monthlyRate) : undefined,
        cleaning_fee: cleaningFee ? parseFloat(cleaningFee) : undefined,
        max_guests: parseInt(maxGuests) || 4,
        bedrooms: parseInt(bedrooms) || 1,
        bathrooms: parseInt(bathrooms) || 1,
        check_in_time: checkInTime || '15:00',
        check_out_time: checkOutTime || '11:00',
        owner_name: ownerName.trim() || undefined,
        management_fee_pct: managementFee ? parseFloat(managementFee) : 20,
        airbnb_listing_id: airbnbId.trim() || undefined,
        booking_listing_id: bookingId.trim() || undefined,
        direct_booking_enabled: directBooking,
        rules: rules.trim() || undefined,
        photos: photoUrls.length > 0 ? photoUrls : undefined,
        floor_plans: floorPlanUrls.length > 0 ? floorPlanUrls : undefined,
        brochure_url: brochureUrl || undefined,
        video_url: videoUrl.trim() || undefined,
        video_short_url: videoShortUrl.trim() || undefined,
      }

      const res = await fetch('/api/rentals/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      toast.success('Imovel cadastrado com sucesso!')
      router.push('/backoffice/rentals')
    } catch (err) {
      setUploadingMedia(false)
      toast.error(err instanceof Error ? err.message : 'Erro ao cadastrar imovel')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <PageIntelHeader
        moduleLabel="RENTALS &middot; NOVO IMOVEL"
        title="Cadastrar Imovel para Locacao"
        subtitle="Preencha os dados do imovel que sera disponibilizado para locacao"
        actions={
          <Link
            href="/backoffice/rentals"
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-all"
            style={{
              background: 'var(--bg-elevated)',
              border: `1px solid ${T.border}`,
              borderRadius: '4px',
              color: T.textMuted,
              fontFamily: 'var(--font-sans)',
            }}
          >
            <ArrowLeft size={14} />
            Voltar
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <Home size={16} style={{ color: T.gold }} />
            Informacoes Basicas
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label style={labelStyle}>Nome do Imovel *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Apto 302 - Marinas Beach"
                style={inputStyle}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label style={labelStyle}>Endereco</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Rua, numero, bairro"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Empreendimento Vinculado</label>
              <select
                value={developmentId}
                onChange={e => setDevelopmentId(e.target.value)}
                style={inputStyle}
              >
                <option value="">Nenhum (avulso)</option>
                {loadingDevs ? (
                  <option disabled>Carregando...</option>
                ) : (
                  developments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}{d.city ? ` - ${d.city}` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Tipo de Imovel</label>
              <select
                value={propertyType}
                onChange={e => setPropertyType(e.target.value as PropertyType)}
                style={inputStyle}
              >
                {PROPERTY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Modo de Locacao</label>
              <select
                value={listingMode}
                onChange={e => setListingMode(e.target.value as ListingMode)}
                style={inputStyle}
              >
                {LISTING_MODES.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as PropertyStatus)}
                style={inputStyle}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <DollarSign size={16} style={{ color: T.gold }} />
            Precificacao
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label style={labelStyle}>Diaria (R$)</label>
              <input
                type="number"
                value={dailyRate}
                onChange={e => setDailyRate(e.target.value)}
                placeholder="350"
                min="0"
                step="0.01"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Mensal (R$)</label>
              <input
                type="number"
                value={monthlyRate}
                onChange={e => setMonthlyRate(e.target.value)}
                placeholder="5000"
                min="0"
                step="0.01"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Taxa de Limpeza (R$)</label>
              <input
                type="number"
                value={cleaningFee}
                onChange={e => setCleaningFee(e.target.value)}
                placeholder="150"
                min="0"
                step="0.01"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Capacity & Specs */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <Users size={16} style={{ color: T.gold }} />
            Capacidade e Estrutura
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label style={labelStyle}>
                <span className="inline-flex items-center gap-1"><Users size={11} /> Max. Hospedes</span>
              </label>
              <input
                type="number"
                value={maxGuests}
                onChange={e => setMaxGuests(e.target.value)}
                min="1"
                max="30"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                <span className="inline-flex items-center gap-1"><Bed size={11} /> Quartos</span>
              </label>
              <input
                type="number"
                value={bedrooms}
                onChange={e => setBedrooms(e.target.value)}
                min="0"
                max="20"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                <span className="inline-flex items-center gap-1"><Bath size={11} /> Banheiros</span>
              </label>
              <input
                type="number"
                value={bathrooms}
                onChange={e => setBathrooms(e.target.value)}
                min="0"
                max="20"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                <span className="inline-flex items-center gap-1"><Clock size={11} /> Check-in</span>
              </label>
              <input
                type="time"
                value={checkInTime}
                onChange={e => setCheckInTime(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                <span className="inline-flex items-center gap-1"><Clock size={11} /> Check-out</span>
              </label>
              <input
                type="time"
                value={checkOutTime}
                onChange={e => setCheckOutTime(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Owner & Management */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <Building2 size={16} style={{ color: T.gold }} />
            Proprietario e Gestao
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Nome do Proprietario</label>
              <input
                type="text"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                placeholder="Nome completo"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Taxa de Administracao (%)</label>
              <input
                type="number"
                value={managementFee}
                onChange={e => setManagementFee(e.target.value)}
                min="0"
                max="100"
                step="0.5"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Channels */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <Wifi size={16} style={{ color: T.gold }} />
            Canais de Distribuicao
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Airbnb Listing ID</label>
              <input
                type="text"
                value={airbnbId}
                onChange={e => setAirbnbId(e.target.value)}
                placeholder="ID do anuncio no Airbnb"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Booking.com Listing ID</label>
              <input
                type="text"
                value={bookingId}
                onChange={e => setBookingId(e.target.value)}
                placeholder="ID do anuncio no Booking"
                style={inputStyle}
              />
            </div>

            <div className="md:col-span-2">
              <label
                style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={directBooking}
                  onChange={e => setDirectBooking(e.target.checked)}
                  style={{ accentColor: T.gold }}
                />
                <span>Reserva direta habilitada</span>
              </label>
            </div>
          </div>
        </div>

        {/* Rules */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <MapPin size={16} style={{ color: T.gold }} />
            Regras da Casa
          </div>

          <div>
            <label style={labelStyle}>Regras e Observacoes</label>
            <textarea
              value={rules}
              onChange={e => setRules(e.target.value)}
              placeholder="Regras de convivencia, instrucoes de acesso, etc."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Media */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <Camera size={16} style={{ color: T.gold }} />
            Midia
          </div>

          {/* Gallery */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Galeria de Imagens</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: T.elevated, border: `1px solid ${images.length > 0 ? T.gold : T.border}`, borderRadius: 6, cursor: 'pointer' }}>
              <Upload size={15} color={images.length > 0 ? T.gold : T.textMuted} />
              <span style={{ fontSize: 13, color: images.length > 0 ? T.gold : T.textMuted, fontFamily: 'var(--font-sans)', flex: 1 }}>
                {images.length > 0 ? `${images.length} imagem(ns) selecionada(s)` : 'Selecionar imagens (JPG, PNG, WEBP)'}
              </span>
              {images.length > 0 && (
                <button type="button" onClick={e => { e.preventDefault(); setImages([]) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', alignItems: 'center' }}><X size={14} /></button>
              )}
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { const files = Array.from(e.target.files || []); if (files.length) setImages(prev => [...prev, ...files]) }} />
            </label>
            {images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 10 }}>
                {images.map((file, idx) => (
                  <div key={idx} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 6, overflow: 'hidden', background: T.elevated }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={URL.createObjectURL(file)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {idx === 0 && <span style={{ position: 'absolute', top: 4, left: 4, background: T.gold, color: '#0A1624', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>CAPA</span>}
                    <button type="button" onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><X size={11} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Floor Plans */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Plantas Baixas</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: T.elevated, border: `1px solid ${floorPlans.length > 0 ? T.gold : T.border}`, borderRadius: 6, cursor: 'pointer' }}>
              <Upload size={15} color={floorPlans.length > 0 ? T.gold : T.textMuted} />
              <span style={{ fontSize: 13, color: floorPlans.length > 0 ? T.gold : T.textMuted, fontFamily: 'var(--font-sans)', flex: 1 }}>
                {floorPlans.length > 0 ? `${floorPlans.length} arquivo(s) selecionado(s)` : 'Selecionar plantas (imagem ou PDF)'}
              </span>
              <input type="file" accept="image/*,application/pdf" multiple style={{ display: 'none' }} onChange={e => { const files = Array.from(e.target.files || []); if (files.length) setFloorPlans(prev => [...prev, ...files]) }} />
            </label>
          </div>

          {/* Brochure */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Brochure / Material</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: T.elevated, border: `1px solid ${brochure ? T.gold : T.border}`, borderRadius: 6, cursor: 'pointer' }}>
              <Upload size={15} color={brochure ? T.gold : T.textMuted} />
              <span style={{ fontSize: 13, color: brochure ? T.gold : T.textMuted, fontFamily: 'var(--font-sans)', flex: 1 }}>{brochure ? brochure.name : 'Selecionar PDF ou imagem'}</span>
              {brochure && <button type="button" onClick={e => { e.preventDefault(); setBrochure(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', alignItems: 'center' }}><X size={14} /></button>}
              <input type="file" accept="application/pdf,image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setBrochure(f) }} />
            </label>
          </div>

          {/* Video URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>URL do Video (YouTube / Vimeo)</label>
              <div style={{ position: 'relative' }}>
                <LinkIcon size={14} color={T.textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." style={{ ...inputStyle, paddingLeft: 36 }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Video Curto (Reels / Shorts)</label>
              <div style={{ position: 'relative' }}>
                <FileVideo size={14} color={T.textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="url" value={videoShortUrl} onChange={e => setVideoShortUrl(e.target.value)} placeholder="https://youtube.com/shorts/..." style={{ ...inputStyle, paddingLeft: 36 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 mb-8">
          <Link
            href="/backoffice/rentals"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all"
            style={{
              background: 'transparent',
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              color: T.textMuted,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold transition-all"
            style={{
              background: saving ? T.textDim : T.gold,
              color: '#0A1624',
              borderRadius: 6,
              border: 'none',
              fontFamily: 'var(--font-sans)',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {uploadingMedia ? (
              <><Loader2 size={14} className="animate-spin" /> Enviando midia...</>
            ) : saving ? (
              <><Loader2 size={14} className="animate-spin" /> Salvando...</>
            ) : (
              <><Save size={14} /> Cadastrar Imovel</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
