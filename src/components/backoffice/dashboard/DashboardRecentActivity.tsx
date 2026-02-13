'use client'

import React, { useState, useEffect } from 'react'
import {
    Heart,
    Building2,
    MessageSquare,
    AlertCircle,
    CheckCircle2,
    Target,
    Clock,
    FileText,
    Briefcase,
    ChevronRight,
    TrendingUp,
    Globe
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const supabase = createClient()

interface Activity {
    id: string
    type: 'lead_new' | 'lead_qualified' | 'lead_won' | 'development_new' | 'development_status' | 'evaluation_new' | 'consultation_new'
    title: string
    message: string
    time: Date
    link: string
    priority: 'high' | 'medium' | 'low'
    isNew?: boolean
}

export default function DashboardRecentActivity() {
    const [activities, setActivities] = useState<Activity[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadInitialActivity()

        // Configurar realtime para múltiplas tabelas
        const channel = supabase.channel('dashboard-activity')
            .on('postgres_changes', { event: 'INSERT', table: 'leads', schema: 'public' }, (payload) => {
                handleNewActivity('lead_new', payload.new)
            })
            .on('postgres_changes', { event: 'UPDATE', table: 'leads', schema: 'public' }, (payload) => {
                if (payload.new.status === 'won' && payload.old.status !== 'won') {
                    handleNewActivity('lead_won', payload.new)
                } else if (payload.new.score !== payload.old.score) {
                    handleNewActivity('lead_qualified', payload.new)
                }
            })
            .on('postgres_changes', { event: 'INSERT', table: 'developments', schema: 'public' }, (payload) => {
                handleNewActivity('development_new', payload.new)
            })
            .on('postgres_changes', { event: 'INSERT', table: 'property_evaluations', schema: 'public' }, (payload) => {
                handleNewActivity('evaluation_new', payload.new)
            })
            .on('postgres_changes', { event: 'INSERT', table: 'consultations', schema: 'public' }, (payload) => {
                handleNewActivity('consultation_new', payload.new)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const loadInitialActivity = async () => {
        setLoading(true)
        try {
            // Como não temos uma tabela 'activities' consolidada, vamos buscar as mais recentes de cada
            const [leadsRes, devsRes, evalsRes, consultRes] = await Promise.all([
                supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(5),
                supabase.from('developments').select('*').order('created_at', { ascending: false }).limit(3),
                supabase.from('property_evaluations').select('*').order('created_at', { ascending: false }).limit(3).catch(() => ({ data: [] })),
                supabase.from('consultations').select('*').order('created_at', { ascending: false }).limit(3).catch(() => ({ data: [] }))
            ])

            const initialActivities: Activity[] = []

            leadsRes.data?.forEach(l => {
                initialActivities.push({
                    id: `lead-${l.id}`,
                    type: l.status === 'won' ? 'lead_won' : 'lead_new',
                    title: l.status === 'won' ? 'Negócio Fechado!' : 'Novo Lead Patrimonial',
                    message: `${l.name} demonstrou interesse via ${l.source}.`,
                    time: new Date(l.created_at),
                    link: `/backoffice/leads/${l.id}`,
                    priority: l.score && l.score > 70 ? 'high' : 'medium'
                })
            })

            devsRes.data?.forEach(d => {
                initialActivities.push({
                    id: `dev-${d.id}`,
                    type: 'development_new',
                    title: 'Novo Empreendimento',
                    message: `${d.name} foi adicionado ao portfólio.`,
                    time: new Date(d.created_at),
                    link: `/backoffice/imoveis/${d.id}`,
                    priority: 'low'
                })
            })

            evalsRes.data?.forEach((e: any) => {
                initialActivities.push({
                    id: `eval-${e.id}`,
                    type: 'evaluation_new',
                    title: 'Solicitação de Avaliação',
                    message: `Nova avaliação técnica solicitada para ${e.property_address.substring(0, 30)}...`,
                    time: new Date(e.created_at),
                    link: `/backoffice/avaliacoes/${e.id}`,
                    priority: 'medium'
                })
            })

            consultRes.data?.forEach((c: any) => {
                initialActivities.push({
                    id: `consult-${c.id}`,
                    type: 'consultation_new',
                    title: 'Nova Consultoria Global',
                    message: `${c.name} solicitou consultoria em ${c.type || 'investimento'}.`,
                    time: new Date(c.created_at),
                    link: `/backoffice/consultoria/${c.id}`,
                    priority: 'high'
                })
            })

            setActivities(initialActivities.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10))
        } catch (error) {
            console.error('Erro ao carregar atividades:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleNewActivity = (type: Activity['type'], data: any) => {
        const newActivity: Activity = {
            id: `${type}-${data.id}-${Date.now()}`,
            type,
            title: getTitleByType(type),
            message: getMessageByType(type, data),
            time: new Date(),
            link: getLinkByType(type, data),
            priority: getPriorityByType(type, data),
            isNew: true
        }

        setActivities(prev => [newActivity, ...prev].slice(0, 10))
    }

    const getTitleByType = (type: Activity['type']) => {
        switch (type) {
            case 'lead_new': return 'Novo Lead Patrimonial'
            case 'lead_won': return 'Negócio Fechado! 🎉'
            case 'lead_qualified': return 'Lead Qualificado'
            case 'development_new': return 'Novo Empreendimento'
            case 'evaluation_new': return 'Solicitação de Avaliação'
            case 'consultation_new': return 'Nova Consultoria Global'
            default: return 'Nova Atividade'
        }
    }

    const getMessageByType = (type: Activity['type'], data: any) => {
        switch (type) {
            case 'lead_new': return `${data.name} entrou na base via ${data.source}.`
            case 'lead_won': return `Contrato assinado por ${data.name}.`
            case 'lead_qualified': return `${data.name} agora tem score ${data.score}.`
            case 'development_new': return `${data.name} está disponível para venda.`
            case 'evaluation_new': return `Endereço: ${data.property_address.substring(0, 30)}...`
            case 'consultation_new': return `${data.name} busca inteligência patrimonial.`
            default: return 'Clique para ver detalhes.'
        }
    }

    const getLinkByType = (type: Activity['type'], data: any) => {
        switch (type) {
            case 'lead_new':
            case 'lead_won':
            case 'lead_qualified': return `/backoffice/leads/${data.id}`
            case 'development_new': return `/backoffice/imoveis/${data.id}`
            case 'evaluation_new': return `/backoffice/avaliacoes/${data.id}`
            case 'consultation_new': return `/backoffice/consultoria/${data.id}`
            default: return '/backoffice'
        }
    }

    const getPriorityByType = (type: Activity['type'], data: any): Activity['priority'] => {
        if (type === 'lead_won' || type === 'consultation_new') return 'high'
        if (type === 'lead_qualified' && data.score > 80) return 'high'
        if (type === 'evaluation_new') return 'medium'
        return 'low'
    }

    const getIcon = (type: Activity['type']) => {
        switch (type) {
            case 'lead_new': return <Heart size={18} className="text-accent-600" />
            case 'lead_won': return <Target size={18} className="text-green-600" />
            case 'lead_qualified': return <TrendingUp size={18} className="text-blue-600" />
            case 'development_new': return <Building2 size={18} className="text-imi-900" />
            case 'evaluation_new': return <FileText size={18} className="text-orange-600" />
            case 'consultation_new': return <Globe size={18} className="text-purple-600" />
            default: return <Clock size={18} className="text-gray-400" />
        }
    }

    if (loading) return <div className="space-y-4 animate-pulse">
        {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl w-full" />)}
    </div>

    return (
        <div className="bg-white rounded-2xl border border-imi-100 shadow-soft overflow-hidden">
            <div className="p-6 border-b border-imi-50 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-imi-900 flex items-center gap-2">
                    <Clock size={20} className="text-accent-600" />
                    Atividade em Tempo Real
                </h3>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] uppercase font-bold text-green-600 tracking-widest">Live</span>
                </div>
            </div>

            <div className="divide-y divide-imi-50">
                {activities.map((activity) => (
                    <Link
                        key={activity.id}
                        href={activity.link}
                        className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-all group relative ${activity.isNew ? 'bg-accent-50/30' : ''}`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${activity.priority === 'high' ? 'bg-red-50 border-red-100' :
                                activity.priority === 'medium' ? 'bg-blue-50 border-blue-100' :
                                    'bg-gray-50 border-gray-100'
                            }`}>
                            {getIcon(activity.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <h4 className="text-sm font-bold text-imi-900 truncate flex items-center gap-2">
                                    {activity.title}
                                    {activity.isNew && <span className="text-[9px] bg-accent-600 text-white px-1.5 rounded-full py-0.5 animate-bounce">NOVO</span>}
                                </h4>
                                <span className="text-[10px] text-imi-400 whitespace-nowrap">
                                    {formatDistanceToNow(activity.time, { addSuffix: true, locale: ptBR })}
                                </span>
                            </div>
                            <p className="text-xs text-imi-600 truncate">{activity.message}</p>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight size={16} className="text-imi-300" />
                        </div>

                        {activity.priority === 'high' && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                        )}
                    </Link>
                ))}
            </div>

            <div className="p-4 bg-gray-50/50 border-t border-imi-50 flex justify-between items-center">
                <div className="text-[10px] text-imi-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <AlertCircle size={10} />
                    {activities.filter(a => a.priority === 'high').length} prioridades críticas
                </div>
                <Link href="/backoffice/atividades" className="text-xs font-bold text-accent-600 hover:text-accent-700 transition-colors flex items-center gap-1">
                    Ver histórico completo
                    <ChevronRight size={14} />
                </Link>
            </div>
        </div>
    )
}
