import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('inspection_sessions')
    .select('*, inspection_issues(*)')
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Vistoria não encontrada' }, { status: 404 })
  }

  return NextResponse.json({ data })
}
