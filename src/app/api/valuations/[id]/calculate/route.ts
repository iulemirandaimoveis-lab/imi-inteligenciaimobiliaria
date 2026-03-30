import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateHomogenization } from '@/lib/valuation/homogenization'

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

    const body = await request.json().catch(() => ({}))
    const subjectArea = Number(body.subject_area_sqm) || 0
    if (subjectArea <= 0) {
      return NextResponse.json({ error: 'subject_area_sqm é obrigatório' }, { status: 400 })
    }

    // Fetch comparables
    const { data: comparables, error: compError } = await supabase
      .from('valuation_comparables')
      .select('*')
      .eq('valuation_id', params.id)

    if (compError) throw new Error(compError.message)
    if (!comparables || comparables.length === 0) {
      return NextResponse.json({ error: 'Nenhum comparando cadastrado' }, { status: 400 })
    }

    // Calculate
    const mapped = comparables.map(c => ({
      asking_price: Number(c.asking_price) || 0,
      area_sqm: Number(c.area_sqm) || 1,
      offer_factor: Number(c.offer_factor) || 1,
      area_factor: Number(c.area_factor) || 1,
      location_factor: Number(c.location_factor) || 1,
      age_factor: Number(c.age_factor) || 1,
      floor_factor: Number(c.floor_factor) || 1,
      parking_factor: Number(c.parking_factor) || 1,
      extra_factor: Number(c.extra_factor) || 1,
    }))

    const result = calculateHomogenization(mapped, subjectArea)

    // Update homogenized prices on each comparable
    for (let i = 0; i < comparables.length; i++) {
      await supabase
        .from('valuation_comparables')
        .update({
          homogenized_price_per_sqm: result.comparables[i].homogenized_price_per_sqm,
        })
        .eq('id', comparables[i].id)
    }

    // Update valuation
    const { error: updateError } = await supabase
      .from('valuations')
      .update({
        estimated_value: result.estimated_value,
        confidence_level: `Grau ${result.confidence_grade}`,
        value_per_sqm: result.average_price_per_sqm,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (updateError) throw new Error(updateError.message)

    return NextResponse.json({ data: result })
  } catch (err) {
    console.error('[CALCULATE]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
