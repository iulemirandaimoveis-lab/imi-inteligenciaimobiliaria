import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/connect — list channels for current user
export async function GET(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const url = new URL(req.url)
    const type = url.searchParams.get('type')

    // Get channels where user is a member
    const { data: memberships } = await supabase
        .from('chat_members')
        .select('channel_id, unread_count, role, is_pinned, is_muted, notify_mode')
        .eq('user_id', user.id)

    if (!memberships?.length) {
        return NextResponse.json({ channels: [], total_unread: 0 })
    }

    const channelIds = memberships.map(m => m.channel_id)
    const memberMap = new Map(memberships.map(m => [m.channel_id, m]))

    let query = supabase
        .from('chat_channels')
        .select('*')
        .in('id', channelIds)
        .eq('is_archived', false)
        .order('last_message_at', { ascending: false, nullsFirst: false })

    if (type) {
        query = query.eq('type', type)
    }

    const { data: channels, error } = await query

    if (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
    }

    const enriched = (channels ?? []).map(ch => ({
        ...ch,
        unread_count: memberMap.get(ch.id)?.unread_count ?? 0,
        user_role: memberMap.get(ch.id)?.role ?? 'member',
        is_pinned: memberMap.get(ch.id)?.is_pinned ?? false,
        is_muted: memberMap.get(ch.id)?.is_muted ?? false,
    }))

    const totalUnread = enriched.reduce((sum, ch) => sum + ch.unread_count, 0)

    return NextResponse.json({ channels: enriched, total_unread: totalUnread })
}

// POST /api/connect — create a new channel
export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await req.json()
    const { type, name, description, member_ids, development_id, lead_id, proposal_id } = body

    if (!type || !name) {
        return NextResponse.json({ error: 'type e name são obrigatórios' }, { status: 400 })
    }

    // Create the channel
    const { data: channel, error } = await supabase
        .from('chat_channels')
        .insert({
            type,
            name,
            description: description ?? null,
            development_id: development_id ?? null,
            lead_id: lead_id ?? null,
            proposal_id: proposal_id ?? null,
            created_by: user.id,
        })
        .select()
        .single()

    if (error || !channel) {
        return NextResponse.json({ error: error?.message ?? 'Erro ao criar canal' }, { status: 500 })
    }

    // Add creator as admin
    await supabase.from('chat_members').insert({
        channel_id: channel.id,
        user_id: user.id,
        role: 'admin',
    })

    // Add other members
    if (member_ids?.length) {
        const uniqueMembers = [...new Set(member_ids as string[])].filter(id => id !== user.id)
        if (uniqueMembers.length) {
            await supabase.from('chat_members').insert(
                uniqueMembers.map(uid => ({
                    channel_id: channel.id,
                    user_id: uid,
                    role: 'member' as const,
                }))
            )
        }
    }

    // System message
    await supabase.from('chat_messages').insert({
        channel_id: channel.id,
        sender_id: user.id,
        content: `Canal "${name}" criado`,
        content_type: 'system',
    })

    return NextResponse.json({ channel }, { status: 201 })
}
