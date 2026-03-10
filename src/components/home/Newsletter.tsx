'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, CheckCircle, Loader2 } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/motion-primitives'

export default function Newsletter() {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        setStatus('loading')
        try {
            const res = await fetch('/api/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })
            setStatus(res.ok ? 'success' : 'error')
            if (res.ok) setEmail('')
        } catch {
            setStatus('error')
        }
    }

    return (
        <section className="py-20 lg:py-24 bg-[#102A43] relative overflow-hidden">
            {/* Ambient elements */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-[#334E68]/20 blur-[100px] rounded-full -translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#C8A65A]/5 blur-[120px] rounded-full translate-x-1/3 translate-y-1/3" />

            <div className="relative z-10 max-w-[700px] mx-auto px-6 lg:px-8 text-center">
                <ScrollReveal>
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.08] border border-white/[0.10] flex items-center justify-center mx-auto mb-6">
                        <Mail size={24} className="text-[#C8A65A]" strokeWidth={1.5} />
                    </div>

                    <h2
                        className="text-[24px] sm:text-[32px] font-bold text-white leading-tight mb-4"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                        Insights imobiliários{' '}
                        <span className="text-[#C8A65A]">direto no seu email</span>
                    </h2>

                    <p className="text-white/50 text-sm sm:text-base mb-8 max-w-md mx-auto leading-relaxed">
                        Receba análises de mercado, oportunidades de investimento e relatórios exclusivos. Sem spam, apenas conteúdo relevante.
                    </p>

                    {status === 'success' ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-sm"
                        >
                            <CheckCircle size={18} />
                            Inscrito com sucesso! Fique de olho no seu email.
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                            <div className="flex-1 relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    required
                                    className="w-full h-[52px] bg-white/[0.08] border border-white/[0.12] rounded-xl px-4 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#C8A65A]/50 focus:ring-1 focus:ring-[#C8A65A]/20 transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="h-[52px] px-6 bg-[#C8A65A] hover:bg-[#B89544] text-[#0A1017] font-bold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.97] disabled:opacity-60 whitespace-nowrap"
                            >
                                {status === 'loading' ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        Inscrever-se
                                        <ArrowRight size={14} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {status === 'error' && (
                        <p className="text-red-400 text-xs mt-3">Erro ao inscrever. Tente novamente.</p>
                    )}

                    <p className="text-white/20 text-[11px] mt-4">
                        Sem spam. Cancele a qualquer momento.
                    </p>
                </ScrollReveal>
            </div>
        </section>
    )
}
