import { NextResponse } from 'next/server'
import { getBrazilStates } from '@/services/locations/ibge'

export async function GET() {
  try {
    const states = await getBrazilStates()
    return NextResponse.json(states)
  } catch {
    return NextResponse.json({ message: 'Erro ao carregar estados' }, { status: 500 })
  }
}
