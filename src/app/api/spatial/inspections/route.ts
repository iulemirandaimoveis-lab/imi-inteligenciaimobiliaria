import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateInspectionSchema } from '@imi/spatial'

export const runtime = 'nodejs'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = CreateInspectionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { propertyId, twinId, kind, notes, participants } = parsed.data

  const { data, error } = await supabase
    .from('inspection_sessions')
    .insert({
      property_id: propertyId,
      twin_id: twinId ?? null,
      kind,
      status: 'open',
      inspector_user_id: user.id,
      participants,
      captures: [],
      notes: notes ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Erro ao criar sessão de vistoria' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const propertyId = searchParams.get('propertyId')
  const status = searchParams.get('status')

  let query = supabase
    .from('inspection_sessions')
    .select('*, inspection_issues(*)')
    .order('created_at', { ascending: false })

  if (propertyId) query = query.eq('property_id', propertyId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar vistorias' }, { status: 500 })
  }

  return NextResponse.json({ data })
}
