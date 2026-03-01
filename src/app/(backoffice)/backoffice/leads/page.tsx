'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Search, Plus, Mail, Phone, MapPin, Building2,
    DollarSign, Star, MoreVertical, Eye, Edit, Trash2,
    Users, TrendingUp, Filter,
} from 'lucide-react'

// ── Tokens ─────────────────────────────────────────────────────
const T = {
    bg: 'transparent', surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)', textDim: 'var(--bo-text-muted)',
    gold: '#486581',
}

// No fallback mock — real Supabase data only

interface Lead {
    id: any;
    name: string;
    email: string;
    phone: string;
    score: number;
    status: string;
    source: string;
    interest: string;
    location: string;
    budget?: string;
    created: string;
    lastContact: string;
}

const STATUS_CFG: Record<string, { label: string; text: string; bg: string }> = {
    hot: { label: 'Quente', text: '#E8A87C', bg: 'rgba(232,168,124,0.12)' },
    warm: { label: 'Morno', text: '#486581', bg: 'rgba(26,26,46,0.12)' },
    cold: { label: 'Frio', text: '#7B9EC4', bg: 'rgba(123,158,196,0.12)' },
}

const scoreColor = (s: number) =>
    s >= 85 ? '#6BB87B' : s >= 70 ? '#486581' : '#7B9EC4'

const timeAgo = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
    if (diff < 60) return `${diff}min`
    if (diff < 1440) return `${Math.floor(diff / 60)}h`
    return `${Math.floor(diff / 1440)}d`
}

function StatCard({ label, value, color, index = 0 }: { label: string; value: number; color?: string; index?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.35 }}
            className="stat-card rounded-2xl p-4"
            style={{
                background: T.elevated,
                border: `1px solid ${T.borderGold}`,
            }}
        >
            <p className="text-xs font-medium mb-1" style={{ color: color || T.textSub }}>{label}</p>
            <p className="text-2xl font-bold" style={{ color: color || T.text }}>{value}</p>
        </motion.div>
    )
}

export default function LeadsPage() {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all')
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const res = await fetch('/api/leads')
                if (res.ok) {
                    const data = await res.json()
                    // Transform DB leads to UI expected format (if valid array)
                    if (Array.isArray(data) && data.length > 0) {
                        const formatted = data.map((l: any) => ({
                            id: l.id,
                            name: l.name || 'Sem nome',
                            email: l.email || '',
                            phone: l.phone || '',
                            score: l.score || 50,
                            status: l.status || 'warm',
                            source: l.source || 'Site',
                            interest: l.interest || '-',
                            location: l.city || 'Desconhecido',
                            budget: 'N/A',
                            created: l.created_at || new Date().toISOString(),
                            lastContact: l.updated_at || new Date().toISOString()
                        }))
                        setLeads(formatted)
                        return
                    }
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
            setLeads([])
        }
        fetchLeads()
    }, [])

    const stats = {
        total: leads.length,
        hot: leads.filter(l => l.status === 'hot').length,
        warm: leads.filter(l => l.status === 'warm').length,
        cold: leads.filter(l => l.status === 'cold').length,
        avg: leads.length > 0 ? Math.round(leads.reduce((a, l) => a + l.score, 0) / leads.length) : 0,
    }

    const filtered = leads.filter(l => {
        const q = search.toLowerCase()
        const matchSearch = l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.phone.includes(q)
        const matchFilter = filter === 'all' || l.status === filter
        return matchSearch && matchFilter
    })

    if (loading) {
        return (
            <div className="space-y-5 max-w-7xl mx-auto">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="skeleton h-6 w-24 mb-2" />
                        <div className="skeleton h-4 w-48" />
                    </div>
                    <div className="skeleton h-10 w-32 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="skeleton-card p-4" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="skeleton h-3 w-16 mb-3" />
                            <div className="skeleton lg h-6 w-12" />
                        </div>
                    ))}
                </div>
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton-card p-4 flex items-center gap-3" style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="skeleton-circle w-10 h-10 flex-shrink-0" />
                        <div className="flex-1">
                            <div className="skeleton h-4 w-36 mb-2" />
                            <div className="skeleton h-3 w-48" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-5 max-w-7xl mx-auto">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-between gap-4"
            >
                <div>
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>Leads</h1>
                    <p className="text-sm mt-0.5" style={{ color: T.textDim }}>Gerencie seu pipeline de oportunidades</p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => router.push('/backoffice/leads/novo')}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                    style={{ background: '#486581', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                >
                    <Plus size={16} /> Novo Lead
                </motion.button>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <StatCard label="Total" value={stats.total} index={0} />
                <StatCard label="Quentes" value={stats.hot} color={STATUS_CFG.hot.text} index={1} />
                <StatCard label="Mornos" value={stats.warm} color={STATUS_CFG.warm.text} index={2} />
                <StatCard label="Frios" value={stats.cold} color={STATUS_CFG.cold.text} index={3} />
                <StatCard label="Score Médio" value={stats.avg} index={4} />
            </div>

            {/* Filters */}
            <div
                className="rounded-2xl p-4"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: T.textDim }} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, email ou telefone..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full h-10 pl-9 pr-4 rounded-xl text-sm outline-none transition-all"
                            style={{
                                background: T.elevated,
                                border: `1px solid ${T.border}`,
                                color: T.text,
                                caretColor: T.gold,
                            }}
                            onFocus={e => (e.currentTarget.style.border = `1px solid ${T.borderGold}`)}
                            onBlur={e => (e.currentTarget.style.border = `1px solid ${T.border}`)}
                        />
                    </div>

                    {/* Filter tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto flex-shrink-0 pb-0.5">
                        {['all', 'hot', 'warm', 'cold'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className="px-3.5 h-10 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
                                style={{
                                    background: filter === s
                                        ? (s === 'all' ? '#486581' : STATUS_CFG[s]?.bg || T.elevated)
                                        : T.elevated,
                                    color: filter === s
                                        ? (s === 'all' ? 'white' : STATUS_CFG[s]?.text || T.textSub)
                                        : T.textDim,
                                    border: `1px solid ${filter === s ? T.borderGold : T.border}`,
                                }}
                            >
                                {s === 'all' ? 'Todos' : STATUS_CFG[s]?.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lead Cards */}
            <div className="space-y-2">
                {filtered.map((lead, i) => {
                    const sc = STATUS_CFG[lead.status]
                    return (
                        <motion.div
                            key={lead.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="rounded-2xl cursor-pointer transition-all"
                            style={{
                                background: T.surface,
                                border: `1px solid ${T.border}`,
                            }}
                            onClick={() => router.push(`/backoffice/leads/${lead.id}`)}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.border = `1px solid ${T.borderGold}`
                                    ; (e.currentTarget as HTMLElement).style.background = T.elevated
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.border = `1px solid ${T.border}`
                                    ; (e.currentTarget as HTMLElement).style.background = T.surface
                            }}
                        >
                            <div className="flex items-center gap-3 p-4">
                                {/* Avatar */}
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                                    style={{ background: 'rgba(26,26,46,0.15)', color: T.gold }}
                                >
                                    {lead.name.charAt(0)}
                                </div>

                                {/* Main info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="text-sm font-semibold truncate" style={{ color: T.text }}>
                                            {lead.name}
                                        </p>
                                        <span
                                            className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                                            style={{ color: sc.text, background: sc.bg }}
                                        >
                                            {sc.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="text-[11px] flex items-center gap-1 truncate" style={{ color: T.textDim }}>
                                            <MapPin size={10} className="flex-shrink-0" /> <span className="truncate">{lead.location}</span>
                                        </span>
                                        <span className="text-[11px] truncate hidden xs:inline" style={{ color: T.textDim }}>
                                            {lead.interest}
                                        </span>
                                        <span className="text-[11px] truncate hidden sm:inline" style={{ color: T.textDim }}>
                                            {lead.source}
                                        </span>
                                    </div>
                                </div>

                                {/* Score */}
                                <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                                    <div className="text-right">
                                        <p className="text-xs font-bold" style={{ color: scoreColor(lead.score) }}>
                                            {lead.score}
                                        </p>
                                        <p className="text-[10px]" style={{ color: T.textDim }}>score</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-semibold" style={{ color: T.textSub }}>
                                            {timeAgo(lead.lastContact)}
                                        </p>
                                        <p className="text-[10px]" style={{ color: T.textDim }}>contato</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={e => { e.stopPropagation(); window.location.href = `tel:${lead.phone}` }}
                                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                                        style={{ background: 'transparent' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = T.elevated)}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <Phone size={13} style={{ color: T.textDim }} />
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={e => { e.stopPropagation(); window.location.href = `mailto:${lead.email}` }}
                                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                                        style={{ background: 'transparent' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = T.elevated)}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <Mail size={13} style={{ color: T.textDim }} />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {filtered.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="empty-state rounded-2xl"
                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                >
                    <div className="empty-state-icon">
                        <Users size={24} />
                    </div>
                    <p className="empty-state-title">Nenhum lead encontrado</p>
                    <p className="empty-state-desc">
                        {search ? 'Tente buscar com outros termos' : 'Seu pipeline está vazio. Comece adicionando novos leads.'}
                    </p>
                    {!search && (
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={() => router.push('/backoffice/leads/novo')}
                            className="mt-4 flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold text-white"
                            style={{ background: '#486581' }}
                        >
                            <Plus size={14} /> Novo Lead
                        </motion.button>
                    )}
                </motion.div>
            )}
        </div>
    )
}
