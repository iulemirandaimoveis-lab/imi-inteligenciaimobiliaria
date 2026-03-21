import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// GET /api/partnerships/stats — partnership statistics for the current user
// ---------------------------------------------------------------------------

export async function GET() {
    try {
        const supabase = await createClient()
        const {
            data: { user },
            error: sessionErr,
        } = await supabase.auth.getUser()
        if (sessionErr || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Fetch all partnerships for the user
        const { data: partnerships, error } = await supabaseAdmin
            .from('partnerships')
            .select('id, status, sale_value, commission_owner_pct, commission_partner_pct, owner_user_id, partner_user_id')
            .or(`owner_user_id.eq.${user.id},partner_user_id.eq.${user.id}`)

        if (error) {
            return NextResponse.json(
                { error: error.message ?? 'Erro desconhecido' },
                { status: 500 },
            )
        }

        const all = partnerships ?? []

        const totalPartnerships = all.length
        const activeCount = all.filter(
            (p) => ['proposed', 'negotiating', 'accepted', 'active'].includes(p.status),
        ).length
        const completedCount = all.filter((p) => p.status === 'completed').length

        const completedItems = all.filter((p) => p.status === 'completed')
        const totalVolume = completedItems.reduce(
            (sum, p) => sum + (p.sale_value ?? 0),
            0,
        )

        // Average commission percentage for the current user across all partnerships
        let avgCommissionPct = 0
        if (all.length > 0) {
            const totalPct = all.reduce((sum, p) => {
                const isOwner = p.owner_user_id === user.id
                return sum + (isOwner ? (p.commission_owner_pct ?? 0) : (p.commission_partner_pct ?? 0))
            }, 0)
            avgCommissionPct = Math.round((totalPct / all.length) * 100) / 100
        }

        return NextResponse.json({
            data: {
                total_partnerships: totalPartnerships,
                active_count: activeCount,
                completed_count: completedCount,
                total_volume: totalVolume,
                avg_commission_pct: avgCommissionPct,
            },
        })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
