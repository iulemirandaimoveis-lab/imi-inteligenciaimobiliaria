import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler, ApiContext } from '@/lib/api-helpers'
import { logAudit, getRequestMeta } from '@/lib/governance'

// ─── Schema ───────────────────────────────────────────────────────────────────

const flagUsageSchema = z.object({
  usage_id: z.string().uuid('usage_id inválido'),
  reason: z.string().min(5, 'Motivo é obrigatório (mínimo 5 caracteres)'),
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

function daysBetween(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  return Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// ─── GET /api/frota/alertas ───────────────────────────────────────────────────

export const GET = apiHandler(null, async (req: NextRequest, _body: unknown, ctx: ApiContext) => {
  const { supabase } = ctx

  const today = new Date().toISOString().split('T')[0]
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [vehiclesResult, maintenancesResult] = await Promise.all([
    supabase
      .from('fleet_vehicles')
      .select('id, plate, brand, model, insurance_expiry, ipva_expiry, license_expiry, km_current, next_revision_km, next_revision_date, status')
      .eq('is_active', true),
    supabase
      .from('fleet_maintenances')
      .select('id, vehicle_id, maintenance_type, description, next_maintenance_date, next_maintenance_km, status, created_at, fleet_vehicles(id, plate, brand, model, km_current)')
      .in('status', ['pendente', 'em_andamento'])
      .not('next_maintenance_date', 'is', null)
      .lte('next_maintenance_date', in30Days),
  ])

  const vehicles = vehiclesResult.data ?? []
  const pendingMaintenances = maintenancesResult.data ?? []

  const alerts: Array<{
    type: string
    severity: string
    vehicle_id: string
    plate: string
    message: string
    due_date?: string | null
    due_km?: number | null
  }> = []

  for (const v of vehicles) {
    const vehicle = v as Record<string, unknown>
    const vid = vehicle.id as string
    const plate = vehicle.plate as string
    const kmCurrent = vehicle.km_current as number
    const nextRevisionKm = vehicle.next_revision_km as number | null

    // Insurance expiry
    if (vehicle.insurance_expiry) {
      const days = daysBetween(vehicle.insurance_expiry as string)
      if (days <= 30) {
        alerts.push({
          type: 'insurance_expiry',
          severity: days <= 7 ? 'critical' : days <= 14 ? 'high' : 'medium',
          vehicle_id: vid,
          plate,
          message: days < 0
            ? `Seguro de ${plate} VENCIDO há ${Math.abs(days)} dias.`
            : `Seguro de ${plate} vence em ${days} dia${days !== 1 ? 's' : ''}.`,
          due_date: vehicle.insurance_expiry as string,
        })
      }
    }

    // IPVA expiry
    if (vehicle.ipva_expiry) {
      const days = daysBetween(vehicle.ipva_expiry as string)
      if (days <= 30) {
        alerts.push({
          type: 'ipva_expiry',
          severity: days <= 7 ? 'critical' : days <= 14 ? 'high' : 'medium',
          vehicle_id: vid,
          plate,
          message: days < 0
            ? `IPVA de ${plate} VENCIDO há ${Math.abs(days)} dias.`
            : `IPVA de ${plate} vence em ${days} dia${days !== 1 ? 's' : ''}.`,
          due_date: vehicle.ipva_expiry as string,
        })
      }
    }

    // License (licenciamento) expiry
    if (vehicle.license_expiry) {
      const days = daysBetween(vehicle.license_expiry as string)
      if (days <= 30) {
        alerts.push({
          type: 'license_expiry',
          severity: days <= 7 ? 'critical' : days <= 14 ? 'high' : 'medium',
          vehicle_id: vid,
          plate,
          message: days < 0
            ? `Licenciamento de ${plate} VENCIDO há ${Math.abs(days)} dias.`
            : `Licenciamento de ${plate} vence em ${days} dia${days !== 1 ? 's' : ''}.`,
          due_date: vehicle.license_expiry as string,
        })
      }
    }

    // Revision km proximity (within 500 km)
    if (nextRevisionKm !== null && nextRevisionKm !== undefined) {
      const kmToRevision = nextRevisionKm - kmCurrent
      if (kmToRevision <= 500) {
        alerts.push({
          type: 'revision_km',
          severity: kmToRevision <= 0 ? 'critical' : kmToRevision <= 100 ? 'high' : 'medium',
          vehicle_id: vid,
          plate,
          message: kmToRevision <= 0
            ? `${plate} ultrapassou o km de revisão (${kmCurrent} / ${nextRevisionKm} km).`
            : `${plate} está a ${kmToRevision} km da próxima revisão (${nextRevisionKm} km).`,
          due_km: nextRevisionKm,
        })
      }
    }

    // Next revision date within 30 days
    if (vehicle.next_revision_date) {
      const days = daysBetween(vehicle.next_revision_date as string)
      if (days <= 30) {
        alerts.push({
          type: 'revision_date',
          severity: days <= 7 ? 'high' : 'low',
          vehicle_id: vid,
          plate,
          message: days < 0
            ? `Revisão de ${plate} estava agendada há ${Math.abs(days)} dias (atrasada).`
            : `Revisão de ${plate} agendada em ${days} dia${days !== 1 ? 's' : ''}.`,
          due_date: vehicle.next_revision_date as string,
        })
      }
    }
  }

  // Overdue pending maintenances (past next_maintenance_date)
  for (const m of pendingMaintenances) {
    const maint = m as Record<string, unknown>
    const maintDate = maint.next_maintenance_date as string | null
    if (!maintDate) continue
    const days = daysBetween(maintDate)
    if (days < 0) {
      const vehicleData = maint.fleet_vehicles as Record<string, unknown> | null
      const vPlate = vehicleData?.plate as string ?? 'veículo'
      alerts.push({
        type: 'maintenance_overdue',
        severity: Math.abs(days) >= 7 ? 'critical' : 'high',
        vehicle_id: maint.vehicle_id as string,
        plate: vPlate,
        message: `Manutenção ${maint.maintenance_type} de ${vPlate} atrasada há ${Math.abs(days)} dias.`,
        due_date: maintDate,
      })
    }
  }

  // Sort by severity: critical > high > medium > low
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  alerts.sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4))

  return NextResponse.json({ data: alerts, count: alerts.length })
}, { auth: true })

// ─── POST /api/frota/alertas — Flag a usage as suspicious ────────────────────

export const POST = apiHandler(flagUsageSchema, async (req: NextRequest, body: z.infer<typeof flagUsageSchema>, ctx: ApiContext) => {
  const { supabase, user } = ctx

  const role = await getProfileRole(supabase, user!.id)
  if (!['admin', 'owner', 'broker_manager'].includes(role)) {
    return NextResponse.json({ error: 'Acesso negado. Apenas gestores podem sinalizar usos suspeitos.' }, { status: 403 })
  }

  // Verify usage exists
  const { data: existing } = await supabase
    .from('fleet_usages')
    .select('id, is_suspicious, broker_id, vehicle_id')
    .eq('id', body.usage_id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'Uso não encontrado.' }, { status: 404 })
  }

  if (existing.is_suspicious) {
    return NextResponse.json({ error: 'Este uso já está sinalizado como suspeito.' }, { status: 409 })
  }

  const { data: updated, error } = await supabase
    .from('fleet_usages')
    .update({
      is_suspicious: true,
      suspicious_reason: body.reason,
      flagged_by: user!.id,
      flagged_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.usage_id)
    .select()
    .single()

  if (error) {
    console.error('[frota/alertas] POST flag error:', error)
    return NextResponse.json({ error: 'Erro ao sinalizar uso' }, { status: 500 })
  }

  const meta = getRequestMeta(req)
  logAudit({
    user_id: user!.id,
    action: 'frota.uso.flag_suspicious',
    entity_type: 'fleet_usage',
    entity_id: body.usage_id,
    new_data: {
      is_suspicious: true,
      suspicious_reason: body.reason,
      flagged_by: user!.id,
    },
    ...meta,
  })

  return NextResponse.json({ success: true, usage: updated })
}, { auth: true })
