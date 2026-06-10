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
  country?: string
  listing_type?: string
  images?: string[]
  image_urls?: string[]
  cover_image_url?: string
  slug?: string
  developer?: { id: string; name: string; logo_url?: string | null }
  broker_id?: string
  broker_name?: string
  broker?: { id: string; name: string; phone?: string; avatar_url?: string | null }
  created_at?: string
  updated_at?: string
  floor?: number
  age_years?: number
  finishing?: 'basic' | 'standard' | 'premium' | 'luxury'
  has_view?: boolean
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
  { value: 'loteamento', label: 'Loteamento' },
  { value: 'condominio_fechado', label: 'Condomínio Fechado' },
  { value: 'studio', label: 'Studio' },
  { value: 'flat', label: 'Flat' },
  { value: 'duplex', label: 'Duplex' },
]

export const LISTING_TYPES = [
  { value: 'venda', label: 'Venda' },
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'temporada', label: 'Temporada' },
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

// Neighborhood yield benchmarks (BR avg estimates)
export const NEIGHBORHOOD_YIELD: Record<string, number> = {
  // Recife
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
  // Garanhuns — land appreciation in growing secondary market
  'Aloísio Pinto': 9.2,   // Alto Bellevue: premium gated, high appreciation potential
  'Miguel Marques': 11.5, // Loteamento: affordable entry, strong yield via resale/appreciation
}

// Average price/m² by neighborhood (R$)
export const NEIGHBORHOOD_AVG_SQM: Record<string, number> = {
  // Recife
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
  // Garanhuns
  'Aloísio Pinto': 760,   // R$205k / 270m² ≈ R$759/m² (premium gated community)
  'Miguel Marques': 157,  // R$21.65k / 138m² ≈ R$157/m² (affordable loteamento)
}
