import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('property_twins')
    .select('*, twin_rooms(*)')
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Twin não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ data }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const allowed = ['status', 'mesh_url', 'point_cloud_url', 'panorama_urls',
    'preview_image_url', 'measurements', 'floor_plan', 'published_at']
  const patch: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) patch[key] = body[key]
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('property_twins')
    .update(patch)
    .eq('id', params.id)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Erro ao atualizar twin' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { error } = await supabase
    .from('property_twins')
    .update({ status: 'archived' })
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: 'Erro ao arquivar twin' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
