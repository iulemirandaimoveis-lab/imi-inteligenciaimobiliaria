import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const { data, error } = await supabase
            .from('integration_configs')
            .select('integration_id, status, config, updated_at')

        if (error) {
            console.error('[integracoes/status] Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Return as map: { meta_ads: 'conectado', abacatepay: 'nao_configurado', ... }
        const statusMap: Record<string, string> = {}
        const configMap: Record<string, Record<string, unknown>> = {}
        for (const row of data || []) {
            statusMap[row.integration_id] = row.status || 'nao_configurado'
            configMap[row.integration_id] = (row.config as Record<string, unknown>) || {}
        }

        return NextResponse.json({ statusMap, configMap })
    } catch (err) {
        console.error('[integracoes/status] Error:', err)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
