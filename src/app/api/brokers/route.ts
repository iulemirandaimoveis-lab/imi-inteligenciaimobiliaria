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
        let query = supabaseAdmin
            .from('brokers')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
        }
        if (status && status !== 'all') {
            query = query.eq('status', status)
        }
        const { data, error, count } = await query
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ data: data || [], count: count || 0 })
    } catch (err: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
