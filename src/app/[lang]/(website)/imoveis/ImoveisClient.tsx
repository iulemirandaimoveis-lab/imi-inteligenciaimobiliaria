'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, slideUp } from '@/lib/animations';
import { Development } from './types/development';
import DevelopmentCard from './components/DevelopmentCard';
import AdvancedFilter, { FilterState } from './components/AdvancedFilter';
import { MessageCircle, Search, Grid3X3, Map, ChevronDown, MapPin, Bed, Maximize2, SlidersHorizontal } from 'lucide-react';
import LeadCaptureModal from './components/LeadCaptureModal';
import dynamic from 'next/dynamic';

const ITEMS_PER_PAGE = 12;
const SPLIT_MAP_HEIGHT = 'clamp(500px, calc(100vh - 180px), 860px)';

const DEFAULT_FILTERS: FilterState = {
    status: [],
    type: [],
    bedrooms: null,
    priceRange: [0, 10000000],
    location: null,
    neighborhood: null,
    sort: 'relevant',
};

const MAP_HEIGHT = 'clamp(400px, calc(100vh - 200px), 700px)';

const PropertyMap = dynamic(() => import('@/components/maps/PropertyMap'), {
    ssr: false,
    loading: () => (
        <div style={{ height: '100%', minHeight: 400, background: '#141420', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#9CA3AF', fontSize: 14 }}>Carregando mapa...</div>
        </div>
    ),
});

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
    launch: 'Lançamento', ready: 'Pronta Entrega', under_construction: 'Em Obra',
}
const STATUS_COLORS: Record<string, string> = {
    launch: '#3B82F6', ready: '#10B981', under_construction: '#F59E0B',
}
const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

// ── Compact card used in the map sidebar list ─────────────────────────────────
function MapListCard({
    dev, lang, selected, onClick,
}: { dev: Development; lang: string; selected: boolean; onClick: () => void }) {
    const statusColor = STATUS_COLORS[dev.status] || '#3B82F6'
    const statusLabel = STATUS_LABELS[dev.status] || dev.status

    return (
        <motion.a
            href={`/${lang}/imoveis/${dev.slug}`}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => { e.preventDefault(); onClick() }}
            className="flex gap-3 p-3 border-b border-white/[0.06] cursor-pointer transition-all"
            style={{
                background: selected ? 'rgba(44,123,229,0.12)' : 'transparent',
                borderLeft: selected ? `3px solid #2C7BE5` : '3px solid transparent',
            }}
            whileHover={{ background: selected ? 'rgba(44,123,229,0.14)' : 'rgba(255,255,255,0.03)' }}
        >
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-[72px] h-[60px] rounded-lg overflow-hidden bg-white/5">
                {dev.images.main ? (
                    <img src={dev.images.main} alt={dev.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl opacity-30">🏢</div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1 mb-1">
                    <p className="text-white text-[12px] font-bold leading-tight line-clamp-1">{dev.name}</p>
                    <span
                        className="flex-shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                        style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44` }}
                    >
                        {statusLabel}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-[#6B7280] text-[10px] mb-1.5">
                    <MapPin size={9} />
                    <span className="truncate">{dev.location.neighborhood || dev.location.city}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[#2C7BE5] text-[11px] font-bold">
                        {dev.priceRange.min > 0 ? formatCurrency(dev.priceRange.min) : 'Consultar'}
                    </span>
                    {dev.specs.bedroomsRange && dev.specs.bedroomsRange !== '—' && (
                        <span className="flex items-center gap-0.5 text-[10px] text-[#6B7280]">
                            <Bed size={9} />{dev.specs.bedroomsRange}
                        </span>
                    )}
                    {dev.specs.areaRange && dev.specs.areaRange !== '—' && (
                        <span className="flex items-center gap-0.5 text-[10px] text-[#6B7280]">
                            <Maximize2 size={9} />{dev.specs.areaRange}
                        </span>
                    )}
                </div>
            </div>
        </motion.a>
    )
}

interface ImoveisClientProps {
    initialDevelopments: Development[];
    lang: string;
}

export default function ImoveisClient({ initialDevelopments, lang }: ImoveisClientProps) {

    const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ctaTarget, setCtaTarget] = useState<'off-market' | 'general'>('general');
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    // Scroll selected card into view in sidebar
    useEffect(() => {
        if (!selectedId || !listRef.current) return;
        const el = listRef.current.querySelector(`[data-dev-id="${selectedId}"]`) as HTMLElement | null;
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [selectedId]);

    const handleMarkerClick = useCallback((id: string) => {
        setSelectedId(id);
    }, []);

    // ── Read URL query params on mount ────────────────────────────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        if (!params.toString()) return;
        setFilters(prev => ({
            ...prev,
            type: params.get('type') ? params.get('type')!.split(',') : prev.type,
            bedrooms: params.get('beds') ? Number(params.get('beds')) : prev.bedrooms,
            priceRange: [
                params.get('price_min') ? Number(params.get('price_min')) : prev.priceRange[0],
                params.get('price_max') ? Number(params.get('price_max')) : prev.priceRange[1],
            ],
            location: params.get('location') || prev.location,
            status: params.get('status') ? params.get('status')!.split(',') : prev.status,
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Persist active filters to URL ─────────────────────────────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams();
        if (filters.type.length > 0) params.set('type', filters.type.join(','));
        if (filters.bedrooms) params.set('beds', String(filters.bedrooms));
        if (filters.priceRange[0] > 0) params.set('price_min', String(filters.priceRange[0]));
        if (filters.priceRange[1] < 10000000) params.set('price_max', String(filters.priceRange[1]));
        if (filters.location) params.set('location', filters.location);
        if (filters.status.length > 0) params.set('status', filters.status.join(','));
        const search = params.toString();
        const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname;
        window.history.replaceState(null, '', newUrl);
    }, [filters]);

    // ── Reset pagination when filters or view mode change ────────────────────
    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
    }, [filters, viewMode]);

    const handleCTAClick = (target: 'off-market' | 'general') => {
        setCtaTarget(target);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        window.open("https://wa.me/5581997230455", "_blank");
        setIsModalOpen(false);
    };

    // ── Derived data ──────────────────────────────────────────────────────────
    const availableLocations = useMemo(() => {
        const locs = new Set<string>();
        initialDevelopments.forEach(dev => {
            const isInternational = ['dubai', 'usa'].includes(dev.region?.toLowerCase());
            if (isInternational) {
                locs.add(dev.location.country || dev.location.city);
            } else {
                locs.add(dev.location.city);
            }
        });
        return Array.from(locs).filter(Boolean).sort();
    }, [initialDevelopments]);

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
                const matchRegion = dev.region === filters.location.toLowerCase().replace(' ', '-');
                if (!matchCity && !matchCountry && !matchRegion) return false;
            }
            // Neighborhood
            if (filters.neighborhood) {
                if (dev.location.neighborhood !== filters.neighborhood) return false;
            }
            // Status
            if (filters.status.length > 0) {
                if (!filters.status.includes(dev.status)) return false;
            }
            // Price — only filter if development has a price
            if (dev.priceRange.min > 0 && dev.priceRange.min > filters.priceRange[1]) return false;
            if (filters.priceRange[0] > 0 && dev.priceRange.max > 0 && dev.priceRange.max < filters.priceRange[0]) return false;
            // Bedrooms
            if (filters.bedrooms) {
                const parts = dev.specs.bedroomsRange.split('-').map(p => parseInt(p));
                const maxBeds = parts.length > 1 ? parts[1] : parts[0];
                if (isNaN(maxBeds) || maxBeds < filters.bedrooms) return false;
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
            if (filters.sort === 'price-asc') return a.priceRange.min - b.priceRange.min;
            if (filters.sort === 'price-desc') return b.priceRange.min - a.priceRange.min;
            if (filters.sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            return a.order - b.order;
        });
    }, [filters, initialDevelopments]);

    // ── Active filter count ───────────────────────────────────────────────────
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.type.length > 0) count++;
        if (filters.bedrooms) count++;
        if (filters.status.length > 0) count++;
        if (filters.location) count++;
        if (filters.neighborhood) count++;
        if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000) count++;
        return count;
    }, [filters]);

    // Special "Pronta Entrega" section — only when no active filters
    const showReadySection = !filters.location && !filters.neighborhood
        && !filters.bedrooms && filters.type.length === 0 && filters.status.length === 0;
    const readyDevelopments = showReadySection
        ? initialDevelopments.filter(dev => dev.status === 'ready' && dev.region === 'paraiba')
        : [];
    const mainGridDevelopments = showReadySection
        ? filteredDevelopments.filter(dev => !readyDevelopments.find(r => r.id === dev.id))
        : filteredDevelopments;

    // Paginated slice
    const visibleDevelopments = mainGridDevelopments.slice(0, visibleCount);
    const hasMore = visibleCount < mainGridDevelopments.length;

    // Intersection observer for auto-load-more
    useEffect(() => {
        if (!sentinelRef.current || !hasMore || viewMode !== 'grid') return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, mainGridDevelopments.length));
                }
            },
            { rootMargin: '200px', threshold: 0 }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [hasMore, viewMode, mainGridDevelopments.length]);

    // ── Empty portfolio state ─────────────────────────────────────────────────
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
                            Portfólio em <span className="text-[#486581] italic">Curadoria</span>
                        </h1>
                        <p className="text-[#9CA3AF] text-lg md:text-xl leading-relaxed mb-10 max-w-xl mx-auto">
                            Estamos selecionando tecnicamente os melhores ativos do mercado para compor este catálogo exclusivo.
                            <br /><br />
                            Aguarde novidades em breve ou fale conosco para oportunidades off-market.
                        </p>
                        <button
                            className="inline-flex items-center gap-3 h-14 px-8 text-[13px] font-bold uppercase tracking-widest bg-[#1A1E2A] text-white hover:bg-[#21263A] border border-[#21263A] border-l-4 border-l-[#334E68] rounded-xl transition-all duration-300 hover:-translate-y-1 mx-auto"
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

            {/* ── Premium Hero ──────────────────────────────────────────── */}
            <section className="relative bg-[#141420] pt-20 pb-14 md:pt-32 md:pb-28 overflow-hidden border-b border-white/[0.05]">
                <div
                    className="absolute top-1/4 right-1/4 w-[200px] h-[200px] sm:w-[500px] sm:h-[500px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(26,26,46,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }}
                />
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />

                <div className="container-custom relative z-10">
                    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl">
                        <motion.div variants={slideUp} className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-px" style={{ background: '#C8A65A' }} />
                            <span className="font-bold uppercase tracking-[0.25em] text-[11px]" style={{ color: '#C8A65A' }}>Portfólio 2026</span>
                        </motion.div>
                        <motion.h1 variants={slideUp} className="text-[32px] sm:text-[52px] lg:text-[64px] font-black leading-[1.02] tracking-tight mb-6 text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                            Curadoria de <br /><span className="italic" style={{ color: '#627D98' }}>Empreendimentos</span>
                        </motion.h1>
                        <motion.p variants={slideUp} className="text-[#9CA3AF] text-lg md:text-xl font-light leading-relaxed max-w-2xl">
                            Seleção técnica dos melhores ativos imobiliários. Do luxo absoluto à alta rentabilidade em compactos, nos principais hubs de valorização.
                        </motion.p>
                    </motion.div>
                </div>
            </section>

            {/* ── Advanced Filters ───────────────────────────────────────── */}
            <AdvancedFilter
                filters={filters}
                onFilterChange={setFilters}
                locations={availableLocations}
                neighborhoods={availableNeighborhoods}
            />

            {/* ── Pronta Entrega special section ─────────────────────────── */}
            {readyDevelopments.length > 0 && (
                <section className="py-16 bg-[#1A1E2A] overflow-hidden border-b border-white/[0.05]">
                    <div className="container-custom">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex items-center gap-4 mb-10"
                        >
                            <span className="bg-[#102A43]/20 text-[#486581] px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px] border border-[#334E68]/30">
                                Pronta Entrega
                            </span>
                            <h2 className="font-display text-2xl md:text-3xl text-white font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                                Oportunidades Imediatas
                            </h2>
                        </motion.div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {readyDevelopments.map((dev, idx) => (
                                <DevelopmentCard key={dev.id} development={dev} index={idx} lang={lang} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Main Grid / Map ────────────────────────────────────────── */}
            <section className="py-16 md:py-24 bg-[#0D0F14]">
                <div className="container-custom">

                    {/* Toolbar */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-8 flex flex-wrap items-center justify-between gap-3"
                    >
                        {/* Left: result count + filter badge */}
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-2 h-2 flex-shrink-0 rounded-full" style={{ background: '#C8A65A' }} />
                            <span className="font-bold uppercase tracking-widest text-xs truncate" style={{ color: '#9CA3AF' }}>
                                {filteredDevelopments.length} {filteredDevelopments.length === 1 ? 'resultado' : 'resultados'}
                            </span>
                            <AnimatePresence>
                                {activeFilterCount > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.7 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.7 }}
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                        style={{ background: 'rgba(200,166,90,0.15)', color: '#C8A65A', border: '1px solid rgba(200,166,90,0.3)' }}
                                    >
                                        <SlidersHorizontal size={10} />
                                        {activeFilterCount} filtro{activeFilterCount !== 1 ? 's' : ''}
                                        <button
                                            onClick={() => setFilters(DEFAULT_FILTERS)}
                                            className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                                            aria-label="Limpar filtros"
                                        >
                                            ×
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* View toggle */}
                        <div className="flex items-center gap-1 p-1 rounded-xl flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <button
                                onClick={() => setViewMode('grid')}
                                className="flex items-center gap-2 h-9 px-3 sm:px-4 rounded-lg text-xs font-semibold transition-all"
                                style={viewMode === 'grid'
                                    ? { background: 'rgba(200,166,90,0.2)', color: '#C8A65A', border: '1px solid rgba(200,166,90,0.3)' }
                                    : { color: '#6B7280' }
                                }
                            >
                                <Grid3X3 size={14} />
                                <span>Grade</span>
                            </button>
                            <button
                                onClick={() => { setViewMode('map'); setSelectedId(null); }}
                                className="flex items-center gap-2 h-9 px-3 sm:px-4 rounded-lg text-xs font-semibold transition-all"
                                style={viewMode === 'map'
                                    ? { background: 'rgba(200,166,90,0.2)', color: '#C8A65A', border: '1px solid rgba(200,166,90,0.3)' }
                                    : { color: '#6B7280' }
                                }
                            >
                                <Map size={14} />
                                <span>Mapa</span>
                            </button>
                        </div>
                    </motion.div>

                    {/* ── MAP VIEW — split-view ─────────────────────────────── */}
                    {viewMode === 'map' && (
                        <AnimatePresence mode="wait">
                            {filteredDevelopments.length === 0 ? (
                                <motion.div
                                    key="map-empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-center gap-4 mb-10"
                                    style={{ height: MAP_HEIGHT, background: '#141420' }}
                                >
                                    <span style={{ fontSize: 44, opacity: 0.25 }}>🗺️</span>
                                    <p style={{ color: '#9CA3AF', fontSize: 14, fontWeight: 500, margin: 0 }}>
                                        Nenhum empreendimento com esses filtros
                                    </p>
                                    <button
                                        onClick={() => setFilters(DEFAULT_FILTERS)}
                                        className="px-5 py-2.5 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/5 transition-colors"
                                    >
                                        Limpar filtros
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="map-split"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="mb-10 rounded-2xl overflow-hidden border border-white/[0.08]"
                                    style={{ height: SPLIT_MAP_HEIGHT }}
                                >
                                    {/* Mobile stacked / Desktop side-by-side */}
                                    <div className="flex flex-col lg:flex-row h-full">

                                        {/* ── Map pane ── */}
                                        <div className="flex-none h-[350px] lg:h-full lg:flex-1 relative">
                                            <PropertyMap
                                                developments={filteredDevelopments}
                                                height="100%"
                                                lang={lang}
                                                darkMode={true}
                                                className="w-full h-full"
                                                selectedId={selectedId ?? undefined}
                                                onMarkerClick={handleMarkerClick}
                                            />
                                        </div>

                                        {/* ── Sidebar list ── */}
                                        <div
                                            ref={listRef}
                                            className="flex-none lg:w-[360px] xl:w-[400px] overflow-y-auto border-t lg:border-t-0 lg:border-l border-white/[0.08]"
                                            style={{ background: '#0F121A' }}
                                        >
                                            {/* Header */}
                                            <div className="sticky top-0 z-10 px-4 py-3 border-b border-white/[0.06]"
                                                style={{ background: 'rgba(15,18,26,0.95)', backdropFilter: 'blur(8px)' }}>
                                                <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">
                                                    {filteredDevelopments.length} empreendimento{filteredDevelopments.length !== 1 ? 's' : ''}
                                                </p>
                                                {selectedId && (
                                                    <motion.a
                                                        initial={{ opacity: 0, y: -4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        href={`/${lang}/imoveis/${filteredDevelopments.find(d => d.id === selectedId)?.slug}`}
                                                        className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#2C7BE5] hover:text-[#60A5FA] transition-colors"
                                                    >
                                                        Ver detalhes →
                                                    </motion.a>
                                                )}
                                            </div>

                                            {/* Cards */}
                                            {filteredDevelopments.map((dev) => (
                                                <div key={dev.id} data-dev-id={dev.id}>
                                                    <MapListCard
                                                        dev={dev}
                                                        lang={lang}
                                                        selected={selectedId === dev.id}
                                                        onClick={() => setSelectedId(prev => prev === dev.id ? null : dev.id)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}

                    {/* ── GRID VIEW ────────────────────────────────────────── */}
                    {viewMode === 'grid' && mainGridDevelopments.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                                {visibleDevelopments.map((dev, index) => (
                                    <DevelopmentCard key={dev.id} development={dev} index={index} lang={lang} />
                                ))}
                            </div>

                            {/* Sentinel + "Carregar mais" button */}
                            {hasMore && (
                                <div ref={sentinelRef} className="flex flex-col items-center gap-3 mt-12">
                                    <button
                                        onClick={() => setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, mainGridDevelopments.length))}
                                        className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/20 text-[#9CA3AF] text-sm font-semibold hover:bg-white/5 hover:text-white transition-all"
                                    >
                                        <ChevronDown size={15} />
                                        Carregar mais
                                        <span className="text-xs text-[#6B7280]">
                                            ({visibleCount} de {mainGridDevelopments.length})
                                        </span>
                                    </button>
                                </div>
                            )}
                        </>
                    ) : viewMode === 'grid' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-24 bg-[#141420] rounded-3xl border border-dashed border-white/[0.1]"
                        >
                            <div className="w-20 h-20 bg-white/[0.05] rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="w-8 h-8 text-[#486581]" strokeWidth={1.5} />
                            </div>
                            <h3 className="font-display text-2xl font-bold text-white mb-2">Nenhum ativo encontrado</h3>
                            <p className="text-[#9CA3AF] max-w-xs mx-auto mb-8">
                                Não encontramos imóveis com esses filtros exatos. Tente remover alguns filtros.
                            </p>
                            <button
                                onClick={() => setFilters(DEFAULT_FILTERS)}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-colors"
                            >
                                Limpar filtros
                            </button>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* ── CTA Final ─────────────────────────────────────────────── */}
            <section className="bg-[#141420] text-white py-20 md:py-32 text-center relative overflow-hidden border-t border-white/[0.05]">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at center, #334E68 0%, transparent 60%)', filter: 'blur(80px)' }} />
                <div className="container-custom relative z-10">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                    >
                        <motion.h3 variants={slideUp} className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                            Não encontrou o <span className="text-[#486581] italic">imóvel ideal?</span>
                        </motion.h3>
                        <motion.p variants={slideUp} className="text-[#9CA3AF] text-lg md:text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                            Nossa curadoria vai além do catálogo. Fale com nossos especialistas para uma prospecção off-market personalizada.
                        </motion.p>
                        <motion.div variants={slideUp}>
                            <button
                                className="inline-flex items-center gap-3 h-14 px-9 text-sm font-bold tracking-wide bg-[#102A43] text-white hover:bg-[#1A2F44] border border-[#1A2F44] hover:border-[#334E68]/50 rounded-xl transition-all duration-300 hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(10,25,41,0.3)]"
                                onClick={() => handleCTAClick('general')}
                            >
                                <MessageCircle className="w-4 h-4 flex-shrink-0 text-white/80" />
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
