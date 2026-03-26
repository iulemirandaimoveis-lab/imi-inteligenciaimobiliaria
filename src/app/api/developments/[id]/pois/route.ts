// GET /api/developments/[id]/pois — Returns POIs near a development
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOrFetchPOIs } from '@/lib/poi-service'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Fetch property coordinates
    const { data: dev, error } = await supabaseAdmin
      .from('developments')
      .select('id, name, latitude, longitude')
      .eq('id', id)
      .single()

    if (error || !dev) {
      return NextResponse.json(
        { error: 'Development not found' },
        { status: 404 }
      )
    }

    if (!dev.latitude || !dev.longitude) {
      return NextResponse.json(
        { error: 'Development has no coordinates' },
        { status: 422 }
      )
    }

    const result = await getOrFetchPOIs(
      supabaseAdmin,
      dev.id,
      Number(dev.latitude),
      Number(dev.longitude)
    )

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (err: unknown) {
    console.error('[POI] Error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch POIs' },
      { status: 500 }
    )
  }
}
