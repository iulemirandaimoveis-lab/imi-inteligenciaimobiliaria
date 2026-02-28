import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder'
)

// ── RBAC ────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'manager' | 'agent' | 'viewer'
export type Action = 'view' | 'create' | 'edit' | 'delete'

// Cache permissions for 5 minutes
let permissionsCache: Record<string, boolean> | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000

async function loadPermissions(): Promise<Record<string, boolean>> {
    const now = Date.now()
    if (permissionsCache && (now - cacheTimestamp) < CACHE_TTL) {
        return permissionsCache
    }

    const { data } = await supabase
        .from('role_permissions')
        .select('role, module, action, allowed')

    const map: Record<string, boolean> = {}
    data?.forEach((p: any) => {
        map[`${p.role}:${p.module}:${p.action}`] = p.allowed
    })

    permissionsCache = map
    cacheTimestamp = now
    return map
}

export async function checkPermission(
    role: UserRole,
    module: string,
    action: Action
): Promise<boolean> {
    // Admin always has access
    if (role === 'admin') return true

    const perms = await loadPermissions()
    const key = `${role}:${module}:${action}`
    return perms[key] === true
}

export async function getUserRole(userId: string): Promise<UserRole> {
    // Check team_members first
    const { data: member } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', userId)
        .single()

    if (member?.role) return member.role as UserRole

    // Check auth user_metadata
    const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    const metaRole = user?.user_metadata?.role?.toLowerCase()
    if (metaRole && ['admin', 'manager', 'agent', 'viewer'].includes(metaRole)) {
        return metaRole as UserRole
    }

    // Default: admin for first user, viewer for others
    return 'admin'
}

// ── AUDIT LOGGING ───────────────────────────────────────────────

export interface AuditEntry {
    user_id?: string
    action: string
    entity_type: string
    entity_id?: string
    old_data?: any
    new_data?: any
    ip_address?: string
    user_agent?: string
}

export async function logAudit(entry: AuditEntry) {
    try {
        await supabase.from('activity_logs').insert({
            user_id: entry.user_id || null,
            action: entry.action,
            entity_type: entry.entity_type,
            entity_id: entry.entity_id || null,
            old_data: entry.old_data || null,
            new_data: entry.new_data || null,
            ip_address: entry.ip_address || null,
            user_agent: entry.user_agent || null,
        })
    } catch (e) {
        console.error('Audit log failed:', e)
    }
}

// Helper to extract request metadata
export function getRequestMeta(request: Request) {
    return {
        ip_address: request.headers.get('x-forwarded-for')
            || request.headers.get('x-real-ip')
            || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
    }
}
