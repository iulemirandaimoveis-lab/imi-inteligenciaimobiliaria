import { NextResponse } from 'next/server'
import { lookupCep } from '@/services/brazil-apis/cep'

export const revalidate = 86400 // 24h

export async function GET(_req: Request, { params }: { params: Promise<{ cep: string }> }) {
  const { cep } = await params
  try {
    const data = await lookupCep(cep)
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar CEP'
    const status = message.includes('8 dígitos') ? 400 : 404
    return NextResponse.json({ error: message }, { status })
  }
}
