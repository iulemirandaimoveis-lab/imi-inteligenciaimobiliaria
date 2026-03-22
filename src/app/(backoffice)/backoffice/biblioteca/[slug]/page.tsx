'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'
import { T } from '@/app/(backoffice)/lib/theme'
import { BookOpen, Clock, ChevronRight, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

interface Chapter {
    numero: number
    titulo: string
    objetivo?: string
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

export default function BookDetailPage() {
    const params = useParams()
    const slug = params.slug as string

    const [book, setBook] = useState<BookData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!slug) return

        async function loadBook() {
            try {
                const res = await fetch(`/books/${slug}.json`)
                if (!res.ok) throw new Error('Livro não encontrado')
                const data: BookData = await res.json()
                setBook(data)
            } catch (err) {
                console.error('Erro ao carregar livro:', err)
                toast.error('Não foi possível carregar o livro.')
            } finally {
                setLoading(false)
            }
        }

        loadBook()
    }, [slug])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={24} className="animate-spin" style={{ color: T.accent }} />
            </div>
        )
    }

    if (!book) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <BookOpen size={40} style={{ color: T.textDim }} />
                <p className="text-sm" style={{ color: T.textMuted }}>Livro não encontrado.</p>
                <Link href="/backoffice/biblioteca"
                    className="flex items-center gap-2 text-sm font-medium" style={{ color: T.accent }}>
                    <ArrowLeft size={14} /> Voltar à Biblioteca
                </Link>
            </div>
        )
    }

    const totalChapters = book.capitulos.length
    const totalReadTime = book.capitulos.reduce((sum, c) => sum + (c.tempo_leitura_min || 0), 0)

    return (
        <div className="space-y-6">
            <PageIntelHeader
                title={book.metadata.titulo}
                subtitle={book.metadata.subtitulo}
                breadcrumbs={[
                    { label: 'Biblioteca', href: '/backoffice/biblioteca' },
                    { label: book.metadata.titulo },
                ]}
            />

            {/* Book metadata card */}
            <div className="rounded-xl p-5 flex flex-wrap items-center gap-6"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ background: `${T.accent}15` }}>
                    <BookOpen size={22} style={{ color: T.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold" style={{ color: T.text }}>
                        {book.metadata.titulo}
                    </h2>
                    {book.metadata.autor && (
                        <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>
                            por {book.metadata.autor}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-4 text-xs font-mono" style={{ color: T.textDim }}>
                    <span>{totalChapters} capítulos</span>
                    {totalReadTime > 0 && (
                        <span className="flex items-center gap-1">
                            <Clock size={12} /> ~{totalReadTime}min
                        </span>
                    )}
                </div>
            </div>

            {/* Table of contents */}
            <div className="space-y-1.5">
                <h2 className="text-xs font-bold uppercase tracking-wider px-1 mb-3"
                    style={{ color: T.textDim }}>
                    Índice
                </h2>

                <div className="flex flex-col gap-2">
                    {book.capitulos.map((cap, idx) => (
                        <Link key={idx} href={`/backoffice/biblioteca/${slug}/${idx}`}
                            className="group flex items-center gap-4 p-4 rounded-lg transition-all hover:translate-x-1"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-mono text-sm font-bold"
                                style={{ background: `${T.accent}15`, color: T.accent }}>
                                {String(cap.numero || idx + 1).padStart(2, '0')}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold truncate" style={{ color: T.text }}>
                                    {cap.titulo}
                                </h3>
                                {cap.objetivo && (
                                    <p className="text-xs mt-0.5 truncate" style={{ color: T.textMuted }}>
                                        {cap.objetivo}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {cap.tempo_leitura_min && (
                                    <span className="text-[10px] font-mono" style={{ color: T.textDim }}>
                                        ~{cap.tempo_leitura_min}min
                                    </span>
                                )}
                                <ChevronRight size={14}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ color: T.accent }} />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
