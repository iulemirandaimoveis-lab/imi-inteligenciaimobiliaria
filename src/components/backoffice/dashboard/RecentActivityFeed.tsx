'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    UserPlus,
    MessageSquare,
    CheckCircle2,
    Briefcase,
    AlertCircle
} from 'lucide-react'

const supabase = createClient()

interface Activity {
    id: string
    type: 'new_lead' | 'interaction' | 'status_change' | 'system'
    title: string
    description: string
    created_at: string
}

export default function RecentActivityFeed() {
    const [activities, setActivities] = useState<Activity[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchActivity() {
            // Em um app real, teríamos uma tabela 'audit_logs' ou 'activities'
            // Aqui vamos simular buscando os dados mais recentes de leads e interactions

            // Buscar últimos leads
            const { data: leads } = await supabase
                .from('leads')
                .select('id, name, created_at')
                .order('created_at', { ascending: false })
                .limit(5)

            // Buscar interações
            const { data: interactions } = await supabase
                .from('lead_interactions')
                .select('id, title, description, created_at')
                .order('created_at', { ascending: false })
                .limit(5)

            // Merge e sort
            let combined: Activity[] = []

            if (leads) {
                combined = combined.concat(leads.map(l => ({
                    id: l.id,
                    type: 'new_lead',
                    title: 'Novo Lead Cadastrado',
                    description: `${l.name} entrou no pipeline.`,
                    created_at: l.created_at
                })))
            }

            if (interactions) {
                combined = combined.concat(interactions.map(i => ({
                    id: i.id,
                    type: 'interaction',
                    title: i.title,
                    description: i.description,
                    created_at: i.created_at
                })))
            }

            // Ordenar por data
            combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

            setActivities(combined.slice(0, 5))
            setLoading(false)
        }
        fetchActivity()
    }, [])

    if (loading) {
        return <div className="space-y-4 p-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-gray-200 dark:bg-white/10 rounded" />
                        <div className="h-3 w-1/2 bg-gray-200 dark:bg-white/10 rounded" />
                    </div>
                </div>
            ))}
        </div>
    }

    return (
        <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm h-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Atividade Recente</h3>

            <div className="space-y-6">
                {activities.map((activity, idx) => {
                    const isLast = idx === activities.length - 1
                    let Icon = AlertCircle
                    let color = 'text-gray-500 bg-gray-100'

                    if (activity.type === 'new_lead') {
                        Icon = UserPlus
                        color = 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    } else if (activity.type === 'interaction') {
                        Icon = MessageSquare
                        color = 'text-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    }

                    return (
                        <div key={activity.id} className="relative flex gap-4">
                            {!isLast && (
                                <div className="absolute left-5 top-10 bottom-[-24px] w-0.5 bg-gray-100 dark:bg-white/5" />
                            )}

                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                                <Icon size={18} />
                            </div>

                            <div className="flex-1 pt-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{activity.title}</h4>
                                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                        {formatDistanceToNow(new Date(activity.created_at), { locale: ptBR, addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                    {activity.description}
                                </p>
                            </div>
                        </div>
                    )
                })}

                {activities.length === 0 && (
                    <div className="text-center text-gray-400 py-8">Nenhuma atividade recente.</div>
                )}
            </div>
        </div>
    )
}
