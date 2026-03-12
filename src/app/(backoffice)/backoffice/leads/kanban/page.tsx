'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Filter, Plus, Clock, ChevronRight, Zap, TrendingUp, BarChart3, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { T } from '@/app/(backoffice)/lib/theme'
import { getStatusConfig } from '@/app/(backoffice)/lib/constants'
import { PageIntelHeader, KPICard } from '@/app/(backoffice)/components/ui'

const supabase = createClient()

// ── Pipeline stage config (derived from centralized constants) ─────
const STAGES = [
    { key: 'novo',        label: 'NOVO LEAD' },
    { key: 'contatado',   label: 'CONTATADO' },
    { key: 'qualificado', label: 'QUALIFICADO' },
    { key: 'proposta',    label: 'PROPOSTA' },
    { key: 'negociacao',  label: 'NEGOCIAÇÃO' },
    { key: 'ganho',       label: 'GANHO' },
].map(s => ({ ...s, dot: getStatusConfig(s.key).dot, border: getStatusConfig(s.key).dot, count: 0 }))

// Map DB status → pipeline stage
function toStage(status: string): string {
    if (!status) return 'novo'
    const s = status.toLowerCase()
    if (s === 'new' || s === 'novo') return 'novo'
    if (s === 'contacted' || s === 'contatado' || s === 'cold') return 'contatado'
    if (s === 'warm' || s === 'qualified' || s === 'qualificado') return 'qualificado'
    if (s === 'proposal' || s === 'proposta') return 'proposta'
    if (s === 'hot' || s === 'negociacao') return 'negociacao'
    if (s === 'won' || s === 'ganho') return 'ganho'
    return 'novo'
}

function formatBudget(v: number | null): string | null {
    if (!v) return null
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
    if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`
    return `R$ ${v.toLocaleString('pt-BR')}`
}

function getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function timeAgo(iso: string | null): string {
    if (!iso) return ''
    const diff = Date.now() - new Date(iso).getTime()
    const h = Math.floor(diff / 3600000)
    const m = Math.floor(diff / 60000)
    const d = Math.floor(diff / 86400000)
    if (d > 0) return `${d}d atrás`
    if (h > 0) return `${h}h atrás`
    if (m > 0) return `${m}min`
    return 'agora'
}

function urgencyBadge(lead: any): { label: string; color: string; bg: string } | null {
    const score = lead.score || 0
    const status = (lead.status || '').toLowerCase()
    if (score >= 85 || status === 'hot') return { label: 'URGENTE', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' }
    if (score >= 60 || status === 'warm') return { label: 'QUENTE', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' }
    return { label: 'NORMAL', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' }
}

// ── Card component ────────────────────────────────────────────────
function LeadCard({ lead, stageColor }: { lead: any; stageColor: string }) {
    const badge = urgencyBadge(lead)
    const budget = formatBudget(lead.capital || lead.budget)
    const initials = getInitials(lead.name || '?')

    return (
        <Link href={`/backoffice/leads/${lead.id}`} style={{ textDecoration: 'none', display: 'block' }}>
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                style={{
                    background: 'var(--bo-elevated)',
                    borderRadius: 16,
                    padding: '14px 14px 12px',
                    borderLeft: `3px solid ${stageColor}`,
                    border: `1px solid var(--bo-border)`,
                    borderLeftWidth: 3,
                    borderLeftColor: stageColor,
                    cursor: 'pointer',
                    marginBottom: 8,
                }}
            >
                {/* Name + urgency */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--bo-text)', lineHeight: 1.2 }}>
                        {lead.name}
                    </p>
                    {badge && (
                        <span style={{
                            fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                            padding: '3px 7px', borderRadius: 6,
                            color: badge.color, background: badge.bg,
                            flexShrink: 0, whiteSpace: 'nowrap',
                        }}>
                            {badge.label}
                        </span>
                    )}
                </div>

                {/* Interest */}
                {(lead.interest || lead.development?.name) && (
                    <p style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--bo-text-muted)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.interest || lead.development?.name}
                    </p>
                )}

                {/* Budget */}
                {budget && (
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#D4A929', marginBottom: 10, letterSpacing: '-0.3px' }}>
                        {budget}
                    </p>
                )}

                {/* Footer: time + avatar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={11} style={{ color: 'var(--bo-text-muted)' }} />
                        <span style={{ fontSize: 11, color: 'var(--bo-text-muted)' }}>
                            {timeAgo(lead.created_at)}
                        </span>
                    </div>
                    <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--bo-accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em',
                    }}>
                        {initials}
                    </div>
                </div>
            </motion.div>
        </Link>
    )
}

// ── Main ──────────────────────────────────────────────────────────
export default function PipelineKanbanPage() {
    const [leads, setLeads] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [busca, setBusca] = useState('')
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        supabase
            .from('leads')
            .select('*, development:developments(name)')
            .order('created_at', { ascending: false })
            .limit(200)
            .then(({ data }) => {
                setLeads(data || [])
                setLoading(false)
            })
    }, [])

    // Group leads by stage
    const filteredLeads = leads.filter(l =>
        !busca || l.name?.toLowerCase().includes(busca.toLowerCase())
    )

    const byStage = STAGES.reduce<Record<string, any[]>>((acc, s) => {
        acc[s.key] = filteredLeads.filter(l => toStage(l.status) === s.key)
        return acc
    }, {})

    // KPIs
    const totalBudget = leads.reduce((sum, l) => sum + (l.capital || l.budget || 0), 0)
    const totalLeads = leads.length
    const ganhoCount = byStage['ganho']?.length || 0

    const formatTotal = (v: number) => {
        if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
        if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`
        return `R$ ${v.toLocaleString('pt-BR')}`
    }

    return (
        <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* ── Header ── */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                style={{ paddingBottom: 16, flexShrink: 0 }}>
                <PageIntelHeader
                    moduleLabel="CRM · FUNIL DE VENDAS"
                    title="Pipeline Comercial"
                    subtitle={`${totalLeads} leads ativos — potencial total ${formatTotal(totalBudget)}`}
                    actions={
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Link href="/backoffice/campanhas/ads" style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                height: 36, padding: '0 14px', borderRadius: 10,
                                background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)',
                                color: 'var(--bo-text-muted)', fontSize: 12, fontWeight: 600, textDecoration: 'none',
                            }}>
                                <BarChart3 size={13} /> Ads
                            </Link>
                            <Link href="/backoffice/leads/novo" style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                height: 36, padding: '0 16px', borderRadius: 10,
                                background: 'var(--bo-accent)',
                                color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                            }}>
                                <Plus size={14} /> Novo Lead
                            </Link>
                        </div>
                    }
                />

                {/* KPI strip */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <KPICard label="Negociações" value={loading ? '—' : formatTotal(totalBudget)} icon={<TrendingUp size={13} />} accent="blue" size="sm" />
                    <KPICard label="Total Leads" value={loading ? '—' : String(totalLeads)} icon={<Users size={13} />} size="sm" />
                    <KPICard label="Fechamentos" value={loading ? '—' : String(ganhoCount).padStart(2, '0')} icon={<Zap size={13} />} accent="green" size="sm" />
                </div>

                {/* Search */}
                <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--bo-text-muted)' }} />
                    <input
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        placeholder="Buscar lead no pipeline..."
                        style={{
                            width: '100%', height: 42, paddingLeft: 36, paddingRight: 40,
                            borderRadius: 12, background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)',
                            color: 'var(--bo-text)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                        }}
                    />
                    <button style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Filter size={14} style={{ color: 'var(--bo-text-muted)' }} />
                    </button>
                </div>
            </motion.div>

            {/* ── Kanban Board (horizontal scroll) ── */}
            <div
                ref={scrollRef}
                style={{
                    display: 'flex', gap: 14, overflowX: 'auto', overflowY: 'hidden',
                    paddingBottom: 16, flex: 1, alignItems: 'flex-start',
                    scrollbarWidth: 'none',
                }}
                className="hide-scrollbar"
            >
                {STAGES.map((stage, si) => {
                    const stageLeads = byStage[stage.key] || []
                    return (
                        <motion.div
                            key={stage.key}
                            initial={{ opacity: 0, x: si * 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: si * 0.06 }}
                            style={{
                                width: 280, minWidth: 280, flexShrink: 0,
                                display: 'flex', flexDirection: 'column', gap: 0,
                            }}
                        >
                            {/* Column header */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                                padding: '8px 4px',
                            }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.dot, flexShrink: 0, boxShadow: `0 0 8px ${stage.dot}60` }} />
                                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--bo-text)', letterSpacing: '0.1em', textTransform: 'uppercase', flex: 1 }}>
                                    {stage.label}
                                </span>
                                <span style={{
                                    minWidth: 22, height: 22, borderRadius: '50%',
                                    background: `${stage.dot}20`, border: `1px solid ${stage.dot}40`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 10, fontWeight: 800, color: stage.dot,
                                }}>
                                    {stageLeads.length}
                                </span>
                                <button
                                    style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => {}}
                                >
                                    <Plus size={12} style={{ color: 'var(--bo-text-muted)' }} />
                                </button>
                            </div>

                            {/* Cards container */}
                            <div style={{
                                background: `color-mix(in srgb, ${stage.dot}06, var(--bo-surface))`,
                                border: `1px solid color-mix(in srgb, ${stage.dot}20, var(--bo-border))`,
                                borderTop: `2px solid ${stage.dot}40`,
                                borderRadius: 16, padding: 10,
                                minHeight: 120,
                                maxHeight: 'calc(100vh - 320px)',
                                overflowY: 'auto',
                                scrollbarWidth: 'thin',
                            }}>
                                {loading ? (
                                    <div style={{ padding: '20px 0', textAlign: 'center' }}>
                                        <div style={{ width: '100%', height: 60, borderRadius: 12, background: 'var(--bo-elevated)', opacity: 0.5, marginBottom: 8 }} />
                                        <div style={{ width: '100%', height: 60, borderRadius: 12, background: 'var(--bo-elevated)', opacity: 0.3 }} />
                                    </div>
                                ) : stageLeads.length > 0 ? (
                                    stageLeads.map(lead => (
                                        <LeadCard key={lead.id} lead={lead} stageColor={stage.dot} />
                                    ))
                                ) : (
                                    <div style={{ padding: '24px 8px', textAlign: 'center' }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${stage.dot}10`, border: `1px dashed ${stage.dot}40`, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Plus size={14} style={{ color: stage.dot, opacity: 0.5 }} />
                                        </div>
                                        <p style={{ fontSize: 11, color: 'var(--bo-text-muted)', opacity: 0.6 }}>Sem leads</p>
                                    </div>
                                )}
                            </div>

                            {/* Column total budget */}
                            {stageLeads.length > 0 && (
                                <div style={{ padding: '6px 4px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 9, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#D4A929' }}>
                                        {formatTotal(stageLeads.reduce((s, l) => s + (l.capital || l.budget || 0), 0))}
                                    </span>
                                </div>
                            )}
                        </motion.div>
                    )
                })}
            </div>

            {/* ── AI insight strip ── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    background: 'linear-gradient(135deg, rgba(72,101,129,0.15), rgba(51,78,104,0.08))',
                    borderRadius: 14, border: '1px solid rgba(72,101,129,0.2)',
                    marginTop: 8, flexShrink: 0,
                }}
            >
                <Zap size={16} style={{ color: '#486581', flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: 'var(--bo-text-muted)', flex: 1, lineHeight: 1.4 }}>
                    <span style={{ color: 'var(--bo-text)', fontWeight: 600 }}>IA Pipeline:</span> {
                        !loading && leads.length > 0
                            ? `${byStage['negociacao']?.length || 0} leads em negociação, com potencial total de ${formatTotal(byStage['negociacao']?.reduce((s, l) => s + (l.capital || 0), 0) || 0)}.`
                            : 'Carregando análise do pipeline...'
                    }
                </p>
                <Link href="/backoffice/leads" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#486581', textDecoration: 'none', flexShrink: 0 }}>
                    Ver todos <ChevronRight size={12} />
                </Link>
            </motion.div>
        </div>
    )
}
