'use client'

import React from 'react'
import { Clock, CheckCircle2, FileEdit, UserPlus, Eye, ShoppingCart } from 'lucide-react'
import { usePropertyEvents } from '@/hooks/use-property-events'

interface PropertyEventsProps {
    propertyId: string
}

export default function PropertyEvents({ propertyId }: PropertyEventsProps) {
    const { events, isLoading } = usePropertyEvents(propertyId)

    const getIcon = (type: string) => {
        switch (type) {
            case 'creation': return <CheckCircle2 className="w-5 h-5 text-green-500" />
            case 'update': return <FileEdit className="w-5 h-5 text-navy-500" />
            case 'lead': return <UserPlus className="w-5 h-5 text-navy-500" />
            case 'view': return <Eye className="w-5 h-5 text-gray-500" />
            case 'unit_sold': return <ShoppingCart className="w-5 h-5 text-orange-500" />
            default: return <Clock className="w-5 h-5 text-gray-400" />
        }
    }

    if (isLoading) return <div className="p-8 text-center text-imi-400 animate-pulse">Carregando histórico...</div>

    if (events.length === 0) {
        return (
            <div className="text-center py-20 bg-imi-50 rounded-2xl border border-imi-100">
                <Clock className="w-12 h-12 mx-auto mb-3 text-imi-200" />
                <p className="text-sm font-bold text-imi-400">Nenhum evento registrado</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-imi-900 tracking-tight font-display mb-6">Linha do Tempo</h3>
            <div className="relative border-l-2 border-imi-100 ml-3 space-y-8 pb-8">
                {events.map((event, index) => (
                    <div key={event.id} className="relative pl-8 animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="absolute -left-[9px] top-0 bg-white p-1 rounded-full border border-imi-100 shadow-sm">
                            {getIcon(event.event_type)}
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-imi-100 shadow-soft hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-imi-900 text-sm">{event.title}</h4>
                                <span className="text-[10px] text-imi-300 font-bold uppercase tracking-widest">
                                    {new Date(event.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-xs text-imi-500 leading-relaxed font-medium">
                                {event.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
