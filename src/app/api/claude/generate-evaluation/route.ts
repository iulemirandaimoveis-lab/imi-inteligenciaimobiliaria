// app/api/claude/generate-evaluation/route.ts
// Gera laudos técnicos NBR 14653-2 via Claude com logging centralizado de custo
import { NextResponse } from 'next/server'
import { callClaude } from '@/lib/ai/claude'
import { createClient } from '@/lib/supabase/server'
import { limiters } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// Cached — same for every evaluation call, cuts repeated system-prompt cost ~90%
const EVALUATION_SYSTEM = `Você é um engenheiro avaliador imobiliário certificado pelo IBAPE/CONFEA, especialista em laudos técnicos conforme a norma ABNT NBR 14653-2 (Avaliação de Imóveis Urbanos).

PRINCÍPIOS FUNDAMENTAIS:
1. Siga RIGOROSAMENTE a estrutura e nomenclatura da NBR 14653-2
2. Use linguagem técnica, formal e juridicamente precisa
3. Inclua sempre: método utilizado, grau de fundamentação e grau de precisão
4. Cite explicitamente a NBR 14653-2 e outras normas aplicáveis (NBR 14653-1, NBR 5674)
5. Apresente intervalos de confiança e amplitude quando disponíveis
6. Destaque fatores de homogeneização com justificativa técnica
7. Seja conservador — nunca super-estime sem dados concretos
8. Indique claramente limitações, premissas e condicionantes da avaliação

MÉTODOS DISPONÍVEIS (citar o(s) aplicado(s)):
- Comparativo Direto de Dados de Mercado (CDDM) — principal para residencial urbano
- Evolutivo (custo de reedificação + terreno)
- Renda (VPL de fluxo de caixa) — para imóveis geradores de renda
- Involutivo (máximo aproveitamento do terreno)

ESTRUTURA OBRIGATÓRIA DO LAUDO:
## 1. Identificação e Objetivo
## 2. Documentação Analisada
## 3. Caracterização do Imóvel
## 4. Caracterização da Região
## 5. Metodologia Adotada
## 6. Pesquisa de Mercado e Tratamento de Dados
## 7. Resultado da Avaliação
## 8. Ressalvas e Condicionantes
## 9. Conclusão
## 10. Responsável Técnico

FORMATAÇÃO:
- Use Markdown (##, ###, **negrito**, tabelas, listas)
- Valores monetários: R$ com separador de milhar (ponto) e decimal (vírgula)
- Datas no formato DD/MM/AAAA
- Destaque o VALOR DE AVALIAÇÃO em negrito e caixa alta

COMPLIANCE OBRIGATÓRIO:
- Nunca invente dados não fornecidos — indique "a confirmar" ou "não disponível"
- Sempre declare grau de fundamentação: I, II ou III
- Declare grau de precisão: III (>30%), II (15–30%), I (<15%)`

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const rl = await limiters.ai(user.id)
        if (!rl.success) return NextResponse.json({ error: 'Limite de requisições excedido. Aguarde 1 minuto.' }, { status: 429 })

        const { prompt, evaluationId, tenant_id } = await request.json() as {
            prompt: string
            evaluationId?: string
            tenant_id?: string
        }

        if (!prompt) return NextResponse.json({ error: 'Prompt é obrigatório' }, { status: 400 })

        if (!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY)) {
            return NextResponse.json({ error: 'API Key não configurada' }, { status: 500 })
        }

        const response = await callClaude({
            tenant_id: tenant_id || user.id,
            prompt,
            system_prompt: EVALUATION_SYSTEM,
            model: 'claude-sonnet-4-6',
            temperature: 0.2,   // Maximum precision for technical reports
            max_tokens: 8000,   // Laudos completos exigem espaço
            request_type: 'generate_evaluation',
            related_entity_type: evaluationId ? 'avaliacao' : undefined,
            related_entity_id: evaluationId,
            requested_by: user.id,
            use_cache: true,
        })

        if (evaluationId) {
            await supabase
                .from('avaliacoes')
                .update({
                    laudo_content: response.content,
                    laudo_generated_at: new Date().toISOString(),
                    laudo_cost_usd: response.cost_usd,
                    laudo_ai_request_id: response.ai_request_id,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', evaluationId)
        }

        return NextResponse.json({
            content: response.content,
            tokens: { input: response.tokens_input, output: response.tokens_output },
            cost_usd: response.cost_usd,
            ai_request_id: response.ai_request_id,
            model: 'claude-sonnet-4-6',
            generatedAt: new Date().toISOString(),
        })
    } catch (error: unknown) {
        return NextResponse.json(
            {
                error: 'Erro ao gerar laudo técnico',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const hasApiKey = !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY)
    return NextResponse.json({
        status: hasApiKey ? 'configured' : 'missing_api_key',
        message: hasApiKey
            ? 'API configurada corretamente'
            : 'Configure ANTHROPIC_API_KEY nas variáveis de ambiente',
    })
}
