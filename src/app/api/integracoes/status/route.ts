import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── Mapeamento de integrações → variáveis de ambiente ─────────
// Se a env var existir, a integração é automaticamente "conectado"
const ENV_VAR_MAP: Record<string, string[]> = {
  anthropic_claude:  ['ANTHROPIC_API_KEY'],
  openai_gpt:        ['OPENAI_API_KEY'],
  google_gemini_ai:  ['GOOGLE_AI_API_KEY'],
  xai_grok:          ['XAI_API_KEY'],
  groq_ai:           ['GROQ_API_KEY'],
  azure_openai:      ['AZURE_OPENAI_API_KEY'],
  resend:            ['RESEND_API_KEY'],
  stripe:            ['STRIPE_SECRET_KEY'],
  mercadopago:       ['MP_ACCESS_TOKEN'],
  meta_ads:          ['META_ACCESS_TOKEN'],
  evolution_api:     ['EVOLUTION_API_KEY', 'EVOLUTION_API_URL'],
  zapi:              ['ZAPI_TOKEN', 'ZAPI_INSTANCE'],
  google_analytics:  ['GA_PROPERTY_ID', 'NEXT_PUBLIC_GA_MEASUREMENT_ID'],
  supabase_storage:  ['NEXT_PUBLIC_SUPABASE_URL'],
  clicksign:         ['CLICKSIGN_ACCESS_TOKEN'],
  n8n:               ['N8N_WEBHOOK_URL'],
  linkedin_ads:      ['LINKEDIN_ACCESS_TOKEN'],
  tiktok_ads:        ['TIKTOK_ACCESS_TOKEN'],
}

function getEnvDetectedStatuses(): Record<string, 'conectado'> {
  const result: Record<string, 'conectado'> = {}
  for (const [integrationId, envVars] of Object.entries(ENV_VAR_MAP)) {
    // If ALL required env vars are set and non-empty, mark as connected
    const allSet = envVars.every(v => {
      const val = process.env[v]
      return val && val.length > 3 && !val.startsWith('xxx') && !val.startsWith('sk-ant-api03-xxx')
    })
    if (allSet) {
      result[integrationId] = 'conectado'
    }
  }
  return result
}

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('integration_configs')
    .select('integration_id, status, config, updated_at')

  // Start with env-detected statuses
  const envStatuses = getEnvDetectedStatuses()
  const envEntries: Array<{ integration_id: string; status: string; config: any; updated_at: string | null; source: string }> = Object.entries(envStatuses).map(([id, status]) => ({
    integration_id: id,
    status,
    config: null,
    updated_at: null,
    source: 'env',
  }))

  if (error) {
    // Table may not exist yet — return env-detected only
    return NextResponse.json({ data: envEntries })
  }

  // Merge: DB records take precedence, env-detected fill gaps
  const merged = [...envEntries]

  for (const row of data || []) {
    // DB record overrides env detection
    const existing = merged.findIndex(e => e.integration_id === row.integration_id)
    if (existing >= 0) {
      merged[existing] = { ...row, source: 'db' }
    } else {
      merged.push({ ...row, source: 'db' })
    }
  }

  return NextResponse.json({ data: merged })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { integration_id, config, status } = body

  const { data, error } = await supabase
    .from('integration_configs')
    .upsert({
      integration_id,
      config: config || {},
      status: status || 'configurado',
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }, { onConflict: 'integration_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
