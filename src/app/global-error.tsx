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

                    <div className="p-6 rounded-xl text-left w-full max-w-3xl border shadow-lg mb-8" style={{ background: '#142840', borderColor: 'rgba(200,164,74,0.18)' }}>
                        <p className="text-sm font-bold text-[#C8A44A] mb-2 font-mono">
                            Algo deu errado. Nossa equipe já foi notificada.
                        </p>
                        <p className="text-xs text-[#A8B0BC] mt-2">
                            Se o problema persistir, entre em contato informando a referência abaixo.
                        </p>
                        {error.digest && (
                            <p className="mt-4 text-xs text-[#5C6B7D] font-mono">Referência: {error.digest}</p>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => reset()}
                            className="px-6 py-3 rounded-[6px] font-bold text-sm uppercase tracking-[0.1em] transition-all transform hover:-translate-y-0.5 relative overflow-hidden"
                            style={{ background: '#0A1624', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                            Tentar novamente
                            <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6, pointerEvents: 'none' }} />
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
