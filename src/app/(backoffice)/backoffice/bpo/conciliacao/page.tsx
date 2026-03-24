'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Loader2, RefreshCw, Check, X, ChevronDown,
    AlertTriangle, CheckCircle2, Clock, Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { KPICard } from '@/app/(backoffice)/components/ui/KPICard'
import { T } from '@/app/(backoffice)/lib/theme'

interface Conciliacao {
    id: string
    empresa_id: string
    transacao_interna_id: string | null
    transacao_banco_id: string | null
    valor_interno: number
    valor_banco: number
    data_interno: string | null
    data_banco: string | null
    score_match: number
    status: string
    metodo_match: string | null
    created_at: string
    bpo_transacoes?: { descricao: string; valor: number; tipo: string } | null
}

interface Stats {
    total: number
    pendente: number
    aprovado: number
    auto_aprovado: number
    rejeitado: number
}

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const SCORE_COLORS = {
    high: { color: T.success, bg: T.successBg, label: 'Alta' },
    medium: { color: T.warning, bg: T.warningBg, label: 'Média' },
    low: { color: T.error, bg: T.errorBg, label: 'Baixa' },
}

function getScoreLevel(score: number) {
    if (score >= 80) return SCORE_COLORS.high
    if (score >= 50) return SCORE_COLORS.medium
    return SCORE_COLORS.low
}

const STATUS_CONFIG: Record<string, { icon: typeof Check; color: string; label: string }> = {
    pendente: { icon: Clock, color: T.warning, label: 'Pendente' },
    aprovado: { icon: CheckCircle2, color: T.success, label: 'Aprovado' },
    auto_aprovado: { icon: Zap, color: T.info, label: 'Auto' },
    rejeitado: { icon: X, color: T.error, label: 'Rejeitado' },
}

export default function BPOConciliacaoPage() {
    const [data, setData] = useState<Conciliacao[]>([])
    const [stats, setStats] = useState<Stats>({ total: 0, pendente: 0, aprovado: 0, auto_aprovado: 0, rejeitado: 0 })
    const [loading, setLoading] = useState(true)
    const [reconciling, setReconciling] = useState(false)
    const [statusFilter, setStatusFilter] = useState('pendente')
    const [minScore, setMinScore] = useState(0)

    const fetchData = async () => {
        try {
            const params = new URLSearchParams()
            if (statusFilter) params.set('status', statusFilter)
            if (minScore > 0) params.set('min_score', String(minScore))

            const res = await fetch(`/api/bpo/conciliacao?${params}`)
            if (res.ok) {
                const json = await res.json()
                setData(json.data || [])
                setStats(json.stats || { total: 0, pendente: 0, aprovado: 0, auto_aprovado: 0, rejeitado: 0 })
            }
        } catch {
            toast.error('Erro ao carregar conciliações')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [statusFilter, minScore])

    const handleAutoReconcile = async () => {
        setReconciling(true)
        try {
            const res = await fetch('/api/bpo/conciliacao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empresa_id: data[0]?.empresa_id }),
            })
            if (res.ok) {
                const json = await res.json()
                toast.success(`Conciliação automática: ${json.auto_approved || 0} aprovada(s), ${json.pending || 0} pendente(s)`)
                fetchData()
            } else {
                toast.error('Erro na conciliação automática')
            }
        } catch {
            toast.error('Erro de conexão')
        } finally {
            setReconciling(false)
        }
    }

    const handleUpdateStatus = async (conciliacaoId: string, newStatus: string) => {
        try {
            const res = await fetch('/api/bpo/conciliacao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_status', conciliacao_id: conciliacaoId, new_status: newStatus }),
            })
            if (res.ok) {
                toast.success(`Conciliação ${newStatus === 'aprovado' ? 'aprovada' : 'rejeitada'}`)
                fetchData()
            }
        } catch {
            toast.error('Erro ao atualizar status')
        }
    }

    const totalResolved = stats.aprovado + stats.auto_aprovado
    const progressPct = stats.total > 0 ? Math.round((totalResolved / stats.total) * 100) : 0

    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
            <PageIntelHeader
                moduleLabel="BPO . FINANCEIRO"
                title="Conciliação Bancária"
                subtitle={`${stats.total} transações · ${progressPct}% conciliado`}
                breadcrumbs={[
                    { label: 'Backoffice', href: '/backoffice' },
                    { label: 'BPO Financeiro', href: '/backoffice/bpo' },
                    { label: 'Conciliação' },
                ]}
                actions={
                    <button
                        onClick={handleAutoReconcile}
                        disabled={reconciling}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', borderRadius: 3,
                            background: T.accent, border: 'none',
                            color: '#050B14', fontSize: 13, fontWeight: 600,
                            cursor: reconciling ? 'not-allowed' : 'pointer',
                            opacity: reconciling ? 0.6 : 1,
                        }}
                    >
                        <Zap size={14} className={reconciling ? 'animate-pulse' : ''} />
                        Auto-Conciliar
                    </button>
                }
            />

            {/* Progress Bar */}
            <div style={{
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: '16px 20px', marginBottom: 20,
            }}>
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 10,
                }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>
                        Progresso da Conciliação
                    </span>
                    <span style={{
                        fontSize: 20, fontWeight: 700, color: T.accent,
                        fontFamily: 'var(--font-mono)',
                    }}>
                        {progressPct}%
                    </span>
                </div>
                <div style={{
                    height: 8, borderRadius: 4, background: T.borderLight,
                    overflow: 'hidden',
                }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{
                            height: '100%', borderRadius: 4,
                            background: progressPct >= 80
                                ? T.success
                                : progressPct >= 50 ? T.warning : T.error,
                        }}
                    />
                </div>
                <div style={{
                    display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: T.textMuted,
                }}>
                    <span>{totalResolved} conciliada(s)</span>
                    <span>{stats.pendente} pendente(s)</span>
                    <span>{stats.rejeitado} rejeitada(s)</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12, marginBottom: 20,
            }}>
                <KPICard label="Total" value={stats.total} icon={<RefreshCw size={16} />} accent="gold" size="sm" />
                <KPICard label="Pendentes" value={stats.pendente} icon={<Clock size={16} />} accent="warning" size="sm" />
                <KPICard label="Aprovadas" value={stats.aprovado + stats.auto_aprovado} icon={<CheckCircle2 size={16} />} accent="success" size="sm" />
                <KPICard label="Rejeitadas" value={stats.rejeitado} icon={<X size={16} />} accent="error" size="sm" />
            </div>

            {/* Filters */}
            <div style={{
                display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center',
            }}>
                <div style={{ position: 'relative' }}>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{
                            appearance: 'none', padding: '8px 32px 8px 12px',
                            borderRadius: 6, background: T.surface,
                            border: `1px solid ${T.border}`, color: T.text,
                            fontSize: 13, cursor: 'pointer',
                        }}
                    >
                        <option value="">Todos</option>
                        <option value="pendente">Pendentes</option>
                        <option value="aprovado">Aprovados</option>
                        <option value="auto_aprovado">Auto-aprovados</option>
                        <option value="rejeitado">Rejeitados</option>
                    </select>
                    <ChevronDown size={12} style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        color: T.textMuted, pointerEvents: 'none',
                    }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: T.textMuted }}>Confiança min:</span>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        step={10}
                        value={minScore}
                        onChange={e => setMinScore(Number(e.target.value))}
                        style={{ width: 100, accentColor: T.accent }}
                    />
                    <span style={{
                        fontSize: 12, fontFamily: 'var(--font-mono)',
                        color: T.text, minWidth: 32, textAlign: 'right',
                    }}>
                        {minScore}%
                    </span>
                </div>
            </div>

            {/* Matches Table */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                    <Loader2 size={28} className="animate-spin" style={{ color: T.accent }} />
                </div>
            ) : (
                <div style={{
                    background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 10, overflow: 'hidden',
                }}>
                    {/* Table Header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 120px 120px 80px 100px 100px',
                        gap: 8, padding: '12px 20px',
                        borderBottom: `1px solid ${T.borderLight}`,
                        fontSize: 11, fontWeight: 600, color: T.textMuted,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                        <span>Transação</span>
                        <span>Valor Interno</span>
                        <span>Valor Banco</span>
                        <span>Score</span>
                        <span>Status</span>
                        <span>Ações</span>
                    </div>

                    {data.length === 0 ? (
                        <div style={{ padding: 48, textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
                            <AlertTriangle size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                            Nenhuma conciliação encontrada com esses filtros
                        </div>
                    ) : (
                        data.map((conc, i) => {
                            const scoreCfg = getScoreLevel(conc.score_match)
                            const statusCfg = STATUS_CONFIG[conc.status] || STATUS_CONFIG.pendente
                            const StatusIcon = statusCfg.icon

                            return (
                                <motion.div
                                    key={conc.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 120px 120px 80px 100px 100px',
                                        gap: 8, padding: '12px 20px',
                                        borderBottom: `1px solid ${T.borderLight}`,
                                        alignItems: 'center',
                                    }}
                                >
                                    {/* Transaction description */}
                                    <div>
                                        <p style={{
                                            fontSize: 13, fontWeight: 500, color: T.text,
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>
                                            {conc.bpo_transacoes?.descricao || 'Transação'}
                                        </p>
                                        <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                                            {conc.data_interno ? new Date(conc.data_interno + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                                            {conc.metodo_match && ` · ${conc.metodo_match}`}
                                        </p>
                                    </div>

                                    {/* Internal value */}
                                    <span style={{
                                        fontSize: 13, fontFamily: 'var(--font-mono)',
                                        color: T.text,
                                    }}>
                                        {conc.valor_interno ? formatCurrency(conc.valor_interno) : '—'}
                                    </span>

                                    {/* Bank value */}
                                    <span style={{
                                        fontSize: 13, fontFamily: 'var(--font-mono)',
                                        color: T.text,
                                    }}>
                                        {conc.valor_banco ? formatCurrency(conc.valor_banco) : '—'}
                                    </span>

                                    {/* Score badge */}
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center',
                                        padding: '3px 8px', borderRadius: 3,
                                        fontSize: 12, fontWeight: 600,
                                        fontFamily: 'var(--font-mono)',
                                        color: scoreCfg.color, background: scoreCfg.bg,
                                    }}>
                                        {conc.score_match}%
                                    </span>

                                    {/* Status */}
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        fontSize: 12, color: statusCfg.color,
                                    }}>
                                        <StatusIcon size={12} />
                                        {statusCfg.label}
                                    </span>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {conc.status === 'pendente' && (
                                            <>
                                                <button
                                                    onClick={() => handleUpdateStatus(conc.id, 'aprovado')}
                                                    title="Aprovar"
                                                    style={{
                                                        width: 28, height: 28, borderRadius: 6,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: T.successBg, border: 'none',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <Check size={14} style={{ color: T.success }} />
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(conc.id, 'rejeitado')}
                                                    title="Rejeitar"
                                                    style={{
                                                        width: 28, height: 28, borderRadius: 6,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: T.errorBg, border: 'none',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <X size={14} style={{ color: T.error }} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}
