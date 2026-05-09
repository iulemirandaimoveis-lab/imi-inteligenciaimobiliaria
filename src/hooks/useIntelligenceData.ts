'use client'

import useSWR from 'swr'

interface NeighborhoodData {
  id: string
  neighborhood: string
  city: string
  state: string
  median_price_sqm: number | null
  avg_price_sqm: number | null
  price_trend_12m: number | null
  price_trend_3m: number | null
  inventory_count: number | null
  avg_days_on_market: number | null
  absorption_rate: number | null
  walkability_score: number | null
  transit_score: number | null
  safety_score: number | null
  avg_rental_yield: number | null
  avg_monthly_rent_sqm: number | null
  vacancy_rate: number | null
  new_launches_12m: number | null
  valorization_5y: number | null
  data_source: string | null
  updated_at: string
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Falha ao carregar inteligência')
  return response.json() as Promise<{ neighborhoods: NeighborhoodData[] }>
}

export function useIntelligenceData(city: string) {
  const swr = useSWR(city ? `/api/intelligence/neighborhood?city=${encodeURIComponent(city)}` : null, fetcher)
  return {
    neighborhoods: swr.data?.neighborhoods ?? [],
    isLoading: swr.isLoading,
    refresh: swr.mutate,
  }
}
