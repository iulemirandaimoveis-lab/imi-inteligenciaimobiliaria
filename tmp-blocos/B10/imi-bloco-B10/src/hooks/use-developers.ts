'use client'
// hooks/use-developers.ts
// Hook para gestão de developers (construtoras)

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import useSWR, { mutate } from 'swr'

const supabase = createClient()

export interface Developer {
    id: string
    name: string
    description: string | null
    logo_url: string | null
    website: string | null
    email: string | null
    phone: string | null
    created_at: string
    updated_at: string
}

export function useDevelopers() {
    const { data, error, mutate: revalidate } = useSWR('developers', async () => {
        const { data, error } = await supabase
            .from('developers')
            .select('*')
            .order('name')

        if (error) throw error
        return data as Developer[]
    })

    return {
        developers: data || [],
        isLoading: !error && !data,
        isError: error,
        revalidate
    }
}

export function useDeveloper(id: string | null) {
    const { data, error, mutate: revalidate } = useSWR(
        id ? ['developer', id] : null,
        async () => {
            const { data, error } = await supabase
                .from('developers')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            return data as Developer
        }
    )

    return {
        developer: data,
        isLoading: !error && !data,
        isError: error,
        revalidate
    }
}

export function useDeveloperActions() {
    const [loading, setLoading] = useState(false)

    const createDeveloper = useCallback(async (data: Partial<Developer>) => {
        setLoading(true)
        try {
            const { data: result, error } = await supabase
                .from('developers')
                .insert({
                    ...data,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error

            mutate('developers')
            return result as Developer
        } finally {
            setLoading(false)
        }
    }, [])

    const updateDeveloper = useCallback(async (id: string, data: Partial<Developer>) => {
        setLoading(true)
        try {
            const { data: result, error } = await supabase
                .from('developers')
                .update({
                    ...data,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single()

            if (error) throw error

            mutate('developers')
            mutate(['developer', id])
            return result as Developer
        } finally {
            setLoading(false)
        }
    }, [])

    const deleteDeveloper = useCallback(async (id: string) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('developers')
                .delete()
                .eq('id', id)

            if (error) throw error
            mutate('developers')
        } finally {
            setLoading(false)
        }
    }, [])

    return {
        createDeveloper,
        updateDeveloper,
        deleteDeveloper,
        loading
    }
}
