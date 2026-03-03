'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { PropertyUnit, PropertyEvent } from '../types'
import { useCallback } from 'react'

const supabase = createClient()

// --- HOOKS PARA UNIDADES ---

export function usePropertyUnits(propertyId: string) {
    const fetcher = useCallback(async () => {
        if (!propertyId) return []
        const { data, error } = await supabase
            .from('development_units')
            .select('*')
            .eq('development_id', propertyId)
            .order('unit_name', { ascending: true })

        if (error) throw error
        return data as any[] // Mapear para PropertyUnit se necessário
    }, [propertyId])

    const { data, error, isLoading, mutate } = useSWR(
        propertyId ? ['property_units', propertyId] : null,
        fetcher
    )

    return {
        units: data || [],
        isLoading,
        error,
        mutate,
    }
}

export async function createUnit(data: any) {
    const { data: unit, error } = await supabase
        .from('development_units')
        .insert([data])
        .select()
        .single()

    if (error) throw error
    return unit
}

export async function updateUnit(id: string, data: any) {
    const { data: unit, error } = await supabase
        .from('development_units')
        .update(data)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return unit
}

export async function deleteUnit(id: string) {
    const { error } = await supabase
        .from('development_units')
        .delete()
        .eq('id', id)

    if (error) throw error
}

// --- HOOKS PARA EVENTOS ---

export function usePropertyEvents(propertyId: string) {
    const fetcher = useCallback(async () => {
        if (!propertyId) return []
        const { data, error } = await supabase
            .from('property_events') // Tabela da migration 002
            .select('*')
            .eq('property_id', propertyId)
            .order('event_date', { ascending: false })

        if (error) throw error
        return data as PropertyEvent[]
    }, [propertyId])

    const { data, error, isLoading, mutate } = useSWR(
        propertyId ? ['property_events', propertyId] : null,
        fetcher
    )

    return {
        events: data || [],
        isLoading,
        error,
        mutate,
    }
}

export async function createPropertyEvent(data: any) {
    const { data: event, error } = await supabase
        .from('property_events')
        .insert([data])
        .select()
        .single()

    if (error) throw error
    return event
}

export async function deletePropertyEvent(id: string) {
    const { error } = await supabase
        .from('property_events')
        .delete()
        .eq('id', id)

    if (error) throw error
}
