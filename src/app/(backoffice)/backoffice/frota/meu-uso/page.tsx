'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Key, Car, MapPin, Clock, Loader2, CheckCircle, XCircle,
    AlertCircle, RotateCcw, Fuel,
} from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type UsageStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'em_uso' | 'devolvido' | 'cancelado'

interface VehicleUsage {
    id: string
    status: UsageStatus
    purpose: string
    purpose_description: string
    destination?: string
    estimated_return?: string
    km_initial?: number
    km_final?: number
    fuel_level_initial?: string
    fuel_level_final?: string
    pickup_at?: string
    returned_at?: string
    rejection_reason?: string
    created_at: string
    vehicle?: {
        id: string
        plate: string
        brand: string
        model: string
        year: number
        fuel_type: string
    }
}

const STATUS_CFG: Record<UsageStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
    pendente:  { label: 'Aguardando',  color: 'var(--warning)', bg: 'rgba(251,191,36,0.10)',  icon: Clock        },
    aprovado:  { label: 'Aprovado',    color: 'var(--info)',    bg: 'rgba(96,165,250,0.10)',  icon: CheckCircle  },
    rejeitado: { label: 'Rejeitado',   color: 'var(--error)',   bg: 'rgba(239,68,68,0.10)',   icon: XCircle      },
    em_uso:    { label: 'Em Uso',      color: '#4ECDC4',        bg: 'rgba(78,205,196,0.10)',  icon: Car          },
    devolvido: { label: 'Devolvido',   color: 'var(--success)', bg: 'rgba(34,197,94,0.10)',   icon: RotateCcw    },
    cancelado: { label: 'Cancelado',   color: T.textMuted,      bg: 'rgba(148,163,184,0.10)', icon: AlertCircle  },
}

const PURPOSE_LABELS: Record<string, string> = {
    visita_cliente: 'Visita ao Cliente', plantao: 'Plantão', captacao: 'Captação',
    vistoria: 'Vistoria', documentacao: 'Documentação', reuniao: 'Reunião',
    marketing: 'Marketing', suporte_interno: 'Suporte Interno', outro: 'Outro',
}

export default function MeuUsoPage() {
    const [usages, setUsages] = useState<VehicleUsage[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('all')
    const [returning, setReturning] = useState<string | null>(null)
    const [returnModal, setReturnModal] = useState<VehicleUsage | null>(null)
    const [returnForm, setReturnForm] = useState({ km_final: '', fuel_level_final: '1/2', return_notes: '' })

    const fetchUsages = useCallback(async () => {
        setLoading(true)
        try {
            const params = filter !== 'all' ? `?status=${filter}` : ''
            const res = await fetch(`/api/frota/usos${params}`)
            if (res.ok) {
                const data = await res.json()
                setUsages(data.data || [])
            }
        } catch {
            toast.error('Erro ao carregar histórico de uso')
        } finally {
            setLoading(false)
        }
    }, [filter])

    useEffect(() => { fetchUsages() }, [fetchUsages])

    const handleReturn = async () => {
        if (!returnModal) return
        if (!returnForm.km_final) { toast.error('Informe a quilometragem final'); return }
        setReturning(returnModal.id)
        try {
            const res = await fetch('/api/frota/usos', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: returnModal.id,
                    km_final: parseInt(returnForm.km_final),
                    fuel_level_final: returnForm.fuel_level_final,
                    return_notes: returnForm.return_notes || null,
                }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error)
            }
            toast.success('Veículo devolvido com sucesso!')
            setReturnModal(null)
            setReturnForm({ km_final: '', fuel_level_final: '1/2', return_notes: '' })
            fetchUsages()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Erro ao devolver veículo')
        } finally {
            setReturning(null)
        }
    }

    const filterTabs = [
        { id: 'all', label: 'Todos' },
        { id: 'pendente', label: 'Pendentes' },
        { id: 'em_uso', label: 'Em Uso' },
        { id: 'devolvido', label: 'Devolvidos' },
    ]

    const fuelLevels = ['vazio', '1/4', '1/2', '3/4', 'cheio']

    return (
        <div style={{ padding: '24px', background: T.base, minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(78,205,196,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Key size={20} color="#4ECDC4" />
                </div>
                <div>
                    <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Meu Uso de Frota</h1>
                    <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>Histórico de utilização de veículos</p>
                </div>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                {filterTabs.map(tab => (
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
            ) : usages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: T.textMuted }}>
                    <Car size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p style={{ margin: 0 }}>Nenhum uso registrado</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {usages.map((usage, i) => {
                        const cfg = STATUS_CFG[usage.status]
                        const Icon = cfg.icon
                        const kmDriven = usage.km_final && usage.km_initial
                            ? usage.km_final - usage.km_initial
                            : null

                        return (
                            <motion.div
                                key={usage.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                style={{
                                    background: T.surface, borderRadius: 14,
                                    border: `1px solid ${T.border}`, padding: '18px 20px',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Car size={16} color="#4ECDC4" />
                                            <span style={{ color: T.text, fontWeight: 700, fontSize: 15 }}>
                                                {usage.vehicle
                                                    ? `${usage.vehicle.brand} ${usage.vehicle.model} ${usage.vehicle.year}`
                                                    : '—'
                                                }
                                            </span>
                                            {usage.vehicle?.plate && (
                                                <span style={{
                                                    fontSize: 11, padding: '2px 8px', borderRadius: 6,
                                                    background: T.elevated, border: `1px solid ${T.border}`,
                                                    color: T.textMuted, fontWeight: 600, fontFamily: 'monospace',
                                                }}>
                                                    {usage.vehicle.plate}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>
                                            {PURPOSE_LABELS[usage.purpose] || usage.purpose}
                                            {usage.destination && ` · ${usage.destination}`}
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                                        background: cfg.bg, color: cfg.color,
                                        display: 'flex', alignItems: 'center', gap: 5,
                                    }}>
                                        <Icon size={12} />
                                        {cfg.label}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: usage.status === 'em_uso' ? 12 : 0 }}>
                                    <div style={{ color: T.textMuted, fontSize: 12 }}>
                                        <Clock size={11} style={{ marginRight: 4 }} />
                                        {format(parseISO(usage.created_at), "d 'de' MMM", { locale: ptBR })}
                                    </div>
                                    {usage.km_initial != null && (
                                        <div style={{ color: T.textMuted, fontSize: 12 }}>
                                            KM Inicial: <strong style={{ color: T.text }}>{usage.km_initial.toLocaleString('pt-BR')}</strong>
                                        </div>
                                    )}
                                    {kmDriven != null && (
                                        <div style={{ color: T.textMuted, fontSize: 12 }}>
                                            Percorridos: <strong style={{ color: '#4ECDC4' }}>{kmDriven.toLocaleString('pt-BR')} km</strong>
                                        </div>
                                    )}
                                    {usage.rejection_reason && (
                                        <div style={{ color: 'var(--error)', fontSize: 12 }}>
                                            Motivo: {usage.rejection_reason}
                                        </div>
                                    )}
                                </div>

                                {usage.status === 'em_uso' && (
                                    <button
                                        onClick={() => setReturnModal(usage)}
                                        style={{
                                            padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                                            background: 'rgba(78,205,196,0.12)', border: '1px solid rgba(78,205,196,0.3)',
                                            color: '#4ECDC4', fontSize: 13, fontWeight: 600,
                                            display: 'flex', alignItems: 'center', gap: 6,
                                        }}
                                    >
                                        <RotateCcw size={14} /> Registrar Devolução
                                    </button>
                                )}
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* Return Modal */}
            <AnimatePresence>
                {returnModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1000, padding: 16,
                        }}
                        onClick={() => setReturnModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, y: 16 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.92, y: 16 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: T.surface, borderRadius: 16,
                                border: `1px solid ${T.border}`, padding: 28,
                                maxWidth: 440, width: '100%',
                            }}
                        >
                            <h2 style={{ color: T.text, fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 20 }}>
                                Registrar Devolução
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div>
                                    <label style={{ color: T.textMuted, fontSize: 12, display: 'block', marginBottom: 6 }}>
                                        KM Final *
                                    </label>
                                    <input
                                        type="number"
                                        value={returnForm.km_final}
                                        onChange={e => setReturnForm(f => ({ ...f, km_final: e.target.value }))}
                                        placeholder={`Mínimo ${returnModal.km_initial || 0}`}
                                        style={{
                                            width: '100%', padding: '8px 12px', borderRadius: 8, boxSizing: 'border-box',
                                            background: T.elevated, border: `1px solid ${T.border}`,
                                            color: T.text, fontSize: 14, outline: 'none',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ color: T.textMuted, fontSize: 12, display: 'block', marginBottom: 6 }}>
                                        Nível de Combustível
                                    </label>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {fuelLevels.map(level => (
                                            <button
                                                key={level}
                                                onClick={() => setReturnForm(f => ({ ...f, fuel_level_final: level }))}
                                                style={{
                                                    padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                                                    background: returnForm.fuel_level_final === level ? 'rgba(78,205,196,0.15)' : T.elevated,
                                                    border: returnForm.fuel_level_final === level ? '1px solid rgba(78,205,196,0.4)' : `1px solid ${T.border}`,
                                                    color: returnForm.fuel_level_final === level ? '#4ECDC4' : T.textMuted,
                                                }}
                                            >
                                                <Fuel size={11} style={{ marginRight: 4 }} />
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ color: T.textMuted, fontSize: 12, display: 'block', marginBottom: 6 }}>
                                        Observações
                                    </label>
                                    <textarea
                                        value={returnForm.return_notes}
                                        onChange={e => setReturnForm(f => ({ ...f, return_notes: e.target.value }))}
                                        rows={2}
                                        placeholder="Alguma observação sobre a devolução..."
                                        style={{
                                            width: '100%', padding: '8px 12px', borderRadius: 8, boxSizing: 'border-box',
                                            background: T.elevated, border: `1px solid ${T.border}`,
                                            color: T.text, fontSize: 14, resize: 'vertical', outline: 'none',
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button
                                    onClick={() => setReturnModal(null)}
                                    style={{
                                        flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer',
                                        background: 'transparent', border: `1px solid ${T.border}`,
                                        color: T.textMuted, fontSize: 14,
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleReturn}
                                    disabled={!!returning}
                                    style={{
                                        flex: 2, padding: '10px 0', borderRadius: 8, cursor: returning ? 'not-allowed' : 'pointer',
                                        background: 'rgba(78,205,196,0.15)', border: '1px solid rgba(78,205,196,0.4)',
                                        color: '#4ECDC4', fontSize: 14, fontWeight: 600,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    }}
                                >
                                    {returning ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={16} />}
                                    {returning ? 'Salvando...' : 'Confirmar Devolução'}
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
