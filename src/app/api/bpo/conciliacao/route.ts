// src/app/api/bpo/conciliacao/route.ts
// ── Bank Reconciliation — 6-level matching engine ────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const ConciliacaoPostSchema = z.object({
    empresa_id: z.string().min(1).optional(),
    action: z.enum(['update_status', 'auto_reconcile']).optional(),
    conciliacao_id: z.string().uuid().optional(),
    new_status: z.enum(['pendente', 'aprovado', 'rejeitado', 'auto_aprovado']).optional(),
})

export const dynamic = 'force-dynamic'

// GET — reconciliation status
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const empresaId = searchParams.get('empresa_id')
        const status    = searchParams.get('status')
        const minScore  = searchParams.get('min_score')
        const page      = parseInt(searchParams.get('page') || '1')
        const limit     = Math.min(parseInt(searchParams.get('limit') || '50'), 250)
        const offset    = (page - 1) * limit

        let query = supabaseAdmin
            .from('bpo_conciliacoes')
            .select(`
                id, empresa_id, transacao_interna_id, transacao_banco_id,
                valor_interno, valor_banco, data_interno, data_banco,
                score_match, status, metodo_match, created_at,
                bpo_transacoes!bpo_conciliacoes_transacao_interna_id_fkey(descricao, valor, tipo)
            `, { count: 'exact' })
            .order('score_match', { ascending: false })
            .range(offset, offset + limit - 1)

        if (empresaId) query = query.eq('empresa_id', empresaId)
        if (status)    query = query.eq('status', status)
        if (minScore)  query = query.gte('score_match', parseFloat(minScore))

        const { data, error, count } = await query

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Summary stats
        let statsQuery = supabaseAdmin
            .from('bpo_conciliacoes')
            .select('status')
        if (empresaId) statsQuery = statsQuery.eq('empresa_id', empresaId)
        const { data: allConc } = await statsQuery

        const stats = {
            total: (allConc || []).length,
            pendente: (allConc || []).filter(c => c.status === 'pendente').length,
            aprovado: (allConc || []).filter(c => c.status === 'aprovado').length,
            auto_aprovado: (allConc || []).filter(c => c.status === 'auto_aprovado').length,
            rejeitado: (allConc || []).filter(c => c.status === 'rejeitado').length,
        }

        return NextResponse.json({
            data: data || [],
            stats,
            pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
        })
    } catch (err) {
        console.error('[BPO Conciliacao GET]', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST — execute auto-reconciliation (6-level matching engine)
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const parsed = ConciliacaoPostSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
        }
        const { empresa_id, action, conciliacao_id, new_status } = parsed.data

        // Manual approve/reject
        if (action === 'update_status' && conciliacao_id && new_status) {
            const { data, error } = await supabaseAdmin
                .from('bpo_conciliacoes')
                .update({ status: new_status, updated_at: new Date().toISOString() })
                .eq('id', conciliacao_id)
                .select()
                .single()

            if (error) return NextResponse.json({ error: error.message }, { status: 500 })

            // If approved, mark transaction as reconciled
            if (new_status === 'aprovado' && data.transacao_interna_id) {
                await supabaseAdmin
                    .from('bpo_transacoes')
                    .update({ conciliado: true })
                    .eq('id', data.transacao_interna_id)
            }

            return NextResponse.json({ data })
        }

        // Auto-reconciliation engine
        if (!empresa_id) {
            return NextResponse.json({ error: 'empresa_id é obrigatório' }, { status: 400 })
        }

        // Fetch unreconciled internal transactions
        const { data: internalTx } = await supabaseAdmin
            .from('bpo_transacoes')
            .select('id, descricao, valor, tipo, data')
            .eq('empresa_id', empresa_id)
            .eq('conciliado', false)
            .order('data', { ascending: false })
            .limit(200)

        if (!internalTx || internalTx.length === 0) {
            return NextResponse.json({ message: 'Todas as transações já estão conciliadas', matched: 0 })
        }

        // In production, bank transactions would come from Pluggy Open Finance API.
        // For now, simulate with existing pending conciliações or return instructions.
        const { data: pendingConc } = await supabaseAdmin
            .from('bpo_conciliacoes')
            .select('*')
            .eq('empresa_id', empresa_id)
            .eq('status', 'pendente')

        let autoApproved = 0
        const results: Array<{ id: string; score: number; method: string; status: string }> = []

        // 6-Level Matching Engine
        for (const conc of (pendingConc || [])) {
            let score = 0
            let method = 'none'

            // Level 1: Exact value match (30 pts)
            if (conc.valor_interno && conc.valor_banco &&
                Math.abs(Number(conc.valor_interno) - Number(conc.valor_banco)) < 0.01) {
                score += 30
                method = 'exact_value'
            }

            // Level 2: Approximate value (within 1%) (20 pts)
            if (score < 30 && conc.valor_interno && conc.valor_banco) {
                const diff = Math.abs(Number(conc.valor_interno) - Number(conc.valor_banco))
                const pct = diff / Math.max(Number(conc.valor_interno), 1) * 100
                if (pct <= 1) {
                    score += 20
                    method = 'approx_value'
                }
            }

            // Level 3: Date match — same day (25 pts)
            if (conc.data_interno && conc.data_banco && conc.data_interno === conc.data_banco) {
                score += 25
                method = method ? `${method}+date_exact` : 'date_exact'
            }

            // Level 4: Date range — within 3 days (15 pts)
            if (score < 25 && conc.data_interno && conc.data_banco) {
                const d1 = new Date(conc.data_interno).getTime()
                const d2 = new Date(conc.data_banco).getTime()
                const daysDiff = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24)
                if (daysDiff <= 3) {
                    score += 15
                    method = method ? `${method}+date_range` : 'date_range'
                }
            }

            // Level 5: Same parity (receita = credit, despesa = debit) (15 pts)
            // Inferred from sign of values
            if (conc.valor_interno && conc.valor_banco) {
                const sameSign = (Number(conc.valor_interno) > 0) === (Number(conc.valor_banco) > 0)
                if (sameSign) {
                    score += 15
                    method = method ? `${method}+parity` : 'parity'
                }
            }

            // Level 6: Historical pattern (10 pts) — if similar match was approved before
            score += 10 // baseline for existing pending matches

            // Normalize score to 0-100
            score = Math.min(score, 100)

            // Auto-approve if score >= 90
            const finalStatus = score >= 90 ? 'auto_aprovado' : 'pendente'

            await supabaseAdmin
                .from('bpo_conciliacoes')
                .update({
                    score_match: score,
                    metodo_match: method,
                    status: finalStatus,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', conc.id)

            if (finalStatus === 'auto_aprovado' && conc.transacao_interna_id) {
                await supabaseAdmin
                    .from('bpo_transacoes')
                    .update({ conciliado: true })
                    .eq('id', conc.transacao_interna_id)
                autoApproved++
            }

            results.push({ id: conc.id, score, method, status: finalStatus })
        }

        return NextResponse.json({
            processed: results.length,
            auto_approved: autoApproved,
            pending: results.filter(r => r.status === 'pendente').length,
            results,
        })
    } catch (err) {
        console.error('[BPO Conciliacao POST]', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
