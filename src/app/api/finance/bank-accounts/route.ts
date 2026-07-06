// src/app/api/finance/bank-accounts/route.ts
// ── Contas bancárias da IMI (BTG PF/PJ) — cadastro e status de conexão ───────
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isFinanceAdmin, isFinanceManager } from '@/lib/finance/auth'

const BankAccountCreateSchema = z.object({
  label: z.string().min(1),
  holder_type: z.enum(['pf', 'pj']),
  holder_name: z.string().optional(),
  holder_document: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  provider: z.enum(['manual', 'btg_empresas_api']).default('manual'),
  env_prefix: z.string().optional(),
  notes: z.string().optional(),
})

const SELECT_COLUMNS =
  'id, label, holder_type, holder_name, holder_document, bank_code, bank_name, agencia, conta, provider, env_prefix, connection_status, last_sync_at, last_sync_error, active, notes, created_at, updated_at'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!(await isFinanceManager(user.id))) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('bank_accounts')
    .select(SELECT_COLUMNS)
    .order('holder_type', { ascending: true })

  if (error) return NextResponse.json({ error: error.message, data: [] }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!(await isFinanceAdmin(user.id))) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  let rawBody: unknown
  try { rawBody = await request.json() } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  const parsed = BankAccountCreateSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('bank_accounts')
    .insert({ ...parsed.data, connection_status: 'not_connected', created_by: user.id })
    .select(SELECT_COLUMNS)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
