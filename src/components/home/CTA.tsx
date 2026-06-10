'use client'

import { useState, useRef } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
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
    const sectionRef = useRef<HTMLElement>(null)

    // Parallax background glow
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start end', 'end start'],
    })
    const glowY = useTransform(scrollYProgress, [0, 1], [60, -60])
    const glowScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.6, 1.3, 0.8])

    const handleSuccess = () => {
        window.open("https://wa.me/5581986141487", "_blank")
        setIsModalOpen(false)
    }
    return (
        <section ref={sectionRef} className="py-24 relative overflow-hidden" style={{ background: '#0B1928' }}>
            {/* Parallax background glow */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ y: glowY }}
            >
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(200,164,74,0.06) 0%, transparent 60%)',
                        filter: 'blur(100px)',
                        scale: glowScale,
                    }}
                />
            </motion.div>

            {/* Gold accent line at top */}
            <div className="absolute top-0 left-[15%] right-[15%] h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,164,74,0.2), transparent)' }} />

            <div className="container-custom text-center relative z-10">
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="text-3xl md:text-5xl font-display font-bold text-white mb-6"
                >
                    {dict.final_cta_title}
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="text-lg md:text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed"
                    style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}
                >
                    {dict.final_cta_desc}
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <ButtonPrimary
                        size="lg"
                        onClick={() => setIsModalOpen(true)}
                    >
                        {dict.final_cta_btn}
                    </ButtonPrimary>
                </motion.div>
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
