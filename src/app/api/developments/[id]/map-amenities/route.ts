import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Conteúdo editorial/mídia de uma área comum do mapa (editável no backoffice).
// Sobrepõe os defaults da UI; a posição (x,y) vem da fonte canônica do mapa.
const amenitySchema = z.object({
  id: z.string().min(1).max(60),
  title: z.string().max(120).optional(),
  subtitle: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  fn: z.string().max(120).optional(),
  photos: z.array(z.string().url().max(600)).max(30).optional(),
  videos: z.array(z.string().url().max(600)).max(20).optional(),
  video: z.string().url().max(600).optional().or(z.literal("")),
  tour360: z.string().url().max(600).optional().or(z.literal("")),
})
const bodySchema = z.object({ amenities: z.array(amenitySchema).max(40) })

// GET /api/developments/[id]/map-amenities → { amenities: [...] }
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("developments")
    .select("lot_map_amenities, lot_map_enabled")
    .eq("id", params.id)
    .single()
  if (error) {
    return NextResponse.json({ amenities: [], error: error.message }, { status: 200 })
  }
  const amenities = Array.isArray(data?.lot_map_amenities) ? data.lot_map_amenities : []
  return NextResponse.json({ amenities, lot_map_enabled: data?.lot_map_enabled ?? false })
}

// PUT /api/developments/[id]/map-amenities  { amenities: [...] }  (auth obrigatória)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  let json: unknown
  try { json = await req.json() } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 })
  }
  // limpa strings vazias de video/tour360
  const clean = parsed.data.amenities.map((a) => ({
    ...a,
    video: a.video || undefined,
    tour360: a.tour360 || undefined,
  }))
  const { error } = await supabase
    .from("developments")
    .update({ lot_map_amenities: clean, updated_at: new Date().toISOString() })
    .eq("id", params.id)
  if (error) {
    return NextResponse.json({ error: "Erro ao salvar áreas comuns" }, { status: 500 })
  }
  return NextResponse.json({ ok: true, count: clean.length })
}
