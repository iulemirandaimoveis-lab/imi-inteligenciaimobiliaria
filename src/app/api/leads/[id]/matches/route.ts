import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Score weights
const W = {
    price: 40,
    type: 30,
    location: 20,
    bedrooms: 10,
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params

        // Fetch lead data
        const { data: lead, error: leadError } = await supabaseAdmin
            .from('leads')
            .select('id, name, budget_min, budget_max, interest_type, city, state, bedrooms, interest')
            .eq('id', id)
            .single()

        if (leadError || !lead) {
            return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
        }

        // Fetch available developments/units
        const { data: developments } = await supabaseAdmin
            .from('developments')
            .select('*')
            .in('status', ['em_construcao', 'pronto', 'lancamento'])
            .limit(100)

        if (!developments || developments.length === 0) {
            return NextResponse.json({ matches: [] })
        }

        const budgetMin = lead.budget_min ?? 0
        const budgetMax = lead.budget_max ?? Infinity
        const interestType = lead.interest_type?.toLowerCase() ?? ''

        const scored = developments.map((dev) => {
            let score = 0
            const reasons: string[] = []

            // 1. Price match (40pts)
            const devMin = dev.min_price ?? 0
            const devMax = dev.max_price ?? Infinity
            if (budgetMin > 0 || budgetMax < Infinity) {
                const overlap = devMax >= budgetMin && devMin <= budgetMax
                if (overlap) {
                    score += W.price
                    reasons.push('Faixa de preço compatível')
                } else {
                    // Partial credit if close (within 20%)
                    const gap = devMin > budgetMax ? devMin - budgetMax : budgetMin - devMax
                    const ref = budgetMax > 0 ? budgetMax : budgetMin
                    if (ref > 0 && gap / ref < 0.2) {
                        score += Math.round(W.price * 0.4)
                        reasons.push('Preço próximo ao orçamento')
                    }
                }
            } else {
                // No budget filter — partial credit
                score += Math.round(W.price * 0.5)
            }

            // 2. Type match (30pts)
            const devType = dev.type?.toLowerCase() ?? ''
            if (interestType && devType) {
                if (
                    devType === interestType ||
                    (interestType.includes('apartamento') && devType.includes('apartamento')) ||
                    (interestType.includes('casa') && devType.includes('casa')) ||
                    (interestType.includes('comercial') && devType.includes('comercial'))
                ) {
                    score += W.type
                    reasons.push('Tipo de imóvel compatível')
                } else if (interestType && devType && interestType !== devType) {
                    // No match
                } else {
                    score += Math.round(W.type * 0.3)
                }
            } else {
                score += Math.round(W.type * 0.5)
            }

            // 3. Location match (20pts)
            if (lead.city && dev.city) {
                if (dev.city.toLowerCase() === lead.city.toLowerCase()) {
                    score += W.location
                    reasons.push(`Localizado em ${dev.city}`)
                } else if (lead.state && dev.state && dev.state.toLowerCase() === lead.state.toLowerCase()) {
                    score += Math.round(W.location * 0.5)
                    reasons.push('Mesmo estado')
                }
            } else {
                score += Math.round(W.location * 0.3)
            }

            // 4. Bedrooms match (10pts)
            if (lead.bedrooms && dev.bedrooms_options) {
                const opts = Array.isArray(dev.bedrooms_options) ? dev.bedrooms_options : []
                if (opts.includes(lead.bedrooms) || opts.includes(String(lead.bedrooms))) {
                    score += W.bedrooms
                    reasons.push(`${lead.bedrooms} quartos disponível`)
                }
            } else {
                score += Math.round(W.bedrooms * 0.5)
            }

            return { ...dev, match_score: Math.min(score, 100), match_reasons: reasons }
        })

        // Sort by score desc, filter >= 30
        const matches = scored
            .filter(d => d.match_score >= 30)
            .sort((a, b) => b.match_score - a.match_score)
            .slice(0, 10)

        return NextResponse.json({ matches, lead_id: id })
    } catch (err) {
        console.error('Lead Matches Error:', err)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
