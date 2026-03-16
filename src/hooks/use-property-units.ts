'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { useCallback } from 'react'

export interface PropertyUnit {
    id: string
    property_id: string
    unit_number: string
    floor: number
    type: string
    bedrooms: number
    bathrooms: number
    area: number
    price: number
    status: 'available' | 'reserved' | 'sold'
    created_at?: string
}

export function usePropertyUnits(propertyId: string) {
    const supabase = createClient()
    const fetcher = useCallback(async () => {
        if (!propertyId) return []
        const { data, error } = await supabase
            .from('property_units')
            .select('*')
            .eq('property_id', propertyId)
            .order('unit_number', { ascending: true })

        if (error) throw error
        return data as PropertyUnit[]
    }, [propertyId])

    const { data, error, isLoading, mutate } = useSWR(
        propertyId ? ['property_units', propertyId] : null,
        fetcher
    )

    return {
        units: data || [],
        isLoading: !error && !data,
        isError: error,
        mutate,
    }
}

export async function createUnit(data: Omit<PropertyUnit, 'id' | 'created_at'>) {
    const supabase = createClient()
    const { data: unit, error } = await supabase
        .from('property_units')
        .insert(data)
        .select()
        .single()
    if (error) throw error
    return unit
}

export async function updateUnit(id: string, data: Partial<PropertyUnit>) {
    const supabase = createClient()
    const { data: unit, error } = await supabase
        .from('property_units')
        .update(data)
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return unit
}

export async function deleteUnit(id: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('property_units')
        .delete()
        .eq('id', id)
    if (error) throw error
}
