import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/ai/claude'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const formData = await req.formData()
        const file = formData.get('file') as File | null
        const projetoId = formData.get('projeto_id') as string | null

        if (!file) return NextResponse.json({ error: 'PDF file is required' }, { status: 400 })
        if (!projetoId) return NextResponse.json({ error: 'projeto_id is required' }, { status: 400 })

        // Convert PDF to base64 for Claude Vision
        const bytes = await file.arrayBuffer()
        const base64 = Buffer.from(bytes).toString('base64')
        const mediaType = file.type === 'application/pdf' ? 'application/pdf' : 'image/jpeg'

        // Use Claude Vision to extract data from PDF
        const systemPrompt = `Você é um especialista em análise de materiais de construtoras e incorporadoras imobiliárias brasileiras.

Analise o documento fornecido e extraia TODAS as informações disponíveis sobre o empreendimento.

Retorne SEMPRE um JSON válido com esta estrutura:
{
  "nome_empreendimento": "Nome do empreendimento",
  "construtora": "Nome da construtora/incorporadora",
  "endereco": "Endereço completo",
  "bairro": "Bairro",
  "cidade": "Cidade",
  "estado": "UF",
  "plantas": [
    {
      "tipo": "Tipo 1 - 2 quartos",
      "area_privativa": 65.5,
      "quartos": 2,
      "suites": 1,
      "vagas": 1,
      "imagem_descricao": "descrição do layout se visível"
    }
  ],
  "tabela_precos": [
    {
      "planta_tipo": "Tipo 1 - 2 quartos",
      "preco_tabela": 450000,
      "entrada": 45000,
      "parcelas_mensais": 24,
      "valor_mensal": 5000,
      "balao": 100000,
      "financiamento": 250000,
      "observacoes": "Condições especiais de lançamento"
    }
  ],
  "unidades": [
    {
      "torre": "Torre A",
      "andar": 1,
      "numero": "101",
      "planta_tipo": "Tipo 1 - 2 quartos",
      "area_privativa": 65.5,
      "preco": 450000,
      "status": "disponivel"
    }
  ],
  "diferenciais": ["Piscina", "Churrasqueira", "Playground"],
  "data_entrega": "2027-06",
  "total_unidades": 120,
  "torres": 2,
  "andares_por_torre": 15,
  "unidades_por_andar": 4,
  "observacoes": "Informações adicionais extraídas"
}

Regras:
- Se um campo não estiver no documento, use null
- Preços devem ser números (sem R$, sem pontos de milhar)
- Áreas em m² como número decimal
- status das unidades: "disponivel", "reservado", "vendido", "bloqueado"
- Se o PDF mostrar uma tabela de disponibilidade, extraia cada unidade
- Se não houver unidades individuais, crie baseado nos dados (torre × andar × unidades_por_andar)
- Extraia TODAS as condições de pagamento/financiamento`

        const response = await callClaude({
            tenant_id: 'default',
            prompt: 'Analise este documento de construtora e extraia todas as informações do empreendimento conforme instruído.',
            system_prompt: systemPrompt,
            temperature: 0.3,
            max_tokens: 4096,
            request_type: 'pdf_import_projeto',
            related_entity_type: 'projeto',
            related_entity_id: projetoId,
            requested_by: user.id,
        })

        // Parse JSON response
        const jsonMatch = response.content.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            return NextResponse.json({
                error: 'Não foi possível extrair dados do PDF',
                raw: response.content,
            }, { status: 500 })
        }

        const extracted = JSON.parse(jsonMatch[0])

        return NextResponse.json({
            extracted,
            ai_request_id: response.ai_request_id,
            cost_usd: response.cost_usd,
        })
    } catch (error: any) {
        console.error('PDF import error:', error)
        return NextResponse.json({ error: error.message || 'Erro ao processar PDF' }, { status: 500 })
    }
}
