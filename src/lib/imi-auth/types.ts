import type { PermissionKey, RoleKey } from './rbac'

export type ImiUserStatus = 'invited' | 'active' | 'suspended' | 'archived'

export interface ImiUser {
  id: string
  authUserId: string | null
  email: string
  fullName: string
  avatarUrl: string | null
  phone: string | null
  status: ImiUserStatus
  isSuper: boolean
  lastLoginAt: string | null
}

export interface ImiProject {
  id: string
  slug: string
  name: string
  status: string
  city: string | null
  state: string | null
}

export interface ImiRoleAssignment {
  roleKey: RoleKey
  projectId: string | null
}

/**
 * The resolved session passed through the app: the user, their roles, the
 * computed permission set, and the projects they belong to.
 */
export interface ImiSession {
  user: ImiUser
  roles: ImiRoleAssignment[]
  roleKeys: RoleKey[]
  permissions: PermissionKey[]
  projects: ImiProject[]
}
