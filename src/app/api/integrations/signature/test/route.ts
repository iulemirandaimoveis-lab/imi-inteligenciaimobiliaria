import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveSignatureProvider, SignatureNotConfiguredError, SignatureProviderId } from '@/features/proposals/signature'
import { SIGNATURE_KEYS } from '@/features/proposals/signature/config'

export const dynamic = 'force-dynamic'

/**
 * POST /api/integrations/signature/test  { provider }
 * Testa a conectividade/credenciais do provedor (best-effort) e grava o status.
 * Admin/manager.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Apenas admin/gestor.' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const provider = body.provider as SignatureProviderId
  if (provider !== 'clicksign' && provider !== 'docusign') {
    return NextResponse.json({ error: 'Provedor inválido.' }, { status: 400 })
  }

  let ok = false
  let message = ''
  try {
    const p = await resolveSignatureProvider(provider)
    // Chamada autenticada mínima: consultar um envelope inexistente.
    // 404 ⇒ credenciais válidas e API acessível. 401/403 ⇒ credenciais inválidas.
    await p.getStatus('imi-connectivity-check')
    ok = true
    message = 'Conexão OK.'
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (e instanceof SignatureNotConfiguredError) {
      message = 'Credenciais ausentes. Configure o token antes de testar.'
    } else if (/401|403|unauthor|invalid/i.test(msg)) {
      message = 'Credenciais inválidas (não autorizado).'
    } else if (/404|not.?found/i.test(msg)) {
      ok = true
      message = 'Conexão OK (autenticado).'
    } else {
      message = `Falha ao testar: ${msg.slice(0, 160)}`
    }
  }

  await supabaseAdmin
    .from('integrations')
    .update({ status: ok ? 'valid' : 'invalid', last_tested_at: new Date().toISOString() })
    .eq('key_name', SIGNATURE_KEYS[provider])

  return NextResponse.json({ ok, message })
}
