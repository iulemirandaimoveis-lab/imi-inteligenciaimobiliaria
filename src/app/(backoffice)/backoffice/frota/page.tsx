'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Car, Plus, Search, Fuel, AlertTriangle, CheckCircle,
    Clock, XCircle, Settings, Key, BarChart2, Loader2,
    ChevronRight, MapPin, User,
} from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type VehicleStatus = 'disponivel' | 'em_uso' | 'manutencao' | 'bloqueado' | 'sinistrado' | 'reserva'

interface FleetVehicle {
    id: string
    plate: string
    brand: string
    model: string
    year: number
    color?: string
    fuel_type: string
    km_current: number
    status: VehicleStatus
    insurance_expiry?: string
    ipva_expiry?: string
    next_revision_km?: number
    notes?: string
    // joined
    active_usage?: { broker_name: string; pickup_at: string; purpose: string }
}

const STATUS_CFG: Record<VehicleStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
    disponivel: { label: 'Disponível',    color: 'var(--success)', bg: 'rgba(34,197,94,0.12)',   icon: CheckCircle  },
    em_uso:     { label: 'Em Uso',        color: 'var(--warning)', bg: 'rgba(251,191,36,0.12)',  icon: Key          },
    manutencao: { label: 'Manutenção',    color: 'var(--info)',    bg: 'rgba(96,165,250,0.12)',  icon: Settings     },
    bloqueado:  { label: 'Bloqueado',     color: 'var(--error)',   bg: 'rgba(239,68,68,0.12)',   icon: XCircle      },
    sinistrado: { label: 'Sinistrado',    color: 'var(--error)',   bg: 'rgba(239,68,68,0.12)',   icon: AlertTriangle },
    reserva:    { label: 'Reserva',       color: 'var(--info)',    bg: 'rgba(96,165,250,0.12)',  icon: Clock        },
}

const FUEL_LABELS: Record<string, string> = {
    flex: 'Flex', gasolina: 'Gasolina', etanol: 'Etanol',
    diesel: 'Diesel', eletrico: 'Elétrico', hibrido: 'Híbrido',
}

const PURPOSE_LABELS: Record<string, string> = {
    visita_cliente: 'Visita ao Cliente', plantao: 'Plantão', captacao: 'Captação',
    vistoria: 'Vistoria', documentacao: 'Documentação', reuniao: 'Reunião',
    marketing: 'Marketing', suporte_interno: 'Suporte Interno', outro: 'Outro',
}

function VehicleCard({ vehicle, onRequest, onDetails }: {
    vehicle: FleetVehicle
    onRequest: (v: FleetVehicle) => void
    onDetails: (v: FleetVehicle) => void
}) {
    const cfg = STATUS_CFG[vehicle.status]
    const Icon = cfg.icon

    const isAlertInsurance = vehicle.insurance_expiry &&
        new Date(vehicle.insurance_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const isAlertIpva = vehicle.ipva_expiry &&
        new Date(vehicle.ipva_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: T.surface, borderRadius: 14,
                border: `1px solid ${T.border}`, padding: '20px',
                cursor: 'pointer', position: 'relative', overflow: 'hidden',
            }}
        >
            {/* Status badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                    <div style={{ color: T.text, fontWeight: 700, fontSize: 16 }}>
                        {vehicle.brand} {vehicle.model}
                    </div>
                    <div style={{ color: T.textMuted, fontSize: 13 }}>
                        {vehicle.plate} · {vehicle.year} · {FUEL_LABELS[vehicle.fuel_type] || vehicle.fuel_type}
                    </div>
                </div>
                <div style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: cfg.bg, color: cfg.color,
                    display: 'flex', alignItems: 'center', gap: 5,
                }}>
                    <Icon size={11} />
                    {cfg.label}
                </div>
            </div>

            {/* KM */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                <div>
                    <div style={{ color: T.textMuted, fontSize: 11, marginBottom: 2 }}>KM Atual</div>
                    <div style={{ color: T.text, fontSize: 15, fontWeight: 700 }}>
                        {vehicle.km_current.toLocaleString('pt-BR')} km
                    </div>
                </div>
                {vehicle.next_revision_km && (
                    <div>
                        <div style={{ color: T.textMuted, fontSize: 11, marginBottom: 2 }}>Próxima Revisão</div>
                        <div style={{ color: Math.abs(vehicle.next_revision_km - vehicle.km_current) < 500 ? 'var(--warning)' : T.text, fontSize: 15, fontWeight: 700 }}>
                            {vehicle.next_revision_km.toLocaleString('pt-BR')} km
                        </div>
                    </div>
                )}
            </div>

            {/* Active usage info */}
            {vehicle.status === 'em_uso' && vehicle.active_usage && (
                <div style={{
                    padding: '8px 12px', borderRadius: 8, marginBottom: 12,
                    background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={12} color="var(--warning)" />
                        <span style={{ color: 'var(--warning)', fontSize: 12, fontWeight: 600 }}>
                            {vehicle.active_usage.broker_name}
                        </span>
                        <span style={{ color: T.textMuted, fontSize: 11 }}>
                            · {PURPOSE_LABELS[vehicle.active_usage.purpose] || vehicle.active_usage.purpose}
                        </span>
                    </div>
                    <div style={{ color: T.textMuted, fontSize: 11, marginTop: 3 }}>
                        Retirado {format(new Date(vehicle.active_usage.pickup_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </div>
                </div>
            )}

            {/* Alerts */}
            {(isAlertInsurance || isAlertIpva) && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    {isAlertInsurance && (
                        <div style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: 'var(--error)', fontSize: 11 }}>
                            <AlertTriangle size={10} style={{ marginRight: 4 }} />
                            Seguro vence {format(new Date(vehicle.insurance_expiry!), 'dd/MM/yyyy')}
                        </div>
                    )}
                    {isAlertIpva && (
                        <div style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: 'var(--error)', fontSize: 11 }}>
                            <AlertTriangle size={10} style={{ marginRight: 4 }} />
                            IPVA vence {format(new Date(vehicle.ipva_expiry!), 'dd/MM/yyyy')}
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
                {vehicle.status === 'disponivel' && (
                    <button
                        onClick={() => onRequest(vehicle)}
                        style={{
                            flex: 1, padding: '8px 0', borderRadius: 8,
                            background: 'rgba(78,205,196,0.12)', border: '1px solid rgba(78,205,196,0.3)',
                            color: '#4ECDC4', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                    >
                        <Key size={14} /> Solicitar Uso
                    </button>
                )}
                <button
                    onClick={() => onDetails(vehicle)}
                    style={{
                        flex: vehicle.status === 'disponivel' ? 0 : 1,
                        padding: '8px 14px', borderRadius: 8,
                        background: T.surface, border: `1px solid ${T.border}`,
                        color: T.textMuted, cursor: 'pointer', fontSize: 13,
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}
                >
                    <ChevronRight size={14} /> Detalhes
                </button>
            </div>
        </motion.div>
    )
}

export default function FrotaPage() {
    const [vehicles, setVehicles] = useState<FleetVehicle[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [showRequestModal, setShowRequestModal] = useState(false)
    const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicle | null>(null)
    const [requestForm, setRequestForm] = useState({
        purpose: 'visita_cliente',
        purpose_description: '',
        destination: '',
        estimated_return: '',
    })
    const [submitting, setSubmitting] = useState(false)

    const fetchVehicles = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (statusFilter !== 'all') params.set('status', statusFilter)
            if (search) params.set('search', search)
            const res = await fetch(`/api/frota/veiculos?${params}`)
            if (res.ok) {
                const data = await res.json()
                setVehicles(data.data || [])
            }
        } catch {
            toast.error('Erro ao carregar veículos')
        } finally {
            setLoading(false)
        }
    }, [statusFilter, search])

    useEffect(() => { fetchVehicles() }, [fetchVehicles])

    const handleRequest = (vehicle: FleetVehicle) => {
        setSelectedVehicle(vehicle)
        setShowRequestModal(true)
    }

    const handleDetails = (vehicle: FleetVehicle) => {
        // Navigate to usage history
        window.location.href = `/backoffice/frota/meu-uso?vehicle_id=${vehicle.id}`
    }

    const submitRequest = async () => {
        if (!selectedVehicle) return
        if (!requestForm.purpose_description.trim()) {
            toast.error('Descreva o objetivo da utilização')
            return
        }
        setSubmitting(true)
        try {
            const res = await fetch('/api/frota/usos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vehicle_id: selectedVehicle.id,
                    ...requestForm,
                    estimated_return: requestForm.estimated_return || undefined,
                }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro ao solicitar veículo')
            }
            toast.success('Solicitação enviada! Aguarde aprovação.')
            setShowRequestModal(false)
            setRequestForm({ purpose: 'visita_cliente', purpose_description: '', destination: '', estimated_return: '' })
            fetchVehicles()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Erro ao solicitar')
        } finally {
            setSubmitting(false)
        }
    }

    const counts = {
        all: vehicles.length,
        disponivel: vehicles.filter(v => v.status === 'disponivel').length,
        em_uso: vehicles.filter(v => v.status === 'em_uso').length,
        manutencao: vehicles.filter(v => v.status === 'manutencao').length,
    }

    const filterTabs = [
        { id: 'all', label: 'Todos', count: counts.all },
        { id: 'disponivel', label: 'Disponíveis', count: counts.disponivel },
        { id: 'em_uso', label: 'Em Uso', count: counts.em_uso },
        { id: 'manutencao', label: 'Manutenção', count: counts.manutencao },
    ]

    return (
        <div style={{ padding: '24px', background: T.base, minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(78,205,196,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Car size={20} color="#4ECDC4" />
                    </div>
                    <div>
                        <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Gestão de Frota</h1>
                        <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>
                            {counts.disponivel} disponível · {counts.em_uso} em uso · {counts.manutencao} em manutenção
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <a
                        href="/backoffice/frota/relatorio"
                        style={{
                            padding: '8px 16px', borderRadius: 8,
                            background: T.surface, border: `1px solid ${T.border}`,
                            color: T.textMuted, textDecoration: 'none', fontSize: 13,
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}
                    >
                        <BarChart2 size={14} /> Relatório
                    </a>
                    <a
                        href="/backoffice/frota/meu-uso"
                        style={{
                            padding: '8px 16px', borderRadius: 8,
                            background: 'rgba(78,205,196,0.12)', border: '1px solid rgba(78,205,196,0.3)',
                            color: '#4ECDC4', textDecoration: 'none', fontSize: 13, fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}
                    >
                        <Key size={14} /> Meu Uso
                    </a>
                </div>
            </div>

            {/* Search + filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 220px' }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por placa, modelo..."
                        style={{
                            width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
                            color: T.text, fontSize: 13, outline: 'none',
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    {filterTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            style={{
                                padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                background: statusFilter === tab.id ? 'rgba(78,205,196,0.15)' : T.surface,
                                color: statusFilter === tab.id ? '#4ECDC4' : T.textMuted,
                                border: statusFilter === tab.id ? '1px solid rgba(78,205,196,0.4)' : `1px solid ${T.border}`,
                            }}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', fontSize: 10 }}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Vehicle grid */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                    <Loader2 size={32} color="#4ECDC4" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                    {vehicles.map(vehicle => (
                        <VehicleCard
                            key={vehicle.id}
                            vehicle={vehicle}
                            onRequest={handleRequest}
                            onDetails={handleDetails}
                        />
                    ))}
                    {vehicles.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: T.textMuted }}>
                            <Car size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                            <p>Nenhum veículo encontrado</p>
                        </div>
                    )}
                </div>
            )}

            {/* Request Usage Modal */}
            <AnimatePresence>
                {showRequestModal && selectedVehicle && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1000, padding: 16,
                        }}
                        onClick={() => setShowRequestModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: T.surface, borderRadius: 16,
                                border: `1px solid ${T.border}`, padding: 28,
                                maxWidth: 480, width: '100%',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h2 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: 0 }}>
                                    Solicitar Veículo
                                </h2>
                                <button onClick={() => setShowRequestModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted }}>
                                    ✕
                                </button>
                            </div>

                            {/* Vehicle summary */}
                            <div style={{
                                padding: '12px 16px', borderRadius: 10,
                                background: 'rgba(78,205,196,0.07)', border: '1px solid rgba(78,205,196,0.15)',
                                marginBottom: 20,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Car size={18} color="#4ECDC4" />
                                    <div>
                                        <div style={{ color: T.text, fontWeight: 700 }}>
                                            {selectedVehicle.brand} {selectedVehicle.model} {selectedVehicle.year}
                                        </div>
                                        <div style={{ color: T.textMuted, fontSize: 13 }}>
                                            {selectedVehicle.plate} · {FUEL_LABELS[selectedVehicle.fuel_type]}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ color: T.textMuted, fontSize: 12, display: 'block', marginBottom: 6 }}>
                                        Objetivo da Utilização *
                                    </label>
                                    <select
                                        value={requestForm.purpose}
                                        onChange={e => setRequestForm(f => ({ ...f, purpose: e.target.value }))}
                                        style={{
                                            width: '100%', padding: '8px 12px', borderRadius: 8,
                                            background: T.surface, border: `1px solid ${T.border}`,
                                            color: T.text, fontSize: 14, outline: 'none',
                                        }}
                                    >
                                        {Object.entries(PURPOSE_LABELS).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ color: T.textMuted, fontSize: 12, display: 'block', marginBottom: 6 }}>
                                        Descrição Detalhada *
                                    </label>
                                    <textarea
                                        value={requestForm.purpose_description}
                                        onChange={e => setRequestForm(f => ({ ...f, purpose_description: e.target.value }))}
                                        placeholder="Descreva o motivo profissional desta utilização..."
                                        rows={3}
                                        style={{
                                            width: '100%', padding: '8px 12px', borderRadius: 8,
                                            background: T.surface, border: `1px solid ${T.border}`,
                                            color: T.text, fontSize: 14, resize: 'vertical', outline: 'none',
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ color: T.textMuted, fontSize: 12, display: 'block', marginBottom: 6 }}>
                                        Destino
                                    </label>
                                    <input
                                        value={requestForm.destination}
                                        onChange={e => setRequestForm(f => ({ ...f, destination: e.target.value }))}
                                        placeholder="Ex: Bairro Boa Viagem, Recife"
                                        style={{
                                            width: '100%', padding: '8px 12px', borderRadius: 8,
                                            background: T.surface, border: `1px solid ${T.border}`,
                                            color: T.text, fontSize: 14, outline: 'none',
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ color: T.textMuted, fontSize: 12, display: 'block', marginBottom: 6 }}>
                                        Previsão de Retorno
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={requestForm.estimated_return}
                                        onChange={e => setRequestForm(f => ({ ...f, estimated_return: e.target.value }))}
                                        style={{
                                            width: '100%', padding: '8px 12px', borderRadius: 8,
                                            background: T.surface, border: `1px solid ${T.border}`,
                                            color: T.text, fontSize: 14, outline: 'none',
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                                <button
                                    onClick={() => setShowRequestModal(false)}
                                    style={{
                                        flex: 1, padding: '10px 0', borderRadius: 8,
                                        background: 'transparent', border: `1px solid ${T.border}`,
                                        color: T.textMuted, cursor: 'pointer', fontSize: 14,
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={submitRequest}
                                    disabled={submitting}
                                    style={{
                                        flex: 2, padding: '10px 0', borderRadius: 8,
                                        background: 'rgba(78,205,196,0.15)', border: '1px solid rgba(78,205,196,0.4)',
                                        color: '#4ECDC4', cursor: submitting ? 'not-allowed' : 'pointer',
                                        fontSize: 14, fontWeight: 600,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    }}
                                >
                                    {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Key size={16} />}
                                    {submitting ? 'Enviando...' : 'Solicitar Veículo'}
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
