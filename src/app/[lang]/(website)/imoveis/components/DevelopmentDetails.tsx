'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bed, Maximize, Bath, Car, Check, Sparkles, Building2, Waves, TreePine, Dumbbell, Droplets, Gamepad2, PartyPopper, Flame, Bike, Eye, Sofa, Shirt, Snowflake, Shield, CircleParking, Monitor, Sun } from 'lucide-react';
import { Development } from '../types/development';
import { slideUp, staggerContainer } from '@/lib/animations';

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

    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

    return (
        <section className="mt-8 p-4 sm:p-6 rounded-[10px]" style={{ background: 'rgba(14,28,48,.52)', backdropFilter: 'blur(20px)', border: '1px solid rgba(200,164,74,.12)' }}>
            <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-[2px] rounded-full" style={{ background: GOLD }} />
                <span className="text-[11px] uppercase tracking-[0.25em] font-bold" style={{ color: GOLD }}>Financiamento</span>
            </div>
            <h2 className="text-xl font-bold mb-1 text-white" style={{ fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                Simulador Financeiro
            </h2>
            <p className="text-sm mb-6" style={{ color: '#8E99AB' }}>Simule o financiamento deste imóvel</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8E99AB' }}>Entrada ({entrada}%)</label>
                    <input type="range" min={10} max={50} step={5} value={entrada} onChange={e => setEntrada(Number(e.target.value))}
                        className="w-full mt-2 accent-[#C8A44A]" />
                    <p className="text-sm mt-1 text-white" style={{ fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>{fmt(entradaValor)}</p>
                </div>
                <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8E99AB' }}>Prazo</label>
                    <select value={prazo} onChange={e => setPrazo(Number(e.target.value))}
                        className="w-full mt-2 h-11 px-3 rounded-[4px] text-sm text-white"
                        style={{ background: 'rgba(10,22,36,0.8)', border: '1px solid rgba(200,164,74,0.15)', outline: 'none' }}>
                        <option value={120}>10 anos (120x)</option>
                        <option value={240}>20 anos (240x)</option>
                        <option value={360}>30 anos (360x)</option>
                        <option value={420}>35 anos (420x)</option>
                    </select>
                </div>
                <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8E99AB' }}>Taxa anual (%)</label>
                    <input type="number" min={5} max={15} step={0.1} value={taxa} onChange={e => setTaxa(Number(e.target.value))}
                        className="w-full mt-2 h-11 px-3 rounded-[4px] text-sm text-white"
                        style={{ background: 'rgba(10,22,36,0.8)', border: '1px solid rgba(200,164,74,0.15)', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", outline: 'none' }} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-[10px]" style={{ background: 'rgba(10,22,36,0.6)', border: '1px solid rgba(200,164,74,0.08)' }}>
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#8E99AB' }}>Tabela SAC</p>
                    <p className="text-2xl font-bold" style={{ color: '#C8A44A', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                        {fmt(primeiraParcSAC)}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#627D98' }}>1ª parcela · última: {fmt(ultimaParcSAC)}</p>
                </div>
                <div className="p-4 rounded-[10px]" style={{ background: 'rgba(10,22,36,0.6)', border: '1px solid rgba(200,164,74,0.08)' }}>
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#8E99AB' }}>Tabela PRICE</p>
                    <p className="text-2xl font-bold" style={{ color: '#C8A44A', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                        {fmt(parcelaPrice)}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#627D98' }}>Parcela fixa por {prazo} meses</p>
                </div>
            </div>

            <p className="text-[11px] mt-4" style={{ color: '#627D98' }}>* Simulação aproximada. Consulte um especialista para valores exatos. Taxa de referência: financiamento imobiliário convencional.</p>
        </section>
    )
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
                    <span className="text-[11px] uppercase tracking-[0.25em] font-bold" style={{ color: GOLD, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Sobre</span>
                </div>
                <h2
                    className="text-2xl md:text-[32px] text-gray-900 font-bold tracking-tight leading-tight"
                    style={{ fontFamily: "var(--font-body, 'Outfit', sans-serif)" }}
                >
                    Sobre o empreendimento
                </h2>
            </motion.div>

            {/* Available units urgency indicator */}
            {development.units && development.units.length > 0 && (
                <motion.div variants={slideUp}>
                    <div style={{
                        background: 'rgba(200,164,74,0.06)', border: '1px solid rgba(200,164,74,0.15)',
                        borderRadius: 8, padding: '10px 16px', marginBottom: 16,
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#C8A44A', letterSpacing: '0.5px' }}>
                            {development.units.filter(u => u.status === 'available').length} unidades disponíveis
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Description */}
            <motion.div variants={slideUp} className="mb-12">
                <p className="text-gray-500 leading-[1.9] text-[15px] md:text-base max-w-2xl"
                   style={{ fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                    {development.description}
                </p>
            </motion.div>

            {/* Specs Grid — glass cards */}
            <motion.div variants={slideUp} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-14">
                {specs.map((spec, idx) => (
                    <div
                        key={idx}
                        className="rounded-[10px] p-5 md:p-7 relative overflow-hidden group transition-all duration-300 hover:translate-y-[-2px]"
                        style={{
                            background: 'rgba(14,28,48,.52)',
                            border: '1px solid rgba(200,164,74,0.12)',
                            boxShadow: '0 4px 24px rgba(11,25,40,0.4)',
                            backdropFilter: 'blur(20px)',
                        }}
                    >
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(200,164,74,0.08) 0%, transparent 70%)' }} />
                        <div className="relative z-10">
                            <div className="w-11 h-11 rounded-[4px] flex items-center justify-center mb-4" style={{ background: 'rgba(200,164,74,0.1)', border: '1px solid rgba(200,164,74,0.15)' }}>
                                <spec.icon className="w-5 h-5" strokeWidth={1.5} style={{ color: GOLD }} />
                            </div>
                            <p className="uppercase tracking-[0.2em] font-bold mb-2" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>{spec.label}</p>
                            <p className="text-white font-bold" style={{ fontSize: 22, lineHeight: 1.1, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
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
                            <span className="text-[11px] uppercase tracking-[0.25em] font-bold" style={{ color: GOLD, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Infraestrutura</span>
                        </div>
                        <h3
                            className="text-xl md:text-2xl text-gray-900 font-bold tracking-tight"
                            style={{ fontFamily: "var(--font-body, 'Outfit', sans-serif)" }}
                        >
                            Diferenciais e Lazer
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {development.features.map((feature, idx) => {
                            const FeatureIcon = getFeatureIcon(feature);
                            return (
                                <div key={idx} className="flex items-center gap-3 group py-2.5 px-4 rounded-[10px] transition-all duration-200 hover:bg-gray-50">
                                    <div
                                        className="w-8 h-8 rounded-[4px] flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-105"
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
                <div className="flex items-center gap-4 p-4 rounded-[10px]" style={{ background: 'rgba(11,25,40,0.03)', border: '1px solid rgba(11,25,40,0.06)' }}>
                    <div
                        className="w-12 h-12 rounded-[4px] flex items-center justify-center flex-shrink-0"
                        style={{ background: NAVY }}
                    >
                        <Sparkles className="w-5 h-5" style={{ color: GOLD }} />
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
