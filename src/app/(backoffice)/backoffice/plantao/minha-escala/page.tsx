'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    ClipboardList, MapPin, Clock, CalendarCheck2, X, Loader2,
    ArrowLeftRight, CheckCircle, AlertCircle, XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { format, parseISO, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

type ScheduleStatus = 'confirmed' | 'cancelled' | 'swapped' | 'no_show' | 'completed'

interface Schedule {
    id: string
    schedule_date: string
    start_time: string
    end_time: string
    status: ScheduleStatus
    location?: { name: string; location_type: string }
    time_slot?: { label: string }
    broker?: { name: string }
}

const STATUS_CFG: Record<ScheduleStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
    confirmed:  { label: 'Confirmado', color: 'var(--success)', bg: 'rgba(34,197,94,0.10)',   icon: CheckCircle  },
    cancelled:  { label: 'Cancelado',  color: 'var(--error)',   bg: 'rgba(239,68,68,0.10)',   icon: XCircle      },
    swapped:    { label: 'Trocado',    color: 'var(--warning)', bg: 'rgba(251,191,36,0.10)',  icon: ArrowLeftRight },
    no_show:    { label: 'Faltou',     color: 'var(--error)',   bg: 'rgba(239,68,68,0.10)',   icon: AlertCircle  },
    completed:  { label: 'Concluído',  color: 'var(--info)',    bg: 'rgba(96,165,250,0.10)',  icon: CheckCircle  },
}

const LOCATION_TYPE_LABEL: Record<string, string> = {
    imobiliaria: 'Imobiliária',
    loteamento: 'Loteamento',
    condominio: 'Condomínio',
    empreendimento: 'Empreendimento',
}

export default function MinhaEscalaPage() {
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
    const [cancelling, setCancelling] = useState<string | null>(null)

    const fetchSchedules = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/plantao/escala?my_schedules=true')
            if (res.ok) {
                const data = await res.json()
                setSchedules(data.data || [])
            }
        } catch {
            toast.error('Erro ao carregar sua escala')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchSchedules() }, [fetchSchedules])

    const handleCancel = async (id: string) => {
        const reason = window.prompt('Motivo do cancelamento (opcional):')
        if (reason === null) return
        setCancelling(id)
        try {
            const res = await fetch(`/api/plantao/escala?id=${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cancel_reason: reason }),
            })
            if (!res.ok) throw new Error()
            toast.success('Plantão cancelado')
            fetchSchedules()
        } catch {
            toast.error('Erro ao cancelar plantão')
        } finally {
            setCancelling(null)
        }
    }

    const filtered = schedules.filter(s => {
        const past = isPast(parseISO(s.schedule_date))
        if (filter === 'upcoming') return !past && s.status !== 'cancelled'
        if (filter === 'past') return past || s.status === 'cancelled'
        return true
    })

    const tabs = [
        { id: 'upcoming', label: 'Próximos' },
        { id: 'past', label: 'Passados' },
        { id: 'all', label: 'Todos' },
    ] as const

    return (
        <div style={{ padding: '24px', background: T.base, minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(78,205,196,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ClipboardList size={20} color="#4ECDC4" />
                    </div>
                    <div>
                        <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Minha Escala</h1>
                        <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>
                            Seus plantões agendados
                        </p>
                    </div>
                </div>
                <Link
                    href="/backoffice/plantao/trocas"
                    style={{
                        padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        background: 'rgba(78,205,196,0.12)', border: '1px solid rgba(78,205,196,0.3)',
                        color: '#4ECDC4', textDecoration: 'none',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}
                >
                    <ArrowLeftRight size={14} /> Solicitar Troca
                </Link>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        style={{
                            padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            background: filter === tab.id ? 'rgba(78,205,196,0.15)' : T.surface,
                            color: filter === tab.id ? '#4ECDC4' : T.textMuted,
                            border: filter === tab.id ? '1px solid rgba(78,205,196,0.4)' : `1px solid ${T.border}`,
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                    <Loader2 size={32} color="#4ECDC4" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: T.textMuted }}>
                    <ClipboardList size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p style={{ margin: 0 }}>Nenhum plantão encontrado</p>
                    <Link
                        href="/backoffice/plantao"
                        style={{ marginTop: 12, display: 'inline-block', color: '#4ECDC4', fontSize: 14 }}
                    >
                        Ver calendário de plantão
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filtered.map((schedule, i) => {
                        const cfg = STATUS_CFG[schedule.status]
                        const Icon = cfg.icon
                        const dateObj = parseISO(schedule.schedule_date)
                        const past = isPast(dateObj)
                        const canCancel = schedule.status === 'confirmed' && !past

                        return (
                            <motion.div
                                key={schedule.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                style={{
                                    background: T.surface, borderRadius: 14,
                                    border: `1px solid ${T.border}`, padding: '18px 20px',
                                    display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                                    opacity: past && schedule.status !== 'confirmed' ? 0.7 : 1,
                                }}
                            >
                                {/* Date block */}
                                <div style={{
                                    minWidth: 60, textAlign: 'center',
                                    background: 'rgba(78,205,196,0.08)', borderRadius: 10, padding: '8px 12px',
                                }}>
                                    <div style={{ color: '#4ECDC4', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                                        {format(dateObj, 'MMM', { locale: ptBR })}
                                    </div>
                                    <div style={{ color: T.text, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
                                        {format(dateObj, 'd')}
                                    </div>
                                    <div style={{ color: T.textMuted, fontSize: 11 }}>
                                        {format(dateObj, 'EEE', { locale: ptBR })}
                                    </div>
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 180 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <MapPin size={13} color="#4ECDC4" />
                                        <span style={{ color: T.text, fontWeight: 600, fontSize: 15 }}>
                                            {schedule.location?.name || '—'}
                                        </span>
                                        {schedule.location?.location_type && (
                                            <span style={{
                                                fontSize: 11, padding: '2px 7px', borderRadius: 10,
                                                background: 'rgba(78,205,196,0.10)', color: '#4ECDC4',
                                            }}>
                                                {LOCATION_TYPE_LABEL[schedule.location.location_type] || schedule.location.location_type}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: T.textMuted, fontSize: 13 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Clock size={12} />
                                            {schedule.time_slot?.label || `${schedule.start_time?.slice(0,5)}–${schedule.end_time?.slice(0,5)}`}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <CalendarCheck2 size={12} />
                                            {format(dateObj, "EEEE", { locale: ptBR })}
                                        </span>
                                    </div>
                                </div>

                                {/* Status */}
                                <div style={{
                                    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                                    background: cfg.bg, color: cfg.color,
                                    display: 'flex', alignItems: 'center', gap: 5,
                                }}>
                                    <Icon size={12} />
                                    {cfg.label}
                                </div>

                                {/* Cancel */}
                                {canCancel && (
                                    <button
                                        onClick={() => handleCancel(schedule.id)}
                                        disabled={cancelling === schedule.id}
                                        style={{
                                            padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                                            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                            color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
                                        }}
                                    >
                                        {cancelling === schedule.id
                                            ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                            : <X size={12} />
                                        }
                                        Cancelar
                                    </button>
                                )}
                            </motion.div>
                        )
                    })}
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
