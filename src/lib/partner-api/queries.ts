/**
 * Partner API v1 — consultas curadas (server-only).
 *
 * Todas usam `supabaseAdmin` APÓS a chave ter sido validada por
 * `withPartnerAuth` (contrato P15: credencial provada antes do service role).
 * Somente empreendimentos com status_commercial publicável são visíveis.
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { PARTNER_DEV_SELECT, PARTNER_VISIBLE_STATUSES } from './mappers'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
    return UUID_RE.test(value)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

/** Busca um empreendimento visível por UUID ou slug. */
export async function fetchVisibleDevelopment(idOrSlug: string): Promise<Row | null> {
    const column = isUuid(idOrSlug) ? 'id' : 'slug'
    const { data, error } = await supabaseAdmin
        .from('developments')
        .select(PARTNER_DEV_SELECT)
        .eq(column, idOrSlug)
        .in('status_commercial', PARTNER_VISIBLE_STATUSES)
        .maybeSingle()
    if (error) throw new Error(`developments lookup failed: ${error.message}`)
    return data
}
