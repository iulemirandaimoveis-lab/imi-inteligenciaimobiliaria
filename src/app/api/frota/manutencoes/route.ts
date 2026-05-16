import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler, ApiContext } from '@/lib/api-helpers'
import { logAudit, getRequestMeta } from '@/lib/governance'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const maintenancePostSchema = z.object({
  vehicle_id: z.string().uuid('vehicle_id inválido'),
  maintenance_type: z.enum(['preventiva', 'corretiva', 'revisao', 'pneu', 'freio', 'outros']),
  description: z.string().min(5, 'Descrição é obrigatória (mínimo 5 caracteres)'),
  cost: z.number().min(0).optional().nullable(),
  km_at_maintenance: z.number().int().min(0).optional().nullable(),
  service_center: z.string().optional().nullable(),
  invoice_url: z.string().url().optional().nullable(),
  next_maintenance_km: z.number().int().min(0).optional().nullable(),
  next_maintenance_date: z.string().optional().nullable(),
})

const maintenancePatchSchema = z.object({
  id: z.string().uuid('ID inválido'),
  status: z.enum(['em_andamento', 'concluida', 'cancelada']),
  cost: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
  completed_at: z.string().datetime({ offset: true }).optional().nullable(),
  next_maintenance_km: z.number().int().min(0).optional().nullable(),
  next_maintenance_date: z.string().optional().nullable(),
  invoice_url: z.string().url().optional().nullable(),
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

// ─── GET /api/frota/manutencoes ───────────────────────────────────────────────

export const GET = apiHandler(null, async (req: NextRequest, _body: unknown, ctx: ApiContext) => {
  const { supabase } = ctx
  const { searchParams } = new URL(req.url)

  const vehicleId = searchParams.get('vehicle_id')
  const status = searchParams.get('status')

  let query = supabase
    .from('fleet_maintenances')
    .select(`
      *,
      vehicle:fleet_vehicles(id, plate, brand, model, year, km_current, status)
    `)
    .order('created_at', { ascending: false })

  if (vehicleId) {
    query = query.eq('vehicle_id', vehicleId)
  }
  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('[frota/manutencoes] GET error:', error)
    return NextResponse.json({ error: 'Erro ao buscar manutenções' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], count: (data ?? []).length })
}, { auth: true })

// ─── POST /api/frota/manutencoes ──────────────────────────────────────────────

export const POST = apiHandler(maintenancePostSchema, async (req: NextRequest, body: z.infer<typeof maintenancePostSchema>, ctx: ApiContext) => {
  const { supabase, user } = ctx

  const role = await getProfileRole(supabase, user!.id)
  if (!['admin', 'owner', 'broker_manager'].includes(role)) {
    return NextResponse.json({ error: 'Acesso negado. Apenas gestores podem registrar manutenções.' }, { status: 403 })
  }

  // Validate vehicle exists and is active
  const { data: vehicle } = await supabase
    .from('fleet_vehicles')
    .select('id, plate, status, is_active')
    .eq('id', body.vehicle_id)
    .eq('is_active', true)
    .maybeSingle()

  if (!vehicle) {
    return NextResponse.json({ error: 'Veículo não encontrado.' }, { status: 404 })
  }

  const now = new Date().toISOString()

  // Insert the maintenance record
  const { data: maintenance, error } = await supabase
    .from('fleet_maintenances')
    .insert({
      vehicle_id: body.vehicle_id,
      maintenance_type: body.maintenance_type,
      description: body.description,
      cost: body.cost ?? null,
      km_at_maintenance: body.km_at_maintenance ?? null,
      service_center: body.service_center ?? null,
      invoice_url: body.invoice_url ?? null,
      next_maintenance_km: body.next_maintenance_km ?? null,
      next_maintenance_date: body.next_maintenance_date ?? null,
      status: 'pendente',
      created_by: user!.id,
    })
    .select()
    .single()

  if (error) {
    console.error('[frota/manutencoes] POST error:', error)
    return NextResponse.json({ error: 'Erro ao registrar manutenção' }, { status: 500 })
  }

  // Business rule: corretiva maintenance puts vehicle in 'manutencao' status
  if (body.maintenance_type === 'corretiva' && vehicle.status === 'disponivel') {
    await supabase
      .from('fleet_vehicles')
      .update({ status: 'manutencao', updated_at: now })
      .eq('id', body.vehicle_id)
  }

  // Also update next_revision_km on the vehicle if provided
  if (body.next_maintenance_km) {
    await supabase
      .from('fleet_vehicles')
      .update({
        next_revision_km: body.next_maintenance_km,
        next_revision_date: body.next_maintenance_date ?? null,
        updated_at: now,
      })
      .eq('id', body.vehicle_id)
  }

  const meta = getRequestMeta(req)
  logAudit({
    user_id: user!.id,
    action: 'frota.manutencao.create',
    entity_type: 'fleet_maintenance',
    entity_id: maintenance.id,
    new_data: {
      vehicle_id: body.vehicle_id,
      maintenance_type: body.maintenance_type,
      description: body.description,
      cost: body.cost,
    },
    ...meta,
  })

  return NextResponse.json({ success: true, maintenance }, { status: 201 })
}, { auth: true })

// ─── PATCH /api/frota/manutencoes — Update status ────────────────────────────

export const PATCH = apiHandler(maintenancePatchSchema, async (req: NextRequest, body: z.infer<typeof maintenancePatchSchema>, ctx: ApiContext) => {
  const { supabase, user } = ctx

  const role = await getProfileRole(supabase, user!.id)
  if (!['admin', 'owner', 'broker_manager'].includes(role)) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  // Fetch existing maintenance
  const { data: existing } = await supabase
    .from('fleet_maintenances')
    .select('*')
    .eq('id', body.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'Manutenção não encontrada.' }, { status: 404 })
  }

  const currentStatus = existing.status as string
  if (currentStatus === 'concluida' || currentStatus === 'cancelada') {
    return NextResponse.json({ error: `Manutenção já ${currentStatus}. Não é possível alterar.` }, { status: 409 })
  }

  const now = new Date().toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: Record<string, any> = {
    status: body.status,
    updated_at: now,
  }

  if (body.status === 'em_andamento') {
    updatePayload.started_at = now
  }

  if (body.status === 'concluida') {
    updatePayload.completed_at = body.completed_at ?? now
    if (body.cost !== undefined) updatePayload.cost = body.cost
    if (body.invoice_url) updatePayload.invoice_url = body.invoice_url
    if (body.next_maintenance_km !== undefined) updatePayload.next_maintenance_km = body.next_maintenance_km
    if (body.next_maintenance_date !== undefined) updatePayload.next_maintenance_date = body.next_maintenance_date
  }

  const { data: updated, error } = await supabase
    .from('fleet_maintenances')
    .update(updatePayload)
    .eq('id', body.id)
    .select()
    .single()

  if (error) {
    console.error('[frota/manutencoes] PATCH error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar manutenção' }, { status: 500 })
  }

  // On completion: set vehicle back to 'disponivel'
  if (body.status === 'concluida') {
    const vehicleId = existing.vehicle_id as string
    const { data: vehicle } = await supabase
      .from('fleet_vehicles')
      .select('status')
      .eq('id', vehicleId)
      .maybeSingle()

    if (vehicle?.status === 'manutencao') {
      await supabase
        .from('fleet_vehicles')
        .update({
          status: 'disponivel',
          // Update next revision info if provided
          ...(body.next_maintenance_km ? { next_revision_km: body.next_maintenance_km } : {}),
          ...(body.next_maintenance_date ? { next_revision_date: body.next_maintenance_date } : {}),
          updated_at: now,
        })
        .eq('id', vehicleId)
    }
  }

  const meta = getRequestMeta(req)
  logAudit({
    user_id: user!.id,
    action: `frota.manutencao.${body.status}`,
    entity_type: 'fleet_maintenance',
    entity_id: body.id,
    old_data: { status: currentStatus },
    new_data: { status: body.status, cost: body.cost },
    ...meta,
  })

  return NextResponse.json({ success: true, maintenance: updated })
}, { auth: true })
