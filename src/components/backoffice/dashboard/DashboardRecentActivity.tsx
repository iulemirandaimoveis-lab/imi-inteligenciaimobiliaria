'use client'

import { useEffect, useState } from 'react'
import {
    Users,
    Building2,
    TrendingUp,
    FileText,
    Calendar,
    MessageSquare,
    DollarSign,
    Star,
    ArrowRight,
    Clock
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeDevelopments, useRealtimeLeads } from '@/hooks/use-realtime-sync'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

const supabase = createClient()

interface Activity {
    id: string
    type: 'lead' | 'development' | 'status_change' | 'evaluation' | 'consultation' | 'meeting' | 'high_score'
    title: string
    description: string
    timestamp: string
    link?: string
    icon: any
    color: string
    bgColor: string
    priority: 'high' | 'medium' | 'low'
}

export default function DashboardRecentActivity() {
    const [activities, setActivities] = useState<Activity[]>([])
    const [loading, setLoading] = useState(true)

    // Real-time updates
    useRealtimeDevelopments((dev) => {
        addActivity({
            type: 'development',
            title: 'Novo Empreendimento',
            description: `${dev.name} foi adicionado`,
            timestamp: new Date().toISOString(),
            link: `/backoffice/imoveis/${dev.id}`,
            priority: 'medium'
        })
    })

    useRealtimeLeads((lead) => {
        const isHighScore = (lead.score || 0) >= 80

        addActivity({
            type: isHighScore ? 'high_score' : 'lead',
            title: isHighScore ? 'Lead Qualificado!' : 'Novo Lead',
            description: `${lead.name} ${isHighScore ? `(Score: ${lead.score})` : ''}`,
            timestamp: new Date().toISOString(),
            link: `/backoffice/leads/${lead.id}`,
            priority: isHighScore ? 'high' : 'low'
        })
    })

    useEffect(() => {
        loadActivities()
    }, [])

    const loadActivities = async () => {
        setLoading(true)
        try {
            const allActivities: Activity[] = []

            // 1. Buscar leads recentes (últimas 24h)
            const oneDayAgo = new Date()
            oneDayAgo.setDate(oneDayAgo.getDate() - 1)

            const { data: recentLeads } = await supabase
                .from('leads')
                .select('id, name, score, created_at, status')
                .gte('created_at', oneDayAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(10)

            recentLeads?.forEach(lead => {
                const isHighScore = (lead.score || 0) >= 80
                allActivities.push({
                    id: `lead-${lead.id}`,
                    type: isHighScore ? 'high_score' : 'lead',
                    title: isHighScore ? 'Lead Qualificado!' : 'Novo Lead',
                    description: `${lead.name}${isHighScore ? ` (Score: ${lead.score})` : ''}`,
                    timestamp: lead.created_at,
                    link: `/backoffice/leads/${lead.id}`,
                    icon: isHighScore ? Star : Users,
                    color: isHighScore ? 'text-yellow-600' : 'text-blue-600',
                    bgColor: isHighScore ? 'bg-yellow-50' : 'bg-blue-50',
                    priority: isHighScore ? 'high' : 'low'
                })
            })

            // 2. Buscar mudanças de status (últimas 24h)
            const { data: statusChanges } = await supabase
                .from('leads')
                .select('id, name, status, updated_at')
                .gte('updated_at', oneDayAgo.toISOString())
                .neq('created_at', 'updated_at') // Apenas atualizações, não criações
                .order('updated_at', { ascending: false })
                .limit(8)

            statusChanges?.forEach(lead => {
                const isWon = lead.status === 'won'
                allActivities.push({
                    id: `status-${lead.id}`,
                    type: 'status_change',
                    title: isWon ? 'Negócio Fechado! 🎉' : 'Status Atualizado',
                    description: `${lead.name} → ${getStatusName(lead.status)}`,
                    timestamp: lead.updated_at,
                    link: `/backoffice/leads/${lead.id}`,
                    icon: isWon ? TrendingUp : ArrowRight,
                    color: isWon ? 'text-green-600' : 'text-purple-600',
                    bgColor: isWon ? 'bg-green-50' : 'bg-purple-50',
                    priority: isWon ? 'high' : 'medium'
                })
            })

            // 3. Buscar empreendimentos recentes
            const { data: recentDevs } = await supabase
                .from('developments')
                .select('id, name, created_at, status')
                .gte('created_at', oneDayAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(5)

            recentDevs?.forEach(dev => {
                const isPublished = dev.status === 'published'
                allActivities.push({
                    id: `dev-${dev.id}`,
                    type: 'development',
                    title: isPublished ? 'Empreendimento Publicado' : 'Novo Empreendimento',
                    description: dev.name,
                    timestamp: dev.created_at,
                    link: `/backoffice/imoveis/${dev.id}`,
                    icon: Building2,
                    color: 'text-orange-600',
                    bgColor: 'bg-orange-50',
                    priority: isPublished ? 'medium' : 'low'
                })
            })

            // 4. Buscar avaliações recentes
            const { data: evaluations } = await supabase
                .from('property_evaluations')
                .select('id, property_address, created_at')
                .gte('created_at', oneDayAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(5)

            evaluations?.forEach(val => {
                allActivities.push({
                    id: `eval-${val.id}`,
                    type: 'evaluation',
                    title: 'Nova Avaliação Solicitada',
                    description: val.property_address,
                    timestamp: val.created_at,
                    link: `/backoffice/avaliacoes/${val.id}`,
                    icon: FileText,
                    color: 'text-pink-600',
                    bgColor: 'bg-pink-50',
                    priority: 'medium'
                })
            })

            // 5. Buscar consultorias recentes
            const { data: consultations } = await supabase
                .from('consultations')
                .select('id, name, created_at')
                .gte('created_at', oneDayAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(5)

            consultations?.forEach(cons => {
                allActivities.push({
                    id: `cons-${cons.id}`,
                    type: 'consultation',
                    title: 'Nova Solicitação de Consultoria',
                    description: cons.name,
                    timestamp: cons.created_at,
                    link: `/backoffice/consultations/${cons.id}`,
                    icon: MessageSquare,
                    color: 'text-indigo-600',
                    bgColor: 'bg-indigo-50',
                    priority: 'high'
                })
            })

            // Ordenar por timestamp e prioridade
            allActivities.sort((a, b) => {
                // Primeiro por prioridade
                const priorityOrder = { high: 0, medium: 1, low: 2 }
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                    return priorityOrder[a.priority] - priorityOrder[b.priority]
                }
                // Depois por timestamp
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            })

            setActivities(allActivities.slice(0, 15)) // Mostrar apenas os 15 mais relevantes

        } catch (error) {
            console.error('Erro ao carregar atividades:', error)
        } finally {
            setLoading(false)
        }
    }

    const addActivity = (activity: Omit<Activity, 'id' | 'icon' | 'color' | 'bgColor'>) => {
        const config = getActivityConfig(activity.type)
        const newActivity: Activity = {
            ...activity,
            id: `${activity.type}-${Date.now()}`,
            icon: config.icon,
            color: config.color,
            bgColor: config.bgColor
        }

        setActivities(prev => [newActivity, ...prev].slice(0, 15))
    }

    const getActivityConfig = (type: Activity['type']) => {
        const configs = {
            lead: { icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
            development: { icon: Building2, color: 'text-orange-600', bgColor: 'bg-orange-50' },
            status_change: { icon: ArrowRight, color: 'text-purple-600', bgColor: 'bg-purple-50' },
            evaluation: { icon: FileText, color: 'text-pink-600', bgColor: 'bg-pink-50' },
            consultation: { icon: MessageSquare, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
            meeting: { icon: Calendar, color: 'text-teal-600', bgColor: 'bg-teal-50' },
            high_score: { icon: Star, color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
        }
        return (configs as any)[type] || configs.lead
    }

    const getStatusName = (status: string): string => {
        const names: Record<string, string> = {
            new: 'Novo',
            contacted: 'Contatado',
            qualified: 'Qualificado',
            proposal: 'Proposta',
            negotiation: 'Negociação',
            won: 'Ganho',
            lost: 'Perdido'
        }
        return names[status] || status
    }

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-imi-100 p-6">
                <h3 className="text-lg font-bold text-imi-900 mb-6">Atividade Recente</h3>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-start gap-4 animate-pulse">
                            <div className="w-12 h-12 rounded-xl bg-imi-100" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-imi-100 rounded w-3/4" />
                                <div className="h-3 bg-imi-100 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl border border-imi-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-imi-900 flex items-center gap-2">
                    <Clock size={24} className="text-accent-600" />
                    Atividade Recente
                </h3>
                <div className="text-xs text-imi-500">Últimas 24h</div>
            </div>

            {activities.length === 0 ? (
                <div className="text-center py-12">
                    <Clock size={48} className="text-imi-300 mx-auto mb-4" />
                    <p className="text-imi-600">Nenhuma atividade recente</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {activities.map((activity, index) => {
                        const Icon = activity.icon
                        const isRecent = new Date().getTime() - new Date(activity.timestamp).getTime() < 3600000 // < 1 hora

                        return (
                            <Link
                                key={activity.id}
                                href={activity.link || '#'}
                                className="block group"
                            >
                                <div className={`flex items-start gap-4 p-4 rounded-xl transition-all ${activity.priority === 'high'
                                        ? 'bg-gradient-to-r from-accent-50 to-white border border-accent-200'
                                        : 'hover:bg-imi-50'
                                    }`}>
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl ${activity.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                        <Icon size={20} className={activity.color} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-imi-900 truncate">
                                                        {activity.title}
                                                    </h4>
                                                    {isRecent && (
                                                        <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                                                            Novo
                                                        </span>
                                                    )}
                                                    {activity.priority === 'high' && (
                                                        <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-accent-100 text-accent-700 rounded">
                                                            Alta
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-imi-600 truncate mt-1">
                                                    {activity.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-imi-500">
                                                {formatDistanceToNow(new Date(activity.timestamp), {
                                                    addSuffix: true,
                                                    locale: ptBR
                                                })}
                                            </span>
                                            <span className="text-imi-300">•</span>
                                            <span className="text-xs text-accent-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                Ver detalhes →
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}

            {/* Footer Stats */}
            <div className="mt-6 pt-6 border-t border-imi-100 grid grid-cols-3 gap-4 text-center">
                <div>
                    <div className="text-2xl font-bold text-blue-600">
                        {activities.filter(a => a.type === 'lead' || a.type === 'high_score').length}
                    </div>
                    <div className="text-xs text-imi-500 mt-1">Novos Leads</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-green-600">
                        {activities.filter(a => a.type === 'status_change' && a.title.includes('Fechado')).length}
                    </div>
                    <div className="text-xs text-imi-500 mt-1">Fechamentos</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-purple-600">
                        {activities.filter(a => a.type === 'status_change').length}
                    </div>
                    <div className="text-xs text-imi-500 mt-1">Movimentos</div>
                </div>
            </div>
        </div>
    )
}
