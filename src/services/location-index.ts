import type { IntelligenceMunicipality, IntelligenceNeighborhood, IntelligenceState } from '@/types/intelligence-location'
import {
  buildMunicipalitySuggestions,
  buildNeighborhoodSuggestions,
  buildStateSuggestions,
  type LocationSuggestion,
} from '@/services/location-search'

export type LocationIndexParams = {
  states: IntelligenceState[]
  municipalities: IntelligenceMunicipality[]
  neighborhoods: IntelligenceNeighborhood[]
  selectedMunicipality: IntelligenceMunicipality | null
}

export function createLocationIndex(params: LocationIndexParams): LocationSuggestion[] {
  const stateSuggestions = buildStateSuggestions(params.states)
  const municipalitySuggestions = buildMunicipalitySuggestions(params.municipalities)
  const neighborhoodSuggestions = buildNeighborhoodSuggestions(params.neighborhoods, params.selectedMunicipality)

  return [...stateSuggestions, ...municipalitySuggestions, ...neighborhoodSuggestions]
}
