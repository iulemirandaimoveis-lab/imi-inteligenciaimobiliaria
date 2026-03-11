import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Integrations that can be detected from environment variables (server-side only)
const ENV_DETECTION: Array<{ id: string; envKeys: string[]; label?: string }> = [
  { id: 'anthropic_claude', envKeys: ['ANTHROPIC_API_KEY'] },
  { id: 'meta_ads',         envKeys: ['META_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID'] },
  { id: 'openai_gpt',       envKeys: ['OPENAI_API_KEY'] },
  { id: 'google_gemini_ai', envKeys: ['GOOGLE_AI_API_KEY'] },
  { id: 'groq_ai',          envKeys: ['GROQ_API_KEY'] },
  { id: 'resend',           envKeys: ['RESEND_API_KEY'] },
  { id: 'stripe',           envKeys: ['STRIPE_SECRET_KEY'] },
  { id: 'mercadopago',      envKeys: ['MP_ACCESS_TOKEN'] },
  { id: 'evolution_api',    envKeys: ['EVOLUTION_API_URL', 'EVOLUTION_API_KEY'] },
  { id: 'zapi',             envKeys: ['ZAPI_INSTANCE', 'ZAPI_TOKEN'] },
  { id: 'google_calendar',  envKeys: ['GCAL_CLIENT_ID', 'GCAL_CLIENT_SECRET'] },
  { id: 'google_drive',     envKeys: ['GDRIVE_FOLDER_ID'] },
  { id: 'gmail',            envKeys: ['GMAIL_USER'] },
]

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

        const statusMap: Record<string, string> = {}
        const configMap: Record<string, Record<string, unknown>> = {}
        const sourceMap: Record<string, 'db' | 'env'> = {}

        // 1. Load DB-saved configs
        for (const row of data || []) {
            statusMap[row.integration_id] = row.status || 'nao_configurado'
            configMap[row.integration_id] = (row.config as Record<string, unknown>) || {}
            sourceMap[row.integration_id] = 'db'
        }

        // 2. Overlay with env var detection (env wins if DB says nao_configurado)
        for (const { id, envKeys } of ENV_DETECTION) {
            const allSet = envKeys.every(k => !!process.env[k])
            if (allSet && (!statusMap[id] || statusMap[id] === 'nao_configurado')) {
                statusMap[id] = 'conectado'
                sourceMap[id] = 'env'
            }
        }

        return NextResponse.json({ statusMap, configMap, sourceMap })
    } catch (err) {
        console.error('[integracoes/status] Error:', err)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
