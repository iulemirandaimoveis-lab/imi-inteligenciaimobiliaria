import type { Neighborhood } from '@/types/location'
import { BRAZIL_FALLBACK_CITIES } from '@/app/[lang]/(website)/inteligencia/brazilIntelligenceFallback'
import { slugify } from '@/services/locations/ibge'

const getNeighborhoodsByCitySlug = (citySlug: string): Neighborhood[] => {
  const city = BRAZIL_FALLBACK_CITIES.find((item) => slugify(item.city) === citySlug)
  if (!city) return []

  return city.neighborhoods.map((item, index) => ({
    id: `${slugify(city.city)}-${index}`,
    name: item.neighborhood,
    slug: slugify(item.neighborhood),
    municipalityIbgeCode: 0,
  }))
}

export function getNeighborhoodOptions(citySlug?: string): Neighborhood[] {
  if (!citySlug) return []
  return getNeighborhoodsByCitySlug(citySlug)
}
