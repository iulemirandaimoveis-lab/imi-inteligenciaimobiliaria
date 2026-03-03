import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
// @ts-ignore
export const maxDuration = 60 // only for hobby/pro vercel

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
        }

        const buffer = await file.arrayBuffer()
        const base64Pdf = Buffer.from(buffer).toString('base64')

        const apiKey = process.env.ANTHROPIC_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'API Key do Anthropic não configurada no .env' }, { status: 500 })
        }

        const anthropic = new Anthropic({
            apiKey: apiKey,
        })

        const systemPrompt = `Você é um assistente especializado em inteligência imobiliária.
Sua tarefa é extrair os dados de um material em PDF (apresentação de imóvel, tabela de vendas, memorial, etc.) e retornar APENAS um JSON estrito, sem qualquer texto adicional ou blocos markdown de código além do próprio objeto JSON.
O JSON deve obedecer à seguinte estrutura, preenchendo o máximo que conseguir identificar:
{
  "name": "Nome do empreendimento ou imóvel",
  "type": "TIPO_AQUI", // Ex: Apartamento, Casa, Cobertura, Studio, Loft, Terreno, Comercial
  "location": "Bairro/Região",
  "address": "Endereço completo",
  "developer": "Nome da construtora",
  "area": "Apenas os números da área em m²",
  "bedrooms": "Apenas números (quantidade de quartos)",
  "bathrooms": "Apenas números",
  "parking": "Apenas números (quantidade de vagas)",
  "features": ["Piscina", "Academia", "Salão de festas", "Elevador", "Segurança"] // Extraia da lista de lazer/infraestrutura
}
Se uma informação não existir, use "" ou um array vazio [].
Responda APENAS com o JSON válido literal, sem formatar como \`\`\`json ... \`\`\`.`

        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
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
                            text: 'Extraia os dados deste PDF respeitando a estrutura JSON informada no prompt de sistema.',
                        }
                    ],
                }
            ],
        })

        const content = response.content.find(b => b.type === 'text');
        const textContent = content && content.type === 'text' ? content.text : '';

        // Extract JSON using regex in case model wraps it in Markdown or adds commentary
        const jsonMatch = textContent.match(/\{[\s\S]*\}/)
        const jsonStr = jsonMatch ? jsonMatch[0] : textContent
        const parsedData = JSON.parse(jsonStr)

        return NextResponse.json({ data: parsedData })
    } catch (err: any) {
        console.error('Error parsing PDF:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
