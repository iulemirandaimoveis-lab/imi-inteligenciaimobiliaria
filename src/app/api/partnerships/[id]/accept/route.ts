import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// POST /api/partnerships/[id]/accept — owner accepts a partnership proposal
// ---------------------------------------------------------------------------

export async function POST(
    _request: NextRequest,
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
            .select('id, owner_user_id, partner_user_id, status')
            .eq('id', id)
            .single()

        if (fetchErr || !partnership) {
            return NextResponse.json({ error: 'Parceria não encontrada' }, { status: 404 })
        }

        // Only the owner can accept
        if (partnership.owner_user_id !== user.id) {
            return NextResponse.json(
                { error: 'Apenas o proprietário do imóvel pode aceitar a parceria' },
                { status: 403 },
            )
        }

        // Validate current status
        if (partnership.status !== 'proposed' && partnership.status !== 'negotiating') {
            return NextResponse.json(
                { error: `Não é possível aceitar parceria com status "${partnership.status}"` },
                { status: 400 },
            )
        }

        const now = new Date().toISOString()

        const { data: updated, error: updateErr } = await supabaseAdmin
            .from('partnerships')
            .update({
                status: 'accepted',
                responded_at: now,
                terms_agreed_at: now,
                updated_at: now,
            })
            .eq('id', id)
            .select()
            .single()

        if (updateErr) {
            return NextResponse.json(
                { error: updateErr.message ?? 'Erro ao aceitar parceria' },
                { status: 500 },
            )
        }

        return NextResponse.json({ data: updated })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
