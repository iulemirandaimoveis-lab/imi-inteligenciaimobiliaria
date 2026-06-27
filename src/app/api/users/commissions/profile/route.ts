import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getImiSession, sessionHasPermission } from '@/lib/imi-auth/server'
import { PERMISSIONS } from '@/lib/imi-auth/rbac'
import { logActivity } from '@/lib/imi-auth/audit'

export const dynamic = 'force-dynamic'

const Schema = z.object({
  user_id: z.string().uuid(),
  project_id: z.string().uuid(),
  broker_rate: z.number().min(0).max(100).nullish(),
  bonus_rate: z.number().min(0).max(100).nullish(),
  target_amount: z.number().nonnegative().nullish(),
})

/**
 * PATCH /api/users/commissions/profile — Gestor define o perfil de comissão de
 * um corretor (percentual, bônus, meta) por empreendimento. Upsert idempotente
 * sobre a UNIQUE (user_id, project_id). Gate: commissions.manage. RLS reforça.
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getImiSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    if (!(session.user.isSuper || sessionHasPermission(session, PERMISSIONS.COMMISSIONS_MANAGE))) {
      return NextResponse.json({ error: 'Sem permissão para gerir comissões.' }, { status: 403 })
    }

    const parsed = Schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
    }
    const d = parsed.data
    if (!session.projects.some((p) => p.id === d.project_id)) {
      return NextResponse.json({ error: 'Empreendimento inválido para este usuário.' }, { status: 403 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .schema('imi')
      .from('commission_profiles')
      .upsert(
        {
          user_id: d.user_id,
          project_id: d.project_id,
          broker_rate: d.broker_rate ?? null,
          bonus_rate: d.bonus_rate ?? null,
          target_amount: d.target_amount ?? null,
          active: true,
        },
        { onConflict: 'user_id,project_id' }
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logActivity({
      userId: session.user.id,
      projectId: d.project_id,
      action: 'commission.profile_set',
      entity: 'commission_profile',
      metadata: { user_id: d.user_id, broker_rate: d.broker_rate, target: d.target_amount },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro interno.' }, { status: 500 })
  }
}
