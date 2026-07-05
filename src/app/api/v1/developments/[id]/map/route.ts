import { NextRequest } from 'next/server'
import { withPartnerAuth, partnerError } from '@/lib/partner-api/auth'
import { jsonWithETag } from '@/lib/partner-api/response'
import { MAP_ENABLED_SLUGS } from '@/lib/partner-api/mappers'
import { fetchVisibleDevelopment } from '@/lib/partner-api/queries'
import { buildAltoBellevueMap } from '@/lib/partner-api/ab-map'

export const runtime = 'nodejs'

// ─── GET /api/v1/developments/{id}/map ── GeoJSON WGS84 por camadas ─────────
export const GET = withPartnerAuth(['maps:read'], async (request: NextRequest, _partner, { params }) => {
    let dev
    try {
        dev = await fetchVisibleDevelopment(params.id)
    } catch {
        return partnerError(500, 'internal_error', 'Erro ao buscar empreendimento.')
    }
    if (!dev) return partnerError(404, 'not_found', 'Empreendimento não encontrado.')

    if (!MAP_ENABLED_SLUGS.has(dev.slug)) {
        return partnerError(
            404,
            'map_not_available',
            'Este empreendimento ainda não possui módulo cartográfico na API. Use /api/v1/developments/{id}/lots para o inventário.',
        )
    }

    // Geometria é estática por versão do mapa canônico — cache mais longo.
    const map = buildAltoBellevueMap()
    return jsonWithETag(request, { data: { development_id: dev.id, ...map } }, { maxAge: 3600 })
})
