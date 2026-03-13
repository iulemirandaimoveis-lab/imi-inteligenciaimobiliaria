'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log error to console only in dev — never expose to user
        if (process.env.NODE_ENV === 'development') {
            console.error('Backoffice error:', error)
        }
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-12 text-center">
            {/* Icon */}
            <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(229,115,115,0.10)' }}
            >
                <AlertTriangle size={28} style={{ color: 'var(--bo-error)' }} />
            </div>

            {/* Title */}
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--bo-text)' }}>
                Erro ao carregar
            </h2>

            {/* Description — NO stack trace, NO technical details */}
            <p className="text-sm mb-8 max-w-sm leading-relaxed" style={{ color: 'var(--bo-text-muted)' }}>
                Ocorreu um erro inesperado. Tente recarregar a pagina.
                Se o problema persistir, entre em contato com o suporte.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button
                    onClick={reset}
                    className="flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                    style={{
                        background: 'var(--bo-accent)',
                    }}
                >
                    <RefreshCw size={15} />
                    Tentar novamente
                </button>

                <button
                    onClick={() => (window.location.href = '/backoffice/dashboard')}
                    className="flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-medium transition-all active:scale-95"
                    style={{
                        background: 'var(--bo-elevated)',
                        border: '1px solid var(--bo-border)',
                        color: 'var(--bo-text-muted)',
                    }}
                >
                    <Home size={15} />
                    Dashboard
                </button>
            </div>

            {/* Error digest for support — minimal, no stack */}
            {error.digest && (
                <p className="mt-6 text-[10px] font-mono" style={{ color: 'var(--bo-text-muted)', opacity: 0.5 }}>
                    Ref: {error.digest}
                </p>
            )}
        </div>
    )
}
