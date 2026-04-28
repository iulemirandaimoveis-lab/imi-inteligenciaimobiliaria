import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const ADMIN_ROLES = ['admin', 'ADMIN', 'super_admin', 'SUPER_ADMIN', 'owner']

async function getCallerRoles(userId: string) {
    const [profileRes, brokerRes] = await Promise.all([
        supabaseAdmin.from('profiles').select('role').eq('id', userId).single(),
        supabaseAdmin.from('brokers').select('role').eq('user_id', userId).maybeSingle(),
    ])
    return {
        profileRole: profileRes.data?.role || '',
        brokerRole: brokerRes.data?.role || '',
    }
}

// POST /api/teams/[id]/members — add broker to team
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { profileRole, brokerRole } = await getCallerRoles(user.id)
        const canManage =
            ADMIN_ROLES.includes(profileRole) ||
            brokerRole === 'broker_manager' ||
            brokerRole === 'admin'

        if (!canManage) {
            return NextResponse.json({ error: 'Permissão negada' }, { status: 403 })
        }

        const { id: teamId } = await params
        const body = await request.json()
        const { broker_id, role = 'member' } = body

        if (!broker_id) {
            return NextResponse.json({ error: 'broker_id é obrigatório' }, { status: 400 })
        }

        // Fetch broker to get user_id
        const { data: broker, error: brokerErr } = await supabaseAdmin
            .from('brokers')
            .select('id, user_id, name')
            .eq('id', broker_id)
            .single()

        if (brokerErr || !broker) {
            return NextResponse.json({ error: 'Corretor não encontrado' }, { status: 404 })
        }

        const { data, error } = await supabaseAdmin
            .from('team_members')
            .upsert({
                team_id: teamId,
                user_id: broker.user_id,
                broker_id: broker.id,
                role,
                joined_at: new Date().toISOString(),
            }, { onConflict: 'team_id,user_id' })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data }, { status: 201 })
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Internal Server Error' },
            { status: 500 }
        )
    }
}

// DELETE /api/teams/[id]/members?broker_id=... — remove broker from team
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { profileRole, brokerRole } = await getCallerRoles(user.id)
        const canManage =
            ADMIN_ROLES.includes(profileRole) ||
            brokerRole === 'broker_manager' ||
            brokerRole === 'admin'

        if (!canManage) {
            return NextResponse.json({ error: 'Permissão negada' }, { status: 403 })
        }

        const { id: teamId } = await params
        const brokerId = request.nextUrl.searchParams.get('broker_id')

        if (!brokerId) {
            return NextResponse.json({ error: 'broker_id é obrigatório' }, { status: 400 })
        }

        const { error } = await supabaseAdmin
            .from('team_members')
            .delete()
            .eq('team_id', teamId)
            .eq('broker_id', brokerId)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Internal Server Error' },
            { status: 500 }
        )
    }
}

