import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('valuations')
      .select('*, developments(name, address, location)')
      .eq('evaluator_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[VALUATIONS_GET]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('valuations')
      .insert({
        development_id: body.development_id || null,
        evaluator_id: user.id,
        purpose: body.purpose || null,
        requester_name: body.requester_name || null,
        method: body.method || 'comparative_direct',
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error('[VALUATIONS_POST]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
