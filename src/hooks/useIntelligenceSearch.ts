'use client'

import { useEffect, useMemo, useState } from 'react'
import { buildLocationIndex } from '@/services/location-index'
import { searchLocations } from '@/services/location-search'
import type { IntelligenceMunicipality, IntelligenceNeighborhood, IntelligenceState } from '@/types/intelligence-location'

export function useIntelligenceSearch(states: IntelligenceState[], municipalities: IntelligenceMunicipality[], neighborhoods: IntelligenceNeighborhood[], selectedMunicipalityName?: string) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 200)
    return () => window.clearTimeout(timer)
  }, [query])

  const index = useMemo(() => buildLocationIndex(states, municipalities, neighborhoods, selectedMunicipalityName), [states, municipalities, neighborhoods, selectedMunicipalityName])
  const results = useMemo(() => searchLocations(debouncedQuery, index), [debouncedQuery, index])

  return { query, setQuery, results }
}
