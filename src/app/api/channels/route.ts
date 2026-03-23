import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/channels — list channels where user is a member
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const type = searchParams.get('type') || ''

        // Get user's channel memberships
        const { data: memberships, error: memberError } = await supabase
            .from('chat_members')
            .select('channel_id, unread_count, is_muted, is_pinned, notify_mode, last_read_at')
            .eq('user_id', user.id)

        if (memberError) {
            // Graceful: if table doesn't exist yet, return empty
            console.warn('[channels/GET] chat_members query error:', memberError instanceof Error ? memberError.message : memberError)
            return NextResponse.json({ data: [] })
        }

        if (!memberships?.length) {
            return NextResponse.json({ data: [] })
        }

        const channelIds = memberships.map(m => m.channel_id)
        const membershipMap = new Map(memberships.map(m => [m.channel_id, m]))

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
            console.warn('[channels/GET] chat_channels query error:', error instanceof Error ? error.message : error)
            return NextResponse.json({ data: [] })
        }

        // Merge membership info into each channel
        const enriched = (channels || []).map(ch => ({
            ...ch,
            unread_count: membershipMap.get(ch.id)?.unread_count ?? 0,
            is_muted: membershipMap.get(ch.id)?.is_muted ?? false,
            is_pinned: membershipMap.get(ch.id)?.is_pinned ?? false,
            notify_mode: membershipMap.get(ch.id)?.notify_mode ?? 'all',
            last_read_at: membershipMap.get(ch.id)?.last_read_at ?? null,
        }))

        return NextResponse.json({ data: enriched })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
    }
}

// POST /api/channels — create channel
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { name, type, description, development_id } = body

        if (!name?.trim() || !type) {
            return NextResponse.json({ error: 'name e type são obrigatórios' }, { status: 400 })
        }

        // Create channel
        const { data: channel, error } = await supabase
            .from('chat_channels')
            .insert({
                name: name.trim(),
                type,
                description: description?.trim() || null,
                development_id: development_id ?? null,
                created_by: user.id,
                message_count: 0,
                is_archived: false,
                is_pinned: false,
                is_muted: false,
                auto_created: false,
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
        }

        // Add creator as admin member
        const { error: memberError } = await supabase
            .from('chat_members')
            .insert({
                channel_id: channel.id,
                user_id: user.id,
                role: 'admin',
                unread_count: 0,
                is_muted: false,
                is_pinned: false,
                notify_mode: 'all',
                joined_at: new Date().toISOString(),
            })

        if (memberError) {
            // Rollback: delete the channel if member creation fails
            await supabase.from('chat_channels').delete().eq('id', channel.id)
            return NextResponse.json({ error: memberError instanceof Error ? memberError.message : 'Erro ao adicionar membro' }, { status: 500 })
        }

        return NextResponse.json({ data: channel }, { status: 201 })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
    }
}
