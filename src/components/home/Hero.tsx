'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import { slideUp, staggerContainer } from '@/lib/animations'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import LeadCaptureModal from '@/app/[lang]/(website)/imoveis/components/LeadCaptureModal'

interface HeroProps {
    dict: {
        hero_title: string
        hero_subtitle: string
        cta_appraisal: string
        cta_whatsapp: string
    }
}

export default function Hero({ dict }: HeroProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const params = useParams()
    const lang = (params?.lang as string) || 'pt'

    const handleSuccess = () => {
        window.open("https://wa.me/5581997230455", "_blank")
        setIsModalOpen(false)
    }
    return (
        <section className="relative min-h-[100dvh] flex items-end overflow-hidden bg-imi-900">
            <div className="absolute inset-0 bg-cover bg-top bg-no-repeat" style={{ backgroundImage: "url('/hero-bg.jpg')" }}>
                <div className="absolute inset-0 bg-gradient-to-t from-imi-900 via-imi-900/70 to-imi-900/10 md:bg-gradient-to-r md:from-imi-900 md:via-imi-900/80 md:to-transparent" />
            </div>
            <div className="container-custom relative z-10 pb-16 sm:pb-20 md:pb-24 lg:pb-28 pt-32">
                <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-2xl">
                    <motion.h1 variants={slideUp} className="text-white font-display font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.15] mb-6 drop-shadow-lg whitespace-pre-line">{dict.hero_title}</motion.h1>
                    <motion.p variants={slideUp} className="text-base sm:text-lg text-imi-300 mb-10 max-w-md font-light leading-relaxed drop-shadow-md whitespace-pre-line">{dict.hero_subtitle}</motion.p>
                    <motion.div variants={slideUp} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <Link
                            href={`/${lang}/avaliacoes#form`}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-2xl bg-white text-imi-900 hover:bg-imi-50 shadow-xl h-14 transition-all duration-300 active:scale-95"
                        >
                            {dict.cta_appraisal}
                        </Link>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto border-white text-white hover:bg-white/10 h-14 font-medium"
                            onClick={() => setIsModalOpen(true)}
                        >
                            {dict.cta_whatsapp}
                        </Button>
                    </motion.div>
                </motion.div>
            </div>
            <AnimatePresence>
                {isModalOpen && (
                    <LeadCaptureModal
                        title="Atendimento IMI"
                        description="Preencha seus dados para receber um diagnóstico imobiliário e falar com nosso especialista."
                        customInterest="CTA Hero Home"
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={handleSuccess}
                    />
                )}
            </AnimatePresence>
        </section >
    )
}
