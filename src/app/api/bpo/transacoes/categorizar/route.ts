// src/app/api/bpo/transacoes/categorizar/route.ts
// ── AI Categorization using Anthropic API ────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'
import { withLogging } from '@/lib/api-logger'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export const POST = withLogging(async (req: Request) => {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { empresa_id, limit: maxTx = 20 } = body

        if (!empresa_id) {
            return NextResponse.json({ error: 'empresa_id é obrigatório' }, { status: 400 })
        }

        // 1. Fetch uncategorized transactions
        const { data: uncategorized } = await supabaseAdmin
            .from('bpo_transacoes')
            .select('id, descricao, valor, tipo, data, origem')
            .eq('empresa_id', empresa_id)
            .is('categoria_id', null)
            .order('data', { ascending: false })
            .limit(maxTx)

        if (!uncategorized || uncategorized.length === 0) {
            return NextResponse.json({ message: 'Nenhuma transação para categorizar', categorized: 0 })
        }

        // 2. Fetch available categories
        const { data: categorias } = await supabaseAdmin
            .from('bpo_categorias')
            .select('id, nome, tipo, grupo')
            .eq('empresa_id', empresa_id)
            .eq('ativo', true)

        if (!categorias || categorias.length === 0) {
            return NextResponse.json({ error: 'Nenhuma categoria encontrada para esta empresa' }, { status: 400 })
        }

        // 3. Check existing automation rules first
        const { data: regras } = await supabaseAdmin
            .from('bpo_regras_automacao')
            .select('*')
            .eq('empresa_id', empresa_id)
            .eq('ativa', true)

        const ruleMatched: Array<{ id: string; categoria_id: string }> = []
        const needsAI: typeof uncategorized = []

        for (const tx of uncategorized) {
            let matched = false
            for (const regra of (regras || [])) {
                const fieldValue = tx[regra.campo_match as keyof typeof tx]
                if (fieldValue && String(fieldValue).toLowerCase().includes(regra.valor_match.toLowerCase())) {
                    if (regra.confianca >= 80) {
                        ruleMatched.push({ id: tx.id, categoria_id: regra.categoria_destino })
                        matched = true
                        // Update rule usage counter
                        await supabaseAdmin
                            .from('bpo_regras_automacao')
                            .update({ vezes_aplicada: (regra.vezes_aplicada || 0) + 1 })
                            .eq('id', regra.id)
                        break
                    }
                }
            }
            if (!matched) needsAI.push(tx)
        }

        // Apply rule-based matches
        for (const match of ruleMatched) {
            await supabaseAdmin
                .from('bpo_transacoes')
                .update({ categoria_id: match.categoria_id })
                .eq('id', match.id)
        }

        // 4. Use AI for remaining uncategorized
        let aiCategorized = 0
        if (needsAI.length > 0 && process.env.ANTHROPIC_API_KEY) {
            const categoriasStr = categorias.map(c =>
                `ID: ${c.id} | Nome: ${c.nome} | Tipo: ${c.tipo} | Grupo DRE: ${c.grupo || 'N/A'}`
            ).join('\n')

            const transacoesStr = needsAI.map(tx =>
                `ID: ${tx.id} | Desc: ${tx.descricao || 'N/A'} | Valor: ${tx.valor} | Tipo: ${tx.tipo} | Data: ${tx.data}`
            ).join('\n')

            const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2000,
                messages: [{
                    role: 'user',
                    content: `Você é um assistente de contabilidade para BPO financeiro imobiliário.
Categorize cada transação abaixo usando as categorias disponíveis.

CATEGORIAS DISPONÍVEIS:
${categoriasStr}

TRANSAÇÕES PARA CATEGORIZAR:
${transacoesStr}

Responda APENAS em JSON array com o formato:
[{"transacao_id": "...", "categoria_id": "...", "confianca": 85}]

Não inclua explicações, apenas o JSON.`
                }],
            })

            try {
                const textBlock = response.content.find(b => b.type === 'text')
                const aiResult = JSON.parse(textBlock?.text || '[]')

                for (const item of aiResult) {
                    if (item.transacao_id && item.categoria_id && item.confianca >= 70) {
                        await supabaseAdmin
                            .from('bpo_transacoes')
                            .update({ categoria_id: item.categoria_id })
                            .eq('id', item.transacao_id)
                        aiCategorized++

                        // Learn: create automation rule if high confidence
                        if (item.confianca >= 90) {
                            const tx = needsAI.find(t => t.id === item.transacao_id)
                            if (tx?.descricao) {
                                await supabaseAdmin
                                    .from('bpo_regras_automacao')
                                    .upsert({
                                        empresa_id,
                                        campo_match: 'descricao',
                                        valor_match: tx.descricao.substring(0, 50).toLowerCase(),
                                        categoria_destino: item.categoria_id,
                                        confianca: item.confianca,
                                    }, { onConflict: 'empresa_id,campo_match,valor_match', ignoreDuplicates: true })
                            }
                        }
                    }
                }
            } catch {
                // AI response parsing failed — continue with what was rule-matched
            }
        }

        return NextResponse.json({
            total: uncategorized.length,
            rule_matched: ruleMatched.length,
            ai_categorized: aiCategorized,
            remaining: uncategorized.length - ruleMatched.length - aiCategorized,
        })
    } catch (err) {
        console.error('[BPO Categorizar]', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
})
