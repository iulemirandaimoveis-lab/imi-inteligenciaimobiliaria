'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Development } from './types/development'
import DevelopmentCard from './components/DevelopmentCard'
import AdvancedFilter, { FilterState } from './components/AdvancedFilter'
import { Search, ChevronDown, ChevronUp, CheckCircle, ShieldCheck, Gem } from 'lucide-react'

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
    }
}

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.2 }
    }
}

const BROKERAGE_TYPES = [
    {
        icon: Gem,
        title: 'Ativos Premium',
        description: 'Apenas empreendimentos de alto padrão selecionados por nossa inteligência de mercado.',
    },
    {
        icon: ShieldCheck,
        title: 'Segurança Jurídica',
        description: 'Due diligence completa e aprovação técnica antes da listagem de qualquer ativo.',
    },
    {
        icon: CheckCircle,
        title: 'Liquidez Comprovada',
        description: 'Imóveis validados para rápida absorção técnica pelo mercado nacional e internacional.',
    }
]

const PROCESS = [
    { n: '01', title: 'Curadoria Estrita', desc: 'Filtramos empreendimentos com base em histórico da construtora, risco zero e localização.' },
    { n: '02', title: 'Auditoria IMI', desc: 'Análise documental profunda acompanhada de valuation para garantir margem de ganho.' },
    { n: '03', title: 'Apresentação', desc: 'Ativos prontos para alocação direta listados abaixo na plataforma.' },
]

const FAQS = [
    { q: "Quais os critérios para um imóvel estar aqui?", a: "Ele passa por um filtro de 32 parâmetros, envolvendo a idoneidade da construtora, documentação cartorária livre de gravames e EVTE provando rentabilidade." },
    { q: "A IMI realiza financiamento?", a: "Sim. Nossos especialistas coordenam toda a engenharia financeira bancária ou consórcio para aquisição de quaisquer propriedades listadas." },
    { q: "O que é o inventário Off-Market?", a: "Imóveis exclusivos de clientes ou fundos que não estão anunciados publicamente, disponíveis apenas mediante cadastro e NDA." }
]

interface ImoveisClientProps {
    initialDevelopments: Development[];
    lang: string;
}

export default function ImoveisClient({ initialDevelopments, lang }: ImoveisClientProps) {

    const [filters, setFilters] = useState<FilterState>({
        status: [],
        type: [],
        bedrooms: null,
        priceRange: [0, 10000000],
        location: null,
        neighborhood: null,
        sort: 'relevant'
    });

    const availableLocations = useMemo(() => {
        const locs = new Set<string>();
        initialDevelopments.forEach(dev => {
            const isInternational = ['dubai', 'usa'].includes(dev.region?.toLowerCase());
            locs.add(isInternational ? (dev.location.country || dev.location.city) : dev.location.city);
        });
        return Array.from(locs).filter(Boolean).sort();
    }, [initialDevelopments]);

    const availableNeighborhoods = useMemo(() => {
        const hoods = new Set<string>();
        const devs = filters.location
            ? initialDevelopments.filter(d => d.location.city === filters.location || d.location.country === filters.location)
            : initialDevelopments;
        devs.forEach(dev => { if (dev.location.neighborhood) hoods.add(dev.location.neighborhood) });
        return Array.from(hoods).filter(Boolean).sort();
    }, [initialDevelopments, filters.location]);

    const filteredDevelopments = useMemo(() => {
        return initialDevelopments.filter((dev) => {
            if (filters.location) {
                const matchCity = dev.location.city === filters.location;
                const matchCountry = dev.location.country === filters.location;
                const matchRegion = dev.region === filters.location.toLowerCase().replace(' ', '-');
                if (!matchCity && !matchCountry && !matchRegion) return false;
            }
            if (filters.neighborhood && dev.location.neighborhood !== filters.neighborhood) return false;
            if (dev.priceRange.min > filters.priceRange[1]) return false;
            if (filters.bedrooms) {
                const parts = dev.specs.bedroomsRange.split('-').map(p => parseInt(p));
                const maxBeds = parts.length > 1 ? parts[1] : parts[0];
                if (maxBeds < filters.bedrooms) return false;
            }
            if (filters.type.length > 0) {
                const typeMatches = filters.type.some(t => {
                    const type = t.toLowerCase();
                    if (type === 'casa') return dev.tags.includes('casas');
                    if (type === 'flat') return dev.tags.includes('flat') || dev.tags.includes('compacto') || dev.tags.includes('studio');
                    if (type === 'garden') return dev.units.some(u => u.type?.toLowerCase().includes('garden'));
                    if (type === 'cobertura') return dev.units.some(u => u.type?.toLowerCase().includes('cobertura'));
                    if (type === 'apto') return !dev.tags.includes('casas') && !dev.tags.includes('flat');
                    return false;
                });
                if (!typeMatches) return false;
            }
            return true;
        }).sort((a, b) => {
            if (filters.sort === 'price-asc') return a.priceRange.min - b.priceRange.min;
            if (filters.sort === 'price-desc') return b.priceRange.min - a.priceRange.min;
            if (filters.sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            return a.order - b.order;
        });
    }, [filters, initialDevelopments]);

    return (
        <div className="bg-black text-white min-h-screen selection:bg-white selection:text-black">
            {/* 1. HERO SECTION */}
            <section className="relative h-[80svh] min-h-[600px] flex flex-col justify-center items-center text-center px-6 overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 60%)' }} />

                <motion.div
                    className="relative z-10 max-w-4xl mx-auto"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                >
                    <motion.span variants={fadeInUp} className="text-white/50 tracking-widest uppercase text-xs mb-6 block">
                        Portfólio IMI
                    </motion.span>
                    <motion.h1
                        variants={fadeInUp}
                        className="text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[1.1] mb-6"
                        style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}
                    >
                        Corretagem Curada
                    </motion.h1>
                    <motion.p
                        variants={fadeInUp}
                        className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-12 font-light"
                    >
                        Tese de investimentos convertida em blocos de concreto. <br /> Ativos validados e prontos para capitalização.
                    </motion.p>
                    <motion.div variants={fadeInUp} className="flex justify-center">
                        <a href="#catalogo" className="px-8 py-4 bg-white text-black text-sm tracking-widest uppercase font-semibold hover:bg-white/90 transition-colors">
                            Ver Catálogo
                        </a>
                    </motion.div>
                </motion.div>
            </section>

            {/* 2. DIFERENCIAIS */}
            <section className="py-32 px-6 bg-white text-black">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                        className="mb-20"
                    >
                        <h2 className="text-3xl md:text-5xl" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>
                            Por que investir aqui?
                        </h2>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-3 gap-12"
                    >
                        {BROKERAGE_TYPES.map((item, i) => (
                            <motion.div key={i} variants={fadeInUp} className="group cursor-default border-t border-black/10 pt-8">
                                <div className="mb-6 opacity-40 group-hover:opacity-100 transition-opacity duration-700">
                                    <item.icon size={32} />
                                </div>
                                <h3 className="text-xl mb-4" style={{ fontFamily: 'Georgia, serif' }}>{item.title}</h3>
                                <p className="text-black/60 font-light leading-relaxed text-sm">
                                    {item.description}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* 3. PROCESSO / MÉTODO */}
            <section className="py-32 px-6 bg-black text-white">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                        className="mb-20 md:text-center max-w-3xl mx-auto"
                    >
                        <h2 className="text-3xl md:text-5xl mb-6" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>
                            Nosso Funil de Avaliação
                        </h2>
                        <p className="text-white/50 text-lg font-light">
                            De cada 10 empreendimentos apresentados à plataforma, apenas 1 atende os critérios da base IMI de distribuição.
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-3 gap-16"
                    >
                        {PROCESS.map((step, i) => (
                            <motion.div key={i} variants={fadeInUp} className="relative border-t border-white/10 pt-8">
                                <span className="absolute top-0 right-0 -translate-y-1/2 text-8xl font-bold text-white/5 font-sans">
                                    {step.n}
                                </span>
                                <h3 className="text-xl mb-4" style={{ fontFamily: 'Georgia, serif' }}>{step.title}</h3>
                                <p className="text-white/50 font-light leading-relaxed text-sm">
                                    {step.desc}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* THE CATALOG (Specific for Imoveis Page, integrated cleanly) */}
            <section id="catalogo" className="py-20 bg-black min-h-screen border-t border-white/10">
                <AdvancedFilter
                    filters={filters}
                    onFilterChange={setFilters}
                    locations={availableLocations}
                    neighborhoods={availableNeighborhoods}
                />
                <div className="container-custom mt-12">
                    <div className="mb-10 text-white/50 text-xs tracking-widest uppercase flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-white" />
                        {filteredDevelopments.length} {filteredDevelopments.length === 1 ? 'resultado' : 'resultados'} encontrados
                    </div>

                    {filteredDevelopments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                            {filteredDevelopments.map((dev, index) => (
                                <DevelopmentCard key={dev.id} development={dev} index={index} lang={lang} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 border border-white/10 rounded-sm">
                            <Search className="w-8 h-8 text-white/30 mx-auto mb-6" />
                            <h3 className="font-display text-2xl font-bold text-white mb-2">Sem resultados</h3>
                            <p className="text-white/50 font-light max-w-xs mx-auto mb-8 text-sm">
                                Não encontramos imóveis com esses filtros exatos.
                            </p>
                            <button
                                onClick={() => setFilters({
                                    status: [],
                                    type: [],
                                    bedrooms: null,
                                    priceRange: [0, 10000000],
                                    location: null,
                                    neighborhood: null,
                                    sort: 'relevant'
                                })}
                                className="inline-flex items-center justify-center px-6 py-3 border border-white/20 text-white text-xs uppercase tracking-widest hover:bg-white/5 transition-colors"
                            >
                                Limpar filtros
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* 4. FAQ */}
            <section className="py-32 px-6 bg-white text-black">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                        className="mb-16"
                    >
                        <h2 className="text-3xl md:text-5xl" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>
                            FAQ
                        </h2>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                        className="space-y-2 border-t border-black/10"
                    >
                        {FAQS.map((faq, idx) => (
                            <div key={idx} className="border-b border-black/10">
                                <details className="group">
                                    <summary className="flex cursor-pointer list-none items-center justify-between py-6 font-medium text-lg">
                                        <span className="font-light tracking-wide">{faq.q}</span>
                                        <span className="transition group-open:rotate-180">
                                            <ChevronDown size={20} className="text-black/50" />
                                        </span>
                                    </summary>
                                    <p className="pb-6 text-black/60 font-light leading-relaxed">
                                        {faq.a}
                                    </p>
                                </details>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* 5. CTA INLINE / FORMULÁRIO */}
            <section id="contato" className="py-40 px-6 bg-black text-white text-center border-t border-white/10">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeInUp}
                    className="max-w-3xl mx-auto"
                >
                    <h2 className="text-4xl md:text-6xl mb-8" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>
                        Busca Ativa.
                    </h2>
                    <p className="text-white/50 font-light text-lg mb-12 max-w-xl mx-auto">
                        Não localizou o perfil exato no catálogo? Acione nossa equipe de consultoria e garanta o acesso ao inventário Off-Market IMI Reservado.
                    </p>

                    <form className="space-y-6 max-w-md mx-auto text-left" onSubmit={(e) => e.preventDefault()}>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Nome Completo</label>
                            <input type="text" className="w-full bg-transparent border-b border-white/20 pb-2 text-white outline-none focus:border-white transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Email</label>
                            <input type="email" className="w-full bg-transparent border-b border-white/20 pb-2 text-white outline-none focus:border-white transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Perfil de Interesse Escopo</label>
                            <input type="text" placeholder="Ex: Apartamento frente mar em João Pessoa, Teto de R$3M" className="w-full bg-transparent border-b border-white/20 pb-2 text-white outline-none placeholder:text-white/20 focus:border-white transition-colors" />
                        </div>
                        <button type="button" className="w-full py-4 mt-8 bg-white text-black text-sm tracking-widest uppercase font-semibold hover:bg-white/90 transition-colors">
                            Ativar Busca IMI
                        </button>
                    </form>

                </motion.div>
            </section>
        </div>
    )
}
