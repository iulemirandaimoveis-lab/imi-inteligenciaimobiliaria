
'use client'

import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import {
    Clock,
    ChevronLeft,
    Plus,
    History,
    CheckCircle2,
    AlertCircle,
    Banknote,
    Camera,
    Users,
    Activity,
    Edit3
} from 'lucide-react'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    hover: 'var(--bo-hover)',
    accent: '#486581',
}

const supabase = createClient()

export default function PropertyTimelinePage() {
    const { id } = useParams()

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

    if (propLoading) return <div className="p-20 text-center animate-pulse text-imi-300 italic">Recuperando histórico do ativo...</div>

    const eventIcons = {
        creation: { icon: Plus, color: 'blue' },
        price_change: { icon: Banknote, color: 'green' },
        campaign_start: { icon: Activity, color: 'purple' },
        sold: { icon: CheckCircle2, color: 'red' },
        visit: { icon: Users, color: 'accent' },
        lead_gen: { icon: AlertCircle, color: 'amber' }
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="flex items-center gap-6">
                    <Link
                        href="/backoffice/imoveis"
                        className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-soft"
                        style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted }}
                    >
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: T.textMuted }}>Asset Lifecycle History</span>
                        </div>
                        <h1 className="text-4xl font-bold font-display tracking-tight" style={{ color: T.text }}>
                            Timeline: <span style={{ color: T.accent }}>{property?.name}</span>
                        </h1>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button className="h-14 px-8 bg-imi-900 text-white rounded-2xl shadow-elevated group active:scale-95 transition-all">
                        <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform" />
                        Registrar Evento
                    </Button>
                </div>
            </div>

            {/* Timeline Vertical */}
            <div className="max-w-4xl mx-auto py-10 relative">
                {/* Linha Central */}
                <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px transform -translate-x-1/2" style={{ background: T.border }} />

                <div className="space-y-16">
                    {events.length > 0 ? events.map((event: any, i: number) => {
                        const iconData = eventIcons[event.event_type as keyof typeof eventIcons] || eventIcons.creation
                        const Icon = iconData.icon
                        const isEven = i % 2 === 0

                        return (
                            <motion.div
                                initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={event.id}
                                className={`relative flex items-center justify-between w-full ${isEven ? 'md:flex-row-reverse' : ''}`}
                            >
                                <div className="hidden md:block w-[45%]" />

                                <div
                                    className="absolute left-8 md:left-1/2 w-12 h-12 rounded-2xl flex items-center justify-center z-10 transform -translate-x-1/2"
                                    style={{ background: T.surface, border: `4px solid ${T.elevated}` }}
                                >
                                    <Icon size={20} className={event.event_type === 'campaign_start' ? 'text-purple-500' : ''} style={event.event_type !== 'campaign_start' ? { color: T.text } : {}} />
                                </div>

                                <div
                                    className="ml-20 md:ml-0 md:w-[45%] p-8 rounded-3xl transition-all group"
                                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span
                                            className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest"
                                            style={{ background: T.elevated, color: T.textMuted, border: `1px solid ${T.border}` }}
                                        >
                                            {event.event_type || 'Geral'}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-tight" style={{ color: T.textMuted }}>
                                            {format(new Date(event.event_date), "dd MMM 'yy", { locale: ptBR })}
                                        </span>
                                    </div>
                                    <h4 className="text-xl font-bold mb-2 font-display" style={{ color: T.text }}>{event.title}</h4>
                                    <p className="text-sm leading-relaxed mb-6" style={{ color: T.textMuted }}>{event.description}</p>

                                    <div className="flex items-center justify-between pt-6" style={{ borderTop: `1px solid ${T.border}` }}>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border border-white"
                                                style={{ background: T.elevated, color: T.textMuted }}
                                            >L</div>
                                            <span className="text-[10px] font-medium" style={{ color: T.textMuted }}>Registrado por Laila M.</span>
                                        </div>
                                        <button className="p-2 rounded-lg transition-colors touch-always-visible opacity-0 group-hover:opacity-100" style={{ color: T.textMuted }}>
                                            <Edit3 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    }) : (
                        <div className="py-20 text-center flex flex-col items-center">
                            <History size={60} className="mb-6" strokeWidth={1} style={{ color: T.border }} />
                            <h3 className="text-xl font-bold mb-2" style={{ color: T.text }}>Sem histórico registrado</h3>
                            <p className="max-w-xs mx-auto" style={{ color: T.textMuted }}>Esta timeline será preenchida automaticamente conforme o ativo performar ou quando você registrar eventos manuais.</p>
                            <Button className="mt-8 rounded-xl" style={{ background: T.elevated, color: T.textMuted }}>Registrar Evento Inicial</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
