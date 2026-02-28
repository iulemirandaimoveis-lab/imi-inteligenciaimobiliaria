import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_FILE_SIZE = 30 * 1024 * 1024 // 30MB

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: `PDF muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Limite: 30MB` }, { status: 400 })
        }

        const buffer = await file.arrayBuffer()
        const base64Pdf = Buffer.from(buffer).toString('base64')

        const apiKey = process.env.ANTHROPIC_API_KEY
        if (!apiKey) {
            console.error('ANTHROPIC_API_KEY not set in environment')
            return NextResponse.json({ error: 'Chave da API Anthropic não configurada. Configure ANTHROPIC_API_KEY nas variáveis de ambiente do Vercel.' }, { status: 500 })
        }

        const systemPrompt = `Você é um assistente especializado em inteligência imobiliária.
Sua tarefa é extrair os dados de um material em PDF (apresentação de imóvel, tabela de vendas, memorial, book digital, etc.) e retornar APENAS um JSON estrito, sem qualquer texto adicional ou formatação markdown.
Analise TODAS as páginas do PDF, incluindo imagens, tabelas e textos.
O JSON deve obedecer à seguinte estrutura, preenchendo o máximo que conseguir identificar:
{
  "name": "Nome do empreendimento ou imóvel",
  "type": "TIPO_AQUI",
  "location": "Bairro/Região",
  "address": "Endereço completo",
  "developer": "Nome da construtora",
  "area": "Apenas os números da área em m²",
  "bedrooms": "Apenas números (quantidade de quartos)",
  "bathrooms": "Apenas números",
  "parking": "Apenas números (quantidade de vagas)",
  "features": ["Piscina", "Academia", "Salão de festas"]
}
Se uma informação não existir, use "" ou array vazio [].
Responda APENAS com o JSON válido.`

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-beta': 'pdfs-2024-09-25',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 8000,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'document',
                                source: {
                                    type: 'base64',
                                    media_type: 'application/pdf',
                                    data: base64Pdf,
                                },
                            },
                            {
                                type: 'text',
                                text: 'Extraia todos os dados deste PDF de empreendimento imobiliário para JSON. Analise todas as páginas.',
                            }
                        ],
                    }
                ]
            })
        })

        if (!response.ok) {
            const errBody = await response.text()
            console.error(`Anthropic API Error [${response.status}]:`, errBody)

            if (response.status === 401) {
                return NextResponse.json({ error: 'API Key inválida. Verifique ANTHROPIC_API_KEY no Vercel.' }, { status: 500 })
            }
            if (response.status === 413) {
                return NextResponse.json({ error: 'PDF muito grande para processar. Tente com um arquivo menor.' }, { status: 400 })
            }
            if (response.status === 429) {
                return NextResponse.json({ error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }, { status: 429 })
            }

            return NextResponse.json({ error: `Erro da API Anthropic (${response.status}). Tente novamente.` }, { status: 500 })
        }

        const result = await response.json()
        const content = result.content?.[0]?.text || ''

        if (!content) {
            return NextResponse.json({ error: 'A IA não retornou dados do PDF. O arquivo pode estar corrompido ou vazio.' }, { status: 422 })
        }

        // Extract JSON from response (handles markdown code blocks too)
        let jsonStr = content
        const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim()
        } else {
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                jsonStr = jsonMatch[0]
            }
        }

        try {
            const parsedData = JSON.parse(jsonStr)
            return NextResponse.json({ data: parsedData })
        } catch {
            console.error('Failed to parse JSON from AI response:', content.substring(0, 500))
            return NextResponse.json({ error: 'Não foi possível extrair dados estruturados do PDF. Tente outro arquivo.' }, { status: 422 })
        }
    } catch (err: any) {
        console.error('PDF parse error:', err)
        return NextResponse.json({ error: 'Falha ao processar o PDF: ' + (err.message || 'erro desconhecido') }, { status: 500 })
    }
}
