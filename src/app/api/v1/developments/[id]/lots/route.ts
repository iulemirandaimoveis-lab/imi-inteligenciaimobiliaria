import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withPartnerAuth, partnerError } from '@/lib/partner-api/auth'
import { jsonWithETag } from '@/lib/partner-api/response'
import { PARTNER_LOT_SELECT, toPartnerLot } from '@/lib/partner-api/mappers'
import { fetchVisibleDevelopment } from '@/lib/partner-api/queries'

export const runtime = 'nodejs'

// Loteamentos reais têm até ~1k lotes — resposta única, sem paginação em v1.
const MAX_LOTS = 2000

const VALID_STATUS_FILTERS = new Set([
    'disponivel', 'reservado', 'vendido', 'em_negociacao', 'bloqueado',
])

// ─── GET /api/v1/developments/{id}/lots ─────────────────────────────────────
export const GET = withPartnerAuth(['lots:read'], async (request: NextRequest, partner, { params }) => {
    let dev
    try {
        dev = await fetchVisibleDevelopment(params.id)
    } catch {
        return partnerError(500, 'internal_error', 'Erro ao buscar empreendimento.')
    }
    if (!dev) return partnerError(404, 'not_found', 'Empreendimento não encontrado.')

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    if (statusFilter && !VALID_STATUS_FILTERS.has(statusFilter)) {
        return partnerError(
            400,
            'invalid_status',
            `Status inválido. Valores: ${Array.from(VALID_STATUS_FILTERS).join(', ')}`,
        )
    }

    const { data, error } = await supabaseAdmin
        .from('subdivision_lots')
        .select(PARTNER_LOT_SELECT)
        .eq('development_id', dev.id)
        .order('quadra', { ascending: true })
        .order('lot_number', { ascending: true })
        .limit(MAX_LOTS)
    if (error) {
        return partnerError(500, 'internal_error', 'Erro ao listar lotes.')
    }

    const includePrices = partner.scopes.includes('prices:read')
    let lots = (data ?? []).map((row) => toPartnerLot(row, { includePrices }))
    if (statusFilter) {
        lots = lots.filter((lot) => lot.status === statusFilter)
    }

    return jsonWithETag(request, {
        data: lots,
        meta: { development_id: dev.id, development_slug: dev.slug, total: lots.length },
    })
})
