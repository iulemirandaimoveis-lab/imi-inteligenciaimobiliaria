'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    TrendingUp, Plus, Search, CheckCircle, Clock, AlertCircle,
    ArrowUpCircle, Edit, Ban,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { getStatusConfig } from '@/app/(backoffice)/lib/constants'
import { PageIntelHeader, KPICard, FilterTabs, ActionMenu } from '@/app/(backoffice)/components/ui'
import type { FilterTab } from '@/app/(backoffice)/components/ui'

// Derive STATUS_CFG from centralized constants (override pago label for receita context)
const STATUS_ICONS: Record<string, any> = { pago: CheckCircle, pendente: Clock, atrasado: AlertCircle, cancelado: AlertCircle }
const STATUS_CFG = Object.fromEntries(
    Object.entries({ pago: 'Recebido', pendente: 'Pendente', atrasado: 'Atrasado', cancelado: 'Cancelado' }).map(([key, label]) => {
        const cfg = getStatusConfig(key)
        return [key, { label, text: cfg.dot, bg: `${cfg.dot}1f`, icon: STATUS_ICONS[key] || AlertCircle }]
    })
) as Record<string, { label: string; text: string; bg: string; icon: any }>

const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const fmtDate = (d: string | null) =>
    d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'

export default function ReceberPage() {
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('todos')

    const load = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/financeiro?type=receita')
            if (res.ok) setTransactions(await res.json())
        } catch { /* graceful */ }
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    const markReceived = async (id: string) => {
        try {
            const res = await fetch('/api/financeiro', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'pago' }),
            })
            if (res.ok) { toast.success('Marcado como recebido'); load() }
            else toast.error('Erro ao atualizar')
        } catch { toast.error('Erro de conexão') }
    }

    const cancelTransaction = async (id: string) => {
        try {
            const res = await fetch(`/api/financeiro?id=${id}`, { method: 'DELETE' })
            if (res.ok) { toast.success('Lançamento cancelado'); load() }
            else toast.error('Erro ao cancelar')
        } catch { toast.error('Erro de conexão') }
    }

    const filtered = transactions.filter(t =>
        t.status !== 'cancelado' &&
        (statusFilter === 'todos' || t.status === statusFilter) &&
        (!search || t.description?.toLowerCase().includes(search.toLowerCase()) || t.category?.toLowerCase().includes(search.toLowerCase()))
    )

    const totalPendente = transactions.filter(t => t.status === 'pendente').reduce((s, t) => s + Number(t.amount), 0)
    const totalRecebido = transactions.filter(t => t.status === 'pago').reduce((s, t) => s + Number(t.amount), 0)
    const countAtrasado = transactions.filter(t => t.status === 'atrasado').length

    return (
        <div className="space-y-5 max-w-7xl mx-auto">
            {/* Header */}
            <PageIntelHeader
                moduleLabel="FINANCEIRO"
                title="Contas a Receber"
                subtitle="Honorários, comissões e receitas pendentes"
                actions={
                    <Link
                        href="/backoffice/financeiro"
                        className="bo-btn bo-btn-primary"
                        style={{ background: T.accent }}
                    >
                        <Plus size={15} /> Novo Lançamento
                    </Link>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3">
                <KPICard
                    label="A Receber"
                    value={fmt(totalPendente)}
                    icon={<Clock size={14} />}
                    accent="warm"
                    size="sm"
                />
                <KPICard
                    label="Já Recebido"
                    value={fmt(totalRecebido)}
                    icon={<CheckCircle size={14} />}
                    accent="green"
                    size="sm"
                />
                <KPICard
                    label="Atrasados"
                    value={countAtrasado}
                    icon={<AlertCircle size={14} />}
                    accent="hot"
                    size="sm"
                />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-1 min-w-0">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                    <input type="text" placeholder="Buscar por descrição ou categoria..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 rounded-xl text-sm outline-none"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                    />
                </div>
                <FilterTabs
                    tabs={[
                        { id: 'todos',    label: 'Todos',      count: transactions.filter(t => t.status !== 'cancelado').length },
                        { id: 'pendente', label: 'Pendentes',  dotColor: getStatusConfig('pendente').dot },
                        { id: 'atrasado', label: 'Atrasados',  dotColor: getStatusConfig('atrasado').dot },
                        { id: 'pago',     label: 'Recebidos',  dotColor: getStatusConfig('pago').dot },
                    ] as FilterTab[]}
                    active={statusFilter}
                    onChange={setStatusFilter}
                />
            </div>

            {/* List */}
            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="animate-pulse rounded-2xl h-16" style={{ background: T.elevated }} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-2xl p-12 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <TrendingUp size={36} className="mx-auto mb-4 opacity-20" style={{ color: T.textMuted }} />
                    <p className="text-sm font-semibold mb-1" style={{ color: T.textMuted }}>
                        {transactions.length === 0 ? 'Nenhuma receita cadastrada' : 'Nenhum resultado para o filtro'}
                    </p>
                    <p className="text-xs mb-4" style={{ color: T.textMuted }}>
                        Registre honorários e comissões no módulo Financeiro
                    </p>
                    <Link href="/backoffice/financeiro"
                        className="bo-btn bo-btn-primary"
                        style={{ background: T.accent }}>
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
                                    style={{ background: 'var(--bo-success-bg)' }}>
                                    <ArrowUpCircle size={18} style={{ color: 'var(--bo-success)' }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{t.description}</p>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                        <span className="text-[10px] font-medium" style={{ color: T.textMuted }}>{t.category}</span>
                                        <span className="text-[10px]" style={{ color: T.textMuted }}>·</span>
                                        <span className="text-[10px]" style={{ color: isOverdue ? 'var(--bo-error)' : T.textMuted }}>
                                            Vence {fmtDate(t.due_date)}
                                        </span>
                                        <span
                                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                                            style={{ color: isOverdue ? 'var(--bo-error)' : sc.text, background: isOverdue ? 'rgba(229,115,115,0.12)' : sc.bg }}>
                                            <Icon size={9} /> {isOverdue ? 'Atrasado' : sc.label}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-base font-bold" style={{ color: 'var(--bo-success)' }}>{fmt(Number(t.amount))}</p>
                                </div>
                                <ActionMenu items={[
                                    ...(t.status === 'pendente' ? [{ label: 'Marcar Recebido', icon: <CheckCircle size={14} />, onClick: () => markReceived(t.id) }] : []),
                                    { label: 'Editar', icon: <Edit size={14} />, onClick: () => window.location.href = '/backoffice/financeiro' },
                                    { label: 'Cancelar', icon: <Ban size={14} />, onClick: () => cancelTransaction(t.id), variant: 'danger' as const },
                                ]} />
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
