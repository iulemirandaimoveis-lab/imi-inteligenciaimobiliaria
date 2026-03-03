'use client';

import { motion } from 'framer-motion';
import { slideUp, staggerContainer } from '@/lib/animations';
import Image from 'next/image';

const locations = [
    {
        name: 'Orlando, FL',
        description: 'Capital mundial do turismo familiar. Alta ocupação o ano todo impulsionada por Short-Term Rentals e parques temáticos.',
        image: 'https://images.unsplash.com/photo-1597466599360-3b9775841aec?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        stats: 'Yield médio: 6-8% a.a.'
    },
    {
        name: 'Miami, FL',
        description: 'Luxo supremo, valorização constante e demanda global. O centro financeiro e cultural da América Latina nos EUA.',
        image: 'https://images.unsplash.com/photo-1535498730771-e735b998cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        stats: 'Valorização: +12% a.a.'
    },
    {
        name: 'Dubai, UAE',
        description: 'Isenção de impostos (Tax-Free), alto luxo e segurança extrema. O mercado imobiliário mais dinâmico e futurista do mundo.',
        image: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        stats: 'Tax-Free Rental Income'
    }
];

export function LocationsSection() {
    return (
        <section id="locations" className="section-padding bg-[#141420]">
            <div className="container-custom">
                <div className="max-w-2xl mx-auto text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                        Mercados Premium Selecionados
                    </h2>
                    <p className="text-lg text-[#9CA3AF] font-light">
                        Atuamos apenas onde existem fundamentos sólidos de economia, turismo e potencial de valorização comprovado.
                    </p>
                </div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {locations.map((location, i) => (
                        <motion.article
                            key={location.name}
                            variants={slideUp}
                            className="flex flex-col bg-[#0D0F14] rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-white/[0.05] group hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(196,157,91,0.15)] hover:border-[#C49D5B]/30 transition-all duration-500"
                        >
                            <div className="relative aspect-[4/3] overflow-hidden">
                                <Image
                                    src={location.image}
                                    alt={location.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#141420]/80 to-transparent opacity-80" />
                                <div className="absolute bottom-6 left-6">
                                    <span className="bg-[#C49D5B] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                                        Internacional
                                    </span>
                                </div>
                            </div>

                            <div className="p-8 flex flex-col flex-grow">
                                <h3 className="text-2xl font-bold text-white mb-4 font-display">
                                    {location.name}
                                </h3>
                                <p className="text-[#9CA3AF] text-sm leading-relaxed mb-6 flex-grow">
                                    {location.description}
                                </p>
                                <div className="pt-6 border-t border-white/5">
                                    <span className="text-sm font-bold text-white flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#C49D5B]" />
                                        {location.stats}
                                    </span>
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
