import { cache } from 'react'
import type { Municipality, State } from '@/types/location'

const IBGE_BASE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades'

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

export const getBrazilStates = cache(async (): Promise<State[]> => {
  const response = await fetch(`${IBGE_BASE_URL}/estados`, { next: { revalidate: 60 * 60 * 24 * 7 } })
  if (!response.ok) throw new Error('Falha ao carregar estados no IBGE')

  const json = await response.json() as Array<{ id: number, nome: string, sigla: string, regiao: { nome: string } }>

  return json
    .map((state) => ({
      id: state.id,
      ibgeCode: state.id,
      name: state.nome,
      uf: state.sigla,
      slug: slugify(state.sigla),
      region: state.regiao.nome,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
})

export const getMunicipalitiesByUf = cache(async (uf: string): Promise<Municipality[]> => {
  const normalizedUf = uf.trim().toUpperCase()
  const response = await fetch(`${IBGE_BASE_URL}/estados/${normalizedUf}/municipios`, { next: { revalidate: 60 * 60 * 24 * 30 } })
  if (!response.ok) throw new Error(`Falha ao carregar municípios para ${normalizedUf}`)

  const json = await response.json() as Array<{
    id: number
    nome: string
    microrregiao: { mesorregiao: { UF: { sigla: string, nome: string, regiao: { nome: string } } } }
  }>

  return json
    .map((city) => {
      const ufData = city.microrregiao.mesorregiao.UF
      return {
        id: city.id,
        ibgeCode: city.id,
        name: city.nome,
        slug: slugify(city.nome),
        uf: ufData.sigla,
        state: ufData.nome,
        region: ufData.regiao.nome,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
})

export { slugify }
