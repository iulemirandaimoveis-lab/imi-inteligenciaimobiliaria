import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withPartnerAuth, partnerError } from '@/lib/partner-api/auth'
import { jsonWithETag } from '@/lib/partner-api/response'
import {
    PARTNER_VISIBLE_STATUSES,
    lotCode,
    toPartnerLotStatus,
} from '@/lib/partner-api/mappers'
import { isUuid } from '@/lib/partner-api/queries'
import {
    AB_AVAILABILITY_SHEET_URL,
    parseAvailabilityCSV,
} from '@/lib/lots/alto-bellevue-availability'
import type { PartnerLotStatus } from '@/lib/partner-api/types'

export const runtime = 'nodejs'

const MAX_LOTS = 5000

/**
 * Overlay ao vivo do Alto Bellevue: a planilha comercial é a fonte editável
 * (mesma cadeia de resolução do console — planilha > banco). Falha da planilha
 * degrada graciosamente para o status do banco, nunca quebra a resposta.
 */
async function fetchAbLiveStatuses(): Promise<Record<string, string>> {
    try {
        const res = await fetch(AB_AVAILABILITY_SHEET_URL, {
            next: { revalidate: 60 },
            headers: { 'User-Agent': 'imi-partner-api' },
        })
        if (!res.ok) return {}
        return parseAvailabilityCSV(await res.text())
    } catch {
        return {}
    }
}

// ─── GET /api/v1/availability ── snapshot compacto para polling com ETag ────
export const GET = withPartnerAuth(['lots:read'], async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const developmentParam = searchParams.get('development')

    let devQuery = supabaseAdmin
        .from('developments')
        .select('id, slug, name')
        .in('status_commercial', PARTNER_VISIBLE_STATUSES)
    if (developmentParam) {
        devQuery = devQuery.eq(isUuid(developmentParam) ? 'id' : 'slug', developmentParam)
    }
    const { data: devs, error: devError } = await devQuery
    if (devError) {
        return partnerError(500, 'internal_error', 'Erro ao buscar empreendimentos.')
    }
    if (developmentParam && (!devs || devs.length === 0)) {
        return partnerError(404, 'not_found', 'Empreendimento não encontrado.')
    }

    const devIds = (devs ?? []).map((d) => d.id)
    const { data: lots, error: lotsError } = await supabaseAdmin
        .from('subdivision_lots')
        .select('id, development_id, quadra, lot_number, status')
        .in('development_id', devIds)
        .order('quadra', { ascending: true })
        .order('lot_number', { ascending: true })
        .limit(MAX_LOTS)
    if (lotsError) {
        return partnerError(500, 'internal_error', 'Erro ao buscar disponibilidade.')
    }

    const hasAb = (devs ?? []).some((d) => d.slug === 'alto-bellevue')
    const abLive = hasAb ? await fetchAbLiveStatuses() : {}

    const data = (devs ?? [])
        .map((dev) => {
            const devLots = (lots ?? []).filter((l) => l.development_id === dev.id)
            if (devLots.length === 0) return null
            const counts: Record<PartnerLotStatus, number> = {
                disponivel: 0, reservado: 0, vendido: 0, em_negociacao: 0, bloqueado: 0,
            }
            const items = devLots.map((l) => {
                const code = lotCode(l.quadra, l.lot_number)
                const liveStatus = dev.slug === 'alto-bellevue' ? abLive[code] : undefined
                const status = toPartnerLotStatus(liveStatus ?? l.status)
                counts[status] += 1
                return { id: l.id, code, status }
            })
            return {
                development_id: dev.id,
                development_slug: dev.slug,
                development_name: dev.name,
                source: dev.slug === 'alto-bellevue' && Object.keys(abLive).length > 0
                    ? 'db+live_sheet'
                    : 'db',
                counts,
                lots: items,
            }
        })
        .filter(Boolean)

    // Sem timestamp no corpo: o ETag é função só dos DADOS — polling com
    // If-None-Match recebe 304 enquanto nada mudar (o ponto deste endpoint).
    return jsonWithETag(request, { data }, { maxAge: 30 })
})
