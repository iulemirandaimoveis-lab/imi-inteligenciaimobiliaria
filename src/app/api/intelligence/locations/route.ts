import { NextRequest, NextResponse } from 'next/server'
import { getMunicipalitiesByUf, getMunicipalityNameByIbgeCode, getNeighborhoodsByMunicipality, getStates } from '@/services/intelligence-locations'

export async function GET(request: NextRequest) {
  const uf = request.nextUrl.searchParams.get('uf')
  const municipalityIbgeCode = request.nextUrl.searchParams.get('municipalityIbgeCode')

  try {
    if (municipalityIbgeCode) {
      const municipalityName = await getMunicipalityNameByIbgeCode(Number(municipalityIbgeCode))
      if (!municipalityName) return NextResponse.json([])
      return NextResponse.json(getNeighborhoodsByMunicipality(municipalityName, Number(municipalityIbgeCode)))
    }
    if (uf) return NextResponse.json(await getMunicipalitiesByUf(uf))
    return NextResponse.json(await getStates())
  } catch {
    return NextResponse.json({ message: 'Erro ao carregar localizações' }, { status: 500 })
  }
}
