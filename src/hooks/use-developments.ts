// src/hooks/use-developments.ts
// VERSÃO FINAL - Baseada na estrutura REAL do banco

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export function useDevelopments(filters?: {
    search?: string
    status?: string
    type?: string
    developer?: string
}) {
    const { data, error, mutate } = useSWR(['developments', filters], async () => {
        let query = supabase
            .from('developments')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })

        // Campo correto: name
        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
        }

        // Campo correto: status
        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status)
        }

        // Campo correto: type (ou property_type como fallback)
        if (filters?.type && filters.type !== 'all') {
            query = query.or(`type.eq.${filters.type},property_type.eq.${filters.type}`)
        }

        if (filters?.developer) {
            query = query.eq('developer_id', filters.developer)
        }

        const { data, error, count } = await query
        if (error) throw error
        return { data, count }
    })

    return {
        developments: data?.data || [],
        total: data?.count || 0,
        isLoading: !error && !data,
        isError: error,
        mutate
    }
}

export function useDevelopment(id: string) {
    const { data, error, mutate } = useSWR(
        id ? ['development', id] : null,
        async () => {
            const { data, error } = await supabase
                .from('developments')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            return data
        }
    )

    return {
        development: data,
        isLoading: !error && !data,
        isError: error,
        mutate
    }
}

export async function createDevelopment(data: any) {
    const { data: newDev, error } = await supabase
        .from('developments')
        .insert(data)
        .select()
        .single()
    if (error) throw error
    return newDev
}

export async function updateDevelopment(id: string, updates: any) {
    const { data: updatedDev, error } = await supabase
        .from('developments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return updatedDev
}

export async function deleteDevelopment(id: string) {
    const { error } = await supabase
        .from('developments')
        .delete()
        .eq('id', id)
    if (error) throw error
}

export async function bulkUpdateDevelopments(ids: string[], updates: any) {
    const { error } = await supabase
        .from('developments')
        .update(updates)
        .in('id', ids)
    if (error) throw error
}

export async function bulkDeleteDevelopments(ids: string[]) {
    const { error } = await supabase
        .from('developments')
        .delete()
        .in('id', ids)
    if (error) throw error
}
