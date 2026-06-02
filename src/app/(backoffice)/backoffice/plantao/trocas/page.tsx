'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    ArrowLeftRight, CheckCircle, XCircle, Clock, MapPin,
    Loader2, User, CalendarDays,
} from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type SwapStatus = 'pending' | 'accepted' | 'rejected' | 'approved' | 'cancelled'

interface SwapRequest {
    id: string
    status: SwapStatus
    reason: string
    swap_type: string
    created_at: string
    expires_at?: string
    response_notes?: string
    requester?: { id: string; name: string; avatar_url?: string }
    target_broker?: { id: string; name: string; avatar_url?: string }
    requester_schedule?: {
        id: string
        schedule_date: string
        start_time: string
        end_time: string
        location?: { name: string }
        time_slot?: { label: string }
    }
    target_schedule?: {
        id: string
        schedule_date: string
        start_time: string
        end_time: string
        location?: { name: string }
        time_slot?: { label: string }
    }
}

const STATUS_CFG: Record<SwapStatus, { label: string; color: string; bg: string }> = {
    pending:   { label: 'Pendente',  color: 'var(--warning)', bg: 'rgba(251,191,36,0.10)' },
    accepted:  { label: 'Aceita',    color: 'var(--info)',    bg: 'rgba(96,165,250,0.10)' },
    rejected:  { label: 'Rejeitada', color: 'var(--error)',   bg: 'rgba(239,68,68,0.10)'  },
    approved:  { label: 'Aprovada',  color: 'var(--success)', bg: 'rgba(34,197,94,0.10)'  },
    cancelled: { label: 'Cancelada', color: T.textMuted,      bg: 'rgba(148,163,184,0.10)'},
}

export default function TrocasPage() {
    const [swaps, setSwaps] = useState<SwapRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')
    const [responding, setResponding] = useState<string | null>(null)

    const fetchSwaps = useCallback(async () => {
        setLoading(true)
        try {
            const params = filter !== 'all' ? `?status=${filter}` : ''
            const res = await fetch(`/api/plantao/trocas${params}`)
            if (res.ok) {
                const data = await res.json()
                setSwaps(data.data || [])
            }
        } catch {
            toast.error('Erro ao carregar trocas')
        } finally {
            setLoading(false)
        }
    }, [filter])

    useEffect(() => { fetchSwaps() }, [fetchSwaps])

    const handleRespond = async (swapId: string, action: 'accept' | 'reject' | 'cancel') => {
        let notes = ''
        if (action === 'reject') {
            const n = window.prompt('Motivo da rejeição (opcional):')
            if (n === null) return
            notes = n
        }
        setResponding(swapId)
        try {
            const res = await fetch('/api/plantao/trocas', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ swap_id: swapId, action, response_notes: notes || null }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error)
            }
            const labels: Record<string, string> = { accept: 'aceita', reject: 'rejeitada', cancel: 'cancelada' }
            toast.success(`Troca ${labels[action]} com sucesso!`)
            fetchSwaps()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Erro ao responder troca')
        } finally {
            setResponding(null)
        }
    }

    const tabs = [
        { id: 'all', label: 'Todas' },
        { id: 'pending', label: 'Pendentes' },
        { id: 'approved', label: 'Aprovadas' },
    ] as const

    return (
        <div style={{ padding: '24px', background: T.base, minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(78,205,196,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowLeftRight size={20} color="#4ECDC4" />
                </div>
                <div>
                    <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Trocas de Plantão</h1>
                    <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>Gerencie solicitações de troca de turno</p>
                </div>
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
            ) : swaps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: T.textMuted }}>
                    <ArrowLeftRight size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p style={{ margin: 0 }}>Nenhuma troca encontrada</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {swaps.map((swap, i) => {
                        const cfg = STATUS_CFG[swap.status]
                        const isPending = swap.status === 'pending'

                        return (
                            <motion.div
                                key={swap.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                style={{
                                    background: T.surface, borderRadius: 14,
                                    border: `1px solid ${T.border}`, padding: '18px 20px',
                                }}
                            >
                                {/* Top row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%', background: 'rgba(78,205,196,0.12)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <User size={15} color="#4ECDC4" />
                                        </div>
                                        <div>
                                            <span style={{ color: T.text, fontWeight: 600, fontSize: 14 }}>
                                                {swap.requester?.name || '—'}
                                            </span>
                                            <span style={{ color: T.textMuted, fontSize: 13 }}> → </span>
                                            <span style={{ color: T.text, fontWeight: 600, fontSize: 14 }}>
                                                {swap.target_broker?.name || 'Qualquer corretor'}
                                            </span>
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                                        background: cfg.bg, color: cfg.color,
                                    }}>
                                        {cfg.label}
                                    </span>
                                </div>

                                {/* Schedules */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', marginBottom: 14 }}>
                                    {/* Requester's schedule */}
                                    <div style={{ padding: '10px 12px', borderRadius: 10, background: T.elevated, border: `1px solid ${T.border}` }}>
                                        <div style={{ color: T.textMuted, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>SOLICITA TROCA DE</div>
                                        {swap.requester_schedule ? (
                                            <>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.text, fontSize: 13, fontWeight: 600 }}>
                                                    <CalendarDays size={12} color="#4ECDC4" />
                                                    {format(parseISO(swap.requester_schedule.schedule_date), "d 'de' MMM", { locale: ptBR })}
                                                </div>
                                                <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>
                                                    <MapPin size={11} style={{ marginRight: 3 }} />
                                                    {swap.requester_schedule.location?.name || '—'}
                                                </div>
                                                <div style={{ color: T.textMuted, fontSize: 12 }}>
                                                    {swap.requester_schedule.time_slot?.label || `${swap.requester_schedule.start_time?.slice(0,5)}–${swap.requester_schedule.end_time?.slice(0,5)}`}
                                                </div>
                                            </>
                                        ) : (
                                            <span style={{ color: T.textMuted, fontSize: 13 }}>—</span>
                                        )}
                                    </div>

                                    <ArrowLeftRight size={18} color={T.textMuted} />

                                    {/* Target's schedule */}
                                    <div style={{ padding: '10px 12px', borderRadius: 10, background: T.elevated, border: `1px solid ${T.border}` }}>
                                        <div style={{ color: T.textMuted, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>PELO TURNO</div>
                                        {swap.target_schedule ? (
                                            <>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.text, fontSize: 13, fontWeight: 600 }}>
                                                    <CalendarDays size={12} color="#4ECDC4" />
                                                    {format(parseISO(swap.target_schedule.schedule_date), "d 'de' MMM", { locale: ptBR })}
                                                </div>
                                                <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>
                                                    <MapPin size={11} style={{ marginRight: 3 }} />
                                                    {swap.target_schedule.location?.name || '—'}
                                                </div>
                                                <div style={{ color: T.textMuted, fontSize: 12 }}>
                                                    {swap.target_schedule.time_slot?.label || `${swap.target_schedule.start_time?.slice(0,5)}–${swap.target_schedule.end_time?.slice(0,5)}`}
                                                </div>
                                            </>
                                        ) : (
                                            <span style={{ color: T.textMuted, fontSize: 13 }}>Qualquer disponível</span>
                                        )}
                                    </div>
                                </div>

                                {/* Reason */}
                                <div style={{ color: T.textMuted, fontSize: 13, marginBottom: isPending ? 14 : 0, fontStyle: 'italic' }}>
                                    "{swap.reason}"
                                </div>

                                {/* Actions */}
                                {isPending && swap.target_broker && (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => handleRespond(swap.id, 'accept')}
                                            disabled={responding === swap.id}
                                            style={{
                                                flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                                                background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                                                color: 'var(--success)', fontWeight: 600, fontSize: 13,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            }}
                                        >
                                            {responding === swap.id
                                                ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                                : <CheckCircle size={14} />
                                            }
                                            Aceitar
                                        </button>
                                        <button
                                            onClick={() => handleRespond(swap.id, 'reject')}
                                            disabled={responding === swap.id}
                                            style={{
                                                flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                                                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                                color: 'var(--error)', fontWeight: 600, fontSize: 13,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            }}
                                        >
                                            <XCircle size={14} /> Rejeitar
                                        </button>
                                        <button
                                            onClick={() => handleRespond(swap.id, 'cancel')}
                                            disabled={responding === swap.id}
                                            style={{
                                                padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                                                background: T.elevated, border: `1px solid ${T.border}`,
                                                color: T.textMuted, fontSize: 13,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            }}
                                        >
                                            <Clock size={14} /> Cancelar
                                        </button>
                                    </div>
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
