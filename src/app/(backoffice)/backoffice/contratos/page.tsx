'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, Search, FileText, CheckCircle, Clock, AlertCircle,
    Globe, FileSignature, ChevronRight, Sparkles, X, Loader2
} from 'lucide-react'
import { MODELOS_CONTRATOS, CATEGORIAS_LABEL, IDIOMAS_LABEL } from '@/lib/modelos-contratos'

const T = {
    bg: 'transparent', surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)', textDim: 'var(--bo-text-muted)',
    gold: '#C49D5B',
}

const STATUS_CFG: Record<string, { label: string; text: string; bg: string; icon: any }> = {
    rascunho: { label: 'Rascunho', text: '#4E5669', bg: 'rgba(78,86,105,0.15)', icon: FileText },
    gerado: { label: 'Gerado', text: '#7B9EC4', bg: 'rgba(123,158,196,0.12)', icon: CheckCircle },
    aguardando_assinatura: { label: 'Aguard. Assinatura', text: '#C49D5B', bg: 'rgba(196,157,91,0.12)', icon: Clock },
    assinado_parcial: { label: 'Parcialmente Assinado', text: '#E8A87C', bg: 'rgba(232,168,124,0.12)', icon: AlertCircle },
    assinado: { label: 'Assinado', text: '#6BB87B', bg: 'rgba(107,184,123,0.12)', icon: CheckCircle },
    cancelado: { label: 'Cancelado', text: '#E57373', bg: 'rgba(229,115,115,0.12)', icon: X },
}

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CFG[status] || STATUS_CFG.rascunho
    const Icon = cfg.icon
    return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: cfg.text, background: cfg.bg }}>
            <Icon size={9} /> {cfg.label}
        </span>
    )
}

export default function ContratosPage() {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('todos')
    const [activeTab, setActiveTab] = useState<'lista' | 'modelos'>('lista')
    const [contratos, setContratos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchContratos() {
            try {
                const res = await fetch('/api/contratos')
                if (!res.ok) throw new Error('Falha ao carregar')
                const result = await res.json()
                setContratos(result.data || [])
            } catch (err) {
                console.error('Erro ao buscar contratos:', err)
                setContratos([])
            } finally {
                setLoading(false)
            }
        }
        fetchContratos()
    }, [])

    const filtered = contratos.filter(c => {
        const q = search.toLowerCase()
        const ok = (c.numero || '').toLowerCase().includes(q) ||
            (c.modelo_nome || '').toLowerCase().includes(q) ||
            (c.contratante?.nome || '').toLowerCase().includes(q)
        const status = filterStatus === 'todos' || c.status === filterStatus
        return ok && status
    })

    const kpiValues = {
        total: contratos.length,
        assinados: contratos.filter(c => c.status === 'assinado').length,
        aguardando: contratos.filter(c => c.status === 'aguardando_assinatura').length,
        internacionais: contratos.filter(c => c.idioma && c.idioma !== 'pt').length,
    }

    const KPIS = [
        { label: 'Total', value: kpiValues.total, icon: FileText, color: '#7B9EC4' },
        { label: 'Assinados', value: kpiValues.assinados, icon: CheckCircle, color: '#6BB87B' },
        { label: 'Aguard. Assinatura', value: kpiValues.aguardando, icon: Clock, color: '#C49D5B' },
        { label: 'Internacionais', value: kpiValues.internacionais, icon: Globe, color: '#E8A87C' },
    ]

    return (
        <div className="space-y-5 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>Contratos</h1>
                    <p className="text-sm mt-0.5" style={{ color: T.textDim }}>
                        Geração por IA · Assinatura Digital · 5 idiomas
                    </p>
                </div>
                <motion.button whileTap={{ scale: 0.96 }}
                    onClick={() => router.push('/backoffice/contratos/novo')}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                    style={{ background: '#C49D5B', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                    <Sparkles size={15} /> Novo Contrato
                </motion.button>
            </motion.div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {KPIS.map((k, i) => (
                    <motion.div key={k.label}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-2xl p-4"
                        style={{ background: T.elevated, border: `1px solid ${T.borderGold}` }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                            style={{ background: `${k.color}18` }}>
                            <k.icon size={16} style={{ color: k.color }} />
                        </div>
                        <p className="text-2xl font-bold" style={{ color: T.text }}>{k.value}</p>
                        <p className="text-xs mt-0.5" style={{ color: T.textDim }}>{k.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {[
                    { key: 'lista', label: 'Meus Contratos', icon: FileText },
                    { key: 'modelos', label: 'Modelos Disponíveis', icon: Sparkles },
                ].map(tab => (
                    <button key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className="flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-semibold transition-all"
                        style={{
                            background: activeTab === tab.key ? '#C49D5B' : T.surface,
                            color: activeTab === tab.key ? 'white' : T.textDim,
                            border: `1px solid ${activeTab === tab.key ? T.borderGold : T.border}`,
                        }}>
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'lista' && (
                    <motion.div key="lista" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                        {/* Filters */}
                        <div className="rounded-2xl p-4 space-y-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textDim }} />
                                    <input type="text" placeholder="Buscar por número, modelo ou cliente..."
                                        value={search} onChange={e => setSearch(e.target.value)}
                                        className="w-full h-10 pl-9 pr-4 rounded-xl text-sm outline-none"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                                    />
                                </div>
                                <div className="flex gap-2 overflow-x-auto">
                                    {['todos', 'assinado', 'aguardando_assinatura', 'gerado'].map(s => (
                                        <button key={s} onClick={() => setFilterStatus(s)}
                                            className="px-3 h-10 rounded-xl text-xs font-semibold flex-shrink-0"
                                            style={{
                                                background: filterStatus === s ? '#C49D5B' : T.elevated,
                                                color: filterStatus === s ? 'white' : T.textDim,
                                                border: `1px solid ${filterStatus === s ? T.borderGold : T.border}`,
                                            }}>
                                            {s === 'todos' ? 'Todos' : STATUS_CFG[s]?.label || s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {loading && (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-6 h-6 animate-spin" style={{ color: T.gold }} />
                            </div>
                        )}

                        {!loading && (
                            <div className="space-y-2">
                                {filtered.map((c, i) => {
                                    const idiomaPrimario = c.idioma || 'pt'
                                    return (
                                        <motion.div key={c.id}
                                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            onClick={() => router.push(`/backoffice/contratos/${c.id}`)}
                                            className="rounded-2xl cursor-pointer transition-all"
                                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = `1px solid ${T.borderGold}`; (e.currentTarget as HTMLElement).style.background = T.elevated }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = `1px solid ${T.border}`; (e.currentTarget as HTMLElement).style.background = T.surface }}>
                                            <div className="flex items-center gap-3 p-4">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ background: 'rgba(196,157,91,0.10)' }}>
                                                    <FileSignature size={18} style={{ color: T.gold }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                        <p className="text-xs font-mono" style={{ color: T.textDim }}>{c.numero}</p>
                                                        <StatusBadge status={c.status} />
                                                        {IDIOMAS_LABEL[idiomaPrimario] && (
                                                            <span className="text-[10px]">{IDIOMAS_LABEL[idiomaPrimario]?.flag}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{c.modelo_nome || 'Contrato'}</p>
                                                    <p className="text-[11px] mt-0.5" style={{ color: T.textDim }}>
                                                        {c.contratante?.nome || '—'} × {c.contratado?.nome || '—'}
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0 hidden sm:block">
                                                    <p className="text-[10px]" style={{ color: T.textDim }}>por {c.criado_por_nome || '—'}</p>
                                                    <p className="text-[10px] mt-0.5" style={{ color: T.textDim }}>
                                                        {c.criado_em ? new Date(c.criado_em).toLocaleDateString('pt-BR') : '—'}
                                                    </p>
                                                </div>
                                                <ChevronRight size={14} style={{ color: T.textDim, flexShrink: 0 }} />
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}

                        {!loading && filtered.length === 0 && (
                            <div className="text-center py-16" style={{ color: T.textDim }}>
                                <FileText size={32} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm mb-3">Nenhum contrato encontrado</p>
                                <button onClick={() => router.push('/backoffice/contratos/novo')}
                                    className="text-xs font-semibold px-4 py-2 rounded-xl text-white"
                                    style={{ background: '#C49D5B' }}>
                                    Gerar primeiro contrato
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'modelos' && (
                    <motion.div key="modelos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        {Object.entries(CATEGORIAS_LABEL).map(([cat, label]) => {
                            const modelos = MODELOS_CONTRATOS.filter(m => m.categoria === cat)
                            if (!modelos.length) return null
                            return (
                                <div key={cat}>
                                    <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.textDim }}>{label}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {modelos.map((m, i) => (
                                            <motion.div key={m.id}
                                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                onClick={() => router.push(`/backoffice/contratos/novo?modelo=${m.id}`)}
                                                className="rounded-2xl p-4 cursor-pointer transition-all group"
                                                style={{ background: m.id === 'modelo-personalizado' ? 'rgba(196,157,91,0.06)' : T.surface, border: `1px solid ${m.id === 'modelo-personalizado' ? T.borderGold : T.border}` }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = `1px solid ${T.borderGold}`; (e.currentTarget as HTMLElement).style.background = T.elevated }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = `1px solid ${m.id === 'modelo-personalizado' ? T.borderGold : T.border}`; (e.currentTarget as HTMLElement).style.background = m.id === 'modelo-personalizado' ? 'rgba(196,157,91,0.06)' : T.surface }}>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                        style={{ background: `${m.cor}18` }}>
                                                        <FileText size={15} style={{ color: m.cor }} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <p className="text-xs font-semibold" style={{ color: T.text }}>{m.nome}</p>
                                                            {m.popular && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(196,157,91,0.15)', color: T.gold }}>✦</span>}
                                                            {m.internacional && <Globe size={9} style={{ color: '#E8A87C' }} />}
                                                        </div>
                                                        <p className="text-[10px] line-clamp-2" style={{ color: T.textDim }}>{m.descricao}</p>
                                                        <div className="flex gap-0.5 mt-1.5">
                                                            {m.idiomas.map(l => <span key={l} className="text-[9px]">{IDIOMAS_LABEL[l]?.flag}</span>)}
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={12} style={{ color: T.textDim, flexShrink: 0 }} />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
