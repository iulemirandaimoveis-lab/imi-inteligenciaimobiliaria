import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const ADMIN_ROLES = ['admin', 'ADMIN', 'super_admin', 'SUPER_ADMIN', 'owner']

async function requireAdmin(userId: string): Promise<string | null> {
    const { data } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
    if (!data || !ADMIN_ROLES.includes(data.role)) {
        return 'Apenas administradores podem executar esta operação'
    }
    return null
}

// GET /api/teams — list active teams with leader + members
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const search = request.nextUrl.searchParams.get('search') || ''

        // Check caller role
        const { data: callerProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const isAdmin = callerProfile && ADMIN_ROLES.includes(callerProfile.role)

        // Check if caller is a broker_manager to restrict to own team
        const { data: callerBroker } = await supabaseAdmin
            .from('brokers')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle()

        // Build base query — teams with leader info + members
        let query = supabaseAdmin
            .from('teams')
            .select(`
                id, name, description, color, status, created_at, updated_at,
                leader_id,
                leader:brokers!teams_leader_id_fkey(id, name, email, avatar_url, role),
                team_members(
                    id, role, joined_at,
                    broker:brokers(id, name, email, avatar_url, role, status)
                )
            `, { count: 'exact' })
            .eq('status', 'active')
            .order('name', { ascending: true })

        // Non-admin broker_managers see only their own team
        if (!isAdmin && callerBroker?.role === 'broker_manager') {
            const { data: leaderTeam } = await supabaseAdmin
                .from('teams')
                .select('id')
                .eq('leader_id', user.id)
                .maybeSingle()
            if (leaderTeam) {
                query = query.eq('id', leaderTeam.id)
            }
        }

        if (search) {
            query = query.ilike('name', `%${search}%`)
        }

        const { data: teamsData, error, count } = await teamsQuery

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Fetch members for all teams in one query
        const teamIds = (teamsData || []).map((t: { id: string }) => t.id)
        let membersMap: Record<string, unknown[]> = {}

        if (teamIds.length > 0) {
            const { data: brokers } = await supabaseAdmin
                .from('brokers')
                .select('id, user_id, name, email, role, status, avatar_url, creci, phone, team_id, last_login_at, created_at')
                .in('team_id', teamIds)

            if (brokers) {
                for (const b of brokers) {
                    const tid = (b as { team_id: string }).team_id
                    if (!membersMap[tid]) membersMap[tid] = []
                    membersMap[tid].push(b)
                }
            }
        }

        const teams = (teamsData || []).map((team: { id: string; member_count: number }) => {
            const members = membersMap[team.id] || []
            return { ...team, members, member_count: members.length }
        })

        return NextResponse.json({ data: teams, count: count || 0 })
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Internal Server Error' },
            { status: 500 }
        )
    }
}

// POST /api/teams — create team (admin only)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const adminErr = await requireAdmin(user.id)
        if (adminErr) return NextResponse.json({ error: adminErr }, { status: 403 })

        const body = await request.json()
        const { name, description, leader_id, color } = body

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Nome da equipe é obrigatório' }, { status: 400 })
        }

        const { data: team, error } = await supabaseAdmin
            .from('teams')
            .insert({
                name: name.trim(),
                description: description?.trim() || null,
                leader_id: leader_id || null,
                color: color || '#3D6FFF',
                status: 'active',
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // If leader provided, add them as 'leader' in team_members
        if (leader_id && team) {
            const { data: leaderBroker } = await supabaseAdmin
                .from('brokers')
                .select('id, user_id')
                .eq('user_id', leader_id)
                .maybeSingle()

            if (leaderBroker) {
                await supabaseAdmin.from('team_members').upsert({
                    team_id: team.id,
                    user_id: leader_id,
                    broker_id: leaderBroker.id,
                    role: 'leader',
                    joined_at: new Date().toISOString(),
                }, { onConflict: 'team_id,user_id' })
            }
        }

        // Re-fetch with relations
        const { data: full } = await supabaseAdmin
            .from('teams')
            .select(`
                id, name, description, color, status, created_at, updated_at, leader_id,
                leader:brokers!teams_leader_id_fkey(id, name, email, avatar_url, role),
                team_members(
                    id, role, joined_at,
                    broker:brokers(id, name, email, avatar_url, role, status)
                )
            `)
            .eq('id', team.id)
            .single()

        return NextResponse.json({ data: full }, { status: 201 })
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Internal Server Error' },
            { status: 500 }
        )
    }
}

// PATCH /api/teams — update team (admin only)
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const adminErr = await requireAdmin(user.id)
        if (adminErr) return NextResponse.json({ error: adminErr }, { status: 403 })

        const body = await request.json()
        const { id, name, description, leader_id, color, status } = body
        if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (name !== undefined) updates.name = name.trim()
        if (description !== undefined) updates.description = description?.trim() || null
        if (color !== undefined) updates.color = color
        if (status !== undefined) updates.status = status

        // Handle leader change
        if (leader_id !== undefined) {
            updates.leader_id = leader_id || null

            // Remove old leader role in team_members
            await supabaseAdmin
                .from('team_members')
                .update({ role: 'member' })
                .eq('team_id', id)
                .eq('role', 'leader')

            // Add new leader if provided
            if (leader_id) {
                const { data: leaderBroker } = await supabaseAdmin
                    .from('brokers')
                    .select('id')
                    .eq('user_id', leader_id)
                    .maybeSingle()

                if (leaderBroker) {
                    await supabaseAdmin.from('team_members').upsert({
                        team_id: id,
                        user_id: leader_id,
                        broker_id: leaderBroker.id,
                        role: 'leader',
                        joined_at: new Date().toISOString(),
                    }, { onConflict: 'team_id,user_id' })
                }
            }
        }

        const { data, error } = await supabaseAdmin
            .from('teams')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ data })
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Internal Server Error' },
            { status: 500 }
        )
    }
}

// DELETE /api/teams — soft-delete (admin only)
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const adminErr = await requireAdmin(user.id)
        if (adminErr) return NextResponse.json({ error: adminErr }, { status: 403 })

        const id = request.nextUrl.searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

        const { error } = await supabaseAdmin
            .from('teams')
            .update({ status: 'archived', updated_at: new Date().toISOString() })
            .eq('id', id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Internal Server Error' },
            { status: 500 }
        )
    }
}
