import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
export const dynamic = 'force-dynamic'
interface QueryBody {
    question: string
    category?: string
    sessionId?: string
}
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        const { question, category } = await req.json() as QueryBody
        if (!question?.trim()) {
            return NextResponse.json({ error: 'Pergunta obrigatória' }, { status: 400 })
        }
        // 1. Full-text search na KB usando a função search_kb_topics
        //    Fallback para select direto se a função ainda não existir no banco
        let topics: Array<{
            title: string; content: string; keywords: string[];
            category: string; source_file: string; page_title: string
        }> | null = null
        try {
            const { data: ftsData } = await supabaseAdmin
                .rpc('search_kb_topics', {
                    query_text: question,
                    filter_category: (category && category !== 'all') ? category : null,
                    result_limit: 10,
                })
            topics = ftsData
        } catch {
            // Fallback: sem full-text, busca por categoria
            let q = supabaseAdmin
                .from('avaliacoes_kb_topics')
                .select('title, content, keywords, category, source_file, page_title')
                .order('created_at', { ascending: false })
                .limit(10)
            if (category && category !== 'all') q = q.eq('category', category)
            const { data } = await q
            topics = data
        }
        // 2. Build context from retrieved topics
        const hasContext = topics && topics.length > 0
        const context = hasContext
            ? topics!.map(t =>
                `## ${t.title} [${t.category}]\nFonte: ${t.page_title || t.source_file}\n${t.content}`
              ).join('\n\n---\n\n')
            : null
        // 3. System prompt — ABNT expert persona
        const systemPrompt = `Você é o Motor de Avaliações da IMI (Inteligência Imobiliária), especialista em avaliação de imóveis segundo as normas brasileiras ABNT NBR 14653 (partes 1-7) e elaboração de PTAMs (Parecer Técnico de Avaliação Mercadológica).
INSTRUÇÕES:
- Responda sempre em português brasileiro formal técnico
- Cite as normas ABNT NBR 14653 relevantes quando aplicável (ex: "Conforme NBR 14653-2, seção 8.2...")
- Para PTAMs: siga rigorosamente a estrutura metodológica (identificação, diagnóstico, método, resultado, conclusão)
- Seja preciso com terminologia: método comparativo direto de dados de mercado, homogeneização de amostras, grau de fundamentação II/III, grau de precisão III
- Se a informação não estiver na base, informe claramente e sugira onde buscar
- Formate a resposta com clareza: use títulos com ##, listas com -, negrito para termos técnicos importantes${context ? `
BASE DE CONHECIMENTO INDEXADA (${topics!.length} tópicos relevantes encontrados):
${context}` : `
BASE DE CONHECIMENTO: Vazia — responda com base no seu treinamento sobre ABNT NBR 14653 e boas práticas de avaliação imobiliária no Brasil.`}`
        // 4. Call Claude — streaming (modelo atual)
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
        const stream = await client.messages.stream({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 2048,
            system: systemPrompt,
            messages: [{ role: 'user', content: question }],
        })
        // 5. Stream response to client
        const encoder = new TextEncoder()
        const readable = new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
                    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                        controller.enqueue(encoder.encode(chunk.delta.text))
                    }
                }
                controller.close()
            },
        })
        return new Response(readable, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'Cache-Control': 'no-cache',
            },
        })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro interno' }, { status: 500 })
    }
}
