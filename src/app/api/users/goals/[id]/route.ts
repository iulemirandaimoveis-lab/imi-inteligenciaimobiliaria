import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getImiSession, sessionHasPermission } from '@/lib/imi-auth/server'
import { PERMISSIONS } from '@/lib/imi-auth/rbac'
import { logActivity } from '@/lib/imi-auth/audit'

export const dynamic = 'force-dynamic'

const PatchSchema = z.object({
  title: z.string().max(160).nullish(),
  target_amount: z.number().nonnegative().optional(),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

function canManage(session: NonNullable<Awaited<ReturnType<typeof getImiSession>>>) {
  return session.user.isSuper || sessionHasPermission(session, PERMISSIONS.TEAMS_MANAGE)
}

/** PATCH /api/users/goals/[id] — Gestor edita a meta. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getImiSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    if (!canManage(session)) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

    const parsed = PatchSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
    }
    const patch: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(parsed.data)) if (v !== undefined) patch[k] = v
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.schema('imi').from('goals').update(patch).eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logActivity({
      userId: session.user.id,
      action: 'goal.update',
      entity: 'goal',
      entityId: params.id,
      metadata: patch,
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro interno.' }, { status: 500 })
  }
}

/** DELETE /api/users/goals/[id] — Gestor remove a meta (e limpeza de mock). */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getImiSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    if (!canManage(session)) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

    const supabase = await createClient()
    const { error } = await supabase.schema('imi').from('goals').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logActivity({
      userId: session.user.id,
      action: 'goal.delete',
      entity: 'goal',
      entityId: params.id,
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro interno.' }, { status: 500 })
  }
}
