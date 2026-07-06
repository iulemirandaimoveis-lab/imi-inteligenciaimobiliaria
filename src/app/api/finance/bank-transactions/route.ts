import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isFinanceManager } from '@/lib/finance/auth'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!(await isFinanceManager(user.id))) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const sp = request.nextUrl.searchParams
  const bankAccountId = sp.get('bank_account_id')
  const reconciled = sp.get('reconciled')
  const limit = Math.min(parseInt(sp.get('limit') ?? '100', 10), 500)

  let query = supabaseAdmin
    .from('bank_transactions')
    .select('id, bank_account_id, external_id, source, amount, transaction_type, description, counterparty_name, counterparty_document, transaction_date, reconciled, created_at')
    .order('transaction_date', { ascending: false })
    .limit(limit)

  if (bankAccountId) query = query.eq('bank_account_id', bankAccountId)
  if (reconciled === 'true') query = query.eq('reconciled', true)
  if (reconciled === 'false') query = query.eq('reconciled', false)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message, data: [] }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}
