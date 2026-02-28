'use client';

import { ShieldCheck, PlusCircle, MinusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { slideUp, staggerContainer } from '@/lib/animations';

export function ForWhom() {
    const categories = [
        {
            title: 'Perfil Ideal',
            icon: PlusCircle,
            color: 'text-[#3B82F6]',
            borderColor: 'border-[#3B82F6]/30',
            bgColor: 'bg-[#141420]',
            items: [
                { title: 'Capital Regularizado', desc: 'Mínimo de USD 100k disponíveis para investir.' },
                { title: 'Busca Renda em USD', desc: 'Objetivo de proteger patrimônio com fluxo em dólar.' },
                { title: 'Visão de Longo Prazo', desc: 'Horizonte de investimento superior a 5 anos.' }
            ]
        },
        {
            title: 'Não é para quem',
            icon: MinusCircle,
            color: 'text-[#9CA3AF]',
            borderColor: 'border-white/[0.05]',
            bgColor: 'bg-[#0D0F14]',
            items: [
                { title: 'Busca Ganho Rápido', desc: 'Trabalhamos com tese de renda, não especulação.' },
                { title: 'Capital não Declarado', desc: 'Todo processo segue rigoroso compliance fiscal.' },
                { title: 'Necessidade de Liquidez', desc: 'Imóveis exigem prazos de maturação estratégica.' }
            ]
        }
    ];

    return (
        <section className="section-padding bg-[#0D0F14]">
            <div className="container-custom">
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-display">
                        Esta Consultoria é Para Você?
                    </h2>
                    <p className="text-lg text-[#9CA3AF] max-w-2xl mx-auto font-light">
                        Transparência é um dos nossos pilares. Saiba se sua tese de investimento está alinhada com nossa expertise internacional.
                    </p>
                </div>

                <motion.div
                    className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {categories.map((cat, i) => (
                        <motion.div
                            key={i}
                            variants={slideUp}
                            className={`p-10 rounded-3xl border ${cat.borderColor} ${cat.bgColor} shadow-[0_8px_32px_rgba(0,0,0,0.2)]`}
                        >
                            <div className="flex items-center gap-4 mb-10">
                                <div className={`w-12 h-12 ${cat.color} bg-[#1A1E2A] rounded-2xl flex items-center justify-center shadow-sm border border-white/10`}>
                                    <cat.icon className="w-6 h-6" strokeWidth={2} />
                                </div>
                                <h3 className="text-2xl font-bold text-white font-display">{cat.title}</h3>
                            </div>

                            <ul className="space-y-8">
                                {cat.items.map((item, j) => (
                                    <li key={j} className="flex gap-4">
                                        <div className="mt-1 flex-shrink-0">
                                            {i === 0 ? (
                                                <ShieldCheck className="w-5 h-5 text-[#3B82F6]" />
                                            ) : (
                                                <div className="w-5 h-px bg-white/20 mt-2.5" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white mb-1">{item.title}</p>
                                            <p className="text-sm text-[#9CA3AF] leading-relaxed">{item.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
