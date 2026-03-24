'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign, Home, BarChart3, TrendingUp, Plus, Loader2,
  CalendarDays, Building2, Users, ExternalLink, Key,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { KPICard } from '@/app/(backoffice)/components/ui/KPICard'
import { T } from '@/app/(backoffice)/lib/theme'

/* ── Types ─────────────────────────────────────────────── */
interface RentalProperty {
  id: string
  name: string
  address: string | null
  status: string
  daily_rate: number | null
  listing_mode: string
  bedrooms: number
}

interface RentalBooking {
  id: string
  guest_name: string
  check_in: string
  check_out: string
  nights: number
  source: string
  status: string
  total_amount: number
  payment_status: string
  rental_properties?: { name: string } | null
}

interface DashboardData {
  stats: {
    totalProperties: number
    activeProperties: number
    totalRevenue: number
    avgDailyRate: number
    occupancyRate: number
    bookingsCount: number
  }
  properties: RentalProperty[]
  recentBookings: RentalBooking[]
}

/* ── Helpers ───────────────────────────────────────────── */
const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const fmtDate = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  active:      { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Ativo' },
  maintenance: { bg: 'var(--warning-bg)', color: 'var(--warning)', label: 'Manutenção' },
  blocked:     { bg: 'var(--error-bg)',   color: 'var(--error)',   label: 'Bloqueado' },
  inactive:    { bg: 'var(--bg-muted)',   color: 'var(--text-tertiary)', label: 'Inativo' },
}

const BOOKING_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  pending:     { bg: 'var(--warning-bg)', color: 'var(--warning)', label: 'Pendente' },
  confirmed:   { bg: 'var(--info-bg)',    color: 'var(--info)',    label: 'Confirmada' },
  checked_in:  { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Check-in' },
  checked_out: { bg: 'var(--bg-muted)',   color: 'var(--text-tertiary)', label: 'Check-out' },
  cancelled:   { bg: 'var(--error-bg)',   color: 'var(--error)',   label: 'Cancelada' },
  no_show:     { bg: 'var(--error-bg)',   color: 'var(--error)',   label: 'No-show' },
}

const SOURCE_COLORS: Record<string, { bg: string; color: string }> = {
  direct:  { bg: 'rgba(200,164,74,0.14)', color: 'var(--gold, #C8A44A)' },
  airbnb:  { bg: 'rgba(255,88,93,0.14)',  color: '#FF585D' },
  booking: { bg: 'rgba(0,83,159,0.14)',    color: '#60A5FA' },
  other:   { bg: 'var(--bg-muted)',        color: 'var(--text-tertiary)' },
}

/* ── Page ──────────────────────────────────────────────── */
export default function RentalsPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/rentals/dashboard')
      .then(r => r.json())
      .then(json => setData(json))
      .catch(() => toast.error('Erro ao carregar dados'))
      .finally(() => setLoading(false))
  }, [])

  const stats = data?.stats
  const properties = data?.properties ?? []
  const bookings = data?.recentBookings ?? []

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <PageIntelHeader
        moduleLabel="RENTALS &middot; SHORT STAY"
        title="Gestão de Locações"
        subtitle="Controle de imóveis, reservas e receita de locação curta e longa temporada"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/backoffice/rentals/calendar"
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-all"
              style={{
                background: 'var(--bg-elevated)',
                border: `1px solid ${T.border}`,
                borderRadius: '4px',
                color: T.textMuted,
                fontFamily: 'var(--font-sans)',
              }}
            >
              <CalendarDays size={14} />
              Calendário
            </Link>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all"
              style={{
                background: T.gold,
                color: '#0A1624',
                borderRadius: '4px',
                border: 'none',
                fontFamily: 'var(--font-sans)',
              }}
              onClick={() => toast.info('Formulário de novo imóvel em breve')}
            >
              <Plus size={14} />
              Novo Imóvel
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: T.gold }} />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <KPICard
              label="Receita do Mês"
              value={fmtCurrency(stats?.totalRevenue ?? 0)}
              icon={<DollarSign size={16} />}
              accent="gold"
              sublabel={`${stats?.bookingsCount ?? 0} reservas`}
            />
            <KPICard
              label="Ocupação"
              value={`${stats?.occupancyRate ?? 0}%`}
              icon={<BarChart3 size={16} />}
              accent="success"
              sublabel="taxa mensal"
            />
            <KPICard
              label="Imóveis"
              value={stats?.activeProperties ?? 0}
              icon={<Home size={16} />}
              accent="info"
              sublabel={`${stats?.totalProperties ?? 0} total`}
            />
            <KPICard
              label="Diária Média"
              value={fmtCurrency(stats?.avgDailyRate ?? 0)}
              icon={<TrendingUp size={16} />}
              accent="warning"
              sublabel="ADR mensal"
            />
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Properties List */}
            <div
              className="lg:col-span-2"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: `1px solid ${T.border}` }}
              >
                <div className="flex items-center gap-2">
                  <Building2 size={14} style={{ color: T.gold }} />
                  <span
                    style={{
                      fontFamily: "var(--font-body, 'Outfit', sans-serif)",
                      fontSize: 14,
                      fontWeight: 700,
                      color: T.text,
                    }}
                  >
                    Imóveis
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: T.textMuted,
                  }}
                >
                  {properties.length}
                </span>
              </div>

              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                {properties.length === 0 ? (
                  <div className="py-10 text-center">
                    <Key size={24} className="mx-auto mb-2" style={{ color: T.textDim, opacity: 0.4 }} />
                    <p style={{ fontSize: 12, color: T.textMuted, fontFamily: 'var(--font-sans)' }}>
                      Nenhum imóvel cadastrado
                    </p>
                  </div>
                ) : (
                  properties.map((prop, i) => {
                    const st = STATUS_COLORS[prop.status] || STATUS_COLORS.inactive
                    return (
                      <motion.div
                        key={prop.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 px-4 py-3 transition-all cursor-pointer"
                        style={{ borderBottom: `1px solid ${T.borderLight}` }}
                        onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className="truncate"
                            style={{
                              fontFamily: 'var(--font-sans)',
                              fontSize: 13,
                              fontWeight: 600,
                              color: T.text,
                            }}
                          >
                            {prop.name}
                          </p>
                          <p
                            className="truncate mt-0.5"
                            style={{ fontSize: 11, color: T.textMuted, fontFamily: 'var(--font-sans)' }}
                          >
                            {prop.address || 'Sem endereço'} &middot; {prop.bedrooms} quarto{prop.bedrooms !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {prop.daily_rate && (
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 11,
                                fontWeight: 600,
                                color: T.gold,
                              }}
                            >
                              {fmtCurrency(prop.daily_rate)}/dia
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                              padding: '2px 8px',
                              borderRadius: 3,
                              background: st.bg,
                              color: st.color,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                            }}
                          >
                            {st.label}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Recent Bookings */}
            <div
              className="lg:col-span-3"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: `1px solid ${T.border}` }}
              >
                <div className="flex items-center gap-2">
                  <Users size={14} style={{ color: T.gold }} />
                  <span
                    style={{
                      fontFamily: "var(--font-body, 'Outfit', sans-serif)",
                      fontSize: 14,
                      fontWeight: 700,
                      color: T.text,
                    }}
                  >
                    Reservas Recentes
                  </span>
                </div>
                <button
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 transition-all"
                  style={{
                    background: T.accentBg,
                    color: T.gold,
                    borderRadius: 4,
                    border: 'none',
                    fontFamily: 'var(--font-sans)',
                  }}
                  onClick={() => toast.info('Formulário de nova reserva em breve')}
                >
                  <Plus size={12} />
                  Nova Reserva
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
                  <thead>
                    <tr>
                      {['Hóspede', 'Imóvel', 'Check-in', 'Check-out', 'Fonte', 'Valor', 'Status'].map(h => (
                        <th
                          key={h}
                          className="text-left px-4 py-2.5"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            fontWeight: 700,
                            color: T.textDim,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            borderBottom: `1px solid ${T.border}`,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center">
                          <CalendarDays size={24} className="mx-auto mb-2" style={{ color: T.textDim, opacity: 0.4 }} />
                          <p style={{ fontSize: 12, color: T.textMuted, fontFamily: 'var(--font-sans)' }}>
                            Nenhuma reserva registrada
                          </p>
                        </td>
                      </tr>
                    ) : (
                      bookings.map((b, i) => {
                        const bst = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending
                        const src = SOURCE_COLORS[b.source] || SOURCE_COLORS.other
                        return (
                          <motion.tr
                            key={b.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            style={{ borderBottom: `1px solid ${T.borderLight}` }}
                            onMouseEnter={e => {
                              ;(e.currentTarget as HTMLElement).style.background = T.hover
                            }}
                            onMouseLeave={e => {
                              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                            }}
                          >
                            <td className="px-4 py-2.5">
                              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: T.text }}>
                                {b.guest_name}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: T.textMuted }}>
                                {b.rental_properties?.name ?? '-'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.text }}>
                                {fmtDate(b.check_in)}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.text }}>
                                {fmtDate(b.check_out)}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  fontFamily: 'var(--font-mono)',
                                  padding: '2px 6px',
                                  borderRadius: 3,
                                  background: src.bg,
                                  color: src.color,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                }}
                              >
                                {b.source}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: T.gold }}>
                                {fmtCurrency(b.total_amount)}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  fontFamily: 'var(--font-mono)',
                                  padding: '2px 8px',
                                  borderRadius: 3,
                                  background: bst.bg,
                                  color: bst.color,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                }}
                              >
                                {bst.label}
                              </span>
                            </td>
                          </motion.tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
