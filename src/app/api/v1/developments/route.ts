import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withPartnerAuth, partnerError } from '@/lib/partner-api/auth'
import { jsonWithETag } from '@/lib/partner-api/response'
import {
    PARTNER_DEV_SELECT,
    PARTNER_VISIBLE_STATUSES,
    toPartnerDevelopment,
} from '@/lib/partner-api/mappers'

export const runtime = 'nodejs'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

function encodeCursor(createdAt: string, id: string): string {
    return Buffer.from(`${createdAt}|${id}`).toString('base64url')
}

function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
    try {
        const [createdAt, id] = Buffer.from(cursor, 'base64url').toString().split('|')
        if (!createdAt || !id) return null
        return { createdAt, id }
    } catch {
        return null
    }
}

// ─── GET /api/v1/developments ── lista paginada por cursor ──────────────────
export const GET = withPartnerAuth(['developments:read'], async (request: NextRequest, partner) => {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(
        Math.max(parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
        MAX_LIMIT,
    )

    let query = supabaseAdmin
        .from('developments')
        .select(PARTNER_DEV_SELECT)
        .in('status_commercial', PARTNER_VISIBLE_STATUSES)

    const rawCursor = searchParams.get('cursor')
    if (rawCursor) {
        const cursor = decodeCursor(rawCursor)
        if (!cursor) return partnerError(400, 'invalid_cursor', 'Cursor de paginação inválido.')
        // Keyset: (created_at, id) estritamente menor que o cursor
        query = query.or(
            `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
        )
    }

    const { data, error } = await query
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit)
    if (error) {
        return partnerError(500, 'internal_error', 'Erro ao listar empreendimentos.')
    }

    const includePrices = partner.scopes.includes('prices:read')
    // Select dinâmico → supabase-js não infere o shape; o mapper é quem tipa a saída.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = data ?? []
    const last = rows.length === limit ? rows[rows.length - 1] : null

    return jsonWithETag(request, {
        data: rows.map((row) => toPartnerDevelopment(row, { includePrices })),
        pagination: {
            limit,
            next_cursor: last ? encodeCursor(last.created_at, last.id) : null,
        },
    })
})
