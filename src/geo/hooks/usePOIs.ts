'use client'

/**
 * `usePOIs` — client hook for geo-intelligence.
 *
 * Talks to `/api/geo/pois` (SWR), so provider keys never reach the browser.
 * Parameterized by coordinates + profile; returns the unified
 * `GeoIntelligence` plus loading/error state. Safe to mount on any map: pass
 * `null` coords to stay idle until a development is selected.
 */

import useSWR from 'swr'
import type { GeoIntelligence } from '../types'
import type { GEO_PROFILES } from '../config/categories'

export interface UsePOIsParams {
  lat: number | null | undefined
  lng: number | null | undefined
  profile?: keyof typeof GEO_PROFILES
  radius?: number
  enabled?: boolean
}

const fetcher = async (url: string): Promise<GeoIntelligence> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`geo/pois ${res.status}`)
  return res.json()
}

export function usePOIs({
  lat,
  lng,
  profile = 'residencial',
  radius,
  enabled = true,
}: UsePOIsParams) {
  const ready =
    enabled &&
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !(lat === 0 && lng === 0)

  const params = new URLSearchParams()
  if (ready) {
    params.set('lat', String(lat))
    params.set('lng', String(lng))
    params.set('profile', profile)
    if (radius) params.set('radius', String(radius))
  }

  const key = ready ? `/api/geo/pois?${params.toString()}` : null

  const { data, error, isLoading, mutate } = useSWR<GeoIntelligence>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      // POI data is stable; keep it for the session.
      dedupingInterval: 60_000,
    },
  )

  return {
    intelligence: data ?? null,
    pois: data?.pois ?? [],
    categories: data?.categories ?? [],
    score: data?.score ?? null,
    isLoading: ready && isLoading,
    error: error as Error | undefined,
    refresh: mutate,
  }
}
