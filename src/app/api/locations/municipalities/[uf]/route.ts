import { NextResponse } from 'next/server'
import { getMunicipalitiesByUf } from '@/services/locations/ibge'

export async function GET(_request: Request, { params }: { params: { uf: string } }) {
  try {
    const municipalities = await getMunicipalitiesByUf(params.uf)
    return NextResponse.json(municipalities)
  } catch {
    return NextResponse.json({ message: 'Erro ao carregar municípios' }, { status: 500 })
  }
}
