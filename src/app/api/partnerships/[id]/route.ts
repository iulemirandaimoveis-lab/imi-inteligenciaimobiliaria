import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// GET /api/partnerships/[id] — single partnership with all messages
// ---------------------------------------------------------------------------

export async function GET(
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
        const { data: partnership, error } = await supabaseAdmin
            .from('partnerships')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !partnership) {
            // Graceful: could be table schema mismatch
            console.warn('[partnerships/GET:id] Fetch error:', error?.message)
            return NextResponse.json({ error: 'Parceria não encontrada' }, { status: 404 })
        }

        // Verify membership
        if (partnership.owner_user_id !== user.id && partnership.partner_user_id !== user.id) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        // Fetch messages (graceful)
        let messages: unknown[] = []
        try {
            const { data: msgData, error: msgErr } = await supabaseAdmin
                .from('partnership_messages')
                .select('*')
                .eq('partnership_id', id)
                .order('created_at', { ascending: true })

            if (msgErr) {
                console.warn('[partnerships/GET:id] Messages query error:', msgErr.message)
            } else {
                messages = msgData ?? []
            }
        } catch (msgCatchErr) {
            console.warn('[partnerships/GET:id] Messages fetch failed:', msgCatchErr)
        }

        return NextResponse.json({ data: { ...partnership, messages } })
    } catch (err) {
        console.error('[partnerships/GET:id] Unexpected error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// ---------------------------------------------------------------------------
// PATCH /api/partnerships/[id] — update partnership fields
// ---------------------------------------------------------------------------

interface PartnershipPatchBody {
    commission_owner_pct?: number
    commission_partner_pct?: number
    commission_platform_pct?: number
    commission_notes?: string
    lead_id?: string
    lead_name?: string
}

const ALLOWED_FIELDS: (keyof PartnershipPatchBody)[] = [
    'commission_owner_pct',
    'commission_partner_pct',
    'commission_platform_pct',
    'commission_notes',
    'lead_id',
    'lead_name',
]

export async function PATCH(
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

        // Fetch partnership to verify membership
        const { data: partnership, error: fetchErr } = await supabaseAdmin
            .from('partnerships')
            .select('id, owner_user_id, partner_user_id, status')
            .eq('id', id)
            .single()

        if (fetchErr || !partnership) {
            return NextResponse.json({ error: 'Parceria não encontrada' }, { status: 404 })
        }

        if (partnership.owner_user_id !== user.id && partnership.partner_user_id !== user.id) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        // Parse body
        let body: PartnershipPatchBody
        try {
            body = await request.json()
        } catch {
            return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
        }

        // Build update payload — only allowed fields
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
        for (const key of ALLOWED_FIELDS) {
            if (body[key] !== undefined) {
                updates[key] = body[key]
            }
        }

        // Recalculate total if commission percentages changed
        if (updates.commission_owner_pct != null || updates.commission_partner_pct != null) {
            const ownerPct =
                (updates.commission_owner_pct as number | undefined) ??
                ((
                    await supabaseAdmin
                        .from('partnerships')
                        .select('commission_owner_pct')
                        .eq('id', id)
                        .single()
                ).data?.commission_owner_pct ?? 0)
            const partnerPct =
                (updates.commission_partner_pct as number | undefined) ??
                ((
                    await supabaseAdmin
                        .from('partnerships')
                        .select('commission_partner_pct')
                        .eq('id', id)
                        .single()
                ).data?.commission_partner_pct ?? 0)
            const platformPct = (updates.commission_platform_pct as number | undefined) ?? 0
            updates.commission_total_pct = ownerPct + partnerPct + platformPct
        }

        const { data: updated, error: updateErr } = await supabaseAdmin
            .from('partnerships')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (updateErr) {
            return NextResponse.json(
                { error: updateErr.message ?? 'Erro ao atualizar parceria' },
                { status: 500 },
            )
        }

        return NextResponse.json({ data: updated })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
