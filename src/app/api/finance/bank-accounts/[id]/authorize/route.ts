import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isFinanceAdmin } from '@/lib/finance/auth'
import { readBtgConfig } from '@/lib/btg/config'
import { buildAuthorizationUrl } from '@/lib/btg/auth'

const RETURN_PAGE = '/backoffice/financeiro/comissoes'

function redirectWithError(request: NextRequest, message: string) {
  const url = new URL(RETURN_PAGE, request.url)
  url.searchParams.set('btg_error', message)
  return NextResponse.redirect(url)
}

/** GET — inicia o fluxo OAuth2 Authorization Code (consentimento do titular da conta BTG). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirectWithError(request, 'Faça login para conectar a conta bancária')
  if (!(await isFinanceAdmin(user.id))) return redirectWithError(request, 'Acesso negado')

  const { data: account } = await supabaseAdmin
    .from('bank_accounts')
    .select('id, provider, env_prefix')
    .eq('id', id)
    .single()
  if (!account) return redirectWithError(request, 'Conta bancária não encontrada')
  if (account.provider !== 'btg_empresas_api') {
    return redirectWithError(request, 'Esta conta usa conector manual — não há autorização de API a fazer')
  }

  const config = account.env_prefix ? readBtgConfig(account.env_prefix) : null
  if (!config) {
    return redirectWithError(request, `Configure ${account.env_prefix}_CLIENT_ID e ${account.env_prefix}_CLIENT_SECRET antes de conectar`)
  }
  if (!config.redirectUri) {
    return redirectWithError(request, `Configure ${account.env_prefix}_REDIRECT_URI (URL deste app + /api/finance/btg/callback)`)
  }

  const authUrl = buildAuthorizationUrl(config, id)
  return NextResponse.redirect(authUrl)
}
