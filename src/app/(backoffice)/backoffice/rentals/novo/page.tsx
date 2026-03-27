'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Save, Loader2, Home, DollarSign, Users,
  Bed, Bath, Clock, Building2, MapPin, Wifi,
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
            {saving ? (
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
