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

        // Assign broker to this team
        const { data: updated, error } = await supabaseAdmin
            .from('brokers')
            .update({ team_id: params.id, updated_at: new Date().toISOString() })
            .eq('id', broker_id)
            .select('id, name, email, role, status, avatar_url, team_id')
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Update team member_count
        try {
            await supabaseAdmin.rpc('update_team_member_count', { p_team_id: params.id })
        } catch {
            // Fallback: manual count update
            const { count } = await supabaseAdmin
                .from('brokers')
                .select('id', { count: 'exact' })
                .eq('team_id', params.id)
            if (count !== null) {
                await supabaseAdmin
                    .from('teams')
                    .update({ member_count: count, updated_at: new Date().toISOString() })
                    .eq('id', params.id)
            }
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

        // Remove broker from team
        const { error } = await supabaseAdmin
            .from('brokers')
            .update({ team_id: null, updated_at: new Date().toISOString() })
            .eq('id', broker_id)
            .eq('team_id', params.id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Update team member_count
        const { count } = await supabaseAdmin
            .from('brokers')
            .select('id', { count: 'exact' })
            .eq('team_id', params.id)

        try {
            await supabaseAdmin
                .from('teams')
                .update({ member_count: count ?? 0, updated_at: new Date().toISOString() })
                .eq('id', params.id)
        } catch {
            // noop
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
    }
}
