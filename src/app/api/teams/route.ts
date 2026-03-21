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

        // Check user role via profiles or brokers
        const { data: profile } = await supabaseAdmin
            .from('brokers')
            .select('role, team_id')
            .eq('user_id', user.id)
            .single()

        const isAdminOrManager = profile?.role === 'admin' || profile?.role === 'manager'

        let query = supabaseAdmin
            .from('teams')
            .select('*', { count: 'exact' })
            .eq('is_active', true)
            .order('name', { ascending: true })

        // Non-admin users only see their own team
        if (!isAdminOrManager && profile?.team_id) {
            query = query.eq('id', profile.team_id)
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,region.ilike.%${search}%,specialty.ilike.%${search}%`)
        }

        const { data, error, count } = await query

        if (error) {
            return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
        }

        return NextResponse.json({ data: data || [], count: count || 0 })
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
            .from('brokers')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (profile?.role !== 'admin' && profile?.role !== 'manager') {
            return NextResponse.json({ error: 'Permissão negada' }, { status: 403 })
        }

        const body = await request.json()
        const { name, description, region, specialty, commission_rules, leader_id } = body

        if (!name?.trim()) {
            return NextResponse.json({ error: 'name é obrigatório' }, { status: 400 })
        }

        // Look up leader name if leader_id provided
        let leaderName: string | null = null
        if (leader_id) {
            const { data: leader } = await supabaseAdmin
                .from('brokers')
                .select('name')
                .eq('id', leader_id)
                .single()
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
                member_count: 0,
                active_listings: 0,
                monthly_volume: 0,
                is_active: true,
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
        }

        return NextResponse.json({ data: team }, { status: 201 })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
    }
}
