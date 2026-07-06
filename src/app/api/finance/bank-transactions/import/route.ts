// src/app/api/finance/bank-transactions/import/route.ts
// ── Importação manual de extrato (CSV) — caminho que funciona hoje para PF e PJ ─
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isFinanceManager } from '@/lib/finance/auth'
import { parseStatementCsv, StatementCsvError } from '@/lib/btg/csv-import'

const ImportSchema = z.object({
  bank_account_id: z.string().uuid(),
  csv_content: z.string().min(1).max(2_000_000),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!(await isFinanceManager(user.id))) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  let rawBody: unknown
  try { rawBody = await request.json() } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  const parsed = ImportSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }
  const { bank_account_id, csv_content } = parsed.data

  const { data: account } = await supabaseAdmin
    .from('bank_accounts')
    .select('id')
    .eq('id', bank_account_id)
    .single()
  if (!account) return NextResponse.json({ error: 'Conta bancária não encontrada' }, { status: 404 })

  let transactions
  let warnings: string[]
  try {
    const parsedCsv = parseStatementCsv(csv_content)
    transactions = parsedCsv.transactions
    warnings = parsedCsv.warnings
  } catch (err) {
    const message = err instanceof StatementCsvError ? err.message : 'Erro ao ler o CSV'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (transactions.length === 0) {
    return NextResponse.json({ error: 'Nenhum lançamento válido encontrado no CSV', warnings }, { status: 400 })
  }

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from('bank_transactions')
    .insert(transactions.map((tx) => ({
      bank_account_id,
      external_id: null,
      source: 'manual_csv',
      amount: tx.amount,
      transaction_type: tx.type,
      description: tx.description,
      counterparty_name: tx.counterpartyName,
      counterparty_document: tx.counterpartyDocument,
      transaction_date: tx.date,
      raw_payload: tx.raw,
    })))
    .select('id')

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  return NextResponse.json({ inserted: inserted?.length ?? 0, warnings }, { status: 201 })
}
