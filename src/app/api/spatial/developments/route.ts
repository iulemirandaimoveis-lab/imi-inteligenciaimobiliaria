import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('developments')
    .select('id, name, slug, type, city, state, description, images, status_commercial')
    .eq('status_commercial', 'published')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar empreendimentos' }, { status: 500 })
  }

  return NextResponse.json({ data }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  })
}
