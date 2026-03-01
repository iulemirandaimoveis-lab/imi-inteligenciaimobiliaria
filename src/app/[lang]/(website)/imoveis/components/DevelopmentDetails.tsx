'use client';

import { motion } from 'framer-motion';
import { Bed, Maximize, Bath, Car, Check } from 'lucide-react';
import { Development } from '../types/development';
import { slideUp, staggerContainer } from '@/lib/animations';

interface DevelopmentDetailsProps {
    development: Development;
}

export default function DevelopmentDetails({ development }: DevelopmentDetailsProps) {
    const specs = [
        { icon: Maximize, label: 'Área', value: development.specs.areaRange },
        { icon: Bed, label: 'Quartos', value: development.specs.bedroomsRange },
        { icon: Bath, label: 'Banheiros', value: development.specs.bathroomsRange || '-' },
        { icon: Car, label: 'Vagas', value: development.specs.parkingRange || '-' },
    ];

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
        >
            {/* Description */}
            <motion.div variants={slideUp} className="mb-10">
                <h2
                    className="text-2xl md:text-3xl text-gray-900 mb-5 font-bold tracking-tight"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                    Sobre o empreendimento
                </h2>
                <p className="text-gray-500 leading-relaxed text-[15px] md:text-base font-light max-w-2xl">
                    {development.description}
                </p>
            </motion.div>

            {/* Specs Grid */}
            <motion.div variants={slideUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
                {specs.map((spec, idx) => (
                    <div key={idx} className="bg-[#F8FAFB] rounded-xl p-4 border border-gray-100">
                        <spec.icon className="w-5 h-5 text-[#627D98] mb-2.5" strokeWidth={1.5} />
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">{spec.label}</p>
                        <p className="text-gray-900 font-bold text-lg">{spec.value}</p>
                    </div>
                ))}
            </motion.div>

            {/* Features */}
            {development.features && development.features.length > 0 && (
                <motion.div variants={slideUp}>
                    <h3
                        className="text-xl text-gray-900 mb-5 font-bold tracking-tight"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                        Diferenciais e Lazer
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                        {development.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-3 group">
                                <div className="w-5 h-5 rounded-full bg-[#102A43]/8 flex items-center justify-center flex-shrink-0">
                                    <Check className="w-3 h-3 text-[#486581]" />
                                </div>
                                <span className="text-gray-600 text-sm">{feature}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Developer */}
            <motion.div variants={slideUp} className="mt-10 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#334E68]" />
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">Incorporação</span>
                </div>
                <p className="text-gray-900 font-bold mt-1.5">{development.developer}</p>
            </motion.div>
        </motion.div>
    );
}
