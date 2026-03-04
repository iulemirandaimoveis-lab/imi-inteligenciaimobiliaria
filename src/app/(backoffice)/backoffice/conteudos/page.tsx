'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Plus, FileText, Calendar, Instagram, Facebook,
    Linkedin, Mail, Sparkles, Eye, Clock, TrendingUp,
    BarChart3, Search, CheckCircle2, Edit3,
} from 'lucide-react'

// ── Theme tokens ──────────────────────────────────────────────
const T = {
    surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)', textDim: 'var(--bo-text-muted)',
    gold: '#486581',
}

interface Conteudo {
    id: string
    titulo: string
    tipo: string
    plataforma: string
    status: string
    data_publicacao: string
    visualizacoes: number
    engajamento: number
    created_at: string
}

const STATUS_CFG: Record<string, { l: string; text: string; bg: string }> = {
    publicado:  { l: 'Publicado',  text: '#6BB87B', bg: 'rgba(107,184,123,0.12)' },
    agendado:   { l: 'Agendado',   text: '#E8A87C', bg: 'rgba(232,168,124,0.12)' },
    rascunho:   { l: 'Rascunho',   text: '#7B9EC4', bg: 'rgba(123,158,196,0.12)' },
    arquivado:  { l: 'Arquivado',  text: '#7B7B9C', bg: 'rgba(123,123,156,0.12)' },
}

const TIPO_ICON: Record<string, any> = {
    blog: FileText, email: Mail, social: Instagram,
    video: Eye, newsletter: Mail,
}

const PLATAFORMA_ICON: Record<string, any> = {
    instagram: Instagram, facebook: Facebook, linkedin: Linkedin,
    email: Mail, website: FileText,
}

export default function ConteudosPage() {
    const router = useRouter()
    const [conteudos, setConteudos] = useState<Conteudo[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('todos')

    useEffect(() => {
        fetch('/api/conteudos')
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setConteudos(data) })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const filtered = conteudos.filter(c => {
        const q = search.toLowerCase()
        const matchSearch = (c.titulo || '').toLowerCase().includes(q) ||
            (c.plataforma || '').toLowerCase().includes(q)
        const matchStatus = statusFilter === 'todos' || c.status === statusFilter
        return matchSearch && matchStatus
    })

    const stats = {
        total: conteudos.length,
        publicados: conteudos.filter(c => c.status === 'publicado').length,
        agendados: conteudos.filter(c => c.status === 'agendado').length,
        totalViews: conteudos.reduce((a, c) => a + (c.visualizacoes || 0), 0),
    }

    if (loading) {
        return (
            <div className="space-y-5 max-w-7xl mx-auto">
                <div className="flex items-start justify-between gap-4">
                    <div><div className="skeleton h-6 w-40 mb-2" /><div className="skeleton h-4 w-56" /></div>
                    <div className="skeleton h-10 w-36 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton-card p-4"><div className="skeleton h-3 w-20 mb-3" /><div className="skeleton h-6 w-16" /></div>
                    ))}
                </div>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton-card p-4 flex gap-3">
                        <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                        <div className="flex-1"><div className="skeleton h-4 w-48 mb-2" /><div className="skeleton h-3 w-32" /></div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-5 max-w-7xl mx-auto">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>Conteúdo & Marketing</h1>
                    <p className="text-sm mt-0.5" style={{ color: T.textDim }}>Editorial omnichannel com IA</p>
                </div>
                <div className="flex items-center gap-2">
                    <motion.button whileTap={{ scale: 0.96 }}
                        onClick={() => router.push('/backoffice/conteudos/ia')}
                        className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold flex-shrink-0 transition-all"
                        style={{ background: T.elevated, border: `1px solid ${T.borderGold}`, color: T.gold }}>
                        <Sparkles size={15} /> Gerar com IA
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.96 }}
                        onClick={() => router.push('/backoffice/conteudos/novo')}
                        className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                        style={{ background: T.gold }}>
                        <Plus size={15} /> Novo
                    </motion.button>
                </div>
            </motion.div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { l: 'Total Editorial', v: stats.total, icon: FileText, color: T.gold },
                    { l: 'Publicados', v: stats.publicados, icon: CheckCircle2, color: '#6BB87B' },
                    { l: 'Agendados', v: stats.agendados, icon: Clock, color: '#E8A87C' },
                    { l: 'Visualizações', v: stats.totalViews > 1000 ? `${(stats.totalViews / 1000).toFixed(1)}k` : stats.totalViews, icon: TrendingUp, color: '#7B9EC4' },
                ].map((kpi, i) => {
                    const Icon = kpi.icon
                    return (
                        <motion.div key={kpi.l}
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="rounded-2xl p-4"
                            style={{ background: T.elevated, border: `1px solid ${T.borderGold}` }}>
                            <p className="text-xs font-medium mb-1" style={{ color: T.textSub }}>{kpi.l}</p>
                            <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.v}</p>
                        </motion.div>
                    )
                })}
            </div>

            {/* Filtros */}
            <div className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: T.textDim }} />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por título ou plataforma…"
                            className="w-full h-10 pl-9 pr-4 rounded-xl text-sm outline-none"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text, caretColor: T.gold }}
                            onFocus={e => (e.currentTarget.style.border = `1px solid ${T.borderGold}`)}
                            onBlur={e => (e.currentTarget.style.border = `1px solid ${T.border}`)} />
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto flex-shrink-0">
                        {['todos', 'publicado', 'agendado', 'rascunho'].map(s => (
                            <button key={s} onClick={() => setStatusFilter(s)}
                                className="px-3.5 h-10 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
                                style={{
                                    background: statusFilter === s ? (s === 'todos' ? T.gold : STATUS_CFG[s]?.bg || T.elevated) : T.elevated,
                                    color: statusFilter === s ? (s === 'todos' ? 'white' : STATUS_CFG[s]?.text || T.textSub) : T.textDim,
                                    border: `1px solid ${statusFilter === s ? T.borderGold : T.border}`,
                                }}>
                                {s === 'todos' ? 'Todos' : STATUS_CFG[s]?.l}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lista */}
            <div className="space-y-2">
                {filtered.map((c, i) => {
                    const stt = STATUS_CFG[c.status] || { l: c.status, text: T.textSub, bg: T.elevated }
                    const TipoIcon = TIPO_ICON[c.tipo] || FileText
                    const PlataformaIcon = PLATAFORMA_ICON[c.plataforma] || FileText
                    return (
                        <motion.div key={c.id}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="rounded-2xl cursor-pointer transition-all hover-card"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                            onClick={() => router.push(`/backoffice/conteudos/${c.id}`)}
>
                            <div className="flex items-center gap-4 p-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'rgba(72,101,129,0.12)' }}>
                                    <TipoIcon size={18} style={{ color: T.gold }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                            style={{ color: stt.text, background: stt.bg }}>{stt.l}</span>
                                        <span className="text-[10px] flex items-center gap-1" style={{ color: T.textDim }}>
                                            <PlataformaIcon size={10} /> {c.plataforma}
                                        </span>
                                    </div>
                                    <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{c.titulo}</p>
                                    {c.data_publicacao && (
                                        <p className="text-[11px] mt-0.5" style={{ color: T.textDim }}>
                                            {new Date(c.data_publicacao).toLocaleDateString('pt-BR')}
                                        </p>
                                    )}
                                </div>
                                {(c.visualizacoes > 0 || c.engajamento > 0) && (
                                    <div className="hidden sm:flex items-center gap-4 text-right flex-shrink-0">
                                        <div>
                                            <p className="text-xs font-bold" style={{ color: T.text }}>{c.visualizacoes}</p>
                                            <p className="text-[10px]" style={{ color: T.textDim }}>views</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold" style={{ color: T.gold }}>{c.engajamento}</p>
                                            <p className="text-[10px]" style={{ color: T.textDim }}>engaj.</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                                    <motion.button whileTap={{ scale: 0.9 }}
                                        onClick={() => router.push(`/backoffice/conteudos/${c.id}`)}
                                        className="h-7 px-3 rounded-lg text-[11px] font-medium flex items-center gap-1"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textSub }}>
                                        <Eye size={11} /> Ver
                                    </motion.button>
                                    <motion.button whileTap={{ scale: 0.9 }}
                                        onClick={() => router.push(`/backoffice/conteudos/${c.id}/editar`)}
                                        className="h-7 px-3 rounded-lg text-[11px] font-medium flex items-center gap-1"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textSub }}>
                                        <Edit3 size={11} /> Editar
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}

                {filtered.length === 0 && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl overflow-hidden"
                        style={{ background: T.elevated, border: `1px solid ${T.borderGold}` }}>
                        <div className="p-10 text-center">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                style={{ background: 'rgba(72,101,129,0.12)' }}>
                                <Sparkles size={28} style={{ color: T.gold }} />
                            </div>
                            <p className="text-base font-bold mb-1" style={{ color: T.text }}>
                                {search ? 'Nenhum conteúdo encontrado' : 'Pipeline editorial vazio'}
                            </p>
                            <p className="text-sm mb-6" style={{ color: T.textDim }}>
                                {search ? 'Tente outros termos' : 'Use a IA para gerar conteúdo de alta conversão para o mercado imobiliário.'}
                            </p>
                            {!search && (
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                    {[
                                        { label: 'Post Social', icon: Instagram, href: '/backoffice/conteudos/ia?type=instagram' },
                                        { label: 'Newsletter', icon: Mail, href: '/backoffice/conteudos/ia?type=email' },
                                        { label: 'Artigo SEO', icon: FileText, href: '/backoffice/conteudos/ia?type=blog' },
                                    ].map(item => {
                                        const Icon = item.icon
                                        return (
                                            <motion.button key={item.label} whileTap={{ scale: 0.96 }}
                                                onClick={() => router.push(item.href)}
                                                className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white"
                                                style={{ background: T.gold }}>
                                                <Icon size={15} /> {item.label}
                                            </motion.button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* IA Strategist Banner */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
                style={{ background: T.elevated, border: `1px solid ${T.borderGold}` }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(72,101,129,0.15)' }}>
                        <Sparkles size={22} style={{ color: T.gold }} />
                    </div>
                    <div>
                        <p className="text-sm font-bold" style={{ color: T.text }}>Content AI Strategist</p>
                        <p className="text-xs mt-0.5" style={{ color: T.textDim }}>
                            Gere conteúdo otimizado para Real Estate & Family Office em segundos.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                    {[
                        { l: 'Instagram', icon: Instagram, type: 'instagram' },
                        { l: 'Newsletter', icon: Mail, type: 'email' },
                        { l: 'Blog SEO', icon: FileText, type: 'blog' },
                    ].map(item => {
                        const Icon = item.icon
                        return (
                            <motion.button key={item.l} whileTap={{ scale: 0.96 }}
                                onClick={() => router.push(`/backoffice/conteudos/ia?type=${item.type}`)}
                                className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-semibold transition-all hover-card"
                                style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textSub }}
>
                                <Icon size={13} /> {item.l}
                            </motion.button>
                        )
                    })}
                </div>
            </motion.div>
        </div>
    )
}
