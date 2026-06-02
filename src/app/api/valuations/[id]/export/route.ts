import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateHomogenization } from '@/lib/valuation/homogenization'
import { generatePTAMHtml } from '@/lib/valuation/generate-ptam-html'

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

    // Fetch valuation with development
    const { data: valuation, error: valError } = await supabase
      .from('valuations')
      .select('*, developments(name, address, location)')
      .eq('id', params.id)
      .single()

    if (valError) throw new Error(valError.message)

    // Fetch comparables
    const { data: comparables, error: compError } = await supabase
      .from('valuation_comparables')
      .select('*')
      .eq('valuation_id', params.id)
      .order('created_at', { ascending: true })

    if (compError) throw new Error(compError.message)

    // Re-calculate to get full result
    const subjectArea = Number(valuation.value_per_sqm) > 0 && Number(valuation.estimated_value) > 0
      ? Number(valuation.estimated_value) / Number(valuation.value_per_sqm)
      : 100

    const mapped = (comparables || []).map(c => ({
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

    const result = mapped.length > 0
      ? calculateHomogenization(mapped, subjectArea)
      : {
          comparables: [],
          average_price_per_sqm: 0,
          median_price_per_sqm: 0,
          std_deviation: 0,
          coefficient_of_variation: 0,
          estimated_value: 0,
          confidence_grade: 'I' as const,
        }

    // Get evaluator name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, name')
      .eq('id', valuation.evaluator_id)
      .single()

    const evaluatorName = profile?.full_name || profile?.name || user.email || 'Avaliador'

    const rawPhotos = valuation.photos as unknown
    const photos = Array.isArray(rawPhotos) ? rawPhotos as { url: string; name?: string; caption?: string }[] : []

    const html = generatePTAMHtml({
      valuation,
      development: valuation.developments || null,
      comparables: comparables || [],
      result,
      evaluatorName,
      photos,
    })

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (err) {
    console.error('[EXPORT]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
