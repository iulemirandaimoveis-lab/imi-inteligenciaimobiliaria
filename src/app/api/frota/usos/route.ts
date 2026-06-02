import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler, ApiContext } from '@/lib/api-helpers'
import { logAudit, getRequestMeta } from '@/lib/governance'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const usagePostSchema = z.object({
  vehicle_id: z.string().uuid('vehicle_id inválido'),
  purpose: z.enum([
    'visita_cliente', 'plantao', 'captacao', 'vistoria',
    'documentacao', 'reuniao', 'marketing', 'suporte_interno', 'outro',
  ]),
  purpose_description: z.string().min(5, 'Descreva o motivo (mínimo 5 caracteres)'),
  destination: z.string().optional().nullable(),
  estimated_return: z.string().datetime({ offset: true }).optional().nullable(),
})

const usagePatchSchema = z.object({
  id: z.string().uuid('ID inválido'),
  // Approve / Reject (admin/manager)
  status: z.enum(['aprovado', 'rejeitado', 'cancelado']).optional(),
  rejection_reason: z.string().optional().nullable(),
  // Pickup (retirado) — broker
  km_initial: z.number().int().min(0).optional(),
  fuel_level_initial: z.enum(['vazio', '1/4', '1/2', '3/4', 'cheio']).optional(),
  pickup_photos: z.array(z.string()).optional().default([]),
  pickup_photo_metadata: z.record(z.unknown()).optional().default({}),
  pickup_notes: z.string().optional().nullable(),
  // Return (devolvido) — broker
  km_final: z.number().int().min(0).optional(),
  fuel_level_final: z.enum(['vazio', '1/4', '1/2', '3/4', 'cheio']).optional(),
  return_photos: z.array(z.string()).optional().default([]),
  return_photo_metadata: z.record(z.unknown()).optional().default({}),
  return_notes: z.string().optional().nullable(),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getProfileRole(supabase: ApiContext['supabase'], userId: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  return data?.role ?? 'broker'
}

async function getBrokerByUserId(supabase: ApiContext['supabase'], userId: string) {
  const { data } = await supabase
    .from('brokers')
    .select('id, name, status')
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

// ─── GET /api/frota/usos ──────────────────────────────────────────────────────

export const GET = apiHandler(null, async (req: NextRequest, _body: unknown, ctx: ApiContext) => {
  const { supabase, user } = ctx
  const { searchParams } = new URL(req.url)

  const status = searchParams.get('status')
  const brokerId = searchParams.get('broker_id')
  const vehicleId = searchParams.get('vehicle_id')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')

  const role = await getProfileRole(supabase, user!.id)
  const isManager = ['admin', 'owner', 'broker_manager'].includes(role)

  // Brokers see only their own usages
  let effectiveBrokerId = brokerId
  if (!isManager) {
    const broker = await getBrokerByUserId(supabase, user!.id)
    if (!broker) return NextResponse.json({ error: 'Corretor não encontrado.' }, { status: 404 })
    effectiveBrokerId = broker.id
  }

  let query = supabase
    .from('fleet_usages')
    .select(`
      *,
      vehicle:fleet_vehicles(id, plate, brand, model, year, fuel_type, km_current, color),
      broker:brokers(id, name, email, phone, avatar_url)
    `)
    .order('created_at', { ascending: false })

  if (effectiveBrokerId) {
    query = query.eq('broker_id', effectiveBrokerId)
  }
  if (vehicleId) {
    query = query.eq('vehicle_id', vehicleId)
  }
  if (status) {
    query = query.eq('status', status)
  }
  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('[frota/usos] GET error:', error)
    return NextResponse.json({ error: 'Erro ao buscar usos' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], count: (data ?? []).length })
}, { auth: true })

// ─── POST /api/frota/usos — Broker requests vehicle usage ────────────────────

export const POST = apiHandler(usagePostSchema, async (req: NextRequest, body: z.infer<typeof usagePostSchema>, ctx: ApiContext) => {
  const { supabase, user } = ctx

  // Resolve broker record for the authenticated user
  const broker = await getBrokerByUserId(supabase, user!.id)
  if (!broker) {
    return NextResponse.json({ error: 'Corretor não encontrado para este usuário.' }, { status: 404 })
  }
  if (broker.status !== 'active') {
    return NextResponse.json({ error: 'Sua conta está inativa.' }, { status: 403 })
  }

  // Business rule: broker cannot request if they have a pending/active usage
  const { data: pending } = await supabase
    .from('fleet_usages')
    .select('id, status')
    .eq('broker_id', broker.id)
    .in('status', ['solicitado', 'aprovado', 'retirado'])
    .limit(1)

  if (pending && pending.length > 0) {
    const pendingStatus = (pending[0] as Record<string, string>).status
    return NextResponse.json(
      { error: `Você já possui um uso de veículo com status "${pendingStatus}". Conclua ou cancele antes de solicitar um novo.` },
      { status: 409 }
    )
  }

  // Business rule: vehicle must be 'disponivel'
  const { data: vehicle } = await supabase
    .from('fleet_vehicles')
    .select('id, status, plate, brand, model')
    .eq('id', body.vehicle_id)
    .eq('is_active', true)
    .maybeSingle()

  if (!vehicle) {
    return NextResponse.json({ error: 'Veículo não encontrado.' }, { status: 404 })
  }

  if (vehicle.status !== 'disponivel') {
    return NextResponse.json(
      { error: `Veículo não disponível para uso (status atual: ${vehicle.status}).` },
      { status: 409 }
    )
  }

  const { data: usage, error } = await supabase
    .from('fleet_usages')
    .insert({
      vehicle_id: body.vehicle_id,
      broker_id: broker.id,
      status: 'solicitado',
      purpose: body.purpose,
      purpose_description: body.purpose_description,
      destination: body.destination ?? null,
      estimated_return: body.estimated_return ?? null,
      pickup_photos: [],
      pickup_photo_metadata: {},
      return_photos: [],
      return_photo_metadata: {},
    })
    .select(`
      *,
      vehicle:fleet_vehicles(id, plate, brand, model),
      broker:brokers(id, name)
    `)
    .single()

  if (error) {
    const msg = error.message ?? ''
    if (msg.includes('VEHICLE_UNAVAILABLE')) {
      return NextResponse.json({ error: 'Veículo não está disponível.' }, { status: 409 })
    }
    console.error('[frota/usos] POST error:', error)
    return NextResponse.json({ error: 'Erro ao solicitar uso do veículo' }, { status: 500 })
  }

  const meta = getRequestMeta(req)
  logAudit({
    user_id: user!.id,
    action: 'frota.uso.create',
    entity_type: 'fleet_usage',
    entity_id: usage.id,
    new_data: {
      vehicle_id: body.vehicle_id,
      broker_id: broker.id,
      purpose: body.purpose,
      destination: body.destination,
    },
    ...meta,
  })

  return NextResponse.json({ success: true, usage }, { status: 201 })
}, { auth: true })

// ─── PATCH /api/frota/usos — Status transitions ───────────────────────────────

export const PATCH = apiHandler(usagePatchSchema, async (req: NextRequest, body: z.infer<typeof usagePatchSchema>, ctx: ApiContext) => {
  const { supabase, user } = ctx

  const role = await getProfileRole(supabase, user!.id)
  const isManager = ['admin', 'owner', 'broker_manager'].includes(role)

  // Fetch existing usage
  const { data: existing } = await supabase
    .from('fleet_usages')
    .select('*')
    .eq('id', body.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'Uso não encontrado.' }, { status: 404 })
  }

  // Brokers can only operate on their own usages
  if (!isManager) {
    const broker = await getBrokerByUserId(supabase, user!.id)
    if (!broker || broker.id !== existing.broker_id) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }
  }

  const currentStatus = existing.status as string
  const now = new Date().toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let updatePayload: Record<string, any> = { updated_at: now }

  // ── Approve (admin/manager only) ─────────────────────────────────────────
  if (body.status === 'aprovado') {
    if (!isManager) {
      return NextResponse.json({ error: 'Apenas gestores podem aprovar usos.' }, { status: 403 })
    }
    if (currentStatus !== 'solicitado') {
      return NextResponse.json({ error: `Não é possível aprovar um uso com status "${currentStatus}".` }, { status: 409 })
    }
    updatePayload = { ...updatePayload, status: 'aprovado', approved_by: user!.id, approved_at: now }
  }

  // ── Reject (admin/manager only) ──────────────────────────────────────────
  else if (body.status === 'rejeitado') {
    if (!isManager) {
      return NextResponse.json({ error: 'Apenas gestores podem rejeitar usos.' }, { status: 403 })
    }
    if (!['solicitado', 'aprovado'].includes(currentStatus)) {
      return NextResponse.json({ error: `Não é possível rejeitar um uso com status "${currentStatus}".` }, { status: 409 })
    }
    updatePayload = {
      ...updatePayload,
      status: 'rejeitado',
      rejected_by: user!.id,
      rejected_at: now,
      rejection_reason: body.rejection_reason ?? null,
    }
  }

  // ── Cancel (broker: own pending; manager: any pending) ───────────────────
  else if (body.status === 'cancelado') {
    if (!['solicitado', 'aprovado'].includes(currentStatus)) {
      return NextResponse.json({ error: `Não é possível cancelar um uso com status "${currentStatus}".` }, { status: 409 })
    }
    updatePayload = { ...updatePayload, status: 'cancelado' }
  }

  // ── Pickup — transition solicitado/aprovado → retirado ───────────────────
  else if (body.km_initial !== undefined && !body.km_final) {
    if (currentStatus !== 'aprovado') {
      return NextResponse.json({ error: 'Retirada só é permitida após aprovação.' }, { status: 409 })
    }
    if (body.km_initial === undefined) {
      return NextResponse.json({ error: 'km_initial é obrigatório na retirada.' }, { status: 400 })
    }
    if (!body.fuel_level_initial) {
      return NextResponse.json({ error: 'fuel_level_initial é obrigatório na retirada.' }, { status: 400 })
    }
    updatePayload = {
      ...updatePayload,
      status: 'retirado',
      km_initial: body.km_initial,
      fuel_level_initial: body.fuel_level_initial,
      pickup_at: now,
      pickup_by: user!.id,
      pickup_photos: body.pickup_photos ?? [],
      pickup_photo_metadata: body.pickup_photo_metadata ?? {},
      pickup_notes: body.pickup_notes ?? null,
    }
  }

  // ── Return — transition retirado → devolvido ─────────────────────────────
  else if (body.km_final !== undefined) {
    if (currentStatus !== 'retirado') {
      return NextResponse.json({ error: 'Devolução só é permitida para veículos retirados.' }, { status: 409 })
    }
    if (body.km_final === undefined) {
      return NextResponse.json({ error: 'km_final é obrigatório na devolução.' }, { status: 400 })
    }
    if (!body.fuel_level_final) {
      return NextResponse.json({ error: 'fuel_level_final é obrigatório na devolução.' }, { status: 400 })
    }
    // Validate km_final >= km_initial
    const kmInitial = existing.km_initial as number | null
    if (kmInitial !== null && kmInitial !== undefined && body.km_final < kmInitial) {
      return NextResponse.json(
        { error: `km_final (${body.km_final}) não pode ser menor que km_initial (${kmInitial}).` },
        { status: 400 }
      )
    }
    updatePayload = {
      ...updatePayload,
      status: 'devolvido',
      km_final: body.km_final,
      fuel_level_final: body.fuel_level_final,
      return_at: now,
      return_photos: body.return_photos ?? [],
      return_photo_metadata: body.return_photo_metadata ?? {},
      return_notes: body.return_notes ?? null,
    }
  }

  else {
    return NextResponse.json({ error: 'Nenhuma ação válida fornecida.' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('fleet_usages')
    .update(updatePayload)
    .eq('id', body.id)
    .select(`
      *,
      vehicle:fleet_vehicles(id, plate, brand, model),
      broker:brokers(id, name)
    `)
    .single()

  if (error) {
    const msg = error.message ?? ''
    if (msg.includes('VEHICLE_UNAVAILABLE')) {
      return NextResponse.json({ error: 'Veículo não está disponível.' }, { status: 409 })
    }
    if (msg.includes('BROKER_HAS_PENDING')) {
      return NextResponse.json({ error: 'Corretor já possui veículo retirado sem devolução.' }, { status: 409 })
    }
    console.error('[frota/usos] PATCH error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar uso' }, { status: 500 })
  }

  const meta = getRequestMeta(req)
  logAudit({
    user_id: user!.id,
    action: `frota.uso.${updatePayload.status ?? 'update'}`,
    entity_type: 'fleet_usage',
    entity_id: body.id,
    old_data: { status: currentStatus },
    new_data: { status: updatePayload.status, km_initial: updatePayload.km_initial, km_final: updatePayload.km_final },
    ...meta,
  })

  return NextResponse.json({ success: true, usage: updated })
}, { auth: true })
