'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Landmark, Zap, Loader2, CheckCircle2, XCircle, Clock,
    TrendingUp, RefreshCw, ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { KPICard } from '@/app/(backoffice)/components/ui/KPICard'
import { EmptyState } from '@/app/(backoffice)/components/ui/EmptyState'
import { T } from '@/app/(backoffice)/lib/theme'
import { formatCurrency } from '@/lib/format'
import BankAccountsPanel, { type BankAccount } from './components/BankAccountsPanel'

interface Suggestion {
    transaction: {
        id: string
        amount: number
        transaction_date: string
        description: string | null
        counterparty_name: string | null
        counterparty_document: string | null
    }
    score: number
    method: string
}

interface PendingRepasse {
    id: string
    agency_name: string | null
    empreendimento_nome: string
    cliente_nome: string | null
    valor_esperado: number
    status: string
    data_venda: string | null
    data_repasse_prevista: string | null
    suggestions: Suggestion[]
}

interface ReconciliationData {
    pending: PendingRepasse[]
    history: Array<{ id: string; empreendimento_nome: string; valor_repasse_liquido: number | null; valor_comissao_bruta: number; data_repasse_realizada: string | null; partner_agencies: { name: string } | null }>
    stats: { pendentes: number; valor_pendente: number; conciliados: number; transacoes_nao_conciliadas: number }
}

const fmtDate = (d: string | null) => d ? new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR') : '—'

function ScoreBadge({ score }: { score: number }) {
    const color = score >= 80 ? T.success : score >= 50 ? T.warning : T.textMuted
    const bg = score >= 80 ? T.successBg : score >= 50 ? T.warningBg : T.borderLight
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold" style={{ color, background: bg, fontFamily: 'var(--font-mono)' }}>
            {score}%
        </span>
    )
}

function ComissoesMenuContent() {
    const searchParams = useSearchParams()
    const [accounts, setAccounts] = useState<BankAccount[]>([])
    const [data, setData] = useState<ReconciliationData | null>(null)
    const [loading, setLoading] = useState(true)
    const [autoRunning, setAutoRunning] = useState(false)
    const [actingOn, setActingOn] = useState<string | null>(null)

    const load = useCallback(async () => {
        try {
            const [accRes, recRes] = await Promise.all([
                fetch('/api/finance/bank-accounts'),
                fetch('/api/finance/commissions/reconciliation'),
            ])
            if (accRes.ok) setAccounts((await accRes.json()).data || [])
            if (recRes.ok) setData(await recRes.json())
            else toast.error('Erro ao carregar conciliação')
        } catch {
            toast.error('Erro de conexão')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    useEffect(() => {
        const btgError = searchParams.get('btg_error')
        const btgConnected = searchParams.get('btg_connected')
        if (btgError) toast.error(decodeURIComponent(btgError))
        if (btgConnected) toast.success('Conta BTG conectada com sucesso')
        if (btgError || btgConnected) {
            const url = new URL(window.location.href)
            url.searchParams.delete('btg_error')
            url.searchParams.delete('btg_connected')
            window.history.replaceState({}, '', url.toString())
        }
    }, [searchParams])

    const confirmMatch = async (repasseId: string, txId: string) => {
        setActingOn(`${repasseId}:${txId}`)
        try {
            const res = await fetch('/api/finance/commissions/reconciliation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'confirm', repasse_id: repasseId, bank_transaction_id: txId }),
            })
            const json = await res.json()
            if (res.ok) { toast.success('Repasse conciliado — comissão confirmada como recebida'); load() }
            else toast.error(json.error || 'Erro ao confirmar')
        } catch { toast.error('Erro de conexão') }
        finally { setActingOn(null) }
    }

    const rejectMatch = async (repasseId: string, txId: string) => {
        setActingOn(`${repasseId}:${txId}`)
        try {
            const res = await fetch('/api/finance/commissions/reconciliation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject', repasse_id: repasseId, bank_transaction_id: txId }),
            })
            if (res.ok) load()
            else toast.error('Erro ao descartar sugestão')
        } catch { toast.error('Erro de conexão') }
        finally { setActingOn(null) }
    }

    const runAutoMatch = async () => {
        setAutoRunning(true)
        try {
            const res = await fetch('/api/finance/commissions/reconciliation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'auto_match' }),
            })
            const json = await res.json()
            if (res.ok) {
                toast.success(`${json.auto_confirmed} conciliado(s) automaticamente · ${json.suggested} com sugestão`)
                load()
            } else toast.error(json.error || 'Erro na conciliação automática')
        } catch { toast.error('Erro de conexão') }
        finally { setAutoRunning(false) }
    }

    return (
        <div className="space-y-5 max-w-6xl mx-auto">
            <PageIntelHeader
                moduleLabel="FINANCEIRO"
                title="Conciliação de Comissões"
                subtitle="Confirme os repasses de comissão da IMI recebidos via imobiliárias parceiras (Mano Imóveis)"
                actions={
                    <button
                        onClick={runAutoMatch}
                        disabled={autoRunning}
                        className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-[12px] font-bold uppercase tracking-wider transition-all active:scale-[0.98]"
                        style={{ background: T.textGold, color: '#050B14', opacity: autoRunning ? 0.6 : 1 }}
                    >
                        {autoRunning ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                        Auto-conciliar
                    </button>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard label="Repasses Pendentes" value={data?.stats.pendentes ?? 0} icon={<Clock size={15} />} accent="warm" size="sm" />
                <KPICard label="Valor a Confirmar" value={formatCurrency(data?.stats.valor_pendente ?? 0)} icon={<TrendingUp size={15} />} accent="gold" size="sm" />
                <KPICard label="Já Conciliados" value={data?.stats.conciliados ?? 0} icon={<CheckCircle2 size={15} />} accent="success" size="sm" />
                <KPICard label="Extrato Não Conciliado" value={data?.stats.transacoes_nao_conciliadas ?? 0} icon={<Landmark size={15} />} accent="info" size="sm" />
            </div>

            <section className="space-y-3">
                <div className="flex items-center gap-2">
                    <Landmark size={15} style={{ color: T.textGold }} />
                    <h2 className="text-sm font-bold" style={{ color: T.text }}>Contas Bancárias (BTG)</h2>
                </div>
                <BankAccountsPanel accounts={accounts} onChanged={load} />
            </section>

            <section className="space-y-3">
                <div className="flex items-center gap-2">
                    <RefreshCw size={15} style={{ color: T.textGold }} />
                    <h2 className="text-sm font-bold" style={{ color: T.text }}>Repasses aguardando confirmação</h2>
                </div>

                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="animate-pulse rounded-xl h-24" style={{ background: T.surface }} />
                        ))}
                    </div>
                ) : !data || data.pending.length === 0 ? (
                    <EmptyState
                        icon={<CheckCircle2 size={32} />}
                        title="Nada pendente"
                        description="Todos os repasses liberados já foram conciliados com o extrato bancário."
                    />
                ) : (
                    <div className="space-y-3">
                        {data.pending.map((r, i) => (
                            <motion.div
                                key={r.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="rounded-2xl overflow-hidden"
                                style={{ background: T.surface, border: `1px solid ${T.border}` }}
                            >
                                <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2" style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: T.text }}>
                                            {r.agency_name || 'Imobiliária'} · {r.empreendimento_nome}
                                        </p>
                                        <p className="text-[11px]" style={{ color: T.textMuted }}>
                                            {r.cliente_nome ? `${r.cliente_nome} · ` : ''}
                                            previsto {fmtDate(r.data_repasse_prevista || r.data_venda)}
                                        </p>
                                    </div>
                                    <p className="text-base font-bold" style={{ color: T.textGold, fontFamily: 'var(--font-mono)' }}>
                                        {formatCurrency(r.valor_esperado)}
                                    </p>
                                </div>

                                <div className="p-4">
                                    {r.suggestions.length === 0 ? (
                                        <p className="text-[12px]" style={{ color: T.textMuted }}>
                                            Nenhuma transação compatível no extrato ainda. Sincronize a conta BTG PJ ou importe o extrato PF.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {r.suggestions.map((s) => {
                                                const key = `${r.id}:${s.transaction.id}`
                                                const busy = actingOn === key
                                                return (
                                                    <div
                                                        key={s.transaction.id}
                                                        className="flex flex-wrap items-center gap-3 rounded-lg px-3 py-2.5"
                                                        style={{ background: T.borderLight }}
                                                    >
                                                        <ScoreBadge score={s.score} />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[12px] font-medium truncate" style={{ color: T.text }}>
                                                                {s.transaction.description || 'Crédito recebido'}
                                                                {s.transaction.counterparty_name ? ` — ${s.transaction.counterparty_name}` : ''}
                                                            </p>
                                                            <p className="text-[11px]" style={{ color: T.textMuted }}>
                                                                {fmtDate(s.transaction.transaction_date)} · {formatCurrency(Number(s.transaction.amount))}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                                            <button
                                                                onClick={() => rejectMatch(r.id, s.transaction.id)}
                                                                disabled={busy}
                                                                title="Descartar sugestão"
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                                style={{ background: T.errorBg }}
                                                            >
                                                                <XCircle size={14} style={{ color: T.error }} />
                                                            </button>
                                                            <button
                                                                onClick={() => confirmMatch(r.id, s.transaction.id)}
                                                                disabled={busy}
                                                                title="Confirmar recebimento"
                                                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider"
                                                                style={{ background: T.success, color: '#04140D' }}
                                                            >
                                                                {busy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                                                Confirmar
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            {data && data.history.length > 0 && (
                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={15} style={{ color: T.success }} />
                        <h2 className="text-sm font-bold" style={{ color: T.text }}>Histórico conciliado</h2>
                    </div>
                    <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        {data.history.slice(0, 10).map((h, i) => (
                            <div
                                key={h.id}
                                className="flex items-center justify-between gap-3 px-4 py-3"
                                style={{ borderBottom: i < data.history.length - 1 ? `1px solid ${T.borderLight}` : 'none' }}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <ArrowRight size={13} style={{ color: T.success, flexShrink: 0 }} />
                                    <p className="text-[12px] truncate" style={{ color: T.text }}>
                                        {h.partner_agencies?.name || 'Imobiliária'} · {h.empreendimento_nome}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="text-[11px]" style={{ color: T.textMuted }}>{fmtDate(h.data_repasse_realizada)}</span>
                                    <span className="text-[12px] font-bold" style={{ color: T.success, fontFamily: 'var(--font-mono)' }}>
                                        {formatCurrency(Number(h.valor_repasse_liquido ?? h.valor_comissao_bruta))}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}

export default function ComissoesReconciliationPage() {
    return (
        <Suspense fallback={<div className="p-6"><Loader2 className="animate-spin" size={24} style={{ color: T.textGold }} /></div>}>
            <ComissoesMenuContent />
        </Suspense>
    )
}
