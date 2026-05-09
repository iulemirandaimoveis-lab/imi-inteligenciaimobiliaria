export interface IntelligenceCountry {
  code: 'BR'
  name: 'Brasil'
}

export interface IntelligenceState {
  ibgeCode: number
  uf: string
  name: string
  region: string
  slug: string
}

export interface IntelligenceMunicipality {
  ibgeCode: number
  name: string
  uf: string
  stateName: string
  stateIbgeCode: number
  region: string
  slug: string
}

export interface IntelligenceNeighborhood {
  id: string
  name: string
  slug: string
  municipalityIbgeCode: number
  source: 'fallback_nacional_imi' | 'market_api'
}
