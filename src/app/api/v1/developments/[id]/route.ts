import { NextRequest } from 'next/server'
import { withPartnerAuth, partnerError } from '@/lib/partner-api/auth'
import { jsonWithETag } from '@/lib/partner-api/response'
import { toPartnerDevelopment } from '@/lib/partner-api/mappers'
import { fetchVisibleDevelopment } from '@/lib/partner-api/queries'

export const runtime = 'nodejs'

// ─── GET /api/v1/developments/{id} ── detalhe por UUID ou slug ──────────────
export const GET = withPartnerAuth(
    ['developments:read'],
    async (request: NextRequest, partner, { params }) => {
        let row
        try {
            row = await fetchVisibleDevelopment(params.id)
        } catch {
            return partnerError(500, 'internal_error', 'Erro ao buscar empreendimento.')
        }
        if (!row) {
            return partnerError(404, 'not_found', 'Empreendimento não encontrado.')
        }
        const includePrices = partner.scopes.includes('prices:read')
        return jsonWithETag(request, { data: toPartnerDevelopment(row, { includePrices }) })
    },
)
