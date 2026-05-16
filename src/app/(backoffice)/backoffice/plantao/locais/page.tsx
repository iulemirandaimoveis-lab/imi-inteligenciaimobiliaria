'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Building2, MapPin, Users, Clock, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'

interface TimeSlot {
    id: string
    label: string
    start_time: string
    end_time: string
    max_brokers: number
    is_active: boolean
}

interface DutyLocation {
    id: string
    name: string
    location_type: string
    address?: string
    city?: string
    state?: string
    max_brokers_per_slot: number
    is_active: boolean
    notes?: string
    active_schedules_count?: number
    agency?: { name: string; agency_type: string }
    duty_time_slots?: TimeSlot[]
}

const LOCATION_TYPE_LABEL: Record<string, string> = {
    imobiliaria: 'Imobiliária',
    loteamento: 'Loteamento',
    condominio: 'Condomínio',
    empreendimento: 'Empreendimento',
}

const LOCATION_TYPE_COLOR: Record<string, string> = {
    imobiliaria: '#4ECDC4',
    loteamento: 'var(--warning)',
    condominio: 'var(--info)',
    empreendimento: 'var(--success)',
}

export default function LocaisPage() {
    const [locations, setLocations] = useState<DutyLocation[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const fetchLocations = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/plantao/locais')
            if (res.ok) {
                const data = await res.json()
                setLocations(data.data || [])
            }
        } catch {
            toast.error('Erro ao carregar locais')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchLocations() }, [fetchLocations])

    return (
        <div style={{ padding: '24px', background: T.base, minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(78,205,196,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={20} color="#4ECDC4" />
                </div>
                <div>
                    <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Locais de Plantão</h1>
                    <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>
                        {locations.filter(l => l.is_active).length} locais ativos
                    </p>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                    <Loader2 size={32} color="#4ECDC4" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : locations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: T.textMuted }}>
                    <Building2 size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p style={{ margin: 0 }}>Nenhum local cadastrado</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                    {locations.map((loc, i) => {
                        const typeColor = LOCATION_TYPE_COLOR[loc.location_type] || '#4ECDC4'
                        const isExpanded = expandedId === loc.id
                        const slots = loc.duty_time_slots?.filter(s => s.is_active) || []

                        return (
                            <motion.div
                                key={loc.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                style={{
                                    background: T.surface, borderRadius: 14,
                                    border: `1px solid ${T.border}`,
                                    overflow: 'hidden',
                                    opacity: loc.is_active ? 1 : 0.6,
                                }}
                            >
                                {/* Card header */}
                                <div style={{
                                    padding: '16px 20px',
                                    borderBottom: `1px solid ${T.border}`,
                                    background: `rgba(78,205,196,0.04)`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <Building2 size={16} color={typeColor} />
                                                <span style={{ color: T.text, fontWeight: 700, fontSize: 15 }}>{loc.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                <span style={{
                                                    fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600,
                                                    background: `color-mix(in srgb, ${typeColor} 15%, transparent)`,
                                                    color: typeColor,
                                                }}>
                                                    {LOCATION_TYPE_LABEL[loc.location_type] || loc.location_type}
                                                </span>
                                                {!loc.is_active && (
                                                    <span style={{
                                                        fontSize: 11, padding: '2px 8px', borderRadius: 10,
                                                        background: 'rgba(239,68,68,0.10)', color: 'var(--error)', fontWeight: 600,
                                                    }}>
                                                        Inativo
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {loc.is_active
                                            ? <CheckCircle size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                                            : <XCircle size={16} color="var(--error)" style={{ flexShrink: 0 }} />
                                        }
                                    </div>
                                </div>

                                {/* Card body */}
                                <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {(loc.address || loc.city) && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: T.textMuted, fontSize: 13 }}>
                                            <MapPin size={13} />
                                            {[loc.address, loc.city, loc.state].filter(Boolean).join(', ')}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: T.textMuted, fontSize: 13 }}>
                                        <Users size={13} />
                                        Capacidade: <strong style={{ color: T.text }}>{loc.max_brokers_per_slot} corretor(es) por turno</strong>
                                    </div>
                                    {loc.agency && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: T.textMuted, fontSize: 13 }}>
                                            <Building2 size={13} />
                                            {loc.agency.name}
                                        </div>
                                    )}

                                    {/* Slots toggle */}
                                    {slots.length > 0 && (
                                        <>
                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : loc.id)}
                                                style={{
                                                    marginTop: 4, padding: '6px 0', borderRadius: 8, cursor: 'pointer',
                                                    background: isExpanded ? 'rgba(78,205,196,0.10)' : T.elevated,
                                                    border: `1px solid ${T.border}`,
                                                    color: isExpanded ? '#4ECDC4' : T.textMuted,
                                                    fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                }}
                                            >
                                                <Clock size={13} />
                                                {isExpanded ? 'Ocultar' : `Ver ${slots.length} turno${slots.length !== 1 ? 's' : ''}`}
                                            </button>

                                            {isExpanded && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {slots.map(slot => (
                                                        <div
                                                            key={slot.id}
                                                            style={{
                                                                padding: '8px 12px', borderRadius: 8,
                                                                background: T.elevated, border: `1px solid ${T.border}`,
                                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                            }}
                                                        >
                                                            <div>
                                                                <div style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>{slot.label}</div>
                                                                <div style={{ color: T.textMuted, fontSize: 12 }}>
                                                                    {slot.start_time?.slice(0,5)}–{slot.end_time?.slice(0,5)}
                                                                </div>
                                                            </div>
                                                            <span style={{ color: T.textMuted, fontSize: 12 }}>
                                                                Máx: {slot.max_brokers}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {loc.notes && (
                                        <p style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', margin: 0 }}>
                                            {loc.notes}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
