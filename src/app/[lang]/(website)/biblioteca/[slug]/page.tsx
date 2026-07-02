'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    BookOpen, ChevronLeft, ChevronRight, ArrowLeft,
    Loader2, List, Sun, Moon, Minus, Plus, Share2,
} from 'lucide-react'
// T-07: sanitização via DOMPurify (util compartilhado), não mais regex frágil.
import { sanitizeHtml } from '@/lib/sanitize-html'

// ── Reading progress helpers ─────────────────
function saveProgress(slug: string, chapter: number) {
    try { localStorage.setItem(`imi-reader-${slug}`, JSON.stringify({ chapter, ts: Date.now() })) } catch { /* noop */ }
}
function loadProgress(slug: string): number {
    try {
        const raw = localStorage.getItem(`imi-reader-${slug}`)
        if (!raw) return 0
        const { chapter } = JSON.parse(raw) as { chapter: number; ts: number }
        return typeof chapter === 'number' ? chapter : 0
    } catch { return 0 }
}

interface Chapter {
    numero: number
    titulo: string
    epigrafe?: string
    objetivo?: string
    conteudo?: string
    palavras_estimadas?: number
    tempo_leitura_min?: number
    secoes?: Array<{
        titulo: string
        conteudo: Array<{ tipo: string; texto?: string; items?: string[]; codigo?: string; linguagem?: string }>
    }>
}

interface BookData {
    metadata: {
        titulo: string
        subtitulo?: string
        autor?: string
        serie?: string
        slug?: string
    }
    capitulos: Chapter[]
}

type Section = NonNullable<Chapter['secoes']>[number]

function renderSection(secao: Section): string {
    if (!secao) return ''
    let html = secao.titulo ? `<h3>${secao.titulo}</h3>` : ''
    for (const item of (secao.conteudo || [])) {
        switch (item.tipo) {
            case 'paragrafo':
                html += `<p>${item.texto || ''}</p>`
                break
            case 'subtitulo':
                html += `<h4>${item.texto || ''}</h4>`
                break
            case 'lista':
                html += '<ul>' + (item.items || []).map((i: string) => `<li>${i}</li>`).join('') + '</ul>'
                break
            case 'lista_ordenada':
                html += '<ol>' + (item.items || []).map((i: string) => `<li>${i}</li>`).join('') + '</ol>'
                break
            case 'destaque':
            case 'nota':
                html += `<blockquote>${item.texto || ''}</blockquote>`
                break
            case 'codigo':
                html += `<pre><code>${item.codigo || item.texto || ''}</code></pre>`
                break
            case 'tabela':
                html += `<div class="table-wrap">${item.texto || ''}</div>`
                break
            default:
                if (item.texto) html += `<p>${item.texto}</p>`
        }
    }
    return html
}

function renderChapterContent(chapter: Chapter): string {
    if (chapter.conteudo) {
        if (chapter.conteudo.includes('<h') || chapter.conteudo.includes('<p>')) {
            return sanitizeHtml(chapter.conteudo)
        }
        return chapter.conteudo
            .split('\n\n')
            .map(para => {
                if (para.startsWith('# ')) return `<h2>${para.slice(2)}</h2>`
                if (para.startsWith('## ')) return `<h3>${para.slice(3)}</h3>`
                if (para.startsWith('### ')) return `<h4>${para.slice(4)}</h4>`
                if (para.startsWith('- ') || para.startsWith('* ')) {
                    const items = para.split('\n').map(l => `<li>${l.replace(/^[-*]\s/, '')}</li>`).join('')
                    return `<ul>${items}</ul>`
                }
                if (para.startsWith('> ')) return `<blockquote>${para.slice(2)}</blockquote>`
                return `<p>${para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}</p>`
            })
            .join('\n')
    }

    if (chapter.secoes && chapter.secoes.length > 0) {
        let html = ''
        if (chapter.epigrafe) html += `<blockquote class="epigrafe"><em>${chapter.epigrafe}</em></blockquote>`
        if (chapter.objetivo) html += `<div class="objetivo"><strong>Objetivo:</strong> ${chapter.objetivo}</div>`
        for (const secao of chapter.secoes) {
            html += renderSection(secao)
        }
        return html
    }

    return '<p>Conteudo nao disponivel para este capitulo.</p>'
}

export default function EbookReaderPage() {
    const params = useParams()
    const slug = params.slug as string
    const lang = (params.lang as string) || 'pt'

    const [book, setBook] = useState<BookData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [chapterIdx, setChapterIdx] = useState(0)
    const [showToc, setShowToc] = useState(false)
    const [darkMode, setDarkMode] = useState(true)
    const [fontSize, setFontSize] = useState(17)

    // Touch swipe refs
    const touchStartX = useRef(0)
    const touchStartY = useRef(0)

    useEffect(() => {
        fetch(`/books/${slug}.json`)
            .then(res => {
                if (!res.ok) throw new Error('Livro nao encontrado')
                return res.json()
            })
            .then((data: BookData) => {
                setBook(data)
                // Restore saved reading progress
                const saved = loadProgress(slug)
                if (saved > 0 && saved < data.capitulos.length) {
                    setChapterIdx(saved)
                }
                setLoading(false)
            })
            .catch(err => {
                setError(err.message)
                setLoading(false)
            })
    }, [slug])

    const goTo = useCallback((idx: number) => {
        setChapterIdx(idx)
        setShowToc(false)
        saveProgress(slug, idx)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [slug])

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' && book && chapterIdx < book.capitulos.length - 1) goTo(chapterIdx + 1)
            if (e.key === 'ArrowLeft' && chapterIdx > 0) goTo(chapterIdx - 1)
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [chapterIdx, book, goTo])

    // Touch swipe navigation for mobile
    useEffect(() => {
        const onStart = (e: TouchEvent) => {
            touchStartX.current = e.touches[0].clientX
            touchStartY.current = e.touches[0].clientY
        }
        const onEnd = (e: TouchEvent) => {
            const dx = e.changedTouches[0].clientX - touchStartX.current
            const dy = e.changedTouches[0].clientY - touchStartY.current
            // Only trigger if horizontal swipe is dominant and > 80px
            if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                if (dx < 0 && book && chapterIdx < book.capitulos.length - 1) goTo(chapterIdx + 1)
                if (dx > 0 && chapterIdx > 0) goTo(chapterIdx - 1)
            }
        }
        window.addEventListener('touchstart', onStart, { passive: true })
        window.addEventListener('touchend', onEnd, { passive: true })
        return () => {
            window.removeEventListener('touchstart', onStart)
            window.removeEventListener('touchend', onEnd)
        }
    }, [chapterIdx, book, goTo])

    const handleShare = useCallback(async () => {
        const url = window.location.href
        const title = book?.metadata.titulo || 'Ebook IMI'
        if (navigator.share) {
            try { await navigator.share({ title, url }) } catch { /* cancelled */ }
        } else {
            await navigator.clipboard.writeText(url)
        }
    }, [book])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1928' }}>
                <Loader2 size={32} className="animate-spin" style={{ color: '#C8A44A' }} />
            </div>
        )
    }

    if (error || !book) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0B1928', color: '#fff' }}>
                <BookOpen size={48} style={{ color: '#C8A44A', opacity: 0.4 }} />
                <p className="text-lg font-semibold">Livro nao encontrado</p>
                <Link href={`/${lang}/biblioteca`} className="text-sm underline" style={{ color: '#C8A44A' }}>
                    Voltar para a Biblioteca
                </Link>
            </div>
        )
    }

    const chapter = book.capitulos[chapterIdx]
    const totalChapters = book.capitulos.length
    const progress = ((chapterIdx + 1) / totalChapters) * 100

    const bg = darkMode ? '#0D1420' : '#F5F0E8'
    const textColor = darkMode ? '#D4CFC4' : '#2C2C2C'
    const mutedColor = darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.45)'
    const surfaceBg = darkMode ? '#111926' : '#FFFDF8'
    const borderColor = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'
    const accentColor = '#C8A44A'

    const readerCSS = `
        .reader-content { font-family: 'Georgia', 'Playfair Display', serif; line-height: 1.85; color: ${textColor}; font-size: ${fontSize}px; }
        .reader-content h2 { font-size: 1.5em; font-weight: 700; margin: 2em 0 0.8em; color: ${darkMode ? '#fff' : '#1a1a1a'}; font-family: 'Playfair Display', serif; }
        .reader-content h3 { font-size: 1.25em; font-weight: 700; margin: 1.8em 0 0.6em; color: ${darkMode ? '#E8E4DB' : '#333'}; }
        .reader-content h4 { font-size: 1.1em; font-weight: 600; margin: 1.5em 0 0.5em; color: ${darkMode ? '#C8A44A' : '#8B7530'}; }
        .reader-content p { margin: 0 0 1.2em; text-align: justify; }
        .reader-content ul, .reader-content ol { margin: 0 0 1.2em; padding-left: 1.5em; }
        .reader-content li { margin-bottom: 0.5em; }
        .reader-content blockquote { border-left: 3px solid ${accentColor}; padding: 1em 1.5em; margin: 1.5em 0; background: ${darkMode ? 'rgba(200,164,74,0.06)' : 'rgba(200,164,74,0.08)'}; border-radius: 0 8px 8px 0; font-style: italic; }
        .reader-content pre { background: ${darkMode ? '#0A1018' : '#F0EDE4'}; padding: 1em; border-radius: 8px; overflow-x: auto; font-size: 0.85em; border: 1px solid ${borderColor}; }
        .reader-content code { font-family: 'JetBrains Mono', monospace; }
        .reader-content strong { color: ${darkMode ? '#fff' : '#111'}; }
        .reader-content .epigrafe { border-left-color: ${mutedColor}; opacity: 0.7; font-size: 0.9em; }
        .reader-content .objetivo { background: ${darkMode ? 'rgba(96,165,250,0.08)' : 'rgba(96,165,250,0.1)'}; border: 1px solid ${darkMode ? 'rgba(96,165,250,0.15)' : 'rgba(96,165,250,0.2)'}; padding: 1em 1.5em; border-radius: 8px; margin-bottom: 1.5em; font-size: 0.92em; }
    `

    return (
        <div style={{ background: bg, minHeight: '100vh', transition: 'background 0.3s' }}>
            <style>{readerCSS}</style>

            {/* Progress bar */}
            <div className="fixed top-0 left-0 right-0 z-50 h-1" style={{ background: borderColor }}>
                <div style={{ width: `${progress}%`, height: '100%', background: accentColor, transition: 'width 0.3s' }} />
            </div>

            {/* Top bar */}
            <header
                className="sticky top-0 z-40 backdrop-blur-xl"
                style={{ background: `${surfaceBg}ee`, borderBottom: `1px solid ${borderColor}` }}
            >
                <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link
                        href={`/${lang}/biblioteca`}
                        className="flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: mutedColor }}
                    >
                        <ArrowLeft size={14} /> Biblioteca
                    </Link>

                    <div className="flex-1 min-w-0 text-center">
                        <p className="text-[11px] font-semibold truncate" style={{ color: mutedColor }}>
                            {book.metadata.titulo}
                        </p>
                        <p className="text-[10px]" style={{ color: mutedColor }}>
                            Cap. {chapterIdx + 1} de {totalChapters}
                        </p>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setFontSize(s => Math.max(13, s - 1))}
                            className="w-8 h-8 sm:w-7 sm:h-7 rounded-md flex items-center justify-center"
                            style={{ color: mutedColor, border: `1px solid ${borderColor}` }}
                            title="Diminuir fonte"
                            aria-label="Diminuir tamanho da fonte"
                        >
                            <Minus size={12} />
                        </button>
                        <button
                            onClick={() => setFontSize(s => Math.min(24, s + 1))}
                            className="w-8 h-8 sm:w-7 sm:h-7 rounded-md flex items-center justify-center"
                            style={{ color: mutedColor, border: `1px solid ${borderColor}` }}
                            title="Aumentar fonte"
                            aria-label="Aumentar tamanho da fonte"
                        >
                            <Plus size={12} />
                        </button>
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="w-8 h-8 sm:w-7 sm:h-7 rounded-md flex items-center justify-center"
                            style={{ color: mutedColor, border: `1px solid ${borderColor}` }}
                            title={darkMode ? 'Modo claro' : 'Modo escuro'}
                            aria-label={darkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
                        >
                            {darkMode ? <Sun size={12} /> : <Moon size={12} />}
                        </button>
                        <button
                            onClick={handleShare}
                            className="w-8 h-8 sm:w-7 sm:h-7 rounded-md flex items-center justify-center"
                            style={{ color: mutedColor, border: `1px solid ${borderColor}` }}
                            title="Compartilhar"
                            aria-label="Compartilhar este livro"
                        >
                            <Share2 size={12} />
                        </button>
                        <button
                            onClick={() => setShowToc(!showToc)}
                            className="w-8 h-8 sm:w-7 sm:h-7 rounded-md flex items-center justify-center"
                            style={{
                                color: showToc ? accentColor : mutedColor,
                                border: `1px solid ${showToc ? accentColor : borderColor}`,
                                background: showToc ? `${accentColor}10` : 'transparent',
                            }}
                            title="Indice"
                            aria-label="Abrir indice de capitulos"
                        >
                            <List size={12} />
                        </button>
                    </div>
                </div>
            </header>

            {/* TOC drawer */}
            <AnimatePresence>
                {showToc && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowToc(false)}
                        />
                        <motion.aside
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] overflow-y-auto"
                            style={{ background: surfaceBg, borderLeft: `1px solid ${borderColor}` }}
                        >
                            <div className="p-5">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: accentColor }}>
                                    Indice
                                </p>
                                <div className="space-y-0.5">
                                    {book.capitulos.map((ch, i) => (
                                        <button
                                            key={i}
                                            onClick={() => goTo(i)}
                                            className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all"
                                            style={{
                                                color: i === chapterIdx ? accentColor : textColor,
                                                background: i === chapterIdx ? `${accentColor}10` : 'transparent',
                                                fontWeight: i === chapterIdx ? 700 : 400,
                                            }}
                                        >
                                            <span style={{ color: mutedColor, fontSize: 11, marginRight: 6 }}>{i + 1}.</span>
                                            {ch.titulo}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Reader content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-16">
                {/* Chapter title */}
                <div className="mb-10">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-3" style={{ color: accentColor }}>
                        Capitulo {chapter.numero || chapterIdx + 1}
                    </p>
                    <h1
                        className="text-2xl sm:text-3xl font-bold leading-tight mb-3"
                        style={{ color: darkMode ? '#fff' : '#111', fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                        {chapter.titulo}
                    </h1>
                    {chapter.tempo_leitura_min && (
                        <p className="text-xs" style={{ color: mutedColor }}>
                            ~{chapter.tempo_leitura_min} min de leitura
                        </p>
                    )}
                    <div className="mt-6 h-px" style={{ background: `linear-gradient(90deg, ${accentColor}40, transparent)` }} />
                </div>

                {/* HTML content */}
                <div
                    className="reader-content"
                    dangerouslySetInnerHTML={{ __html: renderChapterContent(chapter) }}
                />

                {/* Navigation */}
                <div className="mt-16 pt-8 flex items-center justify-between gap-4" style={{ borderTop: `1px solid ${borderColor}` }}>
                    <button
                        onClick={() => goTo(chapterIdx - 1)}
                        disabled={chapterIdx === 0}
                        className="relative flex items-center gap-2 px-4 py-3 min-h-[48px] text-xs font-semibold uppercase tracking-[1px] transition-all disabled:opacity-20 active:scale-[0.97]"
                        style={{ color: darkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)', border: `1px solid ${borderColor}`, borderRadius: 6 }}
                        aria-label="Capitulo anterior"
                    >
                        <ChevronLeft size={16} /> <span className="hidden sm:inline">Anterior</span>
                    </button>
                    <span className="text-xs font-mono" style={{ color: mutedColor }}>
                        {chapterIdx + 1} / {totalChapters}
                    </span>
                    <button
                        onClick={() => goTo(chapterIdx + 1)}
                        disabled={chapterIdx >= totalChapters - 1}
                        className="relative overflow-hidden flex items-center gap-2 px-4 py-3 min-h-[48px] text-xs font-semibold uppercase tracking-[1px] transition-all disabled:opacity-20 active:scale-[0.97]"
                        style={{ color: '#ffffff', background: '#0A1624', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6 }}
                        aria-label="Proximo capitulo"
                    >
                        <span className="hidden sm:inline">Proximo</span> <ChevronRight size={16} />
                        {/* Gold gradient line at bottom — design system accent */}
                        <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6, pointerEvents: 'none' }} />
                    </button>
                </div>
            </main>
        </div>
    )
}
