'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts'
import { fadeIn, slideUp, staggerContainer } from '@/lib/animations'
import { Calculator, BarChart3, TrendingUp, Map, ArrowUpRight, MessageCircle } from 'lucide-react'
import Button from '@/components/ui/Button'

const marketData = [
    { month: 'Jul', value: 8900 },
    { month: 'Ago', value: 9100 },
    { month: 'Set', value: 9250 },
    { month: 'Out', value: 9400 },
    { month: 'Nov', value: 9650 },
    { month: 'Dez', value: 9850 },
]

const neighborhoodData = [
    { name: 'Cabo Branco', value: 15200 },
    { name: 'Altiplano', value: 10800 },
    { name: 'Bessa', value: 11500 },
    { name: 'J. Oceania', value: 9800 },
    { name: 'Manaíra', value: 8600 },
]

export default function MarketIntelligencePage() {
    return (
        <>
            {/* HERO */}
            <section className="bg-imi-900 text-white section-padding relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-accent-500/5 -skew-x-12 translate-x-1/4" />
                <div className="container-custom relative z-10">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-px bg-accent-500" />
                            <span className="text-accent-500 font-semibold uppercase tracking-[0.2em] text-xs">Market Intelligence</span>
                        </div>
                        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                            Inteligência de Mercado
                        </h1>
                        <p className="text-imi-300 text-lg md:text-xl font-light leading-relaxed max-w-2xl">
                            Dados precisos, tendências e análises exclusivas para fundamentar seus investimentos no mercado imobiliário.
                        </p>
                    </div>
                </div>
            </section>

            {/* STATS */}
            <section className="section-padding bg-imi-50">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 -mt-24 relative z-20">
                        {[
                            {
                                label: 'Valorização (12m)',
                                value: '+15.2%',
                                detail: 'Análise de Alto Padrão',
                                icon: ArrowUpRight,
                                color: 'text-green-600'
                            },
                            {
                                label: 'Liquidez Média',
                                value: '60 Dias',
                                detail: 'Ativos Premium',
                                icon: TrendingUp,
                                color: 'text-imi-900'
                            },
                            {
                                label: 'Custo Médio m²',
                                value: 'R$ 9.850',
                                detail: 'Regiões de Orla',
                                icon: Map,
                                color: 'text-imi-900'
                            }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                variants={slideUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white p-8 rounded-2xl border border-imi-100 shadow-soft"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-sm font-bold text-imi-400 uppercase tracking-wider">{stat.label}</h3>
                                    <stat.icon className="w-5 h-5 text-accent-500" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-4xl font-bold font-display ${stat.color}`}>{stat.value}</span>
                                </div>
                                <p className="text-xs text-imi-400 mt-2 font-medium">{stat.detail}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* GRÁFICOS */}
                    <div className="grid lg:grid-cols-2 gap-8 mt-16">
                        <motion.div
                            variants={fadeIn}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="bg-white p-8 rounded-2xl border border-imi-100 shadow-soft"
                        >
                            <h3 className="text-xl font-bold text-imi-900 mb-8 font-display flex items-center gap-3">
                                <TrendingUp className="w-5 h-5 text-accent-500" />
                                Tendência de Preço (R$/m²)
                            </h3>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={marketData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B83A0', fontSize: 12 }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B83A0', fontSize: 12 }}
                                            domain={['dataMin - 500', 'dataMax + 500']}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                padding: '12px'
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#23232D"
                                            strokeWidth={4}
                                            dot={{ r: 6, fill: '#23232D', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 8, fill: '#3B82F6' }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={fadeIn}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="bg-white p-8 rounded-2xl border border-imi-100 shadow-soft"
                        >
                            <h3 className="text-xl font-bold text-imi-900 mb-8 font-display flex items-center gap-3">
                                <Map className="w-5 h-5 text-accent-500" />
                                Valorização por Bairro (R$/m²)
                            </h3>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={neighborhoodData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={100}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#23232D', fontWeight: 500 }}
                                        />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                        <Bar dataKey="value" fill="#23232D" radius={[0, 8, 8, 0]} barSize={32}>
                                            {neighborhoodData.map((_entry, index) => (
                                                <rect key={index} fill={index === 0 ? '#3B82F6' : '#23232D'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* TOOLS */}
            <section className="section-padding">
                <div className="container-custom">
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-imi-900 mb-12 text-center">
                        Ferramentas de Análise
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Calculator,
                                title: 'Calculadora de Valuation',
                                href: '/avaliacoes',
                                desc: 'Estime o valor real de mercado com base em dados técnicos e transações recentes processadas por IA.'
                            },
                            {
                                icon: BarChart3,
                                title: 'Comparador de Bairros',
                                href: '#',
                                desc: 'Análise comparativa de ROI, liquidez e potencial de valorização entre as principais regiões.'
                            },
                            {
                                icon: TrendingUp,
                                title: 'Simulador de Retorno',
                                href: '/consultoria',
                                desc: 'Calcule o rendimento potencial do seu investimento considerando aluguel e valorização.'
                            }
                        ].map((tool, i) => (
                            <a href={tool.href} key={i} className="group">
                                <motion.div
                                    variants={slideUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    className="h-full p-8 rounded-2xl bg-white border border-imi-100 shadow-soft hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="w-14 h-14 bg-imi-900/10 text-imi-900 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-imi-900 group-hover:text-white transition-all duration-300">
                                        <tool.icon className="w-6 h-6" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-xl font-bold text-imi-900 mb-4 font-display">
                                        {tool.title}
                                    </h3>
                                    <p className="text-imi-500 text-sm leading-relaxed mb-6">
                                        {tool.desc}
                                    </p>
                                    <span className="text-sm font-bold text-imi-900 flex items-center gap-2">
                                        Acessar Ferramenta
                                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </span>
                                </motion.div>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA FINAL */}
            <section className="bg-imi-900 text-white section-padding text-center relative overflow-hidden">
                <div className="container-custom relative z-10">
                    <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                        Análise Personalizada?
                    </h2>
                    <p className="text-imi-300 text-lg mb-10 max-w-2xl mx-auto font-light">
                        Precisa de um estudo de viabilidade ou dossiê completo de mercado para seu próximo projeto?
                    </p>
                    <a href="https://wa.me/5581997230455" target="_blank" rel="noopener noreferrer" className="btn btn-primary bg-white text-imi-900 border border-imi-200 hover:bg-imi-50 h-14 px-10 inline-flex items-center text-lg shadow-md font-bold uppercase tracking-wider">
                        <MessageCircle className="w-5 h-5 flex-shrink-0 mr-3" />
                        Solicitar Estudo de Mercado
                    </a>
                </div>
            </section>
        </>
    )
}
