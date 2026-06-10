'use client'

import { MessageCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { ConsultingCity } from '../data/cities'

interface CityCTAProps {
    city: ConsultingCity
    lang: string
}

export default function CityCTA({ city, lang }: CityCTAProps) {
    const whatsappMessage = `Olá! Tenho interesse em investir em ${city.name}. Gostaria de agendar uma consultoria.`
    const whatsappUrl = `https://wa.me/5581986141487?text=${encodeURIComponent(whatsappMessage)}`

    return (
        <section className="bg-imi-900 text-white section-padding text-center relative overflow-hidden">
            {/* Background Details */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-accent-500/5 -skew-x-12 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/4 h-full bg-white/5 skew-x-12 -translate-x-1/4 pointer-events-none" />

            <div className="container-custom relative z-10">
                <div className="max-w-4xl mx-auto">
                    <h2 className="font-display text-3xl md:text-5xl font-bold mb-8 tracking-tight">
                        Pronto para investir em {city.name}?
                    </h2>
                    <p className="text-imi-300 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                        Nossa equipe técnica está pronta para desenhar sua estratégia de alocação de capital e proteger seu patrimônio.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Button asChild size="lg" className="bg-white text-imi-900 hover:bg-imi-50 h-16 px-10 text-lg min-w-[280px]">
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="w-6 h-6 mr-3" />
                                Falar com Especialista
                            </a>
                        </Button>
                    </div>
                    <p className="mt-8 text-imi-400 text-sm italic">
                        * Atendimento personalizado seguindo normas de compliance internacional.
                    </p>
                </div>
            </div>
        </section>
    )
}
