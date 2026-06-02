import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateTwinSchema, type Room } from '@imi/spatial'

export const runtime = 'nodejs'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = CreateTwinSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { propertyId, developmentId, scan, rooms, measurements } = parsed.data

  const { data: twin, error } = await supabase
    .from('property_twins')
    .insert({
      property_id: propertyId,
      development_id: developmentId ?? null,
      status: 'processing',
      provider: scan.provider,
      external_id: scan.externalId ?? null,
      mesh_url: scan.meshUrl ?? null,
      point_cloud_url: scan.pointCloudUrl ?? null,
      panorama_urls: scan.panoramaUrls,
      preview_image_url: scan.previewImageUrl ?? null,
      captured_at: scan.capturedAt ?? null,
      measurements,
    })
    .select()
    .single()

  if (error || !twin) {
    return NextResponse.json({ error: 'Erro ao criar twin' }, { status: 500 })
  }

  if (rooms.length > 0) {
    await supabase.from('twin_rooms').insert(
      rooms.map((r: Room) => ({
        twin_id: twin.id,
        name: r.name,
        kind: r.kind,
        area_m2: r.areaM2 ?? null,
        ceiling_height_m: r.ceilingHeightM ?? null,
        floor_level: r.floorLevel ?? null,
      }))
    )
  }

  return NextResponse.json({ data: twin }, { status: 201 })
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const propertyId = searchParams.get('propertyId')
  const developmentId = searchParams.get('developmentId')

  let query = supabase
    .from('property_twins')
    .select('*, twin_rooms(*)')
    .order('created_at', { ascending: false })

  if (propertyId) query = query.eq('property_id', propertyId)
  if (developmentId) query = query.eq('development_id', developmentId)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar twins' }, { status: 500 })
  }

  return NextResponse.json({ data }, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
