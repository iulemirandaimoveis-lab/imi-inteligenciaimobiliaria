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
        <section className="section-padding bg-white border-t border-imi-100">
            <div className="container-custom text-center">
                <h2 className="text-3xl font-display font-bold text-imi-900 mb-4">
                    {dict.final_cta_title}
                </h2>
                <p className="text-imi-500 mb-8 max-w-xl mx-auto">
                    {dict.final_cta_desc}
                </p>
                <Button
                    size="lg"
                    className="h-14 px-10 text-lg"
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
