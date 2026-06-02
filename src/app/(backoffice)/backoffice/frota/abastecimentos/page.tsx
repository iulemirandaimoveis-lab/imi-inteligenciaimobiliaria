'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Fuel, Plus, Car, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Fueling {
    id: string
    fuel_type: string
    liters: number
    price_per_liter: number
    total_cost?: number
    gas_station?: string
    km_at_fueling?: number
    notes?: string
    fueled_at: string
    usage?: {
        id: string
        vehicle?: { plate: string; brand: string; model: string }
    }
}

const FUEL_LABELS: Record<string, string> = {
    flex: 'Flex', gasolina: 'Gasolina', etanol: 'Etanol',
    diesel: 'Diesel', eletrico: 'Elétrico', hibrido: 'Híbrido',
}

export default function AbastecimentosPage() {
    const [fuelings, setFuelings] = useState<Fueling[]>([])
    const [usages, setUsages] = useState<Array<{ id: string; vehicle?: { plate: string; brand: string; model: string } }>>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({
        usage_id: '',
        fuel_type: 'flex',
        liters: '',
        price_per_liter: '',
        gas_station: '',
        km_at_fueling: '',
        notes: '',
    })

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [fuelRes, usageRes] = await Promise.all([
                fetch('/api/frota/abastecimentos'),
                fetch('/api/frota/usos?status=em_uso'),
            ])
            if (fuelRes.ok) {
                const data = await fuelRes.json()
                setFuelings(data.data || [])
            }
            if (usageRes.ok) {
                const data = await usageRes.json()
                setUsages(data.data || [])
            }
        } catch {
            toast.error('Erro ao carregar abastecimentos')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const handleSubmit = async () => {
        if (!form.usage_id) { toast.error('Selecione o uso do veículo'); return }
        if (!form.liters || !form.price_per_liter) { toast.error('Preencha litros e preço por litro'); return }
        setSubmitting(true)
        try {
            const res = await fetch('/api/frota/abastecimentos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usage_id: form.usage_id,
                    fuel_type: form.fuel_type,
                    liters: parseFloat(form.liters),
                    price_per_liter: parseFloat(form.price_per_liter),
                    gas_station: form.gas_station || null,
                    km_at_fueling: form.km_at_fueling ? parseInt(form.km_at_fueling) : null,
                    notes: form.notes || null,
                }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error)
            }
            toast.success('Abastecimento registrado!')
            setShowModal(false)
            setForm({ usage_id: '', fuel_type: 'flex', liters: '', price_per_liter: '', gas_station: '', km_at_fueling: '', notes: '' })
            fetchData()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Erro ao registrar')
        } finally {
            setSubmitting(false)
        }
    }

    const totalCost = fuelings.reduce((sum, f) => sum + (f.total_cost ?? f.liters * f.price_per_liter), 0)
    const totalLiters = fuelings.reduce((sum, f) => sum + f.liters, 0)

    return (
        <div style={{ padding: '24px', background: T.base, minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(78,205,196,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Fuel size={20} color="#4ECDC4" />
                    </div>
                    <div>
                        <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Abastecimentos</h1>
                        <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>
                            {totalLiters.toFixed(1)} L · R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    style={{
                        padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        background: 'rgba(78,205,196,0.12)', border: '1px solid rgba(78,205,196,0.3)',
                        color: '#4ECDC4', display: 'flex', alignItems: 'center', gap: 6,
                    }}
                >
                    <Plus size={14} /> Registrar Abastecimento
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                    <Loader2 size={32} color="#4ECDC4" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : fuelings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: T.textMuted }}>
                    <Fuel size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p style={{ margin: 0 }}>Nenhum abastecimento registrado</p>
                </div>
            ) : (
                <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: T.elevated }}>
                                    {['Veículo', 'Data', 'Combustível', 'Litros', 'Preço/L', 'Total', 'Posto'].map(h => (
                                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: T.textMuted, fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {fuelings.map((f, i) => (
                                    <motion.tr
                                        key={f.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.03 }}
                                        style={{ borderBottom: `1px solid ${T.border}` }}
                                    >
                                        <td style={{ padding: '10px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                                <Car size={13} color="#4ECDC4" />
                                                <span style={{ color: T.text, fontSize: 13 }}>
                                                    {f.usage?.vehicle
                                                        ? `${f.usage.vehicle.brand} ${f.usage.vehicle.model}`
                                                        : '—'
                                                    }
                                                </span>
                                                {f.usage?.vehicle?.plate && (
                                                    <span style={{ fontSize: 11, color: T.textMuted, fontFamily: 'monospace' }}>
                                                        {f.usage.vehicle.plate}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px 16px', color: T.textMuted, fontSize: 13, whiteSpace: 'nowrap' }}>
                                            {format(parseISO(f.fueled_at), "d 'de' MMM", { locale: ptBR })}
                                        </td>
                                        <td style={{ padding: '10px 16px', color: T.text, fontSize: 13 }}>
                                            {FUEL_LABELS[f.fuel_type] || f.fuel_type}
                                        </td>
                                        <td style={{ padding: '10px 16px', color: T.text, fontSize: 13, fontWeight: 600 }}>
                                            {f.liters.toFixed(2)} L
                                        </td>
                                        <td style={{ padding: '10px 16px', color: T.textMuted, fontSize: 13 }}>
                                            R$ {f.price_per_liter.toFixed(3)}
                                        </td>
                                        <td style={{ padding: '10px 16px', color: '#4ECDC4', fontSize: 13, fontWeight: 700 }}>
                                            R$ {(f.total_cost ?? f.liters * f.price_per_liter).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ padding: '10px 16px', color: T.textMuted, fontSize: 13 }}>
                                            {f.gas_station || '—'}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* New Fueling Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, y: 16 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.92, y: 16 }}
                            onClick={e => e.stopPropagation()}
                            style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: 28, maxWidth: 460, width: '100%' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h2 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: 0 }}>Registrar Abastecimento</h2>
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted }}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div>
                                    <label style={{ color: T.textMuted, fontSize: 12, display: 'block', marginBottom: 6 }}>Uso do Veículo *</label>
                                    <select
                                        value={form.usage_id}
                                        onChange={e => setForm(f => ({ ...f, usage_id: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: T.elevated, border: `1px solid ${T.border}`, color: T.text, fontSize: 14, outline: 'none' }}
                                    >
                                        <option value="">Selecione o uso em andamento</option>
                                        {usages.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.vehicle ? `${u.vehicle.brand} ${u.vehicle.model} (${u.vehicle.plate})` : u.id.slice(0, 8)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div>
                                        <label style={{ color: T.textMuted, fontSize: 12, display: 'block', marginBottom: 6 }}>Litros *</label>
                                        <input type="number" step="0.01" value={form.liters} onChange={e => setForm(f => ({ ...f, liters: e.target.value }))}
                                            placeholder="Ex: 40.5"
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: T.elevated, border: `1px solid ${T.border}`, color: T.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ color: T.textMuted, fontSize: 12, display: 'block', marginBottom: 6 }}>Preço/Litro *</label>
                                        <input type="number" step="0.001" value={form.price_per_liter} onChange={e => setForm(f => ({ ...f, price_per_liter: e.target.value }))}
                                            placeholder="Ex: 5.899"
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: T.elevated, border: `1px solid ${T.border}`, color: T.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                </div>

                                {form.liters && form.price_per_liter && (
                                    <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(78,205,196,0.08)', border: '1px solid rgba(78,205,196,0.2)', color: '#4ECDC4', fontSize: 13, fontWeight: 600 }}>
                                        Total: R$ {(parseFloat(form.liters) * parseFloat(form.price_per_liter)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                )}

                                <div>
                                    <label style={{ color: T.textMuted, fontSize: 12, display: 'block', marginBottom: 6 }}>Combustível</label>
                                    <select value={form.fuel_type} onChange={e => setForm(f => ({ ...f, fuel_type: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: T.elevated, border: `1px solid ${T.border}`, color: T.text, fontSize: 14, outline: 'none' }}>
                                        {Object.entries(FUEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div>
                                        <label style={{ color: T.textMuted, fontSize: 12, display: 'block', marginBottom: 6 }}>Posto</label>
                                        <input value={form.gas_station} onChange={e => setForm(f => ({ ...f, gas_station: e.target.value }))}
                                            placeholder="Nome do posto"
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: T.elevated, border: `1px solid ${T.border}`, color: T.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ color: T.textMuted, fontSize: 12, display: 'block', marginBottom: 6 }}>KM no Abastecimento</label>
                                        <input type="number" value={form.km_at_fueling} onChange={e => setForm(f => ({ ...f, km_at_fueling: e.target.value }))}
                                            placeholder="Ex: 45000"
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: T.elevated, border: `1px solid ${T.border}`, color: T.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer', background: 'transparent', border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 14 }}>
                                    Cancelar
                                </button>
                                <button onClick={handleSubmit} disabled={submitting} style={{ flex: 2, padding: '10px 0', borderRadius: 8, cursor: submitting ? 'not-allowed' : 'pointer', background: 'rgba(78,205,196,0.15)', border: '1px solid rgba(78,205,196,0.4)', color: '#4ECDC4', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Fuel size={16} />}
                                    {submitting ? 'Salvando...' : 'Registrar'}
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
