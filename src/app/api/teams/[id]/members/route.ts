import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// POST /api/teams/[id]/members — add broker to team
export async function POST(
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

        const { data: callerBroker } = await supabaseAdmin
            .from('brokers')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle()

        const isAdminOrManager =
            profile?.role === 'admin' ||
            profile?.role === 'super_admin' ||
            profile?.role === 'owner' ||
            callerBroker?.role === 'admin' ||
            callerBroker?.role === 'broker_manager'

        const { data: team } = await supabaseAdmin
            .from('teams')
            .select('leader_id')
            .eq('id', params.id)
            .maybeSingle()

        const isLeader = team?.leader_id === user.id

        if (!isAdminOrManager && !isLeader) {
            return NextResponse.json({ error: 'Permissão negada' }, { status: 403 })
        }

        const body = await request.json()
        const { broker_id } = body

        if (!broker_id) {
            return NextResponse.json({ error: 'broker_id é obrigatório' }, { status: 400 })
        }

        // Verify broker exists
        const { data: broker } = await supabaseAdmin
            .from('brokers')
            .select('id, name, team_id')
            .eq('id', broker_id)
            .maybeSingle()

        if (!broker) {
            return NextResponse.json({ error: 'Corretor não encontrado' }, { status: 404 })
        }

        // Assign broker to this team (primary team remains in brokers.team_id)
        const { data: updated, error } = await supabaseAdmin
            .from('brokers')
            .update({ team_id: broker.team_id ?? params.id, updated_at: new Date().toISOString() })
            .eq('id', broker_id)
            .select('id, user_id, name, email, role, status, avatar_url, team_id')
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (updated?.user_id) {
            const { error: membershipError } = await supabaseAdmin
                .from('team_members')
                .upsert({
                    team_id: params.id,
                    user_id: updated.user_id,
                    broker_id: updated.id,
                    role: 'member',
                }, {
                    onConflict: 'team_id,user_id',
                })

            if (membershipError) {
                console.warn('team_members upsert failed:', membershipError.message)
            }
        }

        // Update team member_count
        const { error: rpcError } = await supabaseAdmin.rpc('update_team_member_count', { p_team_id: params.id })
        if (rpcError) {
            const { count } = await supabaseAdmin
                .from('team_members')
                .select('id', { count: 'exact', head: true })
                .eq('team_id', params.id)

            await supabaseAdmin
                .from('teams')
                .update({ member_count: count ?? 0, updated_at: new Date().toISOString() })
                .eq('id', params.id)
        }

        return NextResponse.json({ data: updated }, { status: 201 })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
    }
}

// DELETE /api/teams/[id]/members?broker_id=xxx — remove broker from team
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

        const { data: callerBroker } = await supabaseAdmin
            .from('brokers')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle()

        const isAdminOrManager =
            profile?.role === 'admin' ||
            profile?.role === 'super_admin' ||
            profile?.role === 'owner' ||
            callerBroker?.role === 'admin' ||
            callerBroker?.role === 'broker_manager'

        const { data: team } = await supabaseAdmin
            .from('teams')
            .select('leader_id')
            .eq('id', params.id)
            .maybeSingle()

        const isLeader = team?.leader_id === user.id

        if (!isAdminOrManager && !isLeader) {
            return NextResponse.json({ error: 'Permissão negada' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const broker_id = searchParams.get('broker_id')

        if (!broker_id) {
            return NextResponse.json({ error: 'broker_id é obrigatório' }, { status: 400 })
        }

        const { data: broker } = await supabaseAdmin
            .from('brokers')
            .select('id, user_id, team_id')
            .eq('id', broker_id)
            .maybeSingle()

        if (!broker) {
            return NextResponse.json({ error: 'Corretor não encontrado' }, { status: 404 })
        }

        if (broker.user_id) {
            await supabaseAdmin
                .from('team_members')
                .delete()
                .eq('team_id', params.id)
                .eq('user_id', broker.user_id)
        }

        // If this team is currently the broker primary team, try to set another membership as primary.
        if (broker.team_id === params.id) {
            const { data: remainingMemberships } = broker.user_id
                ? await supabaseAdmin
                    .from('team_members')
                    .select('team_id')
                    .eq('user_id', broker.user_id)
                    .limit(1)
                : { data: [] }

            const nextPrimaryTeamId = remainingMemberships?.[0]?.team_id ?? null
            const { error } = await supabaseAdmin
                .from('brokers')
                .update({ team_id: nextPrimaryTeamId, updated_at: new Date().toISOString() })
                .eq('id', broker_id)

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 })
            }
        }

        // Update team member_count
        const { count } = await supabaseAdmin
            .from('team_members')
            .select('id', { count: 'exact', head: true })
            .eq('team_id', params.id)

        await supabaseAdmin
            .from('teams')
            .update({ member_count: count ?? 0, updated_at: new Date().toISOString() })
            .eq('id', params.id)

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
    }
}
