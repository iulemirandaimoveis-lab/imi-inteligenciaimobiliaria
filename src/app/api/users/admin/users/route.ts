import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getImiSession, sessionHasPermission } from '@/lib/imi-auth/server'
import { PERMISSIONS, ROLES, type RoleKey } from '@/lib/imi-auth/rbac'
import { logActivity } from '@/lib/imi-auth/audit'

export const dynamic = 'force-dynamic'

const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

const Schema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  role_keys: z.array(z.enum(['SUPER_ADMIN', 'BACKOFFICE_ADMIN', 'TEAM_MANAGER', 'BROKER', 'PROJECT_OWNER'])).default(['BROKER']),
  project_id: z.string().uuid().nullish(),
})

const RELATION_BY_ROLE: Partial<Record<RoleKey, string>> = {
  [ROLES.TEAM_MANAGER]: 'manager',
  [ROLES.PROJECT_OWNER]: 'owner',
  [ROLES.BROKER]: 'broker',
}

/**
 * POST /api/users/admin/users — Master cria um usuário do ecossistema IMI.
 * Cria auth.users (senha provisória) + imi.users (invited) + papéis + vínculo
 * de projeto. Gate: users.manage + service role. RLS reforça as escritas no imi.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getImiSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    if (!(session.user.isSuper || sessionHasPermission(session, PERMISSIONS.USERS_MANAGE))) {
      return NextResponse.json({ error: 'Apenas o Master pode criar usuários.' }, { status: 403 })
    }
    if (!hasServiceKey) {
      return NextResponse.json({ error: 'Criação de usuários requer SUPABASE_SERVICE_ROLE_KEY.' }, { status: 500 })
    }

    const parsed = Schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
    }
    const email = parsed.data.email.trim().toLowerCase()
    const { full_name, role_keys, project_id } = parsed.data

    // Non-super callers cannot mint SUPER_ADMIN.
    const roleKeys = session.user.isSuper ? role_keys : role_keys.filter((r) => r !== ROLES.SUPER_ADMIN)
    if (project_id && !session.projects.some((p) => p.id === project_id)) {
      return NextResponse.json({ error: 'Empreendimento inválido para este usuário.' }, { status: 403 })
    }

    const imiAdmin = supabaseAdmin.schema('imi')

    // Already exists?
    const { data: existing } = await imiAdmin.from('users').select('id').eq('email', email).maybeSingle()
    if (existing) {
      return NextResponse.json({ error: `Já existe um usuário com o e-mail ${email}.` }, { status: 409 })
    }

    // 1. Auth user with a provisional password (first-access flow sets the real one).
    const provisional = `Imi#${randomBytes(6).toString('hex')}`
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: provisional,
      email_confirm: true,
      user_metadata: { name: full_name, needs_password_setup: true },
    })
    if (createErr || !created?.user) {
      const msg = createErr?.message ?? ''
      if (msg.includes('already')) return NextResponse.json({ error: `O e-mail ${email} já está registrado na autenticação.` }, { status: 409 })
      return NextResponse.json({ error: `Falha ao criar usuário: ${msg}` }, { status: 500 })
    }
    const authUserId = created.user.id

    // 2. imi.users row.
    const { data: imiUser, error: imiErr } = await imiAdmin
      .from('users')
      .insert({ auth_user_id: authUserId, email, full_name, status: 'invited', metadata: { needs_password_setup: true } })
      .select('id')
      .single()
    if (imiErr || !imiUser) {
      // Roll back the auth user to avoid orphans.
      await supabaseAdmin.auth.admin.deleteUser(authUserId).catch(() => {})
      return NextResponse.json({ error: `Falha ao criar registro IMI: ${imiErr?.message ?? ''}` }, { status: 500 })
    }
    const imiUserId = imiUser.id

    // 3. Roles.
    if (roleKeys.length) {
      const { data: roleRows } = await imiAdmin.from('roles').select('id, key').in('key', roleKeys)
      const assignments = (roleRows ?? []).map((r: any) => ({
        user_id: imiUserId,
        role_id: r.id,
        project_id: project_id ?? null,
        granted_by: session.user.id,
      }))
      if (assignments.length) await imiAdmin.from('user_roles').insert(assignments)
    }

    // 4. Project membership.
    if (project_id) {
      const relation = roleKeys.map((r) => RELATION_BY_ROLE[r]).find(Boolean) ?? 'member'
      await imiAdmin.from('project_users').insert({ project_id, user_id: imiUserId, relation })
    }

    await logActivity({
      userId: session.user.id,
      projectId: project_id ?? null,
      action: 'user.create',
      entity: 'user',
      entityId: imiUserId,
      metadata: { email, roles: roleKeys },
    })

    return NextResponse.json({
      success: true,
      user: { id: imiUserId, email, full_name },
      provisional_password: provisional,
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro interno.' }, { status: 500 })
  }
}
