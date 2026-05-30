import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIP } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const spatialLeadSchema = z.object({
  developmentId: z.string().min(1),
  propertyId: z.string().optional(),
  name: z.string().min(2).max(120),
  phone: z.string().min(8).max(30),
  email: z.string().email().optional().or(z.literal('')),
  source: z.string().default('imi-spatial-viewer'),
  interaction: z.record(z.unknown()).optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIP(req)
  const rl = await rateLimit(ip, { limit: 5, windowMs: 60_000 })
  if (!rl.success) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde um momento.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  const parsed = spatialLeadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 422 })
  }

  const { developmentId, propertyId, name, phone, email, source, interaction } = parsed.data
  const supabase = await createClient()

  const { data: dev } = await supabase
    .from('developments')
    .select('name')
    .eq('id', developmentId)
    .single()

  const interestNote = propertyId
    ? `Unidade ${propertyId}`
    : `Empreendimento ${dev?.name ?? developmentId}`

  const { data, error } = await supabase
    .from('leads')
    .insert({
      name,
      phone,
      email: email || null,
      source,
      origin: source,
      interest_type: 'compra',
      interest_location: dev?.name ?? developmentId,
      notes: JSON.stringify({ developmentId, propertyId, interaction, interestNote }),
      status: 'new',
      tags: ['spatial-viewer'],
    })
    .select('id')
    .single()

  if (error) {
    console.error('[spatial/leads] insert error:', error.message)
    return NextResponse.json({ error: 'Erro ao registrar interesse' }, { status: 500 })
  }

  return NextResponse.json({ success: true, leadId: data.id }, { status: 201 })
}
