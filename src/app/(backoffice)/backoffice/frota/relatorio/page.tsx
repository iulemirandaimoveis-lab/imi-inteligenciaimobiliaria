'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, Car, Fuel, AlertTriangle, Key, Users, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'

interface FleetReportData {
    summary?: {
        total_vehicles: number
        total_usages: number
        total_km_driven: number
        total_fuel_cost: number
        total_maintenance_cost: number
        avg_km_per_usage?: number
    }
    by_vehicle?: Array<{
        vehicle_plate: string
        vehicle_model: string
        total_usages: number
        total_km: number
        fuel_cost: number
        maintenance_cost: number
        status: string
    }>
    by_broker?: Array<{
        broker_name: string
        total_usages: number
        total_km: number
        fuel_cost: number
    }>
}

export default function FrotaRelatorioPage() {
    const [report, setReport] = useState<FleetReportData | null>(null)
    const [loading, setLoading] = useState(true)
    const [startDate, setStartDate] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() - 30)
        return d.toISOString().slice(0, 10)
    })
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))

    const fetchReport = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ start_date: startDate, end_date: endDate })
            const res = await fetch(`/api/frota/relatorio?${params}`)
            if (res.ok) {
                const data = await res.json()
                setReport(data)
            }
        } catch {
            toast.error('Erro ao carregar relatório')
        } finally {
            setLoading(false)
        }
    }, [startDate, endDate])

    useEffect(() => { fetchReport() }, [fetchReport])

    const s = report?.summary
    const kpis = s ? [
        { label: 'Veículos',      value: s.total_vehicles,   color: '#4ECDC4',          icon: Car          },
        { label: 'Utilizações',   value: s.total_usages,     color: 'var(--info)',       icon: Key          },
        { label: 'KM Rodados',    value: s.total_km_driven ? `${s.total_km_driven.toLocaleString('pt-BR')} km` : '0', color: 'var(--success)', icon: BarChart2 },
        { label: 'Custo Total',   value: `R$ ${((s.total_fuel_cost || 0) + (s.total_maintenance_cost || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'var(--warning)', icon: AlertTriangle },
    ] : []

    return (
        <div style={{ padding: '24px', background: T.base, minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(78,205,196,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BarChart2 size={20} color="#4ECDC4" />
                    </div>
                    <div>
                        <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Relatório de Frota</h1>
                        <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>Análise de uso, custos e performance</p>
                    </div>
                </div>

                {/* Date filter */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                        style={{ padding: '7px 10px', borderRadius: 8, fontSize: 13, background: T.surface, border: `1px solid ${T.border}`, color: T.text, outline: 'none' }} />
                    <span style={{ color: T.textMuted, fontSize: 13 }}>até</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                        style={{ padding: '7px 10px', borderRadius: 8, fontSize: 13, background: T.surface, border: `1px solid ${T.border}`, color: T.text, outline: 'none' }} />
                    <button onClick={fetchReport}
                        style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'rgba(78,205,196,0.15)', border: '1px solid rgba(78,205,196,0.4)', color: '#4ECDC4' }}>
                        Filtrar
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                    <Loader2 size={32} color="#4ECDC4" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* KPIs */}
                    {kpis.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
                            {kpis.map((kpi, i) => {
                                const Icon = kpi.icon
                                return (
                                    <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                        style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: '18px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                            <Icon size={15} color={kpi.color} />
                                            <span style={{ color: T.textMuted, fontSize: 12 }}>{kpi.label}</span>
                                        </div>
                                        <div style={{ color: kpi.color, fontSize: 24, fontWeight: 700 }}>{kpi.value}</div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}

                    {/* Cost breakdown */}
                    {s && (s.total_fuel_cost > 0 || s.total_maintenance_cost > 0) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: '18px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <Fuel size={14} color="#4ECDC4" />
                                    <span style={{ color: T.textMuted, fontSize: 12 }}>Custo com Combustível</span>
                                </div>
                                <div style={{ color: '#4ECDC4', fontSize: 22, fontWeight: 700 }}>
                                    R$ {(s.total_fuel_cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                            <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: '18px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <AlertTriangle size={14} color="var(--warning)" />
                                    <span style={{ color: T.textMuted, fontSize: 12 }}>Custo com Manutenção</span>
                                </div>
                                <div style={{ color: 'var(--warning)', fontSize: 22, fontWeight: 700 }}>
                                    R$ {(s.total_maintenance_cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* By Vehicle */}
                    {(report?.by_vehicle?.length ?? 0) > 0 && (
                        <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Car size={15} color="#4ECDC4" />
                                <span style={{ color: T.text, fontWeight: 700, fontSize: 14 }}>Por Veículo</span>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: T.elevated }}>
                                            {['Veículo', 'Usos', 'KM Total', 'Combustível', 'Manutenção'].map(h => (
                                                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: T.textMuted, fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report!.by_vehicle!.map((row, i) => (
                                            <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                                                <td style={{ padding: '10px 16px' }}>
                                                    <div style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>{row.vehicle_model}</div>
                                                    <div style={{ color: T.textMuted, fontSize: 11, fontFamily: 'monospace' }}>{row.vehicle_plate}</div>
                                                </td>
                                                <td style={{ padding: '10px 16px', color: T.text, fontSize: 13 }}>{row.total_usages}</td>
                                                <td style={{ padding: '10px 16px', color: '#4ECDC4', fontSize: 13, fontWeight: 600 }}>{row.total_km?.toLocaleString('pt-BR')} km</td>
                                                <td style={{ padding: '10px 16px', color: T.text, fontSize: 13 }}>R$ {(row.fuel_cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                <td style={{ padding: '10px 16px', color: T.text, fontSize: 13 }}>R$ {(row.maintenance_cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* By Broker */}
                    {(report?.by_broker?.length ?? 0) > 0 && (
                        <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Users size={15} color="#4ECDC4" />
                                <span style={{ color: T.text, fontWeight: 700, fontSize: 14 }}>Por Corretor</span>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: T.elevated }}>
                                            {['Corretor', 'Usos', 'KM Total', 'Combustível'].map(h => (
                                                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: T.textMuted, fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report!.by_broker!.map((row, i) => (
                                            <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                                                <td style={{ padding: '10px 16px', color: T.text, fontSize: 13, fontWeight: 600 }}>{row.broker_name}</td>
                                                <td style={{ padding: '10px 16px', color: T.text, fontSize: 13 }}>{row.total_usages}</td>
                                                <td style={{ padding: '10px 16px', color: '#4ECDC4', fontSize: 13, fontWeight: 600 }}>{row.total_km?.toLocaleString('pt-BR')} km</td>
                                                <td style={{ padding: '10px 16px', color: T.text, fontSize: 13 }}>R$ {(row.fuel_cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {!s && (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: T.textMuted }}>
                            <BarChart2 size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                            <p style={{ margin: 0 }}>Nenhum dado para o período selecionado</p>
                        </div>
                    )}
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
