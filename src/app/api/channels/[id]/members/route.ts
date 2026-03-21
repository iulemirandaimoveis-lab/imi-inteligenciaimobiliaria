import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/channels/[id]/members — add a member (admin only)
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const channelId = params.id

        // Verify caller is admin member
        const { data: callerMembership } = await supabase
            .from('chat_members')
            .select('role')
            .eq('channel_id', channelId)
            .eq('user_id', user.id)
            .single()

        if (!callerMembership) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        if (callerMembership.role !== 'admin') {
            return NextResponse.json({ error: 'Somente admin do canal pode adicionar membros' }, { status: 403 })
        }

        const body = await req.json()
        const { user_id, role = 'member' } = body

        if (!user_id) {
            return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
        }

        // Check if user is already a member
        const { data: existing } = await supabase
            .from('chat_members')
            .select('id')
            .eq('channel_id', channelId)
            .eq('user_id', user_id)
            .single()

        if (existing) {
            return NextResponse.json({ error: 'Usuário já é membro deste canal' }, { status: 409 })
        }

        const { data: member, error } = await supabase
            .from('chat_members')
            .insert({
                channel_id: channelId,
                user_id,
                role,
                unread_count: 0,
                is_muted: false,
                is_pinned: false,
                notify_mode: 'all',
                joined_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
        }

        return NextResponse.json({ data: member }, { status: 201 })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
    }
}

// DELETE /api/channels/[id]/members?userId=xxx — remove a member (admin only)
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const channelId = params.id
        const url = new URL(req.url)
        const userId = url.searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
        }

        // Verify caller is admin member
        const { data: callerMembership } = await supabase
            .from('chat_members')
            .select('role')
            .eq('channel_id', channelId)
            .eq('user_id', user.id)
            .single()

        if (!callerMembership) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        if (callerMembership.role !== 'admin') {
            return NextResponse.json({ error: 'Somente admin do canal pode remover membros' }, { status: 403 })
        }

        // Prevent removing yourself if you're the last admin
        if (userId === user.id) {
            const { data: admins } = await supabase
                .from('chat_members')
                .select('id')
                .eq('channel_id', channelId)
                .eq('role', 'admin')

            if ((admins?.length ?? 0) <= 1) {
                return NextResponse.json({ error: 'Não é possível remover o último admin do canal' }, { status: 400 })
            }
        }

        const { error } = await supabase
            .from('chat_members')
            .delete()
            .eq('channel_id', channelId)
            .eq('user_id', userId)

        if (error) {
            return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
    }
}
