'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Briefcase, Plus, Search, Eye, Edit, Clock,
    CheckCircle2, DollarSign, Calendar, MapPin,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageIntelHeader, KPICard, FilterTabs } from '../../components/ui'
import { T } from '../../lib/theme'
import { getStatusConfig } from '../../lib/constants'

// ── Types ─────────────────────────────────────────────────────
interface Consultoria {
    id: string
    protocolo: string
    cliente_nome: string
    cliente_email: string
    tipo: string
    descricao: string
    cidade: string
    status: string
    honorarios: number
    honorarios_status: string
    data_inicio: string
    data_prev_conclusao: string
}

// ── Config Maps ───────────────────────────────────────────────
const TIPO_LABEL: Record<string, string> = {
    estrategica: 'Estratégica', tributaria: 'Tributária',
    patrimonial: 'Patrimonial', mercado: 'Análise de Mercado', juridica: 'Jurídica',
}
const STATUS_CFG = Object.fromEntries(
    Object.entries({ em_andamento: 'Em Andamento', concluida: 'Concluída', proposta: 'Proposta', cancelada: 'Cancelada' }).map(([key, l]) => {
        const cfg = getStatusConfig(key)
        return [key, { l, text: cfg.dot, bg: `${cfg.dot}1f` }]
    })
) as Record<string, { l: string; text: string; bg: string }>
const HON_CFG = Object.fromEntries(
    Object.entries({ pago: 'Pago', parcial: 'Parcial', pendente: 'Pendente' }).map(([key, l]) => {
        const cfg = getStatusConfig(key)
        return [key, { l, color: cfg.dot }]
    })
) as Record<string, { l: string; color: string }>

const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

// ── Component ─────────────────────────────────────────────────
export default function ConsultoriasPage() {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [filtroStatus, setFiltroStatus] = useState('todos')
    const [consultorias, setConsultorias] = useState<Consultoria[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/consultorias')
            .then(r => r.json())
            .then(json => {
                // API returns { data: [...], pagination: {} } or [] on error
                const list = json.data || (Array.isArray(json) ? json : [])
                setConsultorias(list)
            })
            .catch(() => { toast.error('Erro ao carregar consultorias') })
            .finally(() => setLoading(false))
    }, [])

    const filtered = consultorias.filter(c => {
        const q = search.toLowerCase()
        const matchSearch = c.cliente_nome.toLowerCase().includes(q) ||
            (c.protocolo || '').toLowerCase().includes(q) ||
            (c.cidade || '').toLowerCase().includes(q)
        const matchStatus = filtroStatus === 'todos' || c.status === filtroStatus
        return matchSearch && matchStatus
    })

    const totalHonorarios = consultorias.reduce((s, c) => s + (c.honorarios || 0), 0)
    const recebido = consultorias.filter(c => c.honorarios_status === 'pago').reduce((s, c) => s + (c.honorarios || 0), 0)
    const emAndamento = consultorias.filter(c => c.status === 'em_andamento').length
    const propostas = consultorias.filter(c => c.status === 'proposta').length

    const filterTabs = [
        { id: 'todos', label: 'Todos', count: consultorias.length },
        { id: 'em_andamento', label: 'Em Andamento', count: emAndamento },
        { id: 'proposta', label: 'Propostas', count: propostas },
        { id: 'concluida', label: 'Concluídas', count: consultorias.filter(c => c.status === 'concluida').length },
    ]

    if (loading) {
        return (
            <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="skeleton h-3 w-24 mb-2" />
                        <div className="skeleton h-6 w-32 mb-2" />
                        <div className="skeleton h-4 w-48" />
                    </div>
                    <div className="skeleton h-10 w-40 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton-card p-4" style={{ animationDelay: `${i * 80}ms` }}>
                            <div className="skeleton h-3 w-20 mb-3" />
                            <div className="skeleton h-6 w-24" />
                        </div>
                    ))}
                </div>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton-card p-4 flex items-center gap-3" style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                        <div className="flex-1">
                            <div className="skeleton h-4 w-40 mb-2" />
                            <div className="skeleton h-3 w-56" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-5">

            {/* Header */}
            <PageIntelHeader
                moduleLabel="CONSULTORIAS"
                title="Consultorias"
                subtitle="Gestão de projetos e honorários"
                actions={
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => router.push('/backoffice/consultorias/nova')}
                        className="bo-btn bo-btn-primary"
                        style={{ background: T.accent }}
                    >
                        <Plus size={16} /> <span className="hidden sm:inline">Nova Consultoria</span>
                    </motion.button>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <KPICard label="Total Portfólio" value={fmtCurrency(totalHonorarios)} icon={<DollarSign size={16} />} accent="blue" size="sm" />
                <KPICard label="Hon. Recebidos" value={fmtCurrency(recebido)} icon={<CheckCircle2 size={16} />} accent="green" size="sm" />
                <KPICard label="Em Andamento" value={String(emAndamento)} icon={<Clock size={16} />} accent="warm" size="sm" />
                <KPICard label="Propostas" value={String(propostas)} icon={<Briefcase size={16} />} accent="ai" size="sm" />
            </div>

            {/* Filtros */}
            <div
                className="rounded-2xl p-4"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: T.textDim }} />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar cliente, protocolo, cidade…"
                            className="w-full h-10 pl-9 pr-4 rounded-xl text-sm outline-none transition-all"
                            style={{
                                background: T.elevated,
                                border: `1px solid ${T.border}`,
                                color: T.text,
                                caretColor: T.accent,
                            }}
                            onFocus={e => (e.currentTarget.style.border = `1px solid ${T.borderGold}`)}
                            onBlur={e => (e.currentTarget.style.border = `1px solid ${T.border}`)}
                        />
                    </div>
                    <FilterTabs tabs={filterTabs} active={filtroStatus} onChange={setFiltroStatus} />
                </div>
            </div>

            {/* Lista */}
            <div className="space-y-2">
                {filtered.map((c, i) => {
                    const stt = STATUS_CFG[c.status] || { l: c.status, text: T.textMuted, bg: T.elevated }
                    const hon = HON_CFG[c.honorarios_status] || { l: c.honorarios_status, color: T.textMuted }
                    return (
                        <motion.div
                            key={c.id}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="rounded-2xl cursor-pointer transition-all hover-card"
                            style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                            onClick={() => router.push(`/backoffice/consultorias/${c.id}`)}

                        >
                            <div className="flex items-start gap-4 p-4">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'rgba(72,101,129,0.12)' }}
                                >
                                    <Briefcase size={18} style={{ color: T.accent }} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 flex-wrap">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {c.protocolo && (
                                                    <span className="text-[10px] font-mono" style={{ color: T.textDim }}>
                                                        {c.protocolo}
                                                    </span>
                                                )}
                                                <span
                                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                    style={{ color: stt.text, background: stt.bg }}
                                                >
                                                    {stt.l}
                                                </span>
                                                {c.tipo && (
                                                    <span
                                                        className="text-[10px] px-2 py-0.5 rounded-full"
                                                        style={{ color: T.textMuted, background: T.elevated }}
                                                    >
                                                        {TIPO_LABEL[c.tipo] || c.tipo}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm font-semibold mt-1 truncate" style={{ color: T.text }}>
                                                {c.cliente_nome}
                                            </p>
                                            {c.descricao && (
                                                <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: T.textDim }}>
                                                    {c.descricao}
                                                </p>
                                            )}
                                        </div>

                                        {c.honorarios > 0 && (
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-bold" style={{ color: T.text }}>
                                                    {fmtCurrency(c.honorarios)}
                                                </p>
                                                <p className="text-[11px] font-semibold" style={{ color: hon.color }}>
                                                    {hon.l}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                                        {c.cidade && (
                                            <span className="flex items-center gap-1 text-[11px]" style={{ color: T.textDim }}>
                                                <MapPin size={11} /> {c.cidade}
                                            </span>
                                        )}
                                        {c.data_inicio && (
                                            <span className="flex items-center gap-1 text-[11px]" style={{ color: T.textDim }}>
                                                <Calendar size={11} /> {new Date(c.data_inicio).toLocaleDateString('pt-BR')}
                                            </span>
                                        )}
                                        {c.data_prev_conclusao && (
                                            <span className="flex items-center gap-1 text-[11px] hidden sm:flex" style={{ color: T.textDim }}>
                                                <Clock size={11} /> {new Date(c.data_prev_conclusao).toLocaleDateString('pt-BR')}
                                            </span>
                                        )}

                                        <div className="ml-auto flex gap-1.5" onClick={e => e.stopPropagation()}>
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => router.push(`/backoffice/consultorias/${c.id}`)}
                                                className="h-7 px-3 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all"
                                                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}
                                            >
                                                <Eye size={11} /> Ver
                                            </motion.button>
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => router.push(`/backoffice/consultorias/${c.id}/editar`)}
                                                className="h-7 px-3 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all"
                                                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}
                                            >
                                                <Edit size={11} /> Editar
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}

                {filtered.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        className="empty-state rounded-2xl"
                        style={{ background: T.surface, border: `1px solid ${T.border}` }}
                    >
                        <div className="empty-state-icon">
                            <Briefcase size={24} />
                        </div>
                        <p className="empty-state-title">Nenhuma consultoria encontrada</p>
                        <p className="empty-state-desc">
                            {search ? 'Tente buscar com outros termos' : 'Registre suas consultorias para acompanhar o portfólio.'}
                        </p>
                        {!search && (
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={() => router.push('/backoffice/consultorias/nova')}
                                className="mt-4 flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold text-white"
                                style={{ background: T.accent }}
                            >
                                <Plus size={14} /> Nova Consultoria
                            </motion.button>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    )
}
