// src/app/api/integracoes/save/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const body = await req.json()
        const { integration_id, config } = body

        if (!integration_id) {
            return NextResponse.json({ error: 'integration_id obrigatório' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('integration_configs')
            .upsert({
                integration_id,
                config: config || {},
                status: 'conectado',
                updated_at: new Date().toISOString(),
                updated_by: user.id,
            }, { onConflict: 'integration_id' })
            .select()
            .single()

        if (error) {
            console.error('POST /api/integracoes/save:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data })
    } catch (err: any) {
        console.error('POST /api/integracoes/save:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
