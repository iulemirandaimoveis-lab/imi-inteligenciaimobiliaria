'use client'

import { motion } from 'framer-motion'
import { slideUp } from '@/lib/animations'
import { ConsultingCity } from '../data/cities'

interface CityHeroProps {
    city: ConsultingCity
}

export default function CityHero({ city }: CityHeroProps) {
    return (
        <section className="relative min-h-[70dvh] flex items-end overflow-hidden bg-imi-900 section-padding">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url('${city.heroImage}')` }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-imi-900 via-imi-900/60 to-transparent opacity-90" />
            </div>

            <div className="container-custom relative z-10">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={slideUp}
                    className="max-w-4xl"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <span className="text-4xl">{city.flag}</span>
                        <div className="w-12 h-px bg-gold-400" />
                        <span className="text-gold-400 font-bold uppercase tracking-[0.2em] text-xs">
                            {city.country}
                        </span>
                    </div>

                    <h1 className="text-white font-display font-bold text-4xl sm:text-6xl lg:text-7xl leading-[1.1] mb-6 tracking-tight">
                        Investir em <span className="text-gold-400">{city.name}</span>
                    </h1>

                    <p className="text-white/90 text-xl font-medium mb-4 font-display">
                        {city.tagline}
                    </p>

                    <p className="text-imi-200 text-lg md:text-xl font-light leading-relaxed max-w-2xl">
                        {city.description}
                    </p>
                </motion.div>
            </div>
        </section>
    )
}
