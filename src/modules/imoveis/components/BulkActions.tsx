'use client'

import { useState } from 'react'
import { CheckSquare, Square, Trash2, Eye, EyeOff, Star, StarOff, Layers } from 'lucide-react'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

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
    const [isProcessing, setIsProcessing] = useState(false)

    if (selectedIds.length === 0) {
        return (
            <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-slate-300" />
                    <span className="text-sm font-medium text-slate-500">Selecione empreendimentos para realizar ações em lote</span>
                </div>
                <button
                    onClick={onSelectAll}
                    className="text-xs font-bold text-imi-900 uppercase tracking-widest hover:underline px-4 py-2"
                >
                    Selecionar Todos ({totalCount})
                </button>
            </div>
        )
    }

    async function handleBulkAction(action: 'activate' | 'deactivate' | 'feature' | 'unfeature' | 'archive' | 'delete') {
        const confirmMessages = {
            activate: `Deseja ativar ${selectedIds.length} imóveis selecionados?`,
            deactivate: `Deseja desativar ${selectedIds.length} imóveis selecionados?`,
            feature: `Transformar ${selectedIds.length} imóveis em destaque comercial?`,
            unfeature: `Remover status de destaque de ${selectedIds.length} imóveis?`,
            archive: `Arquivar ${selectedIds.length} imóveis selecionados?`,
            delete: `⚠️ ALERTA: Esta ação excluirá permanentemente ${selectedIds.length} registros. Esta operação é IRREVERSÍVEL. Confirmar?`,
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
                        updates.status = 'disponivel'
                        updates.status_commercial = 'published'
                        break
                    case 'deactivate':
                        updates.status = 'arquivado'
                        updates.status_commercial = 'draft'
                        break
                    case 'archive':
                        updates.status = 'arquivado'
                        updates.status_commercial = 'private'
                        break
                    case 'feature':
                        updates.is_highlighted = true
                        break
                    case 'unfeature':
                        updates.is_highlighted = false
                        break
                }

                const { error } = await supabase
                    .from('developments')
                    .update(updates)
                    .in('id', selectedIds)

                if (error) throw error
            }

            onClearSelection()
            onActionComplete()
        } catch (err: unknown) {
            alert('Erro ao processar lote: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="bg-imi-900 rounded-xl p-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-imi-800 rounded-lg flex items-center justify-center">
                        <CheckSquare className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white uppercase tracking-widest leading-none mb-1">
                            {selectedIds.length} {selectedIds.length === 1 ? 'Selecionado' : 'Selecionados'}
                        </span>
                        <button
                            onClick={onClearSelection}
                            className="text-[10px] font-bold text-imi-400 hover:text-white uppercase tracking-tighter text-left transition-colors"
                        >
                            Cancelar Seleção
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 md:ml-auto">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('activate')}
                        disabled={isProcessing}
                        className="bg-imi-800 border-imi-700 text-white text-[10px] h-9 px-3 hover:bg-imi-700"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        Ativar
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('deactivate')}
                        disabled={isProcessing}
                        className="bg-imi-800 border-imi-700 text-white text-[10px] h-9 px-3 hover:bg-imi-700"
                    >
                        <EyeOff className="w-3.5 h-3.5" />
                        Desativar
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('feature')}
                        disabled={isProcessing}
                        className="bg-imi-800 border-imi-700 text-white text-[10px] h-9 px-3 hover:bg-imi-700"
                    >
                        <Star className="w-3.5 h-3.5" />
                        Destacar
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('archive')}
                        disabled={isProcessing}
                        className="bg-imi-800 border-imi-700 text-white text-[10px] h-9 px-3 hover:bg-imi-700"
                    >
                        <Square className="w-3.5 h-3.5" />
                        Arquivar
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('delete')}
                        disabled={isProcessing}
                        className="bg-red-900/40 border-red-800 text-red-100 text-[10px] h-9 px-3 hover:bg-red-800"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir Permanente
                    </Button>
                </div>
            </div>
        </div>
    )
}
