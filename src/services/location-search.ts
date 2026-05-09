import type { LocationSearchItem } from './location-index'
import { normalize } from './location-index'

const score = (query: string, item: LocationSearchItem): number => {
  if (item.normalized === query) return 100
  if (item.normalized.startsWith(query)) return 70
  if (item.normalized.includes(query)) return 40
  return 0
}

export const searchLocations = (query: string, index: LocationSearchItem[]): LocationSearchItem[] => {
  const q = normalize(query)
  if (!q) return []
  return index
    .map((item) => ({ item, score: score(q, item) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name, 'pt-BR'))
    .slice(0, 10)
    .map((entry) => entry.item)
}
