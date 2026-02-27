'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Plus, Search, FileText, CheckCircle, Clock, AlertCircle,
    Scale, Mail, BookOpen, DollarSign, ChevronRight, Loader2,
    TrendingUp
} from 'lucide-react'
import Link from 'next/link'

const T = {
    bg: 'transparent', surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)', textDim: 'var(--bo-text-muted)',
    gold: '#C49D5B',
}

const STATUS_CFG: Record<string, { label: string; text: string; bg: string; icon: any }> = {
    concluida: { label: 'Concluída', text: '#6BB87B', bg: 'rgba(107,184,123,0.12)', icon: CheckCircle },
    em_andamento: { label: 'Em Andamento', text: '#C49D5B', bg: 'rgba(196,157,91,0.12)', icon: Clock },
    aguardando_docs: { label: 'Aguard. Docs', text: '#A89EC4', bg: 'rgba(168,158,196,0.12)', icon: AlertCircle },
    cancelada: { label: 'Cancelada', text: '#E57373', bg: 'rgba(229,115,115,0.12)', icon: AlertCircle },
}

const HONOR_CFG: Record<string, { label: string; text: string }> = {
    pago: { label: 'Pago', text: '#6BB87B' },
    parcial: { label: 'Parcial', text: '#C49D5B' },
    pendente: { label: 'Pendente', text: '#E8A87C' },
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const QUICK_ACTIONS = [
    { label: 'Nova Avaliação', href: '/backoffice/avaliacoes/nova', icon: Plus },
    { label: 'Email + Honorários', href: '/backoffice/avaliacoes/email-honorarios', icon: Mail },
    { label: 'Exercícios NBR', href: '/backoffice/avaliacoes/exercicios', icon: BookOpen },
]

export default function AvaliacoesPage() {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [tab, setTab] = useState('todos')
    const [avaliacoes, setAvaliacoes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchAvaliacoes() {
            try {
                const res = await fetch('/api/avaliacoes')
                if (!res.ok) throw new Error('Falha ao carregar')
                const result = await res.json()
                setAvaliacoes(result.data || [])
            } catch (err) {
                console.error('Erro ao buscar avaliações:', err)
                setAvaliacoes([])
            } finally {
                setLoading(false)
            }
        }
        fetchAvaliacoes()
    }, [])

    const honorariosPago = avaliacoes.filter(a => a.honorarios_status === 'pago').reduce((s, a) => s + (Number(a.honorarios) || 0), 0)
    const honorariosPendente = avaliacoes.filter(a => a.honorarios_status !== 'pago').reduce((s, a) => s + (Number(a.honorarios) || 0), 0)
    const emAndamento = avaliacoes.filter(a => a.status === 'em_andamento' || a.status === 'aguardando_docs').length
    const concluidas = avaliacoes.filter(a => a.status === 'concluida').length

    const KPIS = [
        { label: 'Honorários Recebidos', value: fmt(honorariosPago), icon: DollarSign, color: '#6BB87B' },
        { label: 'A Receber', value: fmt(honorariosPendente), icon: TrendingUp, color: '#C49D5B' },
        { label: 'Em Andamento', value: emAndamento, icon: Clock, color: '#A89EC4' },
        { label: 'Concluídas', value: concluidas, icon: CheckCircle, color: '#6BB87B' },
    ]

    const filtered = avaliacoes.filter(a => {
        const q = search.toLowerCase()
        const matchSearch = !q ||
            (a.cliente_nome || '').toLowerCase().includes(q) ||
            (a.protocolo || '').toLowerCase().includes(q) ||
            (a.bairro || '').toLowerCase().includes(q)
        const matchTab = tab === 'todos' || a.status === tab
        return matchSearch && matchTab
    })

    return (
        <div className="space-y-5 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>Avaliações</h1>
                    <p className="text-sm mt-0.5" style={{ color: T.textDim }}>Gestão de laudos NBR 14653</p>
                </div>
                <motion.button whileTap={{ scale: 0.96 }}
                    onClick={() => router.push('/backoffice/avaliacoes/nova')}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                    style={{ background: '#C49D5B', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                    <Plus size={16} /> Nova Avaliação
                </motion.button>
            </motion.div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {KPIS.map((k, i) => (
                    <motion.div key={k.label}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-2xl p-4"
                        style={{ background: 'var(--bo-elevated)', border: '1px solid var(--bo-border-gold)', backdropFilter: 'blur(16px)' }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                            style={{ background: `${k.color}18` }}>
                            <k.icon size={16} style={{ color: k.color }} />
                        </div>
                        <p className="text-xl font-bold" style={{ color: T.text }}>{k.value}</p>
                        <p className="text-xs mt-0.5" style={{ color: T.textDim }}>{k.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {QUICK_ACTIONS.map((a, i) => (
                    <Link key={a.href} href={a.href}>
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.05 }}
                            className="flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all group"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = `1px solid ${T.borderGold}`; (e.currentTarget as HTMLElement).style.background = T.elevated }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = `1px solid ${T.border}`; (e.currentTarget as HTMLElement).style.background = T.surface }}>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(196,157,91,0.10)' }}>
                                <a.icon size={15} style={{ color: T.gold }} />
                            </div>
                            <span className="text-xs font-medium" style={{ color: T.textSub }}>{a.label}</span>
                            <ChevronRight size={12} className="ml-auto" style={{ color: T.textDim }} />
                        </motion.div>
                    </Link>
                ))}
            </div>

            {/* Filter + Search */}
            <div className="rounded-2xl p-4 space-y-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textDim }} />
                    <input type="text" placeholder="Buscar por cliente, protocolo, bairro..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 rounded-xl text-sm outline-none"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text, caretColor: T.gold }}
                        onFocus={e => (e.currentTarget.style.border = `1px solid ${T.borderGold}`)}
                        onBlur={e => (e.currentTarget.style.border = `1px solid ${T.border}`)}
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                    {[
                        { key: 'todos', label: 'Todos' },
                        { key: 'em_andamento', label: 'Andamento' },
                        { key: 'aguardando_docs', label: 'Docs' },
                        { key: 'concluida', label: 'Concluídas' },
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className="px-3.5 h-8 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
                            style={{
                                background: tab === t.key ? '#C49D5B' : T.elevated,
                                color: tab === t.key ? 'white' : T.textDim,
                                border: `1px solid ${tab === t.key ? T.borderGold : T.border}`,
                            }}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: T.gold }} />
                </div>
            )}

            {/* List */}
            {!loading && (
                <div className="space-y-2">
                    {filtered.map((av, i) => {
                        const sc = STATUS_CFG[av.status] || STATUS_CFG.em_andamento
                        const hc = HONOR_CFG[av.honorarios_status] || HONOR_CFG.pendente
                        const SIcon = sc.icon
                        return (
                            <motion.div key={av.id}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                onClick={() => router.push(`/backoffice/avaliacoes/${av.id}`)}
                                className="rounded-2xl cursor-pointer transition-all"
                                style={{ background: T.surface, border: `1px solid ${T.border}` }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = `1px solid ${T.borderGold}`; (e.currentTarget as HTMLElement).style.background = T.elevated }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = `1px solid ${T.border}`; (e.currentTarget as HTMLElement).style.background = T.surface }}>
                                <div className="flex items-center gap-3 p-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: `${sc.text}18` }}>
                                        <SIcon size={18} style={{ color: sc.text }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-xs font-mono" style={{ color: T.textDim }}>{av.protocolo || '—'}</p>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                style={{ color: sc.text, background: sc.bg }}>
                                                {sc.label}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{av.cliente_nome || '—'}</p>
                                        <p className="text-[11px] mt-0.5" style={{ color: T.textDim }}>
                                            {av.tipo_imovel || '—'} · {av.bairro || '—'} · {av.area_privativa ? `${av.area_privativa}m²` : ''} · {av.metodologia || '—'}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        {av.honorarios && (
                                            <p className="text-sm font-bold" style={{ color: T.gold }}>
                                                {fmt(Number(av.honorarios))}
                                            </p>
                                        )}
                                        <p className="text-[10px] font-semibold mt-0.5" style={{ color: hc.text }}>
                                            {hc.label}
                                        </p>
                                        {av.valor_estimado && (
                                            <p className="text-[10px] mt-0.5" style={{ color: T.textDim }}>
                                                Vlr: {fmt(Number(av.valor_estimado))}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {!loading && filtered.length === 0 && (
                <div className="text-center py-16" style={{ color: T.textDim }}>
                    <Scale size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm mb-3">Nenhuma avaliação encontrada</p>
                    <button onClick={() => router.push('/backoffice/avaliacoes/nova')}
                        className="text-xs font-semibold px-4 py-2 rounded-xl text-white"
                        style={{ background: '#C49D5B' }}>
                        Nova Avaliação
                    </button>
                </div>
            )}
        </div>
    )
}
