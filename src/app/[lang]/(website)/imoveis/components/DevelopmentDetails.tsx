'use client';

import { motion } from 'framer-motion';
import { Bed, Maximize, Bath, Car, Check, Sparkles } from 'lucide-react';
import { Development } from '../types/development';
import { slideUp, staggerContainer } from '@/lib/animations';

const GOLD = '#C8A44A';

interface DevelopmentDetailsProps {
    development: Development;
}

export default function DevelopmentDetails({ development }: DevelopmentDetailsProps) {
    const specs = [
        { icon: Maximize, label: 'Área', value: development.specs.areaRange, unit: '' },
        { icon: Bed, label: 'Quartos', value: development.specs.bedroomsRange, unit: '' },
        { icon: Bath, label: 'Banheiros', value: development.specs.bathroomsRange || '-', unit: '' },
        { icon: Car, label: 'Vagas', value: development.specs.parkingRange || '-', unit: '' },
    ];

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
        >
            {/* Section heading */}
            <motion.div variants={slideUp} className="flex items-center gap-3 mb-8">
                <div className="w-1 h-6 rounded-full" style={{ background: GOLD }} />
                <h2
                    className="text-2xl md:text-3xl text-gray-900 font-bold tracking-tight"
                    style={{ fontFamily: "'Libre Baskerville', 'Playfair Display', Georgia, serif" }}
                >
                    Sobre o empreendimento
                </h2>
            </motion.div>

            {/* Description */}
            <motion.div variants={slideUp} className="mb-10">
                <p className="text-gray-500 leading-[1.85] text-[15px] md:text-base max-w-2xl">
                    {development.description}
                </p>
            </motion.div>

            {/* Specs Grid — elevated cards */}
            <motion.div variants={slideUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
                {specs.map((spec, idx) => (
                    <div
                        key={idx}
                        className="rounded-2xl p-5 relative overflow-hidden group transition-all duration-200"
                        style={{
                            background: '#0B1928',
                            border: '1px solid rgba(200,164,74,0.12)',
                        }}
                    >
                        {/* Subtle gold glow on hover */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'radial-gradient(circle at center, rgba(200,164,74,0.06) 0%, transparent 70%)' }} />
                        <spec.icon className="w-5 h-5 mb-3" strokeWidth={1.5} style={{ color: GOLD, opacity: 0.7 }} />
                        <p className="text-[10px] uppercase tracking-[0.15em] font-bold mb-1" style={{ color: '#627D98' }}>{spec.label}</p>
                        <p className="text-white font-bold text-lg">{spec.value}{spec.unit}</p>
                    </div>
                ))}
            </motion.div>

            {/* Features / Diferenciais */}
            {development.features && development.features.length > 0 && (
                <motion.div variants={slideUp}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-5 rounded-full" style={{ background: GOLD }} />
                        <h3
                            className="text-xl text-gray-900 font-bold tracking-tight"
                            style={{ fontFamily: "'Libre Baskerville', 'Playfair Display', Georgia, serif" }}
                        >
                            Diferenciais e Lazer
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
                        {development.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-3 group py-1">
                                <div
                                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'rgba(200,164,74,0.1)', border: '1px solid rgba(200,164,74,0.15)' }}
                                >
                                    <Check className="w-3 h-3" style={{ color: GOLD }} />
                                </div>
                                <span className="text-gray-600 text-sm group-hover:text-gray-900 transition-colors">{feature}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Developer */}
            <motion.div variants={slideUp} className="mt-10 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-4">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: '#0B1928' }}
                    >
                        <Sparkles className="w-4 h-4" style={{ color: GOLD }} />
                    </div>
                    <div>
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 block">Incorporação</span>
                        <p className="text-gray-900 font-bold">{development.developer}</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
