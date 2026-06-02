'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Car, Loader2, CheckCircle, Clock, XCircle, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type MaintenanceStatus = 'agendada' | 'em_andamento' | 'concluida' | 'cancelada'

interface Maintenance {
    id: string
    maintenance_type: string
    description: string
    status: MaintenanceStatus
    cost?: number
    km_at_maintenance?: number
    service_center?: string
    scheduled_date?: string
    completed_at?: string
    next_maintenance_km?: number
    created_at: string
    vehicle?: { plate: string; brand: string; model: string; year: number }
}

const STATUS_CFG: Record<MaintenanceStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
    agendada:     { label: 'Agendada',     color: 'var(--info)',    bg: 'rgba(96,165,250,0.10)',  icon: Clock        },
    em_andamento: { label: 'Em Andamento', color: 'var(--warning)', bg: 'rgba(251,191,36,0.10)',  icon: AlertTriangle },
    concluida:    { label: 'Concluída',    color: 'var(--success)', bg: 'rgba(34,197,94,0.10)',   icon: CheckCircle  },
    cancelada:    { label: 'Cancelada',    color: T.textMuted,      bg: 'rgba(148,163,184,0.10)', icon: XCircle      },
}

const TYPE_LABELS: Record<string, string> = {
    preventiva: 'Preventiva',
    corretiva: 'Corretiva',
    revisao: 'Revisão',
    pneu: 'Pneu',
    freio: 'Freio',
    outros: 'Outros',
}

export default function ManutencoesPage() {
    const [maintenances, setMaintenances] = useState<Maintenance[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [updating, setUpdating] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const params = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
            const res = await fetch(`/api/frota/manutencoes${params}`)
            if (res.ok) {
                const data = await res.json()
                setMaintenances(data.data || [])
            }
        } catch {
            toast.error('Erro ao carregar manutenções')
        } finally {
            setLoading(false)
        }
    }, [statusFilter])

    useEffect(() => { fetchData() }, [fetchData])

    const handleUpdateStatus = async (id: string, status: 'em_andamento' | 'concluida' | 'cancelada') => {
        setUpdating(id)
        try {
            const res = await fetch('/api/frota/manutencoes', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error)
            }
            const labels: Record<string, string> = { em_andamento: 'iniciada', concluida: 'concluída', cancelada: 'cancelada' }
            toast.success(`Manutenção ${labels[status]}!`)
            fetchData()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Erro ao atualizar')
        } finally {
            setUpdating(null)
        }
    }

    const filterTabs = [
        { id: 'all', label: 'Todas' },
        { id: 'agendada', label: 'Agendadas' },
        { id: 'em_andamento', label: 'Em Andamento' },
        { id: 'concluida', label: 'Concluídas' },
    ]

    const totalCost = maintenances
        .filter(m => m.status === 'concluida' && m.cost)
        .reduce((sum, m) => sum + (m.cost ?? 0), 0)

    return (
        <div style={{ padding: '24px', background: T.base, minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(78,205,196,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertTriangle size={20} color="#4ECDC4" />
                    </div>
                    <div>
                        <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Manutenções</h1>
                        <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>
                            {maintenances.length} registro{maintenances.length !== 1 ? 's' : ''}
                            {totalCost > 0 && ` · R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em custos`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                {filterTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setStatusFilter(tab.id)}
                        style={{
                            padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            background: statusFilter === tab.id ? 'rgba(78,205,196,0.15)' : T.surface,
                            color: statusFilter === tab.id ? '#4ECDC4' : T.textMuted,
                            border: statusFilter === tab.id ? '1px solid rgba(78,205,196,0.4)' : `1px solid ${T.border}`,
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
            ) : maintenances.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: T.textMuted }}>
                    <Wrench size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p style={{ margin: 0 }}>Nenhuma manutenção encontrada</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {maintenances.map((m, i) => {
                        const cfg = STATUS_CFG[m.status]
                        const Icon = cfg.icon

                        return (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: '18px 20px' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <Car size={15} color="#4ECDC4" />
                                            <span style={{ color: T.text, fontWeight: 700, fontSize: 15 }}>
                                                {m.vehicle ? `${m.vehicle.brand} ${m.vehicle.model} ${m.vehicle.year}` : '—'}
                                            </span>
                                            {m.vehicle?.plate && (
                                                <span style={{ fontSize: 11, color: T.textMuted, fontFamily: 'monospace', padding: '1px 6px', borderRadius: 5, background: T.elevated, border: `1px solid ${T.border}` }}>
                                                    {m.vehicle.plate}
                                                </span>
                                            )}
                                            <span style={{
                                                fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600,
                                                background: 'rgba(78,205,196,0.10)', color: '#4ECDC4',
                                            }}>
                                                {TYPE_LABELS[m.maintenance_type] || m.maintenance_type}
                                            </span>
                                        </div>
                                        <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>{m.description}</p>
                                    </div>
                                    <span style={{
                                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                                        background: cfg.bg, color: cfg.color,
                                        display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                                    }}>
                                        <Icon size={12} />
                                        {cfg.label}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                                    {m.service_center && (
                                        <span style={{ color: T.textMuted, fontSize: 12 }}>
                                            <Wrench size={11} style={{ marginRight: 4 }} />
                                            {m.service_center}
                                        </span>
                                    )}
                                    {m.cost != null && (
                                        <span style={{ color: T.textMuted, fontSize: 12 }}>
                                            Custo: <strong style={{ color: T.text }}>R$ {m.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                        </span>
                                    )}
                                    {m.km_at_maintenance != null && (
                                        <span style={{ color: T.textMuted, fontSize: 12 }}>
                                            KM: <strong style={{ color: T.text }}>{m.km_at_maintenance.toLocaleString('pt-BR')}</strong>
                                        </span>
                                    )}
                                    {m.scheduled_date && (
                                        <span style={{ color: T.textMuted, fontSize: 12 }}>
                                            Agendado: {format(parseISO(m.scheduled_date), "d 'de' MMM", { locale: ptBR })}
                                        </span>
                                    )}
                                    {m.completed_at && (
                                        <span style={{ color: 'var(--success)', fontSize: 12 }}>
                                            Concluído: {format(parseISO(m.completed_at), "d 'de' MMM", { locale: ptBR })}
                                        </span>
                                    )}
                                </div>

                                {/* Status action buttons */}
                                {m.status === 'agendada' && (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => handleUpdateStatus(m.id, 'em_andamento')}
                                            disabled={updating === m.id}
                                            style={{
                                                padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                                background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
                                                color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 6,
                                            }}
                                        >
                                            {updating === m.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <AlertTriangle size={12} />}
                                            Iniciar
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(m.id, 'cancelada')}
                                            disabled={updating === m.id}
                                            style={{
                                                padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                                                background: T.elevated, border: `1px solid ${T.border}`,
                                                color: T.textMuted, display: 'flex', alignItems: 'center', gap: 6,
                                            }}
                                        >
                                            <XCircle size={12} /> Cancelar
                                        </button>
                                    </div>
                                )}
                                {m.status === 'em_andamento' && (
                                    <button
                                        onClick={() => handleUpdateStatus(m.id, 'concluida')}
                                        disabled={updating === m.id}
                                        style={{
                                            padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                                            color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6,
                                        }}
                                    >
                                        {updating === m.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={12} />}
                                        Marcar como Concluída
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
