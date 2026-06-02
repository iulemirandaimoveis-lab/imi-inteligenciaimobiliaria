import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('imi_properties')
    .select('*')
    .eq('id', params.id)
    .neq('status', 'hidden')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Unidade não encontrada' }, { status: 404 })
  }

  return NextResponse.json({ data }, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
  })
}
