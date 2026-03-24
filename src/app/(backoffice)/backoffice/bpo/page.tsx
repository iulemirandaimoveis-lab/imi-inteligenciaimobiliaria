'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    TrendingUp, TrendingDown, DollarSign, Plus, Loader2,
    RefreshCw, FileBarChart, AlertTriangle, AlertCircle, Info,
    CheckCircle2, XCircle, ArrowRight, Banknote, Percent,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { KPICard } from '@/app/(backoffice)/components/ui/KPICard'
import { T } from '@/app/(backoffice)/lib/theme'

interface DashboardData {
    periodo: { mes: number; ano: number }
    kpis: {
        receita_bruta: number
        despesas: number
        lucro_liquido: number
        conciliacao_pct: number
        pending_reconciliation: number
        alertas_count: number
        empresas_ativas: number
    }
    alertas: { critical: number; warning: number; info: number }
    dre_summary: Record<string, unknown> | null
    recent_transactions: Array<{
        id: string
        descricao: string
        valor: number
        tipo: string
        data: string
        conciliado: boolean
        origem: string
    }>
}

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const SEVERITY_CONFIG = {
    critical: { icon: AlertCircle, color: T.error, bg: T.errorBg, label: 'Crítico' },
    warning: { icon: AlertTriangle, color: T.warning, bg: T.warningBg, label: 'Atenção' },
    info: { icon: Info, color: T.info, bg: T.infoBg, label: 'Info' },
}

export default function BPODashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)

    const fetchDashboard = async () => {
        try {
            const res = await fetch('/api/bpo/dashboard')
            if (res.ok) {
                const json = await res.json()
                setData(json)
            }
        } catch {
            toast.error('Erro ao carregar dashboard BPO')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchDashboard() }, [])

    const handleSync = async () => {
        setSyncing(true)
        toast.info('Sincronizando dados bancários...')
        // Placeholder for Open Finance sync
        setTimeout(() => {
            setSyncing(false)
            toast.success('Sincronização concluída')
            fetchDashboard()
        }, 2000)
    }

    return (
        <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
            <PageIntelHeader
                moduleLabel="BPO . FINANCEIRO"
                title="Dashboard Financeiro"
                subtitle={data ? `${MESES[(data.periodo.mes || 1) - 1]} ${data.periodo.ano} · ${data.kpis.empresas_ativas} empresa(s) ativa(s)` : 'Carregando...'}
                live
                breadcrumbs={[
                    { label: 'Backoffice', href: '/backoffice' },
                    { label: 'BPO Financeiro' },
                ]}
                actions={
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 14px', borderRadius: 3,
                                background: T.surfaceAlt, border: `1px solid ${T.border}`,
                                color: T.text, fontSize: 13, fontWeight: 500,
                                cursor: syncing ? 'not-allowed' : 'pointer', opacity: syncing ? 0.6 : 1,
                            }}
                        >
                            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                            Sync Bancário
                        </button>
                        <a
                            href="/backoffice/bpo/dre"
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 14px', borderRadius: 3,
                                background: T.surfaceAlt, border: `1px solid ${T.border}`,
                                color: T.text, fontSize: 13, fontWeight: 500, textDecoration: 'none',
                            }}
                        >
                            <FileBarChart size={14} />
                            Gerar DRE
                        </a>
                        <button
                            onClick={() => toast.info('Modal de nova transação — em desenvolvimento')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 14px', borderRadius: 3,
                                background: T.accent, border: 'none',
                                color: '#050B14', fontSize: 13, fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            <Plus size={14} />
                            Nova Transação
                        </button>
                    </div>
                }
            />

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                    <Loader2 size={28} className="animate-spin" style={{ color: T.accent }} />
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 16, marginBottom: 28,
                    }}>
                        <KPICard
                            label="Receita Bruta"
                            value={formatCurrency(data?.kpis.receita_bruta || 0)}
                            icon={<TrendingUp size={18} />}
                            accent="success"
                        />
                        <KPICard
                            label="Despesas"
                            value={formatCurrency(data?.kpis.despesas || 0)}
                            icon={<TrendingDown size={18} />}
                            accent="error"
                        />
                        <KPICard
                            label="Lucro Líquido"
                            value={formatCurrency(data?.kpis.lucro_liquido || 0)}
                            icon={<Banknote size={18} />}
                            accent={(data?.kpis.lucro_liquido || 0) >= 0 ? 'gold' : 'error'}
                        />
                        <KPICard
                            label="Conciliação"
                            value={`${data?.kpis.conciliacao_pct || 0}%`}
                            sublabel={`${data?.kpis.pending_reconciliation || 0} pendente(s)`}
                            icon={<Percent size={18} />}
                            accent="info"
                        />
                    </div>

                    {/* Two-column layout: Transactions + Alerts */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 360px',
                        gap: 20,
                    }}>
                        {/* Recent Transactions */}
                        <div style={{
                            background: T.surface,
                            border: `1px solid ${T.border}`,
                            borderRadius: 10,
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '16px 20px',
                                borderBottom: `1px solid ${T.borderLight}`,
                            }}>
                                <div>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, color: T.text, fontFamily: 'var(--font-sans)' }}>
                                        Transações Recentes
                                    </h3>
                                    <p style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                                        Últimas movimentações financeiras
                                    </p>
                                </div>
                                <a
                                    href="/backoffice/bpo/transacoes"
                                    style={{
                                        fontSize: 12, color: T.accent, textDecoration: 'none',
                                        display: 'flex', alignItems: 'center', gap: 4,
                                    }}
                                >
                                    Ver todas <ArrowRight size={12} />
                                </a>
                            </div>

                            <div>
                                {(data?.recent_transactions || []).length === 0 ? (
                                    <div style={{ padding: 40, textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
                                        Nenhuma transação registrada
                                    </div>
                                ) : (
                                    (data?.recent_transactions || []).map((tx, i) => (
                                        <motion.div
                                            key={tx.id}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 12,
                                                padding: '12px 20px',
                                                borderBottom: `1px solid ${T.borderLight}`,
                                            }}
                                        >
                                            <div style={{
                                                width: 32, height: 32, borderRadius: 8,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: tx.tipo === 'receita' ? T.successBg : T.errorBg,
                                            }}>
                                                {tx.tipo === 'receita'
                                                    ? <TrendingUp size={14} style={{ color: T.success }} />
                                                    : <TrendingDown size={14} style={{ color: T.error }} />
                                                }
                                            </div>

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{
                                                    fontSize: 13, fontWeight: 500, color: T.text,
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                }}>
                                                    {tx.descricao || 'Sem descrição'}
                                                </p>
                                                <p style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>
                                                    {new Date(tx.data + 'T00:00:00').toLocaleDateString('pt-BR')} · {tx.origem}
                                                </p>
                                            </div>

                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <p style={{
                                                    fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)',
                                                    color: tx.tipo === 'receita' ? T.success : T.error,
                                                }}>
                                                    {tx.tipo === 'receita' ? '+' : '-'}{formatCurrency(Math.abs(tx.valor))}
                                                </p>
                                                {tx.conciliado ? (
                                                    <span style={{
                                                        fontSize: 10, color: T.success, display: 'inline-flex',
                                                        alignItems: 'center', gap: 3, marginTop: 2,
                                                    }}>
                                                        <CheckCircle2 size={10} /> Conciliado
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        fontSize: 10, color: T.textDim, display: 'inline-flex',
                                                        alignItems: 'center', gap: 3, marginTop: 2,
                                                    }}>
                                                        <XCircle size={10} /> Pendente
                                                    </span>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Alerts Panel */}
                        <div style={{
                            background: T.surface,
                            border: `1px solid ${T.border}`,
                            borderRadius: 10,
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                padding: '16px 20px',
                                borderBottom: `1px solid ${T.borderLight}`,
                            }}>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: T.text, fontFamily: 'var(--font-sans)' }}>
                                    Alertas
                                </h3>
                                <p style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                                    {data?.kpis.alertas_count || 0} alerta(s) não lido(s)
                                </p>
                            </div>

                            <div style={{ padding: '12px 16px' }}>
                                {(['critical', 'warning', 'info'] as const).map(sev => {
                                    const count = data?.alertas[sev] || 0
                                    if (count === 0) return null
                                    const cfg = SEVERITY_CONFIG[sev]
                                    const Icon = cfg.icon
                                    return (
                                        <div
                                            key={sev}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 10,
                                                padding: '10px 12px', marginBottom: 8,
                                                borderRadius: 8, background: cfg.bg,
                                                border: `1px solid color-mix(in srgb, ${cfg.color} 20%, transparent)`,
                                            }}
                                        >
                                            <Icon size={16} style={{ color: cfg.color, flexShrink: 0 }} />
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>
                                                    {count} {cfg.label}
                                                </p>
                                            </div>
                                            <span style={{
                                                fontSize: 18, fontWeight: 700, color: cfg.color,
                                                fontFamily: 'var(--font-mono)',
                                            }}>
                                                {count}
                                            </span>
                                        </div>
                                    )
                                })}

                                {(data?.kpis.alertas_count || 0) === 0 && (
                                    <div style={{
                                        padding: 32, textAlign: 'center', color: T.textMuted, fontSize: 13,
                                    }}>
                                        <CheckCircle2 size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                                        Nenhum alerta pendente
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div style={{
                                padding: '12px 16px',
                                borderTop: `1px solid ${T.borderLight}`,
                            }}>
                                <p style={{
                                    fontSize: 11, fontWeight: 600, color: T.textMuted,
                                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
                                }}>
                                    Ações Rápidas
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {[
                                        { label: 'Conciliação Bancária', href: '/backoffice/bpo/conciliacao', icon: RefreshCw },
                                        { label: 'Demonstrativo (DRE)', href: '/backoffice/bpo/dre', icon: FileBarChart },
                                    ].map(action => (
                                        <a
                                            key={action.href}
                                            href={action.href}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 8,
                                                padding: '8px 10px', borderRadius: 6,
                                                background: T.hover, border: `1px solid ${T.borderLight}`,
                                                color: T.text, fontSize: 13, textDecoration: 'none',
                                                transition: 'all 150ms',
                                            }}
                                        >
                                            <action.icon size={14} style={{ color: T.accent }} />
                                            {action.label}
                                            <ArrowRight size={12} style={{ marginLeft: 'auto', color: T.textDim }} />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
