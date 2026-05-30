// IMI Domain — canonical data types for commercial real estate data.
// IMPORTANT: These types must NEVER enter the CAD engine.
// Price, lead, client, broker, reservation data belongs exclusively here.

export interface DevelopmentSummary {
  id: string
  name: string
  slug: string
  developerId: string
  projectType: 'subdivision' | 'building' | 'mixed'
  city: string
  neighborhood: string
  status: 'planning' | 'pre_launch' | 'launch' | 'construction' | 'delivered'
  totalUnits?: number
  totalLots?: number
  priceRangeMin?: number
  priceRangeMax?: number
  currency: 'BRL' | 'USD' | 'EUR'
}

export interface UnitSummary {
  id: string
  developmentId: string
  code: string
  floor?: number
  type: 'studio' | '1br' | '2br' | '3br' | '4br+' | 'penthouse' | 'commercial' | 'lot'
  areaM2: number
  price?: number
  status: 'available' | 'reserved' | 'sold' | 'unavailable'
}
