'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/backoffice/PageHeader'
import KanbanBoard from '@/components/backoffice/leads/KanbanBoard'
import Input from '@/components/ui/Input'
import { toast } from 'sonner'

export default function LeadsKanbanPage() {
    const supabase = createClient()
    const [searchTerm, setSearchTerm] = useState('')

    const { data: leads = [], mutate, isLoading } = useSWR('leads_kanban', async () => {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false })
        if (error) throw error
        return data || []
    })

    const handleLeadMove = async (leadId: string, newStatus: string) => {
        // Optimistic update
        mutate((currentData: any) => {
            return currentData.map((l: any) => l.id === leadId ? { ...l, status: newStatus } : l)
        }, false)

        try {
            const { error } = await supabase
                .from('leads')
                .update({ status: newStatus })
                .eq('id', leadId)

            if (error) throw error
            toast.success('Status atualizado')
        } catch (err) {
            console.error(err)
            toast.error('Erro ao mover lead')
            mutate() // Revert
        }
    }

    const filteredLeads = leads.filter((l: any) =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="h-[calc(100vh-theme(spacing.32))] flex flex-col space-y-6">
            <PageHeader
                title="Pipeline Kanban"
                description="Gerencie o fluxo de vendas arrastando os cards entre as etapas."
                breadcrumbs={[
                    { label: 'Leads', href: '/backoffice/leads' },
                    { label: 'Pipeline' }
                ]}
                action={
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="hidden md:block w-64">
                            <Input
                                placeholder="Buscar lead..."
                                icon={<Search size={18} />}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white dark:bg-card-dark rounded-2xl"
                            />
                        </div>
                        <Button icon={<Plus size={18} />} className="whitespace-nowrap rounded-2xl">
                            Novo Lead
                        </Button>
                    </div>
                }
            />

            {/* Board Area */}
            <div className="flex-1 overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="relative w-12 h-12">
                            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                        </div>
                    </div>
                ) : (
                    <KanbanBoard
                        initialLeads={filteredLeads}
                        onLeadMove={handleLeadMove}
                    />
                )}
            </div>
        </div>
    )
}
