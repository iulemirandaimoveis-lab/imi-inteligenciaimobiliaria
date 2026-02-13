'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import KanbanColumn from './KanbanColumn'
import KanbanCard from './KanbanCard'
import { Lead } from '@/types/lead'

interface KanbanBoardProps {
    initialLeads: Lead[]
    onLeadMove?: (leadId: string, newStatus: string) => void
}

const COLUMNS = [
    { id: 'new', title: 'Novo Lead', color: 'bg-primary' },
    { id: 'contacted', title: 'Em Contato', color: 'bg-blue-600' },
    { id: 'visit_scheduled', title: 'Visita', color: 'bg-purple-600' },
    { id: 'proposal', title: 'Proposta', color: 'bg-orange-500' },
    { id: 'won', title: 'Vendido', color: 'bg-green-600' },
    { id: 'lost', title: 'Perdido', color: 'bg-gray-500' },
]

export default function KanbanBoard({ initialLeads, onLeadMove }: KanbanBoardProps) {
    // Group leads by status
    const [items, setItems] = useState<{ [key: string]: Lead[] }>({})

    useEffect(() => {
        const grouped: { [key: string]: Lead[] } = {}
        COLUMNS.forEach(col => grouped[col.id] = [])
        initialLeads.forEach(lead => {
            const status = lead.status || 'new'
            const validStatus = COLUMNS.find(c => c.id === status) ? status : 'new'
            if (grouped[validStatus]) grouped[validStatus].push(lead)
        })
        setItems(grouped)
    }, [initialLeads])

    const [activeId, setActiveId] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const findContainer = (id: string) => {
        if (id in items) return id
        return Object.keys(items).find(key => items[key].find(item => item.id === id))
    }

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        const overId = over?.id

        if (!overId || active.id === overId) return

        const activeContainer = findContainer(active.id as string)
        const overContainer = findContainer(overId as string)

        if (!activeContainer || !overContainer || activeContainer === overContainer) return

        // Visually move item during drag
        setItems((prev) => {
            const activeItems = prev[activeContainer]
            const overItems = prev[overContainer]
            const activeIndex = activeItems.findIndex((item) => item.id === active.id)
            const overIndex = overItems.findIndex((item) => item.id === overId)

            let newIndex
            if (overId in prev) {
                newIndex = overItems.length + 1
            } else {
                const isBelowOverItem =
                    over &&
                    active.rect.current.translated &&
                    active.rect.current.translated.top > over.rect.top + over.rect.height
                const modifier = isBelowOverItem ? 1 : 0
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1
            }

            const newItems = {
                ...prev,
                [activeContainer]: [
                    ...prev[activeContainer].filter((item) => item.id !== active.id),
                ],
                [overContainer]: [
                    ...prev[overContainer].slice(0, newIndex),
                    activeItems[activeIndex],
                    ...prev[overContainer].slice(newIndex, prev[overContainer].length),
                ],
            }
            return newItems
        })
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        const activeContainer = findContainer(active.id as string)
        const overContainer = findContainer(over?.id as string)

        if (activeContainer && overContainer && activeContainer !== overContainer) {
            onLeadMove?.(active.id as string, overContainer)
        }

        setActiveId(null)
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full gap-5 overflow-x-auto pb-4 items-start min-w-full">
                {COLUMNS.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        color={col.color}
                        leads={items[col.id] || []}
                    />
                ))}
            </div>
            <DragOverlay>
                {activeId ? (
                    <div className="transform rotate-3 cursor-grabbing scale-105 shadow-2xl">
                        <KanbanCard lead={initialLeads.find(l => l.id === activeId)!} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
