import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const [{ count: imoveis }, { count: leads }] = await Promise.all([
            supabase.from('developments').select('*', { count: 'exact', head: true }),
            supabase.from('leads').select('*', { count: 'exact', head: true }),
        ])

        return NextResponse.json({ imoveis: imoveis ?? 0, leads: leads ?? 0 })
    } catch {
        return NextResponse.json({ imoveis: 0, leads: 0 })
    }
}
