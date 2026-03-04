'use client'

import { motion } from 'framer-motion'
import { slideUp, staggerContainer } from '@/lib/animations'
import { Target, Shield, Globe, TrendingUp, Linkedin, MessageCircle, Youtube, Instagram, BookOpen, ExternalLink, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// TikTok icon (lucide doesn't have one)
function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.73a8.1 8.1 0 004.74 1.52V6.79a4.85 4.85 0 01-.97-.1z" />
        </svg>
    )
}

const values = [
    {
        icon: Target,
        title: 'Missão',
        description: 'Fornecer inteligência imobiliária de alta qualidade, capacitando clientes a tomar decisões informadas e estratégicas.',
    },
    {
        icon: TrendingUp,
        title: 'Visão',
        description: 'Ser referência nacional em inteligência imobiliária, reconhecidos pela excelência técnica, inovação e compromisso com resultados.',
    },
    {
        icon: Shield,
        title: 'Excelência',
        description: 'Compromisso inabalável com os mais altos padrões técnicos e metodológicos em todas as nossas entregas.',
    },
    {
        icon: Globe,
        title: 'Relacionamento',
        description: 'Construir parcerias duradouras baseadas em confiança, transparência e resultados consistentes.',
    },
]

const stats = [
    { number: '15+', label: 'Anos de Experiência' },
    { number: '500+', label: 'Laudos Emitidos' },
    { number: 'R$ 200M+', label: 'em Ativos Avaliados' },
    { number: '98%', label: 'Satisfação dos Clientes' },
]

const SOCIAL = [
    {
        icon: Linkedin,
        label: 'LinkedIn',
        handle: '/iule-miranda-imoveis',
        href: 'https://www.linkedin.com/in/iule-miranda-imoveis',
        color: '#0077b5',
        colorBg: 'rgba(0,119,181,0.08)',
        description: 'Artigos técnicos sobre avaliação imobiliária, laudos NBR 14653, mercado de alto padrão e inteligência patrimonial.',
        cta: 'Seguir no LinkedIn',
    },
    {
        icon: Youtube,
        label: 'YouTube',
        handle: '@iulemirandaimoveis',
        href: 'https://www.youtube.com/@iulemirandaimoveis',
        color: '#FF0000',
        colorBg: 'rgba(255,0,0,0.08)',
        description: 'Vídeos educativos sobre avaliação de imóveis, análise de mercado, investimentos imobiliários no Brasil e exterior.',
        cta: 'Inscrever-se',
    },
    {
        icon: Instagram,
        label: 'Instagram',
        handle: '@iulemirandaimoveis',
        href: 'https://www.instagram.com/iulemirandaimoveis',
        color: '#E1306C',
        colorBg: 'rgba(225,48,108,0.08)',
        description: 'Bastidores de perícias judiciais, lançamentos premium, análises de mercado e conteúdo de inteligência imobiliária.',
        cta: 'Seguir no Instagram',
    },
    {
        icon: TikTokIcon,
        label: 'TikTok',
        handle: '@iulemirandaimoveis',
        href: 'https://www.tiktok.com/@iulemirandaimoveis',
        color: '#ffffff',
        colorBg: 'rgba(255,255,255,0.05)',
        description: 'Dicas rápidas de avaliação imobiliária, análises de mercado em formato curto e conteúdo educativo.',
        cta: 'Seguir no TikTok',
    },
]

const EBOOKS = [
    {
        title: 'Guia Completo de Avaliação Imobiliária NBR 14653',
        subtitle: 'Do laudo à tomada de decisão',
        description: 'Tudo que você precisa saber sobre avaliações técnicas: metodologia, laudos, normas e como interpretar resultados.',
        cover: null,
        slug: 'guia-avaliacao-nbr-14653',
        amazonUrl: null,
    },
    {
        title: 'Investindo em Dubai: Oportunidades para o Investidor Brasileiro',
        subtitle: 'Guia prático para investimento no exterior',
        description: 'Como estruturar seu investimento imobiliário nos Emirados Árabes Unidos com segurança jurídica e rentabilidade.',
        cover: null,
        slug: 'investindo-dubai-investidor-brasileiro',
        amazonUrl: null,
    },
    {
        title: 'Mercado Imobiliário de Alto Padrão: Recife e João Pessoa',
        subtitle: 'Análise e inteligência de mercado 2024',
        description: 'Relatório completo de tendências, preços por bairro, oportunidades e perspectivas para o Nordeste.',
        cover: null,
        slug: 'mercado-alto-padrao-recife-joao-pessoa',
        amazonUrl: null,
    },
]

export default function AboutPage() {
    const params = useParams()
    const lang = (params?.lang as string) || 'pt'

    return (
        <main className="bg-[#0D0F14]">
            {/* HERO */}
            <section className="relative bg-[#141420] text-white pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden border-b border-white/[0.05]">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-[#102A43]/5 -skew-x-12 translate-x-1/4" />
                <div className="container-custom relative z-10">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="max-w-4xl"
                    >
                        <motion.div variants={slideUp} className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-px bg-[#102A43]" />
                            <span className="text-[#486581] font-bold uppercase tracking-[0.25em] text-[11px]">Quem Somos</span>
                        </motion.div>
                        <motion.h1
                            variants={slideUp}
                            className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-8 tracking-tight leading-tight text-white"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                            IMI – Inteligência <br /><span className="text-[#486581] italic">Imobiliária</span>
                        </motion.h1>
                        <motion.div variants={slideUp} className="space-y-5 text-[#9CA3AF] text-lg sm:text-xl font-light leading-relaxed max-w-3xl">
                            <p>
                                Empresa de posicionamento técnico e institucional, especializada em <strong className="text-white font-medium">avaliações imobiliárias</strong>, perícias judiciais e extrajudiciais, corretagem estratégica e consultoria no Brasil e mercados internacionais selecionados.
                            </p>
                            <p className="text-[#627D98] font-medium text-base">
                                Prioridade técnica antes do viés comercial — segurança, clareza e consistência em decisões imobiliárias de médio e longo prazo.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* FUNDADOR */}
            <section className="py-16 md:py-24 border-b border-white/[0.05]">
                <div className="container-custom">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <motion.div
                            className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/[0.05] max-w-sm mx-auto lg:max-w-none"
                            variants={slideUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <Image
                                src="/about-profile.jpg"
                                alt="Iule Miranda"
                                fill
                                className="object-cover object-top"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F14]/60 via-transparent to-transparent" />
                            {/* Credential badge */}
                            <div className="absolute bottom-6 left-6 right-6 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4">
                                <p className="text-white font-bold text-sm">Iule Miranda</p>
                                <p className="text-[#486581] text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5">CRECI 17933 · CNAI 53290 · Perito Judicial</p>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={slideUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-px bg-[#334E68]" />
                                <span className="text-[#627D98] font-bold uppercase tracking-[0.25em] text-[11px]">Identidade Profissional</span>
                            </div>
                            <h2
                                className="text-3xl sm:text-4xl font-bold text-white mb-3"
                                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                            >
                                Iule Miranda
                            </h2>
                            <p className="text-[#486581] text-sm font-bold uppercase tracking-[0.15em] mb-6">
                                Avaliador Imobiliário · Analista de Mercado · Estrategista em Inteligência Imobiliária
                            </p>
                            <div className="space-y-4 text-[#9CA3AF] leading-relaxed text-[15px] mb-8">
                                <p>
                                    Corretor de imóveis, <strong className="text-white font-medium">perito judicial e extrajudicial</strong>, avaliador imobiliário e empresário. Especialista em inteligência imobiliária, estruturação patrimonial e tomada de decisão baseada em análise técnica rigorosa.
                                </p>
                                <p>
                                    Mais de 15 anos de experiência com foco em avaliações patrimoniais conforme NBR 14653, perícias judiciais perante o TJPE, e consultoria estratégica para investidores brasileiros em mercados premium — incluindo Dubai e EUA.
                                </p>
                            </div>

                            {/* Expertise pills */}
                            <div className="flex flex-wrap gap-2 mb-8">
                                {['Avaliação Imobiliária', 'Perícia Judicial', 'NBR 14653', 'Alto Padrão', 'Dubai · EUA', 'Inteligência de Mercado'].map(tag => (
                                    <span key={tag} className="text-[11px] font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full bg-[#1A1E2A] text-[#627D98] border border-white/[0.06]">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <a
                                href="https://www.linkedin.com/in/iule-miranda-imoveis"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-3 px-8 h-12 rounded-xl bg-[#0077b5] text-white font-semibold text-sm transition-all duration-300 hover:bg-[#005e8e] shadow-lg shadow-[#0077b5]/20"
                            >
                                <Linkedin className="w-4 h-4" strokeWidth={2} />
                                Conectar no LinkedIn
                            </a>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* VALORES */}
            <section className="py-16 md:py-24 border-b border-white/[0.05]">
                <div className="container-custom">
                    <div className="text-center mb-14">
                        <div className="flex items-center justify-center gap-3 mb-5">
                            <div className="w-8 h-px bg-[#334E68]" />
                            <span className="text-[#627D98] font-bold uppercase tracking-[0.25em] text-[11px]">Princípios</span>
                            <div className="w-8 h-px bg-[#334E68]" />
                        </div>
                        <h2
                            className="text-3xl sm:text-4xl font-bold text-white mb-4"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                            Nossos Valores
                        </h2>
                    </div>

                    <motion.div
                        className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {values.map((item, index) => (
                            <motion.div
                                key={index}
                                variants={slideUp}
                                className="p-8 rounded-2xl bg-[#141420] border border-white/[0.05] transition-all duration-300 group hover:border-[#334E68]/30"
                            >
                                <div className="w-12 h-12 bg-[#1A1E2A] text-[#627D98] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/[0.05]">
                                    <item.icon className="w-5 h-5" strokeWidth={1.5} />
                                </div>
                                <h3
                                    className="text-xl font-bold text-white mb-3"
                                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                >
                                    {item.title}
                                </h3>
                                <p className="text-[#9CA3AF] leading-relaxed text-sm">{item.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* NÚMEROS */}
            <section className="py-16 md:py-24 border-b border-white/[0.05]">
                <div className="container-custom">
                    <motion.div
                        className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {stats.map((stat, index) => (
                            <motion.div key={index} variants={slideUp} className="text-center">
                                <div
                                    className="text-4xl md:text-5xl font-bold text-white mb-2"
                                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                >
                                    {stat.number}
                                </div>
                                <div className="text-sm text-[#627D98] font-medium">{stat.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* PRESENÇA DIGITAL */}
            <section className="py-16 md:py-24 border-b border-white/[0.05]">
                <div className="container-custom">
                    <motion.div
                        variants={slideUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="mb-12"
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-px bg-[#334E68]" />
                            <span className="text-[#627D98] font-bold uppercase tracking-[0.25em] text-[11px]">Presença Digital</span>
                        </div>
                        <h2
                            className="text-3xl sm:text-4xl font-bold text-white mb-4"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                            Conteúdo que <span className="text-[#486581] italic">Educa</span> e Inspira
                        </h2>
                        <p className="text-[#9CA3AF] text-lg font-light max-w-2xl">
                            Acompanhe análises de mercado, metodologias de avaliação e inteligência imobiliária em todas as plataformas.
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {SOCIAL.map((s, i) => {
                            const Icon = s.icon
                            return (
                                <motion.div
                                    key={s.label}
                                    variants={slideUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.08 }}
                                    className="group bg-[#141420] border border-white/[0.05] hover:border-white/[0.12] rounded-2xl p-6 flex flex-col transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-105"
                                        style={{ background: s.colorBg, border: `1px solid ${s.color}25` }}
                                    >
                                        <Icon className="w-6 h-6" style={{ color: s.color }} />
                                    </div>
                                    <p className="font-bold text-white text-[15px] mb-1">{s.label}</p>
                                    <p className="text-[#486581] text-[11px] font-medium mb-3">{s.handle}</p>
                                    <p className="text-[#9CA3AF] text-xs leading-relaxed flex-1 mb-5">{s.description}</p>
                                    <a
                                        href={s.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 h-9 rounded-xl text-[12px] font-bold transition-all duration-200"
                                        style={{
                                            background: s.colorBg,
                                            color: s.color,
                                            border: `1px solid ${s.color}30`,
                                        }}
                                    >
                                        {s.cta}
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* EBOOKS */}
            <section className="py-16 md:py-24 border-b border-white/[0.05]">
                <div className="container-custom">
                    <motion.div
                        variants={slideUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-px bg-[#334E68]" />
                                <span className="text-[#627D98] font-bold uppercase tracking-[0.25em] text-[11px]">Publicações</span>
                            </div>
                            <h2
                                className="text-3xl sm:text-4xl font-bold text-white mb-4"
                                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                            >
                                Biblioteca <span className="text-[#486581] italic">IMI</span>
                            </h2>
                            <p className="text-[#9CA3AF] text-lg font-light max-w-xl">
                                E-books e guias técnicos sobre avaliação imobiliária, mercado de alto padrão e investimentos no exterior.
                            </p>
                        </div>
                        <Link
                            href={`/${lang}/biblioteca`}
                            className="flex items-center gap-2 text-[#486581] text-sm font-bold hover:text-white transition-colors shrink-0"
                        >
                            Ver Biblioteca Completa
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {EBOOKS.map((book, i) => (
                            <motion.article
                                key={book.slug}
                                variants={slideUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group bg-[#141420] border border-white/[0.05] hover:border-[#334E68]/40 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_32px_rgba(26,26,46,0.15)] flex flex-col"
                            >
                                {/* Cover placeholder */}
                                <div className="relative aspect-[3/2] bg-gradient-to-br from-[#1A1E2A] to-[#0D1117] flex items-center justify-center border-b border-white/[0.05]">
                                    <div className="text-center p-6">
                                        <BookOpen className="w-10 h-10 text-[#334E68] mx-auto mb-3" strokeWidth={1} />
                                        <p className="text-[#486581] text-[10px] font-bold uppercase tracking-[0.2em]">E-book IMI</p>
                                    </div>
                                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                                </div>

                                {/* Content */}
                                <div className="p-6 flex flex-col flex-1">
                                    <p className="text-[#486581] text-[10px] font-bold uppercase tracking-[0.15em] mb-2">{book.subtitle}</p>
                                    <h3
                                        className="text-white font-bold text-[15px] leading-snug mb-3 group-hover:text-[#486581] transition-colors"
                                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                    >
                                        {book.title}
                                    </h3>
                                    <p className="text-[#9CA3AF] text-xs leading-relaxed flex-1 mb-5">{book.description}</p>

                                    <div className="flex gap-2.5">
                                        <Link
                                            href={`/${lang}/biblioteca/${book.slug}`}
                                            className="flex-1 h-10 flex items-center justify-center rounded-lg bg-[#1A1E2A] border border-white/[0.06] text-white text-[11px] font-bold uppercase tracking-[0.1em] hover:bg-[#21263A] transition-all"
                                        >
                                            Ver Livro
                                        </Link>
                                        {book.amazonUrl && (
                                            <a
                                                href={book.amazonUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#FF9900]/10 border border-[#FF9900]/20 text-[#FF9900] hover:bg-[#FF9900]/20 transition-all"
                                                title="Comprar na Amazon"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-[#141420] text-white py-20 md:py-28 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at center, #334E68 0%, transparent 60%)', filter: 'blur(80px)' }} />
                <div className="container-custom relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2
                            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                            Vamos <span className="text-[#486581] italic">Conversar?</span>
                        </h2>
                        <p className="text-[#9CA3AF] text-lg mb-10 max-w-xl mx-auto font-light leading-relaxed">
                            Conte-nos sobre seu projeto e descubra como podemos ajudar você a alcançar seus objetivos.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href={`/${lang}/contato`}
                                className="inline-flex items-center justify-center gap-3 h-14 px-10 text-sm font-bold bg-[#102A43] text-white hover:bg-[#1A2F44] rounded-xl transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-[#102A43]/30"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Entrar em Contato
                            </Link>
                            <a
                                href="https://wa.me/5581997230455"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-3 h-14 px-10 text-sm font-bold border border-white/10 text-slate-300 hover:bg-white/[0.04] hover:text-white rounded-xl transition-all duration-300"
                            >
                                WhatsApp Direto
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    )
}
