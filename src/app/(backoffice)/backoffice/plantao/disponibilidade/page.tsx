'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, CheckCircle, Loader2, Save, Info } from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { format, addDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface WeekCycle {
    id: string
    week_start: string
    week_end: string
    selection_opens: string
    selection_closes: string
    status: string
}

interface Availability {
    available_dates: string[]
    preferred_shifts: string[]
    preferred_locations: string[]
    notes?: string
}

const SHIFTS = [
    { id: 'manha', label: 'Manhã', desc: '08:00–12:00' },
    { id: 'tarde', label: 'Tarde', desc: '12:00–18:00' },
    { id: 'noite', label: 'Noite', desc: '18:00–22:00' },
]

export default function DisponibilidadePage() {
    const [cycle, setCycle] = useState<WeekCycle | null>(null)
    const [existing, setExisting] = useState<Availability | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [availDates, setAvailDates] = useState<string[]>([])
    const [preferredShifts, setPreferredShifts] = useState<string[]>([])
    const [notes, setNotes] = useState('')

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const cycleRes = await fetch('/api/plantao/ciclos?status=open')
            if (!cycleRes.ok) throw new Error()
            const cycleData = await cycleRes.json()
            const openCycle: WeekCycle | null = cycleData.data?.[0] || null
            setCycle(openCycle)

            if (openCycle) {
                const availRes = await fetch(`/api/plantao/disponibilidade?cycle_id=${openCycle.id}`)
                if (availRes.ok) {
                    const availData = await availRes.json()
                    if (availData.data) {
                        setExisting(availData.data)
                        setAvailDates(availData.data.available_dates || [])
                        setPreferredShifts(availData.data.preferred_shifts || [])
                        setNotes(availData.data.notes || '')
                    }
                }
            }
        } catch {
            toast.error('Erro ao carregar dados de disponibilidade')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const toggleDate = (date: string) => {
        setAvailDates(prev =>
            prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
        )
    }

    const toggleShift = (shift: string) => {
        setPreferredShifts(prev =>
            prev.includes(shift) ? prev.filter(s => s !== shift) : [...prev, shift]
        )
    }

    const handleSave = async () => {
        if (!cycle) return
        setSaving(true)
        try {
            const res = await fetch('/api/plantao/disponibilidade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    week_cycle_id: cycle.id,
                    available_dates: availDates,
                    preferred_shifts: preferredShifts,
                    preferred_locations: existing?.preferred_locations || [],
                    notes: notes || null,
                }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro ao salvar')
            }
            toast.success('Disponibilidade salva com sucesso!')
            fetchData()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Erro ao salvar disponibilidade')
        } finally {
            setSaving(false)
        }
    }

    const cycleDays = cycle
        ? Array.from({ length: 7 }, (_, i) => {
            const d = addDays(parseISO(cycle.week_start), i)
            return format(d, 'yyyy-MM-dd')
        })
        : []

    const isOpen = cycle?.status === 'open'

    return (
        <div style={{ padding: '24px', background: T.base, minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(78,205,196,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CalendarDays size={20} color="#4ECDC4" />
                </div>
                <div>
                    <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Minha Disponibilidade</h1>
                    <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>Informe os dias e turnos em que pode fazer plantão</p>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                    <Loader2 size={32} color="#4ECDC4" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : !cycle ? (
                <div style={{
                    background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`,
                    padding: '40px 20px', textAlign: 'center',
                }}>
                    <CalendarDays size={40} style={{ marginBottom: 12, opacity: 0.3, color: T.textMuted }} />
                    <p style={{ color: T.textMuted, margin: 0 }}>Nenhum ciclo de seleção aberto no momento</p>
                    <p style={{ color: T.textDim, fontSize: 13, marginTop: 6 }}>Aguarde a abertura do próximo ciclo semanal</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 700 }}>
                    {/* Cycle info */}
                    <div style={{
                        padding: '14px 18px', borderRadius: 12,
                        background: isOpen ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${isOpen ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <Info size={16} color={isOpen ? 'var(--success)' : 'var(--error)'} />
                        <div>
                            <span style={{ color: isOpen ? 'var(--success)' : 'var(--error)', fontWeight: 700, fontSize: 13 }}>
                                {isOpen ? 'Seleção Aberta' : 'Seleção Fechada'}
                            </span>
                            <span style={{ color: T.textMuted, fontSize: 13, marginLeft: 8 }}>
                                Semana de {format(parseISO(cycle.week_start), "d 'de' MMM", { locale: ptBR })} a {format(parseISO(cycle.week_end), "d 'de' MMM", { locale: ptBR })}
                            </span>
                        </div>
                    </div>

                    {/* Days */}
                    <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: '20px' }}>
                        <h2 style={{ color: T.text, fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>
                            Dias Disponíveis
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                            {cycleDays.map(dateStr => {
                                const isSelected = availDates.includes(dateStr)
                                const d = parseISO(dateStr)
                                return (
                                    <motion.button
                                        key={dateStr}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => isOpen && toggleDate(dateStr)}
                                        disabled={!isOpen}
                                        style={{
                                            padding: '12px 8px', borderRadius: 10, cursor: isOpen ? 'pointer' : 'default',
                                            background: isSelected ? 'rgba(78,205,196,0.15)' : T.elevated,
                                            border: isSelected ? '2px solid rgba(78,205,196,0.5)' : `2px solid ${T.border}`,
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        <span style={{ color: T.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>
                                            {format(d, 'EEE', { locale: ptBR })}
                                        </span>
                                        <span style={{ color: isSelected ? '#4ECDC4' : T.text, fontSize: 20, fontWeight: 700 }}>
                                            {format(d, 'd')}
                                        </span>
                                        {isSelected && <CheckCircle size={14} color="#4ECDC4" />}
                                    </motion.button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Shifts */}
                    <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: '20px' }}>
                        <h2 style={{ color: T.text, fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>
                            Turnos Preferidos
                        </h2>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {SHIFTS.map(shift => {
                                const isSelected = preferredShifts.includes(shift.id)
                                return (
                                    <button
                                        key={shift.id}
                                        onClick={() => isOpen && toggleShift(shift.id)}
                                        disabled={!isOpen}
                                        style={{
                                            padding: '10px 18px', borderRadius: 10, cursor: isOpen ? 'pointer' : 'default',
                                            background: isSelected ? 'rgba(78,205,196,0.15)' : T.elevated,
                                            border: isSelected ? '1px solid rgba(78,205,196,0.5)' : `1px solid ${T.border}`,
                                            color: isSelected ? '#4ECDC4' : T.textMuted,
                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        <span style={{ fontWeight: 700, fontSize: 14 }}>{shift.label}</span>
                                        <span style={{ fontSize: 11, marginTop: 2 }}>{shift.desc}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Notes */}
                    <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: '20px' }}>
                        <label style={{ color: T.text, fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 10 }}>
                            Observações (opcional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            disabled={!isOpen}
                            placeholder="Ex: Prefiro não fazer plantão às quintas-feiras..."
                            rows={3}
                            style={{
                                width: '100%', padding: '10px 12px', borderRadius: 8,
                                background: T.elevated, border: `1px solid ${T.border}`,
                                color: T.text, fontSize: 14, resize: 'vertical', outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    {isOpen && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                padding: '12px 0', borderRadius: 10,
                                background: 'rgba(78,205,196,0.15)', border: '1px solid rgba(78,205,196,0.4)',
                                color: '#4ECDC4', cursor: saving ? 'not-allowed' : 'pointer',
                                fontSize: 15, fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}
                        >
                            {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
                            {saving ? 'Salvando...' : 'Salvar Disponibilidade'}
                        </button>
                    )}
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
