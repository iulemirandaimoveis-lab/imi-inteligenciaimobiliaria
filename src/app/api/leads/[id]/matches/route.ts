import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * GET /api/leads/[id]/matches
 *
 * Scores developments against a lead's preferences and returns the top 10.
 *
 * Scoring weights:
 *   - Faixa de valor (budget overlap)  : 40 pts
 *   - Tipo (property type match)       : 30 pts
 *   - Localização (city/neighborhood)  : 20 pts
 *   - Quartos (bedrooms)               : 10 pts
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: leadId } = await params
        const supabase = await createClient()

        // --- Auth check ---
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // --- Load lead preferences ---
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('id, interest_type, interest_location, budget_min, budget_max, capital')
            .eq('id', leadId)
            .single()

        if (leadError || !lead) {
            return NextResponse.json(
                { error: 'Lead não encontrado' },
                { status: 404 },
            )
        }

        const leadBudgetMin = lead.budget_min ?? lead.capital ?? null
        const leadBudgetMax = lead.budget_max ?? null
        const leadType = (lead.interest_type ?? '').toLowerCase().trim()
        const leadLocation = (lead.interest_location ?? '').toLowerCase().trim()

        // --- Fetch all developments ---
        const { data: developments, error: devError } = await supabase
            .from('developments')
            .select(
                'id, name, slug, type, tipo, property_type, city, neighborhood, state, bedrooms, ' +
                'price_min, price_max, price_from, price_to, status, status_commercial, image_url, gallery_images',
            )

        if (devError) {
            console.error('Error fetching developments:', devError)
            return NextResponse.json({ error: devError.message }, { status: 500 })
        }

        // --- Type-matching helpers ---
        // Normalise the various type representations to a canonical group key.
        const TYPE_GROUPS: Record<string, string[]> = {
            apartamento: ['apartamento', 'apartment', 'flat', 'studio', 'penthouse', 'cobertura', 'loft'],
            casa: ['casa', 'house', 'villa', 'sobrado'],
            lote: ['lote', 'land', 'terreno'],
            comercial: ['comercial', 'commercial'],
            resort: ['resort'],
        }

        function normaliseType(raw: string | null | undefined): string {
            if (!raw) return ''
            const lower = raw.toLowerCase().trim()
            for (const [group, members] of Object.entries(TYPE_GROUPS)) {
                if (members.includes(lower)) return group
            }
            return lower
        }

        // --- Score each development ---
        interface ScoredMatch {
            id: string
            name: string
            slug: string | null
            type: string | null
            tipo: string | null
            city: string | null
            neighborhood: string | null
            state: string | null
            bedrooms: number | null
            price_min: number | null
            price_max: number | null
            image_url: string | null
            status: string | null
            score: number
            score_breakdown: {
                valor: number
                tipo: number
                localizacao: number
                quartos: number
            }
        }

        const scored: ScoredMatch[] = (developments ?? []).map((dev: any) => {
            let valorScore = 0
            let tipoScore = 0
            let localizacaoScore = 0
            let quartosScore = 0

            // ---- 1. Faixa de valor (40 pts) ----
            const devMin = dev.price_min ?? dev.price_from ?? null
            const devMax = dev.price_max ?? dev.price_to ?? null

            if ((devMin !== null || devMax !== null) && (leadBudgetMin !== null || leadBudgetMax !== null)) {
                const lMin = leadBudgetMin ?? 0
                const lMax = leadBudgetMax ?? Infinity
                const dMin = devMin ?? 0
                const dMax = devMax ?? Infinity

                const overlapStart = Math.max(lMin, dMin)
                const overlapEnd = Math.min(lMax, dMax)

                if (overlapStart <= overlapEnd) {
                    // Ranges overlap — compute how much of the lead range is covered
                    const leadRange = lMax === Infinity ? (dMax === Infinity ? 1 : dMax - dMin || 1) : lMax - lMin || 1
                    const overlapSize = overlapEnd - overlapStart
                    const overlapRatio = Math.min(overlapSize / Math.abs(leadRange), 1)
                    valorScore = Math.round(40 * overlapRatio)
                    // Guarantee at least partial credit for any overlap
                    if (valorScore < 10) valorScore = 10
                } else {
                    // No overlap — give partial credit if reasonably close (within 30%)
                    const gap = overlapStart - overlapEnd
                    const reference = Math.max(lMin, dMin, 1)
                    const gapRatio = gap / reference
                    if (gapRatio < 0.3) {
                        valorScore = Math.round(10 * (1 - gapRatio / 0.3))
                    }
                }
            }

            // ---- 2. Tipo (30 pts) ----
            if (leadType) {
                const normLead = normaliseType(leadType)
                const normDev = normaliseType(dev.tipo) || normaliseType(dev.type) || normaliseType(dev.property_type)
                if (normLead && normDev && normLead === normDev) {
                    tipoScore = 30
                }
            }

            // ---- 3. Localização (20 pts) ----
            if (leadLocation) {
                const devCity = (dev.city ?? '').toLowerCase().trim()
                const devNeighborhood = (dev.neighborhood ?? '').toLowerCase().trim()
                const devState = (dev.state ?? '').toLowerCase().trim()

                if (devNeighborhood && (leadLocation.includes(devNeighborhood) || devNeighborhood.includes(leadLocation))) {
                    localizacaoScore = 20
                } else if (devCity && (leadLocation.includes(devCity) || devCity.includes(leadLocation))) {
                    localizacaoScore = 15
                } else if (devState && leadLocation.includes(devState)) {
                    localizacaoScore = 5
                }
            }

            // ---- 4. Quartos (10 pts) ----
            // The leads table doesn't have a dedicated bedrooms column, but interest_type
            // may contain a reference like "apartamento 3 quartos". Try to extract it.
            const quartosMatch = (lead.interest_type ?? '').match(/(\d+)\s*(?:quartos?|dorm|suítes?|rooms?|bed)/i)
            const leadQuartos = quartosMatch ? parseInt(quartosMatch[1], 10) : null

            if (leadQuartos !== null && dev.bedrooms != null) {
                const diff = Math.abs(leadQuartos - dev.bedrooms)
                if (diff === 0) quartosScore = 10
                else if (diff === 1) quartosScore = 5
                else if (diff === 2) quartosScore = 2
            }

            const totalScore = valorScore + tipoScore + localizacaoScore + quartosScore

            return {
                id: dev.id,
                name: dev.name,
                slug: dev.slug ?? null,
                type: dev.type ?? null,
                tipo: dev.tipo ?? null,
                city: dev.city ?? null,
                neighborhood: dev.neighborhood ?? null,
                state: dev.state ?? null,
                bedrooms: dev.bedrooms ?? null,
                price_min: devMin,
                price_max: devMax,
                image_url: dev.image_url ?? dev.gallery_images?.[0] ?? null,
                status: dev.status ?? null,
                score: totalScore,
                score_breakdown: {
                    valor: valorScore,
                    tipo: tipoScore,
                    localizacao: localizacaoScore,
                    quartos: quartosScore,
                },
            }
        })

        // --- Sort by score descending and return top 10 ---
        scored.sort((a, b) => b.score - a.score)
        const top10 = scored.slice(0, 10)

        return NextResponse.json({
            lead_id: leadId,
            total_evaluated: scored.length,
            matches: top10,
        })
    } catch (error) {
        console.error('Error in GET /api/leads/[id]/matches:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 },
        )
    }
}
