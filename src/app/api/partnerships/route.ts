import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Types & Validation
// ---------------------------------------------------------------------------

const PartnershipCreateSchema = z.object({
    property_id: z.string().min(1),
    property_name: z.string().min(1),
    property_price: z.number().positive(),
    owner_broker_id: z.string().min(1),
    message: z.string().min(1).max(2000),
    commission_owner_pct: z.number().min(0).max(100),
    commission_partner_pct: z.number().min(0).max(100),
})

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
                'id, property_id, property_name, property_price, owner_id, owner_user_id, owner_name, partner_id, partner_user_id, partner_name, status, commission_total_pct, commission_owner_pct, commission_partner_pct, sale_value, total_commission, total_messages, last_message_preview, last_message_at, unread_owner, unread_partner, proposed_at, responded_at, updated_at, expires_at',
                { count: 'exact' },
            )
            .or(`owner_user_id.eq.${user.id},partner_user_id.eq.${user.id}`)
            .order('updated_at', { ascending: false })

        if (status && status !== ('all' as string)) {
            query = query.eq('status', status)
        }

        const { data, error, count } = await query

        if (error) {
            // Graceful: if table or columns don't exist yet, return empty
            console.warn('[partnerships/GET] Query error (table may not exist yet):', error.message)
            return NextResponse.json({ data: [], count: 0 })
        }

        return NextResponse.json({ data: data ?? [], count: count ?? 0 })
    } catch (err) {
        console.error('[partnerships/GET] Unexpected error:', err)
        return NextResponse.json({ data: [], count: 0 })
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

        // Parse & validate body
        let rawBody: unknown
        try {
            rawBody = await request.json()
        } catch {
            return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
        }

        const parsed = PartnershipCreateSchema.safeParse(rawBody)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
        }

        const body: PartnershipCreateBody = parsed.data
        const {
            property_id,
            property_name,
            property_price,
            owner_broker_id,
            message,
            commission_owner_pct,
            commission_partner_pct,
        } = body

        // Look up the owner broker record — try brokers table first, fall back to profiles
        let ownerBrokerId = owner_broker_id
        let ownerUserId: string | null = null
        let ownerName = 'Proprietário'

        const { data: ownerBroker, error: ownerErr } = await supabaseAdmin
            .from('brokers')
            .select('id, user_id, name')
            .eq('id', owner_broker_id)
            .single()

        if (!ownerErr && ownerBroker) {
            ownerBrokerId = ownerBroker.id
            ownerUserId = ownerBroker.user_id
            ownerName = ownerBroker.name
        } else {
            // Fallback: try looking up by user_id in brokers (maybe owner_broker_id IS a user_id)
            const { data: ownerByUserId } = await supabaseAdmin
                .from('brokers')
                .select('id, user_id, name')
                .eq('user_id', owner_broker_id)
                .single()

            if (ownerByUserId) {
                ownerBrokerId = ownerByUserId.id
                ownerUserId = ownerByUserId.user_id
                ownerName = ownerByUserId.name
            } else {
                // Last resort: check profiles table
                const { data: ownerProfile } = await supabaseAdmin
                    .from('profiles')
                    .select('id, full_name, display_name')
                    .eq('id', owner_broker_id)
                    .single()

                if (ownerProfile) {
                    ownerUserId = ownerProfile.id
                    ownerName = ownerProfile.display_name || ownerProfile.full_name || 'Proprietário'
                } else {
                    return NextResponse.json(
                        { error: 'Corretor proprietário não encontrado' },
                        { status: 404 },
                    )
                }
            }
        }

        // Look up the partner broker record (current user) — graceful fallback
        let partnerBrokerId = ''
        let partnerName = user.user_metadata?.full_name || user.email || 'Parceiro'

        const { data: partnerBroker } = await supabaseAdmin
            .from('brokers')
            .select('id, user_id, name')
            .eq('user_id', user.id)
            .single()

        if (partnerBroker) {
            partnerBrokerId = partnerBroker.id
            partnerName = partnerBroker.name
        } else {
            // Fallback: use user.id as partner_id
            partnerBrokerId = user.id
            // Try profiles for a better name
            const { data: partnerProfile } = await supabaseAdmin
                .from('profiles')
                .select('id, full_name, display_name')
                .eq('id', user.id)
                .single()

            if (partnerProfile) {
                partnerName = partnerProfile.display_name || partnerProfile.full_name || partnerName
            }
        }

        if (ownerUserId === user.id) {
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
                owner_id: ownerBrokerId,
                owner_user_id: ownerUserId,
                owner_name: ownerName,
                partner_id: partnerBrokerId,
                partner_user_id: user.id,
                partner_name: partnerName,
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
            console.error('[partnerships/POST] Insert error:', insertErr.message)
            return NextResponse.json(
                { error: insertErr.message ?? 'Erro ao criar parceria' },
                { status: 500 },
            )
        }

        // Insert initial message (non-critical)
        const { error: msgErr } = await supabaseAdmin
            .from('partnership_messages')
            .insert({
                partnership_id: partnership.id,
                sender_id: user.id,
                sender_name: partnerName,
                sender_avatar: user.user_metadata?.avatar_url ?? null,
                content: message,
                message_type: 'proposal',
                read_by_owner: false,
                read_by_partner: true,
                created_at: now,
            })

        if (msgErr) {
            console.error('[partnerships/POST] Erro ao inserir mensagem inicial:', msgErr.message)
        }

        // ── Auto-create chat channel between the two brokers ──
        try {
            if (ownerUserId) {
                const channelName = `Parceria: ${property_name}`
                const { data: channel } = await supabaseAdmin
                    .from('chat_channels')
                    .insert({
                        type: 'partnership',
                        name: channelName,
                        description: `Parceria comercial — ${ownerName} ↔ ${partnerName}`,
                        partnership_id: partnership.id,
                        created_by: user.id,
                        message_count: 0,
                        is_archived: false,
                        is_pinned: false,
                        is_muted: false,
                        auto_created: true,
                    })
                    .select()
                    .single()

                if (channel) {
                    // Add both brokers as channel members
                    await supabaseAdmin.from('chat_members').insert([
                        {
                            channel_id: channel.id,
                            user_id: user.id,
                            role: 'admin',
                            unread_count: 0,
                            is_muted: false,
                            is_pinned: false,
                            notify_mode: 'all',
                            joined_at: now,
                        },
                        {
                            channel_id: channel.id,
                            user_id: ownerUserId,
                            role: 'member',
                            unread_count: 1,
                            is_muted: false,
                            is_pinned: false,
                            notify_mode: 'all',
                            joined_at: now,
                        },
                    ])

                    // System message in chat channel
                    await supabaseAdmin.from('chat_messages').insert({
                        channel_id: channel.id,
                        sender_id: user.id,
                        content: `${partnerName} propôs uma parceria para o imóvel "${property_name}"`,
                        content_type: 'system',
                    })

                    // Link channel to partnership
                    await supabaseAdmin
                        .from('partnerships')
                        .update({ channel_id: channel.id })
                        .eq('id', partnership.id)
                }
            }
        } catch (chatErr) {
            // Non-critical — partnership was created, chat creation can fail gracefully
            console.error('[partnerships/POST] Erro ao criar canal de chat:', chatErr)
        }

        return NextResponse.json({ data: partnership }, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
