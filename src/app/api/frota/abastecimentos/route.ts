import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler, ApiContext } from '@/lib/api-helpers'
import { logAudit, getRequestMeta } from '@/lib/governance'

// ─── Schema ───────────────────────────────────────────────────────────────────

const fuelingPostSchema = z.object({
  usage_id: z.string().uuid('usage_id inválido'),
  fuel_type: z.string().min(1, 'Tipo de combustível é obrigatório'),
  liters: z.number().positive('Litros deve ser positivo'),
  price_per_liter: z.number().positive('Preço por litro deve ser positivo'),
  gas_station: z.string().optional().nullable(),
  km_at_fueling: z.number().int().min(0).optional().nullable(),
  receipt_url: z.string().url().optional().nullable(),
  receipt_photo_metadata: z.record(z.unknown()).optional().default({}),
  notes: z.string().optional().nullable(),
  fueled_at: z.string().datetime({ offset: true }).optional(),
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

// ─── GET /api/frota/abastecimentos ───────────────────────────────────────────

export const GET = apiHandler(null, async (req: NextRequest, _body: unknown, ctx: ApiContext) => {
  const { supabase, user } = ctx
  const { searchParams } = new URL(req.url)

  const usageId = searchParams.get('usage_id')
  const vehicleId = searchParams.get('vehicle_id')
  const brokerId = searchParams.get('broker_id')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')

  const role = await getProfileRole(supabase, user!.id)
  const isManager = ['admin', 'owner', 'broker_manager'].includes(role)

  let effectiveBrokerId = brokerId
  if (!isManager) {
    const broker = await getBrokerByUserId(supabase, user!.id)
    if (!broker) return NextResponse.json({ error: 'Corretor não encontrado.' }, { status: 404 })
    effectiveBrokerId = broker.id
  }

  let query = supabase
    .from('fleet_fuelings')
    .select(`
      *,
      usage:fleet_usages(id, status, purpose, km_initial, km_final),
      vehicle:fleet_vehicles(id, plate, brand, model),
      broker:brokers(id, name, avatar_url)
    `)
    .order('fueled_at', { ascending: false })

  if (effectiveBrokerId) {
    query = query.eq('broker_id', effectiveBrokerId)
  }
  if (usageId) {
    query = query.eq('usage_id', usageId)
  }
  if (vehicleId) {
    query = query.eq('vehicle_id', vehicleId)
  }
  if (startDate) {
    query = query.gte('fueled_at', startDate)
  }
  if (endDate) {
    query = query.lte('fueled_at', endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('[frota/abastecimentos] GET error:', error)
    return NextResponse.json({ error: 'Erro ao buscar abastecimentos' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], count: (data ?? []).length })
}, { auth: true })

// ─── POST /api/frota/abastecimentos ──────────────────────────────────────────

export const POST = apiHandler(fuelingPostSchema, async (req: NextRequest, body: z.infer<typeof fuelingPostSchema>, ctx: ApiContext) => {
  const { supabase, user } = ctx

  // Resolve broker record
  const broker = await getBrokerByUserId(supabase, user!.id)
  const role = await getProfileRole(supabase, user!.id)
  const isManager = ['admin', 'owner', 'broker_manager'].includes(role)

  // Validate that the usage exists and is in 'retirado' status
  const { data: usage } = await supabase
    .from('fleet_usages')
    .select('id, vehicle_id, broker_id, status, km_initial')
    .eq('id', body.usage_id)
    .maybeSingle()

  if (!usage) {
    return NextResponse.json({ error: 'Uso não encontrado.' }, { status: 404 })
  }

  if (usage.status !== 'retirado') {
    return NextResponse.json(
      { error: 'Abastecimentos só podem ser registrados para veículos que estão retirados (em uso).' },
      { status: 409 }
    )
  }

  // Broker can only register fuelings for their own usage
  if (!isManager) {
    if (!broker || broker.id !== usage.broker_id) {
      return NextResponse.json({ error: 'Acesso negado. Este uso pertence a outro corretor.' }, { status: 403 })
    }
  }

  // Validate km_at_fueling >= km_initial if provided
  if (body.km_at_fueling !== null && body.km_at_fueling !== undefined) {
    const kmInitial = usage.km_initial as number | null
    if (kmInitial !== null && kmInitial !== undefined && body.km_at_fueling < kmInitial) {
      return NextResponse.json(
        { error: `km_at_fueling (${body.km_at_fueling}) não pode ser menor que o km de retirada (${kmInitial}).` },
        { status: 400 }
      )
    }
  }

  const { data: fueling, error } = await supabase
    .from('fleet_fuelings')
    .insert({
      usage_id: body.usage_id,
      vehicle_id: usage.vehicle_id,
      broker_id: usage.broker_id,
      fuel_type: body.fuel_type,
      liters: body.liters,
      price_per_liter: body.price_per_liter,
      gas_station: body.gas_station ?? null,
      km_at_fueling: body.km_at_fueling ?? null,
      receipt_url: body.receipt_url ?? null,
      receipt_photo_metadata: body.receipt_photo_metadata ?? {},
      notes: body.notes ?? null,
      fueled_at: body.fueled_at ?? new Date().toISOString(),
    })
    .select(`
      *,
      vehicle:fleet_vehicles(id, plate, brand, model),
      broker:brokers(id, name)
    `)
    .single()

  if (error) {
    console.error('[frota/abastecimentos] POST error:', error)
    return NextResponse.json({ error: 'Erro ao registrar abastecimento' }, { status: 500 })
  }

  const meta = getRequestMeta(req)
  logAudit({
    user_id: user!.id,
    action: 'frota.abastecimento.create',
    entity_type: 'fleet_fueling',
    entity_id: fueling.id,
    new_data: {
      usage_id: body.usage_id,
      vehicle_id: usage.vehicle_id,
      fuel_type: body.fuel_type,
      liters: body.liters,
      price_per_liter: body.price_per_liter,
      total_cost: body.liters * body.price_per_liter,
    },
    ...meta,
  })

  return NextResponse.json({ success: true, fueling }, { status: 201 })
}, { auth: true })
