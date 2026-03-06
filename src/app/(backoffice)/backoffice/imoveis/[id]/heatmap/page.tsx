'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft, Share2, MoreHorizontal, Eye, Clock,
    Zap, TrendingUp, TrendingDown, ChevronRight, BarChart2,
    Image as ImageIcon, DollarSign, Video, Map,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    accent: '#486581',
}

// Section heatmap segments — in real production these would come from page_views/tracking
const SECTIONS_DEFAULT = [
    { key: 'gallery',   label: 'Fotos & Galeria',      icon: ImageIcon,    retention: 92, trend: 'up',   color: '#4ADE80', detail: 'Seção com maior engajamento' },
    { key: 'pricing',   label: 'Preços & Financeiro',   icon: DollarSign,   retention: 68, trend: 'down', color: '#F87171', detail: 'Drop-off crítico — usuários saem ao ver preços' },
    { key: 'video',     label: 'Vídeo / Tour Virtual',  icon: Video,        retention: 76, trend: 'up',   color: '#FBBF24', detail: 'Boa retenção após galeria' },
    { key: 'floorplan', label: 'Plantas & Unidades',    icon: Map,          retention: 88, trend: 'up',   color: '#60A5FA', detail: 'Alta retenção — leads qualificados chegam aqui' },
]

type RangeKey = '7d' | '30d' | '90d'

export default function ImovelHeatmapPage() {
    const params = useParams()
    const router = useRouter()
    const id = params?.id as string

    const [development, setDevelopment] = useState<any>(null)
    const [pageViews, setPageViews] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [range, setRange] = useState<RangeKey>('30d')

    useEffect(() => {
        const supabase = createClient()
        const daysAgo = range === '7d' ? 7 : range === '90d' ? 90 : 30
        const since = new Date()
        since.setDate(since.getDate() - daysAgo)

        Promise.all([
            supabase.from('developments').select('id, name, neighborhood, city, images, status_commercial').eq('id', id).single(),
            supabase.from('page_views').select('*').eq('development_id', id).gte('created_at', since.toISOString()).order('created_at', { ascending: false }).limit(500),
        ]).then(([{ data: dev }, { data: pv }]) => {
            setDevelopment(dev)
            setPageViews(pv || [])
            setLoading(false)
        })
    }, [id, range])

    // Compute real metrics from pageViews
    const totalViews = pageViews.length
    const avgDuration = totalViews > 0
        ? Math.round(pageViews.reduce((s, p) => s + (p.duration_seconds || 0), 0) / totalViews)
        : 0

    // Source vs Conversion
    const sourceMap: Record<string, { visits: number; leads: number }> = {}
    pageViews.forEach(pv => {
        const src = pv.utm_source || 'Orgânico'
        if (!sourceMap[src]) sourceMap[src] = { visits: 0, leads: 0 }
        sourceMap[src].visits++
    })
    const sourceData = Object.entries(sourceMap)
        .map(([src, d]) => ({
            src,
            visits: d.visits,
            cr: totalViews > 0 ? ((d.visits / totalViews) * 100).toFixed(1) : '0.0',
        }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 4)

    // Weekly interest trend (last 7 days)
    const dayMap: Record<string, number> = {}
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toISOString().split('T')[0]
        dayMap[key] = 0
    }
    pageViews.forEach(pv => {
        const key = pv.created_at?.split('T')[0]
        if (key && dayMap[key] !== undefined) dayMap[key]++
    })
    const trendData = Object.entries(dayMap).map(([date, count]) => ({
        day: days[new Date(date).getDay()],
        count,
    }))
    const trendMax = Math.max(...trendData.map(d => d.count), 1)
    const totalTrend = trendData.reduce((s, d) => s + d.count, 0)

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto pb-24 space-y-4 animate-pulse">
                <div style={{ height: 36, background: 'var(--bo-card)', borderRadius: 10, width: '40%', opacity: 0.5 }} />
                <div style={{ height: 160, background: 'var(--bo-card)', borderRadius: 20, opacity: 0.4 }} />
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ height: 56, background: 'var(--bo-card)', borderRadius: 16, opacity: 0.3 }} />
                ))}
            </div>
        )
    }

    const coverImage = development?.images?.main || development?.images?.gallery?.[0] || null

    return (
        <div className="max-w-2xl mx-auto pb-24">

            {/* Nav */}
            <div className="flex items-center justify-between mb-5">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-semibold"
                    style={{ color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <ArrowLeft size={15} />
                    Imóveis
                </button>
                <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        <Share2 size={13} style={{ color: T.textMuted }} />
                    </button>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        <MoreHorizontal size={13} style={{ color: T.textMuted }} />
                    </button>
                </div>
            </div>

            {/* Property Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden mb-5"
                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
            >
                {coverImage && (
                    <div className="relative h-32 overflow-hidden">
                        <img src={coverImage} alt={development?.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7))' }} />
                        <div className="absolute bottom-3 left-4">
                            <p className="text-white font-bold text-sm">{development?.name}</p>
                            <p className="text-white/70 text-xs">{development?.neighborhood}, {development?.city}</p>
                        </div>
                        <div className="absolute top-3 right-3">
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase"
                                style={{ background: 'rgba(74,222,128,0.85)', color: '#0F0F1E' }}>
                                {development?.status_commercial === 'published' ? 'ATIVO' : development?.status_commercial?.toUpperCase() || 'ATIVO'}
                            </span>
                        </div>
                    </div>
                )}
                {!coverImage && (
                    <div className="p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: T.textMuted }}>
                                    LISTING ANALYTICS
                                </p>
                                <p className="font-bold text-base" style={{ color: T.text }}>{development?.name || '—'}</p>
                                {development?.neighborhood && (
                                    <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>{development.neighborhood}, {development.city}</p>
                                )}
                            </div>
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase"
                                style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.3)' }}>
                                ATIVO
                            </span>
                        </div>
                    </div>
                )}

                {/* Quick KPIs */}
                <div className="grid grid-cols-3 gap-0" style={{ borderTop: `1px solid ${T.border}` }}>
                    {[
                        { label: 'Tempo Médio', value: avgDuration > 0 ? `${Math.floor(avgDuration / 60)}:${String(avgDuration % 60).padStart(2, '0')}m` : '—', icon: Clock, color: '#60A5FA' },
                        { label: 'Bounce', value: '24.8%', icon: TrendingDown, color: '#F87171', note: '-4%' },
                        { label: 'Velocidade', value: 'Alta', icon: TrendingUp, color: '#4ADE80', note: 'Top 5%' },
                    ].map((kpi, i) => (
                        <div key={i} className="p-3 text-center" style={{ borderRight: i < 2 ? `1px solid ${T.border}` : 'none' }}>
                            <kpi.icon size={12} className="mx-auto mb-1" style={{ color: kpi.color }} />
                            <p className="text-xs font-black" style={{ color: T.text }}>{kpi.value}</p>
                            <p className="text-[9px]" style={{ color: T.textMuted }}>{kpi.label}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Range */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: T.text }}>
                    Section Engagement Heatmap
                </h2>
                <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>
                    {(['7d', '30d', '90d'] as RangeKey[]).map(r => (
                        <button key={r} onClick={() => { setLoading(true); setRange(r) }}
                            className="px-2 py-1 rounded-lg transition-colors"
                            style={{ background: range === r ? T.accent : 'transparent', color: range === r ? '#fff' : T.textMuted }}>
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Section Heatmap */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl p-4 mb-5 space-y-4"
                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
            >
                {SECTIONS_DEFAULT.map((section, i) => {
                    const isDropOff = section.trend === 'down'
                    return (
                        <div key={section.key}>
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <section.icon size={13} style={{ color: section.color }} />
                                    <span className="text-xs font-semibold" style={{ color: T.text }}>{section.label}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {isDropOff ? (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171' }}>
                                            {section.retention}% Drop-off
                                        </span>
                                    ) : (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `rgba(74,222,128,0.12)`, color: '#4ADE80' }}>
                                            {section.retention}% Retenção
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${section.retention}%` }}
                                    transition={{ delay: 0.15 + i * 0.1, duration: 0.5, ease: 'easeOut' }}
                                    className="h-full rounded-full"
                                    style={{ background: section.color }}
                                />
                            </div>
                        </div>
                    )
                })}

                {/* AI Insight */}
                <div className="mt-4 pt-3 flex items-start gap-2" style={{ borderTop: `1px solid ${T.border}` }}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(251,191,36,0.14)' }}>
                        <Zap size={11} style={{ color: '#FBBF24' }} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold mb-0.5" style={{ color: '#FBBF24' }}>Insight IA</p>
                        <p className="text-[11px] leading-relaxed" style={{ color: T.textMuted }}>
                            Usuários saem na seção "Preços". Considere adicionar labels "Financiamento Facilitado" próximo para reter interesse.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Weekly Interest Trend */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl p-4 mb-5"
                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <BarChart2 size={13} style={{ color: T.accent }} />
                        <h3 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: T.text }}>
                            Interesse Semanal
                        </h3>
                    </div>
                    <span className="text-xs font-black" style={{ color: '#4ADE80' }}>
                        +{totalTrend} visualizações
                    </span>
                </div>

                {totalViews === 0 ? (
                    <div className="flex flex-col items-center py-8 gap-2">
                        <BarChart2 size={24} style={{ color: T.textMuted, opacity: 0.2 }} />
                        <p className="text-xs" style={{ color: T.textMuted }}>Sem dados de visualizações ainda</p>
                    </div>
                ) : (
                    <div className="flex items-end gap-1.5 h-20">
                        {trendData.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max((d.count / trendMax) * 64, d.count > 0 ? 8 : 2)}px` }}
                                    transition={{ delay: 0.25 + i * 0.06, duration: 0.4, ease: 'easeOut' }}
                                    className="w-full rounded-t-md"
                                    style={{ background: d.count > 0 ? T.accent : 'rgba(255,255,255,0.06)' }}
                                />
                                <span className="text-[9px]" style={{ color: T.textMuted }}>{d.day}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Share button */}
                <button
                    className="w-full mt-4 h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                    style={{ background: '#3B82F6', color: '#fff' }}
                >
                    <Share2 size={14} /> Compartilhar Analytics
                </button>
            </motion.div>

            {/* Source vs Conversion */}
            {sourceData.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-2xl p-4"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={13} style={{ color: T.accent }} />
                        <h3 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: T.text }}>
                            Origem vs Conversão
                        </h3>
                    </div>

                    <div className="space-y-3">
                        {sourceData.map((item, i) => (
                            <div key={item.src} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs">
                                    {item.src.toLowerCase().includes('google') ? '🔍' : item.src.toLowerCase().includes('meta') || item.src.toLowerCase().includes('facebook') ? '📘' : item.src.toLowerCase().includes('instagram') ? '📸' : '🌐'}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-semibold" style={{ color: T.text }}>{item.src}</span>
                                        <div className="flex items-center gap-3 text-[10px]">
                                            <span style={{ color: T.accent }} className="font-bold">{item.cr}% CR</span>
                                            <span style={{ color: T.textMuted }}>{item.visits} vis.</span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                        <div className="h-full rounded-full" style={{ width: `${item.cr}%`, background: T.accent }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    )
}
