'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Clock, MapPin, Plus,
  ChevronLeft, ChevronRight,
  Home, FileText, Users, X, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { SectionHeader } from '@/app/(backoffice)/components/ui/SectionHeader'

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
  vistoria: { label: 'Vistoria',  color: '#3B82F6', bg: 'rgba(59,130,246,0.14)', icon: Home      },
  reuniao:  { label: 'Reunião',   color: '#A78BFA', bg: 'rgba(167,139,250,0.14)', icon: Users     },
  visita:   { label: 'Visita',    color: '#4ADE80', bg: 'rgba(74,222,128,0.12)',  icon: MapPin    },
  entrega:  { label: 'Entrega',   color: '#FBBF24', bg: 'rgba(251,191,36,0.14)',  icon: FileText  },
  evento:   { label: 'Evento',    color: '#F472B6', bg: 'rgba(244,114,182,0.14)', icon: Calendar  },
  outro:    { label: 'Outro',     color: '#8B949E', bg: 'rgba(139,148,158,0.12)', icon: Calendar  },
}

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function AgendaPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

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

  const navigateMonth = (dir: number) => {
    const [y, m] = currentMonth.split('-').map(Number)
    const d = new Date(y, m - 1 + dir, 1)
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

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
    } catch { /* ignore */ }
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

  // Group events by day
  const eventsByDay: Record<string, CalendarEvent[]> = {}
  events.forEach(ev => {
    const day = ev.start_time.split('T')[0]
    if (!eventsByDay[day]) eventsByDay[day] = []
    eventsByDay[day].push(ev)
  })

  // Calendar grid
  const [year, month] = currentMonth.split('-').map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const startDow = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const monthLabel = firstDay.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const getTypeCfg = (t: string) => EVENT_TYPES[t] || EVENT_TYPES.outro

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const inputStyle = {
    width: '100%', height: '42px', padding: '0 12px',
    borderRadius: '10px', fontSize: '13px', color: 'var(--bo-text)',
    background: 'var(--bo-surface)', border: '1px solid var(--bo-border)',
    outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <PageIntelHeader
          moduleLabel="AGENDA INTELLIGENCE"
          title="Agenda"
          subtitle="Reuniões, vistorias e compromissos"
          actions={
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                height: '38px', padding: '0 18px', borderRadius: '12px',
                fontSize: '13px', fontWeight: 700, color: '#fff',
                background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                border: 'none', cursor: 'pointer',
                boxShadow: '0 0 18px rgba(59,130,246,0.35)', flexShrink: 0,
              }}
            >
              <Plus size={15} />
              Novo Evento
            </button>
          }
        />
      </motion.div>

      {/* Month Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.3 }}
        style={{
          background: 'var(--bo-card)', border: '1px solid var(--bo-border)',
          borderRadius: '16px', padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <button onClick={() => navigateMonth(-1)}
          style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--bo-surface)', border: '1px solid var(--bo-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={18} color="var(--bo-text-muted)" />
        </button>
        <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--bo-text)', textTransform: 'capitalize' }}>
          {monthLabel}
        </p>
        <button onClick={() => navigateMonth(1)}
          style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--bo-surface)', border: '1px solid var(--bo-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRight size={18} color="var(--bo-text-muted)" />
        </button>
      </motion.div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 size={28} color="var(--imi-blue-bright)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* Calendar Grid — desktop */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            style={{ display: 'none' }}
            className="sm:block"
          >
            <div style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)', borderRadius: '16px', overflow: 'hidden' }}>
              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--bo-border)' }}>
                {diasSemana.map(d => (
                  <div key={d} style={{ padding: '10px', textAlign: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</span>
                  </div>
                ))}
              </div>
              {/* Day cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                {Array.from({ length: startDow }).map((_, i) => (
                  <div key={`e-${i}`} style={{ minHeight: '80px', borderBottom: '1px solid rgba(255,255,255,0.04)', borderRight: '1px solid rgba(255,255,255,0.04)', padding: '8px' }} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1
                  const dateStr = `${currentMonth}-${String(dayNum).padStart(2, '0')}`
                  const dayEvents = eventsByDay[dateStr] || []
                  const isToday = dateStr === new Date().toISOString().split('T')[0]
                  return (
                    <div key={dayNum} style={{
                      minHeight: '80px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      borderRight: '1px solid rgba(255,255,255,0.04)',
                      padding: '6px 8px',
                      background: isToday ? 'rgba(59,130,246,0.04)' : 'transparent',
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: isToday ? 'var(--imi-blue-bright)' : 'var(--bo-text-muted)' }}>
                        {dayNum}
                      </span>
                      <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {dayEvents.slice(0, 3).map(ev => {
                          const cfg = getTypeCfg(ev.event_type)
                          return (
                            <div key={ev.id} style={{
                              borderRadius: '4px', padding: '1px 6px',
                              fontSize: '10px', fontWeight: 500, cursor: 'pointer',
                              color: cfg.color, background: cfg.bg,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {ev.title}
                            </div>
                          )
                        })}
                        {dayEvents.length > 3 && (
                          <span style={{ fontSize: '9px', color: 'var(--bo-text-muted)' }}>+{dayEvents.length - 3} mais</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>

          {/* Mobile List View */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="sm:hidden"
          >
            {events.length === 0 ? (
              <div style={{
                background: 'var(--bo-card)', border: '1px solid var(--bo-border)',
                borderRadius: '16px', padding: '48px 24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center',
              }}>
                <Calendar size={32} color="var(--bo-text-muted)" />
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--bo-text)' }}>Nenhum evento este mês</p>
                <p style={{ fontSize: '13px', color: 'var(--bo-text-muted)' }}>Crie um novo evento para começar</p>
                <button onClick={() => setShowModal(true)}
                  style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', height: '38px', padding: '0 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)', border: 'none', cursor: 'pointer' }}>
                  <Plus size={15} />Novo Evento
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Object.entries(eventsByDay)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([dateStr, dayEvents]) => {
                    const date = new Date(dateStr + 'T12:00:00')
                    const isToday = dateStr === new Date().toISOString().split('T')[0]
                    const dayLabel = date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
                    return (
                      <div key={dateStr}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '0 2px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: isToday ? 'var(--imi-blue-bright)' : 'var(--bo-text-muted)' }}>
                            {isToday ? '📍 Hoje' : dayLabel}
                          </span>
                          <div style={{ flex: 1, height: '1px', background: 'var(--bo-border)' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {dayEvents.map(ev => {
                            const cfg = getTypeCfg(ev.event_type)
                            const Icon = cfg.icon
                            return (
                              <motion.div
                                key={ev.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                style={{
                                  background: 'var(--bo-card)', border: '1px solid var(--bo-border)',
                                  borderRadius: '14px', padding: '12px 14px',
                                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                                }}
                              >
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: cfg.bg }}>
                                  <Icon size={16} color={cfg.color} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bo-text)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {ev.title}
                                    </h3>
                                    <button onClick={() => handleDelete(ev.id, ev.title)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', flexShrink: 0 }}>
                                      <X size={14} color="var(--bo-text-muted)" />
                                    </button>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 600, color: cfg.color, background: cfg.bg, padding: '1px 6px', borderRadius: '6px' }}>
                                      {cfg.label}
                                    </span>
                                    {!ev.all_day && (
                                      <span style={{ fontSize: '11px', color: 'var(--bo-text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <Clock size={11} /> {formatTime(ev.start_time)}{ev.end_time && ` - ${formatTime(ev.end_time)}`}
                                      </span>
                                    )}
                                    {ev.all_day && <span style={{ fontSize: '11px', color: 'var(--bo-text-muted)' }}>Dia inteiro</span>}
                                    {ev.location && (
                                      <span style={{ fontSize: '11px', color: 'var(--bo-text-muted)', display: 'flex', alignItems: 'center', gap: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <MapPin size={11} /> {ev.location}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </motion.div>

          {/* Desktop event list */}
          <div className="hidden sm:block">
            <div style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '14px', borderBottom: '1px solid var(--bo-border)' }}>
                <SectionHeader title={`Eventos do Mês`} badge={events.length} />
              </div>
              {events.length === 0 ? (
                <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
                  <Calendar size={32} color="var(--bo-text-muted)" />
                  <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--bo-text)' }}>Nenhum evento neste mês</p>
                  <p style={{ fontSize: '13px', color: 'var(--bo-text-muted)' }}>Crie um novo evento para começar</p>
                </div>
              ) : (
                <div>
                  {events.map(ev => {
                    const cfg = getTypeCfg(ev.event_type)
                    const Icon = cfg.icon
                    return (
                      <div key={ev.id} style={{ padding: '14px', borderBottom: '1px solid var(--bo-border)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: cfg.bg }}>
                          <Icon size={18} color={cfg.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                            <div>
                              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bo-text)', marginBottom: '2px' }}>{ev.title}</h3>
                              {ev.description && <p style={{ fontSize: '12px', color: 'var(--bo-text-muted)' }}>{ev.description}</p>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                              <span style={{ fontSize: '10px', fontWeight: 600, color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: '8px' }}>
                                {cfg.label}
                              </span>
                              <button onClick={() => handleDelete(ev.id, ev.title)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                                <X size={14} color="var(--bo-text-muted)" />
                              </button>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', color: 'var(--bo-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12} /> {new Date(ev.start_time).toLocaleDateString('pt-BR')}
                            </span>
                            {!ev.all_day && (
                              <span style={{ fontSize: '11px', color: 'var(--bo-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} /> {formatTime(ev.start_time)}{ev.end_time && ` - ${formatTime(ev.end_time)}`}
                              </span>
                            )}
                            {ev.location && (
                              <span style={{ fontSize: '11px', color: 'var(--bo-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MapPin size={12} /> {ev.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Create Event Modal */}
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
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Nome do evento" style={inputStyle} />
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
                    <input type="datetime-local" value={form.start_time}
                      onChange={e => setForm({ ...form, start_time: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--bo-text-muted)', display: 'block', marginBottom: '6px' }}>Fim</label>
                    <input type="datetime-local" value={form.end_time}
                      onChange={e => setForm({ ...form, end_time: e.target.value })} style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--bo-text-muted)', display: 'block', marginBottom: '6px' }}>Local</label>
                  <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                    placeholder="Endereço ou link" style={inputStyle} />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--bo-text-muted)', display: 'block', marginBottom: '6px' }}>Descrição</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={3} placeholder="Detalhes do evento"
                    style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'none' }} />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.all_day}
                    onChange={e => setForm({ ...form, all_day: e.target.checked })} />
                  <span style={{ fontSize: '13px', color: 'var(--bo-text-muted)' }}>Dia inteiro</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowModal(false)}
                  style={{ flex: 1, height: '44px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: 'var(--bo-surface)', color: 'var(--bo-text-muted)', border: '1px solid var(--bo-border)' }}>
                  Cancelar
                </button>
                <button onClick={handleCreate}
                  disabled={saving || !form.title || !form.start_time}
                  style={{ flex: 1, height: '44px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: (saving || !form.title || !form.start_time) ? 'not-allowed' : 'pointer', color: '#fff', background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: (saving || !form.title || !form.start_time) ? 0.5 : 1 }}>
                  {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
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
