'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Calendar,
    Clock,
    MapPin,
    Plus,
    ChevronLeft,
    ChevronRight,
    Home,
    FileText,
    Users,
    Video,
    Loader2,
    X,
} from 'lucide-react'

/* ── Dark-theme design tokens ─────────────────────────── */
const T = {
    page: 'min-h-screen bg-[#0B0B11]',
    card: 'bg-[#141420] border border-white/[.06] rounded-2xl',
    text: 'text-white',
    sub: 'text-white/50',
    accent: '#486581',
    accentBg: 'bg-[#102A43]',
    input: 'bg-[#102A43] border border-white/10 text-white placeholder:text-white/30 rounded-xl',
    badge: (c: string) => `bg-${c}/10 text-${c}`,
}

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

const EVENT_TYPES: Record<string, { label: string; color: string; icon: any }> = {
    vistoria: { label: 'Vistoria', color: '#486581', icon: Home },
    reuniao: { label: 'Reunião', color: '#8B5CF6', icon: Users },
    visita: { label: 'Visita', color: '#10B981', icon: MapPin },
    entrega: { label: 'Entrega', color: '#F59E0B', icon: FileText },
    evento: { label: 'Evento', color: '#486581', icon: Calendar },
    outro: { label: 'Outro', color: '#6B7280', icon: Calendar },
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

    // New event form
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

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja excluir este evento?')) return
        await fetch(`/api/agenda?id=${id}`, { method: 'DELETE' })
        fetchEvents()
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

    const getTypeConfig = (t: string) => EVENT_TYPES[t] || EVENT_TYPES.outro

    const formatTime = (iso: string) => {
        const d = new Date(iso)
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className={T.page}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className={`text-2xl font-bold ${T.text}`}>Agenda</h1>
                        <p className={`text-sm mt-1 ${T.sub}`}>Gerencie reuniões, vistorias e compromissos</p>
                    </div>
                    <button onClick={() => setShowModal(true)}
                        className={`flex items-center gap-2 h-11 px-6 ${T.accentBg} text-white rounded-xl font-semibold hover:brightness-110 transition`}>
                        <Plus size={20} /> Novo Evento
                    </button>
                </div>

                {/* Month Navigation */}
                <div className={`${T.card} p-4`}>
                    <div className="flex items-center justify-between">
                        <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-white/5 rounded-lg transition">
                            <ChevronLeft size={20} className="text-white/60" />
                        </button>
                        <p className={`text-lg font-bold capitalize ${T.text}`}>{monthLabel}</p>
                        <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-white/5 rounded-lg transition">
                            <ChevronRight size={20} className="text-white/60" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-[#486581]" size={32} />
                    </div>
                ) : (
                    <>
                        {/* Calendar Grid */}
                        <div className={T.card}>
                            {/* Day headers */}
                            <div className="grid grid-cols-7 border-b border-white/[.06]">
                                {diasSemana.map(d => (
                                    <div key={d} className="p-3 text-center">
                                        <span className="text-xs font-semibold text-white/40 uppercase">{d}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Day cells */}
                            <div className="grid grid-cols-7">
                                {Array.from({ length: startDow }).map((_, i) => (
                                    <div key={`e-${i}`} className="min-h-[80px] sm:min-h-[100px] border-b border-r border-white/[.04] p-2" />
                                ))}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const dayNum = i + 1
                                    const dateStr = `${currentMonth}-${String(dayNum).padStart(2, '0')}`
                                    const dayEvents = eventsByDay[dateStr] || []
                                    const isToday = dateStr === new Date().toISOString().split('T')[0]
                                    return (
                                        <div key={dayNum}
                                            className={`min-h-[80px] sm:min-h-[100px] border-b border-r border-white/[.04] p-1.5 sm:p-2 ${isToday ? 'bg-[#102A43]/5' : ''}`}>
                                            <span className={`text-xs font-bold ${isToday ? 'text-[#486581]' : 'text-white/60'}`}>
                                                {dayNum}
                                            </span>
                                            <div className="mt-1 space-y-0.5">
                                                {dayEvents.slice(0, 3).map(ev => {
                                                    const cfg = getTypeConfig(ev.event_type)
                                                    return (
                                                        <div key={ev.id} className="truncate rounded px-1 py-0.5 text-[10px] font-medium cursor-pointer hover:brightness-125"
                                                            style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}>
                                                            {ev.title}
                                                        </div>
                                                    )
                                                })}
                                                {dayEvents.length > 3 && (
                                                    <span className="text-[10px] text-white/40">+{dayEvents.length - 3} mais</span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Events List */}
                        <div className={T.card}>
                            <div className="p-5 border-b border-white/[.06]">
                                <h2 className={`text-lg font-bold ${T.text}`}>Eventos do Mês ({events.length})</h2>
                            </div>

                            {events.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Calendar size={48} className="mx-auto text-white/20 mb-4" />
                                    <h3 className={`text-lg font-semibold ${T.text} mb-2`}>Nenhum evento neste mês</h3>
                                    <p className={T.sub}>Crie um novo evento para começar</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/[.06]">
                                    {events.map(ev => {
                                        const cfg = getTypeConfig(ev.event_type)
                                        const Icon = cfg.icon
                                        return (
                                            <div key={ev.id} className="p-5 hover:bg-white/[.02] transition group">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                        style={{ backgroundColor: `${cfg.color}15` }}>
                                                        <Icon size={20} style={{ color: cfg.color }} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <h3 className={`font-semibold ${T.text}`}>{ev.title}</h3>
                                                                {ev.description && <p className={`text-sm mt-0.5 ${T.sub}`}>{ev.description}</p>}
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className="px-2.5 py-1 rounded-lg text-xs font-medium"
                                                                    style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}>
                                                                    {cfg.label}
                                                                </span>
                                                                <button onClick={() => handleDelete(ev.id)}
                                                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-lg transition">
                                                                    <X size={14} className="text-red-400" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-white/40">
                                                            <span className="flex items-center gap-1.5">
                                                                <Calendar size={14} />
                                                                {new Date(ev.start_time).toLocaleDateString('pt-BR')}
                                                            </span>
                                                            {!ev.all_day && (
                                                                <span className="flex items-center gap-1.5">
                                                                    <Clock size={14} />
                                                                    {formatTime(ev.start_time)}
                                                                    {ev.end_time && ` - ${formatTime(ev.end_time)}`}
                                                                </span>
                                                            )}
                                                            {ev.location && (
                                                                <span className="flex items-center gap-1.5">
                                                                    <MapPin size={14} />
                                                                    {ev.location}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Create Event Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className={`${T.card} w-full max-w-lg p-6 space-y-5`}>
                        <div className="flex items-center justify-between">
                            <h2 className={`text-lg font-bold ${T.text}`}>Novo Evento</h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-white/5 rounded-lg">
                                <X size={20} className="text-white/40" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-white/60 mb-1.5 block">Título *</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                    className={`w-full h-11 px-4 ${T.input}`} placeholder="Nome do evento" />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-white/60 mb-1.5 block">Tipo</label>
                                <select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}
                                    className={`w-full h-11 px-4 ${T.input}`}>
                                    {Object.entries(EVENT_TYPES).map(([k, v]) => (
                                        <option key={k} value={k}>{v.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Início *</label>
                                    <input type="datetime-local" value={form.start_time}
                                        onChange={e => setForm({ ...form, start_time: e.target.value })}
                                        className={`w-full h-11 px-4 ${T.input}`} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Fim</label>
                                    <input type="datetime-local" value={form.end_time}
                                        onChange={e => setForm({ ...form, end_time: e.target.value })}
                                        className={`w-full h-11 px-4 ${T.input}`} />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-white/60 mb-1.5 block">Local</label>
                                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                                    className={`w-full h-11 px-4 ${T.input}`} placeholder="Endereço ou link" />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-white/60 mb-1.5 block">Descrição</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows={3} className={`w-full px-4 py-3 ${T.input}`} placeholder="Detalhes do evento" />
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.all_day}
                                    onChange={e => setForm({ ...form, all_day: e.target.checked })}
                                    className="rounded border-white/20" />
                                <span className="text-sm text-white/60">Dia inteiro</span>
                            </label>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowModal(false)}
                                className="flex-1 h-11 border border-white/10 text-white/60 rounded-xl font-medium hover:bg-white/5 transition">
                                Cancelar
                            </button>
                            <button onClick={handleCreate} disabled={saving || !form.title || !form.start_time}
                                className={`flex-1 h-11 ${T.accentBg} text-white rounded-xl font-semibold hover:brightness-110 transition disabled:opacity-40`}>
                                {saving ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Criar Evento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
