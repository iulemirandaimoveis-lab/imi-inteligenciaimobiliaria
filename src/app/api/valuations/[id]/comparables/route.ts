import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(
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

    const area = Number(body.area_sqm) || 0
    const price = Number(body.asking_price) || 0
    const pricePerSqm = area > 0 ? price / area : 0

    const { data, error } = await supabase
      .from('valuation_comparables')
      .insert({
        valuation_id: params.id,
        source: body.source || null,
        source_url: body.source_url || null,
        address: body.address || null,
        neighborhood: body.neighborhood || null,
        city: body.city || null,
        state: body.state || null,
        area_sqm: area,
        bedrooms: Number(body.bedrooms) || null,
        bathrooms: Number(body.bathrooms) || null,
        parking_spots: Number(body.parking_spots) || null,
        floor: body.floor != null ? Number(body.floor) : null,
        age_years: body.age_years != null ? Number(body.age_years) : null,
        condition: body.condition || null,
        asking_price: price,
        transaction_price: body.transaction_price ? Number(body.transaction_price) : null,
        price_per_sqm: pricePerSqm,
        is_offer: body.is_offer !== false,
        offer_factor: Number(body.offer_factor) || 1.0,
        area_factor: Number(body.area_factor) || 1.0,
        location_factor: Number(body.location_factor) || 1.0,
        age_factor: Number(body.age_factor) || 1.0,
        floor_factor: Number(body.floor_factor) || 1.0,
        parking_factor: Number(body.parking_factor) || 1.0,
        extra_factor: Number(body.extra_factor) || 1.0,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error('[COMPARABLES_POST]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const comparableId = searchParams.get('comparable_id')
    if (!comparableId) {
      return NextResponse.json({ error: 'comparable_id é obrigatório' }, { status: 400 })
    }

    const { error } = await supabase
      .from('valuation_comparables')
      .delete()
      .eq('id', comparableId)
      .eq('valuation_id', params.id)

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[COMPARABLES_DELETE]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
