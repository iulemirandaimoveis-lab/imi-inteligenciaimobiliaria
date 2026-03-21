import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PartnershipCreateBody {
    property_id: string
    property_name: string
    property_price: number
    owner_broker_id: string
    message: string
    commission_owner_pct: number
    commission_partner_pct: number
}

const TERMINAL_STATUSES = ['completed', 'cancelled', 'rejected', 'expired'] as const
type PartnershipStatus =
    | 'proposed'
    | 'negotiating'
    | 'accepted'
    | 'active'
    | (typeof TERMINAL_STATUSES)[number]

// ---------------------------------------------------------------------------
// GET /api/partnerships — list partnerships for the authenticated user
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
            error: sessionErr,
        } = await supabase.auth.getUser()
        if (sessionErr || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const status = searchParams.get('status') as PartnershipStatus | null

        let query = supabaseAdmin
            .from('partnerships')
            .select(
                'id, property_id, property_name, property_price, owner_id, owner_user_id, owner_name, partner_id, partner_user_id, partner_name, status, commission_total_pct, commission_owner_pct, commission_partner_pct, last_message_preview, last_message_at, unread_owner, unread_partner, proposed_at, responded_at, updated_at, expires_at',
                { count: 'exact' },
            )
            .or(`owner_user_id.eq.${user.id},partner_user_id.eq.${user.id}`)
            .order('updated_at', { ascending: false })

        if (status && status !== ('all' as string)) {
            query = query.eq('status', status)
        }

        const { data, error, count } = await query

        if (error) {
            return NextResponse.json(
                { error: error.message ?? 'Erro desconhecido' },
                { status: 500 },
            )
        }

        return NextResponse.json({ data: data ?? [], count: count ?? 0 })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// ---------------------------------------------------------------------------
// POST /api/partnerships — create a new partnership proposal
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
            error: sessionErr,
        } = await supabase.auth.getUser()
        if (sessionErr || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Parse body
        let body: PartnershipCreateBody
        try {
            body = await request.json()
        } catch {
            return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
        }

        const {
            property_id,
            property_name,
            property_price,
            owner_broker_id,
            message,
            commission_owner_pct,
            commission_partner_pct,
        } = body

        // Validate required fields
        if (
            !property_id ||
            !property_name ||
            !property_price ||
            !owner_broker_id ||
            !message ||
            commission_owner_pct == null ||
            commission_partner_pct == null
        ) {
            return NextResponse.json(
                { error: 'Campos obrigatórios: property_id, property_name, property_price, owner_broker_id, message, commission_owner_pct, commission_partner_pct' },
                { status: 400 },
            )
        }

        if (commission_owner_pct < 0 || commission_partner_pct < 0) {
            return NextResponse.json(
                { error: 'Percentuais de comissão devem ser positivos' },
                { status: 400 },
            )
        }

        // Look up the owner broker record
        const { data: ownerBroker, error: ownerErr } = await supabaseAdmin
            .from('brokers')
            .select('id, user_id, name')
            .eq('id', owner_broker_id)
            .single()

        if (ownerErr || !ownerBroker) {
            return NextResponse.json(
                { error: 'Corretor proprietário não encontrado' },
                { status: 404 },
            )
        }

        // Look up the partner broker record (current user)
        const { data: partnerBroker, error: partnerErr } = await supabaseAdmin
            .from('brokers')
            .select('id, user_id, name')
            .eq('user_id', user.id)
            .single()

        if (partnerErr || !partnerBroker) {
            return NextResponse.json(
                { error: 'Seu registro de corretor não foi encontrado' },
                { status: 404 },
            )
        }

        if (ownerBroker.user_id === user.id) {
            return NextResponse.json(
                { error: 'Você não pode propor parceria para si mesmo' },
                { status: 400 },
            )
        }

        const now = new Date().toISOString()
        const commissionTotalPct = commission_owner_pct + commission_partner_pct

        // Insert partnership
        const { data: partnership, error: insertErr } = await supabaseAdmin
            .from('partnerships')
            .insert({
                property_id,
                property_name,
                property_price,
                owner_id: ownerBroker.id,
                owner_user_id: ownerBroker.user_id,
                owner_name: ownerBroker.name,
                partner_id: partnerBroker.id,
                partner_user_id: partnerBroker.user_id,
                partner_name: partnerBroker.name,
                commission_total_pct: commissionTotalPct,
                commission_owner_pct,
                commission_partner_pct,
                commission_platform_pct: 0,
                status: 'proposed' as const,
                proposed_at: now,
                updated_at: now,
                total_messages: 1,
                unread_owner: 1,
                unread_partner: 0,
                last_message_at: now,
                last_message_preview: message.slice(0, 120),
            })
            .select()
            .single()

        if (insertErr) {
            return NextResponse.json(
                { error: insertErr.message ?? 'Erro ao criar parceria' },
                { status: 500 },
            )
        }

        // Insert initial message
        const { error: msgErr } = await supabaseAdmin
            .from('partnership_messages')
            .insert({
                partnership_id: partnership.id,
                sender_id: user.id,
                sender_name: partnerBroker.name,
                sender_avatar: user.user_metadata?.avatar_url ?? null,
                content: message,
                message_type: 'proposal',
                read_by_owner: false,
                read_by_partner: true,
                created_at: now,
            })

        if (msgErr) {
            // Non-critical — partnership was created, log but don't fail
            console.error('[partnerships/POST] Erro ao inserir mensagem inicial:', msgErr.message)
        }

        return NextResponse.json({ data: partnership }, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
