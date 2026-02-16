'use client'

export default function Error({ error }: { error: Error }) {
    console.error('Backoffice error:', error)
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
            <div className="bg-red-50 p-4 rounded-full mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-imi-900 mb-2">Algo deu errado!</h2>
            <p className="text-slate-600 mb-6 max-w-md">
                Ocorreu um erro inesperado ao carregar esta página. Tente recarregar ou contate o suporte.
            </p>

            <div className="bg-slate-50 p-4 rounded-lg text-left w-full max-w-2xl overflow-auto border border-slate-200 mb-6 max-h-60">
                <p className="text-xs font-bold text-red-600 mb-2 font-mono">{error.name}: {error.message}</p>
                <pre className="text-[10px] text-slate-500 font-mono whitespace-pre-wrap leading-relaxed">
                    {error.stack}
                </pre>
            </div>

            <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-imi-900 text-white rounded-xl font-bold hover:bg-imi-800 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            >
                Tentar novamente
            </button>
        </div>
    )
}
