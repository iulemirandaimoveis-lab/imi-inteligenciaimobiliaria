import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isFinanceAdmin } from '@/lib/finance/auth'
import { readBtgConfig } from '@/lib/btg/config'
import { getClientCredentialsToken, BtgAuthError } from '@/lib/btg/auth'

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!(await isFinanceAdmin(user.id))) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { data: account, error: fetchErr } = await supabaseAdmin
    .from('bank_accounts')
    .select('id, provider, env_prefix')
    .eq('id', id)
    .single()
  if (fetchErr || !account) return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })

  if (account.provider !== 'btg_empresas_api') {
    return NextResponse.json({
      ok: false,
      error: 'Esta conta usa conector manual (importação de extrato) — não há teste de conexão de API.',
    })
  }

  const prefix = account.env_prefix as string | null
  const config = prefix ? readBtgConfig(prefix) : null
  if (!config) {
    return NextResponse.json({
      ok: false,
      error: prefix
        ? `Variáveis ${prefix}_CLIENT_ID / ${prefix}_CLIENT_SECRET não configuradas.`
        : 'Conta sem env_prefix configurado.',
    })
  }

  try {
    await getClientCredentialsToken(config)
    await supabaseAdmin
      .from('bank_accounts')
      .update({ connection_status: 'connected', last_sync_error: null, updated_at: new Date().toISOString() })
      .eq('id', id)
    return NextResponse.json({
      ok: true,
      message: 'Credenciais válidas (client_credentials). Para ler saldo/extrato, conclua a autorização (Conectar) — o BTG exige consentimento do titular para Banking APIs.',
    })
  } catch (err) {
    const message = err instanceof BtgAuthError ? err.message : 'Falha ao testar conexão'
    await supabaseAdmin
      .from('bank_accounts')
      .update({ connection_status: 'error', last_sync_error: message, updated_at: new Date().toISOString() })
      .eq('id', id)
    return NextResponse.json({ ok: false, error: message })
  }
}
