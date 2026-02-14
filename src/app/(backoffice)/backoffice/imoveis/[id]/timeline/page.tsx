
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
                    <Link href="/backoffice/imoveis" className="w-12 h-12 rounded-2xl bg-white border border-imi-100 flex items-center justify-center text-imi-400 hover:text-imi-900 transition-all shadow-soft">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-imi-400 uppercase tracking-[0.3em]">Asset Lifecycle History</span>
                        </div>
                        <h1 className="text-4xl font-bold text-imi-900 font-display tracking-tight">
                            Timeline: <span className="text-accent-500">{property?.name}</span>
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
                <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-imi-100 transform -translate-x-1/2" />

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

                                <div className="absolute left-8 md:left-1/2 w-12 h-12 bg-white rounded-2xl border-4 border-imi-50 shadow-soft flex items-center justify-center z-10 transform -translate-x-1/2">
                                    <Icon size={20} className={event.event_type === 'campaign_start' ? 'text-purple-500' : 'text-imi-900'} />
                                </div>

                                <div className={`ml-20 md:ml-0 md:w-[45%] bg-white p-8 rounded-3xl border border-imi-100 shadow-soft hover:shadow-card-hover transition-all group`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border bg-imi-50 text-imi-500 border-imi-100`}>
                                            {event.event_type || 'Geral'}
                                        </span>
                                        <span className="text-[10px] text-imi-300 font-bold uppercase tracking-tight">
                                            {format(new Date(event.event_date), "dd MMM 'yy", { locale: ptBR })}
                                        </span>
                                    </div>
                                    <h4 className="text-xl font-bold text-imi-900 mb-2 font-display">{event.title}</h4>
                                    <p className="text-sm text-imi-500 leading-relaxed mb-6">{event.description}</p>

                                    <div className="flex items-center justify-between pt-6 border-t border-imi-50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-imi-100 flex items-center justify-center text-[10px] font-bold text-imi-400 border border-white">L</div>
                                            <span className="text-[10px] text-imi-400 font-medium">Registrado por Laila M.</span>
                                        </div>
                                        <button className="p-2 hover:bg-imi-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                            <Edit3 size={16} className="text-imi-300" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    }) : (
                        <div className="py-20 text-center flex flex-col items-center">
                            <History size={60} className="text-imi-50 mb-6" strokeWidth={1} />
                            <h3 className="text-xl font-bold text-imi-900 mb-2">Sem histórico registrado</h3>
                            <p className="text-imi-400 max-w-xs mx-auto">Esta timeline será preenchida automaticamente conforme o ativo performar ou quando você registrar eventos manuais.</p>
                            <Button className="mt-8 bg-imi-50 text-imi-500 hover:bg-imi-900 hover:text-white rounded-xl">Registrar Evento Inicial</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
