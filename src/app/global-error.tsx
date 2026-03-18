'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    // Auto-report critical errors to backend
    if (typeof window !== 'undefined') {
        fetch('/api/system/report-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error_message: error.message,
                stack_trace: error.stack,
                page_url: window.location.href,
                component_name: 'GlobalError',
                user_agent: navigator.userAgent,
                digest: error.digest,
                timestamp: new Date().toISOString(),
            }),
        }).catch(() => {})
    }

    return (
        <html>
            <body>
                <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-slate-50">
                    <div className="bg-red-50 p-6 rounded-full mb-6 shadow-sm">
                        <AlertCircle className="w-12 h-12 text-red-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-imi-900 mb-2">Erro Crítico do Sistema</h2>
                    <p className="text-slate-600 mb-8 max-w-md">
                        Ocorreu um erro irrecuperável na aplicação.
                    </p>

                    <div className="bg-white p-6 rounded-xl text-left w-full max-w-3xl overflow-auto border border-red-100 shadow-lg mb-8 max-h-[50vh]">
                        <p className="text-sm font-bold text-red-600 mb-2 font-mono border-b border-red-50 pb-2">
                            {error.name}: {error.message}
                        </p>
                        {error.stack && (
                            <pre className="text-xs text-slate-500 font-mono whitespace-pre-wrap leading-relaxed">
                                {error.stack}
                            </pre>
                        )}
                        {error.digest && (
                            <p className="mt-4 text-xs text-slate-400 font-mono">Digest: {error.digest}</p>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => reset()}
                            className="px-6 py-3 bg-imi-900 text-white rounded-xl font-bold hover:bg-imi-800 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                        >
                            Tentar novamente
                        </button>
                        <Link
                            href="/"
                            className="px-6 py-3 bg-white text-imi-900 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                        >
                            Voltar ao Início
                        </Link>
                    </div>
                </div>
            </body>
        </html>
    )
}
