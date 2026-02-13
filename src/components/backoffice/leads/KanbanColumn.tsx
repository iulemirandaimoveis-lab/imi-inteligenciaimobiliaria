import { useDroppable } from '@dnd-kit/core'
import { Lead } from '@/types/lead'
import KanbanCard from './KanbanCard'

interface KanbanColumnProps {
    id: string
    title: string
    color: string
    leads: Lead[]
}

export default function KanbanColumn({ id, title, color, leads }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({
        id: id,
    })

    const count = leads.length
    const total = leads.reduce((acc, lead) => acc + (lead.budget || 0), 0)

    return (
        <div ref={setNodeRef} className="flex-shrink-0 w-80 bg-gray-50/50 dark:bg-card-dark/20 rounded-2xl flex flex-col h-full border border-gray-100 dark:border-white/5 backdrop-blur-sm">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-white/5 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color}`}></div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">{title}</h3>
                    </div>
                    <span className="bg-white dark:bg-white/10 px-2.5 py-0.5 rounded-full text-xs font-bold text-gray-500 shadow-sm">{count}</span>
                </div>
                {total > 0 && (
                    <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Potencial</p>
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(total)}
                        </p>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar min-h-[150px]">
                {leads.map((lead) => (
                    <KanbanCard key={lead.id} lead={lead} />
                ))}
                {leads.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-gray-200 dark:border-white/5 rounded-xl flex items-center justify-center text-gray-400 text-xs font-medium bg-gray-50/50 dark:bg-transparent">
                        Arraste para cá
                    </div>
                )}
            </div>
        </div>
    )
}
