'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { Property, PropertyFilterParams } from '../types'
import { useState, useCallback } from 'react'

const supabase = createClient()

interface UsePropertiesReturn {
    properties: Property[]
    isLoading: boolean
    error: any
    mutate: () => void
    total: number
}

export function useProperties(filters?: PropertyFilterParams): UsePropertiesReturn {
    const [total, setTotal] = useState(0)

    const fetcher = useCallback(async () => {
        let query = supabase
            .from('developments')
            .select(`
        *,
        developers (
          id,
          name,
          logo_url,
          active
        )
      `, { count: 'exact' })

        // Filtros
        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,neighborhood.ilike.%${filters.search}%`)
        }

        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status)
        }

        if (filters?.type && filters.type !== 'all') {
            query = query.eq('type', filters.type)
        }

        if (filters?.developer_id && filters.developer_id !== 'all') {
            query = query.eq('developer_id', filters.developer_id)
        }

        if (filters?.neighborhood && filters.neighborhood !== 'all') {
            query = query.eq('neighborhood', filters.neighborhood)
        }

        if (filters?.price_min) {
            query = query.gte('price_from', filters.price_min)
        }

        if (filters?.price_max) {
            query = query.lte('price_from', filters.price_max)
        }

        if (filters?.bedrooms && filters.bedrooms !== 'all') {
            query = query.eq('bedrooms', filters.bedrooms)
        }

        // Ordenação
        switch (filters?.sort) {
            case 'price_asc':
                query = query.order('price_from', { ascending: true })
                break
            case 'price_desc':
                query = query.order('price_from', { ascending: false })
                break
            case 'name':
                query = query.order('name', { ascending: true })
                break
            case 'views':
                query = query.order('views', { ascending: false })
                break
            default:
                query = query.order('created_at', { ascending: false })
        }

        const { data, error, count } = await query

        if (error) throw error
        if (count !== null) setTotal(count)

        return data as Property[]
    }, [filters])

    const { data, error, isLoading, mutate } = useSWR(
        ['properties', JSON.stringify(filters)],
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 30000,
        }
    )

    return {
        properties: data || [],
        isLoading,
        error,
        mutate,
        total,
    }
}

export function useProperty(id: string) {
    const fetcher = useCallback(async () => {
        const { data, error } = await supabase
            .from('developments')
            .select(`
        *,
        developers (
          id,
          name,
          logo_url,
          active
        )
      `)
            .eq('id', id)
            .single()

        if (error) throw error
        return data as Property
    }, [id])

    const { data, error, isLoading, mutate } = useSWR(
        id ? ['property', id] : null,
        fetcher
    )

    return {
        property: data,
        isLoading,
        error,
        mutate,
    }
}

export async function createProperty(data: any) {
    const { data: property, error } = await supabase
        .from('developments')
        .insert([data])
        .select()
        .single()

    if (error) throw error
    return property
}

export async function updateProperty(id: string, data: any) {
    const { data: property, error } = await supabase
        .from('developments')
        .update(data)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return property
}

export async function deleteProperty(id: string) {
    const { error } = await supabase
        .from('developments')
        .delete()
        .eq('id', id)

    if (error) throw error
}
