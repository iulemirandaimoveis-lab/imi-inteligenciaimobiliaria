'use client'

import { useState, useEffect } from 'react'
import NextImage from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft, Share2, Eye, Clock,
    Zap, TrendingUp, TrendingDown, BarChart2,
    Image as ImageIcon, DollarSign, Video, Map,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'

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
            <div className="max-w-3xl mx-auto pb-24 space-y-4 animate-pulse">
                <div style={{ height: 36, background: 'var(--bo-card)', borderRadius: 10, width: '40%', opacity: 0.5 }} />
                <div style={{ height: 160, background: 'var(--bo-card)', borderRadius: 20, opacity: 0.4 }} />
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ height: 56, background: 'var(--bo-card)', borderRadius: 16, opacity: 0.3 }} />
                ))}
            </div>
        )
    }

    const coverImage = development?.images?.main || development?.images?.gallery?.[0] || null

    const rangeOptions: RangeKey[] = ['7d', '30d', '90d']

    return (
        <div className="max-w-3xl mx-auto pb-24 space-y-5">

            {/* Back nav */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textDim }}
                >
                    <ArrowLeft size={17} />
                </button>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: T.textMuted }}>
                    {development?.name || 'Imóvel'} / Heatmap
                </span>
            </div>

            {/* Header */}
            <PageIntelHeader
                moduleLabel="LISTING HEATMAP"
                title="Engagement Heatmap"
                subtitle={`${development?.name || '—'} · ${development?.neighborhood ? `${development.neighborhood}, ` : ''}${development?.city || ''}`}
                live
                actions={
                    <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        {rangeOptions.map(r => (
                            <button
                                key={r}
                                onClick={() => { setLoading(true); setRange(r) }}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                style={{
                                    background: range === r ? T.surface : 'transparent',
                                    color: range === r ? T.text : T.textMuted,
                                    border: range === r ? `1px solid ${T.border}` : '1px solid transparent',
                                }}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                }
            />

            {/* Property Hero Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
            >
                {coverImage ? (
                    <div className="relative h-36 overflow-hidden">
                        <NextImage src={coverImage} alt={development?.name ?? ''} fill className="object-cover" />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.8))' }} />
                        <div className="absolute bottom-3 left-4">
                            <p className="text-white font-bold text-sm leading-tight">{development?.name}</p>
                            <p className="text-white/60 text-xs mt-0.5">{development?.neighborhood}, {development?.city}</p>
                        </div>
                        <div className="absolute top-3 right-3">
                            <span
                                className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                style={{ background: 'rgba(74,222,128,0.85)', color: '#0F0F1E' }}
                            >
                                {development?.status_commercial === 'published' ? 'ATIVO' : development?.status_commercial?.toUpperCase() || 'ATIVO'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: T.textMuted }}>
                                    LISTING HEATMAP
                                </p>
                                <p className="font-bold text-base" style={{ color: T.text }}>{development?.name || '—'}</p>
                                {development?.neighborhood && (
                                    <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>
                                        {development.neighborhood}, {development.city}
                                    </p>
                                )}
                            </div>
                            <span
                                className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase"
                                style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.3)' }}
                            >
                                ATIVO
                            </span>
                        </div>
                    </div>
                )}

                {/* Quick KPI strip */}
                <div className="grid grid-cols-3" style={{ borderTop: `1px solid ${T.border}` }}>
                    {[
                        { label: 'Tempo Médio', value: avgDuration > 0 ? `${Math.floor(avgDuration / 60)}:${String(avgDuration % 60).padStart(2, '0')}m` : '—', icon: Clock, color: '#60A5FA' },
                        { label: 'Bounce Rate', value: '24.8%', icon: TrendingDown, color: '#F87171', sub: '-4%' },
                        { label: 'Velocidade', value: 'Alta', icon: TrendingUp, color: '#4ADE80', sub: 'Top 5%' },
                    ].map((kpi, i) => (
                        <div
                            key={i}
                            className="p-4 text-center"
                            style={{ borderRight: i < 2 ? `1px solid ${T.border}` : 'none' }}
                        >
                            <kpi.icon size={13} className="mx-auto mb-1.5" style={{ color: kpi.color }} />
                            <p className="text-sm font-bold" style={{ color: T.text }}>{kpi.value}</p>
                            {kpi.sub && <p className="text-[10px] font-semibold" style={{ color: kpi.color }}>{kpi.sub}</p>}
                            <p className="text-[9px] mt-0.5" style={{ color: T.textMuted }}>{kpi.label}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Section Engagement Heatmap */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl p-5"
                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
            >
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: T.textMuted }}>
                            Section Analysis
                        </p>
                        <h3 className="text-sm font-bold" style={{ color: T.text }}>Engagement por Seção</h3>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ background: '#4ADE80' }} />
                            <span style={{ color: T.textMuted }}>Retenção</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ background: '#F87171' }} />
                            <span style={{ color: T.textMuted }}>Drop-off</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {SECTIONS_DEFAULT.map((section, i) => {
                        const isDropOff = section.trend === 'down'
                        return (
                            <div key={section.key}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ background: `${section.color}18` }}
                                        >
                                            <section.icon size={13} style={{ color: section.color }} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold" style={{ color: T.text }}>{section.label}</p>
                                            <p className="text-[10px]" style={{ color: T.textMuted }}>{section.detail}</p>
                                        </div>
                                    </div>
                                    <span
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
                                        style={{
                                            background: isDropOff ? 'rgba(248,113,113,0.12)' : 'rgba(74,222,128,0.12)',
                                            color: isDropOff ? '#F87171' : '#4ADE80',
                                        }}
                                    >
                                        {section.retention}% {isDropOff ? 'Drop-off' : 'Retenção'}
                                    </span>
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
                </div>

                {/* AI Insight */}
                <div className="mt-5 pt-4 flex items-start gap-3" style={{ borderTop: `1px solid ${T.border}` }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)' }}>
                        <Zap size={14} style={{ color: '#FBBF24' }} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#FBBF24' }}>
                            Insight IA
                        </p>
                        <p className="text-xs leading-relaxed" style={{ color: T.textMuted }}>
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
                className="rounded-2xl p-5"
                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
            >
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: T.textMuted }}>
                            Tendência Semanal
                        </p>
                        <h3 className="text-sm font-bold" style={{ color: T.text }}>Interesse por Dia</h3>
                    </div>
                    <span
                        className="text-sm font-bold px-3 py-1 rounded-full"
                        style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80' }}
                    >
                        +{totalTrend} vis.
                    </span>
                </div>

                {totalViews === 0 ? (
                    <div className="flex flex-col items-center py-10 gap-2">
                        <BarChart2 size={24} style={{ color: T.textMuted, opacity: 0.2 }} />
                        <p className="text-xs" style={{ color: T.textMuted }}>Sem dados de visualizações ainda</p>
                    </div>
                ) : (
                    <div className="flex items-end gap-2 h-20">
                        {trendData.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max((d.count / trendMax) * 64, d.count > 0 ? 8 : 3)}px` }}
                                    transition={{ delay: 0.25 + i * 0.06, duration: 0.4, ease: 'easeOut' }}
                                    className="w-full rounded-t-lg"
                                    style={{ background: d.count > 0 ? T.accent : 'rgba(255,255,255,0.06)' }}
                                />
                                <span className="text-[9px] font-medium" style={{ color: T.textMuted }}>{d.day}</span>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    className="w-full mt-5 h-10 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
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
                    className="rounded-2xl p-5"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                >
                    <div className="mb-5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: T.textMuted }}>
                            Origem
                        </p>
                        <h3 className="text-sm font-bold" style={{ color: T.text }}>Origem vs Conversão</h3>
                    </div>

                    <div className="space-y-4">
                        {sourceData.map((item, i) => (
                            <div key={item.src} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                                    style={{ background: T.surface }}>
                                    {item.src.toLowerCase().includes('google') ? '🔍' : item.src.toLowerCase().includes('meta') || item.src.toLowerCase().includes('facebook') ? '📘' : item.src.toLowerCase().includes('instagram') ? '📸' : '🌐'}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-semibold" style={{ color: T.text }}>{item.src}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold" style={{ color: T.accent }}>{item.cr}% CR</span>
                                            <span className="text-xs" style={{ color: T.textMuted }}>{item.visits} vis.</span>
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
