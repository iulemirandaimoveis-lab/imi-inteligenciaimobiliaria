import 'server-only'
import { createClient } from '@/lib/supabase/server'

export interface AuditEntry {
  userId?: string | null
  projectId?: string | null
  action: string
  entity?: string
  entityId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string | null
  userAgent?: string | null
}

/**
 * Append an entry to imi.activity_logs. Best-effort: never throws into the
 * request path (auditing must not break the user action).
 */
export async function logActivity(entry: AuditEntry): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.schema('imi').from('activity_logs').insert({
      user_id: entry.userId ?? null,
      project_id: entry.projectId ?? null,
      action: entry.action,
      entity: entry.entity ?? null,
      entity_id: entry.entityId ?? null,
      metadata: entry.metadata ?? {},
      ip_address: entry.ipAddress ?? null,
      user_agent: entry.userAgent ?? null,
    })
  } catch {
    // swallow — auditing is best-effort
  }
}
