'use client';

import { motion } from 'framer-motion';
import { Bed, Maximize, Bath, Car, Check, Sparkles, Building2, Waves, TreePine, Dumbbell } from 'lucide-react';
import { Development } from '../types/development';
import { slideUp, staggerContainer } from '@/lib/animations';

const GOLD = '#C8A44A';
const NAVY = '#0B1928';

interface DevelopmentDetailsProps {
    development: Development;
}

const FEATURE_ICONS: Record<string, any> = {
    'piscina': Waves, 'pool': Waves,
    'academia': Dumbbell, 'gym': Dumbbell, 'fitness': Dumbbell,
    'jardim': TreePine, 'garden': TreePine, 'parque': TreePine,
    'salão': Building2, 'salao': Building2, 'churrasqueira': Building2,
};

function getFeatureIcon(feature: string) {
    const lower = feature.toLowerCase();
    for (const [key, Icon] of Object.entries(FEATURE_ICONS)) {
        if (lower.includes(key)) return Icon;
    }
    return Check;
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
            {/* Section heading — premium style */}
            <motion.div variants={slideUp} className="mb-10">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-[2px] rounded-full" style={{ background: GOLD }} />
                    <span className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: GOLD }}>Sobre</span>
                </div>
                <h2
                    className="text-2xl md:text-[32px] text-gray-900 font-bold tracking-tight leading-tight"
                    style={{ fontFamily: "var(--font-serif, 'Libre Baskerville', Georgia, serif)" }}
                >
                    Sobre o empreendimento
                </h2>
            </motion.div>

            {/* Description */}
            <motion.div variants={slideUp} className="mb-12">
                <p className="text-gray-500 leading-[1.9] text-[15px] md:text-base max-w-2xl"
                   style={{ fontFamily: "var(--font-sans, 'Figtree', system-ui, sans-serif)" }}>
                    {development.description}
                </p>
            </motion.div>

            {/* Specs Grid — premium dark cards */}
            <motion.div variants={slideUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-14">
                {specs.map((spec, idx) => (
                    <div
                        key={idx}
                        className="rounded-2xl p-5 md:p-6 relative overflow-hidden group transition-all duration-300 hover:translate-y-[-2px]"
                        style={{
                            background: `linear-gradient(145deg, ${NAVY} 0%, #102A43 100%)`,
                            border: '1px solid rgba(200,164,74,0.12)',
                            boxShadow: '0 4px 20px rgba(11,25,40,0.3)',
                        }}
                    >
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(200,164,74,0.08) 0%, transparent 70%)' }} />
                        <div className="relative z-10">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(200,164,74,0.1)', border: '1px solid rgba(200,164,74,0.12)' }}>
                                <spec.icon className="w-4 h-4" strokeWidth={1.5} style={{ color: GOLD }} />
                            </div>
                            <p className="text-[10px] uppercase tracking-[0.18em] font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{spec.label}</p>
                            <p className="text-white font-bold text-lg md:text-xl" style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}>
                                {spec.value}{spec.unit}
                            </p>
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Features / Diferenciais */}
            {development.features && development.features.length > 0 && (
                <motion.div variants={slideUp}>
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-[2px] rounded-full" style={{ background: GOLD }} />
                            <span className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: GOLD }}>Infraestrutura</span>
                        </div>
                        <h3
                            className="text-xl md:text-2xl text-gray-900 font-bold tracking-tight"
                            style={{ fontFamily: "var(--font-serif, 'Libre Baskerville', Georgia, serif)" }}
                        >
                            Diferenciais e Lazer
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {development.features.map((feature, idx) => {
                            const FeatureIcon = getFeatureIcon(feature);
                            return (
                                <div key={idx} className="flex items-center gap-3 group py-2.5 px-4 rounded-xl transition-all duration-200 hover:bg-gray-50">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-105"
                                        style={{ background: 'rgba(200,164,74,0.08)', border: '1px solid rgba(200,164,74,0.12)' }}
                                    >
                                        <FeatureIcon className="w-3.5 h-3.5" style={{ color: GOLD }} />
                                    </div>
                                    <span className="text-gray-600 text-sm font-medium group-hover:text-gray-900 transition-colors">{feature}</span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Developer — elevated card */}
            <motion.div variants={slideUp} className="mt-12 pt-10 border-t border-gray-100">
                <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(11,25,40,0.03)', border: '1px solid rgba(11,25,40,0.06)' }}>
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: NAVY }}
                    >
                        <Sparkles className="w-5 h-5" style={{ color: GOLD }} />
                    </div>
                    <div>
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 block mb-0.5">Incorporação</span>
                        <p className="text-gray-900 font-bold text-base">{development.developer}</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
