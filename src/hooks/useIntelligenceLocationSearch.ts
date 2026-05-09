'use client'

import useSWR from 'swr'
import { useMemo, useState } from 'react'
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

  const statesRequest = useSWR<IntelligenceLocationsResponse>(
    '/api/intelligence/locations?country=BR',
    fetcher,
  )

  const municipalitiesRequest = useSWR<IntelligenceLocationsResponse>(
    stateUf ? `/api/intelligence/locations?country=BR&stateUf=${stateUf}` : null,
    fetcher,
  )

  const neighborhoodsRequest = useSWR<IntelligenceLocationsResponse>(
    municipalityId ? `/api/intelligence/locations?country=BR&municipalityId=${municipalityId}` : null,
    fetcher,
  )

  const states = useMemo(() => statesRequest.data?.states ?? [], [statesRequest.data])
  const municipalities = useMemo(() => municipalitiesRequest.data?.municipalities ?? [], [municipalitiesRequest.data])
  const neighborhoods = useMemo(() => neighborhoodsRequest.data?.neighborhoods ?? [], [neighborhoodsRequest.data])
  const selectedMunicipality = useMemo(
    () => municipalities.find((municipality) => municipality.id === municipalityId) ?? null,
    [municipalities, municipalityId],
  )

  return {
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
