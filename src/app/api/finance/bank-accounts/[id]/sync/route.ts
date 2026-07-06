import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isFinanceAdmin } from '@/lib/finance/auth'
import { readBtgConfig } from '@/lib/btg/config'
import { getClientCredentialsToken, refreshAccessToken, BtgAuthError } from '@/lib/btg/auth'
import { fetchBtgStatement, BtgStatementError } from '@/lib/btg/statement'

const SyncSchema = z.object({ days: z.number().int().min(1).max(180).default(30) })

async function resolveAccessToken(bankAccountId: string, config: ReturnType<typeof readBtgConfig>) {
  if (!config) throw new BtgAuthError('Configuração BTG ausente')

  const { data: stored } = await supabaseAdmin
    .from('bank_oauth_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('bank_account_id', bankAccountId)
    .maybeSingle()

  if (stored) {
    const expiresAt = new Date(stored.expires_at).getTime()
    if (expiresAt > Date.now() + 30_000) return stored.access_token as string
    if (stored.refresh_token) {
      const refreshed = await refreshAccessToken(config, stored.refresh_token)
      await supabaseAdmin
        .from('bank_oauth_tokens')
        .update({
          access_token: refreshed.accessToken,
          refresh_token: refreshed.refreshToken ?? stored.refresh_token,
          expires_at: refreshed.expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('bank_account_id', bankAccountId)
      return refreshed.accessToken
    }
  }

  // Sem token de Authorization Code guardado — tenta client_credentials (pode não
  // ter escopo de Banking API; o erro retornado deixa isso claro para o usuário).
  return getClientCredentialsToken(config)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!(await isFinanceAdmin(user.id))) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  let body: unknown = {}
  try { body = await request.json() } catch { /* corpo opcional */ }
  const parsed = SyncSchema.safeParse(body ?? {})
  const days = parsed.success ? parsed.data.days : 30

  const { data: account, error: fetchErr } = await supabaseAdmin
    .from('bank_accounts')
    .select('id, provider, env_prefix')
    .eq('id', id)
    .single()
  if (fetchErr || !account) return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })
  if (account.provider !== 'btg_empresas_api') {
    return NextResponse.json({ error: 'Conta usa conector manual — use "Importar extrato (CSV)"' }, { status: 400 })
  }

  const config = account.env_prefix ? readBtgConfig(account.env_prefix) : null
  if (!config) {
    return NextResponse.json({ error: `Configure ${account.env_prefix}_CLIENT_ID/SECRET antes de sincronizar` }, { status: 400 })
  }

  const to = new Date().toISOString().slice(0, 10)
  const from = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)

  try {
    const token = await resolveAccessToken(id, config)
    const transactions = await fetchBtgStatement(config, token, { from, to })

    let inserted = 0
    for (const tx of transactions) {
      const { error: upsertErr, data: upserted } = await supabaseAdmin
        .from('bank_transactions')
        .upsert({
          bank_account_id: id,
          external_id: tx.externalId,
          source: 'btg_api',
          amount: tx.amount,
          transaction_type: tx.type,
          description: tx.description,
          counterparty_name: tx.counterpartyName,
          counterparty_document: tx.counterpartyDocument,
          transaction_date: tx.date,
          raw_payload: tx.raw,
        }, { onConflict: 'bank_account_id,external_id', ignoreDuplicates: true })
        .select('id')
      if (!upsertErr && upserted && upserted.length > 0) inserted++
    }

    await supabaseAdmin
      .from('bank_accounts')
      .update({ connection_status: 'connected', last_sync_at: new Date().toISOString(), last_sync_error: null, updated_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ ok: true, fetched: transactions.length, inserted, range: { from, to } })
  } catch (err) {
    const message = err instanceof BtgAuthError || err instanceof BtgStatementError
      ? err.message
      : 'Falha ao sincronizar extrato'
    await supabaseAdmin
      .from('bank_accounts')
      .update({ connection_status: 'error', last_sync_error: message, updated_at: new Date().toISOString() })
      .eq('id', id)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
