import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
export async function GET(request: NextRequest) {
    try {
        // Auth check
        const supabase = await createClient()
        const { data: { user }, error: sessionErr } = await supabase.auth.getUser()
        if (sessionErr || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }
        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status') || 'all'
        // Self-heal: ensure authenticated user exists in brokers table
        // This handles the case where an admin created their auth account but
        // was never inserted into brokers — they should appear in the equipe list
        const { data: existingBroker } = await supabaseAdmin
            .from('brokers')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle()
        if (!existingBroker) {
            const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin'
            // Check role from users table
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle()
            const role = (profile?.role || '').toLowerCase()
            const brokerRole = (role === 'admin' || role === 'manager') ? 'broker_manager' : 'broker'
            try {
                await supabaseAdmin.from('brokers').insert({
                    user_id: user.id,
                    name,
                    email: user.email || '',
                    status: 'active',
                    role: brokerRole,
                    permissions: ['dashboard', 'imoveis', 'leads', 'agenda', 'avaliacoes', 'financeiro', 'contratos', 'campanhas', 'conteudo', 'tracking', 'relatorios'],
                    avatar_url: user.user_metadata?.avatar_url || null,
                })
            } catch {
                // Ignore — might fail on unique constraint if race condition
            }
        }

        let query = supabaseAdmin
            .from('brokers')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
        if (search) {
            const safe = search.replace(/[%_,.()*!]/g, '').trim()
            if (safe) {
                query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%`)
            }
        }
        if (status && status !== 'all') {
            query = query.eq('status', status)
        }
        const { data, error, count } = await query
        if (error) {
            return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
        }
        return NextResponse.json({ data: data || [], count: count || 0 }, {
            headers: { 'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=300' },
        })
    } catch (err: unknown) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
