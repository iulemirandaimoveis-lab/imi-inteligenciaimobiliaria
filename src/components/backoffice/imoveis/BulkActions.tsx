'use client'

import { useState } from 'react'
import { CheckSquare, Square, Trash2, Eye, EyeOff, Star, StarOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'

interface BulkActionsProps {
    selectedIds: string[]
    onSelectAll: () => void
    onClearSelection: () => void
    totalCount: number
    onActionComplete: () => void
}

export default function BulkActions({
    selectedIds,
    onSelectAll,
    onClearSelection,
    totalCount,
    onActionComplete,
}: BulkActionsProps) {
    const supabase = createClient()
    const { showToast } = useToast()
    const [isProcessing, setIsProcessing] = useState(false)

    if (selectedIds.length === 0) {
        return (
            <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center justify-between shadow-soft animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                    <Square className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-600">Selecione imóveis para ações em massa</span>
                </div>
                <button
                    onClick={onSelectAll}
                    className="text-sm text-imi-600 hover:text-imi-700 font-medium"
                >
                    Selecionar Todos ({totalCount})
                </button>
            </div>
        )
    }

    async function handleBulkAction(action: 'activate' | 'deactivate' | 'feature' | 'unfeature' | 'delete') {
        const confirmMessages = {
            activate: `Ativar ${selectedIds.length} imóveis?`,
            deactivate: `Desativar ${selectedIds.length} imóveis?`,
            feature: `Marcar ${selectedIds.length} imóveis como destaque?`,
            unfeature: `Remover destaque de ${selectedIds.length} imóveis?`,
            delete: `ATENÇÃO: Excluir permanentemente ${selectedIds.length} imóveis? Esta ação não pode ser desfeita!`,
        }

        if (!confirm(confirmMessages[action])) return

        setIsProcessing(true)

        try {
            if (action === 'delete') {
                const { error } = await supabase
                    .from('developments')
                    .delete()
                    .in('id', selectedIds)

                if (error) throw error
            } else {
                const updates: Record<string, unknown> = {}

                switch (action) {
                    case 'activate':
                        updates.status_commercial = 'published'
                        break
                    case 'deactivate':
                        updates.status_commercial = 'draft'
                        break
                    case 'feature':
                        updates.featured = true
                        break
                    case 'unfeature':
                        updates.featured = false
                        break
                }

                const { error } = await supabase
                    .from('developments')
                    .update(updates)
                    .in('id', selectedIds)

                if (error) throw error
            }

            showToast(`Ação executada com sucesso em ${selectedIds.length} imóveis!`, 'success')
            onClearSelection()
            onActionComplete()
        } catch (err: unknown) {
            showToast('Erro ao executar ação: ' + (err instanceof Error ? err.message : 'Erro desconhecido'), 'error')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="bg-imi-50 border border-imi-200 rounded-xl p-4 mb-6 animate-in slide-in-from-top-2">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <CheckSquare className="w-5 h-5 text-imi-900" />
                    <span className="font-semibold text-imi-900">
                        {selectedIds.length} {selectedIds.length === 1 ? 'imóvel selecionado' : 'imóveis selecionados'}
                    </span>
                    <button
                        onClick={onClearSelection}
                        className="text-sm text-imi-600 hover:text-imi-700 underline"
                    >
                        Limpar seleção
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 md:ml-auto">
                    <button
                        onClick={() => handleBulkAction('activate')}
                        disabled={isProcessing}
                        className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                        Ativar
                    </button>

                    <button
                        onClick={() => handleBulkAction('deactivate')}
                        disabled={isProcessing}
                        className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                        <EyeOff className="w-4 h-4" />
                        Desativar
                    </button>

                    <button
                        onClick={() => handleBulkAction('feature')}
                        disabled={isProcessing}
                        className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                        <Star className="w-4 h-4" />
                        Destacar
                    </button>

                    <button
                        onClick={() => handleBulkAction('unfeature')}
                        disabled={isProcessing}
                        className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                        <StarOff className="w-4 h-4" />
                        Remover Destaque
                    </button>

                    <button
                        onClick={() => handleBulkAction('delete')}
                        disabled={isProcessing}
                        className="px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                    </button>
                </div>
            </div>

            {isProcessing && (
                <div className="mt-3 text-sm text-imi-700 animate-pulse">
                    Processando ação...
                </div>
            )}
        </div>
    )
}
