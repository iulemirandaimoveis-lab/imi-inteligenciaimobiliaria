// src/app/api/bpo/dre/route.ts
// ── DRE (Income Statement) Generator ─────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const empresaId = searchParams.get('empresa_id')
        const mes = parseInt(searchParams.get('mes') || String(new Date().getMonth() + 1))
        const ano = parseInt(searchParams.get('ano') || String(new Date().getFullYear()))

        if (!empresaId) {
            return NextResponse.json({ error: 'empresa_id é obrigatório' }, { status: 400 })
        }

        // Check cache first
        const { data: cached } = await supabaseAdmin
            .from('bpo_dre_cache')
            .select('*')
            .eq('empresa_id', empresaId)
            .eq('mes', mes)
            .eq('ano', ano)
            .maybeSingle()

        // If cache is recent (less than 1 hour), return it
        if (cached && cached.gerado_em) {
            const cacheAge = Date.now() - new Date(cached.gerado_em).getTime()
            if (cacheAge < 3600000) {
                return NextResponse.json({ data: cached, source: 'cache' })
            }
        }

        // Build DRE from transactions
        const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`
        const lastDay = new Date(ano, mes, 0).getDate()
        const endDate = `${ano}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

        // Fetch all transactions for the period with categories
        const { data: transactions } = await supabaseAdmin
            .from('bpo_transacoes')
            .select('valor, tipo, bpo_categorias(grupo)')
            .eq('empresa_id', empresaId)
            .gte('data', startDate)
            .lte('data', endDate)

        // Aggregate by DRE line
        let receita_bruta = 0
        let deducoes = 0
        let custos = 0
        let despesas_operacionais = 0
        let resultado_financeiro = 0

        for (const tx of (transactions || [])) {
            const valor = Math.abs(Number(tx.valor))
            const grupo = (tx.bpo_categorias as { grupo?: string } | null)?.grupo || ''

            switch (grupo) {
                case 'receita_bruta':
                    receita_bruta += valor
                    break
                case 'deducoes':
                    deducoes += valor
                    break
                case 'custos':
                    custos += valor
                    break
                case 'despesas_operacionais':
                    despesas_operacionais += valor
                    break
                case 'resultado_financeiro':
                    resultado_financeiro += (tx.tipo === 'receita' ? valor : -valor)
                    break
                default:
                    // Uncategorized: assign based on tipo
                    if (tx.tipo === 'receita') receita_bruta += valor
                    else despesas_operacionais += valor
            }
        }

        const receita_liquida = receita_bruta - deducoes
        const lucro_bruto = receita_liquida - custos
        const lucro_operacional = lucro_bruto - despesas_operacionais
        const lucro_liquido = lucro_operacional + resultado_financeiro

        // Generate AI narrative
        let narrativa_ia = ''
        if (process.env.ANTHROPIC_API_KEY) {
            try {
                const Anthropic = (await import('@anthropic-ai/sdk')).default
                const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

                const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
                const response = await anthropic.messages.create({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 500,
                    messages: [{
                        role: 'user',
                        content: `Analise este DRE de ${meses[mes - 1]}/${ano} de uma empresa imobiliária:
- Receita Bruta: R$ ${receita_bruta.toFixed(2)}
- Deduções: R$ ${deducoes.toFixed(2)}
- Receita Líquida: R$ ${receita_liquida.toFixed(2)}
- Custos: R$ ${custos.toFixed(2)}
- Lucro Bruto: R$ ${lucro_bruto.toFixed(2)}
- Despesas Operacionais: R$ ${despesas_operacionais.toFixed(2)}
- Lucro Operacional: R$ ${lucro_operacional.toFixed(2)}
- Resultado Financeiro: R$ ${resultado_financeiro.toFixed(2)}
- Lucro Líquido: R$ ${lucro_liquido.toFixed(2)}

Gere uma análise executiva em 3 frases, em português, destacando os pontos principais e recomendações.`
                    }],
                })

                const textBlock = response.content.find(b => b.type === 'text')
                narrativa_ia = textBlock?.text || ''
            } catch {
                narrativa_ia = 'Análise IA indisponível no momento.'
            }
        }

        // Upsert cache
        const dreData = {
            empresa_id: empresaId,
            mes,
            ano,
            receita_bruta,
            deducoes,
            receita_liquida,
            custos,
            lucro_bruto,
            despesas_operacionais,
            lucro_operacional,
            resultado_financeiro,
            lucro_liquido,
            narrativa_ia,
            gerado_em: new Date().toISOString(),
        }

        if (cached) {
            await supabaseAdmin
                .from('bpo_dre_cache')
                .update(dreData)
                .eq('id', cached.id)
        } else {
            await supabaseAdmin
                .from('bpo_dre_cache')
                .insert(dreData)
        }

        return NextResponse.json({ data: dreData, source: 'generated' })
    } catch (err) {
        console.error('[BPO DRE]', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
