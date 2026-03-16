export interface IMIProperty {
  id: string
  name: string
  type: string
  condition?: string
  status: string
  price?: number
  area?: number
  bedrooms?: number
  bathrooms?: number
  parking?: number
  neighborhood?: string
  city?: string
  state?: string
  address?: string
  images?: string[]
  image_urls?: string[]
  cover_image_url?: string
  slug?: string
  developer?: { id: string; name: string; logo_url?: string | null }
  created_at?: string
  updated_at?: string
  // Intelligence layer (computed)
  imi_score?: number
  price_per_sqm?: number
  yield_est?: number
  roi_12m?: number
  liquidity_index?: number
  market_delta_pct?: number
}

export interface PropertyFilters {
  search: string
  status: string[]
  type: string[]
  city: string
  neighborhood: string
  minPrice: number | null
  maxPrice: number | null
  minArea: number | null
  maxArea: number | null
  minBedrooms: number | null
  minScore: number | null
  minYield: number | null
  belowMarket: boolean
}

export const PROPERTY_TYPES = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'cobertura', label: 'Cobertura' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'studio', label: 'Studio' },
  { value: 'flat', label: 'Flat' },
  { value: 'duplex', label: 'Duplex' },
]

export const PROPERTY_STATUSES = [
  { value: 'disponivel', label: 'Disponível' },
  { value: 'lancamento', label: 'Lançamento' },
  { value: 'em_construcao', label: 'Em Construção' },
  { value: 'reservado', label: 'Reservado' },
  { value: 'em_negociacao', label: 'Negociação' },
  { value: 'vendido', label: 'Vendido' },
]

export const DEFAULT_FILTERS: PropertyFilters = {
  search: '',
  status: [],
  type: [],
  city: '',
  neighborhood: '',
  minPrice: null,
  maxPrice: null,
  minArea: null,
  maxArea: null,
  minBedrooms: null,
  minScore: null,
  minYield: null,
  belowMarket: false,
}

// Neighborhood yield benchmarks for Recife (BR avg estimates)
export const NEIGHBORHOOD_YIELD: Record<string, number> = {
  'Boa Viagem': 5.8,
  'Pina': 6.2,
  'Miramar': 5.5,
  'Casa Forte': 5.1,
  'Graças': 5.4,
  'Aflitos': 5.6,
  'Recife Antigo': 7.1,
  'Espinheiro': 5.3,
  'Parnamirim': 5.9,
  'Tamarineira': 6.0,
  'Boa Vista': 6.4,
  'Derby': 5.7,
}

// Average price/m² by neighborhood (R$)
export const NEIGHBORHOOD_AVG_SQM: Record<string, number> = {
  'Boa Viagem': 11200,
  'Pina': 9800,
  'Miramar': 13500,
  'Casa Forte': 10200,
  'Graças': 9600,
  'Aflitos': 8900,
  'Recife Antigo': 8200,
  'Espinheiro': 9100,
  'Parnamirim': 10800,
  'Tamarineira': 8600,
  'Boa Vista': 7800,
  'Derby': 8400,
}
