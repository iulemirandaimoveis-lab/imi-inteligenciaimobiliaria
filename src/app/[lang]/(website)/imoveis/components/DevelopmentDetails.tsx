'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles, Building2, Waves, TreePine, Dumbbell, Droplets, Gamepad2, PartyPopper, Flame, Bike, Eye, Sofa, Shirt, Snowflake, Shield, CircleParking, Monitor, Sun, CreditCard } from 'lucide-react';
import { Development } from '../types/development';
import { slideUp, staggerContainer } from '@/lib/animations';

const GOLD = '#C8A44A';
const NAVY = '#0B1928';

interface DevelopmentDetailsProps {
    development: Development;
    financingEnabled?: boolean;
    lang?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FEATURE_ICONS: Record<string, any> = {
    'piscina': Waves, 'pool': Waves,
    'academia': Dumbbell, 'gym': Dumbbell, 'fitness': Dumbbell,
    'jardim': TreePine, 'garden': TreePine, 'parque': TreePine,
    'salão': PartyPopper, 'salao': PartyPopper, 'festa': PartyPopper, 'party': PartyPopper,
    'churrasqueira': Flame, 'gourmet': Flame, 'bbq': Flame,
    'playground': Gamepad2, 'brinquedo': Gamepad2,
    'sauna': Droplets, 'spa': Droplets,
    'quadra': Gamepad2, 'esport': Gamepad2,
    'coworking': Monitor, 'trabalho': Monitor,
    'cinema': Monitor, 'home theater': Monitor,
    'rooftop': Sun, 'terraço': Sun, 'varanda': Sun,
    'segurança': Shield, 'portaria': Shield, '24h': Shield,
    'elevador': Building2, 'elevator': Building2,
    'garagem': CircleParking, 'vaga': CircleParking, 'parking': CircleParking,
    'ar condicionado': Snowflake, 'split': Snowflake,
    'vista': Eye, 'view': Eye, 'mar': Waves,
    'mobilia': Sofa, 'furnished': Sofa,
    'lavanderia': Shirt, 'laundry': Shirt,
    'bike': Bike, 'biciclet': Bike,
    'pet': TreePine, 'animal': TreePine,
};

function getFeatureIcon(feature: string) {
    const lower = feature.toLowerCase();
    for (const [key, Icon] of Object.entries(FEATURE_ICONS)) {
        if (lower.includes(key)) return Icon;
    }
    return Check;
}

export default function DevelopmentDetails({ development, financingEnabled = true, lang = 'pt' }: DevelopmentDetailsProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
        >
            {/* Section heading — premium style */}
            <motion.div variants={slideUp} className="mb-6 sm:mb-8 md:mb-10">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-[2px] rounded-full" style={{ background: '#B8B3A8' }} />
                    <span className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Sobre</span>
                </div>
                <h2
                    className="text-2xl md:text-[32px] font-bold tracking-tight leading-tight"
                    style={{ fontFamily: "var(--font-heading, 'Playfair Display', serif)", color: '#0B1928' }}
                >
                    Sobre o empreendimento
                </h2>
            </motion.div>

            {/* Available units urgency indicator */}
            {development.units && development.units.length > 0 && (
                <motion.div variants={slideUp}>
                    <div style={{
                        background: '#F0EDE5', border: '1px solid rgba(184,179,168,0.3)',
                        borderRadius: 12, padding: '10px 16px', marginBottom: 16,
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#0B1928', letterSpacing: '0.5px' }}>
                            {development.units.filter(u => u.status === 'available').length} unidades disponíveis
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Description */}
            <motion.div variants={slideUp} className="mb-7 sm:mb-9 md:mb-12">
                <p className="leading-[1.9] text-[15px] md:text-base max-w-2xl"
                   style={{ fontFamily: "var(--fu, 'Outfit', sans-serif)", color: '#2D3748' }}>
                    {development.description}
                </p>
            </motion.div>

            {/* Features / Diferenciais */}
            {development.features && development.features.length > 0 && (
                <motion.div variants={slideUp}>
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-[2px] rounded-full" style={{ background: '#B8B3A8' }} />
                            <span className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Infraestrutura</span>
                        </div>
                        <h3
                            className="text-xl md:text-2xl font-bold tracking-tight"
                            style={{ fontFamily: "var(--font-heading, 'Playfair Display', serif)", color: '#0B1928' }}
                        >
                            Diferenciais e Lazer
                        </h3>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                        {development.features.map((feature, idx) => {
                            const FeatureIcon = getFeatureIcon(feature);
                            return (
                                <div key={idx} className="flex items-center gap-2 py-2 px-3.5 rounded-xl transition-all duration-200"
                                    style={{ background: '#F0EDE5', border: '1px solid rgba(184,179,168,0.3)' }}>
                                    <FeatureIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#0B1928', opacity: 0.6 }} />
                                    <span className="text-sm font-medium" style={{ color: '#0B1928' }}>{feature}</span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Developer — elevated card */}
            <motion.div variants={slideUp} className="mt-6 pt-6 sm:mt-8 sm:pt-8 md:mt-12 md:pt-10 border-t border-gray-100">
                <div className="flex items-center gap-4 p-4 rounded-[10px]" style={{ background: 'rgba(11,25,40,0.03)', border: '1px solid rgba(11,25,40,0.06)' }}>
                    {development.developerLogo ? (
                        <div className="flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={development.developerLogo}
                                alt={development.developer}
                                style={{ height: 48, width: 'auto', maxWidth: 140, objectFit: 'contain' }}
                            />
                        </div>
                    ) : (
                        <div
                            className="w-12 h-12 rounded-[4px] flex items-center justify-center flex-shrink-0"
                            style={{ background: NAVY }}
                        >
                            <Sparkles className="w-5 h-5" style={{ color: GOLD }} />
                        </div>
                    )}
                    <div>
                        <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-400 block mb-0.5" style={{ fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Incorporação</span>
                        <p className="text-gray-900 font-bold text-base">{development.developer}</p>
                    </div>
                </div>
            </motion.div>

            {/* Financiamento */}
            {financingEnabled && (
                <motion.div variants={slideUp} className="mt-8">
                    <div className="p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4"
                        style={{ background: '#F8F6F2', border: '1px solid rgba(184,179,168,0.3)' }}>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-8 h-[2px] rounded-full" style={{ background: '#B8B3A8' }} />
                                <span className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: '#948F84' }}>Financiamento</span>
                            </div>
                            <p className="text-base font-bold mb-0.5" style={{ color: '#0B1928', fontFamily: "var(--font-heading, 'Playfair Display', serif)" }}>
                                Este imóvel aceita financiamento
                            </p>
                            <p className="text-sm" style={{ color: '#948F84' }}>
                                Simule parcelas, compare bancos e condições na nossa calculadora de crédito.
                            </p>
                        </div>
                        <a
                            href={`/${lang}/credito`}
                            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl font-bold text-sm whitespace-nowrap flex-shrink-0 transition-opacity hover:opacity-90"
                            style={{ background: '#0B1928', color: '#FFFFFF', fontFamily: "var(--fu, 'Outfit', sans-serif)", letterSpacing: '0.04em' }}
                        >
                            <CreditCard size={15} />
                            Simular Financiamento
                        </a>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
