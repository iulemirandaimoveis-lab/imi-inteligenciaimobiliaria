'use client'

import React, { useState, useEffect } from 'react'
import {
    Users,
    Phone,
    Mail,
    DollarSign,
    Building2,
    TrendingUp,
    Plus,
    Filter,
    Search,
    MoreVertical
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
    DndContext,
    DragOverlay,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent
} from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import LeadFormModal from './LeadFormModal'

const supabase = createClient()

interface Lead {
    id: string
    name: string
    email: string
    phone: string
    status: string
    score: number
    source: string
    capital: number
    interest: string
    development_id: string | null
    assigned_to: string | null
    created_at: string
    updated_at: string
    last_interaction_at: string | null
    development?: {
        name: string
    }
    assigned_user?: {
        name: string
    }
}

const STAGES = [
    { id: 'new', name: 'Novo', color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-700' },
    { id: 'contacted', name: 'Contatado', color: 'bg-yellow-500', lightColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
    { id: 'qualified', name: 'Qualificado', color: 'bg-purple-500', lightColor: 'bg-purple-50', textColor: 'text-purple-700' },
    { id: 'proposal', name: 'Proposta', color: 'bg-orange-500', lightColor: 'bg-orange-50', textColor: 'text-orange-700' },
    { id: 'negotiation', name: 'Negociação', color: 'bg-pink-500', lightColor: 'bg-pink-50', textColor: 'text-pink-700' },
    { id: 'won', name: 'Ganho', color: 'bg-green-500', lightColor: 'bg-green-50', textColor: 'text-green-700' },
    { id: 'lost', name: 'Perdido', color: 'bg-red-500', lightColor: 'bg-red-50', textColor: 'text-red-700' }
]

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: lead.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className="bg-white dark:bg-card-dark rounded-xl border border-gray-100 dark:border-white/5 p-4 mb-3 cursor-move hover:shadow-md transition-all group relative overflow-hidden"
        >
            {/* Indicador de Status/Score lateral */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${lead.score >= 80 ? 'bg-green-500' :
                    lead.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />

            {/* Header */}
            <div className="flex items-start justify-between mb-3 pl-2">
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 dark:text-white truncate">{lead.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${lead.score >= 80 ? 'bg-green-100 text-green-700' :
                                lead.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                            }`}>
                            <TrendingUp size={10} />
                            Score {lead.score}
                        </div>
                    </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded transition-all">
                    <MoreVertical size={16} className="text-gray-400" />
                </button>
            </div>

            {/* Info */}
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400 pl-2">
                {lead.email && (
                    <div className="flex items-center gap-2 truncate">
                        <Mail size={12} className="flex-shrink-0 opacity-70" />
                        <span className="truncate">{lead.email}</span>
                    </div>
                )}

                {lead.phone && (
                    <div className="flex items-center gap-2">
                        <Phone size={12} className="flex-shrink-0 opacity-70" />
                        <span>{lead.phone}</span>
                    </div>
                )}

                {lead.capital > 0 && (
                    <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-300">
                        <DollarSign size={12} className="flex-shrink-0 opacity-70" />
                        <span>
                            {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                                minimumFractionDigits: 0
                            }).format(lead.capital)}
                        </span>
                    </div>
                )}

                {lead.development?.name && (
                    <div className="flex items-center gap-2 truncate text-primary font-medium">
                        <Building2 size={12} className="flex-shrink-0" />
                        <span className="truncate">{lead.development.name}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-white/5 pl-2">
                <div className="text-[10px] text-gray-400">
                    {new Date(lead.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </div>

                {lead.assigned_user?.name ? (
                    <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-full">
                        <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                            {lead.assigned_user.name.charAt(0)}
                        </div>
                        <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 truncate max-w-[80px]">
                            {lead.assigned_user.name.split(' ')[0]}
                        </span>
                    </div>
                ) : (
                    <div className="text-[10px] text-gray-400 italic">Sem dono</div>
                )}
            </div>
        </div>
    )
}

function KanbanColumn({ stage, leads, onAddLead }: {
    stage: typeof STAGES[0]
    leads: Lead[]
    onAddLead: () => void
}) {
    const { setNodeRef } = useSortable({ id: stage.id })

    const totalValue = leads.reduce((sum, lead) => sum + (lead.capital || 0), 0)

    return (
        <div className="flex-shrink-0 w-80 flex flex-col h-full">
            {/* Column Header */}
            <div className={`rounded-t-2xl border-t-4 ${stage.color} p-4 bg-gray-50 dark:bg-white/5 border-x border-gray-100 dark:border-white/5`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <h3 className={`font-bold ${stage.textColor}`}>{stage.name}</h3>
                        <div className={`min-w-[1.5rem] h-6 px-1.5 rounded-full ${stage.color} text-white text-xs font-bold flex items-center justify-center`}>
                            {leads.length}
                        </div>
                    </div>
                    <button
                        onClick={onAddLead}
                        className={`w-8 h-8 rounded-lg ${stage.color} text-white hover:brightness-110 transition-all flex items-center justify-center shadow-sm`}
                    >
                        <Plus size={16} />
                    </button>
                </div>

                {/* Stats */}
                {leads.length > 0 && (
                    <div className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <DollarSign size={12} />
                        {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            maximumFractionDigits: 0
                        }).format(totalValue)}
                    </div>
                )}
            </div>

            {/* Column Body */}
            <div
                ref={setNodeRef}
                className="flex-1 bg-gray-50/50 dark:bg-black/20 rounded-b-2xl p-3 border-x border-b border-gray-100 dark:border-white/5 min-h-[calc(100vh-340px)] max-h-[calc(100vh-340px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10"
            >
                <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                    {leads.map((lead) => (
                        <LeadCard key={lead.id} lead={lead} onClick={() => { }} />
                    ))}
                </SortableContext>

                {leads.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-white/5 rounded-xl">
                        <div className={`w-12 h-12 rounded-full ${stage.lightColor} flex items-center justify-center mx-auto mb-3`}>
                            <Users size={20} className={stage.textColor} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Vazio</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function LeadsKanbanBoard() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [modalStage, setModalStage] = useState<string>('new')

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8
            }
        })
    )

    useEffect(() => {
        loadLeads()
    }, [])

    const loadLeads = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('leads')
            .select(`
        *,
        development:developments(name),
        assigned_user:auth.users(name)
      `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error loading leads:', error)
            toast.error('Erro ao carregar leads')
        } else {
            setLeads(data || [])
        }
        setLoading(false)
    }

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (!over) return

        const leadId = active.id as string
        const newStage = over.id as string

        // Se mudou de coluna
        const lead = leads.find(l => l.id === leadId)
        if (lead && lead.status !== newStage) {
            // Atualizar otimisticamente
            setLeads(prevLeads =>
                prevLeads.map(l =>
                    l.id === leadId ? { ...l, status: newStage } : l
                )
            )

            // Atualizar no banco
            const { error } = await supabase
                .from('leads')
                .update({
                    status: newStage,
                    updated_at: new Date().toISOString()
                })
                .eq('id', leadId)

            if (error) {
                console.error('Error updating lead:', error)
                toast.error('Erro ao mover lead')
                // Reverter mudança
                loadLeads()
            } else {
                const stageName = STAGES.find(s => s.id === newStage)?.name
                toast.success(`Lead movido para ${stageName}`)
            }
        }

        setActiveId(null)
    }

    const handleAddLead = (stage: string) => {
        setModalStage(stage)
        setShowModal(true)
    }

    const filteredLeads = searchTerm
        ? leads.filter(lead =>
            lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.phone?.includes(searchTerm)
        )
        : leads

    const groupedLeads = STAGES.map(stage => ({
        stage,
        leads: filteredLeads.filter(lead => lead.status === stage.id)
    }))

    // Calcular estatísticas
    const stats = {
        total: leads.length,
        new: leads.filter(l => l.status === 'new').length,
        won: leads.filter(l => l.status === 'won').length,
        totalValue: leads.reduce((sum, l) => sum + (l.capital || 0), 0),
        conversionRate: leads.length > 0
            ? ((leads.filter(l => l.status === 'won').length / leads.length) * 100).toFixed(1)
            : 0
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Carregando pipeline...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                    <div className="text-sm text-gray-500 mt-1">Total de Leads</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-900/30 p-6">
                    <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">{stats.new}</div>
                    <div className="text-sm text-blue-600 dark:text-blue-300 mt-1">Novos</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-200 dark:border-green-900/30 p-6">
                    <div className="text-3xl font-bold text-green-700 dark:text-green-400">{stats.won}</div>
                    <div className="text-sm text-green-600 dark:text-green-300 mt-1">Ganhos</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-200 dark:border-purple-900/30 p-6">
                    <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">{stats.conversionRate}%</div>
                    <div className="text-sm text-purple-600 dark:text-purple-300 mt-1">Taxa Conversão</div>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar leads por nome, email ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white dark:bg-card-dark border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                    />
                </div>
                <button className="h-12 px-6 bg-white dark:bg-card-dark border border-gray-200 dark:border-white/10 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2 shadow-sm">
                    <Filter size={20} />
                    Filtros
                </button>
            </div>

            {/* Kanban Board */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
                    {groupedLeads.map(({ stage, leads }) => (
                        <KanbanColumn
                            key={stage.id}
                            stage={stage}
                            leads={leads}
                            onAddLead={() => handleAddLead(stage.id)}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeId ? (
                        <div className="bg-white dark:bg-card-dark rounded-xl border-2 border-primary p-4 shadow-2xl opacity-90 rotate-3 cursor-grabbing w-[300px]">
                            <div className="font-bold text-gray-900 dark:text-white mb-2">
                                {leads.find(l => l.id === activeId)?.name}
                            </div>
                            <div className="text-xs text-primary font-medium">Movendo...</div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Modal - Renderizado condicionalmente para garantir que não pese na renderização inicial */}
            {showModal && (
                <LeadFormModal
                    initialStatus={modalStage}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        loadLeads()
                        setShowModal(false)
                    }}
                />
            )}
        </div>
    )
}
