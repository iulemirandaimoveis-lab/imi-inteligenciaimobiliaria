import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/channels/[id] — get channel details + members
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Verify user is a member
        const { data: membership } = await supabase
            .from('chat_members')
            .select('role')
            .eq('channel_id', params.id)
            .eq('user_id', user.id)
            .single()

        if (!membership) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        // Fetch channel
        const { data: channel, error } = await supabase
            .from('chat_channels')
            .select('*')
            .eq('id', params.id)
            .single()

        if (error || !channel) {
            return NextResponse.json({ error: 'Canal não encontrado' }, { status: 404 })
        }

        // Fetch members
        const { data: members } = await supabase
            .from('chat_members')
            .select('id, user_id, role, is_muted, is_pinned, last_read_at, unread_count, notify_mode, joined_at')
            .eq('channel_id', params.id)

        // Enrich members with profile info
        const userIds = (members ?? []).map(m => m.user_id)
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, email')
            .in('id', userIds)

        const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? [])

        const enrichedMembers = (members ?? []).map(m => ({
            ...m,
            name: profileMap.get(m.user_id)?.name ?? 'Usuário',
            avatar_url: profileMap.get(m.user_id)?.avatar_url ?? null,
            email: profileMap.get(m.user_id)?.email ?? null,
        }))

        return NextResponse.json({
            data: {
                ...channel,
                members: enrichedMembers,
                my_role: membership.role,
            },
        })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
    }
}

// PATCH /api/channels/[id] — update channel (admin member only)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Verify user is admin member
        const { data: membership } = await supabase
            .from('chat_members')
            .select('role')
            .eq('channel_id', params.id)
            .eq('user_id', user.id)
            .single()

        if (!membership) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        if (membership.role !== 'admin') {
            return NextResponse.json({ error: 'Somente admin do canal pode editar' }, { status: 403 })
        }

        const body = await request.json()
        const allowedFields = ['name', 'description', 'avatar_url', 'is_archived', 'is_pinned']

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
        for (const key of allowedFields) {
            if (body[key] !== undefined) {
                updates[key] = body[key]
            }
        }

        const { data: updated, error } = await supabase
            .from('chat_channels')
            .update(updates)
            .eq('id', params.id)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
        }

        return NextResponse.json({ data: updated })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
    }
}
