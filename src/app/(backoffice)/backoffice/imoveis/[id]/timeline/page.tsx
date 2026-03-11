
'use client'

import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import {
    ArrowLeft,
    Plus,
    History,
    CheckCircle2,
    AlertCircle,
    Banknote,
    Users,
    Activity,
    Edit3,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'

const supabase = createClient()

const EVENT_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
    creation:       { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', icon: Plus },
    price_change:   { color: '#6BB87B', bg: 'rgba(107,184,123,0.12)', icon: Banknote },
    campaign_start: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: Activity },
    sold:           { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: CheckCircle2 },
    visit:          { color: 'var(--bo-accent)', bg: 'var(--bo-active-bg)', icon: Users },
    lead_gen:       { color: '#E8A87C', bg: 'rgba(232,168,124,0.12)', icon: AlertCircle },
}

export default function PropertyTimelinePage() {
    const { id } = useParams()
    const router = useRouter()

    const { data: property, isLoading: propLoading } = useSWR(`property_${id}`, async () => {
        const { data, error } = await supabase
            .from('developments')
            .select('*')
            .eq('id', id)
            .single()
        if (error) throw error
        return data
    })

    const { data: events = [], isLoading: eventsLoading } = useSWR(`property_events_${id}`, async () => {
        const { data, error } = await supabase
            .from('property_events')
            .select('*')
            .eq('property_id', id)
            .order('event_date', { ascending: false })
        if (error) throw error
        return data
    })

    if (propLoading) {
        return (
            <div className="max-w-4xl mx-auto pb-20 space-y-4 animate-pulse">
                <div style={{ height: 36, background: 'var(--bo-card)', borderRadius: 10, width: '40%', opacity: 0.5 }} />
                <div style={{ height: 80, background: 'var(--bo-card)', borderRadius: 16, opacity: 0.4 }} />
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: 120, background: 'var(--bo-card)', borderRadius: 20, opacity: 0.3 }} />
                ))}
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">

            {/* Back nav */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.push(`/backoffice/imoveis/${id}`)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textDim }}
                >
                    <ArrowLeft size={17} />
                </button>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: T.textMuted }}>
                    {property?.name || 'Imóvel'} / Timeline
                </span>
            </div>

            {/* Header */}
            <PageIntelHeader
                moduleLabel="ASSET LIFECYCLE"
                title={`Timeline: ${property?.name || '—'}`}
                subtitle="Histórico completo de eventos do ativo imobiliário"
                actions={
                    <button
                        className="h-10 px-5 rounded-xl font-semibold text-sm flex items-center gap-2 text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: T.accent, boxShadow: '0 4px 16px rgba(59,130,246,0.3)' }}
                    >
                        <Plus size={16} />
                        Registrar Evento
                    </button>
                }
            />

            {/* Event count badge */}
            {!eventsLoading && events.length > 0 && (
                <div className="flex items-center gap-3">
                    <div
                        className="px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{ background: `${T.accent}15`, color: T.accent, border: `1px solid ${T.accent}30` }}
                    >
                        {events.length} evento{events.length !== 1 ? 's' : ''} registrado{events.length !== 1 ? 's' : ''}
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div className="relative">
                {/* Vertical line */}
                {events.length > 0 && (
                    <div
                        className="absolute left-[19px] top-6 bottom-6 w-px"
                        style={{ background: `linear-gradient(to bottom, ${T.border}, ${T.border}80)` }}
                    />
                )}

                <div className="space-y-4">
                    {events.length > 0 ? (events as any[]).map((event: any, i: number) => {
                        const cfg = EVENT_CONFIG[event.event_type as keyof typeof EVENT_CONFIG] || EVENT_CONFIG.creation
                        const Icon = cfg.icon

                        return (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.07 }}
                                className="flex items-start gap-4"
                            >
                                {/* Icon dot */}
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10"
                                    style={{ background: cfg.bg, border: `1px solid ${cfg.color}40` }}
                                >
                                    <Icon size={16} style={{ color: cfg.color }} />
                                </div>

                                {/* Card */}
                                <div
                                    className="flex-1 rounded-2xl p-5 group transition-all hover:shadow-lg"
                                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span
                                                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                                style={{ background: cfg.bg, color: cfg.color }}
                                            >
                                                {event.event_type || 'Geral'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-semibold" style={{ color: T.textMuted }}>
                                                {format(new Date(event.event_date), "dd MMM 'yy", { locale: ptBR })}
                                            </span>
                                            <button
                                                className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                                style={{ color: T.textMuted, background: T.elevated }}
                                            >
                                                <Edit3 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                    <h4 className="text-base font-bold mb-1.5" style={{ color: T.text }}>
                                        {event.title}
                                    </h4>
                                    <p className="text-sm leading-relaxed" style={{ color: T.textMuted }}>
                                        {event.description}
                                    </p>

                                    <div
                                        className="flex items-center gap-2 mt-4 pt-3"
                                        style={{ borderTop: `1px solid ${T.border}` }}
                                    >
                                        <div
                                            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                                            style={{ background: T.elevated, color: T.textMuted, border: `1px solid ${T.border}` }}
                                        >
                                            L
                                        </div>
                                        <span className="text-[10px]" style={{ color: T.textMuted }}>
                                            Registrado por Laila M.
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    }) : (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-24 rounded-2xl"
                            style={{ background: T.surface, border: `1px dashed ${T.border}` }}
                        >
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                            >
                                <History size={28} style={{ color: T.textMuted, opacity: 0.5 }} />
                            </div>
                            <h3 className="text-lg font-bold mb-2" style={{ color: T.text }}>
                                Sem histórico registrado
                            </h3>
                            <p className="text-sm max-w-xs text-center mb-6" style={{ color: T.textMuted }}>
                                Esta timeline será preenchida automaticamente conforme o ativo performar ou quando você registrar eventos manuais.
                            </p>
                            <button
                                className="h-10 px-6 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all hover:scale-[1.02]"
                                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}
                            >
                                <Plus size={15} />
                                Registrar Evento Inicial
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    )
}
