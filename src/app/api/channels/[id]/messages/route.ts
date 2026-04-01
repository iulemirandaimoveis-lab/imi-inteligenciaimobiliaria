import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/channels/[id]/messages?limit=100&before=timestamp
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

        const channelId = params.id
        const url = new URL(req.url)
        const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100'), 200)
        const before = url.searchParams.get('before')

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

        // Mark as read — reset unread count for this user
        await supabase
            .from('chat_members')
            .update({ unread_count: 0, last_read_at: new Date().toISOString() })
            .eq('channel_id', channelId)
            .eq('user_id', user.id)

        return NextResponse.json({ messages: enriched })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
    }
}

// POST /api/channels/[id]/messages — send a message
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

        const channelId = params.id
        const body = await req.json()
        const { content, content_type = 'text', reply_to, attachments, entity_type, entity_id } = body

        if (!content?.trim()) {
            return NextResponse.json({ error: 'content é obrigatório' }, { status: 400 })
        }

        // Verify membership and role
        const { data: membership } = await supabase
            .from('chat_members')
            .select('role')
            .eq('channel_id', channelId)
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
                channel_id: channelId,
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
            })
            .eq('id', channelId)

        // Increment unread for other members (batch update instead of N+1 loop)
        // Supabase doesn't support SQL increment directly, so we fetch IDs then batch update
        const { data: otherMembers } = await supabase
            .from('chat_members')
            .select('id, unread_count')
            .eq('channel_id', channelId)
            .neq('user_id', user.id)

        if (otherMembers?.length) {
            await Promise.all(
                otherMembers.map(member =>
                    supabase
                        .from('chat_members')
                        .update({ unread_count: (member.unread_count ?? 0) + 1 })
                        .eq('id', member.id)
                )
            )
        }

        return NextResponse.json({ message }, { status: 201 })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
    }
}
