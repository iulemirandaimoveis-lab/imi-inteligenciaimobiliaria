// app/api/claude/generate-evaluation/route.ts
// API Route para gerar laudos técnicos com Claude

import { NextResponse } from 'next/server'

export const runtime = 'edge' // Usar Edge Runtime para melhor performance

interface GenerateEvaluationRequest {
    prompt: string
    evaluationId: string
    documents: Array<{ url: string; name: string }>
}

export async function POST(request: Request) {
    try {
        const { prompt, evaluationId } = await request.json() as { prompt: string; evaluationId: string }

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt é obrigatório' },
                { status: 400 }
            )
        }

        if (!process.env.ANTHROPIC_API_KEY) {
            console.error('API Key não configurada')
            return NextResponse.json(
                { error: 'API Key não configurada' },
                { status: 500 }
            )
        }

        // Chamar Claude API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 4000,
                temperature: 0.3, // Baixa para ser mais preciso e técnico
                system: `Você é um avaliador técnico imobiliário certificado, especialista em laudos segundo a norma NBR 14653-2.

Seu objetivo é gerar laudos técnicos precisos, profissionais e juridicamente válidos.

DIRETRIZES CRÍTICAS:
1. Siga RIGOROSAMENTE a estrutura da NBR 14653-2
2. Use linguagem técnica e formal
3. Inclua dados numéricos e justificativas
4. Cite métodos de avaliação apropriados
5. Apresente intervalos de confiança quando aplicável
6. Destaque fatores de valorização/desvalorização
7. Seja conservador em estimativas sem dados concretos
8. Indique claramente quando informações são insuficientes

FORMATO DE SAÍDA:
- Use Markdown para formatação
- Estruture com títulos (##) e subtítulos (###)
- Use listas para itens
- Destaque valores com **negrito**
- Inclua tabelas quando apropriado

COMPLIANCE:
- Nunca invente dados que não foram fornecidos
- Sempre indique grau de fundamentação e precisão
- Mencione limitações da avaliação
- Cite a NBR 14653 explicitamente`,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            let errorJson
            try {
                errorJson = JSON.parse(errorText)
            } catch {
                errorJson = { error: { message: errorText } }
            }
            console.error('Erro da API Claude:', errorJson)
            throw new Error(errorJson.error?.message || 'Erro ao chamar Claude API')
        }

        const data = await response.json()

        // Extrair conteúdo da resposta
        const content = data.content
            .filter((block: any) => block.type === 'text')
            .map((block: any) => block.text)
            .join('\n\n')

        // Auditoria

        return NextResponse.json({
            content,
            tokens: data.usage,
            model: data.model,
            generatedAt: new Date().toISOString()
        })

    } catch (error: any) {
        console.error('Erro ao gerar laudo:', error)
        return NextResponse.json(
            {
                error: 'Erro ao gerar laudo técnico',
                details: error.message
            },
            { status: 500 }
        )
    }
}

// Função auxiliar para validar API key
export async function GET() {
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY

    return NextResponse.json({
        status: hasApiKey ? 'configured' : 'missing_api_key',
        message: hasApiKey
            ? 'API configurada corretamente'
            : 'Configure ANTHROPIC_API_KEY nas variáveis de ambiente'
    })
}
