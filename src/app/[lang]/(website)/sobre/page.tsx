import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
    Target, Shield, Globe, TrendingUp,
    Linkedin, MessageCircle, Youtube, Instagram,
    ExternalLink, ArrowRight,
} from 'lucide-react'

export const metadata: Metadata = {
    title: 'Sobre | IMI — Inteligência Imobiliária',
    description: 'Conheça a IMI e Iule Miranda — avaliador imobiliário, perito judicial (CRECI 17933 · CNAI 53290) e estrategista em inteligência imobiliária premium.',
    openGraph: {
        title: 'Sobre a IMI — Inteligência Imobiliária',
        description: 'Avaliações imobiliárias, perícias judiciais e consultoria estratégica no Brasil e mercados internacionais.',
    },
}

// ── TikTok icon (lucide doesn't have one) ─────────────────────
function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.73a8.1 8.1 0 004.74 1.52V6.79a4.85 4.85 0 01-.97-.1z" />
        </svg>
    )
}

// ── Static data ────────────────────────────────────────────────
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
        color: '#C8A44A',
        colorBg: 'rgba(200,164,74,0.10)',
        description: 'Artigos técnicos sobre avaliação imobiliária, laudos NBR 14653, mercado de alto padrão e inteligência patrimonial.',
        cta: 'Seguir no LinkedIn',
    },
    {
        icon: Youtube,
        label: 'YouTube',
        handle: '@iulemirandaimoveis',
        href: 'https://www.youtube.com/@iulemirandaimoveis',
        color: '#C8A44A',
        colorBg: 'rgba(200,164,74,0.10)',
        description: 'Vídeos educativos sobre avaliação de imóveis, análise de mercado, investimentos imobiliários no Brasil e exterior.',
        cta: 'Inscrever-se',
    },
    {
        icon: Instagram,
        label: 'Instagram',
        handle: '@iulemirandaimoveis',
        href: 'https://www.instagram.com/iulemirandaimoveis',
        color: '#C8A44A',
        colorBg: 'rgba(200,164,74,0.10)',
        description: 'Bastidores de perícias judiciais, lançamentos premium, análises de mercado e conteúdo de inteligência imobiliária.',
        cta: 'Seguir no Instagram',
    },
    {
        icon: TikTokIcon,
        label: 'TikTok',
        handle: '@iulemirandaimoveis',
        href: 'https://www.tiktok.com/@iulemirandaimoveis',
        color: '#C8A44A',
        colorBg: 'rgba(200,164,74,0.10)',
        description: 'Dicas rápidas de avaliação imobiliária, análises de mercado em formato curto e conteúdo educativo.',
        cta: 'Seguir no TikTok',
    },
]


const certificationImages = [
    {
        src: '/certificado-cnai.jpg',
        alt: 'Certificado CRECI-PE de Avaliação de Imóveis e Perícias Judiciais',
    },
    {
        src: '/certificado-act.jpg',
        alt: 'Certificado ACT Institute — Ericksonian Hypnosis Training Level I',
    },
    {
        src: '/Certificado-puc.jpg',
        alt: 'Certificado PUCRS de extensão em Wealth Management e Family Office',
    },
]

const EBOOKS = [
    {
        title: 'Guia Completo de Avaliação Imobiliária NBR 14653',
        subtitle: 'Do laudo à tomada de decisão',
        description: 'Tudo que você precisa saber sobre avaliações técnicas: metodologia, laudos, normas e como interpretar resultados.',
        slug: 'guia-avaliacao-nbr-14653',
        amazonUrl: null,
        coverImage: '/guia-avaliacao-nbr-14653.png',
    },
    {
        title: 'Investindo em Dubai: Oportunidades para o Investidor Brasileiro',
        subtitle: 'Guia prático para investimento no exterior',
        description: 'Como estruturar seu investimento imobiliário nos Emirados Árabes Unidos com segurança jurídica e rentabilidade.',
        slug: 'investindo-dubai-investidor-brasileiro',
        amazonUrl: null,
        coverImage: '/investindo-em-dubai.png',
    },
    {
        title: 'Mercado Imobiliário de Alto Padrão: Recife e João Pessoa',
        subtitle: 'Análise e inteligência de mercado 2024',
        description: 'Relatório completo de tendências, preços por bairro, oportunidades e perspectivas para o Nordeste.',
        slug: 'mercado-alto-padrao-recife-joao-pessoa',
        amazonUrl: null,
        coverImage: '/mercado-alto-padrao.png',
    },
]

// ── Page ──────────────────────────────────────────────────────
export default async function AboutPage({
    params,
}: {
    params: { lang: string }
}) {
    const lang = params.lang || 'pt'

    return (
        <main className="bg-navy-950">

            {/* ── HERO ──────────────────────────────────────── */}
            <section className="relative bg-navy-950 text-white pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden border-b border-white/[0.05]">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-navy-800/5 -skew-x-12 translate-x-1/4" />
                <div className="container-custom relative z-10 max-w-4xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-px bg-[#C8A44A]" />
                        <span className="text-[#C8A44A] font-bold uppercase tracking-[0.25em] text-[11px]">Quem Somos</span>
                    </div>
                    <h1
                        className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-tight leading-tight text-white"
                    >
                        IMI – Inteligência <br /><span className="text-[#C8A44A] italic">Imobiliária</span>
                    </h1>
                    <div className="space-y-5 text-white/50 text-lg sm:text-xl font-light leading-relaxed max-w-3xl">
                        <p>
                            Empresa de posicionamento técnico e institucional, especializada em{' '}
                            <strong className="text-white font-medium">avaliações imobiliárias</strong>,
                            perícias judiciais e extrajudiciais, corretagem estratégica e consultoria
                            no Brasil e mercados internacionais selecionados.
                        </p>
                        <p className="text-[#C8A44A] font-medium text-base">
                            Prioridade técnica antes do viés comercial — segurança, clareza e consistência
                            em decisões imobiliárias de médio e longo prazo.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── FUNDADOR ──────────────────────────────────── */}
            <section className="py-16 md:py-24 border-b border-white/[0.05]">
                <div className="container-custom">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        {/* Photo */}
                        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/[0.05] max-w-sm mx-auto lg:max-w-none bg-[#0D0F14]">
                            <Image
                                src="/about-profile.jpg"
                                alt="Iule Miranda"
                                fill
                                priority
                                className="object-cover object-top"
                                sizes="(max-width: 1024px) 100vw, 50vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F14]/60 via-transparent to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4">
                                <p className="text-white font-bold text-sm">Iule Miranda</p>
                                <p className="text-[#C8A44A] text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5">
                                    CRECI 17933 · CNAI 53290 · Perito Judicial
                                </p>
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-px bg-[#C8A44A]" />
                                <span className="text-[#C8A44A] font-bold uppercase tracking-[0.25em] text-[11px]">Identidade Profissional</span>
                            </div>
                            <h2
                                className="font-display text-3xl sm:text-4xl md:text-[2.5rem] font-bold text-white mb-3"
                            >
                                Iule Miranda
                            </h2>
                            <p className="text-[#C8A44A] text-sm font-bold uppercase tracking-[0.15em] mb-6">
                                Avaliador Imobiliário · Analista de Mercado · Estrategista em Inteligência Imobiliária
                            </p>
                            <div className="space-y-4 text-white/50 leading-relaxed text-[15px] mb-8">
                                <p>
                                    Corretor de imóveis,{' '}
                                    <strong className="text-white font-medium">perito judicial e extrajudicial</strong>,
                                    avaliador imobiliário e empresário. Especialista em inteligência imobiliária,
                                    estruturação patrimonial e tomada de decisão baseada em análise técnica rigorosa.
                                </p>
                                <p>
                                    Mais de 15 anos de experiência com foco em avaliações patrimoniais conforme
                                    NBR 14653, perícias judiciais perante o TJPE, e consultoria estratégica para
                                    investidores brasileiros em mercados premium — incluindo Dubai e EUA.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-8">
                                {['Avaliação Imobiliária', 'Perícia Judicial', 'NBR 14653', 'Alto Padrão', 'Dubai · EUA', 'Inteligência de Mercado'].map(tag => (
                                    <span key={tag} className="text-[11px] font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full bg-[#C8A44A]/10 text-[#C8A44A] border border-[#C8A44A]/20">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <a
                                href="https://www.linkedin.com/in/iule-miranda-imoveis"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    background: '#0A1624',
                                    color: '#C8A44A',
                                    border: '1px solid rgba(200,164,74,0.3)',
                                    borderRadius: 6,
                                    padding: '10px 20px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontWeight: 600,
                                    fontSize: 13,
                                    textDecoration: 'none',
                                }}
                            >
                                <Linkedin className="w-4 h-4" strokeWidth={2} />
                                Conectar no LinkedIn
                            </a>

                        </div>
                    </div>
                </div>
            </section>


            {/* ── GALERIA DE CERTIFICADOS ─────────────────── */}
            <section className="py-16 md:py-24 border-b border-white/[0.05]">
                <div className="container-custom">
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-px bg-[#C8A44A]" />
                            <span className="text-[#C8A44A] font-bold uppercase tracking-[0.25em] text-[11px]">Certificados</span>
                        </div>
                        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
                            Formação e Atualização <span className="text-[#C8A44A] italic">Contínua</span>
                        </h2>
                        <p className="text-white/50 text-lg font-light max-w-3xl">
                            Registros visuais das certificações apresentadas no perfil profissional.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {certificationImages.map((img) => (
                            <div key={img.src} className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0D0F14]">
                                <Image src={img.src} alt={img.alt} fill className="object-contain p-2" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── VALORES ───────────────────────────────────── */}
            <section className="py-16 md:py-24 border-b border-white/[0.05]">
                <div className="container-custom">
                    <div className="text-center mb-14">
                        <div className="flex items-center justify-center gap-3 mb-5">
                            <div className="w-8 h-px bg-[#C8A44A]" />
                            <span className="text-[#C8A44A] font-bold uppercase tracking-[0.25em] text-[11px]">Princípios</span>
                            <div className="w-8 h-px bg-[#C8A44A]" />
                        </div>
                        <h2
                            className="font-display text-3xl sm:text-4xl font-bold text-white mb-4"
                        >
                            Nossos Valores
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {values.map((item) => (
                            <div
                                key={item.title}
                                className="p-8 rounded-2xl bg-navy-950 border border-white/[0.05] transition-all duration-300 group hover:border-[#C8A44A]/30"
                            >
                                <div className="w-12 h-12 bg-[#C8A44A]/10 text-[#C8A44A] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-[#C8A44A]/20">
                                    <item.icon className="w-5 h-5" strokeWidth={1.5} />
                                </div>
                                <h3
                                    className="font-display text-xl font-bold text-white mb-3"
                                >
                                    {item.title}
                                </h3>
                                <p className="text-white/50 leading-relaxed text-sm">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── NÚMEROS ───────────────────────────────────── */}
            <section className="py-16 md:py-24 border-b border-white/[0.05]">
                <div className="container-custom">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                        {stats.map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div
                                    className="font-display text-4xl md:text-5xl font-bold text-white mb-2"
                                >
                                    {stat.number}
                                </div>
                                <div className="text-sm text-[#C8A44A] font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PRESENÇA DIGITAL ──────────────────────────── */}
            <section className="py-16 md:py-24 border-b border-white/[0.05]">
                <div className="container-custom">
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-px bg-[#C8A44A]" />
                            <span className="text-[#C8A44A] font-bold uppercase tracking-[0.25em] text-[11px]">Presença Digital</span>
                        </div>
                        <h2
                            className="font-display text-3xl sm:text-4xl font-bold text-white mb-4"
                        >
                            Conteúdo que <span className="text-[#C8A44A] italic">Educa</span> e Inspira
                        </h2>
                        <p className="text-white/50 text-lg font-light max-w-2xl">
                            Acompanhe análises de mercado, metodologias de avaliação e inteligência imobiliária em todas as plataformas.
                        </p>
                    </div>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {SOCIAL.map((s) => {
                            const Icon = s.icon
                            return (
                                <div
                                    key={s.label}
                                    className="group bg-navy-950 border border-white/[0.05] hover:border-white/[0.12] rounded-2xl p-6 flex flex-col transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-105"
                                        style={{ background: s.colorBg, border: `1px solid ${s.color}25` }}
                                    >
                                        <Icon className="w-6 h-6" style={{ color: s.color }} />
                                    </div>
                                    <p className="font-bold text-white text-[15px] mb-1">{s.label}</p>
                                    <p className="text-[#C8A44A] text-[11px] font-medium mb-3">{s.handle}</p>
                                    <p className="text-white/50 text-xs leading-relaxed flex-1 mb-5">{s.description}</p>
                                    <a
                                        href={s.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 h-9 rounded-[4px] text-[12px] font-bold transition-all duration-200"
                                        style={{
                                            background: s.colorBg,
                                            color: s.color,
                                            border: `1px solid ${s.color}30`,
                                        }}
                                    >
                                        {s.cta}
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ── EBOOKS ────────────────────────────────────── */}
            <section className="py-16 md:py-24 border-b border-white/[0.05]">
                <div className="container-custom">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-px bg-[#C8A44A]" />
                                <span className="text-[#C8A44A] font-bold uppercase tracking-[0.25em] text-[11px]">Publicações</span>
                            </div>
                            <h2
                                className="font-display text-3xl sm:text-4xl font-bold text-white mb-4"
                            >
                                Biblioteca <span className="text-[#C8A44A] italic">IMI</span>
                            </h2>
                            <p className="text-white/50 text-lg font-light max-w-xl">
                                E-books e guias técnicos sobre avaliação imobiliária, mercado de alto padrão e investimentos no exterior.
                            </p>
                        </div>
                        <Link
                            href={`/${lang}/biblioteca`}
                            className="flex items-center gap-2 text-[#C8A44A] text-sm font-bold hover:text-white transition-colors shrink-0"
                        >
                            Ver Biblioteca Completa
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {EBOOKS.map((book) => (
                            <article
                                key={book.slug}
                                className="group bg-navy-950 border border-white/[0.05] hover:border-[#C8A44A]/30 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_32px_rgba(26,26,46,0.15)] flex flex-col"
                            >
                                <div className="relative aspect-[3/2] bg-[#0D1117] border-b border-white/[0.05] overflow-hidden">
                                    <Image
                                        src={book.coverImage}
                                        alt={`Capa do livro ${book.title}`}
                                        fill
                                        className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D1117]/35 to-transparent" />
                                </div>
                                <div className="p-6 flex flex-col flex-1">
                                    <p className="text-[#C8A44A] text-[10px] font-bold uppercase tracking-[0.15em] mb-2">{book.subtitle}</p>
                                    <h3
                                        className="font-display text-white font-bold text-[15px] leading-snug mb-3 group-hover:text-[#C8A44A] transition-colors"
                                    >
                                        {book.title}
                                    </h3>
                                    <p className="text-white/50 text-xs leading-relaxed flex-1 mb-5">{book.description}</p>
                                    <div className="flex gap-2.5">
                                        <Link
                                            href={`/${lang}/biblioteca/${book.slug}`}
                                            className="flex-1 h-10 flex items-center justify-center rounded-[4px] bg-transparent border border-[#C8A44A]/14 text-[#C8A44A] text-[11px] font-bold uppercase tracking-[0.1em] hover:bg-[#C8A44A]/10 transition-all"
                                        >
                                            Ver Livro
                                        </Link>
                                        {book.amazonUrl && (
                                            <a
                                                href={book.amazonUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 flex items-center justify-center rounded-[4px] bg-amber-500/10 border border-[#FF9900]/20 text-[#FF9900] hover:bg-amber-500/20 transition-all"
                                                title="Comprar na Amazon"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ───────────────────────────────────────── */}
            <section className="bg-navy-950 text-white py-20 md:py-28 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at center, #334E68 0%, transparent 60%)', filter: 'blur(80px)' }} />
                <div className="container-custom relative z-10">
                    <h2
                        className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight"
                    >
                        Vamos <span className="text-[#C8A44A] italic">Conversar?</span>
                    </h2>
                    <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto font-light leading-relaxed">
                        Conte-nos sobre seu projeto e descubra como podemos ajudar você a alcançar seus objetivos.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href={`/${lang}/contato`}
                            className="inline-flex items-center justify-center gap-3 h-14 px-10 text-sm font-bold rounded-[6px] transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden"
                            style={{ background: '#0A1624', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                        >
                            <MessageCircle className="w-4 h-4" />
                            Entrar em Contato
                            <span className="absolute bottom-0 left-[12%] right-[12%] h-[2px] pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6 }} />
                        </Link>
                        <a
                            href="https://wa.me/5581997230455"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-3 h-14 px-10 text-sm font-bold border border-white/10 text-slate-300 hover:bg-white/[0.04] hover:text-white rounded-[4px] transition-all duration-300"
                        >
                            WhatsApp Direto
                        </a>
                    </div>
                </div>
            </section>

        </main>
    )
}
