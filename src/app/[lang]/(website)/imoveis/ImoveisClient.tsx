'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, slideUp } from '@/lib/animations';
import { Development } from './types/development';
import DevelopmentCard from './components/DevelopmentCard';
import AdvancedFilter, { FilterState } from './components/AdvancedFilter';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { MessageCircle, Search } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import LeadCaptureModal from './components/LeadCaptureModal';

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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ctaTarget, setCtaTarget] = useState<'off-market' | 'general'>('general');

    const handleCTAClick = (target: 'off-market' | 'general') => {
        setCtaTarget(target);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        window.open("https://wa.me/5581997230455", "_blank");
        setIsModalOpen(false);
    };

    // Extract unique locations for the filter dropdown based on REAL data
    const availableLocations = useMemo(() => {
        const locs = new Set<string>();
        initialDevelopments.forEach(dev => {
            const isInternational = ['dubai', 'usa'].includes(dev.region?.toLowerCase());
            if (isInternational) {
                // Para internacionais, mostrar o país
                locs.add(dev.location.country || dev.location.city);
            } else {
                // Para nacionais, mostrar a cidade
                locs.add(dev.location.city);
            }
        });
        return Array.from(locs).filter(Boolean).sort();
    }, [initialDevelopments]);

    // Extract unique neighborhoods
    const availableNeighborhoods = useMemo(() => {
        const hoods = new Set<string>();
        const devs = filters.location
            ? initialDevelopments.filter(d => d.location.city === filters.location || d.location.country === filters.location)
            : initialDevelopments;
        devs.forEach(dev => {
            if (dev.location.neighborhood) hoods.add(dev.location.neighborhood);
        });
        return Array.from(hoods).filter(Boolean).sort();
    }, [initialDevelopments, filters.location]);

    const filteredDevelopments = useMemo(() => {
        return initialDevelopments.filter((dev) => {
            // Location
            if (filters.location) {
                const matchCity = dev.location.city === filters.location;
                const matchCountry = dev.location.country === filters.location;
                const matchRegion = dev.region === filters.location.toLowerCase().replace(' ', '-'); // Fallback for region matching
                if (!matchCity && !matchCountry && !matchRegion) return false;
            }

            // Neighborhood
            if (filters.neighborhood) {
                if (dev.location.neighborhood !== filters.neighborhood) return false;
            }

            // Price - Check if development starts within budget
            if (dev.priceRange.min > filters.priceRange[1]) return false;

            // Bedrooms - Check if development has units with at least requested bedrooms
            if (filters.bedrooms) {
                // Parse "2-4" or "3"
                const parts = dev.specs.bedroomsRange.split('-').map(p => parseInt(p));
                const maxBeds = parts.length > 1 ? parts[1] : parts[0];
                if (maxBeds < filters.bedrooms) return false;
            }

            // Type
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
            // Sort Logic
            if (filters.sort === 'price-asc') return a.priceRange.min - b.priceRange.min;
            if (filters.sort === 'price-desc') return b.priceRange.min - a.priceRange.min;
            if (filters.sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            return a.order - b.order; // Default 'relevant'
        });
    }, [filters, initialDevelopments]);

    // Separar Pronta Entrega para seção especial (apenas se filtros estiverem limpos ou compatíveis)
    const showReadySection = !filters.location && !filters.neighborhood && !filters.bedrooms && filters.type.length === 0;
    const readyDevelopments = showReadySection
        ? initialDevelopments.filter(dev => dev.status === 'ready' && dev.region === 'paraiba')
        : [];

    // Dedup: Don't show in main grid if shown in special section
    const mainGridDevelopments = showReadySection
        ? filteredDevelopments.filter(dev => !readyDevelopments.find(r => r.id === dev.id))
        : filteredDevelopments;

    if (!initialDevelopments || initialDevelopments.length === 0) {
        return (
            <main className="bg-[#0D0F14] min-h-screen pt-32 pb-20">
                <div className="container-custom text-center max-w-3xl mx-auto py-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#141420] rounded-3xl p-12 border border-white/[0.05] shadow-2xl"
                    >
                        <div className="w-24 h-24 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-8 border border-white/[0.05]">
                            <span className="text-4xl">🏗️</span>
                        </div>
                        <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            Portfólio em <span className="text-[#3B82F6] italic">Curadoria</span>
                        </h1>
                        <p className="text-[#9CA3AF] text-lg md:text-xl leading-relaxed mb-10 max-w-xl mx-auto">
                            Estamos selecionando tecnicamente os melhores ativos do mercado para compor este catálogo exclusivo.
                            <br /><br />
                            Aguarde novidades em breve ou fale conosco para oportunidades off-market.
                        </p>
                        <button
                            className="inline-flex items-center gap-3 h-14 px-8 text-[13px] font-bold uppercase tracking-widest bg-[#1A1E2A] text-white hover:bg-[#21263A] border border-[#21263A] border-l-4 border-l-[#3B82F6] rounded-xl transition-all duration-300 hover:-translate-y-1 mx-auto"
                            onClick={() => handleCTAClick('off-market')}
                        >
                            <MessageCircle className="w-5 h-5 flex-shrink-0" />
                            Consultar Off-Market
                        </button>
                    </motion.div>
                </div>
            </main>
        );
    }

    return (
        <main className="bg-[#0D0F14] min-h-screen">
            {/* Premium Hero */}
            <section className="relative bg-[#141420] pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden border-b border-white/[0.05]">
                {/* Gold glow orb */}
                <div
                    className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle, rgba(26,26,46,0.08) 0%, transparent 70%)',
                        filter: 'blur(60px)',
                    }}
                />
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />

                <div className="container-custom relative z-10">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="max-w-4xl"
                    >
                        <motion.div variants={slideUp} className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-px bg-[#1A1A2E]" />
                            <span className="text-[#3B82F6] font-bold uppercase tracking-[0.25em] text-[11px]">Portfólio 2026</span>
                        </motion.div>
                        <motion.h1 variants={slideUp} className="text-[40px] sm:text-[52px] lg:text-[64px] font-black leading-[1.02] tracking-tight mb-6 text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                            Curadoria de <br /><span className="text-[#3B82F6] italic">Empreendimentos</span>
                        </motion.h1>
                        <motion.p variants={slideUp} className="text-[#9CA3AF] text-lg md:text-xl font-light leading-relaxed max-w-2xl">
                            Seleção técnica dos melhores ativos imobiliários. Do luxo absoluto à alta rentabilidade em compactos, nos principais hubs de valorização.
                        </motion.p>
                    </motion.div>
                </div>
            </section>

            {/* Advanced Filters */}
            <AdvancedFilter
                filters={filters}
                onFilterChange={setFilters}
                locations={availableLocations}
                neighborhoods={availableNeighborhoods}
            />

            {/* Seção Especial Pronta Entrega */}
            {readyDevelopments.length > 0 && (
                <section className="py-16 bg-[#1A1E2A] overflow-hidden border-b border-white/[0.05]">
                    <div className="container-custom">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex items-center gap-4 mb-10"
                        >
                            <span className="bg-[#1A1A2E]/20 text-[#3B82F6] px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px] border border-[#3B82F6]/30">
                                Pronta Entrega
                            </span>
                            <h2 className="font-display text-2xl md:text-3xl text-white font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Oportunidades Imediatas</h2>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {readyDevelopments.map((dev, idx) => (
                                <DevelopmentCard key={dev.id} development={dev} index={idx} lang={lang} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Grid Principal */}
            <section className="py-16 md:py-24 bg-[#0D0F14]">
                <div className="container-custom">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-10 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#1A1A2E]" />
                            <span className="text-[#9CA3AF] font-bold uppercase tracking-widest text-xs">
                                {mainGridDevelopments.length} {mainGridDevelopments.length === 1 ? 'resultado' : 'resultados'} encontrados
                            </span>
                        </div>
                    </motion.div>

                    {mainGridDevelopments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                            {mainGridDevelopments.map((dev, index) => (
                                <DevelopmentCard key={dev.id} development={dev} index={index} lang={lang} />
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-24 bg-[#141420] rounded-3xl border border-dashed border-white/[0.1]"
                        >
                            <div className="w-20 h-20 bg-white/[0.05] rounded-full flex items-center justify-center mx-auto mb-6 shadow-soft">
                                <Search className="w-8 h-8 text-[#3B82F6]" strokeWidth={1.5} />
                            </div>
                            <h3 className="font-display text-2xl font-bold text-white mb-2">Nenhum ativo encontrado</h3>
                            <p className="text-[#9CA3AF] max-w-xs mx-auto mb-8">
                                Não encontramos imóveis com esses filtros exatos. Tente remover alguns filtros para ver mais opções.
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
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-colors"
                            >
                                Limpar filtros
                            </button>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* CTA Final */}
            <section className="bg-[#141420] text-white py-20 md:py-32 text-center relative overflow-hidden border-t border-white/[0.05]">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at center, #3B82F6 0%, transparent 60%)', filter: 'blur(80px)' }} />
                <div className="container-custom relative z-10">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                    >
                        <motion.h3 variants={slideUp} className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-white mb-6" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                            Não encontrou o <span className="text-[#3B82F6] italic">imóvel ideal?</span>
                        </motion.h3>
                        <motion.p variants={slideUp} className="text-[#9CA3AF] text-lg md:text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                            Nossa curadoria vai além do catálogo. Fale com nossos especialistas para uma prospecção off-market personalizada.
                        </motion.p>
                        <motion.div variants={slideUp}>
                            <button
                                className="inline-flex items-center gap-3 h-16 px-10 text-lg font-bold bg-[#1A1E2A] text-white hover:bg-[#21263A] border border-[#21263A] border-l-4 border-l-[#3B82F6] border-r-4 border-r-[#E53935] shadow-[0_8px_32px_rgba(26,26,46,0.15)] rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(26,26,46,0.25)]"
                                onClick={() => handleCTAClick('general')}
                            >
                                <MessageCircle className="w-5 h-5 flex-shrink-0 text-white" />
                                Iniciar Consultoria
                            </button>
                        </motion.div>
                    </motion.div>
                </div>
                <AnimatePresence>
                    {isModalOpen && (
                        <LeadCaptureModal
                            title={ctaTarget === 'off-market' ? "Acesso Off-Market" : "Consultoria IMI"}
                            description={ctaTarget === 'off-market'
                                ? "Preencha seus dados para receber nossa curadoria exclusiva de imóveis que não estão no catálogo aberto."
                                : "Fale com nossos especialistas e receba um atendimento baseado em dados e segurança para seu próximo investimento."}
                            customInterest={ctaTarget === 'off-market' ? "Interesse em Imóveis Off-Market" : "Consultoria Geral - Listagem de Imóveis"}
                            onClose={() => setIsModalOpen(false)}
                            onSuccess={handleSuccess}
                        />
                    )}
                </AnimatePresence>
            </section>
        </main>
    );
}
