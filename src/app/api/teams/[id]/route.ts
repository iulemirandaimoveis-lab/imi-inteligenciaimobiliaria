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
            .maybeSingle()

        if (error || !team) {
            return NextResponse.json({ error: 'Equipe não encontrada' }, { status: 404 })
        }

        // Fetch team members from brokers table via team_id
        const { data: members } = await supabaseAdmin
            .from('brokers')
            .select('id, user_id, name, email, role, status, avatar_url, creci, phone, commission_rate, last_login_at, created_at')
            .eq('team_id', params.id)
            .order('name', { ascending: true })

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

        // Check permissions: admin, broker_manager, or team leader
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

        const { data: broker } = await supabaseAdmin
            .from('brokers')
            .select('id, role')
            .eq('user_id', user.id)
            .maybeSingle()

        const { data: team } = await supabaseAdmin
            .from('teams')
            .select('leader_id')
            .eq('id', params.id)
            .maybeSingle()

        const isAdminOrManager =
            profile?.role === 'admin' ||
            profile?.role === 'super_admin' ||
            profile?.role === 'owner' ||
            broker?.role === 'admin' ||
            broker?.role === 'broker_manager'

        const isLeader = team?.leader_id === user.id

        if (!isAdminOrManager && !isLeader) {
            return NextResponse.json({ error: 'Permissão negada' }, { status: 403 })
        }

        const body = await request.json()
        const allowedFields = [
            'name', 'description', 'avatar_url', 'color',
            'region', 'specialty', 'commission_rules', 'leader_id',
        ]

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
        for (const key of allowedFields) {
            if (body[key] !== undefined) {
                updates[key] = body[key]
            }
        }

        // If leader_id changed, update leader_name
        if (body.leader_id !== undefined) {
            if (body.leader_id) {
                const { data: leader } = await supabaseAdmin
                    .from('brokers')
                    .select('name')
                    .eq('id', body.leader_id)
                    .maybeSingle()
                updates.leader_name = leader?.name ?? null

                // Assign this broker to the team
                const { error: leaderAssignError } = await supabaseAdmin
                    .from('brokers')
                    .update({ team_id: params.id, updated_at: new Date().toISOString() })
                    .eq('id', body.leader_id)

                if (leaderAssignError) {
                    console.warn('Failed to assign leader to team:', leaderAssignError.message)
                }
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
            return NextResponse.json({ error: error.message }, { status: 500 })
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

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

        const { data: broker } = await supabaseAdmin
            .from('brokers')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle()

        const isAdmin =
            profile?.role === 'admin' ||
            profile?.role === 'super_admin' ||
            profile?.role === 'owner' ||
            broker?.role === 'admin'

        if (!isAdmin) {
            return NextResponse.json({ error: 'Apenas administradores podem excluir equipes' }, { status: 403 })
        }

        // Unassign members from this team before soft-deleting
        const { error: unassignError } = await supabaseAdmin
            .from('brokers')
            .update({ team_id: null, updated_at: new Date().toISOString() })
            .eq('team_id', params.id)

        if (unassignError) {
            console.warn('Failed to unassign team brokers before archive:', unassignError.message)
        }

        const { error } = await supabaseAdmin
            .from('teams')
            .update({ is_active: false, status: 'archived', updated_at: new Date().toISOString() })
            .eq('id', params.id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
    }
}
