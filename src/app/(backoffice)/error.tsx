'use client'

import { AlertTriangle, RotateCcw, ShieldAlert } from 'lucide-react'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { AppError } from '@/lib/errors'

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[NEXT BOUNDARY] Global Backoffice Error:', error)
        toast.error('Ocorreu um erro inesperado', {
            description: error.message || 'Verifique sua conexão ou tente recarregar',
            duration: 5000
        })
    }, [error])

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-white border border-red-100 m-6 mt-16 md:mt-6 rounded-3xl relative overflow-hidden">
            {/* Decorative BG element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring" }}
                className="relative z-10 w-24 h-24 mb-10 bg-red-50 rounded-[2rem] rotate-3 flex items-center justify-center border border-red-100 shadow-sm"
            >
                <div className="w-full h-full -rotate-3 flex items-center justify-center text-red-600">
                    <ShieldAlert size={40} className="stroke-[1.5]" />
                </div>
            </motion.div>

            <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl md:text-5xl font-black text-imi-900 mb-6 font-display text-center leading-tight tracking-tight relative z-10"
            >
                Sessão Interrompida
            </motion.h1>

            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-imi-500 text-lg md:text-xl max-w-2xl text-center mb-12 font-light leading-relaxed relative z-10"
            >
                Detectamos uma falha crítica ao processar sua requisição no backoffice.
                Nossos sistemas de inteligência já foram notificados sobre este evento.
            </motion.p>

            {process.env.NODE_ENV === 'development' && (
                <div className="mb-12 p-6 bg-slate-50 border border-slate-200 rounded-2xl w-full max-w-3xl overflow-x-auto relative z-10 shadow-inner">
                    <p className="font-bold text-red-600 mb-3 text-sm flex items-center gap-2">
                        <AlertTriangle size={16} /> Stack Trace
                    </p>
                    <pre className="text-xs text-slate-600 font-mono leading-relaxed whitespace-pre-wrap">
                        {error.stack || error.message}
                    </pre>
                </div>
            )}

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4 relative z-10"
            >
                <button
                    onClick={() => reset()}
                    className="inline-flex items-center justify-center gap-3 h-14 px-8 bg-imi-900 text-white font-bold rounded-2xl hover:bg-imi-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                    <RotateCcw size={20} className="stroke-2" />
                    Restaurar Sessão
                </button>
                <button
                    onClick={() => window.location.href = '/backoffice/dashboard'}
                    className="inline-flex items-center justify-center h-14 px-8 bg-white text-imi-900 font-bold rounded-2xl border border-imi-200 hover:bg-imi-50 transition-colors"
                >
                    Retornar ao Início
                </button>
            </motion.div>
        </div>
    )
}
