import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SIGNATURE_KEYS } from '@/features/proposals/signature/config'
import type { SignatureProviderId } from '@/features/proposals/signature'

export const dynamic = 'force-dynamic'

/**
 * Configuração dos provedores de assinatura pelo BACKOFFICE.
 * GET  → estado mascarado (sem expor segredos) de Clicksign/DocuSign.
 * POST → salva credenciais de um provedor + define o ativo. Admin/manager.
 *
 * Segredos gravados em `integrations.secret_value` (RLS admin/manager) via
 * service_role. Nunca retornamos o secret cru — apenas um hint mascarado.
 */

function mask(s: string | null | undefined): string | null {
  if (!s) return null
  return s.length <= 4 ? '••••' : '••••' + s.slice(-4)
}

async function requireManager() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.', status: 401 as const }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'manager'].includes(profile.role)) {
    return { error: 'Apenas admin/gestor podem configurar integrações.', status: 403 as const }
  }
  return { userId: user.id }
}

export async function GET() {
  const auth = await requireManager()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { data } = await supabaseAdmin
    .from('integrations')
    .select('key_name, provider, secret_value, metadata, is_active, status, last_tested_at')
    .eq('category', 'signature')

  const rows = data ?? []
  const build = (provider: SignatureProviderId) => {
    const r = rows.find(x => x.provider === provider)
    return {
      configured: !!r?.secret_value,
      active: !!r?.is_active,
      secretHint: mask(r?.secret_value),
      metadata: r?.metadata ?? {},
      status: r?.status ?? 'nao_configurado',
      lastTestedAt: r?.last_tested_at ?? null,
    }
  }

  return NextResponse.json({
    clicksign: build('clicksign'),
    docusign: build('docusign'),
    activeProvider: rows.find(x => x.is_active)?.provider ?? null,
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireManager()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json().catch(() => ({}))
  const provider = body.provider as SignatureProviderId
  if (provider !== 'clicksign' && provider !== 'docusign') {
    return NextResponse.json({ error: 'Provedor inválido.' }, { status: 400 })
  }

  const keyName = SIGNATURE_KEYS[provider]
  const metadata =
    provider === 'clicksign'
      ? { baseUrl: body.baseUrl ?? 'https://app.clicksign.com', webhookSecret: body.webhookSecret ?? '' }
      : { baseUri: body.baseUri ?? '', accountId: body.accountId ?? '', webhookSecret: body.webhookSecret ?? '' }

  // Upsert manual por key_name (não depende de unique constraint).
  const { data: existing } = await supabaseAdmin
    .from('integrations')
    .select('id, secret_value, metadata')
    .eq('key_name', keyName)
    .maybeSingle()

  // Mantém o segredo atual se o body não enviar um novo (edição sem reexpor).
  const secretValue = body.secret && String(body.secret).length > 0
    ? String(body.secret)
    : existing?.secret_value ?? null

  const mergedMeta = { ...(existing?.metadata ?? {}), ...metadata }
  const makeActive = body.active === true

  const payload = {
    key_name: keyName,
    display_name: provider === 'clicksign' ? 'Clicksign' : 'DocuSign',
    provider,
    category: 'signature',
    secret_value: secretValue,
    metadata: mergedMeta,
    is_active: makeActive,
    status: secretValue ? 'configured' : null,
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    const { error } = await supabaseAdmin.from('integrations').update(payload).eq('id', existing.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabaseAdmin.from('integrations').insert(payload)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Apenas UM provedor ativo: desativa os demais de assinatura.
  if (makeActive) {
    await supabaseAdmin
      .from('integrations')
      .update({ is_active: false })
      .eq('category', 'signature')
      .neq('key_name', keyName)
  }

  return NextResponse.json({ ok: true })
}
