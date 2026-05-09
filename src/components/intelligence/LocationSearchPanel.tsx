'use client'

import { useState } from 'react'
import { useIntelligenceLocationSearch } from '@/hooks/useIntelligenceLocationSearch'

interface LocationSearchPanelProps {
  onMunicipalitySelect?: (municipalityName: string, stateUf: string) => void
  onNeighborhoodSelect?: (neighborhoodName: string) => void
}

const locationTypeLabel: Record<'state' | 'municipality' | 'neighborhood', string> = {
  state: 'Estado',
  municipality: 'Município',
  neighborhood: 'Bairro',
}

export function LocationSearchPanel({ onMunicipalitySelect, onNeighborhoodSelect }: LocationSearchPanelProps) {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('')
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const {
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
    isLoading,
  } = useIntelligenceLocationSearch()

  return (
    <section className="space-y-3" aria-label="Busca de localização nacional">
      <div className="space-y-2">
        <label htmlFor="location-search-input" className="text-sm font-medium">Buscar região</label>
        <input
          id="location-search-input"
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setIsSuggestionsOpen(true)
          }}
          onFocus={() => setIsSuggestionsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsSuggestionsOpen(false)
            }

            if (event.key === 'Enter' && suggestions.length > 0) {
              event.preventDefault()
              const firstSuggestion = suggestions[0]
              selectSuggestion(firstSuggestion)
              setIsSuggestionsOpen(false)
            }
          }}
          placeholder="Digite estado, município ou bairro"
          className="w-full rounded-md border px-3 py-2"
          aria-expanded={isSuggestionsOpen}
          aria-controls="location-search-suggestions"
        />

        {isSuggestionsOpen && query.trim() ? (
          <div id="location-search-suggestions" className="rounded-md border bg-white p-1" role="listbox">
            {suggestions.length > 0 ? suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                className="block w-full rounded px-3 py-2 text-left hover:bg-muted"
                onClick={() => {
                  selectSuggestion(suggestion)
                  setIsSuggestionsOpen(false)
                }}
              >
                <p className="font-medium">{suggestion.name}</p>
                <p className="text-sm text-muted-foreground">{locationTypeLabel[suggestion.type]} • {suggestion.context}</p>
              </button>
            )) : <p className="px-3 py-2 text-sm text-muted-foreground">Nenhuma região encontrada. Tente buscar por cidade, estado ou bairro.</p>}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <select
          aria-label="Estado"
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
          aria-label="Município"
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
          aria-label="Bairro"
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
