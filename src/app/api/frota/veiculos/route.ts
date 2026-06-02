import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler, ApiContext } from '@/lib/api-helpers'
import { logAudit, getRequestMeta } from '@/lib/governance'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const vehiclePostSchema = z.object({
  plate: z.string().min(7, 'Placa inválida').max(8).toUpperCase(),
  brand: z.string().min(1, 'Marca é obrigatória'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  year: z.number().int().min(1990).max(2035),
  fuel_type: z.enum(['flex', 'gasolina', 'etanol', 'diesel', 'eletrico', 'hibrido']).default('flex'),
  km_current: z.number().int().min(0).default(0),
  color: z.string().optional().nullable(),
  renavam: z.string().optional().nullable(),
  insurance_expiry: z.string().optional().nullable(),
  ipva_expiry: z.string().optional().nullable(),
  license_expiry: z.string().optional().nullable(),
  next_revision_km: z.number().int().min(0).optional().nullable(),
  next_revision_date: z.string().optional().nullable(),
  avg_consumption: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  photo_urls: z.array(z.string().url()).optional().default([]),
  docs_urls: z.array(z.string().url()).optional().default([]),
})

const vehiclePutSchema = vehiclePostSchema.partial().extend({
  id: z.string().uuid('ID inválido'),
  status: z.enum(['disponivel', 'em_uso', 'manutencao', 'bloqueado', 'sinistrado', 'reserva']).optional(),
})

const vehicleDeleteSchema = z.object({
  id: z.string().uuid('ID inválido'),
})

// ─── Helper ───────────────────────────────────────────────────────────────────

async function getProfileRole(supabase: ApiContext['supabase'], userId: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  return data?.role ?? 'broker'
}

// ─── GET /api/frota/veiculos ──────────────────────────────────────────────────

export const GET = apiHandler(null, async (req: NextRequest, _body: unknown, ctx: ApiContext) => {
  const { supabase } = ctx
  const { searchParams } = new URL(req.url)

  const status = searchParams.get('status')
  const search = searchParams.get('search')?.trim()

  let query = supabase
    .from('fleet_vehicles')
    .select('*')
    .eq('is_active', true)
    .order('brand', { ascending: true })
    .order('model', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  }

  if (search) {
    const safe = search.replace(/[%_]/g, '').slice(0, 50)
    if (safe) {
      query = query.or(`plate.ilike.%${safe}%,brand.ilike.%${safe}%,model.ilike.%${safe}%`)
    }
  }

  const { data: vehicles, error } = await query

  if (error) {
    console.error('[frota/veiculos] GET error:', error)
    return NextResponse.json({ error: 'Erro ao buscar veículos' }, { status: 500 })
  }

  // Enrich each available/em_uso vehicle with its current active usage + broker
  const vehicleIds = (vehicles ?? [])
    .filter((v: Record<string, unknown>) => v.status === 'em_uso')
    .map((v: Record<string, unknown>) => v.id as string)

  let usageMap: Record<string, unknown> = {}
  if (vehicleIds.length > 0) {
    const { data: usages } = await supabase
      .from('fleet_usages')
      .select('id, vehicle_id, broker_id, status, purpose, pickup_at, estimated_return, brokers(id, name, avatar_url)')
      .in('vehicle_id', vehicleIds)
      .in('status', ['retirado'])

    for (const u of usages ?? []) {
      const usage = u as Record<string, unknown>
      usageMap[usage.vehicle_id as string] = usage
    }
  }

  const enriched = (vehicles ?? []).map((v: Record<string, unknown>) => ({
    ...v,
    current_usage: usageMap[v.id as string] ?? null,
  }))

  return NextResponse.json({ data: enriched, count: enriched.length })
}, { auth: true })

// ─── POST /api/frota/veiculos ─────────────────────────────────────────────────

export const POST = apiHandler(vehiclePostSchema, async (req: NextRequest, body: z.infer<typeof vehiclePostSchema>, ctx: ApiContext) => {
  const { supabase, user } = ctx

  const role = await getProfileRole(supabase, user!.id)
  if (!['admin', 'owner', 'broker_manager'].includes(role)) {
    return NextResponse.json({ error: 'Acesso negado. Apenas gestores podem cadastrar veículos.' }, { status: 403 })
  }

  const { data: vehicle, error } = await supabase
    .from('fleet_vehicles')
    .insert({
      plate: body.plate.toUpperCase(),
      brand: body.brand,
      model: body.model,
      year: body.year,
      fuel_type: body.fuel_type,
      km_current: body.km_current,
      color: body.color ?? null,
      renavam: body.renavam ?? null,
      insurance_expiry: body.insurance_expiry ?? null,
      ipva_expiry: body.ipva_expiry ?? null,
      license_expiry: body.license_expiry ?? null,
      next_revision_km: body.next_revision_km ?? null,
      next_revision_date: body.next_revision_date ?? null,
      avg_consumption: body.avg_consumption ?? null,
      notes: body.notes ?? null,
      photo_urls: body.photo_urls ?? [],
      docs_urls: body.docs_urls ?? [],
      status: 'disponivel',
      is_active: true,
      created_by: user!.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Placa ou RENAVAM já cadastrado.' }, { status: 409 })
    }
    console.error('[frota/veiculos] POST error:', error)
    return NextResponse.json({ error: 'Erro ao cadastrar veículo' }, { status: 500 })
  }

  const meta = getRequestMeta(req)
  logAudit({
    user_id: user!.id,
    action: 'frota.veiculo.create',
    entity_type: 'fleet_vehicle',
    entity_id: vehicle.id,
    new_data: { plate: vehicle.plate, brand: vehicle.brand, model: vehicle.model, year: vehicle.year },
    ...meta,
  })

  return NextResponse.json({ success: true, vehicle }, { status: 201 })
}, { auth: true })

// ─── PUT /api/frota/veiculos ──────────────────────────────────────────────────

export const PUT = apiHandler(vehiclePutSchema, async (req: NextRequest, body: z.infer<typeof vehiclePutSchema>, ctx: ApiContext) => {
  const { supabase, user } = ctx

  const role = await getProfileRole(supabase, user!.id)
  if (!['admin', 'owner', 'broker_manager'].includes(role)) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const { id, ...fields } = body

  // Fetch existing for audit
  const { data: existing } = await supabase
    .from('fleet_vehicles')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'Veículo não encontrado.' }, { status: 404 })
  }

  const { data: vehicle, error } = await supabase
    .from('fleet_vehicles')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[frota/veiculos] PUT error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar veículo' }, { status: 500 })
  }

  const meta = getRequestMeta(req)
  logAudit({
    user_id: user!.id,
    action: 'frota.veiculo.update',
    entity_type: 'fleet_vehicle',
    entity_id: id,
    old_data: { plate: existing.plate, status: existing.status, km_current: existing.km_current },
    new_data: fields as Record<string, unknown>,
    ...meta,
  })

  return NextResponse.json({ success: true, vehicle })
}, { auth: true })

// ─── DELETE /api/frota/veiculos ───────────────────────────────────────────────

export const DELETE = apiHandler(vehicleDeleteSchema, async (req: NextRequest, body: z.infer<typeof vehicleDeleteSchema>, ctx: ApiContext) => {
  const { supabase, user } = ctx

  const role = await getProfileRole(supabase, user!.id)
  if (!['admin', 'owner'].includes(role)) {
    return NextResponse.json({ error: 'Acesso negado. Apenas admins podem desativar veículos.' }, { status: 403 })
  }

  const { data: existing } = await supabase
    .from('fleet_vehicles')
    .select('id, plate, status')
    .eq('id', body.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'Veículo não encontrado.' }, { status: 404 })
  }

  if (existing.status === 'em_uso') {
    return NextResponse.json({ error: 'Não é possível desativar veículo que está em uso.' }, { status: 409 })
  }

  const { error } = await supabase
    .from('fleet_vehicles')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', body.id)

  if (error) {
    console.error('[frota/veiculos] DELETE error:', error)
    return NextResponse.json({ error: 'Erro ao desativar veículo' }, { status: 500 })
  }

  const meta = getRequestMeta(req)
  logAudit({
    user_id: user!.id,
    action: 'frota.veiculo.deactivate',
    entity_type: 'fleet_vehicle',
    entity_id: body.id,
    old_data: { plate: existing.plate, status: existing.status },
    new_data: { is_active: false },
    ...meta,
  })

  return NextResponse.json({ success: true })
}, { auth: true })
