import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getImiSession, sessionHasPermission } from '@/lib/imi-auth/server'
import { PERMISSIONS, ROLES } from '@/lib/imi-auth/rbac'
import { logActivity } from '@/lib/imi-auth/audit'

export const dynamic = 'force-dynamic'

const Schema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('add_role'),
    role_key: z.enum(['SUPER_ADMIN', 'BACKOFFICE_ADMIN', 'TEAM_MANAGER', 'BROKER', 'PROJECT_OWNER']),
    project_id: z.string().uuid().nullish(),
  }),
  z.object({
    action: z.literal('remove_role'),
    role_key: z.enum(['SUPER_ADMIN', 'BACKOFFICE_ADMIN', 'TEAM_MANAGER', 'BROKER', 'PROJECT_OWNER']),
    project_id: z.string().uuid().nullish(),
  }),
  z.object({
    action: z.literal('set_status'),
    status: z.enum(['active', 'suspended', 'archived']),
  }),
])

/**
 * PATCH /api/users/admin/users/[id]
 *   • add_role / remove_role → permissions.manage (multi-role por usuário)
 *   • set_status             → users.manage (suspender / reativar / arquivar)
 * RLS reforça as mesmas regras nas tabelas imi.user_roles / imi.users.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getImiSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const parsed = Schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
    }
    const body = parsed.data
    const supabase = await createClient()
    const imi = supabase.schema('imi')

    if (body.action === 'set_status') {
      if (!(session.user.isSuper || sessionHasPermission(session, PERMISSIONS.USERS_MANAGE))) {
        return NextResponse.json({ error: 'Sem permissão para alterar o status.' }, { status: 403 })
      }
      if (params.id === session.user.id && body.status !== 'active') {
        return NextResponse.json({ error: 'Você não pode suspender o próprio acesso.' }, { status: 400 })
      }
      const { error } = await imi.from('users').update({ status: body.status }).eq('id', params.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      await logActivity({ userId: session.user.id, action: 'user.set_status', entity: 'user', entityId: params.id, metadata: { status: body.status } })
      return NextResponse.json({ success: true })
    }

    // Role mutations → permissions.manage.
    if (!(session.user.isSuper || sessionHasPermission(session, PERMISSIONS.PERMISSIONS_MANAGE))) {
      return NextResponse.json({ error: 'Sem permissão para gerir papéis.' }, { status: 403 })
    }
    // Only a super admin may grant/revoke SUPER_ADMIN.
    if (body.role_key === ROLES.SUPER_ADMIN && !session.user.isSuper) {
      return NextResponse.json({ error: 'Apenas um Super Admin pode atribuir esse papel.' }, { status: 403 })
    }

    const { data: role } = await imi.from('roles').select('id').eq('key', body.role_key).maybeSingle()
    if (!role) return NextResponse.json({ error: 'Papel inexistente.' }, { status: 400 })
    const projectId = body.project_id ?? null

    if (body.action === 'add_role') {
      const payload: any = { user_id: params.id, role_id: role.id, project_id: projectId, granted_by: session.user.id }
      const { error } = await imi.from('user_roles').upsert(payload, { onConflict: 'user_id,role_id,project_id' })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      let del = imi.from('user_roles').delete().eq('user_id', params.id).eq('role_id', role.id)
      del = projectId ? del.eq('project_id', projectId) : del.is('project_id', null)
      const { error } = await del
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logActivity({
      userId: session.user.id,
      projectId,
      action: `user.${body.action}`,
      entity: 'user',
      entityId: params.id,
      metadata: { role: body.role_key },
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro interno.' }, { status: 500 })
  }
}
