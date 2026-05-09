import { cache } from 'react'
import { BRAZIL_FALLBACK_CITIES } from '@/app/[lang]/(website)/inteligencia/brazilIntelligenceFallback'
import type { IntelligenceMunicipality, IntelligenceNeighborhood, IntelligenceState } from '@/types/intelligence-location'

const BASE = 'https://servicodados.ibge.gov.br/api/v1/localidades'

export const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

export const getStates = cache(async (): Promise<IntelligenceState[]> => {
  const response = await fetch(`${BASE}/estados`, { next: { revalidate: 60 * 60 * 24 * 7 } })
  if (!response.ok) throw new Error('Erro ao carregar estados')
  const data = await response.json() as Array<{ id: number, nome: string, sigla: string, regiao: { nome: string } }>
  return data.map((state) => ({ ibgeCode: state.id, uf: state.sigla, name: state.nome, region: state.regiao.nome, slug: slugify(state.sigla) })).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
})

export const getMunicipalitiesByUf = cache(async (uf: string): Promise<IntelligenceMunicipality[]> => {
  const response = await fetch(`${BASE}/estados/${uf.toUpperCase()}/municipios`, { next: { revalidate: 60 * 60 * 24 * 30 } })
  if (!response.ok) throw new Error('Erro ao carregar municípios')
  const data = await response.json() as Array<{ id: number, nome: string, microrregiao: { mesorregiao: { UF: { id: number, sigla: string, nome: string, regiao: { nome: string } } } } }>
  return data.map((city) => ({
    ibgeCode: city.id,
    name: city.nome,
    uf: city.microrregiao.mesorregiao.UF.sigla,
    stateName: city.microrregiao.mesorregiao.UF.nome,
    stateIbgeCode: city.microrregiao.mesorregiao.UF.id,
    region: city.microrregiao.mesorregiao.UF.regiao.nome,
    slug: slugify(city.nome),
  })).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
})

export const getMunicipalityNameByIbgeCode = cache(async (ibgeCode: number): Promise<string | null> => {
  const response = await fetch(`${BASE}/municipios/${ibgeCode}`, { next: { revalidate: 60 * 60 * 24 * 30 } })
  if (!response.ok) return null
  const data = await response.json() as { nome?: string }
  return data.nome ?? null
})

export const getNeighborhoodsByMunicipality = (municipalityName: string, municipalityIbgeCode: number): IntelligenceNeighborhood[] => {
  const city = BRAZIL_FALLBACK_CITIES.find((item) => slugify(item.city) === slugify(municipalityName))
  if (!city) return []
  return city.neighborhoods.map((n, idx) => ({ id: `${municipalityIbgeCode}-${idx}`, name: n.neighborhood, slug: slugify(n.neighborhood), municipalityIbgeCode, source: 'fallback_nacional_imi' }))
}
