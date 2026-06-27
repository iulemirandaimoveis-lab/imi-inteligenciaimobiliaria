import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { ImiSession } from '@/lib/imi-auth/types'
import type { RoleKey } from '@/lib/imi-auth/rbac'

export interface AdminUserRow {
  id: string
  email: string
  fullName: string
  status: string
  isSuper: boolean
  roleKeys: RoleKey[]
  projects: { id: string; name: string }[]
  lastLoginAt: string | null
}

export interface AdminData {
  users: AdminUserRow[]
  projects: { id: string; name: string }[]
  canManageUsers: boolean
  canManageRoles: boolean
}

/**
 * Master/Backoffice user roster: imi.users + their roles + projects.
 * RLS already restricts visibility (users.manage reads all). When the caller
 * lacks it, the list comes back limited to self and the page guards the actions.
 */
export async function getAdminData(session: ImiSession): Promise<AdminData> {
  const canManageUsers = session.user.isSuper || session.permissions.includes('users.manage' as any)
  const canManageRoles = session.user.isSuper || session.permissions.includes('permissions.manage' as any)

  const projects = session.projects.map((p) => ({ id: p.id, name: p.name }))
  const empty: AdminData = { users: [], projects, canManageUsers, canManageRoles }

  try {
    const supabase = await createClient()
    const imi = supabase.schema('imi')

    const { data: userRows, error } = await imi
      .from('users')
      .select('id, email, full_name, status, is_super, last_login_at')
      .order('full_name', { ascending: true })
      .limit(500)
    if (error || !userRows) return empty

    const userIds = userRows.map((u: any) => u.id)
    const fallback = ['00000000-0000-0000-0000-000000000000']

    const { data: roleRows } = await imi
      .from('user_roles')
      .select('user_id, roles ( key )')
      .in('user_id', userIds.length ? userIds : fallback)
    const rolesByUser = (roleRows ?? []).reduce((acc: Record<string, RoleKey[]>, r: any) => {
      const key = r.roles?.key as RoleKey | undefined
      if (key) (acc[r.user_id] ??= []).push(key)
      return acc
    }, {})

    const { data: puRows } = await imi
      .from('project_users')
      .select('user_id, projects ( id, name )')
      .in('user_id', userIds.length ? userIds : fallback)
    const projectsByUser = (puRows ?? []).reduce((acc: Record<string, { id: string; name: string }[]>, r: any) => {
      if (r.projects) (acc[r.user_id] ??= []).push({ id: r.projects.id, name: r.projects.name })
      return acc
    }, {})

    const users: AdminUserRow[] = userRows.map((u: any) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      status: u.status,
      isSuper: u.is_super,
      roleKeys: Array.from(new Set(rolesByUser[u.id] ?? [])),
      projects: projectsByUser[u.id] ?? [],
      lastLoginAt: u.last_login_at,
    }))

    return { users, projects, canManageUsers, canManageRoles }
  } catch {
    return empty
  }
}
