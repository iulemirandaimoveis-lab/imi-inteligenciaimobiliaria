import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('developments')
    .select('*')
    .or(`id.eq.${params.id},slug.eq.${params.id}`)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Empreendimento não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ data }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  })
}
