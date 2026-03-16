'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { useCallback } from 'react'

export interface PropertyEvent {
    id: string
    property_id: string
    title: string
    description: string
    event_type: 'creation' | 'update' | 'lead' | 'view' | 'unit_sold'
    metadata: Record<string, unknown> | null
    created_at: string
}

export function usePropertyEvents(propertyId: string) {
    const supabase = createClient()
    const fetcher = useCallback(async () => {
        if (!propertyId) return []
        const { data, error } = await supabase
            .from('property_events')
            .select('*')
            .eq('property_id', propertyId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as PropertyEvent[]
    }, [propertyId])

    const { data, error, isLoading, mutate } = useSWR(
        propertyId ? ['property_events', propertyId] : null,
        fetcher
    )

    return {
        events: data || [],
        isLoading: !error && !data,
        isError: error,
        mutate,
    }
}

export async function createEvent(data: Omit<PropertyEvent, 'id' | 'created_at'>) {
    const supabase = createClient()
    const { data: event, error } = await supabase
        .from('property_events')
        .insert(data)
        .select()
        .single()
    if (error) throw error
    return event
}
