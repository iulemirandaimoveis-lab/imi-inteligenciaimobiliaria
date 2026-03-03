'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import LeadCaptureModal from '@/app/[lang]/(website)/imoveis/components/LeadCaptureModal'
import { ButtonPrimary } from '@/components/website/Buttons'

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
                <ButtonPrimary
                    size="lg"
                    onClick={() => setIsModalOpen(true)}
                >
                    {dict.final_cta_btn}
                </ButtonPrimary>
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
