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
                <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[#0B1928]">
                    <div className="p-6 rounded-full mb-6 shadow-sm" style={{ background: 'rgba(200,164,74,0.12)' }}>
                        <AlertCircle className="w-12 h-12 text-[#C8A44A]" />
                    </div>
                    <h2 className="text-3xl font-bold text-[#F0ECE4] mb-2">Erro Critico do Sistema</h2>
                    <p className="text-[#A8B0BC] mb-8 max-w-md">
                        Ocorreu um erro irrecuperavel na aplicacao.
                    </p>

                    <div className="p-6 rounded-xl text-left w-full max-w-3xl overflow-auto border shadow-lg mb-8 max-h-[50vh]" style={{ background: '#142840', borderColor: 'rgba(200,164,74,0.18)' }}>
                        <p className="text-sm font-bold text-[#C8A44A] mb-2 font-mono border-b pb-2" style={{ borderColor: 'rgba(200,164,74,0.12)' }}>
                            {error.name}: {error.message}
                        </p>
                        {error.stack && (
                            <pre className="text-xs text-[#A8B0BC] font-mono whitespace-pre-wrap leading-relaxed">
                                {error.stack}
                            </pre>
                        )}
                        {error.digest && (
                            <p className="mt-4 text-xs text-[#5C6B7D] font-mono">Digest: {error.digest}</p>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => reset()}
                            className="px-6 py-3 bg-[#C8A44A] text-[#0B1928] rounded-xl font-bold hover:bg-[#D4B35A] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Tentar novamente
                        </button>
                        <Link
                            href="/"
                            className="px-6 py-3 bg-[#142840] text-[#A8B0BC] border rounded-xl font-bold hover:bg-[#1A3250] transition-all"
                            style={{ borderColor: 'rgba(200,164,74,0.25)' }}
                        >
                            Voltar ao Inicio
                        </Link>
                    </div>
                </div>
            </body>
        </html>
    )
}
