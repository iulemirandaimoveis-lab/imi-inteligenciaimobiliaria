export interface Country {
  id: 'br'
  name: 'Brasil'
  slug: 'brasil'
  code: 'BR'
  region: 'América do Sul'
}

export interface State {
  id: number
  ibgeCode: number
  name: string
  uf: string
  slug: string
  region: string
}

export interface Municipality {
  id: number
  ibgeCode: number
  name: string
  slug: string
  uf: string
  state: string
  region: string
}

export interface Neighborhood {
  id: string
  name: string
  slug: string
  municipalityIbgeCode: number
}

export interface LocationSelection {
  countrySlug: string
  stateSlug?: string
  municipalitySlug?: string
  neighborhoodSlug?: string
}
