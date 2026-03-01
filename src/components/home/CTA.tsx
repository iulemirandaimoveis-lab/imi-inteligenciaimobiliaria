'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import LeadCaptureModal from '@/app/[lang]/(website)/imoveis/components/LeadCaptureModal'
import Button from '@/components/ui/Button'

interface CTAProps {
    dict: {
        final_cta_title: string
        final_cta_desc: string
        final_cta_btn: string
    }
}

export default function CTA({ dict }: CTAProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleSuccess = () => {
        window.open("https://wa.me/5581997230455", "_blank")
        setIsModalOpen(false)
    }
    return (
        <section className="py-24 bg-[#0D0F14] relative overflow-hidden">
            {/* Background elements for premium aesthetic */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #334E68 0%, transparent 70%)', filter: 'blur(100px)' }} />

            <div className="container-custom text-center relative z-10">
                <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                    {dict.final_cta_title}
                </h2>
                <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                    {dict.final_cta_desc}
                </p>
                <Button
                    size="lg"
                    className="h-16 px-12 text-lg font-bold bg-[#1A1E2A] text-white hover:bg-[#21263A] border border-[#21263A] border-l-4 border-l-[#334E68] border-r-4 border-r-[#E53935] shadow-[0_8px_32px_rgba(26,26,46,0.15)] rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(26,26,46,0.25)]"
                    onClick={() => setIsModalOpen(true)}
                >
                    {dict.final_cta_btn}
                </Button>
            </div>
            <AnimatePresence>
                {isModalOpen && (
                    <LeadCaptureModal
                        title="Atendimento IMI"
                        description="Preencha seus dados para falar com um consultor técnico e iniciar sua jornada imobiliária."
                        customInterest="CTA Principal Home"
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={handleSuccess}
                    />
                )}
            </AnimatePresence>
        </section>
    )
}
