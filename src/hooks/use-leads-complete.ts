'use client'
// hooks/use-leads-complete.ts

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
    interest_type: string | null
    interest_location: string | null
    capital: number | null
    budget_min: number | null
    budget_max: number | null
    development_id: string | null
    message: string | null
    notes: string | null
    assigned_to: string | null
    tags: string[]
    country: string
    currency: string
    language: string
    city: string | null
    state: string | null
    nationality: string | null
    investment_goal: string | null
    experience_level: string | null
    created_at: string
    updated_at: string
    last_interaction_at: string | null
    development?: any
    interactions?: any[]
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
    country?: string
}

const LEAD_SELECT = `
  id, name, email, phone, status, score, ai_score, source, origin,
  interest_type, interest_location, capital, budget_min, budget_max,
  development_id, message, notes, assigned_to, tags,
  country, currency, language, city, state, nationality,
  investment_goal, experience_level, utm_source,
  created_at, updated_at, last_interaction_at,
  development:developments(id, name, slug)
`

function mapLead(l: any): Lead {
    return {
        id: l.id,
        name: l.name || 'Sem nome',
        email: l.email || '',
        phone: l.phone || l.whatsapp || '',
        status: l.status || 'new',
        score: l.score || l.ai_score || 50,
        source: l.source || l.origin || l.utm_source || 'website',
        interest: l.interest_type || '',
        interest_type: l.interest_type || null,
        interest_location: l.interest_location || null,
        capital: l.capital || l.budget_min || null,
        budget_min: l.budget_min || null,
        budget_max: l.budget_max || null,
        development_id: l.development_id || null,
        message: l.message || null,
        notes: l.notes || null,
        assigned_to: l.assigned_to || null,
        tags: Array.isArray(l.tags) ? l.tags : [],
        country: l.country || 'BR',
        currency: l.currency || 'BRL',
        language: l.language || 'pt',
        city: l.city || l.interest_location || null,
        state: l.state || null,
        nationality: l.nationality || null,
        investment_goal: l.investment_goal || null,
        experience_level: l.experience_level || null,
        created_at: l.created_at || new Date().toISOString(),
        updated_at: l.updated_at || l.created_at || new Date().toISOString(),
        last_interaction_at: l.last_interaction_at || null,
        development: l.development || null,
        interactions: l.interactions || [],
    }
}

export function useLeads(filters: LeadFilters = {}) {
    const { data, error, mutate: revalidate } = useSWR(
        ['leads', JSON.stringify(filters)],
        async () => {
            let query = supabase
                .from('leads')
                .select(LEAD_SELECT, { count: 'exact' })

            if (filters.search) {
                query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
            }
            if (filters.status && filters.status !== 'all') {
                query = query.eq('status', filters.status)
            }
            if (filters.source && filters.source !== 'all') {
                query = query.eq('source', filters.source)
            }
            if (filters.score_min) query = query.gte('score', filters.score_min)
            if (filters.score_max) query = query.lte('score', filters.score_max)
            if (filters.capital_min) query = query.gte('capital', filters.capital_min)
            if (filters.capital_max) query = query.lte('capital', filters.capital_max)
            if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to)
            if (filters.development_id) query = query.eq('development_id', filters.development_id)
            if (filters.country) query = query.eq('country', filters.country)
            if (filters.tags && filters.tags.length > 0) {
                query = query.contains('tags', filters.tags)
            }
            if (filters.date_from) query = query.gte('created_at', filters.date_from)
            if (filters.date_to) query = query.lte('created_at', filters.date_to)

            query = query.order('created_at', { ascending: false })

            const { data, error, count } = await query
            if (error) throw error

            return { data: (data || []).map(mapLead), count: count || 0 }
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

export function useLead(id: string | null) {
    const { data, error, mutate: revalidate } = useSWR(
        id ? ['lead', id] : null,
        async () => {
            const { data, error } = await supabase
                .from('leads')
                .select(`
                  ${LEAD_SELECT},
                  interactions:lead_interactions(id, interaction_type, title, description, outcome, created_at)
                `)
                .eq('id', id!)
                .single()

            if (error) throw error
            return mapLead(data)
        }
    )

    return {
        lead: data,
        isLoading: !error && !data,
        isError: error,
        revalidate
    }
}

export function useLeadActions() {
    const [loading, setLoading] = useState(false)

    const createLead = useCallback(async (data: Partial<Lead>) => {
        setLoading(true)
        try {
            const { data: result, error } = await supabase
                .from('leads')
                .insert({
                    name: data.name,
                    email: data.email || null,
                    phone: data.phone || null,
                    source: data.source || 'website',
                    status: data.status || 'new',
                    score: data.score || 50,
                    capital: data.capital || null,
                    budget_min: data.budget_min || null,
                    budget_max: data.budget_max || null,
                    interest_type: data.interest_type || null,
                    interest_location: data.interest_location || null,
                    development_id: data.development_id || null,
                    notes: data.notes || null,
                    tags: data.tags || [],
                    country: data.country || 'BR',
                    currency: data.currency || 'BRL',
                    language: data.language || 'pt',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error
            mutate((key) => Array.isArray(key) && key[0] === 'leads')
            return mapLead(result)
        } finally {
            setLoading(false)
        }
    }, [])

    const updateLead = useCallback(async (id: string, data: Partial<Lead>) => {
        setLoading(true)
        try {
            const { data: result, error } = await supabase
                .from('leads')
                .update({ ...data, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            mutate(['lead', id])
            mutate((key) => Array.isArray(key) && key[0] === 'leads')
            return mapLead(result)
        } finally {
            setLoading(false)
        }
    }, [])

    const deleteLead = useCallback(async (id: string) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('leads')
                .update({ status: 'archived', updated_at: new Date().toISOString() })
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

export function useLeadStats() {
    const { data, error } = useSWR('lead-stats', async () => {
        const { data, error } = await supabase
            .from('leads')
            .select('status, score, capital, source, country, created_at')
            .not('status', 'eq', 'archived')

        if (error) throw error

        const now = new Date()
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

        const stats = {
            total: data.length,
            byStatus: {} as Record<string, number>,
            bySource: {} as Record<string, number>,
            byCountry: {} as Record<string, number>,
            avgScore: 0,
            totalCapital: 0,
            thisMonth: 0,
            lastMonth: 0,
            conversionRate: 0
        }

        data.forEach(lead => {
            stats.byStatus[lead.status] = (stats.byStatus[lead.status] || 0) + 1
            const src = lead.source || 'website'
            stats.bySource[src] = (stats.bySource[src] || 0) + 1
            const ctry = lead.country || 'BR'
            stats.byCountry[ctry] = (stats.byCountry[ctry] || 0) + 1
            stats.avgScore += lead.score || 0
            stats.totalCapital += lead.capital || 0
            const leadDate = new Date(lead.created_at)
            if (leadDate >= thisMonth) stats.thisMonth++
            if (leadDate >= lastMonth && leadDate < thisMonth) stats.lastMonth++
        })

        stats.avgScore = data.length > 0 ? Math.round(stats.avgScore / data.length) : 0
        stats.conversionRate = data.length > 0
            ? Math.round(((stats.byStatus['won'] || 0) / data.length) * 100)
            : 0

        return stats
    })

    return { stats: data, isLoading: !error && !data, isError: error }
}

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
                .update({ status: 'archived', updated_at: new Date().toISOString() })
                .in('id', ids)
            if (error) throw error
            mutate((key) => Array.isArray(key) && key[0] === 'leads')
        } finally {
            setLoading(false)
        }
    }, [])

    return { bulkUpdateStatus, bulkAssign, bulkDelete, loading }
}

export function useLeadExport() {
    const exportToCSV = useCallback((leads: Lead[]) => {
        const headers = ['Nome', 'Email', 'Telefone', 'Status', 'Score', 'Fonte', 'Capital', 'Interesse', 'País', 'Empreendimento', 'Data Criação']
        const rows = leads.map(lead => [
            lead.name, lead.email, lead.phone, lead.status, lead.score,
            lead.source, lead.capital || '', lead.interest || '',
            lead.country || 'BR',
            lead.development?.name || '',
            new Date(lead.created_at).toLocaleDateString('pt-BR')
        ])
        const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
    }, [])

    return { exportToCSV }
}
