'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface PropertyKPIs {
    total: number
    active: number
    totalValue: number
    avgPrice: number
    totalUnits: number
    totalViews: number
    totalLeads: number
    conversionRate: number
}

export function usePropertyKPIs() {
    const fetcher = async (): Promise<PropertyKPIs> => {
        const { data: properties, error } = await supabase
            .from('developments')
            .select('*')

        if (error) throw error

        const total = properties?.length || 0
        const active = properties?.filter(p => p.status === 'active').length || 0
        const totalValue = properties?.reduce((sum, p) => sum + (p.price_from * (p.units || 1)), 0) || 0
        const avgPrice = total > 0 ? properties.reduce((sum, p) => sum + p.price_from, 0) / total : 0
        const totalUnits = properties?.reduce((sum, p) => sum + (p.units || 0), 0) || 0
        const totalViews = properties?.reduce((sum, p) => sum + (p.views || 0), 0) || 0
        const totalLeads = properties?.reduce((sum, p) => sum + (p.leads_count || 0), 0) || 0
        const conversionRate = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0

        return {
            total,
            active,
            totalValue,
            avgPrice,
            totalUnits,
            totalViews,
            totalLeads,
            conversionRate,
        }
    }

    const { data, error, isLoading } = useSWR('property-kpis', fetcher, {
        revalidateOnFocus: false,
    })

    return {
        kpis: data,
        isLoading,
        error,
    }
}
