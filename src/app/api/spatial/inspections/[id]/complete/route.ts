import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: session } = await supabase
    .from('inspection_sessions')
    .select('id, status, inspector_user_id')
    .eq('id', params.id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Vistoria não encontrada' }, { status: 404 })
  }

  if (session.status === 'completed' || session.status === 'signed' || session.status === 'cancelled') {
    return NextResponse.json({ error: 'Vistoria já encerrada' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('inspection_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Erro ao concluir vistoria' }, { status: 500 })
  }

  return NextResponse.json({ data })
}
