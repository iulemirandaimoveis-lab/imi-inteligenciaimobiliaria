import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withPartnerAuth, partnerError } from '@/lib/partner-api/auth'
import { jsonWithETag } from '@/lib/partner-api/response'
import { PARTNER_LOT_SELECT, toPartnerLot } from '@/lib/partner-api/mappers'
import { isUuid } from '@/lib/partner-api/queries'

export const runtime = 'nodejs'

// ─── GET /api/v1/lots/{id} ── detalhe de lote por UUID ──────────────────────
export const GET = withPartnerAuth(['lots:read'], async (request: NextRequest, partner, { params }) => {
    if (!isUuid(params.id)) {
        return partnerError(400, 'invalid_id', 'Informe o UUID do lote.')
    }

    const { data, error } = await supabaseAdmin
        .from('subdivision_lots')
        .select(PARTNER_LOT_SELECT)
        .eq('id', params.id)
        .maybeSingle()
    if (error) {
        return partnerError(500, 'internal_error', 'Erro ao buscar lote.')
    }
    if (!data) return partnerError(404, 'not_found', 'Lote não encontrado.')

    const includePrices = partner.scopes.includes('prices:read')
    return jsonWithETag(request, { data: toPartnerLot(data, { includePrices }) })
})
