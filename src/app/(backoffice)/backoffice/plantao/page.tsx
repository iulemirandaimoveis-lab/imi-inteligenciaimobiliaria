'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    CalendarCheck2, MapPin, Users, Clock, ChevronLeft, ChevronRight,
    Plus, AlertCircle, CheckCircle, Loader2, ArrowLeftRight, Star,
    Building2, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { createClient } from '@/lib/supabase/client'
import { format, addDays, startOfWeek, parseISO, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const supabase = createClient()

type ScheduleStatus = 'confirmed' | 'cancelled' | 'swapped' | 'no_show' | 'completed'

interface Schedule {
    id: string
    location_id: string
    time_slot_id: string
    broker_id: string
    schedule_date: string
    start_time: string
    end_time: string
    status: ScheduleStatus
    broker?: { name: string; avatar_url?: string }
    location?: { name: string; location_type: string; max_brokers_per_slot: number }
    time_slot?: { label: string }
}

interface DutyLocation {
    id: string
    name: string
    location_type: string
    max_brokers_per_slot: number
    agency?: { name: string }
}

interface TimeSlot {
    id: string
    location_id: string
    label: string
    start_time: string
    end_time: string
    max_brokers: number
}

interface WeekCycle {
    id: string
    week_start: string
    week_end: string
    selection_opens: string
    selection_closes: string
    status: string
}

const STATUS_CFG: Record<ScheduleStatus, { label: string; color: string; bg: string }> = {
    confirmed:  { label: 'Confirmado', color: 'var(--success)',  bg: 'rgba(34,197,94,0.12)'  },
    cancelled:  { label: 'Cancelado',  color: 'var(--error)',    bg: 'rgba(239,68,68,0.12)'  },
    swapped:    { label: 'Trocado',    color: 'var(--warning)',  bg: 'rgba(251,191,36,0.12)' },
    no_show:    { label: 'Faltou',     color: 'var(--error)',    bg: 'rgba(239,68,68,0.12)'  },
    completed:  { label: 'Concluído',  color: 'var(--info)',     bg: 'rgba(96,165,250,0.12)' },
}

const LOCATION_TYPE_LABEL: Record<string, string> = {
    imobiliaria: 'Imobiliária',
    loteamento: 'Loteamento',
    condominio: 'Condomínio',
    empreendimento: 'Empreendimento',
}

export default function PlantaoPage() {
    const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }))
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [locations, setLocations] = useState<DutyLocation[]>([])
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
    const [currentCycle, setCurrentCycle] = useState<WeekCycle | null>(null)
    const [selectedLocation, setSelectedLocation] = useState<string>('all')
    const [loading, setLoading] = useState(true)
    const [showBookModal, setShowBookModal] = useState(false)
    const [bookingSlot, setBookingSlot] = useState<{ locationId: string; timeSlotId: string; date: Date } | null>(null)
    const [booking, setBooking] = useState(false)
    const [currentBrokerId, setCurrentBrokerId] = useState<string | null>(null)

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    const weekEnd = addDays(weekStart, 6)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get broker id
            const { data: broker } = await supabase
                .from('brokers')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle()
            if (broker) setCurrentBrokerId(broker.id)

            const weekStartStr = format(weekStart, 'yyyy-MM-dd')
            const weekEndStr = format(weekEnd, 'yyyy-MM-dd')

            const [schedulesRes, locationsRes, cycleRes] = await Promise.all([
                fetch(`/api/plantao/escala?week_start=${weekStartStr}&week_end=${weekEndStr}`),
                fetch('/api/plantao/locais'),
                fetch('/api/plantao/ciclos?status=open'),
            ])

            if (schedulesRes.ok) {
                const data = await schedulesRes.json()
                setSchedules(data.data || [])
            }
            if (locationsRes.ok) {
                const data = await locationsRes.json()
                setLocations(data.data || [])
            }
            if (cycleRes.ok) {
                const data = await cycleRes.json()
                setCurrentCycle(data.data?.[0] || null)
                // Also fetch time_slots after locations load
                if (data.data?.[0]) {
                    const slotsRes = await fetch('/api/plantao/locais?include_slots=true')
                    if (slotsRes.ok) {
                        const sd = await slotsRes.json()
                        setTimeSlots(sd.time_slots || [])
                    }
                }
            }
        } catch {
            toast.error('Erro ao carregar dados de plantão')
        } finally {
            setLoading(false)
        }
    }, [weekStart])

    useEffect(() => { fetchData() }, [fetchData])

    const getSchedulesForCell = (locationId: string, timeSlotId: string, date: Date) =>
        schedules.filter(s =>
            s.location_id === locationId &&
            s.time_slot_id === timeSlotId &&
            isSameDay(parseISO(s.schedule_date), date) &&
            s.status !== 'cancelled'
        )

    const getSlotCapacity = (locationId: string, timeSlotId: string) => {
        const slot = timeSlots.find(s => s.id === timeSlotId && s.location_id === locationId)
        if (slot) return slot.max_brokers
        const loc = locations.find(l => l.id === locationId)
        return loc?.max_brokers_per_slot ?? 2
    }

    const isMySchedule = (schedule: Schedule) => schedule.broker_id === currentBrokerId

    const handleBookSlot = (locationId: string, timeSlotId: string, date: Date) => {
        if (!currentCycle || currentCycle.status !== 'open') {
            toast.error('Seleção de plantão não está aberta neste momento')
            return
        }
        setBookingSlot({ locationId, timeSlotId, date })
        setShowBookModal(true)
    }

    const confirmBooking = async () => {
        if (!bookingSlot || !currentBrokerId || !currentCycle) return
        setBooking(true)
        try {
            const slot = timeSlots.find(
                s => s.id === bookingSlot.timeSlotId && s.location_id === bookingSlot.locationId
            )
            const res = await fetch('/api/plantao/escala', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location_id: bookingSlot.locationId,
                    time_slot_id: bookingSlot.timeSlotId,
                    schedule_date: format(bookingSlot.date, 'yyyy-MM-dd'),
                    start_time: slot?.start_time || '08:00',
                    end_time: slot?.end_time || '12:00',
                    week_cycle_id: currentCycle.id,
                }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro ao reservar plantão')
            }
            toast.success('Plantão reservado com sucesso!')
            setShowBookModal(false)
            setBookingSlot(null)
            fetchData()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Erro ao reservar plantão')
        } finally {
            setBooking(false)
        }
    }

    const handleCancelSchedule = async (scheduleId: string) => {
        const reason = prompt('Motivo do cancelamento (opcional):')
        try {
            const res = await fetch(`/api/plantao/escala?id=${scheduleId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cancel_reason: reason || '' }),
            })
            if (!res.ok) throw new Error('Erro ao cancelar')
            toast.success('Plantão cancelado')
            fetchData()
        } catch {
            toast.error('Erro ao cancelar plantão')
        }
    }

    const filteredLocations = selectedLocation === 'all'
        ? locations
        : locations.filter(l => l.id === selectedLocation)

    const slotsForLocation = (locationId: string) =>
        timeSlots.filter(s => s.location_id === locationId)

    return (
        <div style={{ padding: '24px', background: T.base, minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(78,205,196,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CalendarCheck2 size={20} color="#4ECDC4" />
                    </div>
                    <div>
                        <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Rodízio de Plantão</h1>
                        <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>
                            Semana de {format(weekStart, "d 'de' MMM", { locale: ptBR })} a {format(weekEnd, "d 'de' MMM", { locale: ptBR })}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {currentCycle && (
                        <div style={{
                            padding: '6px 12px', borderRadius: 8,
                            background: currentCycle.status === 'open' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                            color: currentCycle.status === 'open' ? 'var(--success)' : 'var(--error)',
                            fontSize: 12, fontWeight: 600,
                        }}>
                            {currentCycle.status === 'open' ? '✓ Seleção Aberta' : '✗ Seleção Fechada'}
                        </div>
                    )}
                    <button
                        onClick={() => setWeekStart(d => addDays(d, -7))}
                        style={{ padding: '8px', borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, color: T.text, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                        style={{ padding: '8px 14px', borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted, cursor: 'pointer', fontSize: 12 }}
                    >
                        Hoje
                    </button>
                    <button
                        onClick={() => setWeekStart(d => addDays(d, 7))}
                        style={{ padding: '8px', borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, color: T.text, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Location filter */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                <button
                    onClick={() => setSelectedLocation('all')}
                    style={{
                        padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        background: selectedLocation === 'all' ? 'rgba(78,205,196,0.15)' : T.surface,
                        color: selectedLocation === 'all' ? '#4ECDC4' : T.textMuted,
                        border: selectedLocation === 'all' ? '1px solid rgba(78,205,196,0.4)' : `1px solid ${T.border}`,
                    }}
                >
                    Todos os Locais
                </button>
                {locations.map(loc => (
                    <button
                        key={loc.id}
                        onClick={() => setSelectedLocation(loc.id)}
                        style={{
                            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            background: selectedLocation === loc.id ? 'rgba(78,205,196,0.15)' : T.surface,
                            color: selectedLocation === loc.id ? '#4ECDC4' : T.textMuted,
                            border: selectedLocation === loc.id ? '1px solid rgba(78,205,196,0.4)' : `1px solid ${T.border}`,
                        }}
                    >
                        <MapPin size={11} style={{ marginRight: 4 }} />
                        {loc.name}
                        <span style={{ marginLeft: 6, opacity: 0.6, fontSize: 10 }}>
                            (máx {loc.max_brokers_per_slot})
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                    <Loader2 size={32} color="#4ECDC4" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    {filteredLocations.map(location => {
                        const slots = slotsForLocation(location.id)
                        return (
                            <motion.div
                                key={location.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    background: T.surface, borderRadius: 14,
                                    border: `1px solid ${T.border}`, marginBottom: 20,
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Location header */}
                                <div style={{
                                    padding: '14px 20px', borderBottom: `1px solid ${T.border}`,
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    background: 'rgba(78,205,196,0.05)',
                                }}>
                                    <Building2 size={16} color="#4ECDC4" />
                                    <span style={{ color: T.text, fontWeight: 700, fontSize: 15 }}>{location.name}</span>
                                    <span style={{
                                        fontSize: 11, padding: '2px 8px', borderRadius: 10,
                                        background: 'rgba(78,205,196,0.12)', color: '#4ECDC4',
                                    }}>
                                        {LOCATION_TYPE_LABEL[location.location_type] || location.location_type}
                                    </span>
                                    <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 'auto' }}>
                                        <Users size={11} style={{ marginRight: 3 }} />
                                        Capacidade: {location.max_brokers_per_slot} corretores/turno
                                    </span>
                                </div>

                                {/* Calendar grid */}
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                                        <thead>
                                            <tr>
                                                <th style={{ padding: '10px 16px', textAlign: 'left', color: T.textMuted, fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${T.border}`, width: 100 }}>
                                                    Turno
                                                </th>
                                                {weekDays.map(day => (
                                                    <th key={day.toISOString()} style={{
                                                        padding: '10px 8px', textAlign: 'center', borderBottom: `1px solid ${T.border}`,
                                                        color: isSameDay(day, new Date()) ? '#4ECDC4' : T.textMuted,
                                                        fontSize: 12, fontWeight: 600,
                                                    }}>
                                                        <div>{format(day, 'EEE', { locale: ptBR })}</div>
                                                        <div style={{ fontSize: 16, fontWeight: 700, color: isSameDay(day, new Date()) ? '#4ECDC4' : T.text }}>
                                                            {format(day, 'd')}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {slots.map(slot => (
                                                <tr key={slot.id}>
                                                    <td style={{ padding: '8px 16px', borderBottom: `1px solid ${T.border}`, verticalAlign: 'top' }}>
                                                        <div style={{ color: T.text, fontSize: 12, fontWeight: 600 }}>{slot.label}</div>
                                                        <div style={{ color: T.textMuted, fontSize: 11 }}>
                                                            {slot.start_time?.slice(0, 5)}–{slot.end_time?.slice(0, 5)}
                                                        </div>
                                                    </td>
                                                    {weekDays.map(day => {
                                                        const cellSchedules = getSchedulesForCell(location.id, slot.id, day)
                                                        const capacity = getSlotCapacity(location.id, slot.id)
                                                        const isFull = cellSchedules.length >= capacity
                                                        const hasMySlot = cellSchedules.some(isMySchedule)
                                                        const isPast = day < new Date()
                                                        const fillPct = Math.min((cellSchedules.length / capacity) * 100, 100)
                                                        const fillColor = fillPct === 100 ? 'var(--error)' : fillPct >= 60 ? 'var(--warning)' : 'var(--success)'

                                                        return (
                                                            <td
                                                                key={day.toISOString()}
                                                                style={{
                                                                    padding: '6px',
                                                                    borderBottom: `1px solid ${T.border}`,
                                                                    borderLeft: `1px solid ${T.border}`,
                                                                    verticalAlign: 'top',
                                                                    minHeight: 80,
                                                                    background: isSameDay(day, new Date()) ? 'rgba(78,205,196,0.03)' : 'transparent',
                                                                }}
                                                            >
                                                                {/* Capacity bar */}
                                                                <div style={{ height: 3, borderRadius: 2, background: T.border, marginBottom: 6 }}>
                                                                    <div style={{ height: '100%', width: `${fillPct}%`, background: fillColor, borderRadius: 2, transition: 'width 0.3s' }} />
                                                                </div>
                                                                <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4, textAlign: 'right' }}>
                                                                    {cellSchedules.length}/{capacity}
                                                                </div>

                                                                {/* Scheduled brokers */}
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                                                    {cellSchedules.map(schedule => (
                                                                        <div
                                                                            key={schedule.id}
                                                                            style={{
                                                                                padding: '4px 6px', borderRadius: 6, fontSize: 11,
                                                                                background: isMySchedule(schedule)
                                                                                    ? 'rgba(78,205,196,0.15)' : T.elevated,
                                                                                color: isMySchedule(schedule) ? '#4ECDC4' : T.textMuted,
                                                                                border: isMySchedule(schedule)
                                                                                    ? '1px solid rgba(78,205,196,0.4)' : `1px solid ${T.border}`,
                                                                                display: 'flex', alignItems: 'center', gap: 4,
                                                                                cursor: isMySchedule(schedule) ? 'pointer' : 'default',
                                                                            }}
                                                                            title={isMySchedule(schedule) ? 'Clique para cancelar' : ''}
                                                                        >
                                                                            {isMySchedule(schedule) && <Star size={9} />}
                                                                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                {schedule.broker?.name || 'Corretor'}
                                                                            </span>
                                                                            {isMySchedule(schedule) && !isPast && (
                                                                                <button
                                                                                    onClick={() => handleCancelSchedule(schedule.id)}
                                                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--error)', display: 'flex' }}
                                                                                >
                                                                                    <X size={10} />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {/* Book button */}
                                                                {!isFull && !hasMySlot && !isPast && currentCycle?.status === 'open' && (
                                                                    <button
                                                                        onClick={() => handleBookSlot(location.id, slot.id, day)}
                                                                        style={{
                                                                            marginTop: 4, width: '100%', padding: '4px 0',
                                                                            borderRadius: 6, border: `1px dashed rgba(78,205,196,0.3)`,
                                                                            background: 'rgba(78,205,196,0.05)', color: 'rgba(78,205,196,0.7)',
                                                                            cursor: 'pointer', fontSize: 11,
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                                                        }}
                                                                    >
                                                                        <Plus size={10} /> Reservar
                                                                    </button>
                                                                )}
                                                                {isFull && (
                                                                    <div style={{ marginTop: 4, textAlign: 'center', fontSize: 10, color: 'var(--error)', opacity: 0.7 }}>
                                                                        Lotado
                                                                    </div>
                                                                )}
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )
                    })}

                    {filteredLocations.length === 0 && !loading && (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: T.textMuted }}>
                            <CalendarCheck2 size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                            <p>Nenhum local de plantão cadastrado</p>
                        </div>
                    )}
                </div>
            )}

            {/* Booking confirmation modal */}
            <AnimatePresence>
                {showBookModal && bookingSlot && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1000, padding: 16,
                        }}
                        onClick={() => setShowBookModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: T.surface, borderRadius: 16,
                                border: `1px solid ${T.border}`, padding: 28,
                                maxWidth: 400, width: '100%',
                            }}
                        >
                            <h2 style={{ color: T.text, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                                Confirmar Plantão
                            </h2>
                            {(() => {
                                const loc = locations.find(l => l.id === bookingSlot.locationId)
                                const slot = timeSlots.find(s => s.id === bookingSlot.timeSlotId)
                                return (
                                    <div style={{ color: T.textMuted, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                                        <p><strong style={{ color: T.text }}>Local:</strong> {loc?.name}</p>
                                        <p><strong style={{ color: T.text }}>Turno:</strong> {slot?.label} ({slot?.start_time?.slice(0,5)}–{slot?.end_time?.slice(0,5)})</p>
                                        <p><strong style={{ color: T.text }}>Data:</strong> {format(bookingSlot.date, "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
                                    </div>
                                )
                            })()}
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    onClick={() => setShowBookModal(false)}
                                    style={{
                                        flex: 1, padding: '10px 0', borderRadius: 8,
                                        background: 'transparent', border: `1px solid ${T.border}`,
                                        color: T.textMuted, cursor: 'pointer', fontSize: 14,
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmBooking}
                                    disabled={booking}
                                    style={{
                                        flex: 2, padding: '10px 0', borderRadius: 8,
                                        background: 'rgba(78,205,196,0.15)', border: '1px solid rgba(78,205,196,0.4)',
                                        color: '#4ECDC4', cursor: booking ? 'not-allowed' : 'pointer',
                                        fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    }}
                                >
                                    {booking ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={16} />}
                                    {booking ? 'Reservando...' : 'Confirmar Plantão'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
