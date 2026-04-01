import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabaseAdmin
        .from('bpo_empresas')
        .select('id, nome, cnpj, ativo')
        .eq('ativo', true)
        .order('nome')

    if (error) return NextResponse.json([], { status: 200 })
    return NextResponse.json(data ?? [])
}
