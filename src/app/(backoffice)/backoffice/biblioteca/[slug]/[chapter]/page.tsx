'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { T } from '@/app/(backoffice)/lib/theme'
import { BookOpen, ChevronLeft, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Chapter {
    numero: number
    titulo: string
    objetivo?: string
    conteudo?: string
    palavras_estimadas?: number
    tempo_leitura_min?: number
}

interface BookData {
    metadata: {
        titulo: string
        subtitulo?: string
        autor?: string
    }
    capitulos: Chapter[]
}

/** Sanitize HTML string — strip scripts, event handlers, and dangerous URIs */
function sanitizeHtml(html: string): string {
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/<embed\b[^>]*>/gi, '')
        .replace(/<link\b[^>]*>/gi, '')
        .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
        .replace(/on\w+\s*=\s*'[^']*'/gi, '')
        .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
        .replace(/javascript\s*:/gi, 'nojavascript:')
        .replace(/data\s*:\s*text\/html/gi, 'nodata:text/html')
}

function renderContent(content: string): string {
    if (!content) return '<p>Conteúdo não disponível.</p>'

    // If it's already HTML (contains tags), sanitize and return
    if (content.includes('<h') || content.includes('<p>') || content.includes('<div')) {
        return sanitizeHtml(content)
    }

    // Otherwise, convert markdown-like text to HTML (content is text, escape HTML entities first)
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    return content
        .split('\n\n')
        .map(para => {
            if (para.startsWith('# ')) return `<h2>${esc(para.slice(2))}</h2>`
            if (para.startsWith('## ')) return `<h3>${esc(para.slice(3))}</h3>`
            if (para.startsWith('### ')) return `<h4>${esc(para.slice(4))}</h4>`
            if (para.startsWith('- ') || para.startsWith('* ')) {
                const items = para.split('\n').map(l => `<li>${esc(l.replace(/^[-*]\s/, ''))}</li>`).join('')
                return `<ul>${items}</ul>`
            }
            if (para.startsWith('> ')) return `<blockquote>${esc(para.slice(2))}</blockquote>`
            if (para.startsWith('```')) return `<pre><code>${esc(para.replace(/```\w*\n?/, '').replace(/```$/, ''))}</code></pre>`
            return `<p>${esc(para).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}</p>`
        })
        .join('\n')
}

export default function ChapterReaderPage() {
    const params = useParams()
    const router = useRouter()
    const slug = params.slug as string
    const rawChapter = params.chapter as string
    const chapterIdx = Number.isFinite(Number(rawChapter)) ? parseInt(rawChapter, 10) : NaN

    const [book, setBook] = useState<BookData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Redirect invalid index values early (NaN, negative)
    useEffect(() => {
        if (isNaN(chapterIdx) || chapterIdx < 0) {
            router.replace(`/backoffice/biblioteca/${slug}/0`)
        }
    }, [chapterIdx, slug, router])

    useEffect(() => {
        if (!slug || isNaN(chapterIdx) || chapterIdx < 0) return

        async function loadBook() {
            try {
                const res = await fetch(`/books/${slug}.json`)
                if (!res.ok) {
                    setError(res.status === 404 ? 'Livro não encontrado' : `Erro ${res.status}`)
                    return
                }
                const data: BookData = await res.json()
                if (!data?.capitulos?.length) {
                    setError('Livro sem capítulos disponíveis')
                    return
                }
                if (chapterIdx >= data.capitulos.length) {
                    setError(`Capítulo ${chapterIdx} não existe. Este livro tem ${data.capitulos.length} capítulos.`)
                    return
                }
                setBook(data)
            } catch (err) {
                console.error('Erro ao carregar capítulo:', err)
                setError('Não foi possível carregar o capítulo.')
                toast.error('Não foi possível carregar o capítulo.')
            } finally {
                setLoading(false)
            }
        }

        loadBook()
    }, [slug, chapterIdx])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={24} className="animate-spin" style={{ color: T.accent }} />
            </div>
        )
    }

    if (error || !book) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <BookOpen size={40} style={{ color: T.textDim }} />
                <p className="text-sm" style={{ color: T.textMuted }}>
                    {error || 'Capítulo não encontrado.'}
                </p>
                <Link href={`/backoffice/biblioteca/${slug}`}
                    className="flex items-center gap-2 text-sm font-medium" style={{ color: T.accent }}>
                    <ArrowLeft size={14} /> Voltar ao índice
                </Link>
            </div>
        )
    }

    const chapter = book.capitulos?.[chapterIdx]
    if (!chapter) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <BookOpen size={40} style={{ color: T.textDim }} />
                <p className="text-sm" style={{ color: T.textMuted }}>Capítulo não encontrado.</p>
                <Link href={`/backoffice/biblioteca/${slug}`}
                    className="flex items-center gap-2 text-sm font-medium" style={{ color: T.accent }}>
                    <ArrowLeft size={14} /> Voltar ao índice
                </Link>
            </div>
        )
    }

    const chapterNum = chapter.numero || chapterIdx + 1
    const totalChapters = book.capitulos.length
    const prevChapter = chapterIdx > 0 ? book.capitulos[chapterIdx - 1] : null
    const nextChapter = chapterIdx < totalChapters - 1 ? book.capitulos[chapterIdx + 1] : null

    return (
        <>
            <style jsx global>{`
                .biblioteca-content h2 { font-size: 1.5rem; font-weight: 700; margin: 2rem 0 1rem; font-family: var(--font-display, serif); }
                .biblioteca-content h3 { font-size: 1.25rem; font-weight: 700; margin: 1.5rem 0 0.75rem; }
                .biblioteca-content h4 { font-size: 1.1rem; font-weight: 600; margin: 1.25rem 0 0.5rem; }
                .biblioteca-content p { font-size: 0.9375rem; line-height: 1.8; margin-bottom: 1rem; }
                .biblioteca-content ul, .biblioteca-content ol { padding-left: 1.5rem; margin-bottom: 1rem; }
                .biblioteca-content li { font-size: 0.9375rem; line-height: 1.7; margin-bottom: 0.5rem; }
                .biblioteca-content blockquote { border-left: 3px solid var(--accent-400, #C49D5B); padding: 1rem 1.25rem; margin: 1.5rem 0; font-style: italic; opacity: 0.9; }
                .biblioteca-content pre { background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 1.5rem 0; }
                .biblioteca-content code { font-family: 'DM Mono', monospace; font-size: 0.85rem; }
                .biblioteca-content strong { font-weight: 700; }
                .biblioteca-content em { font-style: italic; }
                .biblioteca-content table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
                .biblioteca-content th, .biblioteca-content td { padding: 0.75rem; border: 1px solid rgba(255,255,255,0.1); font-size: 0.875rem; }
                .biblioteca-content th { font-weight: 700; text-align: left; }
            `}</style>

            <div className="max-w-3xl mx-auto pb-20">
                {/* Navigation header */}
                <div className="flex items-center justify-between mb-8 sticky top-0 z-10 py-3 -mx-4 px-4"
                    style={{ background: 'var(--bg-base)', borderBottom: `1px solid ${T.border}` }}>
                    <Link href={`/backoffice/biblioteca/${slug}`}
                        className="flex items-center gap-2 text-sm font-medium"
                        style={{ color: T.textMuted }}>
                        <ArrowLeft size={14} /> Índice
                    </Link>
                    <span className="text-xs font-mono" style={{ color: T.textDim }}>
                        Cap. {chapterNum} de {totalChapters}
                    </span>
                </div>

                {/* Chapter title */}
                <div className="mb-10">
                    <span className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: T.accent }}>
                        Capítulo {chapterNum}
                    </span>
                    <h1 className="text-2xl md:text-3xl font-bold mt-2"
                        style={{ color: T.text, fontFamily: 'var(--font-display, serif)' }}>
                        {chapter.titulo}
                    </h1>
                    {chapter.objetivo && (
                        <p className="text-sm mt-3 leading-relaxed" style={{ color: T.textMuted }}>
                            {chapter.objetivo}
                        </p>
                    )}
                    {chapter.tempo_leitura_min && (
                        <p className="text-xs font-mono mt-2" style={{ color: T.textDim }}>
                            ~{chapter.tempo_leitura_min} min de leitura
                        </p>
                    )}
                </div>

                {/* Content — render as HTML */}
                <div className="biblioteca-content"
                    style={{ color: T.text }}
                    dangerouslySetInnerHTML={{ __html: renderContent(chapter.conteudo || '') }}
                />

                {/* Chapter navigation */}
                <div className="flex items-center justify-between mt-16 pt-6"
                    style={{ borderTop: `1px solid ${T.border}` }}>
                    {prevChapter ? (
                        <Link href={`/backoffice/biblioteca/${slug}/${chapterIdx - 1}`}
                            className="flex items-center gap-2 text-sm font-medium max-w-[45%] truncate"
                            style={{ color: T.textMuted }}>
                            <ChevronLeft size={14} className="flex-shrink-0" />
                            <span className="truncate">{prevChapter.titulo}</span>
                        </Link>
                    ) : <div />}
                    {nextChapter ? (
                        <Link href={`/backoffice/biblioteca/${slug}/${chapterIdx + 1}`}
                            className="flex items-center gap-2 text-sm font-medium max-w-[45%] truncate ml-auto"
                            style={{ color: T.accent }}>
                            <span className="truncate">{nextChapter.titulo}</span>
                            <ChevronRight size={14} className="flex-shrink-0" />
                        </Link>
                    ) : <div />}
                </div>
            </div>
        </>
    )
}
