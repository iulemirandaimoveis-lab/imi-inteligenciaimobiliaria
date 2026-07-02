import { NextRequest, NextResponse } from 'next/server'
import { simulate, SimulationValidationError } from '@/lib/intelligence/subsidy-engine'
import { buildStrategy, AcquisitionScenario, BuyerProfile } from '@/lib/intelligence/acquisition-strategy'
import { limiters, getClientIP } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// ─── POST /api/intelligence/simulate ─────────────────────────────────────────
// Public endpoint. No PII stored. Purely computational.
// Body: { mode: 'single' | 'strategy', buyer_a: SimulationInput, buyer_b?: SimulationInput, scenario?: AcquisitionScenario }

export async function POST(request: NextRequest) {
    // Endpoint público computacional: 10 req/10s por IP
    const rl = await limiters.public(getClientIP(request))
    if (!rl.success) {
        return NextResponse.json({ error: 'Muitas requisições. Aguarde alguns segundos.' }, { status: 429 })
    }

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    if (!body || typeof body !== 'object') {
        return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
    }

    const { mode, buyer_a, buyer_b, scenario } = body as Record<string, unknown>

    if (!buyer_a || typeof buyer_a !== 'object') {
        return NextResponse.json({ error: 'Campo "buyer_a" obrigatório' }, { status: 400 })
    }

    // ── Input coercion ────────────────────────────────────────────────────────
    const coerceBuyer = (raw: unknown): BuyerProfile['input'] => {
        const r = raw as Record<string, unknown>
        return {
            income: Number(r.income ?? 0),
            marital_status: (r.marital_status as string) || 'single',
            profession: (r.profession as string) || 'civilian',
            has_property: Boolean(r.has_property),
            fgts_balance: Number(r.fgts_balance ?? 0),
            location: String(r.location ?? 'Recife'),
            property_value: Number(r.property_value ?? 0),
            service_time_years: r.service_time_years !== undefined ? Number(r.service_time_years) : undefined,
        } as BuyerProfile['input']
    }

    try {
        if (mode === 'strategy') {
            if (!scenario || !['single_buyer', 'couple_unmarried', 'married', 'mixed_income'].includes(scenario as string)) {
                return NextResponse.json({ error: 'Campo "scenario" inválido' }, { status: 400 })
            }

            const buyers: BuyerProfile[] = [
                { id: 'buyer_a', label: 'Comprador A', input: coerceBuyer(buyer_a) },
            ]
            if (buyer_b && typeof buyer_b === 'object') {
                buyers.push({ id: 'buyer_b', label: 'Comprador B', input: coerceBuyer(buyer_b) })
            }

            const result = buildStrategy(scenario as AcquisitionScenario, buyers)
            return NextResponse.json({ result }, {
                headers: { 'Cache-Control': 'no-store' },
            })
        }

        // Default: single simulation
        const input = coerceBuyer(buyer_a)
        const result = simulate(input)
        return NextResponse.json({ result }, {
            headers: { 'Cache-Control': 'no-store' },
        })
    } catch (err) {
        if (err instanceof SimulationValidationError) {
            return NextResponse.json(
                { error: err.message, field: err.field },
                { status: 422 },
            )
        }
        const message = err instanceof Error ? err.message : 'Erro interno'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
