import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const tower = searchParams.get('tower')
  const floor = searchParams.get('floor')
  const status = searchParams.get('status')
  const kind = searchParams.get('kind')

  let query = supabase
    .from('imi_properties')
    .select('*')
    .eq('development_id', params.id)
    .neq('status', 'hidden')
    .order('tower')
    .order('floor')
    .order('unit_number')

  if (tower) query = query.eq('tower', tower)
  if (floor) query = query.eq('floor', parseInt(floor))
  if (status) query = query.eq('status', status)
  if (kind) query = query.eq('kind', kind)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar unidades' }, { status: 500 })
  }

  return NextResponse.json({ data }, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
  })
}
