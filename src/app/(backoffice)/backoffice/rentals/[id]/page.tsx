'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Save, Loader2, Home, DollarSign, Users,
  Bed, Bath, Clock, Building2, MapPin, Wifi, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
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
export default function EditRentalPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [developments, setDevelopments] = useState<Development[]>([])

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

  // Load property + developments
  useEffect(() => {
    async function load() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const [propRes, devRes] = await Promise.all([
        fetch(`/api/rentals/properties?id=${id}`),
        supabase.from('developments').select('id, name, city, neighborhood').order('name'),
      ])

      setDevelopments(devRes.data ?? [])

      if (propRes.ok) {
        const p = await propRes.json()
        setName(p.name || '')
        setAddress(p.address || '')
        setDevelopmentId(p.development_id || '')
        setPropertyType(p.property_type || 'apartment')
        setListingMode(p.listing_mode || 'short_stay')
        setStatus(p.status || 'active')
        setDailyRate(p.daily_rate?.toString() || '')
        setMonthlyRate(p.monthly_rate?.toString() || '')
        setCleaningFee(p.cleaning_fee?.toString() || '')
        setMaxGuests(p.max_guests?.toString() || '4')
        setBedrooms(p.bedrooms?.toString() || '1')
        setBathrooms(p.bathrooms?.toString() || '1')
        setCheckInTime(p.check_in_time || '15:00')
        setCheckOutTime(p.check_out_time || '11:00')
        setOwnerName(p.owner_name || '')
        setManagementFee(p.management_fee_pct?.toString() || '20')
        setAirbnbId(p.airbnb_listing_id || '')
        setBookingId(p.booking_listing_id || '')
        setDirectBooking(p.direct_booking_enabled ?? true)
        setRules(p.rules || '')
      } else {
        toast.error('Imóvel não encontrado')
        router.push('/backoffice/rentals')
      }

      setLoading(false)
    }
    load()
  }, [id, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Informe o nome do imóvel')
      return
    }

    setSaving(true)
    try {
      const body = {
        id,
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
      }

      const res = await fetch('/api/rentals/properties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      toast.success('Imóvel atualizado com sucesso!')
      router.push('/backoffice/rentals')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar imóvel')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Deseja desativar este imóvel? Ele não aparecerá mais nas listagens.')) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/rentals/properties?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao desativar')
      toast.success('Imóvel desativado')
      router.push('/backoffice/rentals')
    } catch {
      toast.error('Erro ao desativar imóvel')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 8, color: T.textMuted }}>
        <Loader2 size={20} className="animate-spin" /> Carregando...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <PageIntelHeader
        moduleLabel="RENTALS &middot; EDITAR"
        title={name || 'Editar Imóvel'}
        subtitle="Atualize os dados do imóvel de locação"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-all"
              style={{
                background: 'transparent',
                border: `1px solid #ef4444`,
                borderRadius: '4px',
                color: '#ef4444',
                fontFamily: 'var(--font-sans)',
                cursor: deleting ? 'not-allowed' : 'pointer',
                opacity: deleting ? 0.5 : 1,
              }}
            >
              <Trash2 size={14} />
              {deleting ? 'Desativando...' : 'Desativar'}
            </button>
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
          </div>
        }
      />

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <Home size={16} style={{ color: T.gold }} />
            Informações Básicas
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label style={labelStyle}>Nome do Imóvel *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Apto 302 - Marinas Beach" style={inputStyle} required />
            </div>
            <div className="md:col-span-2">
              <label style={labelStyle}>Endereço</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, bairro" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Empreendimento Vinculado</label>
              <select value={developmentId} onChange={e => setDevelopmentId(e.target.value)} style={inputStyle}>
                <option value="">Nenhum (avulso)</option>
                {developments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}{d.city ? ` - ${d.city}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tipo de Imóvel</label>
              <select value={propertyType} onChange={e => setPropertyType(e.target.value as PropertyType)} style={inputStyle}>
                {PROPERTY_TYPES.map(t => (<option key={t.value} value={t.value}>{t.label}</option>))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Modo de Locação</label>
              <select value={listingMode} onChange={e => setListingMode(e.target.value as ListingMode)} style={inputStyle}>
                {LISTING_MODES.map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as PropertyStatus)} style={inputStyle}>
                {STATUS_OPTIONS.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <DollarSign size={16} style={{ color: T.gold }} />
            Precificação
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label style={labelStyle}>Diária (R$)</label>
              <input type="number" value={dailyRate} onChange={e => setDailyRate(e.target.value)} placeholder="350" min="0" step="0.01" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Mensal (R$)</label>
              <input type="number" value={monthlyRate} onChange={e => setMonthlyRate(e.target.value)} placeholder="5000" min="0" step="0.01" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Taxa de Limpeza (R$)</label>
              <input type="number" value={cleaningFee} onChange={e => setCleaningFee(e.target.value)} placeholder="150" min="0" step="0.01" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Capacity */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <Users size={16} style={{ color: T.gold }} />
            Capacidade e Estrutura
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label style={labelStyle}><span className="inline-flex items-center gap-1"><Users size={11} /> Max. Hóspedes</span></label>
              <input type="number" value={maxGuests} onChange={e => setMaxGuests(e.target.value)} min="1" max="30" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}><span className="inline-flex items-center gap-1"><Bed size={11} /> Quartos</span></label>
              <input type="number" value={bedrooms} onChange={e => setBedrooms(e.target.value)} min="0" max="20" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}><span className="inline-flex items-center gap-1"><Bath size={11} /> Banheiros</span></label>
              <input type="number" value={bathrooms} onChange={e => setBathrooms(e.target.value)} min="0" max="20" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}><span className="inline-flex items-center gap-1"><Clock size={11} /> Check-in</span></label>
              <input type="time" value={checkInTime} onChange={e => setCheckInTime(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}><span className="inline-flex items-center gap-1"><Clock size={11} /> Check-out</span></label>
              <input type="time" value={checkOutTime} onChange={e => setCheckOutTime(e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Owner */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <Building2 size={16} style={{ color: T.gold }} />
            Proprietário e Gestão
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Nome do Proprietário</label>
              <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Nome completo" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Taxa de Administração (%)</label>
              <input type="number" value={managementFee} onChange={e => setManagementFee(e.target.value)} min="0" max="100" step="0.5" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Channels */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <Wifi size={16} style={{ color: T.gold }} />
            Canais de Distribuição
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Airbnb Listing ID</label>
              <input type="text" value={airbnbId} onChange={e => setAirbnbId(e.target.value)} placeholder="ID do anúncio no Airbnb" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Booking.com Listing ID</label>
              <input type="text" value={bookingId} onChange={e => setBookingId(e.target.value)} placeholder="ID do anúncio no Booking" style={inputStyle} />
            </div>
            <div className="md:col-span-2">
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={directBooking} onChange={e => setDirectBooking(e.target.checked)} style={{ accentColor: T.gold }} />
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
            <label style={labelStyle}>Regras e Observações</label>
            <textarea value={rules} onChange={e => setRules(e.target.value)} placeholder="Regras de convivência, instruções de acesso, etc." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 mb-8">
          <Link
            href="/backoffice/rentals"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all"
            style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, color: T.textMuted, fontFamily: 'var(--font-sans)' }}
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
            {saving ? (<><Loader2 size={14} className="animate-spin" /> Salvando...</>) : (<><Save size={14} /> Salvar Alterações</>)}
          </button>
        </div>
      </form>
    </div>
  )
}
