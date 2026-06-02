import type { IntelligenceMunicipality, IntelligenceNeighborhood, IntelligenceState } from '@/types/intelligence-location'

export type LocationSuggestionType = 'state' | 'municipality' | 'neighborhood'

export type LocationSuggestion = {
  id: string
  name: string
  type: LocationSuggestionType
  context: string
  rank: number
  normalizedName: string
  stateUf?: string
  municipalityId?: number
  municipalityName?: string
}

const MAX_RESULTS = 10

export function normalizeLocationTerm(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

const getTypeWeight = (type: LocationSuggestionType): number => {
  if (type === 'neighborhood') return 0
  if (type === 'municipality') return 1
  return 2
}

export function getLocationMatchRank(itemName: string, rawTerm: string): number | null {
  const term = normalizeLocationTerm(rawTerm)
  if (!term) return null

  const name = normalizeLocationTerm(itemName)

  if (name === term) return 0
  if (name.startsWith(term)) return 1
  if (name.includes(term)) return 2

  return null
}

export function buildStateSuggestions(states: IntelligenceState[]): LocationSuggestion[] {
  return states.map((state) => ({
    id: `state-${state.id}`,
    name: state.name,
    type: 'state',
    context: 'Brasil',
    rank: 0,
    normalizedName: normalizeLocationTerm(state.name),
    stateUf: state.uf,
  }))
}

export function buildMunicipalitySuggestions(municipalities: IntelligenceMunicipality[]): LocationSuggestion[] {
  return municipalities.map((municipality) => ({
    id: `municipality-${municipality.id}`,
    name: municipality.name,
    type: 'municipality',
    context: `${municipality.stateName}/${municipality.stateUf}`,
    rank: 0,
    normalizedName: normalizeLocationTerm(municipality.name),
    stateUf: municipality.stateUf,
    municipalityId: municipality.id,
  }))
}

export function buildNeighborhoodSuggestions(
  neighborhoods: IntelligenceNeighborhood[],
  municipality: IntelligenceMunicipality | null,
): LocationSuggestion[] {
  if (!municipality) return []

  return neighborhoods.map((neighborhood) => ({
    id: `neighborhood-${neighborhood.id}`,
    name: neighborhood.name,
    type: 'neighborhood',
    context: `${municipality.name}/${municipality.stateUf}`,
    rank: 0,
    normalizedName: normalizeLocationTerm(neighborhood.name),
    stateUf: municipality.stateUf,
    municipalityId: municipality.id,
    municipalityName: municipality.name,
  }))
}

export function searchLocationSuggestions(items: LocationSuggestion[], term: string): LocationSuggestion[] {
  const normalizedTerm = normalizeLocationTerm(term)
  if (!normalizedTerm) return []

  return items
    .map((item) => {
      const rank = getLocationMatchRank(item.normalizedName, normalizedTerm)
      return rank === null ? null : { ...item, rank }
    })
    .filter((item): item is LocationSuggestion => item !== null)
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank

      const typeWeightDiff = getTypeWeight(a.type) - getTypeWeight(b.type)
      if (typeWeightDiff !== 0) return typeWeightDiff

      return a.name.localeCompare(b.name, 'pt-BR')
    })
    .slice(0, MAX_RESULTS)
}
