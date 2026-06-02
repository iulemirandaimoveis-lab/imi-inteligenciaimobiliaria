'use client'

import useSWR from 'swr'
import { useMemo, useState } from 'react'
import type { Municipality, State } from '@/types/location'
import { getNeighborhoodOptions } from '@/services/intelligence/neighborhoods'

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Falha ao carregar dados geográficos')
  return response.json() as Promise<T>
}

export function useLocationFilters(selectedStateUf?: string, selectedMunicipalitySlug?: string) {
  const [query, setQuery] = useState('')
  const states = useSWR<State[]>('/api/locations/states', fetcher)
  const municipalities = useSWR<Municipality[]>(selectedStateUf ? `/api/locations/municipalities/${selectedStateUf}` : null, fetcher)

  const filteredStates = useMemo(() => {
    if (!query) return states.data ?? []
    const q = query.toLowerCase()
    return (states.data ?? []).filter((state) => state.name.toLowerCase().includes(q) || state.uf.toLowerCase().includes(q))
  }, [query, states.data])

  const filteredMunicipalities = useMemo(() => {
    if (!query) return municipalities.data ?? []
    const q = query.toLowerCase()
    return (municipalities.data ?? []).filter((municipality) => municipality.name.toLowerCase().includes(q))
  }, [municipalities.data, query])

  const neighborhoods = useMemo(
    () => getNeighborhoodOptions(selectedMunicipalitySlug),
    [selectedMunicipalitySlug],
  )

  return {
    query,
    setQuery,
    states: filteredStates,
    municipalities: filteredMunicipalities,
    neighborhoods,
    isLoading: states.isLoading || municipalities.isLoading,
  }
}
