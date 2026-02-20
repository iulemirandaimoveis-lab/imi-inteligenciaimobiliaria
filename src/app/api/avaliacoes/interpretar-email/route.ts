// src/app/api/avaliacoes/interpretar-email/route.ts
// ── Interpretador de e-mail de solicitação de avaliação ───────
// Chama Anthropic server-side — API key nunca exposta ao cliente

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { emailText } = await req.json()

    if (!emailText || emailText.trim().length < 20) {
      return NextResponse.json({ error: 'Texto do e-mail muito curto' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 })
    }

    const systemPrompt = `Você é um assistente especializado em avaliações imobiliárias NBR 14653 no Brasil.
Analise e-mails de solicitação de avaliação e extraia informações estruturadas em JSON.
Responda APENAS com JSON válido, sem texto adicional, sem markdown, sem backticks.`

    const userPrompt = `Analise este e-mail de solicitação de avaliação imobiliária e retorne um JSON com os campos abaixo.
Se um campo não puder ser determinado, use null.

E-MAIL:
${emailText}

Retorne APENAS este JSON (sem explicações, sem markdown):
{
  "solicitante": "nome do solicitante",
  "tipo_entidade": "tribunal|banco|particular|escritorio|construtora|outro",
  "finalidade": "compra_venda|financiamento|garantia|partilha|inventario|desapropriacao|judicial|seguro|locacao|fundo|outro",
  "metodologia_sugerida": "comparativo|involutivo|evolutivo|renda|custo|null",
  "tipo_imovel": "apartamento|casa|terreno|comercial|rural|outro",
  "endereco_bairro": "bairro se mencionado ou null",
  "endereco_cidade": "cidade se mencionada",
  "urgencia": "baixa|media|alta",
  "prazo_sugerido": "prazo em dias ou null",
  "complexidade": "simples|media|complexa",
  "laudo_tipo": "simplificado|completo|pericia_judicial",
  "valor_estimado_imovel": numero em reais ou null,
  "observacoes_relevantes": "informações importantes para o avaliador ou null",
  "tom_comunicacao": "formal|informal|urgente"
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic error:', err)
      return NextResponse.json({ error: 'Falha na análise por IA' }, { status: 502 })
    }

    const data = await response.json()
    const rawText = data.content?.[0]?.text || ''

    // Parse JSON seguro
    let parsed: any
    try {
      // Remove possíveis backticks se o modelo os incluiu
      const clean = rawText.replace(/```json\n?|\n?```/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      console.error('JSON parse failed:', rawText)
      return NextResponse.json({ error: 'Resposta da IA em formato inválido' }, { status: 422 })
    }

    return NextResponse.json({ success: true, dados: parsed })

  } catch (error) {
    console.error('interpretar-email error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
