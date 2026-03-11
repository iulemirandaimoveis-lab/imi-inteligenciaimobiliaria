'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, TrendingUp, Phone, ChevronRight, BarChart2, Zap, ArrowUpRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'

const TEMP_COLORS = {
    hot:  { bg: 'rgba(255,49,49,0.15)',  text: '#FF3131', border: 'rgba(255,49,49,0.35)',  label: 'HOT'  },
    warm: { bg: 'rgba(255,215,0,0.14)',  text: '#FFD700', border: 'rgba(255,215,0,0.4)',   label: 'WARM' },
    cold: { bg: 'rgba(0,229,255,0.10)',  text: '#00E5FF', border: 'rgba(0,229,255,0.3)',   label: 'COLD' },
}

const SOURCE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    'google':     { bg: '#4285F4', text: '#fff', label: 'GOOGLE ADS'  },
    'google ads': { bg: '#4285F4', text: '#fff', label: 'GOOGLE ADS'  },
    'meta':       { bg: '#E1306C', text: '#fff', label: 'META ADS'    },
    'meta ads':   { bg: '#E1306C', text: '#fff', label: 'META ADS'    },
    'facebook':   { bg: '#1877F2', text: '#fff', label: 'FACEBOOK'    },
    'instagram':  { bg: '#C13584', text: '#fff', label: 'INSTAGRAM'   },
    'organic':    { bg: '#4ADE80', text: '#0F0F1E', label: 'ORGÂNICO' },
    'direct':     { bg: '#94A3B8', text: '#0F0F1E', label: 'DIRETO'   },
    'referral':   { bg: '#A78BFA', text: '#fff', label: 'INDICAÇÃO'   },
    'whatsapp':   { bg: '#25D366', text: '#fff', label: 'WHATSAPP'    },
}

function getTemp(status: string, score: number): 'hot' | 'warm' | 'cold' {
    if (status === 'hot' || status === 'qualified' || score >= 75) return 'hot'
    if (status === 'warm' || status === 'contacted' || status === 'proposal' || score >= 45) return 'warm'
    return 'cold'
}

function formatDuration(seconds: number): string {
    if (!seconds || seconds < 60) return `${seconds || 0}s`
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${String(s).padStart(2, '0')}s`
}

function timeAgo(iso: string | null): string {
    if (!iso) return ''
    const diff = Date.now() - new Date(iso).getTime()
    const d = Math.floor(diff / 86400000)
    const h = Math.floor(diff / 3600000)
    const m = Math.floor(diff / 60000)
    if (d > 0) return `${d}d`
    if (h > 0) return `${h}h`
    if (m > 0) return `${m}m`
    return 'agora'
}

type RangeKey = 'today' | '7d' | '30d'

export default function LeadBehaviorPage() {
    const router = useRouter()
    const [leads, setLeads] = useState<any[]>([])
    const [sessions, setSessions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [range, setRange] = useState<RangeKey>('7d')

    useEffect(() => {
        const supabase = createClient()
        const daysAgo = range === 'today' ? 1 : range === '7d' ? 7 : 30
        const since = new Date()
        since.setDate(since.getDate() - daysAgo)
        const sinceISO = since.toISOString()

        Promise.all([
            supabase.from('leads').select('*').gte('created_at', sinceISO).order('updated_at', { ascending: false }).limit(50),
            supabase.from('tracking_sessions').select('*').gte('started_at', sinceISO).eq('is_bot', false).order('started_at', { ascending: false }).limit(100),
        ]).then(([{ data: l }, { data: s }]) => {
            setLeads(l || [])
            setSessions(s || [])
            setLoading(false)
        })
    }, [range])

    // KPIs
    const activeLeads = leads.filter(l => l.status !== 'lost' && l.status !== 'won').length
    const convertedLeads = leads.filter(l => l.status === 'won').length
    const conversionRate = leads.length > 0 ? ((convertedLeads / leads.length) * 100).toFixed(1) : '0.0'

    // Source distribution
    const sourceMap: Record<string, number> = {}
    leads.forEach(l => {
        const src = (l.utm_source || l.source || 'direct').toLowerCase()
        sourceMap[src] = (sourceMap[src] || 0) + 1
    })
    const sourceData = Object.entries(sourceMap)
        .map(([src, count]) => ({
            src,
            count,
            pct: leads.length > 0 ? Math.round((count / leads.length) * 100) : 0,
            cfg: SOURCE_COLORS[src] || { bg: '#486581', text: '#fff', label: src.toUpperCase() },
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)

    // Top engaged leads (by score or recency)
    const topLeads = [...leads]
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 8)

    return (
        <div className="max-w-2xl mx-auto pb-28">

            {/* Header */}
            <PageIntelHeader
                moduleLabel="LEAD TRACKING"
                title="Behavior Analytics"
                subtitle="Análise comportamental e engajamento de leads"
                actions={
                    <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                        {(['today', '7d', '30d'] as RangeKey[]).map(r => (
                            <button
                                key={r}
                                onClick={() => { setLoading(true); setRange(r) }}
                                className="px-3 h-10 text-[10px] font-bold transition-colors"
                                style={{
                                    background: range === r ? T.accent : 'transparent',
                                    color: range === r ? '#fff' : T.textMuted,
                                }}
                            >
                                {r === 'today' ? 'Hoje' : r === '7d' ? '7d' : '30d'}
                            </button>
                        ))}
                    </div>
                }
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="rounded-2xl p-4"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.14)' }}>
                            <Users size={14} style={{ color: '#60A5FA' }} />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>
                            Leads Ativos
                        </span>
                    </div>
                    <p className="text-3xl font-black mb-1" style={{ color: T.text, letterSpacing: '-0.04em' }}>
                        {loading ? '—' : activeLeads}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#4ADE80' }}>
                        <ArrowUpRight size={11} />
                        +12% vs anterior
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
                    className="rounded-2xl p-4"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.14)' }}>
                            <TrendingUp size={14} style={{ color: '#4ADE80' }} />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>
                            Conversão
                        </span>
                    </div>
                    <p className="text-3xl font-black mb-1" style={{ color: T.text, letterSpacing: '-0.04em' }}>
                        {loading ? '—' : `${conversionRate}%`}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#4ADE80' }}>
                        <ArrowUpRight size={11} />
                        +5.4% vs anterior
                    </div>
                </motion.div>
            </div>

            {/* Recent High Engagement */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Zap size={14} style={{ color: '#FFD700' }} />
                        <h2 className="text-[13px] font-bold uppercase tracking-wider" style={{ color: T.text }}>
                            Maior Engajamento
                        </h2>
                    </div>
                    <button
                        onClick={() => router.push('/backoffice/leads')}
                        className="text-[10px] font-semibold flex items-center gap-0.5"
                        style={{ color: T.accent }}
                    >
                        Ver todos <ChevronRight size={11} />
                    </button>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse rounded-2xl h-24" style={{ background: T.elevated, opacity: 1 - i * 0.25 }} />
                        ))}
                    </div>
                ) : topLeads.length === 0 ? (
                    <div className="flex flex-col items-center py-12 gap-2">
                        <BarChart2 size={28} style={{ color: T.textMuted, opacity: 0.3 }} />
                        <p className="text-sm" style={{ color: T.textMuted }}>Nenhum dado no período</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {topLeads.map((lead, i) => {
                            const temp = getTemp(lead.status, lead.score || 0)
                            const tc = TEMP_COLORS[temp]
                            const srcKey = (lead.utm_source || lead.source || 'direct').toLowerCase()
                            const srcIcon = srcKey.includes('google') ? '🔍' : srcKey.includes('meta') || srcKey.includes('facebook') ? '📘' : srcKey.includes('instagram') ? '📸' : srcKey.includes('whatsapp') ? '💬' : '🌐'

                            return (
                                <motion.div
                                    key={lead.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <button
                                        onClick={() => router.push(`/backoffice/leads/${lead.id}`)}
                                        className="w-full text-left rounded-2xl p-4 transition-all hover:scale-[1.005]"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}`, display: 'block' }}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {/* Avatar */}
                                                <div
                                                    className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-sm"
                                                    style={{ background: `linear-gradient(135deg, ${tc.bg}, rgba(255,255,255,0.05))`, border: `1px solid ${tc.border}`, color: tc.text }}
                                                >
                                                    {lead.name?.split(' ').slice(0, 2).map((n: string) => n[0]).join('') || '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm truncate" style={{ color: T.text }}>
                                                        {lead.name}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span
                                                            className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase"
                                                            style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}
                                                        >
                                                            {tc.label}
                                                        </span>
                                                        <span className="text-[10px]" style={{ color: T.textMuted }}>
                                                            {timeAgo(lead.updated_at || lead.created_at)} atrás
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* AI Score */}
                                            {(lead.score ?? 0) > 0 && (
                                                <div className="flex-shrink-0 text-right">
                                                    <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>AI Score</p>
                                                    <p className="text-lg font-black" style={{ color: tc.text }}>
                                                        {lead.score}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="grid grid-cols-2 gap-2 mt-3 pt-2" style={{ borderTop: `1px solid ${T.border}` }}>
                                            {lead.interest && (
                                                <div>
                                                    <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: T.textMuted }}>Interesse</p>
                                                    <p className="text-[11px] font-semibold truncate" style={{ color: T.text }}>{lead.interest}</p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: T.textMuted }}>Origem</p>
                                                <p className="text-[11px] font-semibold flex items-center gap-1" style={{ color: T.text }}>
                                                    {srcIcon} {lead.utm_source || lead.source || 'Direto'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Contact button */}
                                        {lead.phone && (
                                            <div className="flex justify-end mt-2">
                                                <a
                                                    href={`https://wa.me/55${(lead.phone).replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={e => e.stopPropagation()}
                                                    className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
                                                    style={{ background: 'rgba(37,211,102,0.14)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366' }}
                                                >
                                                    <Phone size={10} /> Contato
                                                </a>
                                            </div>
                                        )}
                                    </button>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Traffic Distribution */}
            {!loading && sourceData.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-2xl p-5"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart2 size={14} style={{ color: T.accent }} />
                        <h2 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: T.text }}>
                            Distribuição por Origem
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {sourceData.map((item, i) => (
                            <div key={item.src}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold" style={{ color: T.text }}>
                                        {item.cfg.label}
                                    </span>
                                    <span className="text-xs font-black" style={{ color: T.text }}>
                                        {item.pct}%
                                    </span>
                                </div>
                                <div className="h-7 rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.pct}%` }}
                                        transition={{ delay: 0.35 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
                                        className="h-full rounded-xl flex items-center px-3"
                                        style={{ background: item.cfg.bg, minWidth: item.pct > 0 ? 40 : 0 }}
                                    >
                                        <span className="text-[10px] font-black" style={{ color: item.cfg.text }}>
                                            {item.count} leads
                                        </span>
                                    </motion.div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    )
}
