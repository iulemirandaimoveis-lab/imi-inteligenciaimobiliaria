'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { T } from '@/app/(backoffice)/lib/theme'

/* ── Types ─────────────────────────────────────────────── */
interface Booking {
  id: string
  guest_name: string
  check_in: string
  check_out: string
  source: string
  status: string
  property_id: string
  rental_properties?: { name: string; address: string } | null
}

interface Property {
  id: string
  name: string
}

/* ── Color map by booking source ───────────────────────── */
const SOURCE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  direct:  { bg: 'rgba(200,164,74,0.22)', color: '#C8A44A', border: 'rgba(200,164,74,0.5)' },
  airbnb:  { bg: 'rgba(255,88,93,0.18)',  color: '#FF585D', border: 'rgba(255,88,93,0.4)' },
  booking: { bg: 'rgba(96,165,250,0.18)', color: '#60A5FA', border: 'rgba(96,165,250,0.4)' },
  other:   { bg: 'var(--bg-muted)',        color: 'var(--text-tertiary)', border: 'var(--border-default)' },
}

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/* ── Page ──────────────────────────────────────────────── */
export default function RentalsCalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<string>('all')

  // Current month navigation
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())

  const goNext = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }
  const goPrev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  // Load data
  useEffect(() => {
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`

    Promise.all([
      fetch(`/api/rentals/bookings?from=${from}&to=${to}`).then(r => r.json()),
      fetch('/api/rentals/properties').then(r => r.json()),
    ])
      .then(([bData, pData]) => {
        setBookings(Array.isArray(bData) ? bData : [])
        setProperties(Array.isArray(pData) ? pData : [])
      })
      .catch(() => toast.error('Erro ao carregar calendário'))
      .finally(() => setLoading(false))
  }, [year, month])

  // Compute calendar grid
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7
  const today = new Date()
  const isToday = (d: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === d

  // Filter bookings by property
  const filteredBookings = useMemo(() => {
    if (selectedProperty === 'all') return bookings
    return bookings.filter(b => b.property_id === selectedProperty)
  }, [bookings, selectedProperty])

  // Map day -> bookings
  const dayBookings = useMemo(() => {
    const map: Record<number, Booking[]> = {}
    for (const b of filteredBookings) {
      if (b.status === 'cancelled') continue
      const cin = new Date(b.check_in + 'T12:00:00')
      const cout = new Date(b.check_out + 'T12:00:00')
      const mStart = new Date(year, month, 1)
      const mEnd = new Date(year, month + 1, 0)
      const start = cin < mStart ? 1 : cin.getDate()
      const end = cout > mEnd ? daysInMonth : cout.getDate()
      for (let d = start; d <= end; d++) {
        if (!map[d]) map[d] = []
        map[d].push(b)
      }
    }
    return map
  }, [filteredBookings, year, month, daysInMonth])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <PageIntelHeader
        moduleLabel="RENTALS &middot; CALENDÁRIO"
        title="Calendário de Reservas"
        subtitle="Visão mensal de ocupação e reservas por canal"
        breadcrumbs={[
          { label: 'Rentals', href: '/backoffice/rentals' },
          { label: 'Calendário' },
        ]}
      />

      {/* Controls */}
      <div
        className="flex items-center justify-between gap-3 mb-4 flex-wrap"
      >
        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            className="flex items-center justify-center"
            style={{
              width: 32, height: 32, borderRadius: 4,
              background: 'var(--bg-elevated)', border: `1px solid ${T.border}`,
            }}
          >
            <ChevronLeft size={16} style={{ color: T.textMuted }} />
          </button>
          <span
            style={{
              fontFamily: "var(--font-body, 'Outfit', sans-serif)",
              fontSize: 16,
              fontWeight: 700,
              color: T.text,
              minWidth: 180,
              textAlign: 'center',
            }}
          >
            {MONTHS_PT[month]} {year}
          </span>
          <button
            onClick={goNext}
            className="flex items-center justify-center"
            style={{
              width: 32, height: 32, borderRadius: 4,
              background: 'var(--bg-elevated)', border: `1px solid ${T.border}`,
            }}
          >
            <ChevronRight size={16} style={{ color: T.textMuted }} />
          </button>
        </div>

        {/* Property filter */}
        <select
          value={selectedProperty}
          onChange={e => setSelectedProperty(e.target.value)}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: T.text,
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 4,
            padding: '6px 10px',
            outline: 'none',
            minWidth: 180,
          }}
        >
          <option value="all">Todos os Imóveis</option>
          {properties.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: T.gold }} />
        </div>
      ) : (
        <>
          {/* Calendar Grid */}
          <div
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            {/* Weekday header */}
            <div className="grid grid-cols-7">
              {WEEKDAYS.map(d => (
                <div
                  key={d}
                  className="text-center py-2"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: T.textDim,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {Array.from({ length: totalCells }, (_, i) => {
                const day = i - firstDayOfWeek + 1
                const isValid = day >= 1 && day <= daysInMonth
                const dayBks = isValid ? (dayBookings[day] || []) : []
                const todayClass = isValid && isToday(day)

                return (
                  <div
                    key={i}
                    className="relative"
                    style={{
                      minHeight: 72,
                      borderRight: `1px solid ${T.borderLight}`,
                      borderBottom: `1px solid ${T.borderLight}`,
                      padding: '4px',
                      background: todayClass ? 'rgba(200,164,74,0.06)' : 'transparent',
                    }}
                  >
                    {isValid && (
                      <>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            fontWeight: todayClass ? 700 : 500,
                            color: todayClass ? T.gold : T.textMuted,
                            display: 'block',
                            marginBottom: 2,
                          }}
                        >
                          {day}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          {dayBks.slice(0, 3).map((b, bi) => {
                            const s = SOURCE_STYLE[b.source] || SOURCE_STYLE.other
                            return (
                              <motion.div
                                key={b.id + '-' + bi}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: bi * 0.02 }}
                                className="truncate cursor-default"
                                title={`${b.guest_name} (${b.source})`}
                                style={{
                                  fontSize: 9,
                                  fontWeight: 600,
                                  fontFamily: 'var(--font-sans)',
                                  padding: '1px 4px',
                                  borderRadius: 2,
                                  background: s.bg,
                                  color: s.color,
                                  borderLeft: `2px solid ${s.border}`,
                                  lineHeight: 1.4,
                                }}
                              >
                                {b.guest_name}
                              </motion.div>
                            )
                          })}
                          {dayBks.length > 3 && (
                            <span style={{ fontSize: 8, color: T.textDim, fontFamily: 'var(--font-mono)' }}>
                              +{dayBks.length - 3}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div
            className="flex items-center gap-5 mt-4 px-1"
          >
            {[
              { label: 'Direto', source: 'direct' },
              { label: 'Airbnb', source: 'airbnb' },
              { label: 'Booking', source: 'booking' },
              { label: 'Outro', source: 'other' },
            ].map(item => {
              const s = SOURCE_STYLE[item.source]
              return (
                <div key={item.source} className="flex items-center gap-1.5">
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: s.bg,
                      border: `1px solid ${s.border}`,
                      display: 'inline-block',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 11,
                      color: T.textMuted,
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
