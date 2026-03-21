import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// GET /api/teams/[id] — get team details + members
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

        const { data: team, error } = await supabaseAdmin
            .from('teams')
            .select('*')
            .eq('id', params.id)
            .eq('is_active', true)
            .single()

        if (error || !team) {
            return NextResponse.json({ error: 'Equipe não encontrada' }, { status: 404 })
        }

        // Fetch team members from brokers table
        const { data: members, error: membersError } = await supabaseAdmin
            .from('brokers')
            .select('id, user_id, name, email, role, status, avatar_url')
            .eq('team_id', params.id)
            .neq('status', 'inactive')
            .order('name', { ascending: true })

        if (membersError) {
            return NextResponse.json({ error: membersError instanceof Error ? membersError.message : 'Erro desconhecido' }, { status: 500 })
        }

        return NextResponse.json({ data: { ...team, members: members || [] } })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
    }
}

// PATCH /api/teams/[id] — update team (admin/manager/leader only)
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

        // Check permissions: admin, manager, or team leader
        const { data: profile } = await supabaseAdmin
            .from('brokers')
            .select('role')
            .eq('user_id', user.id)
            .single()

        const { data: team } = await supabaseAdmin
            .from('teams')
            .select('leader_id')
            .eq('id', params.id)
            .single()

        const isAdminOrManager = profile?.role === 'admin' || profile?.role === 'manager'
        const isLeader = team?.leader_id === user.id

        if (!isAdminOrManager && !isLeader) {
            return NextResponse.json({ error: 'Permissão negada' }, { status: 403 })
        }

        const body = await request.json()
        const allowedFields = [
            'name', 'description', 'avatar_url', 'region',
            'specialty', 'commission_rules', 'leader_id',
        ]

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
        for (const key of allowedFields) {
            if (body[key] !== undefined) {
                updates[key] = body[key]
            }
        }

        // If leader_id changed, look up new leader name
        if (body.leader_id !== undefined) {
            if (body.leader_id) {
                const { data: leader } = await supabaseAdmin
                    .from('brokers')
                    .select('name')
                    .eq('id', body.leader_id)
                    .single()
                updates.leader_name = leader?.name ?? null
            } else {
                updates.leader_name = null
            }
        }

        const { data: updated, error } = await supabaseAdmin
            .from('teams')
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

// DELETE /api/teams/[id] — soft-delete (admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Admin only
        const { data: profile } = await supabaseAdmin
            .from('brokers')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Permissão negada — somente admin' }, { status: 403 })
        }

        const { error } = await supabaseAdmin
            .from('teams')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', params.id)

        if (error) {
            return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
    }
}
