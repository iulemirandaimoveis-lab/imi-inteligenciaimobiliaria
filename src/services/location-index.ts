import type { IntelligenceMunicipality, IntelligenceNeighborhood, IntelligenceState } from '@/types/intelligence-location'

export type SearchItemType = 'estado' | 'municipio' | 'bairro'

export interface LocationSearchItem {
  id: string
  type: SearchItemType
  name: string
  slug: string
  uf?: string
  municipalityName?: string
  municipalityIbgeCode?: number
  normalized: string
}

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export const buildLocationIndex = (states: IntelligenceState[], municipalities: IntelligenceMunicipality[], neighborhoods: IntelligenceNeighborhood[], selectedMunicipalityName?: string): LocationSearchItem[] => {
  const stateItems = states.map((state) => ({ id: `state-${state.ibgeCode}`, type: 'estado' as const, name: state.name, slug: state.slug, uf: state.uf, normalized: `${normalize(state.name)} ${normalize(state.uf)}` }))
  const municipalityItems = municipalities.map((m) => ({ id: `municipality-${m.ibgeCode}`, type: 'municipio' as const, name: m.name, slug: m.slug, uf: m.uf, municipalityIbgeCode: m.ibgeCode, normalized: `${normalize(m.name)} ${normalize(m.uf)}` }))
  const neighborhoodItems = neighborhoods.map((n) => ({ id: `neighborhood-${n.id}`, type: 'bairro' as const, name: n.name, slug: n.slug, uf: municipalities.find((m) => m.ibgeCode === n.municipalityIbgeCode)?.uf, municipalityName: selectedMunicipalityName, municipalityIbgeCode: n.municipalityIbgeCode, normalized: `${normalize(n.name)} ${normalize(selectedMunicipalityName ?? '')}` }))
  return [...stateItems, ...municipalityItems, ...neighborhoodItems]
}

export { normalize }
