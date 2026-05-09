import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api-helpers'

type IbgeState = { id: number; sigla: string; nome: string }
type IbgeMunicipality = { id: number; nome: string }

const IBGE_BASE = 'https://servicodados.ibge.gov.br/api/v1/localidades'

export const GET = apiHandler(null, async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const uf = (searchParams.get('uf') || '').trim().toUpperCase()

  if (!uf) {
    const res = await fetch(`${IBGE_BASE}/estados?orderBy=nome`, { next: { revalidate: 86400 } })
    if (!res.ok) return NextResponse.json({ error: 'Falha ao carregar estados do IBGE' }, { status: 502 })
    const states = (await res.json() as IbgeState[]).map((s) => ({ id: s.id, code: s.sigla, name: s.nome }))
    return NextResponse.json({ country: 'BR', states }, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400' } })
  }

  const res = await fetch(`${IBGE_BASE}/estados/${uf}/municipios?orderBy=nome`, { next: { revalidate: 86400 } })
  if (!res.ok) return NextResponse.json({ error: `Falha ao carregar municípios do IBGE para ${uf}` }, { status: 502 })
  const municipalities = (await res.json() as IbgeMunicipality[]).map((m) => ({ id: m.id, name: m.nome, stateCode: uf }))
  return NextResponse.json({ country: 'BR', stateCode: uf, municipalities }, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400' } })
}, { auth: false, rateLimit: 'public' })

