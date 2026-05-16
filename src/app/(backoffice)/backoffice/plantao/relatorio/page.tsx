'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, Loader2, CalendarDays, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ReportSummary {
    total_schedules: number
    confirmed: number
    completed: number
    cancelled: number
    no_show: number
    swapped: number
    attendance_rate?: number
    no_show_rate?: number
}

interface ReportRow {
    broker_name?: string
    broker_id?: string
    location_name?: string
    schedule_date?: string
    start_time?: string
    end_time?: string
    status?: string
    time_slot_label?: string
}

interface ReportData {
    summary?: ReportSummary
    data?: ReportRow[]
    by_broker?: Array<{ broker_name: string; total: number; completed: number; no_show: number }>
    by_location?: Array<{ location_name: string; total: number; fill_rate: number }>
}

export default function PlantaoRelatorioPage() {
    const [report, setReport] = useState<ReportData | null>(null)
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
            const res = await fetch(`/api/plantao/relatorio?${params}`)
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

    const summary = report?.summary
    const byBroker = report?.by_broker || []
    const byLocation = report?.by_location || []

    const kpis = summary ? [
        { label: 'Total de Escalas', value: summary.total_schedules, color: '#4ECDC4', icon: CalendarDays },
        { label: 'Concluídos', value: summary.completed, color: 'var(--success)', icon: CheckCircle },
        { label: 'Faltas', value: summary.no_show, color: 'var(--error)', icon: XCircle },
        { label: 'Cancelados', value: summary.cancelled, color: 'var(--warning)', icon: AlertCircle },
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
                        <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Relatório de Plantão</h1>
                        <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>Métricas e histórico de escalas</p>
                    </div>
                </div>

                {/* Date filter */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        style={{
                            padding: '7px 10px', borderRadius: 8, fontSize: 13,
                            background: T.surface, border: `1px solid ${T.border}`,
                            color: T.text, outline: 'none',
                        }}
                    />
                    <span style={{ color: T.textMuted, fontSize: 13 }}>até</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        style={{
                            padding: '7px 10px', borderRadius: 8, fontSize: 13,
                            background: T.surface, border: `1px solid ${T.border}`,
                            color: T.text, outline: 'none',
                        }}
                    />
                    <button
                        onClick={fetchReport}
                        style={{
                            padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            background: 'rgba(78,205,196,0.15)', border: '1px solid rgba(78,205,196,0.4)',
                            color: '#4ECDC4',
                        }}
                    >
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
                                    <motion.div
                                        key={kpi.label}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        style={{
                                            background: T.surface, borderRadius: 14,
                                            border: `1px solid ${T.border}`, padding: '18px 20px',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                            <Icon size={15} color={kpi.color} />
                                            <span style={{ color: T.textMuted, fontSize: 12 }}>{kpi.label}</span>
                                        </div>
                                        <div style={{ color: kpi.color, fontSize: 28, fontWeight: 700 }}>
                                            {kpi.value ?? '—'}
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}

                    {/* Rates */}
                    {summary && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: '18px 20px' }}>
                                <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 6 }}>Taxa de Presença</div>
                                <div style={{ color: 'var(--success)', fontSize: 26, fontWeight: 700 }}>
                                    {summary.attendance_rate != null ? `${summary.attendance_rate.toFixed(1)}%` : '—'}
                                </div>
                                <div style={{ marginTop: 8, height: 6, borderRadius: 4, background: T.border }}>
                                    <div style={{ height: '100%', borderRadius: 4, background: 'var(--success)', width: `${summary.attendance_rate ?? 0}%`, transition: 'width 0.5s' }} />
                                </div>
                            </div>
                            <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: '18px 20px' }}>
                                <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 6 }}>Taxa de Falta</div>
                                <div style={{ color: 'var(--error)', fontSize: 26, fontWeight: 700 }}>
                                    {summary.no_show_rate != null ? `${summary.no_show_rate.toFixed(1)}%` : '—'}
                                </div>
                                <div style={{ marginTop: 8, height: 6, borderRadius: 4, background: T.border }}>
                                    <div style={{ height: '100%', borderRadius: 4, background: 'var(--error)', width: `${summary.no_show_rate ?? 0}%`, transition: 'width 0.5s' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* By Broker */}
                    {byBroker.length > 0 && (
                        <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Users size={15} color="#4ECDC4" />
                                <span style={{ color: T.text, fontWeight: 700, fontSize: 14 }}>Por Corretor</span>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: T.elevated }}>
                                            {['Corretor', 'Total', 'Concluídos', 'Faltas'].map(h => (
                                                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: T.textMuted, fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {byBroker.map((row, i) => (
                                            <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                                                <td style={{ padding: '10px 16px', color: T.text, fontSize: 13 }}>{row.broker_name}</td>
                                                <td style={{ padding: '10px 16px', color: T.text, fontSize: 13, fontWeight: 600 }}>{row.total}</td>
                                                <td style={{ padding: '10px 16px', color: 'var(--success)', fontSize: 13 }}>{row.completed}</td>
                                                <td style={{ padding: '10px 16px', color: 'var(--error)', fontSize: 13 }}>{row.no_show}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* By Location */}
                    {byLocation.length > 0 && (
                        <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CalendarDays size={15} color="#4ECDC4" />
                                <span style={{ color: T.text, fontWeight: 700, fontSize: 14 }}>Por Local</span>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: T.elevated }}>
                                            {['Local', 'Total de Escalas', 'Taxa de Preenchimento'].map(h => (
                                                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: T.textMuted, fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {byLocation.map((row, i) => (
                                            <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                                                <td style={{ padding: '10px 16px', color: T.text, fontSize: 13 }}>{row.location_name}</td>
                                                <td style={{ padding: '10px 16px', color: T.text, fontSize: 13, fontWeight: 600 }}>{row.total}</td>
                                                <td style={{ padding: '10px 16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div style={{ flex: 1, height: 6, borderRadius: 4, background: T.border }}>
                                                            <div style={{
                                                                height: '100%', borderRadius: 4, background: '#4ECDC4',
                                                                width: `${row.fill_rate ?? 0}%`, transition: 'width 0.5s',
                                                            }} />
                                                        </div>
                                                        <span style={{ color: '#4ECDC4', fontSize: 12, fontWeight: 600, minWidth: 36 }}>
                                                            {row.fill_rate?.toFixed(0) ?? 0}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {!summary && !loading && (
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
