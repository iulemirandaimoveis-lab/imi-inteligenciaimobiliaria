// POST /api/financeiro/comissao
// Calcula e registra comissão automática ao aceitar uma proposta/contrato
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        const body = await request.json()
        const {
            contrato_id,
            valor_venda,
            percentual_comissao,   // ex: 5 = 5%
            splits,                // [{ user_id, nome, percentual }] — opcional
            due_date,
            notes,
        } = body
        if (!valor_venda || valor_venda <= 0) {
            return NextResponse.json({ error: 'Valor de venda inválido' }, { status: 400 })
        }
        // Default: pegar percentual de comissão das settings do tenant
        let pct = percentual_comissao
        if (!pct) {
            const { data: setting } = await supabaseAdmin
                .from('settings')
                .select('value')
                .eq('key', 'comissao_percentual')
                .maybeSingle()
            pct = setting ? parseFloat(setting.value as string) : 5
        }
        const comissaoTotal = Math.round((valor_venda * pct) / 100 * 100) / 100
        const dueDateStr = due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const created: any[] = []
        if (splits && splits.length > 0) {
            // Registrar comissão dividida
            for (const split of splits) {
                const valor = Math.round((comissaoTotal * split.percentual) / 100 * 100) / 100
                const { data, error } = await supabaseAdmin
                    .from('financial_transactions')
                    .insert({
                        type: 'receita',
                        category: 'comissao',
                        description: `Comissão ${split.nome || 'Agente'} (${split.percentual}%) — ${contrato_id ? `Contrato ${contrato_id}` : 'Venda'}`,
                        amount: valor,
                        due_date: dueDateStr,
                        status: 'pendente',
                        payment_method: 'transferencia',
                        notes: notes || null,
                        created_by: user.id,
                        metadata: {
                            contrato_id: contrato_id || null,
                            valor_venda,
                            percentual_comissao: pct,
                            split_user_id: split.user_id || null,
                            split_percentual: split.percentual,
                        },
                    })
                    .select()
                    .single()
                if (!error && data) created.push(data)
            }
        } else {
            // Comissão única sem split
            const { data, error } = await supabaseAdmin
                .from('financial_transactions')
                .insert({
                    type: 'receita',
                    category: 'comissao',
                    description: `Comissão ${pct}% sobre venda${contrato_id ? ` — Contrato ${contrato_id}` : ''}`,
                    amount: comissaoTotal,
                    due_date: dueDateStr,
                    status: 'pendente',
                    payment_method: 'transferencia',
                    notes: notes || null,
                    created_by: user.id,
                    metadata: {
                        contrato_id: contrato_id || null,
                        valor_venda,
                        percentual_comissao: pct,
                    },
                })
                .select()
                .single()
            if (!error && data) created.push(data)
        }
        return NextResponse.json({
            success: true,
            comissao_total: comissaoTotal,
            percentual: pct,
            transactions_created: created.length,
            transactions: created,
        }, { status: 201 })
    } catch (err) {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
