'use client';

import Button from '@/components/ui/Button';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import LeadCaptureModal from '@/app/[lang]/(website)/imoveis/components/LeadCaptureModal';

export function QualificationCTA() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSuccess = () => {
        window.open("https://wa.me/5581997230455?text=Ol%C3%A1%2C%20queria%20agendar%20uma%20sess%C3%A3o%20estrat%C3%A9gica%20sobre%20im%C3%B3veis%20internacionais.", "_blank");
        setIsModalOpen(false);
    };
    return (
        <section className="relative py-24 bg-[#0D0F14] overflow-hidden border-t border-white/[0.05]">
            {/* Background Details */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-[#C49D5B]/5 -skew-x-12 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/4 h-full bg-white/5 skew-x-12 -translate-x-1/4 pointer-events-none" />

            <div className="container-custom relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-white mb-8">
                        Vamos estruturar seu plano internacional?
                    </h2>

                    <p className="mt-6 text-lg md:text-xl leading-relaxed text-[#9CA3AF] max-w-2xl mx-auto font-light">
                        Agende uma sessão estratégica exclusiva com nossos especialistas para analisar seu perfil e apresentar as melhores teses de investimento disponíveis hoje.
                    </p>

                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center justify-center gap-3 h-14 sm:h-16 px-8 sm:px-12 text-[14px] sm:text-[16px] font-bold uppercase tracking-widest bg-[#1A1E2A] text-white rounded-2xl border border-[#21263A] border-l-4 border-[#C49D5B] border-r-4 border-r-[#E53935] shadow-[0_8px_32px_rgba(196,157,91,0.15)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(196,157,91,0.25)] transition-all duration-300 w-full sm:w-auto"
                        >
                            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#C49D5B]" />
                            Agendar Sessão Gratuita
                        </button>

                        <a
                            href="#simulator"
                            className="text-sm font-bold leading-6 text-[#DFE4E8] flex items-center gap-2 group hover:text-[#C49D5B] transition-colors"
                        >
                            Refazer simulação de investimento
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>

                    <div className="mt-12 pt-12 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { label: 'Sessões/Mês', value: '40+' },
                            { label: 'Especialistas', value: '08' },
                            { label: 'Taxa de Aprovação', value: '98%' },
                            { label: 'Suporte VIP', value: '24/7' }
                        ].map((item, i) => (
                            <div key={i} className="text-center">
                                <div className="text-xl font-bold text-[#C49D5B] mb-1">{item.value}</div>
                                <div className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-bold">{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {isModalOpen && (
                    <LeadCaptureModal
                        title="Sessão Estratégica"
                        description="Agende sua consultoria técnica sobre imóveis internacionais e receba um diagnóstico patrimonial em instantes."
                        customInterest="Consultoria Internacional / Sessão Estratégica"
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={handleSuccess}
                    />
                )}
            </AnimatePresence>
        </section>
    );
}
