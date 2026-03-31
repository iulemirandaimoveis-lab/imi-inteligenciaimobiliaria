import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { detectFormat, parseDocument } from '@/lib/document-parser'
export const dynamic = 'force-dynamic'

type SupportedMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/msword' | 'text/plain'

interface ProcessImageBody {
    imageBase64: string
    mediaType: SupportedMediaType
    sourceFile: string
    pageTitle?: string
    sessionId?: string
}
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const body = await req.json() as ProcessImageBody
        const { imageBase64, mediaType, sourceFile, pageTitle, sessionId } = body
        if (!imageBase64 || !sourceFile) {
            return NextResponse.json({ error: 'imageBase64 e sourceFile são obrigatórios' }, { status: 400 })
        }
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '' })
        // 1. Extract knowledge with Claude
        const extractionPrompt = `Você é um especialista em avaliação imobiliária. Analise este material técnico sobre avaliação de imóveis (ABNT NBR 14653, PTAM, metodologia de avaliação) e extraia estruturadamente:
1. TÍTULO DA PÁGINA (se visível)
2. TÓPICOS PRINCIPAIS (cada um com título, conteúdo completo, palavras-chave, categoria)
   Categorias válidas: metodologia | norma | definicao | calculo | exemplo | formulario | checklist | jurisprudencia
3. NORMAS CITADAS (lista de normas NBR mencionadas)
4. DEFINIÇÕES TÉCNICAS encontradas (termo → definição)
Responda APENAS em JSON válido com esta estrutura:
{
  "page_title": "string",
  "normas_citadas": ["string"],
  "definicoes": { "termo": "definição" },
  "topics": [
    {
      "title": "string",
      "content": "string (texto completo do tópico)",
      "keywords": ["string"],
      "category": "string"
    }
  ]
}`
        // Detect if this is a document format that needs text extraction
        const docFormat = detectFormat(sourceFile)
        const isDocFormat = docFormat === 'docx' || docFormat === 'xlsx' || docFormat === 'txt'

        let messageContent: Anthropic.MessageCreateParams['messages'][0]['content']
        let sourceType: 'image' | 'pdf' | 'text' = 'image'

        if (isDocFormat && docFormat) {
            // Extract text from document formats, then send as text to Claude
            const buffer = Buffer.from(imageBase64, 'base64')
            const parsed = await parseDocument(buffer, docFormat)
            sourceType = 'text'
            messageContent = [
                { type: 'text', text: `=== CONTEÚDO DO DOCUMENTO: ${sourceFile} ===\n\n${parsed.text}\n\n=== FIM DO DOCUMENTO ===\n\n${extractionPrompt}` }
            ]
        } else if (mediaType === 'application/pdf') {
            sourceType = 'pdf'
            messageContent = [
                {
                    type: 'document' as const,
                    source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: imageBase64 }
                },
                { type: 'text', text: extractionPrompt }
            ]
        } else {
            messageContent = [
                {
                    type: 'image' as const,
                    source: {
                        type: 'base64' as const,
                        media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
                        data: imageBase64,
                    }
                },
                { type: 'text', text: extractionPrompt }
            ]
        }

        const response = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4096,
            messages: [{ role: 'user', content: messageContent }]
        })
        const text = response.content[0].type === 'text' ? response.content[0].text : ''
        // 2. Parse JSON from response
        let extracted: Record<string, unknown>
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/)
            extracted = JSON.parse(jsonMatch?.[0] || '{}')
        } catch {
            return NextResponse.json({ error: 'Falha ao parsear resposta da IA', raw: text }, { status: 422 })
        }
        // 3. Save page to KB
        const { data: page, error: pageError } = await supabaseAdmin
            .from('avaliacoes_kb_pages')
            .insert({
                source_file: sourceFile,
                source_type: sourceType,
                page_title: extracted.page_title || pageTitle || sourceFile,
                normas_citadas: extracted.normas_citadas || [],
                definicoes: extracted.definicoes || {},
            })
            .select('id')
            .single()
        if (pageError || !page) {
            return NextResponse.json({ error: pageError?.message || 'Erro ao salvar página' }, { status: 500 })
        }
        // 4. Save topics
        const topicsArray = Array.isArray(extracted.topics) ? extracted.topics as Array<Record<string, unknown>> : []
        if (topicsArray.length > 0) {
            const topicsToInsert = topicsArray.map((t) => ({
                page_id: page.id,
                title: t.title,
                content: t.content,
                keywords: t.keywords || [],
                category: t.category || 'metodologia',
                page_title: extracted.page_title || pageTitle,
                source_file: sourceFile,
            }))
            await supabaseAdmin.from('avaliacoes_kb_topics').insert(topicsToInsert)
        }
        // 5. Update upload queue status if sessionId provided
        if (sessionId) {
            await supabaseAdmin
                .from('avaliacoes_kb_upload_queue')
                .update({ status: 'completed', page_id: page.id, topics_count: topicsArray.length })
                .eq('session_id', sessionId)
                .eq('file_name', sourceFile)
        }
        return NextResponse.json({
            success: true,
            page_id: page.id,
            topics_count: topicsArray.length,
            page_title: extracted.page_title,
        })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro interno' }, { status: 500 })
    }
}
