import { NextRequest, NextResponse } from 'next/server'
import {
  getIntelligenceMunicipalities,
  getIntelligenceNeighborhoods,
  getIntelligenceStates,
} from '@/services/intelligence-locations'
import type { IntelligenceLocationsResponse } from '@/types/intelligence-location'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const country = searchParams.get('country')
  const stateUf = searchParams.get('stateUf')
  const municipalityId = searchParams.get('municipalityId')

  if (country !== 'BR') {
    return NextResponse.json({ error: 'Somente país BR é suportado' }, { status: 400 })
  }

  try {
    if (municipalityId) {
      const parsedMunicipalityId = Number(municipalityId)

      if (!Number.isInteger(parsedMunicipalityId) || parsedMunicipalityId <= 0) {
        return NextResponse.json({ error: 'municipalityId inválido' }, { status: 400 })
      }

      const response: IntelligenceLocationsResponse = {
        country: 'BR',
        states: [],
        municipalities: [],
        neighborhoods: await getIntelligenceNeighborhoods(parsedMunicipalityId),
      }

      return NextResponse.json(response)
    }

    if (stateUf) {
      const response: IntelligenceLocationsResponse = {
        country: 'BR',
        states: [],
        municipalities: await getIntelligenceMunicipalities(stateUf),
        neighborhoods: [],
      }

      return NextResponse.json(response)
    }

    const response: IntelligenceLocationsResponse = {
      country: 'BR',
      states: await getIntelligenceStates(),
      municipalities: [],
      neighborhoods: [],
    }

    return NextResponse.json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar localizações'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
