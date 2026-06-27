import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getImiSession, sessionHasPermission } from '@/lib/imi-auth/server'
import { PERMISSIONS } from '@/lib/imi-auth/rbac'
import { logActivity } from '@/lib/imi-auth/audit'

export const dynamic = 'force-dynamic'

const Schema = z
  .object({
    project_id: z.string().uuid(),
    scope: z.enum(['team', 'individual']),
    team_id: z.string().uuid().nullish(),
    user_id: z.string().uuid().nullish(),
    title: z.string().max(160).optional(),
    period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    target_amount: z.number().nonnegative(),
    mock: z.boolean().default(false),
  })
  .refine((d) => (d.scope === 'team' ? !!d.team_id : !!d.user_id), {
    message: 'Meta de equipe exige team_id; meta individual exige user_id.',
  })
  .refine((d) => d.period_start <= d.period_end, { message: 'Período inválido.' })

function canManage(session: NonNullable<Awaited<ReturnType<typeof getImiSession>>>) {
  return session.user.isSuper || sessionHasPermission(session, PERMISSIONS.TEAMS_MANAGE)
}

/** POST /api/users/goals — Gestor cria meta de equipe ou individual. */
export async function POST(req: NextRequest) {
  try {
    const session = await getImiSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    if (!canManage(session)) {
      return NextResponse.json({ error: 'Apenas o gestor pode definir metas.' }, { status: 403 })
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
    const { data: inserted, error } = await supabase
      .schema('imi')
      .from('goals')
      .insert({
        project_id: d.project_id,
        scope: d.scope,
        team_id: d.scope === 'team' ? d.team_id : null,
        user_id: d.scope === 'individual' ? d.user_id : null,
        title: d.title ?? null,
        period_start: d.period_start,
        period_end: d.period_end,
        target_amount: d.target_amount,
        mock: d.mock,
        created_by: session.user.id,
      })
      .select('id')
      .single()

    if (error || !inserted) {
      return NextResponse.json({ error: error?.message ?? 'Falha ao criar meta.' }, { status: 500 })
    }

    await logActivity({
      userId: session.user.id,
      projectId: d.project_id,
      action: 'goal.create',
      entity: 'goal',
      entityId: inserted.id,
      metadata: { scope: d.scope, target: d.target_amount },
    })

    return NextResponse.json({ success: true, id: inserted.id })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro interno.' }, { status: 500 })
  }
}
