import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { effectivePermissions, type PermissionKey, type RoleKey } from './rbac'
import type { ImiProject, ImiRoleAssignment, ImiSession, ImiUser } from './types'

/**
 * Resolve the full IMI session for the currently authenticated request.
 *
 * Returns `null` when there is no Supabase auth user, when the user has no
 * `imi.users` record yet, or when the `imi` schema has not been migrated (the
 * query fails gracefully so production routes never hard-crash).
 */
export async function getImiSession(): Promise<ImiSession | null> {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return null

  const imi = supabase.schema('imi')

  // 1. Resolve the imi.users row for this auth user.
  const { data: userRow, error: userErr } = await imi
    .from('users')
    .select('id, auth_user_id, email, full_name, avatar_url, phone, status, is_super, last_login_at')
    .eq('auth_user_id', authUser.id)
    .maybeSingle()

  if (userErr || !userRow) {
    // Surface *why* the session could not be resolved instead of failing
    // silently. A PostgREST schema error here (e.g. the `imi` schema not being
    // exposed to the Data API) returns null for every user and is the classic
    // cause of the /users/login ↔ /users/dashboard redirect loop.
    if (userErr) {
      console.error(
        '[imi-auth] failed to resolve imi.users for auth user',
        authUser.id,
        userErr.code ?? '',
        userErr.message ?? userErr
      )
    }
    return null
  }

  const user: ImiUser = {
    id: userRow.id,
    authUserId: userRow.auth_user_id,
    email: userRow.email,
    fullName: userRow.full_name,
    avatarUrl: userRow.avatar_url,
    phone: userRow.phone,
    status: userRow.status,
    isSuper: userRow.is_super,
    lastLoginAt: userRow.last_login_at,
  }

  // 2. Roles (with role key + optional project scope).
  const { data: roleRows } = await imi
    .from('user_roles')
    .select('project_id, roles ( key )')
    .eq('user_id', user.id)

  const roles: ImiRoleAssignment[] = (roleRows ?? []).map((r: any) => ({
    roleKey: r.roles?.key as RoleKey,
    projectId: r.project_id,
  })).filter((r: ImiRoleAssignment) => Boolean(r.roleKey))

  const roleKeys = Array.from(new Set(roles.map((r) => r.roleKey)))

  // Super users implicitly hold every permission.
  const permissions: PermissionKey[] = user.isSuper
    ? (['*'] as PermissionKey[])
    : effectivePermissions(roleKeys)

  // 3. Projects the user belongs to.
  const { data: projectRows } = await imi
    .from('project_users')
    .select('projects ( id, slug, name, status, city, state )')
    .eq('user_id', user.id)

  const projects: ImiProject[] = (projectRows ?? [])
    .map((row: any) => row.projects)
    .filter(Boolean)
    .map((p: any) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      status: p.status,
      city: p.city,
      state: p.state,
    }))

  return { user, roles, roleKeys, permissions, projects }
}

/** True if the session grants `permission` (wildcard-aware). */
export function sessionHasPermission(session: ImiSession | null, permission: PermissionKey): boolean {
  if (!session) return false
  return session.permissions.includes('*') || session.permissions.includes(permission)
}

/**
 * Require an authenticated IMI session. Redirects to /users/login when absent.
 * Use at the top of protected server components / route handlers.
 */
export async function requireImiSession(redirectTo = '/users/login?reauth=1'): Promise<ImiSession> {
  const session = await getImiSession()
  if (!session) {
    redirect(redirectTo)
  }
  return session
}

/**
 * Require a specific permission. Redirects to /users/login when unauthenticated
 * and to /users/dashboard (with a denied flag) when authenticated but lacking
 * the permission.
 */
export async function requirePermission(permission: PermissionKey): Promise<ImiSession> {
  const session = await requireImiSession()
  if (!sessionHasPermission(session, permission)) {
    redirect('/users/dashboard?denied=1')
  }
  return session
}
