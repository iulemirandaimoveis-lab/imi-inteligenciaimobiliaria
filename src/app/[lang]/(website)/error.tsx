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
        if (process.env.NODE_ENV === 'development') {
            console.error('[website error]', error)
        }
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-12 text-center">
            <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-5"
                 style={{ background: 'rgba(229,115,115,0.10)' }}>
                <AlertTriangle size={28} style={{ color: '#e57373' }} />
            </div>
            <h2 className="text-lg font-bold mb-2">Algo deu errado</h2>
            <p className="text-sm mb-8 max-w-sm leading-relaxed text-gray-500">
                Ocorreu um erro inesperado. Tente recarregar a pagina.
            </p>
            <div className="flex items-center gap-3">
                <button onClick={reset}
                    className="flex items-center gap-2 h-11 px-6 rounded-md text-sm font-semibold bg-black text-white active:scale-95 transition-all">
                    <RefreshCw size={15} /> Tentar novamente
                </button>
                <button onClick={() => (window.location.href = '/')}
                    className="flex items-center gap-2 h-11 px-6 rounded-md text-sm font-medium border border-gray-200 text-gray-600 active:scale-95 transition-all">
                    <Home size={15} /> Inicio
                </button>
            </div>
            {error.digest && (
                <p className="mt-6 text-[10px] font-mono text-gray-400">Ref: {error.digest}</p>
            )}
        </div>
    )
}
