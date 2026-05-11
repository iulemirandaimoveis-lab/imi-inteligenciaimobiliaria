export type IntelligenceState = {
  id: number
  name: string
  uf: string
  region: string
}

export type IntelligenceMunicipality = {
  id: number
  name: string
  stateUf: string
  stateName: string
}

export type IntelligenceNeighborhood = {
  id: string
  name: string
}

export type IntelligenceLocationsResponse = {
  country: 'BR'
  states: IntelligenceState[]
  municipalities: IntelligenceMunicipality[]
  neighborhoods: IntelligenceNeighborhood[]
}
