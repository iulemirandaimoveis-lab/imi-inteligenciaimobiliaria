/**
 * IMI Auth — RBAC definitions (single source of truth, mirrors the DB seed in
 * supabase/migrations/20260626_imi_auth_ecosystem.sql).
 *
 * These constants let the frontend reason about permissions without a round
 * trip, and keep the TypeScript layer in sync with the `imi` schema.
 */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  BACKOFFICE_ADMIN: 'BACKOFFICE_ADMIN',
  TEAM_MANAGER: 'TEAM_MANAGER',
  BROKER: 'BROKER',
  PROJECT_OWNER: 'PROJECT_OWNER',
} as const

export type RoleKey = (typeof ROLES)[keyof typeof ROLES]

export const PERMISSIONS = {
  ALL: '*',
  USERS_MANAGE: 'users.manage',
  PERMISSIONS_MANAGE: 'permissions.manage',
  PROJECTS_READ: 'projects.read',
  PROJECTS_MANAGE: 'projects.manage',
  TEAMS_READ: 'teams.read',
  TEAMS_MANAGE: 'teams.manage',
  AVAILABILITY_READ: 'availability.read',
  AVAILABILITY_MANAGE: 'availability.manage',
  PROPOSALS_READ: 'proposals.read',
  PROPOSALS_MANAGE: 'proposals.manage',
  LEADS_READ: 'leads.read',
  LEADS_MANAGE: 'leads.manage',
  CLIENTS_MANAGE: 'clients.manage',
  SALES_READ: 'sales.read',
  SALES_MANAGE: 'sales.manage',
  METRICS_READ: 'metrics.read',
  CRM_MANAGE: 'crm.manage',
  AUDIT_READ: 'audit.read',
  LOGS_READ: 'logs.read',
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/** Role → permission keys. Mirrors the DB seed exactly. */
export const ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]> = {
  SUPER_ADMIN: [PERMISSIONS.ALL],
  BACKOFFICE_ADMIN: [
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.PERMISSIONS_MANAGE,
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.PROJECTS_MANAGE,
    PERMISSIONS.TEAMS_READ,
    PERMISSIONS.TEAMS_MANAGE,
    PERMISSIONS.AVAILABILITY_READ,
    PERMISSIONS.AVAILABILITY_MANAGE,
    PERMISSIONS.PROPOSALS_READ,
    PERMISSIONS.PROPOSALS_MANAGE,
    PERMISSIONS.LEADS_READ,
    PERMISSIONS.LEADS_MANAGE,
    PERMISSIONS.CLIENTS_MANAGE,
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_MANAGE,
    PERMISSIONS.METRICS_READ,
    PERMISSIONS.CRM_MANAGE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.LOGS_READ,
  ],
  TEAM_MANAGER: [
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.TEAMS_READ,
    PERMISSIONS.TEAMS_MANAGE,
    PERMISSIONS.AVAILABILITY_READ,
    PERMISSIONS.PROPOSALS_READ,
    PERMISSIONS.PROPOSALS_MANAGE,
    PERMISSIONS.LEADS_READ,
    PERMISSIONS.LEADS_MANAGE,
    PERMISSIONS.CLIENTS_MANAGE,
    PERMISSIONS.SALES_READ,
    PERMISSIONS.METRICS_READ,
  ],
  BROKER: [
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.AVAILABILITY_READ,
    PERMISSIONS.PROPOSALS_READ,
    PERMISSIONS.PROPOSALS_MANAGE,
    PERMISSIONS.LEADS_READ,
    PERMISSIONS.LEADS_MANAGE,
    PERMISSIONS.CLIENTS_MANAGE,
    PERMISSIONS.SALES_READ,
  ],
  PROJECT_OWNER: [
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.TEAMS_READ,
    PERMISSIONS.AVAILABILITY_READ,
    PERMISSIONS.PROPOSALS_READ,
    PERMISSIONS.SALES_READ,
    PERMISSIONS.METRICS_READ,
  ],
}

export const ROLE_LABELS: Record<RoleKey, string> = {
  SUPER_ADMIN: 'Super Administrador',
  BACKOFFICE_ADMIN: 'Backoffice Admin',
  TEAM_MANAGER: 'Gerente de Equipe',
  BROKER: 'Corretor',
  PROJECT_OWNER: 'Proprietário do Produto',
}

/**
 * Pure permission check against a set of role keys (client-side convenience).
 * The authoritative check is the DB function imi.has_permission() enforced via
 * RLS — this mirror is for conditional UI only.
 */
export function roleSetHasPermission(roleKeys: RoleKey[], permission: PermissionKey): boolean {
  return roleKeys.some((role) => {
    const perms = ROLE_PERMISSIONS[role] ?? []
    return perms.includes(PERMISSIONS.ALL) || perms.includes(permission)
  })
}

/** All effective permissions for a set of roles. */
export function effectivePermissions(roleKeys: RoleKey[]): PermissionKey[] {
  const set = new Set<PermissionKey>()
  for (const role of roleKeys) {
    for (const p of ROLE_PERMISSIONS[role] ?? []) set.add(p)
  }
  return Array.from(set)
}
