import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AddIssueSchema } from '@imi/spatial'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: session } = await supabase
    .from('inspection_sessions')
    .select('id, status')
    .eq('id', params.id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Vistoria não encontrada' }, { status: 404 })
  }

  if (session.status === 'signed' || session.status === 'cancelled') {
    return NextResponse.json(
      { error: 'Vistoria encerrada — não é possível adicionar ocorrências' },
      { status: 409 }
    )
  }

  const body = await req.json()
  const parsed = AddIssueSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { kind, severity, description, roomId, photoUrls, position, notes } = parsed.data

  const { data, error } = await supabase
    .from('inspection_issues')
    .insert({
      session_id: params.id,
      kind,
      severity,
      description,
      room_id: roomId ?? null,
      photo_urls: photoUrls,
      position: position ?? null,
      notes: notes ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Erro ao registrar ocorrência' }, { status: 500 })
  }

  if (session.status === 'open') {
    await supabase
      .from('inspection_sessions')
      .update({ status: 'in_progress' })
      .eq('id', params.id)
  }

  return NextResponse.json({ data }, { status: 201 })
}
