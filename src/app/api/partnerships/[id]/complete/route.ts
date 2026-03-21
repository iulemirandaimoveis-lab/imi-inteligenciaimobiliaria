import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// POST /api/partnerships/[id]/complete — mark partnership as completed
// ---------------------------------------------------------------------------

interface CompleteBody {
    sale_value: number
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params

        const supabase = await createClient()
        const {
            data: { user },
            error: sessionErr,
        } = await supabase.auth.getUser()
        if (sessionErr || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Fetch partnership
        const { data: partnership, error: fetchErr } = await supabaseAdmin
            .from('partnerships')
            .select(
                'id, owner_user_id, partner_user_id, status, commission_total_pct, commission_owner_pct, commission_partner_pct, commission_platform_pct',
            )
            .eq('id', id)
            .single()

        if (fetchErr || !partnership) {
            return NextResponse.json({ error: 'Parceria não encontrada' }, { status: 404 })
        }

        // Either party can complete
        if (partnership.owner_user_id !== user.id && partnership.partner_user_id !== user.id) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        // Only accepted or active partnerships can be completed
        if (partnership.status !== 'accepted' && partnership.status !== 'active') {
            return NextResponse.json(
                { error: `Não é possível concluir parceria com status "${partnership.status}"` },
                { status: 400 },
            )
        }

        // Parse body
        let body: CompleteBody
        try {
            body = await request.json()
        } catch {
            return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
        }

        const { sale_value } = body

        if (!sale_value || sale_value <= 0) {
            return NextResponse.json(
                { error: 'sale_value é obrigatório e deve ser maior que zero' },
                { status: 400 },
            )
        }

        // Calculate commissions
        const totalCommission = (sale_value * (partnership.commission_total_pct ?? 0)) / 100
        const ownerCommission = (sale_value * (partnership.commission_owner_pct ?? 0)) / 100
        const partnerCommission = (sale_value * (partnership.commission_partner_pct ?? 0)) / 100
        const platformCommission = (sale_value * (partnership.commission_platform_pct ?? 0)) / 100

        const now = new Date().toISOString()

        const { data: updated, error: updateErr } = await supabaseAdmin
            .from('partnerships')
            .update({
                status: 'completed',
                sale_value,
                total_commission: totalCommission,
                owner_commission: ownerCommission,
                partner_commission: partnerCommission,
                platform_commission: platformCommission,
                closed_at: now,
                updated_at: now,
            })
            .eq('id', id)
            .select()
            .single()

        if (updateErr) {
            return NextResponse.json(
                { error: updateErr.message ?? 'Erro ao concluir parceria' },
                { status: 500 },
            )
        }

        return NextResponse.json({ data: updated })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
