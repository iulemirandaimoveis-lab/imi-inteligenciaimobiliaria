import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: valuation, error } = await supabase
      .from('valuations')
      .select('*, developments(name, address, location)')
      .eq('id', params.id)
      .single()

    if (error) throw new Error(error.message)

    const { data: comparables, error: compError } = await supabase
      .from('valuation_comparables')
      .select('*')
      .eq('valuation_id', params.id)
      .order('created_at', { ascending: true })

    if (compError) throw new Error(compError.message)

    return NextResponse.json({ data: { ...valuation, comparables } })
  } catch (err) {
    console.error('[VALUATION_GET]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // Filter only allowed fields
    const allowed: Record<string, unknown> = {}
    const fields = [
      'development_id', 'purpose', 'requester_name', 'method', 'status',
      'estimated_value', 'confidence_level', 'value_per_sqm', 'report_html',
      'report_url', 'completed_at', 'signed_at'
    ]
    for (const f of fields) {
      if (body[f] !== undefined) allowed[f] = body[f]
    }

    const { data, error } = await supabase
      .from('valuations')
      .update(allowed)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[VALUATION_PUT]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
