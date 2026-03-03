import Link from 'next/link'
import { FileSearch } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-imi-50 rounded-3xl border border-imi-100/50 m-6 mt-16 md:mt-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-soft mb-8 border border-imi-100">
                <FileSearch className="w-10 h-10 text-accent-500" strokeWidth={1.5} />
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-imi-900 mb-4 font-display">
                Página não encontrada
            </h1>

            <p className="text-imi-500 text-lg max-w-lg text-center mb-10 leading-relaxed font-light">
                A rota que você tentou acessar não existe ou foi removida. Verifique a URL ou retorne ao dashboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link
                    href="/backoffice/dashboard"
                    className="inline-flex items-center justify-center h-14 px-8 bg-imi-900 text-white font-bold rounded-xl hover:bg-imi-800 transition-all shadow-md hover:-translate-y-1"
                >
                    Voltar ao Dashboard
                </Link>
            </div>
        </div>
    )
}
