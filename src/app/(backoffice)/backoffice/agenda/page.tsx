'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Clock, MapPin, Plus, X,
  ChevronLeft, ChevronRight, Video, Navigation,
  Home, FileText, Users, Bot, Check, Zap, Phone,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { T } from '@/app/(backoffice)/lib/theme'

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  event_type: string
  start_time: string
  end_time: string | null
  all_day: boolean
  location: string | null
  color: string
  related_type: string | null
  related_id: string | null
  created_at: string
}

const EVENT_TYPES: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  vistoria: { label: 'Vistoria',  color: '#3B82F6', bg: 'rgba(59,130,246,0.14)',  icon: Home     },
  reuniao:  { label: 'Reunião',   color: '#A78BFA', bg: 'rgba(167,139,250,0.14)', icon: Users    },
  visita:   { label: 'Visita',    color: '#4ADE80', bg: 'rgba(74,222,128,0.12)',  icon: MapPin   },
  entrega:  { label: 'Entrega',   color: '#FBBF24', bg: 'rgba(251,191,36,0.14)',  icon: FileText },
  evento:   { label: 'Evento',    color: '#F472B6', bg: 'rgba(244,114,182,0.14)', icon: Calendar },
  outro:    { label: 'Outro',     color: '#8B949E', bg: 'rgba(139,148,158,0.12)', icon: Calendar },
}

const DIAS_SEMANA_CURTO = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

// ── Loading skeleton ─────────────────────────────────────────────────
function AgendaSkeleton() {
  return (
    <div className="space-y-5">
      {/* Week strip skeleton */}
      <div style={{ height: 120, background: 'var(--bo-card)', borderRadius: 18, opacity: 0.5 }} />
      {/* Day events skeleton */}
      <div style={{ borderRadius: 18, overflow: 'hidden', background: 'var(--bo-card)', opacity: 0.45 }}>
        <div style={{ height: 52, borderBottom: '1px solid var(--bo-border)' }} />
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: i < 2 ? '1px solid var(--bo-border)' : 'none' }}>
            <div style={{ width: 46, height: 40, borderRadius: 10, background: 'var(--bo-elevated)', opacity: 0.6 }} />
            <div style={{ width: 3, height: 40, borderRadius: 2, background: 'var(--bo-border)' }} />
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bo-elevated)', opacity: 0.5 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, width: '60%', background: 'var(--bo-elevated)', borderRadius: 6, marginBottom: 6, opacity: 0.7 }} />
              <div style={{ height: 11, width: '35%', background: 'var(--bo-elevated)', borderRadius: 4, opacity: 0.4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Smart suggestions computed dynamically from real leads — see useEffect below

export default function AgendaPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week')
  const [selectedDay, setSelectedDay] = useState(() => new Date().toISOString().split('T')[0])
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [smartSuggestions, setSmartSuggestions] = useState<{id:string;title:string;desc:string;action:string;icon:any;color:string}[]>([])

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const [form, setForm] = useState({
    title: '',
    description: '',
    event_type: 'reuniao',
    start_time: '',
    end_time: '',
    location: '',
    all_day: false,
  })

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/agenda?month=${currentMonth}`)
      const data = await res.json()
      setEvents(Array.isArray(data) ? data : [])
    } catch { setEvents([]) }
    setLoading(false)
  }, [currentMonth])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  // Load dismissed from localStorage + compute smart suggestions from real leads
  useEffect(() => {
    try {
      const saved = localStorage.getItem('imi-agenda-dismissed')
      if (saved) setDismissed(JSON.parse(saved))
    } catch { /* ignore */ }

    fetch('/api/leads?limit=30')
      .then(r => r.json())
      .then(data => {
        const leads: any[] = Array.isArray(data) ? data : (data.data ?? [])
        const suggestions: typeof smartSuggestions = []

        const hotLead = leads.find(l => (l.ai_score ?? 0) >= 70 && ['novo', 'contatado'].includes(l.status ?? ''))
        if (hotLead) suggestions.push({
          id: `hot-${hotLead.id}`,
          title: 'Lead Quente – Agendar Follow-up',
          desc: `${hotLead.name} tem score ${hotLead.ai_score ?? '—'} e aguarda contato. Ideal para agendamento imediato.`,
          action: 'Agendar Agora', icon: Zap, color: 'var(--s-hot)',
        })

        const qualified = leads.find(l => l.status === 'qualificado' && !suggestions.find(s => s.id.includes(l.id)))
        if (qualified) suggestions.push({
          id: `qual-${qualified.id}`,
          title: 'Lead Qualificado – Proposta Pendente',
          desc: `${qualified.name} está qualificado e aguarda proposta ou reunião formal.`,
          action: 'Criar Reunião', icon: Users, color: 'var(--s-done)',
        })

        const recent = leads.find(l => {
          const diff = Date.now() - new Date(l.created_at ?? 0).getTime()
          return diff < 86400000 * 3 && !suggestions.find(s => s.id.includes(l.id))
        })
        if (recent) suggestions.push({
          id: `new-${recent.id}`,
          title: 'Novo Lead – Primeiro Contato',
          desc: `${recent.name} se cadastrou há menos de 3 dias. Janela ideal para primeiro contato.`,
          action: 'Agendar Ligação', icon: Phone, color: 'var(--bo-accent)',
        })

        setSmartSuggestions(suggestions.slice(0, 3))
      })
      .catch(() => { /* silently skip if leads API unavailable */ })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Week strip helpers ────────────────────────────────────────────────────
  const getWeekDays = () => {
    const sel = new Date(selectedDay + 'T12:00:00')
    const dow = sel.getDay()
    const mon = new Date(sel)
    mon.setDate(sel.getDate() - dow + (dow === 0 ? -6 : 1))
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(mon)
      d.setDate(mon.getDate() + i)
      return d.toISOString().split('T')[0]
    })
  }
  const weekDays = getWeekDays()

  const navigateWeek = (dir: number) => {
    const d = new Date(selectedDay + 'T12:00:00')
    d.setDate(d.getDate() + dir * 7)
    const nDay = d.toISOString().split('T')[0]
    setSelectedDay(nDay)
    const [y, m] = nDay.split('-').map(Number)
    setCurrentMonth(`${y}-${String(m).padStart(2, '0')}`)
  }

  const isToday = (s: string) => s === new Date().toISOString().split('T')[0]
  const getDow = (s: string) => DIAS_SEMANA_CURTO[new Date(s + 'T12:00:00').getDay()]
  const getDayNum = (s: string) => parseInt(s.split('-')[2])

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const getTypeCfg = (t: string) => EVENT_TYPES[t] || EVENT_TYPES.outro

  // ── Events grouping ───────────────────────────────────────────────────────
  const eventsByDay: Record<string, CalendarEvent[]> = {}
  events.forEach(ev => {
    const d = ev.start_time.split('T')[0]
    if (!eventsByDay[d]) eventsByDay[d] = []
    eventsByDay[d].push(ev)
  })
  const selectedDayEvents = (eventsByDay[selectedDay] || [])
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  // ── Month label ───────────────────────────────────────────────────────────
  const [y, m] = currentMonth.split('-').map(Number)
  const monthLabel = new Date(y, m - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.title || !form.start_time) return
    setSaving(true)
    try {
      await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          event_type: form.event_type,
          start_time: form.start_time,
          end_time: form.end_time || null,
          location: form.location || null,
          all_day: form.all_day,
        }),
      })
      setShowModal(false)
      setForm({ title: '', description: '', event_type: 'reuniao', start_time: '', end_time: '', location: '', all_day: false })
      fetchEvents()
      toast.success('Evento criado!')
    } catch { toast.error('Erro ao criar evento') }
    setSaving(false)
  }

  const handleDelete = async (id: string, title?: string) => {
    toast.warning(`Excluir "${title || 'este evento'}"?`, {
      action: {
        label: 'Sim, excluir',
        onClick: async () => {
          await fetch(`/api/agenda?id=${id}`, { method: 'DELETE' })
          toast.success('Evento excluído')
          fetchEvents()
        },
      },
      duration: 6000,
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '42px', padding: '0 12px',
    borderRadius: '10px', fontSize: '13px',
    color: 'var(--bo-text)',
    background: 'var(--bo-surface)',
    border: '1px solid var(--bo-border)',
    outline: 'none', boxSizing: 'border-box',
  }

  const activeSuggestions = smartSuggestions.filter(s => !dismissed.includes(s.id))
  const dismissSuggestion = (id: string) => {
    const next = [...dismissed, id]
    setDismissed(next)
    try { localStorage.setItem('imi-agenda-dismissed', JSON.stringify(next)) } catch { /* ignore */ }
  }

  const selectedDayLabel = isToday(selectedDay)
    ? 'Hoje'
    : new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long',
      })

  if (loading) return <AgendaSkeleton />

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <PageIntelHeader
          moduleLabel="AGENDA"
          title="Agenda"
          subtitle={monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Day / Week toggle */}
              <div style={{
                display: 'flex', background: 'var(--bo-elevated)',
                border: '1px solid var(--bo-border)', borderRadius: '12px', padding: '3px',
              }}>
                {(['day', 'week'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    style={{
                      height: '30px', padding: '0 12px', borderRadius: '9px',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none',
                      transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
                      background: viewMode === mode ? 'var(--bo-accent)' : 'transparent',
                      color: viewMode === mode ? '#fff' : 'var(--bo-text-muted)',
                      boxShadow: viewMode === mode ? '0 0 12px rgba(59,130,246,0.2)' : 'none',
                    }}
                  >
                    {mode === 'day' ? 'Dia' : 'Semana'}
                  </button>
                ))}
              </div>

              {/* New event */}
              <button
                onClick={() => setShowModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  height: '40px', padding: '0 16px', borderRadius: '12px',
                  fontSize: '13px', fontWeight: 600, color: '#fff',
                  background: 'var(--bo-accent)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(59,130,246,0.28), inset 0 1px 0 rgba(255,255,255,0.1)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Novo Evento</span>
                <span className="sm:hidden">Novo</span>
              </button>
            </div>
          }
        />
      </motion.div>

      {/* ── Week Strip ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div style={{
          background: 'var(--bo-surface)',
          border: '1px solid var(--bo-border)',
          borderRadius: '18px', padding: '16px 20px',
          boxShadow: 'var(--bo-card-shadow, 0 4px 24px rgba(0,0,0,0.18)), inset 0 1px 0 rgba(255,255,255,0.06)',
          backgroundImage: 'linear-gradient(135deg, rgba(59,130,246,0.04) 0%, transparent 50%)',
        }}>
          {/* Week nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <button
              onClick={() => navigateWeek(-1)}
              style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronLeft size={16} color="var(--bo-text-muted)" />
            </button>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Semana de {new Date(weekDays[0] + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
            </span>
            <button
              onClick={() => navigateWeek(1)}
              style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronRight size={16} color="var(--bo-text-muted)" />
            </button>
          </div>

          {/* Day buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
            {weekDays.map(dayStr => {
              const isSelected = dayStr === selectedDay
              const todayBool = isToday(dayStr)
              const hasEvts = (eventsByDay[dayStr] || []).length > 0
              return (
                <button
                  key={dayStr}
                  onClick={() => setSelectedDay(dayStr)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                    padding: '10px 4px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                    transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
                    background: isSelected
                      ? 'var(--bo-accent)'
                      : todayBool
                        ? 'rgba(59,130,246,0.1)'
                        : 'transparent',
                    boxShadow: isSelected ? '0 0 16px rgba(59,130,246,0.28), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', color: isSelected ? 'rgba(255,255,255,0.75)' : 'var(--bo-text-muted)' }}>
                    {getDow(dayStr)}
                  </span>
                  <span style={{ fontSize: '17px', fontWeight: 800, color: isSelected ? '#fff' : todayBool ? '#3B82F6' : 'var(--bo-text)' }}>
                    {getDayNum(dayStr)}
                  </span>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: hasEvts ? (isSelected ? '#fff' : '#3B82F6') : 'transparent' }} />
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Day Events + Suggestions + Week Overview ────────────────────── */}

          {/* ── Day Events ────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)', borderRadius: '18px', overflow: 'hidden', boxShadow: 'var(--bo-card-shadow, 0 4px 24px rgba(0,0,0,0.18)), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bo-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={16} color="#3B82F6" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bo-text)', textTransform: 'capitalize' }}>
                    {selectedDayLabel}
                  </span>
                  {selectedDayEvents.length > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: 700, background: '#3B82F6', color: '#fff', padding: '2px 8px', borderRadius: '8px' }}>
                      {selectedDayEvents.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)', cursor: 'pointer' }}
                >
                  <Plus size={15} color="var(--bo-text-muted)" />
                </button>
              </div>

              {/* Events */}
              {selectedDayEvents.length === 0 ? (
                <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
                  <Calendar size={36} color="var(--bo-text-muted)" style={{ opacity: 0.3 }} />
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--bo-text)' }}>Nenhum evento neste dia</p>
                  <p style={{ fontSize: '12px', color: 'var(--bo-text-muted)' }}>Toque em + para adicionar</p>
                </div>
              ) : (
                <div>
                  {selectedDayEvents.map((ev, idx) => {
                    const cfg = getTypeCfg(ev.event_type)
                    const Icon = cfg.icon
                    const isOnline = ev.event_type === 'reuniao' || ev.location?.startsWith('http')
                    return (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        style={{
                          padding: '16px 20px',
                          borderBottom: idx < selectedDayEvents.length - 1 ? '1px solid var(--bo-border)' : 'none',
                          display: 'flex', alignItems: 'center', gap: '14px',
                          transition: 'background 0.15s cubic-bezier(0.4,0,0.2,1)',
                        }}
                      >
                        {/* Time */}
                        <div style={{ width: '46px', textAlign: 'center', flexShrink: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: 800, color: cfg.color }}>
                            {ev.all_day ? 'Dia' : formatTime(ev.start_time)}
                          </p>
                          {ev.end_time && !ev.all_day && (
                            <p style={{ fontSize: '10px', color: 'var(--bo-text-muted)', marginTop: '2px' }}>
                              {formatTime(ev.end_time)}
                            </p>
                          )}
                        </div>

                        {/* Color bar */}
                        <div style={{ width: '3px', height: '48px', borderRadius: '2px', background: cfg.color, flexShrink: 0, opacity: 0.7 }} />

                        {/* Icon */}
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: cfg.bg }}>
                          <Icon size={18} color={cfg.color} />
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--bo-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                              {ev.title}
                            </h3>
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', background: cfg.bg, color: cfg.color, flexShrink: 0 }}>
                              {cfg.label}
                            </span>
                          </div>
                          {ev.location && (
                            <p style={{ fontSize: '11px', color: 'var(--bo-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <MapPin size={11} />
                              {ev.location}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          {isOnline ? (
                            <button style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '32px', padding: '0 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, color: '#fff', background: '#3B82F6', border: 'none', cursor: 'pointer', boxShadow: '0 0 12px rgba(59,130,246,0.3)' }}>
                              <Video size={13} />
                              Entrar
                            </button>
                          ) : (
                            <button style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '32px', padding: '0 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, color: 'var(--bo-text-muted)', background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)', cursor: 'pointer' }}>
                              <Navigation size={13} />
                              Rota
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(ev.id, ev.title)}
                            style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                          >
                            <X size={14} color="var(--bo-text-muted)" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Smart Suggestions ─────────────────────────────────────────── */}
          {activeSuggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <div style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)', borderRadius: '18px', overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)', backgroundImage: 'linear-gradient(135deg, rgba(129,140,248,0.04) 0%, transparent 50%)' }}>
                {/* Header */}
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--bo-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(129,140,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={15} color="#818CF8" />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bo-text)' }}>Sugestões da IA</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, background: '#818CF8', color: '#fff', padding: '2px 7px', borderRadius: '6px', letterSpacing: '0.04em' }}>
                    SMART
                  </span>
                </div>

                <div>
                  {activeSuggestions.map((sug, idx) => {
                    const Icon = sug.icon
                    return (
                      <motion.div
                        key={sug.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + idx * 0.06 }}
                        style={{
                          padding: '14px 20px',
                          borderBottom: idx < activeSuggestions.length - 1 ? '1px solid var(--bo-border)' : 'none',
                          display: 'flex', alignItems: 'flex-start', gap: '12px',
                        }}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${sug.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={16} color={sug.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bo-text)', marginBottom: '4px' }}>
                            {sug.title}
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--bo-text-muted)', lineHeight: 1.5 }}>
                            {sug.desc}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <button
                            onClick={() => setShowModal(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '32px', padding: '0 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, color: '#fff', background: 'var(--bo-accent)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', boxShadow: '0 0 12px rgba(59,130,246,0.22)' }}
                          >
                            <Check size={12} />
                            Aceitar
                          </button>
                          <button
                            onClick={() => dismissSuggestion(sug.id)}
                            style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                          >
                            <X size={14} color="var(--bo-text-muted)" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Week Overview (when week mode) ────────────────────────────── */}
          {viewMode === 'week' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
              <div style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)', borderRadius: '18px', overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--bo-border)' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Visão Geral da Semana</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
                  {weekDays.map((dayStr, i) => {
                    const dayEvts = eventsByDay[dayStr] || []
                    const isSelected = dayStr === selectedDay
                    const todayBool = isToday(dayStr)
                    return (
                      <div
                        key={dayStr}
                        onClick={() => setSelectedDay(dayStr)}
                        style={{
                          padding: '12px 8px',
                          borderRight: i < 5 ? '1px solid var(--bo-border)' : 'none',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(59,130,246,0.06)' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                      >
                        <p style={{ fontSize: '9px', fontWeight: 700, color: todayBool ? '#3B82F6' : 'var(--bo-text-muted)', letterSpacing: '0.05em', textAlign: 'center', marginBottom: '8px' }}>
                          {getDow(dayStr)}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {dayEvts.slice(0, 3).map(ev => {
                            const cfg = getTypeCfg(ev.event_type)
                            return (
                              <div key={ev.id} style={{ borderRadius: '4px', padding: '2px 5px', fontSize: '9px', fontWeight: 600, color: cfg.color, background: cfg.bg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {ev.title}
                              </div>
                            )
                          })}
                          {dayEvts.length > 3 && (
                            <span style={{ fontSize: '9px', color: 'var(--bo-text-muted)', textAlign: 'center' }}>
                              +{dayEvts.length - 3}
                            </span>
                          )}
                          {dayEvts.length === 0 && (
                            <div style={{ height: '20px' }} />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

      {/* ── Create Event Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              style={{ width: '100%', maxWidth: '500px', background: 'var(--bo-card)', border: '1px solid var(--bo-border)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--bo-text)' }}>Novo Evento</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  <X size={18} color="var(--bo-text-muted)" />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--bo-text-muted)', display: 'block', marginBottom: '6px' }}>Título *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Nome do evento" style={inputStyle} />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--bo-text-muted)', display: 'block', marginBottom: '6px' }}>Tipo</label>
                  <select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })} style={inputStyle}>
                    {Object.entries(EVENT_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--bo-text-muted)', display: 'block', marginBottom: '6px' }}>Início *</label>
                    <input type="datetime-local" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--bo-text-muted)', display: 'block', marginBottom: '6px' }}>Fim</label>
                    <input type="datetime-local" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--bo-text-muted)', display: 'block', marginBottom: '6px' }}>Local / Link da Reunião</label>
                  <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Endereço ou https://meet.google.com/..." style={inputStyle} />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--bo-text-muted)', display: 'block', marginBottom: '6px' }}>Descrição</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Detalhes do evento" style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'none' }} />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.all_day} onChange={e => setForm({ ...form, all_day: e.target.checked })} />
                  <span style={{ fontSize: '13px', color: 'var(--bo-text-muted)' }}>Dia inteiro</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, height: '44px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: 'var(--bo-surface)', color: 'var(--bo-text-muted)', border: '1px solid var(--bo-border)' }}>
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving || !form.title || !form.start_time}
                  style={{ flex: 1, height: '44px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: (saving || !form.title || !form.start_time) ? 'not-allowed' : 'pointer', color: '#fff', background: 'var(--bo-accent)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: (saving || !form.title || !form.start_time) ? 0.5 : 1, boxShadow: '0 0 16px rgba(59,130,246,0.22)' }}
                >
                  <Plus size={16} />
                  {saving ? 'Salvando...' : 'Criar Evento'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
