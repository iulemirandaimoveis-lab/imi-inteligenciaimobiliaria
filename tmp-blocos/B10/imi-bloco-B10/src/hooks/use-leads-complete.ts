'use client'
// hooks/use-leads-complete.ts
// Hooks completos para gestão de leads

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import useSWR, { mutate } from 'swr'

const supabase = createClient()

export interface Lead {
    id: string
    name: string
    email: string
    phone: string
    status: string
    score: number
    source: string
    interest: string
    capital: number | null
    development_id: string | null
    message: string | null
    assigned_to: string | null
    tags: string[]
    created_at: string
    updated_at: string
    last_interaction_at: string | null
    development?: any
    assigned_user?: any
}

export interface LeadFilters {
    search?: string
    status?: string
    source?: string
    score_min?: number
    score_max?: number
    capital_min?: number
    capital_max?: number
    assigned_to?: string
    development_id?: string
    tags?: string[]
    date_from?: string
    date_to?: string
}

/**
 * Hook para listar leads com filtros
 */
export function useLeads(filters: LeadFilters = {}) {
    const { data, error, mutate: revalidate } = useSWR(
        ['leads', JSON.stringify(filters)],
        async () => {
            let query = supabase
                .from('leads')
                .select(`
          *,
          development:developments(id, name),
          assigned_user:auth.users(id, name)
        `, { count: 'exact' })

            // Aplicar filtros
            if (filters.search) {
                query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
            }

            if (filters.status && filters.status !== 'all') {
                query = query.eq('status', filters.status)
            }

            if (filters.source && filters.source !== 'all') {
                query = query.eq('source', filters.source)
            }

            if (filters.score_min) {
                query = query.gte('score', filters.score_min)
            }

            if (filters.score_max) {
                query = query.lte('score', filters.score_max)
            }

            if (filters.capital_min) {
                query = query.gte('capital', filters.capital_min)
            }

            if (filters.capital_max) {
                query = query.lte('capital', filters.capital_max)
            }

            if (filters.assigned_to) {
                query = query.eq('assigned_to', filters.assigned_to)
            }

            if (filters.development_id) {
                query = query.eq('development_id', filters.development_id)
            }

            if (filters.tags && filters.tags.length > 0) {
                query = query.contains('tags', filters.tags)
            }

            if (filters.date_from) {
                query = query.gte('created_at', filters.date_from)
            }

            if (filters.date_to) {
                query = query.lte('created_at', filters.date_to)
            }

            query = query.order('created_at', { ascending: false })

            const { data, error, count } = await query

            if (error) throw error

            return { data: data as Lead[], count }
        }
    )

    return {
        leads: data?.data || [],
        total: data?.count || 0,
        isLoading: !error && !data,
        isError: error,
        revalidate
    }
}

/**
 * Hook para buscar um lead específico
 */
export function useLead(id: string | null) {
    const { data, error, mutate: revalidate } = useSWR(
        id ? ['lead', id] : null,
        async () => {
            const { data, error } = await supabase
                .from('leads')
                .select(`
          *,
          development:developments(*),
          assigned_user:auth.users(id, name),
          interactions:lead_interactions(*)
        `)
                .eq('id', id)
                .single()

            if (error) throw error
            return data as Lead
        }
    )

    return {
        lead: data,
        isLoading: !error && !data,
        isError: error,
        revalidate
    }
}

/**
 * Hook para operações CRUD de leads
 */
export function useLeadActions() {
    const [loading, setLoading] = useState(false)

    const createLead = useCallback(async (data: Partial<Lead>) => {
        setLoading(true)
        try {
            const { data: result, error } = await supabase
                .from('leads')
                .insert({
                    ...data,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error

            mutate((key) => Array.isArray(key) && key[0] === 'leads')
            return result as Lead
        } finally {
            setLoading(false)
        }
    }, [])

    const updateLead = useCallback(async (id: string, data: Partial<Lead>) => {
        setLoading(true)
        try {
            const { data: result, error } = await supabase
                .from('leads')
                .update({
                    ...data,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single()

            if (error) throw error

            mutate(['lead', id])
            mutate((key) => Array.isArray(key) && key[0] === 'leads')
            return result as Lead
        } finally {
            setLoading(false)
        }
    }, [])

    const deleteLead = useCallback(async (id: string) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('leads')
                .delete()
                .eq('id', id)

            if (error) throw error

            mutate((key) => Array.isArray(key) && key[0] === 'leads')
        } finally {
            setLoading(false)
        }
    }, [])

    const updateLeadStatus = useCallback(async (id: string, status: string) => {
        return updateLead(id, { status })
    }, [updateLead])

    const assignLead = useCallback(async (id: string, userId: string) => {
        return updateLead(id, { assigned_to: userId })
    }, [updateLead])

    const updateLeadScore = useCallback(async (id: string, score: number) => {
        return updateLead(id, { score })
    }, [updateLead])

    return {
        createLead,
        updateLead,
        deleteLead,
        updateLeadStatus,
        assignLead,
        updateLeadScore,
        loading
    }
}

/**
 * Hook para estatísticas de leads
 */
export function useLeadStats() {
    const { data, error } = useSWR('lead-stats', async () => {
        const { data, error } = await supabase
            .from('leads')
            .select('status, score, capital, source, created_at')

        if (error) throw error

        // Calcular estatísticas
        const now = new Date()
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

        const stats = {
            total: data.length,
            byStatus: {} as Record<string, number>,
            bySource: {} as Record<string, number>,
            avgScore: 0,
            totalCapital: 0,
            thisMonth: 0,
            lastMonth: 0,
            conversionRate: 0
        }

        data.forEach(lead => {
            // Por status
            stats.byStatus[lead.status] = (stats.byStatus[lead.status] || 0) + 1

            // Por fonte
            stats.bySource[lead.source] = (stats.bySource[lead.source] || 0) + 1

            // Score médio
            stats.avgScore += lead.score || 0

            // Capital total
            stats.totalCapital += lead.capital || 0

            // Este mês
            const leadDate = new Date(lead.created_at)
            if (leadDate >= thisMonth) stats.thisMonth++
            if (leadDate >= lastMonth && leadDate < thisMonth) stats.lastMonth++
        })

        stats.avgScore = data.length > 0 ? stats.avgScore / data.length : 0
        stats.conversionRate = data.length > 0
            ? ((stats.byStatus['won'] || 0) / data.length) * 100
            : 0

        return stats
    })

    return {
        stats: data,
        isLoading: !error && !data,
        isError: error
    }
}

/**
 * Hook para operações em lote
 */
export function useBulkLeadActions() {
    const [loading, setLoading] = useState(false)

    const bulkUpdateStatus = useCallback(async (ids: string[], status: string) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('leads')
                .update({ status, updated_at: new Date().toISOString() })
                .in('id', ids)

            if (error) throw error

            mutate((key) => Array.isArray(key) && key[0] === 'leads')
        } finally {
            setLoading(false)
        }
    }, [])

    const bulkAssign = useCallback(async (ids: string[], userId: string) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('leads')
                .update({ assigned_to: userId, updated_at: new Date().toISOString() })
                .in('id', ids)

            if (error) throw error

            mutate((key) => Array.isArray(key) && key[0] === 'leads')
        } finally {
            setLoading(false)
        }
    }, [])

    const bulkDelete = useCallback(async (ids: string[]) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('leads')
                .delete()
                .in('id', ids)

            if (error) throw error

            mutate((key) => Array.isArray(key) && key[0] === 'leads')
        } finally {
            setLoading(false)
        }
    }, [])

    const bulkAddTags = useCallback(async (ids: string[], tags: string[]) => {
        setLoading(true)
        try {
            // Buscar leads atuais
            const { data: leads, error: fetchError } = await supabase
                .from('leads')
                .select('id, tags')
                .in('id', ids)

            if (fetchError) throw fetchError

            // Atualizar cada lead
            const updates = leads.map(lead => ({
                id: lead.id,
                tags: [...new Set([...(lead.tags || []), ...tags])]
            }))

            const { data: upsertData, error } = await supabase
                .from('leads')
                .upsert(updates)

            if (error) throw error

            mutate((key) => Array.isArray(key) && key[0] === 'leads')
        } finally {
            setLoading(false)
        }
    }, [])

    return {
        bulkUpdateStatus,
        bulkAssign,
        bulkDelete,
        bulkAddTags,
        loading
    }
}

/**
 * Hook para exportar leads
 */
export function useLeadExport() {
    const exportToCSV = useCallback((leads: Lead[]) => {
        const headers = [
            'Nome',
            'Email',
            'Telefone',
            'Status',
            'Score',
            'Fonte',
            'Capital',
            'Interesse',
            'Empreendimento',
            'Data Criação'
        ]

        const rows = leads.map(lead => [
            lead.name,
            lead.email,
            lead.phone,
            lead.status,
            lead.score,
            lead.source,
            lead.capital || '',
            lead.interest || '',
            lead.development?.name || '',
            new Date(lead.created_at).toLocaleDateString('pt-BR')
        ])

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('
')

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
    }, [])

    return { exportToCSV }
}
