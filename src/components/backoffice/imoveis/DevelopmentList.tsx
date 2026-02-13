import { Development } from '@/types/development'
import DevelopmentCard from './DevelopmentCard'
import { Loader2, SearchX, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'

interface DevelopmentListProps {
    developments: Development[]
    isLoading: boolean
    onEdit: (id: string) => void
    onDelete: (id: string) => void
    onNew?: () => void
    selectedIds?: string[]
    onSelect?: (id: string) => void
}

export default function DevelopmentList({ developments, isLoading, onEdit, onDelete, onNew, selectedIds, onSelect }: DevelopmentListProps) {
    // Loading State - Grid Skeleton
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 h-[400px] animate-pulse p-4 shadow-sm">
                        <div className="aspect-[4/3] bg-gray-100 dark:bg-white/5 rounded-xl mb-4"></div>
                        <div className="space-y-3">
                            <div className="h-6 bg-gray-100 dark:bg-white/5 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-1/2"></div>
                            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100 dark:border-white/5">
                                <div className="h-10 bg-gray-100 dark:bg-white/5 rounded-lg"></div>
                                <div className="h-10 bg-gray-100 dark:bg-white/5 rounded-lg"></div>
                                <div className="h-10 bg-gray-100 dark:bg-white/5 rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    // Empty State
    if (!developments || developments.length === 0) {
        return (
            <div className="bg-white dark:bg-card-dark rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-20 text-center shadow-soft">
                <div className="max-w-md mx-auto flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 text-gray-400">
                        <SearchX className="w-10 h-10" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-bold text-text-header-light dark:text-white mb-2 font-display">
                        Nenhum imóvel encontrado
                    </h3>
                    <p className="text-text-body-light dark:text-gray-400 mb-8 leading-relaxed font-medium">
                        Os filtros atuais não retornaram resultados ou o inventário está vazio.
                    </p>
                    {onNew && (
                        <Button onClick={onNew} className="bg-primary hover:bg-primary-dark text-background-dark rounded-xl shadow-glow transition-all flex items-center gap-2 px-6 py-3">
                            <Plus size={20} />
                            Cadastrar Novo Imóvel
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    // Grid View (Default)
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
            {developments.map((dev) => (
                <DevelopmentCard
                    key={dev.id}
                    development={dev}
                    onEdit={() => onEdit(dev.id)}
                    onDelete={() => onDelete(dev.id)}
                    isSelected={selectedIds?.includes(dev.id)}
                    onSelect={onSelect ? () => onSelect(dev.id) : undefined}
                />
            ))}
        </div>
    )
}
