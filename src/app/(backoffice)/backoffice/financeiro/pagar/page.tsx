'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    TrendingDown, Plus, Search, CheckCircle, Clock, AlertCircle,
    ArrowDownCircle, Loader2, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const T = {
    surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)',
    gold: 'var(--bo-accent)',
}

const STATUS_CFG: Record<string, { label: string; text: string; bg: string; icon: any }> = {
    pago:     { label: 'Pago',      text: '#6BB87B', bg: 'rgba(107,184,123,0.12)', icon: CheckCircle },
    pendente: { label: 'Pendente',  text: '#E8A87C', bg: 'rgba(232,168,124,0.12)', icon: Clock },
    atrasado: { label: 'Atrasado',  text: '#E57373', bg: 'rgba(229,115,115,0.12)', icon: AlertCircle },
    cancelado:{ label: 'Cancelado', text: '#627D98', bg: 'rgba(98,125,152,0.12)',  icon: AlertCircle },
}

const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const fmtDate = (d: string | null) =>
    d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'

export default function PagarPage() {
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('todos')

    const load = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/financeiro?type=despesa')
            if (res.ok) setTransactions(await res.json())
        } catch { /* graceful */ }
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    const markPaid = async (id: string) => {
        try {
            const res = await fetch('/api/financeiro', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'pago' }),
            })
            if (res.ok) { toast.success('Marcado como pago'); load() }
            else toast.error('Erro ao atualizar')
        } catch { toast.error('Erro de conexão') }
    }

    const filtered = transactions.filter(t =>
        t.status !== 'cancelado' &&
        (statusFilter === 'todos' || t.status === statusFilter) &&
        (!search || t.description?.toLowerCase().includes(search.toLowerCase()) || t.category?.toLowerCase().includes(search.toLowerCase()))
    )

    const totalPendente = transactions.filter(t => t.status === 'pendente').reduce((s, t) => s + Number(t.amount), 0)
    const totalPago     = transactions.filter(t => t.status === 'pago').reduce((s, t) => s + Number(t.amount), 0)
    const countAtrasado = transactions.filter(t => t.status === 'atrasado').length

    return (
        <div className="space-y-5 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/backoffice/financeiro" className="text-xs font-medium hover:underline" style={{ color: T.textSub }}>
                            Financeiro
                        </Link>
                        <ChevronRight size={12} style={{ color: T.textSub }} />
                        <span className="text-xs font-medium" style={{ color: T.text }}>A Pagar</span>
                    </div>
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>Contas a Pagar</h1>
                    <p className="text-sm mt-0.5" style={{ color: T.textSub }}>Despesas operacionais, marketing e custos fixos</p>
                </div>
                <Link
                    href="/backoffice/financeiro"
                    className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                    style={{ background: T.gold }}
                >
                    <Plus size={15} /> Novo Lançamento
                </Link>
            </motion.div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                    { label: 'A Pagar',   value: fmt(totalPendente), color: '#E8A87C', icon: Clock },
                    { label: 'Já Pago',   value: fmt(totalPago),     color: '#6BB87B', icon: CheckCircle },
                    { label: 'Atrasados', value: String(countAtrasado), color: '#E57373', icon: AlertCircle },
                ].map((k, i) => (
                    <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="rounded-2xl p-4" style={{ background: T.elevated, border: `1px solid ${T.borderGold}` }}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: k.color }}>{k.label}</p>
                            <k.icon size={15} style={{ color: k.color }} />
                        </div>
                        <p className="text-xl font-bold" style={{ color: T.text }}>{k.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="rounded-2xl p-4 space-y-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textSub }} />
                        <input type="text" placeholder="Buscar por descrição ou categoria..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full h-10 pl-9 pr-4 rounded-xl text-sm outline-none"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                            onFocus={e => (e.currentTarget.style.border = `1px solid ${T.borderGold}`)}
                            onBlur={e => (e.currentTarget.style.border = `1px solid ${T.border}`)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                        {['todos', 'pendente', 'atrasado', 'pago'].map(s => (
                            <button key={s} onClick={() => setStatusFilter(s)}
                                className="px-3.5 h-10 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
                                style={{
                                    background: statusFilter === s ? T.gold : T.elevated,
                                    color: statusFilter === s ? 'white' : T.textSub,
                                    border: `1px solid ${statusFilter === s ? T.borderGold : T.border}`,
                                }}>
                                {s === 'todos' ? 'Todos' : STATUS_CFG[s]?.label || s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin" size={22} style={{ color: T.gold }} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-2xl p-12 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <TrendingDown size={36} className="mx-auto mb-4 opacity-20" style={{ color: T.textSub }} />
                    <p className="text-sm font-semibold mb-1" style={{ color: T.textSub }}>
                        {transactions.length === 0 ? 'Nenhuma despesa cadastrada' : 'Nenhum resultado para o filtro'}
                    </p>
                    <p className="text-xs mb-4" style={{ color: T.textSub }}>
                        Registre despesas e contas a pagar no módulo Financeiro
                    </p>
                    <Link href="/backoffice/financeiro"
                        className="inline-flex items-center gap-2 h-9 px-5 rounded-xl text-xs font-semibold text-white"
                        style={{ background: T.gold }}>
                        <Plus size={14} /> Novo Lançamento
                    </Link>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((t, i) => {
                        const sc = STATUS_CFG[t.status] || STATUS_CFG.pendente
                        const Icon = sc.icon
                        const isOverdue = t.status === 'pendente' && t.due_date && new Date(t.due_date) < new Date()
                        return (
                            <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="flex items-center gap-3 sm:gap-4 p-4 rounded-2xl transition-all hover-card"
                                style={{ background: T.surface, border: `1px solid ${T.border}` }}
>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'rgba(229,115,115,0.10)' }}>
                                    <ArrowDownCircle size={18} style={{ color: '#E57373' }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{t.description}</p>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                        <span className="text-[10px] font-medium" style={{ color: T.textSub }}>{t.category}</span>
                                        <span className="text-[10px]" style={{ color: T.textSub }}>·</span>
                                        <span className="text-[10px]" style={{ color: isOverdue ? '#E57373' : T.textSub }}>
                                            Vence {fmtDate(t.due_date)}
                                        </span>
                                        <span
                                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                                            style={{ color: isOverdue ? '#E57373' : sc.text, background: isOverdue ? 'rgba(229,115,115,0.12)' : sc.bg }}>
                                            <Icon size={9} /> {isOverdue ? 'Atrasado' : sc.label}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-base font-bold" style={{ color: '#E57373' }}>−{fmt(Number(t.amount))}</p>
                                </div>
                                {t.status === 'pendente' && (
                                    <button onClick={() => markPaid(t.id)}
                                        title="Marcar como pago"
                                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105"
                                        style={{ background: 'rgba(107,184,123,0.10)' }}>
                                        <CheckCircle size={17} style={{ color: '#6BB87B' }} />
                                    </button>
                                )}
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
