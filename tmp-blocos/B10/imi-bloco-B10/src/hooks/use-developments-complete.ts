'use client'
// hooks/use-developments-complete.ts
// Hooks completos para gestão de empreendimentos

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import useSWR, { mutate } from 'swr'

const supabase = createClient()

export interface Development {
    id: string
    slug: string
    name: string
    developer_id: string | null
    status: 'draft' | 'published' | 'launch' | 'ready' | 'under_construction'
    region: string
    neighborhood: string
    city: string
    state: string
    address: string
    lat: number | null
    lng: number | null
    delivery_date: string
    registration_number: string
    description: string
    short_description: string
    features: string[]
    specs: any
    price_from: number | null
    price_to: number | null
    property_type: string
    bedrooms: number | null
    bathrooms: number | null
    parking_spaces: number | null
    area_from: string
    area_to: string
    images: {
        main: string
        gallery: string[]
        videos: string[]
        floorPlans: string[]
    }
    video_url: string
    virtual_tour_url: string
    tags: string[]
    featured: boolean
    is_highlighted: boolean
    views_count: number
    leads_count: number
    meta_title: string
    meta_description: string
    created_at: string
    updated_at: string
    developer?: {
        name: string
        logo_url: string
    }
}

export interface DevelopmentFilters {
    search?: string
    status?: string
    region?: string
    property_type?: string
    featured?: boolean
    price_min?: number
    price_max?: number
    bedrooms?: number
    sort_by?: 'created_at' | 'name' | 'price_from' | 'views_count'
    sort_order?: 'asc' | 'desc'
}

/**
 * Hook para listar developments com filtros avançados
 */
export function useDevelopments(filters: DevelopmentFilters = {}) {
    const { data, error, mutate: revalidate } = useSWR(
        ['developments', JSON.stringify(filters)],
        async () => {
            let query = supabase
                .from('developments')
                .select('*, developer:developers(name, logo_url)', { count: 'exact' })

            // Aplicar filtros
            if (filters.search) {
                query = query.or(`name.ilike.%${filters.search}%,city.ilike.%${filters.search}%,neighborhood.ilike.%${filters.search}%`)
            }

            if (filters.status && filters.status !== 'all') {
                query = query.eq('status', filters.status)
            }

            if (filters.region && filters.region !== 'all') {
                query = query.eq('region', filters.region)
            }

            if (filters.property_type && filters.property_type !== 'all') {
                query = query.eq('property_type', filters.property_type)
            }

            if (filters.featured !== undefined) {
                query = query.eq('featured', filters.featured)
            }

            if (filters.price_min) {
                query = query.gte('price_from', filters.price_min)
            }

            if (filters.price_max) {
                query = query.lte('price_to', filters.price_max)
            }

            if (filters.bedrooms) {
                query = query.eq('bedrooms', filters.bedrooms)
            }

            // Ordenação
            const sortBy = filters.sort_by || 'created_at'
            const sortOrder = filters.sort_order || 'desc'
            query = query.order(sortBy, { ascending: sortOrder === 'asc' })

            const { data, error, count } = await query

            if (error) throw error

            return { data: data as Development[], count }
        }
    )

    return {
        developments: data?.data || [],
        total: data?.count || 0,
        isLoading: !error && !data,
        isError: error,
        revalidate
    }
}

/**
 * Hook para buscar um development específico
 */
export function useDevelopment(id: string | null) {
    const { data, error, mutate: revalidate } = useSWR(
        id ? ['development', id] : null,
        async () => {
            const { data, error } = await supabase
                .from('developments')
                .select('*, developer:developers(*), units:development_units(count)')
                .eq('id', id)
                .single()

            if (error) throw error
            return data as Development
        }
    )

    return {
        development: data,
        isLoading: !error && !data,
        isError: error,
        revalidate
    }
}

/**
 * Hook para operações CRUD de developments
 */
export function useDevelopmentActions() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const createDevelopment = useCallback(async (data: Partial<Development>) => {
        setLoading(true)
        setError(null)

        try {
            const { data: result, error } = await supabase
                .from('developments')
                .insert({
                    ...data,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error

            // Revalidar cache
            mutate((key: any) => Array.isArray(key) && key[0] === 'developments')

            return result as Development
        } catch (err) {
            const error = err as Error
            setError(error)
            throw error
        } finally {
            setLoading(false)
        }
    }, [])

    const updateDevelopment = useCallback(async (id: string, data: Partial<Development>) => {
        setLoading(true)
        setError(null)

        try {
            const { data: result, error } = await supabase
                .from('developments')
                .update({
                    ...data,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single()

            if (error) throw error

            // Revalidar cache
            mutate(['development', id])
            mutate((key: any) => Array.isArray(key) && key[0] === 'developments')

            return result as Development
        } catch (err) {
            const error = err as Error
            setError(error)
            throw error
        } finally {
            setLoading(false)
        }
    }, [])

    const deleteDevelopment = useCallback(async (id: string) => {
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase
                .from('developments')
                .delete()
                .eq('id', id)

            if (error) throw error

            // Revalidar cache
            mutate((key: any) => Array.isArray(key) && key[0] === 'developments')
        } catch (err) {
            const error = err as Error
            setError(error)
            throw error
        } finally {
            setLoading(false)
        }
    }, [])

    const duplicateDevelopment = useCallback(async (id: string) => {
        setLoading(true)
        setError(null)

        try {
            // Buscar development original
            const { data: original, error: fetchError } = await supabase
                .from('developments')
                .select('*')
                .eq('id', id)
                .single()

            if (fetchError) throw fetchError

            // Remover ID e timestamps para inserção
            const { id: _, created_at, updated_at, ...developmentData } = original

            // Criar cópia
            const { data: result, error } = await supabase
                .from('developments')
                .insert({
                    ...developmentData,
                    name: `${original.name} (Cópia)`,
                    slug: `${original.slug}-copia-${Date.now()}`,
                    status: 'draft',
                    featured: false,
                    is_highlighted: false,
                    views_count: 0,
                    leads_count: 0,
                    created_at: new Date().toISOString(), // Supabase geraria, mas reforçando
                    updated_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error

            // Revalidar cache
            mutate((key: any) => Array.isArray(key) && key[0] === 'developments')

            return result as Development
        } catch (err) {
            const error = err as Error
            setError(error)
            throw error
        } finally {
            setLoading(false)
        }
    }, [])

    // Definições explícitas para evitar dependência cíclica com updateDevelopment
    const publishDevelopment = useCallback(async (id: string) => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('developments')
                .update({ status: 'published', updated_at: new Date().toISOString() })
                .eq('id', id)
                .select().single()
            if (error) throw error
            mutate(['development', id])
            mutate((key: any) => Array.isArray(key) && key[0] === 'developments')
            return data
        } catch (e) { throw e } finally { setLoading(false) }
    }, [])

    const unpublishDevelopment = useCallback(async (id: string) => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('developments')
                .update({ status: 'draft', updated_at: new Date().toISOString() })
                .eq('id', id)
                .select().single()
            if (error) throw error
            mutate(['development', id])
            mutate((key: any) => Array.isArray(key) && key[0] === 'developments')
            return data
        } catch (e) { throw e } finally { setLoading(false) }
    }, [])

    const toggleFeatured = useCallback(async (id: string, featured: boolean) => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('developments')
                .update({ featured, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select().single()
            if (error) throw error
            mutate(['development', id])
            mutate((key: any) => Array.isArray(key) && key[0] === 'developments')
            return data
        } catch (e) { throw e } finally { setLoading(false) }
    }, [])

    const toggleHighlighted = useCallback(async (id: string, is_highlighted: boolean) => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('developments')
                .update({ is_highlighted, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select().single()
            if (error) throw error
            mutate(['development', id])
            mutate((key: any) => Array.isArray(key) && key[0] === 'developments')
            return data
        } catch (e) { throw e } finally { setLoading(false) }
    }, [])

    return {
        createDevelopment,
        updateDevelopment,
        deleteDevelopment,
        duplicateDevelopment,
        publishDevelopment,
        unpublishDevelopment,
        toggleFeatured,
        toggleHighlighted,
        loading,
        error
    }
}

/**
 * Hook para estatísticas de developments
 */
export function useDevelopmentStats() {
    const { data, error } = useSWR('development-stats', async () => {
        const { data, error } = await supabase
            .from('developments')
            .select('status, featured, is_highlighted, leads_count, views_count')

        if (error) throw error

        const stats = {
            total: data.length,
            published: data.filter(d => d.status === 'published').length,
            draft: data.filter(d => d.status === 'draft').length,
            featured: data.filter(d => d.featured).length,
            highlighted: data.filter(d => d.is_highlighted).length,
            totalLeads: data.reduce((sum, d) => sum + (d.leads_count || 0), 0),
            totalViews: data.reduce((sum, d) => sum + (d.views_count || 0), 0),
            avgLeadsPerDev: data.length > 0
                ? data.reduce((sum, d) => sum + (d.leads_count || 0), 0) / data.length
                : 0,
            avgViewsPerDev: data.length > 0
                ? data.reduce((sum, d) => sum + (d.views_count || 0), 0) / data.length
                : 0
        }

        return stats
    })

    return {
        stats: data,
        isLoading: !error && !data,
        isError: error
    }
}

/**
 * Hook para bulk operations
 */
export function useBulkDevelopmentActions() {
    const [loading, setLoading] = useState(false)

    const bulkUpdateStatus = useCallback(async (ids: string[], status: string) => {
        if (!ids.length) return
        setLoading(true)
        try {
            const { error } = await supabase
                .from('developments')
                .update({ status, updated_at: new Date().toISOString() })
                .in('id', ids)

            if (error) throw error

            mutate((key: any) => Array.isArray(key) && key[0] === 'developments')
        } finally {
            setLoading(false)
        }
    }, [])

    const bulkDelete = useCallback(async (ids: string[]) => {
        if (!ids.length) return
        setLoading(true)
        try {
            const { error } = await supabase
                .from('developments')
                .delete()
                .in('id', ids)

            if (error) throw error

            mutate((key: any) => Array.isArray(key) && key[0] === 'developments')
        } finally {
            setLoading(false)
        }
    }, [])

    const bulkToggleFeatured = useCallback(async (ids: string[], featured: boolean) => {
        if (!ids.length) return
        setLoading(true)
        try {
            const { error } = await supabase
                .from('developments')
                .update({ featured, updated_at: new Date().toISOString() })
                .in('id', ids)

            if (error) throw error

            mutate((key: any) => Array.isArray(key) && key[0] === 'developments')
        } finally {
            setLoading(false)
        }
    }, [])

    return {
        bulkUpdateStatus,
        bulkDelete,
        bulkToggleFeatured,
        loading
    }
}

/**
 * Hook para buscar developments similares
 * (Útil para sugestão no backoffice ou "veja também" simulado)
 */
export function useSimilarDevelopments(developmentId: string, limit: number = 4) {
    const { data, error } = useSWR(
        ['similar-developments', developmentId],
        async () => {
            // Buscar development atual
            const { data: current } = await supabase
                .from('developments')
                .select('region, city, property_type')
                .eq('id', developmentId)
                .single()

            if (!current) return []

            // Buscar similares (mesma região/cidade ou mesmo tipo)
            // Exibindo apenas publicados e não ele mesmo
            const { data, error } = await supabase
                .from('developments')
                .select('*')
                .eq('status', 'published')
                .neq('id', developmentId)
                .or(`region.eq.${current.region},city.eq.${current.city},property_type.eq.${current.property_type}`)
                .limit(limit)

            if (error) throw error
            return data as Development[]
        }
    )

    return {
        similarDevelopments: data || [],
        isLoading: !error && !data,
        isError: error
    }
}

/**
 * Hook para auto-save (rascunho automático)
 * Dispara update após delay se developmentId existir
 */
export function useAutoSaveDevelopment(
    developmentId: string | null,
    data: Partial<Development>,
    delay: number = 3000
) {
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        // Se não tiver ID ou se o data estiver vazio (além de id/created_at), não salvar
        if (!developmentId || Object.keys(data).length === 0) return

        const timer = setTimeout(async () => {
            setSaving(true)
            try {
                const { error } = await supabase
                    .from('developments')
                    .update({
                        ...data,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', developmentId)

                if (error) throw error

                setLastSaved(new Date())
            } catch (error) {
                console.error('Auto-save error:', error)
            } finally {
                setSaving(false)
            }
        }, delay)

        return () => clearTimeout(timer)
    }, [developmentId, data, delay]) // data deve ser memoizado ou estável se passado como objeto

    return {
        lastSaved,
        saving
    }
}
