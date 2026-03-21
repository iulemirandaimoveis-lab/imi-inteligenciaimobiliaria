import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// POST /api/partnerships/[id]/cancel — either party cancels a partnership
// ---------------------------------------------------------------------------

const TERMINAL_STATUSES = ['completed', 'cancelled', 'rejected', 'expired']

interface CancelBody {
    reason?: string
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
            .select('id, owner_user_id, partner_user_id, status')
            .eq('id', id)
            .single()

        if (fetchErr || !partnership) {
            return NextResponse.json({ error: 'Parceria não encontrada' }, { status: 404 })
        }

        // Either party can cancel
        if (partnership.owner_user_id !== user.id && partnership.partner_user_id !== user.id) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        if (TERMINAL_STATUSES.includes(partnership.status)) {
            return NextResponse.json(
                { error: `Não é possível cancelar parceria com status "${partnership.status}"` },
                { status: 400 },
            )
        }

        // Parse optional body
        let body: CancelBody = {}
        try {
            body = await request.json()
        } catch {
            // Body is optional
        }

        const now = new Date().toISOString()

        const { data: updated, error: updateErr } = await supabaseAdmin
            .from('partnerships')
            .update({
                status: 'cancelled',
                end_reason: body.reason ?? null,
                ended_by: user.id,
                updated_at: now,
            })
            .eq('id', id)
            .select()
            .single()

        if (updateErr) {
            return NextResponse.json(
                { error: updateErr.message ?? 'Erro ao cancelar parceria' },
                { status: 500 },
            )
        }

        return NextResponse.json({ data: updated })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
