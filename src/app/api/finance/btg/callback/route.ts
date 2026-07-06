import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { readBtgConfig } from '@/lib/btg/config'
import { verifyOAuthState, exchangeAuthorizationCode, BtgAuthError } from '@/lib/btg/auth'

const RETURN_PAGE = '/backoffice/financeiro/comissoes'

function redirectWithError(request: NextRequest, message: string) {
  const url = new URL(RETURN_PAGE, request.url)
  url.searchParams.set('btg_error', message)
  return NextResponse.redirect(url)
}

/**
 * GET — callback do OAuth2 Authorization Code do BTG Id.
 * Não exige sessão própria (o BTG faz o redirect); a segurança vem do `state`
 * assinado (HMAC) gerado em `authorize/route.ts`, que amarra o callback à
 * conta bancária que iniciou o fluxo.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const btgError = sp.get('error')
  if (btgError) {
    return redirectWithError(request, sp.get('error_description') || btgError)
  }

  const code = sp.get('code')
  const state = sp.get('state')
  if (!code || !state) return redirectWithError(request, 'Callback do BTG sem code/state')

  const bankAccountId = verifyOAuthState(state)
  if (!bankAccountId) return redirectWithError(request, 'State inválido — reinicie a conexão')

  const { data: account } = await supabaseAdmin
    .from('bank_accounts')
    .select('id, env_prefix')
    .eq('id', bankAccountId)
    .single()
  if (!account) return redirectWithError(request, 'Conta bancária não encontrada')

  const config = account.env_prefix ? readBtgConfig(account.env_prefix) : null
  if (!config) return redirectWithError(request, 'Configuração BTG ausente para esta conta')

  try {
    const tokens = await exchangeAuthorizationCode(config, code)
    await supabaseAdmin
      .from('bank_oauth_tokens')
      .upsert({
        bank_account_id: bankAccountId,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt,
        scope: tokens.scope,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'bank_account_id' })

    await supabaseAdmin
      .from('bank_accounts')
      .update({ connection_status: 'connected', last_sync_error: null, updated_at: new Date().toISOString() })
      .eq('id', bankAccountId)

    const url = new URL(RETURN_PAGE, request.url)
    url.searchParams.set('btg_connected', '1')
    return NextResponse.redirect(url)
  } catch (err) {
    const message = err instanceof BtgAuthError ? err.message : 'Falha ao trocar o código de autorização'
    await supabaseAdmin
      .from('bank_accounts')
      .update({ connection_status: 'error', last_sync_error: message, updated_at: new Date().toISOString() })
      .eq('id', bankAccountId)
    return redirectWithError(request, message)
  }
}
