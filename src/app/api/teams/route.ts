import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// GET /api/teams — list teams
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search') || ''

        // Check user role — admin/broker_manager can see all teams
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

        const { data: broker } = await supabaseAdmin
            .from('brokers')
            .select('role, team_id')
            .eq('user_id', user.id)
            .maybeSingle()

        const isAdminOrManager =
            profile?.role === 'admin' ||
            profile?.role === 'super_admin' ||
            profile?.role === 'owner' ||
            broker?.role === 'admin' ||
            broker?.role === 'broker_manager'

        const { data: memberships } = await supabaseAdmin
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)

        const membershipTeamIds = (memberships || [])
            .map((membership) => membership.team_id)
            .filter((teamId): teamId is string => Boolean(teamId))

        let teamsQuery = supabaseAdmin
            .from('teams')
            .select('*', { count: 'exact' })
            .eq('is_active', true)
            .order('name', { ascending: true })

        // Non-admin users only see teams they belong to (supports multi-team)
        if (!isAdminOrManager) {
            const visibleTeamIds = new Set<string>(membershipTeamIds)
            if (broker?.team_id) visibleTeamIds.add(broker.team_id)
            const ids = [...visibleTeamIds]
            if (ids.length === 0) {
                return NextResponse.json({ data: [], count: 0 })
            }
            teamsQuery = teamsQuery.in('id', ids)
        }

        if (search) {
            teamsQuery = teamsQuery.or(`name.ilike.%${search}%,region.ilike.%${search}%,specialty.ilike.%${search}%`)
        }

        const { data: teamsData, error, count } = await teamsQuery

        if (error) {
            console.error('GET /api/teams error:', error.message)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Fetch members for all teams in one query
        const teamIds = (teamsData || []).map((t: { id: string }) => t.id)
        let membersMap: Record<string, unknown[]> = {}

        if (teamIds.length > 0) {
            const { data: relationRows } = await supabaseAdmin
                .from('team_members')
                .select('team_id, broker_id')
                .in('team_id', teamIds)

            const brokerIdsFromRelation = (relationRows || [])
                .map((row) => row.broker_id)
                .filter((brokerId): brokerId is string => Boolean(brokerId))

            const { data: brokers } = await supabaseAdmin
                .from('brokers')
                .select('id, user_id, name, email, role, status, avatar_url, creci, phone, team_id, last_login_at, created_at')
                .or(`team_id.in.(${teamIds.join(',')}),id.in.(${brokerIdsFromRelation.join(',') || '00000000-0000-0000-0000-000000000000'})`)

            if (brokers) {
                const brokerById = new Map(brokers.map((b) => [b.id, b]))
                for (const relation of relationRows || []) {
                    if (!relation.team_id || !relation.broker_id) continue
                    const brokerFromRelation = brokerById.get(relation.broker_id)
                    if (!brokerFromRelation) continue
                    if (!membersMap[relation.team_id]) membersMap[relation.team_id] = []
                    const alreadyAdded = (membersMap[relation.team_id] as { id: string }[]).some((m) => m.id === relation.broker_id)
                    if (!alreadyAdded) membersMap[relation.team_id].push(brokerFromRelation)
                }

                for (const b of brokers) {
                    const tid = (b as { team_id: string | null }).team_id
                    if (!tid) continue
                    if (!membersMap[tid]) membersMap[tid] = []
                    const alreadyAdded = (membersMap[tid] as { id: string }[]).some((m) => m.id === b.id)
                    if (!alreadyAdded) membersMap[tid].push(b)
                }
            }
        }

        const teams = (teamsData || []).map((team: { id: string; member_count: number }) => {
            const members = membersMap[team.id] || []
            return { ...team, members, member_count: members.length }
        })

        return NextResponse.json({ data: teams, count: count || 0 })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
    }
}

// POST /api/teams — create team (admin/manager only)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Check admin/manager role
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

        const isAdminOrManager =
            profile?.role === 'admin' ||
            profile?.role === 'super_admin' ||
            profile?.role === 'owner' ||
            broker?.role === 'admin' ||
            broker?.role === 'broker_manager'

        if (!isAdminOrManager) {
            return NextResponse.json({ error: 'Apenas administradores e gerentes podem criar equipes' }, { status: 403 })
        }

        const body = await request.json()
        const { name, description, region, specialty, commission_rules, leader_id, color } = body

        if (!name?.trim()) {
            return NextResponse.json({ error: 'O nome da equipe é obrigatório' }, { status: 400 })
        }

        // Look up leader name if leader_id provided
        let leaderName: string | null = null
        if (leader_id) {
            const { data: leader } = await supabaseAdmin
                .from('brokers')
                .select('name')
                .eq('id', leader_id)
                .maybeSingle()
            leaderName = leader?.name ?? null
        }

        const { data: team, error } = await supabaseAdmin
            .from('teams')
            .insert({
                name: name.trim(),
                description: description?.trim() || null,
                region: region?.trim() || null,
                specialty: specialty?.trim() || null,
                commission_rules: commission_rules ?? null,
                leader_id: leader_id ?? null,
                leader_name: leaderName,
                color: color || '#C9A84C',
                is_active: true,
                status: 'active',
                member_count: 0,
                active_listings: 0,
                monthly_volume: 0,
            })
            .select()
            .single()

        if (error) {
            console.error('POST /api/teams error:', error.message)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // If leader_id provided, assign them to the team
        if (leader_id && team) {
            const { error: leaderAssignError } = await supabaseAdmin
                .from('brokers')
                .update({ team_id: team.id, updated_at: new Date().toISOString() })
                .eq('id', leader_id)

            if (leaderAssignError) {
                console.warn('leader team_id assign failed:', leaderAssignError.message)
            }
        }

        return NextResponse.json({ data: team }, { status: 201 })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
    }
}
