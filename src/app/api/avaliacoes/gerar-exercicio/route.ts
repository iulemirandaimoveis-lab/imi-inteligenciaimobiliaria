// src/app/api/avaliacoes/gerar-exercicio/route.ts
// ── Gerador de exercícios NBR 14653 via Anthropic ────────────
// Chama Anthropic server-side — API key nunca exposta ao cliente

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

const CATEGORIAS = ['Metodologias', 'Graus NBR', 'Cálculos', 'Honorários', 'Fundamentação', 'Vistoria'] as const
const NIVEIS = ['básico', 'intermediário', 'avançado'] as const

export async function POST(req: NextRequest) {
  try {
    const { categoria, nivel, quantidade = 3 } = await req.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 })
    }

    const catValida = CATEGORIAS.includes(categoria) ? categoria : 'Metodologias'
    const nivelValido = NIVEIS.includes(nivel) ? nivel : 'intermediário'
    const qtd = Math.min(Math.max(1, Number(quantidade)), 5)

    const systemPrompt = `Você é um professor especialista em avaliações imobiliárias NBR 14653 no Brasil.
Gere questões de treinamento precisas, baseadas estritamente na norma NBR 14653 (partes 1, 2 e 3) e nas diretrizes IBAPE.
Responda APENAS com JSON válido. Sem texto adicional, sem markdown, sem explicações fora do JSON.`

    const userPrompt = `Gere ${qtd} questão(ões) de treinamento sobre "${catValida}" no nível "${nivelValido}".

Retorne APENAS este JSON (array de questões):
[
  {
    "id": "gerada_1",
    "categoria": "${catValida}",
    "nivel": "${nivelValido}",
    "tipo": "multipla_escolha",
    "contexto": "contexto ou situação apresentada ao candidato",
    "pergunta": "texto completo da pergunta",
    "opcoes": ["A) opção 1", "B) opção 2", "C) opção 3", "D) opção 4"],
    "correta": 0,
    "explicacao": "explicação detalhada da resposta correta com referência normativa",
    "normaRef": "ex: NBR 14653-1:2019, item 8.2"
  }
]

Regras:
- Questões devem ser tecnicamente precisas e baseadas na norma
- Para "Cálculos": incluir valores numéricos reais a calcular
- Para "Graus NBR": focar em critérios de fundamentação e precisão (I, II, III)
- Para "Honorários": usar tabela IBAPE com percentuais reais
- "correta" é o índice (0-3) da opção correta no array "opcoes"
- Nível ${nivelValido}: ${nivelValido === 'básico' ? 'conceitos fundamentais, definições' : nivelValido === 'intermediário' ? 'aplicação prática, interpretação da norma' : 'casos complexos, exceções, decisões técnicas'}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Falha na geração por IA' }, { status: 502 })
    }

    const data = await response.json()
    const rawText = data.content?.[0]?.text || ''

    let exercicios: any[]
    try {
      const clean = rawText.replace(/```json\n?|\n?```/g, '').trim()
      exercicios = JSON.parse(clean)
      if (!Array.isArray(exercicios)) throw new Error('not array')
    } catch {
      return NextResponse.json({ error: 'Resposta da IA em formato inválido' }, { status: 422 })
    }

    return NextResponse.json({ success: true, exercicios })

  } catch (error) {
    console.error('gerar-exercicio error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
