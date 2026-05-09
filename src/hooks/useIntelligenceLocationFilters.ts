'use client'

import useSWR from 'swr'
import { useMemo, useState } from 'react'
import type { IntelligenceMunicipality, IntelligenceNeighborhood, IntelligenceState } from '@/types/intelligence-location'

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erro ao carregar localizações')
  return res.json() as Promise<T>
}

export function useIntelligenceLocationFilters(selectedUf?: string, municipalityIbgeCode?: number, municipalityName?: string) {
  const [municipalityQuery, setMunicipalityQuery] = useState('')
  const states = useSWR<IntelligenceState[]>('/api/intelligence/locations', fetcher)
  const municipalities = useSWR<IntelligenceMunicipality[]>(selectedUf ? `/api/intelligence/locations?uf=${selectedUf}` : null, fetcher)
  const neighborhoods = useSWR<IntelligenceNeighborhood[]>(municipalityIbgeCode && municipalityName ? `/api/intelligence/locations?municipalityIbgeCode=${municipalityIbgeCode}&municipalityName=${encodeURIComponent(municipalityName)}` : null, fetcher)

  const filteredMunicipalities = useMemo(() => {
    const list = municipalities.data ?? []
    if (!municipalityQuery) return list
    const q = municipalityQuery.toLowerCase()
    return list.filter((m) => m.name.toLowerCase().includes(q))
  }, [municipalities.data, municipalityQuery])

  return {
    states: states.data ?? [],
    municipalities: filteredMunicipalities,
    neighborhoods: neighborhoods.data ?? [],
    municipalityQuery,
    setMunicipalityQuery,
    isLoading: states.isLoading || municipalities.isLoading || neighborhoods.isLoading,
  }
}
