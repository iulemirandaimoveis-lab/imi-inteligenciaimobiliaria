'use client'

import { motion } from 'framer-motion'
import { slideUp, staggerContainer } from '@/lib/animations'
import { CheckCircle, TrendingUp, DollarSign, BarChart3, Globe } from 'lucide-react'
import { ConsultingCity } from '../data/cities'

interface CityInvestmentProfileProps {
    city: ConsultingCity
}

export default function CityInvestmentProfile({ city }: CityInvestmentProfileProps) {
    const stats = [
        { label: 'Yield Médio', value: city.investmentProfile.avgYield, icon: TrendingUp },
        { label: 'Preço Médio', value: city.investmentProfile.avgPrice, icon: DollarSign },
        { label: 'Valorização', value: city.investmentProfile.appreciation, icon: BarChart3 },
        { label: 'Moeda', value: city.investmentProfile.currency, icon: Globe },
    ]

    return (
        <section className="section-padding bg-imi-50">
            <div className="container-custom">
                {/* Stats Grid */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
                >
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            variants={slideUp}
                            className="bg-white p-8 rounded-2xl border border-imi-100 shadow-soft"
                        >
                            <div className="w-10 h-10 bg-imi-900/5 rounded-xl flex items-center justify-center mb-4 text-imi-900">
                                <stat.icon size={20} strokeWidth={1.5} />
                            </div>
                            <p className="text-xs font-bold text-imi-500 uppercase tracking-widest mb-2">
                                {stat.label}
                            </p>
                            <p className="text-2xl font-bold text-imi-900 font-display">
                                {stat.value}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-16">
                    {/* Advantages */}
                    <motion.div
                        variants={slideUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl font-bold text-imi-900 mb-8 font-display">
                            Vantagens Estratégicas
                        </h2>
                        <ul className="space-y-4">
                            {city.advantages.map((advantage, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <CheckCircle className="w-6 h-6 text-accent-500 flex-shrink-0" strokeWidth={1.5} />
                                    <span className="text-imi-600 leading-relaxed font-medium">{advantage}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Legal & Tax */}
                    <motion.div
                        variants={slideUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="space-y-12"
                    >
                        <div>
                            <h3 className="text-xl font-bold text-imi-900 mb-4 font-display flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-accent-500 rounded-full" />
                                Estrutura Fiscal
                            </h3>
                            <p className="text-imi-500 leading-relaxed text-sm bg-white p-6 rounded-xl border border-imi-100 italic">
                                "{city.taxInfo}"
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-imi-900 mb-4 font-display flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-accent-500 rounded-full" />
                                Estrutura Jurídica
                            </h3>
                            <p className="text-imi-500 leading-relaxed text-sm bg-white p-6 rounded-xl border border-imi-100 italic">
                                "{city.legalStructure}"
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
