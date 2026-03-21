import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TERMINAL_STATUSES = ['completed', 'cancelled', 'rejected', 'expired']
const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

// ---------------------------------------------------------------------------
// GET /api/partnerships/[id]/messages — paginated messages for a partnership
// ---------------------------------------------------------------------------

export async function GET(
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

        // Verify partnership membership
        const { data: partnership, error: fetchErr } = await supabaseAdmin
            .from('partnerships')
            .select('id, owner_user_id, partner_user_id')
            .eq('id', id)
            .single()

        if (fetchErr || !partnership) {
            return NextResponse.json({ error: 'Parceria não encontrada' }, { status: 404 })
        }

        if (partnership.owner_user_id !== user.id && partnership.partner_user_id !== user.id) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        // Parse pagination params
        const searchParams = request.nextUrl.searchParams
        const limit = Math.min(
            parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
            MAX_LIMIT,
        )
        const before = searchParams.get('before') // cursor: created_at ISO string

        let query = supabaseAdmin
            .from('partnership_messages')
            .select('*', { count: 'exact' })
            .eq('partnership_id', id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (before) {
            query = query.lt('created_at', before)
        }

        const { data: messages, error: msgErr, count } = await query

        if (msgErr) {
            return NextResponse.json(
                { error: msgErr.message ?? 'Erro ao buscar mensagens' },
                { status: 500 },
            )
        }

        // Reverse to chronological order for the client
        const sorted = (messages ?? []).reverse()

        return NextResponse.json({
            data: sorted,
            count: count ?? 0,
            has_more: (messages?.length ?? 0) === limit,
        })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// ---------------------------------------------------------------------------
// POST /api/partnerships/[id]/messages — send a message
// ---------------------------------------------------------------------------

interface MessageBody {
    content: string
    message_type?: string
    metadata?: Record<string, unknown>
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

        // Verify partnership membership and status
        const { data: partnership, error: fetchErr } = await supabaseAdmin
            .from('partnerships')
            .select('id, owner_user_id, partner_user_id, owner_name, partner_name, status, total_messages')
            .eq('id', id)
            .single()

        if (fetchErr || !partnership) {
            return NextResponse.json({ error: 'Parceria não encontrada' }, { status: 404 })
        }

        const isOwner = partnership.owner_user_id === user.id
        const isPartner = partnership.partner_user_id === user.id

        if (!isOwner && !isPartner) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        if (TERMINAL_STATUSES.includes(partnership.status)) {
            return NextResponse.json(
                { error: 'Não é possível enviar mensagens em parceria encerrada' },
                { status: 400 },
            )
        }

        // Parse body
        let body: MessageBody
        try {
            body = await request.json()
        } catch {
            return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
        }

        const { content, message_type, metadata } = body

        if (!content || !content.trim()) {
            return NextResponse.json(
                { error: 'Conteúdo da mensagem é obrigatório' },
                { status: 400 },
            )
        }

        const senderName = isOwner ? partnership.owner_name : partnership.partner_name
        const now = new Date().toISOString()

        // Insert message
        const { data: message, error: insertErr } = await supabaseAdmin
            .from('partnership_messages')
            .insert({
                partnership_id: id,
                sender_id: user.id,
                sender_name: senderName,
                sender_avatar: user.user_metadata?.avatar_url ?? null,
                content: content.trim(),
                message_type: message_type ?? 'text',
                metadata: metadata ?? null,
                read_by_owner: isOwner,
                read_by_partner: isPartner,
                created_at: now,
            })
            .select()
            .single()

        if (insertErr) {
            return NextResponse.json(
                { error: insertErr.message ?? 'Erro ao enviar mensagem' },
                { status: 500 },
            )
        }

        // Update partnership counters and preview
        // Re-fetch current counters to avoid stale data
        const { data: current } = await supabaseAdmin
            .from('partnerships')
            .select('total_messages, unread_owner, unread_partner')
            .eq('id', id)
            .single()

        const partnershipUpdate: Record<string, unknown> = {
            total_messages: (current?.total_messages ?? 0) + 1,
            last_message_at: now,
            last_message_preview: content.trim().slice(0, 120),
            updated_at: now,
        }

        // Increment unread count for the other party
        if (isOwner) {
            partnershipUpdate.unread_partner = (current?.unread_partner ?? 0) + 1
        } else {
            partnershipUpdate.unread_owner = (current?.unread_owner ?? 0) + 1
        }

        await supabaseAdmin
            .from('partnerships')
            .update(partnershipUpdate)
            .eq('id', id)

        return NextResponse.json({ data: message }, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
