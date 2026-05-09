'use client'

import { useState } from 'react'
import { useIntelligenceLocationSearch } from '@/hooks/useIntelligenceLocationSearch'

interface LocationSearchPanelProps {
  onMunicipalitySelect?: (municipalityName: string, stateUf: string) => void
  onNeighborhoodSelect?: (neighborhoodName: string) => void
}

export function LocationSearchPanel({ onMunicipalitySelect, onNeighborhoodSelect }: LocationSearchPanelProps) {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('')
  const {
    stateUf,
    setStateUf,
    municipalityId,
    setMunicipalityId,
    states,
    municipalities,
    neighborhoods,
    selectedMunicipality,
    isLoading,
  } = useIntelligenceLocationSearch()

  return (
    <section className="space-y-3" aria-label="Busca de localização nacional">
      <div className="grid gap-3 md:grid-cols-3">
        <select
          value={stateUf}
          onChange={(event) => {
            setStateUf(event.target.value)
            setMunicipalityId(null)
            setSelectedNeighborhood('')
            onNeighborhoodSelect?.('')
          }}
          className="rounded-md border px-3 py-2"
        >
          <option value="">Estado</option>
          {states.map((state) => (
            <option key={state.id} value={state.uf}>{state.name}</option>
          ))}
        </select>

        <select
          value={municipalityId ?? ''}
          onChange={(event) => {
            const nextId = event.target.value ? Number(event.target.value) : null
            setMunicipalityId(nextId)
            const municipality = municipalities.find((item) => item.id === nextId)
            if (municipality) {
              setSelectedNeighborhood('')
              onMunicipalitySelect?.(municipality.name, municipality.stateUf)
            }
          }}
          disabled={!stateUf}
          className="rounded-md border px-3 py-2"
        >
          <option value="">Município</option>
          {municipalities.map((municipality) => (
            <option key={municipality.id} value={municipality.id}>{municipality.name}</option>
          ))}
        </select>

        <select
          value={selectedNeighborhood}
          onChange={(event) => {
            setSelectedNeighborhood(event.target.value)
            onNeighborhoodSelect?.(event.target.value)
          }}
          disabled={!selectedMunicipality}
          className="rounded-md border px-3 py-2"
        >
          <option value="">Bairro</option>
          {neighborhoods.map((neighborhood) => (
            <option key={neighborhood.id} value={neighborhood.name}>{neighborhood.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando locais...</p> : null}
    </section>
  )
}
