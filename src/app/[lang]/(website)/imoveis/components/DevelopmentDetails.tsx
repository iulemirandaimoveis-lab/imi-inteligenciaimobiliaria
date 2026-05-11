'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Check, Sparkles, Building2, Waves, TreePine, Dumbbell, Droplets, Gamepad2, PartyPopper, Flame, Bike, Eye, Sofa, Shirt, Snowflake, Shield, CircleParking, Monitor, Sun } from 'lucide-react';
import { Development } from '../types/development';
import { slideUp, staggerContainer } from '@/lib/animations';
import { fmt } from '@/lib/format';

const GOLD = '#C8A44A';
const NAVY = '#0B1928';

interface DevelopmentDetailsProps {
    development: Development;
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

function FinancialSimulator({ price }: { price: number }) {
    const [entrada, setEntrada] = useState(20)
    const [prazo, setPrazo] = useState(360)
    const [taxa, setTaxa] = useState(9.5)

    if (!price || price <= 0) return null

    const entradaValor = price * (entrada / 100)
    const financiado = price - entradaValor
    const taxaMensal = taxa / 100 / 12

    // SAC
    const amortSAC = financiado / prazo
    const primeiraParcSAC = amortSAC + (financiado * taxaMensal)
    const ultimaParcSAC = amortSAC + (amortSAC * taxaMensal)

    // PRICE
    const parcelaPrice = financiado * (taxaMensal * Math.pow(1 + taxaMensal, prazo)) / (Math.pow(1 + taxaMensal, prazo) - 1)

    return (
        <section className="mt-8 p-4 sm:p-6 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid rgba(184,179,168,0.3)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-[2px] rounded-full" style={{ background: '#B8B3A8' }} />
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: '#948F84' }}>Financiamento</span>
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "var(--font-heading, 'Playfair Display', serif)", color: '#0B1928' }}>
                Simulador Financeiro
            </h2>
            <p className="text-sm mb-6" style={{ color: '#948F84' }}>Simule o financiamento deste imóvel</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#948F84' }}>Entrada ({entrada}%)</label>
                    <input type="range" min={10} max={50} step={5} value={entrada} onChange={e => setEntrada(Number(e.target.value))}
                        className="w-full mt-2 accent-[#0B1928]" />
                    <p className="text-sm mt-1" style={{ fontFamily: "var(--fm, 'JetBrains Mono', monospace)", color: '#0B1928' }}>{fmt(entradaValor)}</p>
                </div>
                <div>
                    <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#948F84' }}>Prazo</label>
                    <select value={prazo} onChange={e => setPrazo(Number(e.target.value))}
                        className="w-full mt-2 h-12 px-3 rounded-xl text-sm"
                        style={{ background: '#FFFFFF', border: '1px solid #B8B3A8', color: '#0B1928', outline: 'none' }}>
                        <option value={120}>10 anos (120x)</option>
                        <option value={240}>20 anos (240x)</option>
                        <option value={360}>30 anos (360x)</option>
                        <option value={420}>35 anos (420x)</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#948F84' }}>Taxa anual (%)</label>
                    <input type="number" min={5} max={15} step={0.1} value={taxa} onChange={e => setTaxa(Number(e.target.value))}
                        className="w-full mt-2 h-12 px-3 rounded-xl text-sm"
                        style={{ background: '#FFFFFF', border: '1px solid #B8B3A8', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", color: '#0B1928', outline: 'none' }} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl" style={{ background: '#F8F6F2', border: '1px solid rgba(184,179,168,0.3)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#948F84' }}>Tabela SAC</p>
                    <p className="text-2xl font-bold" style={{ color: '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                        {fmt(primeiraParcSAC)}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#948F84' }}>1ª parcela · última: {fmt(ultimaParcSAC)}</p>
                </div>
                <div className="p-4 rounded-2xl" style={{ background: '#F8F6F2', border: '1px solid rgba(184,179,168,0.3)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#948F84' }}>Tabela PRICE</p>
                    <p className="text-2xl font-bold" style={{ color: '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                        {fmt(parcelaPrice)}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#948F84' }}>Parcela fixa por {prazo} meses</p>
                </div>
            </div>

            <p className="text-[11px] mt-4" style={{ color: '#948F84' }}>* Simulação aproximada. Consulte um especialista para valores exatos. Taxa de referência: financiamento imobiliário convencional.</p>
        </section>
    )
}

export default function DevelopmentDetails({ development }: DevelopmentDetailsProps) {
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
            <motion.div variants={slideUp} className="mb-12">
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
            <motion.div variants={slideUp} className="mt-12 pt-10 border-t border-gray-100">
                <div className="flex items-center gap-4 p-4 rounded-[10px]" style={{ background: 'rgba(11,25,40,0.03)', border: '1px solid rgba(11,25,40,0.06)' }}>
                    <div
                        className="w-12 h-12 rounded-[4px] flex items-center justify-center flex-shrink-0 overflow-hidden"
                        style={{ background: development.developerLogo ? '#fff' : NAVY, border: development.developerLogo ? '1px solid rgba(11,25,40,0.08)' : 'none' }}
                    >
                        {development.developerLogo ? (
                            <Image
                                src={development.developerLogo}
                                alt={development.developer}
                                width={48}
                                height={48}
                                className="w-full h-full object-contain p-1"
                            />
                        ) : (
                            <Sparkles className="w-5 h-5" style={{ color: GOLD }} />
                        )}
                    </div>
                    <div>
                        <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-400 block mb-0.5" style={{ fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Incorporação</span>
                        <p className="text-gray-900 font-bold text-base">{development.developer}</p>
                    </div>
                </div>
            </motion.div>

            {/* Simulador Financeiro */}
            <motion.div variants={slideUp} id="financiamento">
                <FinancialSimulator price={development.priceRange.min || development.priceRange.max} />
            </motion.div>
        </motion.div>
    );
}
