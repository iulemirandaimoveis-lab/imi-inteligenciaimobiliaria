'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bed, Maximize, Bath, Car, Check, Sparkles, Building2, Waves, TreePine, Dumbbell } from 'lucide-react';
import { Development } from '../types/development';
import { slideUp, staggerContainer } from '@/lib/animations';

const GOLD = '#3D6FFF';
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

function getFeatureEmoji(feature: string): string {
    const lower = feature.toLowerCase()
    if (lower.includes('piscina') || lower.includes('pool')) return '🏊'
    if (lower.includes('academia') || lower.includes('gym') || lower.includes('fitness')) return '💪'
    if (lower.includes('churrasqueira') || lower.includes('gourmet') || lower.includes('bbq')) return '🔥'
    if (lower.includes('playground') || lower.includes('brinquedo')) return '🎠'
    if (lower.includes('salão') || lower.includes('festa') || lower.includes('party')) return '🎉'
    if (lower.includes('sauna') || lower.includes('spa')) return '🧖'
    if (lower.includes('pet') || lower.includes('animal')) return '🐾'
    if (lower.includes('quadra') || lower.includes('esport')) return '⚽'
    if (lower.includes('coworking') || lower.includes('trabalho')) return '💻'
    if (lower.includes('cinema') || lower.includes('home theater')) return '🎬'
    if (lower.includes('rooftop') || lower.includes('terraço') || lower.includes('varanda')) return '🌆'
    if (lower.includes('jardim') || lower.includes('garden')) return '🌿'
    if (lower.includes('segurança') || lower.includes('portaria') || lower.includes('24h')) return '🛡️'
    if (lower.includes('elevador') || lower.includes('elevator')) return '🛗'
    if (lower.includes('garagem') || lower.includes('vaga') || lower.includes('parking')) return '🅿️'
    if (lower.includes('ar condicionado') || lower.includes('split')) return '❄️'
    if (lower.includes('vista') || lower.includes('view') || lower.includes('mar')) return '🌊'
    if (lower.includes('mobilia') || lower.includes('furnished')) return '🛋️'
    if (lower.includes('lavanderia') || lower.includes('laundry')) return '👔'
    if (lower.includes('bike') || lower.includes('biciclet')) return '🚲'
    return '✨'
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
        <section className="mt-8 p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "var(--font-serif, 'Libre Baskerville', Georgia, serif)" }}>
                Simulador Financeiro
            </h2>
            <p className="text-sm text-gray-500 mb-6">Simule o financiamento deste imóvel</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Entrada ({entrada}%)</label>
                    <input type="range" min={10} max={50} step={5} value={entrada} onChange={e => setEntrada(Number(e.target.value))}
                        className="w-full mt-2 accent-amber-600" />
                    <p className="text-sm font-mono mt-1">{fmt(entradaValor)}</p>
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Prazo</label>
                    <select value={prazo} onChange={e => setPrazo(Number(e.target.value))}
                        className="w-full mt-2 h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm">
                        <option value={120}>10 anos (120x)</option>
                        <option value={240}>20 anos (240x)</option>
                        <option value={360}>30 anos (360x)</option>
                        <option value={420}>35 anos (420x)</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Taxa anual (%)</label>
                    <input type="number" min={5} max={15} step={0.1} value={taxa} onChange={e => setTaxa(Number(e.target.value))}
                        className="w-full mt-2 h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-mono" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tabela SAC</p>
                    <p className="text-2xl font-bold font-mono" style={{ color: 'var(--accent, #C49D5B)' }}>
                        {fmt(primeiraParcSAC)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">1ª parcela · última: {fmt(ultimaParcSAC)}</p>
                </div>
                <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tabela PRICE</p>
                    <p className="text-2xl font-bold font-mono" style={{ color: 'var(--accent, #C49D5B)' }}>
                        {fmt(parcelaPrice)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Parcela fixa por {prazo} meses</p>
                </div>
            </div>

            <p className="text-[10px] text-gray-400 mt-4">* Simulação aproximada. Consulte um especialista para valores exatos. Taxa de referência: financiamento imobiliário convencional.</p>
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
                    <span className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: GOLD }}>Sobre</span>
                </div>
                <h2
                    className="text-2xl md:text-[32px] text-gray-900 font-bold tracking-tight leading-tight"
                    style={{ fontFamily: "var(--font-serif, 'Libre Baskerville', Georgia, serif)" }}
                >
                    Sobre o empreendimento
                </h2>
            </motion.div>

            {/* O Que Torna Especial */}
            {development.features && development.features.length > 0 && (
                <motion.div variants={slideUp} className="mb-10">
                    <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-serif, 'Libre Baskerville', Georgia, serif)" }}>
                        O Que Torna Especial
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {development.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                <span className="text-lg">{getFeatureEmoji(feature)}</span>
                                <span className="text-sm font-medium">{feature}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Description */}
            <motion.div variants={slideUp} className="mb-12">
                <p className="text-gray-500 leading-[1.9] text-[15px] md:text-base max-w-2xl"
                   style={{ fontFamily: "var(--font-sans, 'Figtree', system-ui, sans-serif)" }}>
                    {development.description}
                </p>
            </motion.div>

            {/* Specs Grid — premium dark cards */}
            <motion.div variants={slideUp} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-14">
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

            {/* Simulador Financeiro */}
            <motion.div variants={slideUp}>
                <FinancialSimulator price={development.priceRange.min || development.priceRange.max} />
            </motion.div>
        </motion.div>
    );
}
