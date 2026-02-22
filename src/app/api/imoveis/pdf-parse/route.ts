import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

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
            return NextResponse.json({ error: 'API Key não configurada' }, { status: 500 })
        }

        const systemPrompt = `Você é um assistente especializado em inteligência imobiliária.
Sua tarefa é extrair os dados de um material em PDF (apresentação de imóvel, tabela de vendas, memorial, etc.) e retornar APENAS um JSON estrito, sem qualquer texto adicional ou formatação markdown além do próprio JSON.
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
                model: 'claude-3-5-sonnet-20241022',
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
                                text: 'Extraia os dados deste PDF para JSON.',
                            }
                        ],
                    }
                ]
            })
        })

        if (!response.ok) {
            const err = await response.text()
            console.error('Anthropic API Error:', err)
            return NextResponse.json({ error: 'Erro ao processar PDF com Anthropic' }, { status: 500 })
        }

        const result = await response.json()
        const content = result.content?.[0]?.text || ''

        // Extrai o JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        const jsonStr = jsonMatch ? jsonMatch[0] : content
        const parsedData = JSON.parse(jsonStr)

        return NextResponse.json({ data: parsedData })
    } catch (err: any) {
        console.error('Error parsing PDF:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
