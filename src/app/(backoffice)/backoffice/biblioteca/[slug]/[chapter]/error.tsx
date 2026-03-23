'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { BookOpen, ArrowLeft, RefreshCw } from 'lucide-react'

export default function ChapterError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const params = useParams()
    const slug = params?.slug as string | undefined

    useEffect(() => {
        console.error('Biblioteca chapter error:', error)
    }, [error])

    return (
        <div
            className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4"
            style={{ background: 'var(--bg, #050B14)' }}
        >
            <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(200,164,74,.1)' }}
            >
                <BookOpen size={28} style={{ color: 'var(--g, #C8A44A)' }} />
            </div>

            <div className="text-center space-y-2 max-w-md">
                <h1
                    className="text-xl font-bold"
                    style={{
                        color: 'var(--t1, #E8E4DC)',
                        fontFamily: 'var(--font-display, "Playfair Display", serif)',
                    }}
                >
                    Erro ao carregar capitulo
                </h1>
                <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--t2, #8E99AB)' }}
                >
                    Nao foi possivel carregar este capitulo.
                    Verifique se o endereco esta correto ou tente novamente.
                </p>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={reset}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    style={{
                        background: 'rgba(200,164,74,.12)',
                        color: 'var(--g, #C8A44A)',
                        border: '1px solid rgba(200,164,74,.2)',
                    }}
                >
                    <RefreshCw size={14} />
                    Tentar novamente
                </button>

                <Link
                    href={slug ? `/backoffice/biblioteca/${slug}` : '/backoffice/biblioteca'}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    style={{
                        background: 'var(--n, #0A1624)',
                        color: 'var(--t2, #8E99AB)',
                        border: '1px solid rgba(200,164,74,.14)',
                    }}
                >
                    <ArrowLeft size={14} />
                    {slug ? 'Voltar ao indice' : 'Voltar a Biblioteca'}
                </Link>
            </div>

            {error.digest && (
                <p
                    className="text-[10px] font-mono"
                    style={{ color: 'var(--t3, #4F5B6B)' }}
                >
                    Ref: {error.digest}
                </p>
            )}
        </div>
    )
}
