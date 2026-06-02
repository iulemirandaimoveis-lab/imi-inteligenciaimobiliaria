'use client'

import useSWR from 'swr'
import { useEffect, useMemo, useState } from 'react'
import { createLocationIndex } from '@/services/location-index'
import { searchLocationSuggestions, type LocationSuggestion } from '@/services/location-search'
import type { IntelligenceLocationsResponse } from '@/types/intelligence-location'

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Falha ao carregar locais')
  }

  return response.json() as Promise<T>
}

export function useIntelligenceLocationSearch() {
  const [stateUf, setStateUf] = useState('')
  const [municipalityId, setMunicipalityId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query)
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [query])

  const statesRequest = useSWR<IntelligenceLocationsResponse>(
    '/api/intelligence/locations?country=BR',
    fetcher,
  )

  const municipalitiesRequest = useSWR<IntelligenceLocationsResponse>(
    stateUf ? `/api/intelligence/locations?country=BR&stateUf=${stateUf}` : null,
    fetcher,
  )

  const states = useMemo(() => statesRequest.data?.states ?? [], [statesRequest.data])
  const municipalities = useMemo(() => municipalitiesRequest.data?.municipalities ?? [], [municipalitiesRequest.data])

  // Compute selectedMunicipality before neighborhoodsRequest so we can use name in the URL key
  const selectedMunicipality = useMemo(
    () => municipalities.find((municipality) => municipality.id === municipalityId) ?? null,
    [municipalities, municipalityId],
  )

  const neighborhoodsRequest = useSWR<IntelligenceLocationsResponse>(
    (municipalityId && selectedMunicipality)
      ? `/api/intelligence/locations?country=BR&municipalityId=${municipalityId}&city=${encodeURIComponent(selectedMunicipality.name)}`
      : null,
    fetcher,
  )

  const neighborhoods = useMemo(() => neighborhoodsRequest.data?.neighborhoods ?? [], [neighborhoodsRequest.data])

  const locationIndex = useMemo(
    () => createLocationIndex({ states, municipalities, neighborhoods, selectedMunicipality }),
    [states, municipalities, neighborhoods, selectedMunicipality],
  )

  const suggestions = useMemo(() => searchLocationSuggestions(locationIndex, debouncedQuery), [locationIndex, debouncedQuery])

  const selectSuggestion = (suggestion: LocationSuggestion) => {
    if (suggestion.type === 'state' && suggestion.stateUf) {
      setStateUf(suggestion.stateUf)
      setMunicipalityId(null)
      return
    }

    if (suggestion.type === 'municipality' && suggestion.stateUf && suggestion.municipalityId) {
      setStateUf(suggestion.stateUf)
      setMunicipalityId(suggestion.municipalityId)
      return
    }

    if (suggestion.type === 'neighborhood' && suggestion.stateUf && suggestion.municipalityId) {
      setStateUf(suggestion.stateUf)
      setMunicipalityId(suggestion.municipalityId)
    }
  }

  return {
    query,
    setQuery,
    suggestions,
    selectSuggestion,
    stateUf,
    setStateUf,
    municipalityId,
    setMunicipalityId,
    states,
    municipalities,
    neighborhoods,
    selectedMunicipality,
    isLoading: statesRequest.isLoading || municipalitiesRequest.isLoading || neighborhoodsRequest.isLoading,
    error: statesRequest.error || municipalitiesRequest.error || neighborhoodsRequest.error,
  }
}
