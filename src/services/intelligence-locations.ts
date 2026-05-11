import type {
  IntelligenceMunicipality,
  IntelligenceNeighborhood,
  IntelligenceState,
} from '@/types/intelligence-location'

const IBGE_BASE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades'

const sortByName = <T extends { name: string }>(items: T[]) =>
  items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

export async function getIntelligenceStates(): Promise<IntelligenceState[]> {
  const response = await fetch(`${IBGE_BASE_URL}/estados`, { next: { revalidate: 60 * 60 * 24 * 7 } })

  if (!response.ok) {
    throw new Error('Falha ao carregar estados do IBGE')
  }

  const states = await response.json() as Array<{
    id: number
    nome: string
    sigla: string
    regiao: { nome: string }
  }>

  return sortByName(states.map((state) => ({
    id: state.id,
    name: state.nome,
    uf: state.sigla,
    region: state.regiao.nome,
  })))
}

export async function getIntelligenceMunicipalities(stateUf: string): Promise<IntelligenceMunicipality[]> {
  const normalizedUf = stateUf.trim().toUpperCase()

  if (!/^[A-Z]{2}$/.test(normalizedUf)) {
    throw new Error('UF inválida')
  }

  const response = await fetch(`${IBGE_BASE_URL}/estados/${normalizedUf}/municipios`, { next: { revalidate: 60 * 60 * 24 * 30 } })

  if (!response.ok) {
    throw new Error(`Falha ao carregar municípios para ${normalizedUf}`)
  }

  const municipalities = await response.json() as Array<{
    id: number
    nome: string
    microrregiao: {
      mesorregiao: {
        UF: {
          nome: string
          sigla: string
        }
      }
    }
  }>

  return sortByName(municipalities.map((municipality) => ({
    id: municipality.id,
    name: municipality.nome,
    stateUf: municipality.microrregiao.mesorregiao.UF.sigla,
    stateName: municipality.microrregiao.mesorregiao.UF.nome,
  })))
}

export async function getIntelligenceNeighborhoods(_municipalityId: number): Promise<IntelligenceNeighborhood[]> {
  return []
}
