import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications'

// GET /api/connect/messages?channel_id=xxx&limit=100&before=timestamp
export async function GET(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const url = new URL(req.url)
    const channelId = url.searchParams.get('channel_id')
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100'), 200)
    const before = url.searchParams.get('before')

    if (!channelId) {
        return NextResponse.json({ error: 'channel_id obrigatório' }, { status: 400 })
    }

    // Verify user is a member
    const { data: membership } = await supabase
        .from('chat_members')
        .select('id')
        .eq('channel_id', channelId)
        .eq('user_id', user.id)
        .single()

    if (!membership) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    let query = supabase
        .from('chat_messages')
        .select('*')
        .eq('channel_id', channelId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (before) {
        query = query.lt('created_at', before)
    }

    const { data: messages, error } = await query

    if (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
    }

    // Enrich with sender profiles
    const senderIds = [...new Set((messages ?? []).map(m => m.sender_id))]
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', senderIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? [])

    const enriched = (messages ?? []).reverse().map(m => ({
        ...m,
        sender_name: profileMap.get(m.sender_id)?.name ?? 'Usuário',
        sender_avatar: profileMap.get(m.sender_id)?.avatar_url ?? null,
    }))

    return NextResponse.json({ messages: enriched })
}

// POST /api/connect/messages — send a message
export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await req.json()
    const { channel_id, content, content_type = 'text', reply_to, attachments, entity_type, entity_id } = body

    if (!channel_id || !content?.trim()) {
        return NextResponse.json({ error: 'channel_id e content obrigatórios' }, { status: 400 })
    }

    // Verify membership
    const { data: membership } = await supabase
        .from('chat_members')
        .select('role')
        .eq('channel_id', channel_id)
        .eq('user_id', user.id)
        .single()

    if (!membership) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    if (membership.role === 'readonly') {
        return NextResponse.json({ error: 'Sem permissão para enviar mensagens' }, { status: 403 })
    }

    const { data: message, error } = await supabase
        .from('chat_messages')
        .insert({
            channel_id,
            sender_id: user.id,
            content: content.trim(),
            content_type,
            reply_to: reply_to ?? null,
            attachments: attachments ?? [],
            entity_type: entity_type ?? null,
            entity_id: entity_id ?? null,
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
    }

    // Update channel's last_message_at and preview
    const preview = content.trim().slice(0, 100)
    await supabase
        .from('chat_channels')
        .update({
            last_message_at: new Date().toISOString(),
            last_message_preview: preview,
            message_count: undefined, // Let DB handle increment via trigger if exists
        })
        .eq('id', channel_id)

    // Increment unread for other members + send push notifications
    const { data: otherMembers } = await supabase
        .from('chat_members')
        .select('id, user_id, unread_count')
        .eq('channel_id', channel_id)
        .neq('user_id', user.id)

    if (otherMembers?.length) {
        const senderName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Alguém'
        const preview = content.trim().slice(0, 80)

        for (const member of otherMembers) {
            await supabase
                .from('chat_members')
                .update({ unread_count: (member.unread_count ?? 0) + 1 })
                .eq('id', member.id)

            // Push notification — fire-and-forget
            if (member.user_id) {
                createNotification({
                    userId: member.user_id,
                    type: 'mensagem_nova',
                    title: `${senderName} no Connect`,
                    message: content_type === 'voice' ? '🎤 Mensagem de voz' : preview,
                    data: { channel_id, message_id: message.id },
                    url: '/backoffice/connect',
                }).catch(() => {})
            }
        }
    }

    return NextResponse.json({ message }, { status: 201 })
}
