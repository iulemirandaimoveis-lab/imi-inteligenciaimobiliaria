// src/app/api/finance/commissions/reconciliation/route.ts
// ── Concilia commission_repasses (IMI × imobiliárias parceiras) com bank_transactions ─
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isFinanceManager } from '@/lib/finance/auth'
import { computeMatchScore } from '@/lib/finance/matching'

const AUTO_CONFIRM_THRESHOLD = 90
const MAX_SUGGESTIONS_PER_REPASSE = 3

interface RepasseRow {
  id: string
  agency_id: string
  empreendimento_nome: string
  cliente_nome: string | null
  valor_venda: number
  valor_comissao_bruta: number
  valor_repasse_liquido: number | null
  status: string
  data_venda: string | null
  data_repasse_prevista: string | null
  data_repasse_realizada: string | null
  partner_agencies: { name: string; cnpj: string | null } | null
}

interface TxRow {
  id: string
  amount: number
  transaction_type: string
  transaction_date: string
  description: string | null
  counterparty_name: string | null
  counterparty_document: string | null
  reconciled: boolean
  bank_account_id: string
}

const PENDING_STATUSES = ['pago_pela_construtora', 'repasse_disponivel']

async function loadRejectedPairs(repasseIds: string[]) {
  if (repasseIds.length === 0) return new Set<string>()
  const { data } = await supabaseAdmin
    .from('commission_reconciliations')
    .select('repasse_id, bank_transaction_id')
    .in('repasse_id', repasseIds)
    .eq('status', 'rejeitado')
  return new Set((data ?? []).map((r) => `${r.repasse_id}:${r.bank_transaction_id}`))
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!(await isFinanceManager(user.id))) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const agencyId = request.nextUrl.searchParams.get('agency_id')

  let repasseQuery = supabaseAdmin
    .from('commission_repasses')
    .select(`
      id, agency_id, empreendimento_nome, cliente_nome, valor_venda,
      valor_comissao_bruta, valor_repasse_liquido, status,
      data_venda, data_repasse_prevista, data_repasse_realizada,
      partner_agencies ( name, cnpj )
    `)
    .order('data_repasse_prevista', { ascending: true, nullsFirst: false })
    .limit(300)
  if (agencyId) repasseQuery = repasseQuery.eq('agency_id', agencyId)

  const { data: repassesRaw, error: repasseErr } = await repasseQuery
  if (repasseErr) return NextResponse.json({ error: repasseErr.message }, { status: 500 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const repasses = (repassesRaw ?? []) as any as RepasseRow[]

  const { data: unreconciledRaw, error: txErr } = await supabaseAdmin
    .from('bank_transactions')
    .select('id, amount, transaction_type, transaction_date, description, counterparty_name, counterparty_document, reconciled, bank_account_id')
    .eq('reconciled', false)
    .eq('transaction_type', 'credito')
    .order('transaction_date', { ascending: false })
    .limit(500)
  if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 })
  const unreconciled = (unreconciledRaw ?? []) as TxRow[]

  const pendingRepasses = repasses.filter((r) => PENDING_STATUSES.includes(r.status))
  const rejectedPairs = await loadRejectedPairs(pendingRepasses.map((r) => r.id))

  const pending = pendingRepasses.map((r) => {
    const dueDate = r.data_repasse_prevista || r.data_venda
    const amount = Number(r.valor_repasse_liquido ?? r.valor_comissao_bruta)
    const suggestions = unreconciled
      .filter((tx) => !rejectedPairs.has(`${r.id}:${tx.id}`))
      .map((tx) => {
        const { score, method } = computeMatchScore({
          repasseAmount: amount,
          repasseDueDate: dueDate,
          txAmount: Number(tx.amount),
          txDate: tx.transaction_date,
          txCounterpartyName: tx.counterparty_name,
          txCounterpartyDocument: tx.counterparty_document,
          agencyName: r.partner_agencies?.name ?? null,
          agencyDocument: r.partner_agencies?.cnpj ?? null,
        })
        return { transaction: tx, score, method }
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_SUGGESTIONS_PER_REPASSE)

    return {
      id: r.id,
      agency_id: r.agency_id,
      agency_name: r.partner_agencies?.name ?? null,
      empreendimento_nome: r.empreendimento_nome,
      cliente_nome: r.cliente_nome,
      valor_esperado: amount,
      status: r.status,
      data_venda: r.data_venda,
      data_repasse_prevista: r.data_repasse_prevista,
      suggestions,
    }
  })

  const { data: reconciledHistoryRaw } = await supabaseAdmin
    .from('commission_repasses')
    .select(`
      id, empreendimento_nome, cliente_nome, valor_repasse_liquido, valor_comissao_bruta,
      data_repasse_realizada, partner_agencies ( name )
    `)
    .eq('status', 'repassado')
    .order('data_repasse_realizada', { ascending: false })
    .limit(50)

  const stats = {
    pendentes: pending.length,
    valor_pendente: pending.reduce((s, r) => s + r.valor_esperado, 0),
    conciliados: (reconciledHistoryRaw ?? []).length,
    transacoes_nao_conciliadas: unreconciled.length,
  }

  return NextResponse.json({ pending, history: reconciledHistoryRaw ?? [], stats })
}

const ReconciliationActionSchema = z.object({
  action: z.enum(['confirm', 'reject', 'auto_match']),
  repasse_id: z.string().uuid().optional(),
  bank_transaction_id: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
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
  const parsed = ReconciliationActionSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }
  const { action, repasse_id, bank_transaction_id, notes } = parsed.data

  if (action === 'confirm' || action === 'reject') {
    if (!repasse_id || !bank_transaction_id) {
      return NextResponse.json({ error: 'repasse_id e bank_transaction_id são obrigatórios' }, { status: 400 })
    }

    if (action === 'reject') {
      const { error } = await supabaseAdmin
        .from('commission_reconciliations')
        .upsert({
          repasse_id, bank_transaction_id, status: 'rejeitado', notes: notes ?? null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'repasse_id,bank_transaction_id' })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    // confirm
    const { data: tx, error: txErr } = await supabaseAdmin
      .from('bank_transactions')
      .select('id, transaction_date, reconciled')
      .eq('id', bank_transaction_id)
      .single()
    if (txErr || !tx) return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    if (tx.reconciled) return NextResponse.json({ error: 'Esta transação já está conciliada com outro repasse' }, { status: 409 })

    const { error: reconErr } = await supabaseAdmin
      .from('commission_reconciliations')
      .upsert({
        repasse_id, bank_transaction_id, status: 'confirmado', score_match: 100,
        metodo_match: 'manual', confirmed_by: user.id, confirmed_at: new Date().toISOString(),
        notes: notes ?? null, updated_at: new Date().toISOString(),
      }, { onConflict: 'repasse_id,bank_transaction_id' })
    if (reconErr) {
      return NextResponse.json({ error: 'Este repasse já foi conciliado com outra transação' }, { status: 409 })
    }

    await supabaseAdmin.from('bank_transactions').update({ reconciled: true }).eq('id', bank_transaction_id)
    const { data: updatedRepasse, error: repasseUpdateErr } = await supabaseAdmin
      .from('commission_repasses')
      .update({ status: 'repassado', data_repasse_realizada: tx.transaction_date, updated_at: new Date().toISOString() })
      .eq('id', repasse_id)
      .select()
      .single()
    if (repasseUpdateErr) return NextResponse.json({ error: repasseUpdateErr.message }, { status: 500 })

    return NextResponse.json({ data: updatedRepasse })
  }

  // auto_match — roda o motor de score em todos os repasses pendentes
  const { data: repassesRaw } = await supabaseAdmin
    .from('commission_repasses')
    .select(`
      id, valor_comissao_bruta, valor_repasse_liquido, status, data_venda, data_repasse_prevista,
      partner_agencies ( name, cnpj )
    `)
    .in('status', PENDING_STATUSES)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const repasses = (repassesRaw ?? []) as any as RepasseRow[]

  const { data: unreconciledRaw } = await supabaseAdmin
    .from('bank_transactions')
    .select('id, amount, transaction_date, counterparty_name, counterparty_document, reconciled')
    .eq('reconciled', false)
    .eq('transaction_type', 'credito')
  const unreconciled = (unreconciledRaw ?? []) as TxRow[]

  const rejectedPairs = await loadRejectedPairs(repasses.map((r) => r.id))
  let autoConfirmed = 0
  let suggested = 0

  for (const r of repasses) {
    const dueDate = r.data_repasse_prevista || r.data_venda
    const amount = Number(r.valor_repasse_liquido ?? r.valor_comissao_bruta)
    let best: { tx: TxRow; score: number; method: string } | null = null
    for (const tx of unreconciled) {
      if (tx.reconciled) continue
      if (rejectedPairs.has(`${r.id}:${tx.id}`)) continue
      const { score, method } = computeMatchScore({
        repasseAmount: amount,
        repasseDueDate: dueDate,
        txAmount: Number(tx.amount),
        txDate: tx.transaction_date,
        txCounterpartyName: tx.counterparty_name,
        txCounterpartyDocument: tx.counterparty_document,
        agencyName: r.partner_agencies?.name ?? null,
        agencyDocument: r.partner_agencies?.cnpj ?? null,
      })
      if (score > 0 && (!best || score > best.score)) best = { tx, score, method }
    }
    if (!best) continue

    if (best.score >= AUTO_CONFIRM_THRESHOLD) {
      const { error: reconErr } = await supabaseAdmin
        .from('commission_reconciliations')
        .upsert({
          repasse_id: r.id, bank_transaction_id: best.tx.id, status: 'confirmado',
          score_match: best.score, metodo_match: best.method,
          confirmed_by: user.id, confirmed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }, { onConflict: 'repasse_id,bank_transaction_id' })
      if (!reconErr) {
        await supabaseAdmin.from('bank_transactions').update({ reconciled: true }).eq('id', best.tx.id)
        await supabaseAdmin
          .from('commission_repasses')
          .update({ status: 'repassado', data_repasse_realizada: best.tx.transaction_date, updated_at: new Date().toISOString() })
          .eq('id', r.id)
        best.tx.reconciled = true
        autoConfirmed++
      }
    } else {
      await supabaseAdmin
        .from('commission_reconciliations')
        .upsert({
          repasse_id: r.id, bank_transaction_id: best.tx.id, status: 'sugerido',
          score_match: best.score, metodo_match: best.method, updated_at: new Date().toISOString(),
        }, { onConflict: 'repasse_id,bank_transaction_id' })
      suggested++
    }
  }

  return NextResponse.json({ auto_confirmed: autoConfirmed, suggested, evaluated: repasses.length })
}
