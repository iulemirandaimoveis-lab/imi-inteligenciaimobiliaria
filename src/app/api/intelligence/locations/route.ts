import { NextRequest, NextResponse } from 'next/server'
import { getMunicipalitiesByUf, getNeighborhoodsByMunicipality, getStates } from '@/services/intelligence-locations'

export async function GET(request: NextRequest) {
  const uf = request.nextUrl.searchParams.get('uf')
  const municipalityIbgeCode = request.nextUrl.searchParams.get('municipalityIbgeCode')
  const municipalityName = request.nextUrl.searchParams.get('municipalityName')

  try {
    if (municipalityIbgeCode && municipalityName) {
      return NextResponse.json(getNeighborhoodsByMunicipality(municipalityName, Number(municipalityIbgeCode)))
    }
    if (uf) return NextResponse.json(await getMunicipalitiesByUf(uf))
    return NextResponse.json(await getStates())
  } catch {
    return NextResponse.json({ message: 'Erro ao carregar localizações' }, { status: 500 })
  }
}
