// POST /api/financeiro/comissao
// Calcula e registra comissão automática ao aceitar uma proposta/contrato
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const ComissaoSplitSchema = z.object({
    user_id: z.string().optional(),
    nome: z.string().optional(),
    percentual: z.number().min(0).max(100),
})

const ComissaoPostSchema = z.object({
    contrato_id: z.string().optional(),
    valor_venda: z.number().positive(),
    percentual_comissao: z.number().min(0).max(100).optional(),
    splits: z.array(ComissaoSplitSchema).optional(),
    due_date: z.string().optional(),
    notes: z.string().max(2000).optional(),
})
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        const body = await request.json()
        const parsed = ComissaoPostSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
        }
        const {
            contrato_id,
            valor_venda,
            percentual_comissao,   // ex: 5 = 5%
            splits,                // [{ user_id, nome, percentual }] — opcional
            due_date,
            notes,
        } = parsed.data
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
        const created: Record<string, unknown>[] = []
        const errors: string[] = []
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
                if (error) {
                    console.error('[comissao] split insert error:', error.message)
                    errors.push(`Split ${split.user_id}: ${error.message}`)
                } else if (data) {
                    created.push(data)
                }
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
            if (error) {
                console.error('[comissao] insert error:', error.message)
                errors.push(error.message)
            } else if (data) {
                created.push(data)
            }
        }
        if (created.length === 0 && errors.length > 0) {
            return NextResponse.json({
                error: `Falha ao criar comissão: ${errors.join('; ')}`,
            }, { status: 500 })
        }
        return NextResponse.json({
            success: true,
            comissao_total: comissaoTotal,
            percentual: pct,
            transactions_created: created.length,
            transactions: created,
            warnings: errors.length > 0 ? errors : undefined,
        }, { status: 201 })
    } catch (err) {
        console.error('[comissao] unexpected error:', err)
        return NextResponse.json({ error: 'Erro interno ao processar comissão' }, { status: 500 })
    }
}
