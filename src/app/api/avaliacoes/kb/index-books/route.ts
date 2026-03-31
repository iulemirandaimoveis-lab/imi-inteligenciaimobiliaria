import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// --- Category classification based on book filename/bloco ---

function classifyCategory(filename: string, bloco?: string): string {
    const lower = (filename + ' ' + (bloco || '')).toLowerCase()

    if (lower.includes('glossario') || lower.includes('definic'))
        return 'definicao'
    if (lower.includes('checklist') || lower.includes('template') || lower.includes('modelo'))
        return 'formulario'
    if (lower.includes('avaliacao') || lower.includes('avaliar') || lower.includes('engenharia') || lower.includes('pericia') || lower.includes('laudo'))
        return 'metodologia'
    if (lower.includes('judicial') || lower.includes('processos'))
        return 'jurisprudencia'
    if (lower.includes('investir') || lower.includes('investimento') || lower.includes('patrimonio') || lower.includes('renda') || lower.includes('aluguel'))
        return 'exemplo'
    if (lower.includes('bloco 1'))
        return 'metodologia'
    if (lower.includes('bloco 2'))
        return 'exemplo'
    if (lower.includes('bloco 3'))
        return 'exemplo'
    if (lower.includes('ia') || lower.includes('proptech') || lower.includes('automacao') || lower.includes('futuro'))
        return 'metodologia'

    return 'metodologia'
}

// --- Extract NBR references from text ---

function extractNormas(text: string): string[] {
    const matches = text.match(/NBR\s*\d{4,5}(?:[- ]\d)?/gi) || []
    const unique = [...new Set(matches.map(m => m.replace(/\s+/g, ' ').trim().toUpperCase()))]
    return unique
}

// --- Generate keywords from chapter title ---

function generateKeywords(title: string): string[] {
    const stopWords = new Set([
        'o', 'a', 'os', 'as', 'de', 'do', 'da', 'dos', 'das', 'e', 'em', 'no', 'na',
        'nos', 'nas', 'um', 'uma', 'por', 'para', 'com', 'que', 'se', 'ao', 'ou',
        'como', 'mais', 'ser', 'seu', 'sua', 'este', 'esta', 'esse', 'essa',
    ])
    return title
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w))
}

// --- Extract plain text from chapter conteudo (handles both formats) ---

function extractChapterText(conteudo: Record<string, unknown>): string {
    const parts: string[] = []

    // abertura
    if (typeof conteudo.abertura === 'string') {
        parts.push(conteudo.abertura)
    }

    // secoes — two known formats:
    // 1. Regular books: { titulo: string, conteudo: string }
    // 2. Bonus/glossary: { titulo: string, conteudo: Array<{tipo, texto}> }
    if (Array.isArray(conteudo.secoes)) {
        for (const secao of conteudo.secoes) {
            const s = secao as Record<string, unknown>
            if (typeof s.titulo === 'string') {
                parts.push(`## ${s.titulo}`)
            }
            if (typeof s.conteudo === 'string') {
                parts.push(s.conteudo)
            } else if (Array.isArray(s.conteudo)) {
                // Glossary format: array of { tipo, texto }
                for (const item of s.conteudo) {
                    const it = item as Record<string, unknown>
                    if (typeof it.texto === 'string') {
                        parts.push(it.texto.replace(/<[^>]+>/g, '')) // strip HTML tags
                    } else if (typeof it.conteudo === 'string') {
                        parts.push(it.conteudo)
                    }
                }
            }
        }
    }

    // insight_tecnico
    if (conteudo.insight_tecnico && typeof conteudo.insight_tecnico === 'object') {
        const insight = conteudo.insight_tecnico as Record<string, unknown>
        if (typeof insight.titulo === 'string') parts.push(`## ${insight.titulo}`)
        if (typeof insight.conteudo === 'string') parts.push(insight.conteudo)
    }

    // aplicacao_pratica
    if (conteudo.aplicacao_pratica && typeof conteudo.aplicacao_pratica === 'object') {
        const ap = conteudo.aplicacao_pratica as Record<string, unknown>
        if (typeof ap.titulo === 'string') parts.push(`## ${ap.titulo}`)
        if (Array.isArray(ap.passos)) {
            parts.push(ap.passos.map((p, i) => `${i + 1}. ${p}`).join('\n'))
        }
    }

    return parts.join('\n\n')
}

// --- Main handler ---

export async function POST() {
    try {
        // Auth check — admin only
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Read all book JSON files from /public/books/
        const booksDir = path.join(process.cwd(), 'public', 'books')
        const allFiles = await fs.readdir(booksDir)
        const bookFiles = allFiles
            .filter(f => f.endsWith('.json') && f !== 'index.json')
            .sort()

        // Check which books are already indexed
        const { data: existingPages } = await supabaseAdmin
            .from('avaliacoes_kb_pages')
            .select('source_file')
            .eq('source_type', 'ebook')

        const existingSet = new Set((existingPages || []).map(p => p.source_file))

        const results: Array<{
            file: string
            status: 'skipped' | 'indexed' | 'error'
            topics?: number
            error?: string
        }> = []

        for (const filename of bookFiles) {
            // Skip already indexed books
            if (existingSet.has(filename)) {
                results.push({ file: filename, status: 'skipped' })
                continue
            }

            try {
                const filePath = path.join(booksDir, filename)
                const raw = await fs.readFile(filePath, 'utf-8')
                const book = JSON.parse(raw)

                const metadata = book.metadata || {}
                const titulo = metadata.titulo || filename.replace('.json', '')
                const bloco = metadata.bloco || metadata.serie || ''
                const capitulos = book.capitulos || []

                // Collect all text to extract NBR references
                const allChapterTexts: string[] = []
                const topicsToInsert: Array<{
                    page_id: string
                    title: string
                    content: string
                    keywords: string[]
                    category: string
                    page_title: string
                    source_file: string
                    confidence: number
                }> = []

                const category = classifyCategory(filename, bloco)

                // Pre-extract chapter texts for normas detection
                for (const cap of capitulos) {
                    if (cap.conteudo) {
                        const text = extractChapterText(cap.conteudo)
                        allChapterTexts.push(text)
                    }
                }

                const fullText = allChapterTexts.join('\n')
                const normas = extractNormas(fullText)

                // Insert page
                const { data: page, error: pageError } = await supabaseAdmin
                    .from('avaliacoes_kb_pages')
                    .insert({
                        source_file: filename,
                        source_type: 'ebook',
                        page_title: titulo,
                        normas_citadas: normas,
                    })
                    .select('id')
                    .single()

                if (pageError || !page) {
                    results.push({
                        file: filename,
                        status: 'error',
                        error: pageError?.message || 'Falha ao criar página',
                    })
                    continue
                }

                // Build topics from chapters
                for (const cap of capitulos) {
                    const chapterTitle = cap.titulo || `Capítulo ${cap.numero}`
                    const chapterContent = cap.conteudo
                        ? extractChapterText(cap.conteudo)
                        : ''

                    if (!chapterContent.trim()) continue

                    // Truncate very long chapters to avoid DB field limits (64KB safe)
                    const content = chapterContent.length > 60000
                        ? chapterContent.slice(0, 60000) + '\n\n[...conteúdo truncado]'
                        : chapterContent

                    const keywords = generateKeywords(chapterTitle)

                    topicsToInsert.push({
                        page_id: page.id,
                        title: `${titulo} — ${chapterTitle}`,
                        content,
                        keywords,
                        category,
                        page_title: titulo,
                        source_file: filename,
                        confidence: 1.0,
                    })
                }

                // Batch insert topics
                if (topicsToInsert.length > 0) {
                    const { error: topicsError } = await supabaseAdmin
                        .from('avaliacoes_kb_topics')
                        .insert(topicsToInsert)

                    if (topicsError) {
                        // Page was created but topics failed — log and continue
                        results.push({
                            file: filename,
                            status: 'error',
                            error: `Página criada, mas tópicos falharam: ${topicsError.message}`,
                        })
                        continue
                    }
                }

                results.push({
                    file: filename,
                    status: 'indexed',
                    topics: topicsToInsert.length,
                })
            } catch (err) {
                results.push({
                    file: filename,
                    status: 'error',
                    error: err instanceof Error ? err.message : 'Erro desconhecido',
                })
            }
        }

        const indexed = results.filter(r => r.status === 'indexed')
        const skipped = results.filter(r => r.status === 'skipped')
        const errors = results.filter(r => r.status === 'error')

        return NextResponse.json({
            summary: {
                total: bookFiles.length,
                indexed: indexed.length,
                skipped: skipped.length,
                errors: errors.length,
                topics_created: indexed.reduce((sum, r) => sum + (r.topics || 0), 0),
            },
            results,
        })
    } catch (err: unknown) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erro interno' },
            { status: 500 },
        )
    }
}
