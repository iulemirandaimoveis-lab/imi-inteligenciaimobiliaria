import { useDraggable } from '@dnd-kit/core'
import { Lead } from '@/types/lead'
import { GripVertical, Clock, Phone, Mail, Building2, TrendingUp } from 'lucide-react'
import { CSS } from '@dnd-kit/utilities'

interface KanbanCardProps {
    lead: Lead
}

export default function KanbanCard({ lead }: KanbanCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: lead.id,
    })

    const style = {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 10 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                bg-white dark:bg-card-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-white/5 
                group hover:shadow-lg hover:border-primary/20 transition-all cursor-grab active:cursor-grabbing 
                ${isDragging ? 'opacity-50 scale-105 rotate-2' : ''}
            `}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">ID: {lead.id.slice(0, 4)}</span>
                    {lead.score && lead.score > 50 && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                            <TrendingUp size={10} /> High
                        </span>
                    )}
                </div>
                <div {...listeners} {...attributes} className="cursor-grab text-gray-300 hover:text-gray-500">
                    <GripVertical size={16} />
                </div>
            </div>

            <h4 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors">{lead.name}</h4>

            <div className="space-y-1 mb-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail size={12} /> <span className="truncate">{lead.email}</span>
                </div>
                {lead.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Phone size={12} /> <span>{lead.phone}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-white/5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    {lead.interest || 'Interesse Geral'}
                </div>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock size={10} /> 2d
                </span>
            </div>
        </div>
    )
}
