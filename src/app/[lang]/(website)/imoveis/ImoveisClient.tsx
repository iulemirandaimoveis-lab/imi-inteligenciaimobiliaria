'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Development } from './types/development';
import { FilterState } from './components/AdvancedFilter';
import LeadCaptureModal from './components/LeadCaptureModal';
import {
    Search, MapPin, Heart, Share2, Bed, Bath, Car, Maximize2,
    ChevronDown, ChevronRight, SlidersHorizontal, MessageCircle, X,
    Map, Grid3X3,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { calcIMIScore, getScoreColor, getScoreLabel } from '@/features/properties/services/score.service';
import type { IMIProperty } from '@/features/properties/types';
import dynamic from 'next/dynamic';

// ── Constants ─────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 12;

const DEFAULT_FILTERS: FilterState = {
    search: '',
    status: [],
    type: [],
    bedrooms: null,
    priceRange: [0, 10000000],
    areaRange: [0, 500],
    location: null,
    neighborhood: null,
    sort: 'relevant',
};

/* ── Light-theme tokens ──────────────────────────────────────────── */
const PAGE_BG = '#F8F6F2';
const CARD_BG = '#FFFFFF';
const NAVY = '#0B1928';
const TEXT_PRIMARY = '#0B1928';
const TEXT_BODY = '#2D3748';
const TEXT_MUTED = '#948F84';
const TEXT_SUB = '#5A6577';
const BORDER = '#E2E0DB';
const BORDER_INPUT = '#B8B3A8';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const formatPrice = (min: number) => {
    if (min <= 0) return 'Consultar';
    if (min >= 1_000_000) return `R$ ${(min / 1_000_000).toFixed(1).replace('.0', '')}M`;
    return `R$ ${(min / 1_000).toFixed(0)}k`;
};

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
    launch:            { bg: NAVY, color: '#fff' },
    ready:             { bg: '#6BB87B', color: '#fff' },
    under_construction:{ bg: '#F59E0B', color: '#fff' },
};
const BADGE_LABELS: Record<string, string> = {
    launch: 'Lançamento', ready: 'Pronta Entrega', under_construction: 'Em Obra',
};

const PropertyMap = dynamic(() => import('@/components/maps/PropertyMap'), {
    ssr: false,
    loading: () => (
        <div style={{ height: '100%', minHeight: 400, background: '#F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: TEXT_MUTED, fontSize: 14 }}>Carregando mapa...</span>
        </div>
    ),
});

// ── Property Card ─────────────────────────────────────────────────────────────

function PropertyCard({ dev, lang }: { dev: Development; lang: string }) {
    const badge = BADGE_STYLES[dev.status] || BADGE_STYLES.launch;
    const label = BADGE_LABELS[dev.status] || dev.status;
    const price = formatPrice(dev.priceRange.min);
    const typeLabel = dev.tags.includes('casas') ? 'Casa' : 'Apartamento';
    const area = dev.specs.areaRange !== '—' ? dev.specs.areaRange : null;

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4 }}
            className="bg-white border border-[#E2E0DB] rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow"
        >
            {/* Image */}
            <a href={`/${lang}/imoveis/${dev.slug}`} className="block relative aspect-[16/9] bg-[#F0EDE8] flex-shrink-0 overflow-hidden">
                {dev.images.main ? (
                    <img src={dev.images.main} alt={dev.name} className="w-full h-full object-cover block hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[40px] opacity-15">🏢</div>
                )}

                {/* Badge top-left */}
                <span className="absolute top-3 left-3 bg-[#0B1928] text-white text-[10px] font-bold tracking-widest uppercase rounded-lg px-3 py-1">
                    {label}
                </span>

                {/* IMI Score badge bottom-left */}
                {(() => {
                    const parseMin = (s?: string) => parseInt(String(s || '0').replace(/[^\d]/g, '')) || 0;
                    const imiProp: IMIProperty = {
                        id: dev.id, name: dev.name,
                        price: dev.priceRange?.min || 0,
                        area: parseMin(dev.specs?.areaRange),
                        bedrooms: parseMin(dev.specs?.bedroomsRange),
                        neighborhood: dev.location?.neighborhood || '',
                        city: dev.location?.city || 'Recife',
                        type: dev.tags.includes('casas') ? 'casa' : 'apartamento',
                        status: dev.status,
                    } as IMIProperty;
                    const s = calcIMIScore(imiProp);
                    const c = getScoreColor(s);
                    return (
                        <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1" style={{ background: 'rgba(11,25,40,0.85)', backdropFilter: 'blur(8px)' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>{s}</span>
                            <span style={{ fontSize: 9, fontWeight: 600, color: '#C8A44A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>IMI</span>
                        </span>
                    );
                })()}

                {/* Heart + Share top-right */}
                <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                    {[Heart, Share2].map((Icon, i) => (
                        <button key={i} className="w-8 h-8 rounded-full bg-white/80 border border-[#E2E0DB] flex items-center justify-center cursor-pointer text-[#5A6577] hover:bg-white transition-colors">
                            <Icon size={14} />
                        </button>
                    ))}
                </div>
            </a>

            {/* Body */}
            <div className="px-4 pt-3.5 pb-4 flex flex-col gap-2 flex-1">
                {/* Name + location */}
                <div>
                    <a href={`/${lang}/imoveis/${dev.slug}`} className="block text-[#0B1928] text-[15px] font-bold leading-tight no-underline hover:text-[#2D3748] transition-colors" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        {dev.name}
                    </a>
                    <div className="flex items-center gap-1 mt-1 text-[#5A6577] text-xs">
                        <MapPin size={11} className="flex-shrink-0 text-[#948F84]" />
                        <span>{dev.location.neighborhood ? `${dev.location.neighborhood}, ` : ''}{dev.location.city}</span>
                        {area && <span className="ml-1 text-[#948F84]">· {area}</span>}
                    </div>
                </div>

                {/* Specs row */}
                <div className="flex items-center gap-3 text-sm text-[#2D3748]">
                    {dev.specs.bedroomsRange && dev.specs.bedroomsRange !== '—' && (
                        <span className="flex items-center gap-1">
                            <Bed size={12} className="text-[#948F84] flex-shrink-0" />
                            {dev.specs.bedroomsRange} qtos
                        </span>
                    )}
                    {dev.specs.bathroomsRange && (
                        <span className="flex items-center gap-1">
                            <Bath size={12} className="text-[#948F84] flex-shrink-0" />
                            {dev.specs.bathroomsRange} ban
                        </span>
                    )}
                    {dev.specs.parkingRange && (
                        <span className="flex items-center gap-1">
                            <Car size={12} className="text-[#948F84] flex-shrink-0" />
                            {dev.specs.parkingRange} vagas
                        </span>
                    )}
                </div>

                {/* Price row */}
                <div className="pt-2 border-t border-[#E2E0DB] flex items-center justify-between">
                    <span className="font-mono text-lg font-bold text-[#0B1928]" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace" }}>{price}</span>
                    <a
                        href={`/${lang}/imoveis/${dev.slug}`}
                        className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-[#0B1928] text-white text-xs font-bold tracking-wider uppercase no-underline hover:bg-[#1a2d42] transition-colors"
                    >
                        Ver Imóvel
                    </a>
                </div>
            </div>
        </motion.article>
    );
}

// ── Compact card for desktop map sidebar ──────────────────────────────────────

function MapSidebarCard({ dev, lang, selected, onClick }: { dev: Development; lang: string; selected: boolean; onClick: () => void }) {
    const badge = BADGE_STYLES[dev.status] || BADGE_STYLES.launch;
    const label = BADGE_LABELS[dev.status] || dev.status;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            data-dev-id={dev.id}
            onClick={onClick}
            className="flex gap-3 px-3.5 py-3 cursor-pointer transition-all"
            style={{
                borderBottom: `1px solid ${BORDER}`,
                borderLeft: selected ? `3px solid ${NAVY}` : '3px solid transparent',
                background: selected ? '#F0EDE8' : 'transparent',
            }}
        >
            <div className="flex-shrink-0 w-[72px] h-[60px] rounded-[10px] overflow-hidden bg-[#F0EDE8]">
                {dev.images.main
                    ? <img src={dev.images.main} alt={dev.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center opacity-20">🏢</div>
                }
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="text-[#0B1928] text-xs font-bold leading-tight m-0 overflow-hidden line-clamp-1">
                        {dev.name}
                    </p>
                    <span className="flex-shrink-0 text-[9px] font-bold px-[7px] py-0.5 rounded-md uppercase" style={{ background: badge.bg, color: badge.color }}>
                        {label}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-[#5A6577] text-[10px] mb-1.5">
                    <MapPin size={9} /><span className="overflow-hidden text-ellipsis whitespace-nowrap">{dev.location.neighborhood || dev.location.city}</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <span className="text-[#0B1928] text-xs font-bold font-mono">{formatPrice(dev.priceRange.min)}</span>
                    {dev.specs.bedroomsRange && dev.specs.bedroomsRange !== '—' && (
                        <span className="flex items-center gap-1 text-[#948F84] text-[10px]">
                            <Bed size={9} />{dev.specs.bedroomsRange}
                        </span>
                    )}
                    {dev.specs.areaRange && dev.specs.areaRange !== '—' && (
                        <span className="flex items-center gap-1 text-[#948F84] text-[10px]">
                            <Maximize2 size={9} />{dev.specs.areaRange}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface ImoveisClientProps {
    initialDevelopments: Development[];
    lang: string;
}

export default function ImoveisClient({ initialDevelopments, lang }: ImoveisClientProps) {
    const isMobile = useIsMobile();

    const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ctaTarget, setCtaTarget] = useState<'off-market' | 'general'>('general');
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const listRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    // Scroll selected sidebar card into view
    useEffect(() => {
        if (!selectedId || !listRef.current) return;
        const el = listRef.current.querySelector(`[data-dev-id="${selectedId}"]`) as HTMLElement | null;
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [selectedId]);

    const handleMarkerClick = useCallback((id: string) => setSelectedId(id), []);

    // Read URL params on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        if (!params.toString()) return;
        setFilters(prev => ({
            ...prev,
            search: params.get('q') || prev.search,
            type: params.get('type') ? params.get('type')!.split(',') : prev.type,
            bedrooms: params.get('beds') ? Number(params.get('beds')) : prev.bedrooms,
            priceRange: [
                params.get('price_min') ? Number(params.get('price_min')) : prev.priceRange[0],
                params.get('price_max') ? Number(params.get('price_max')) : prev.priceRange[1],
            ],
            areaRange: [
                params.get('area_min') ? Number(params.get('area_min')) : prev.areaRange[0],
                params.get('area_max') ? Number(params.get('area_max')) : prev.areaRange[1],
            ],
            location: params.get('location') || prev.location,
            status: params.get('status') ? params.get('status')!.split(',') : prev.status,
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Persist filters to URL
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams();
        if (filters.search) params.set('q', filters.search);
        if (filters.type.length > 0) params.set('type', filters.type.join(','));
        if (filters.bedrooms) params.set('beds', String(filters.bedrooms));
        if (filters.priceRange[0] > 0) params.set('price_min', String(filters.priceRange[0]));
        if (filters.priceRange[1] < 10000000) params.set('price_max', String(filters.priceRange[1]));
        if (filters.areaRange[0] > 0) params.set('area_min', String(filters.areaRange[0]));
        if (filters.areaRange[1] < 500) params.set('area_max', String(filters.areaRange[1]));
        if (filters.location) params.set('location', filters.location);
        if (filters.status.length > 0) params.set('status', filters.status.join(','));
        const search = params.toString();
        window.history.replaceState(null, '', search ? `${window.location.pathname}?${search}` : window.location.pathname);
    }, [filters]);

    // Reset pagination when filters/view change
    useEffect(() => { setVisibleCount(ITEMS_PER_PAGE); }, [filters, viewMode]);

    const handleCTAClick = (target: 'off-market' | 'general') => {
        setCtaTarget(target);
        setIsModalOpen(true);
    };
    const handleSuccess = () => {
        window.open('https://wa.me/5581997230455', '_blank');
        setIsModalOpen(false);
    };

    // ── Derived data ──────────────────────────────────────────────────────────
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
        devs.forEach(dev => { if (dev.location.neighborhood) hoods.add(dev.location.neighborhood); });
        return Array.from(hoods).filter(Boolean).sort();
    }, [initialDevelopments, filters.location]);

    const filteredDevelopments = useMemo(() => {
        return initialDevelopments.filter(dev => {
            if (filters.search) {
                const q = filters.search.toLowerCase().trim();
                const hay = [dev.name, dev.developer, dev.location.neighborhood, dev.location.city, dev.location.state, dev.shortDescription]
                    .filter(Boolean).join(' ').toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (filters.location) {
                const matchCity = dev.location.city === filters.location;
                const matchCountry = dev.location.country === filters.location;
                const matchRegion = dev.region === filters.location.toLowerCase().replace(' ', '-');
                if (!matchCity && !matchCountry && !matchRegion) return false;
            }
            if (filters.neighborhood && dev.location.neighborhood !== filters.neighborhood) return false;
            if (filters.status.length > 0 && !filters.status.includes(dev.status)) return false;
            if (dev.priceRange.min > 0 && dev.priceRange.min > filters.priceRange[1]) return false;
            if (filters.priceRange[0] > 0 && dev.priceRange.max > 0 && dev.priceRange.max < filters.priceRange[0]) return false;
            if (filters.bedrooms) {
                const parts = dev.specs.bedroomsRange.split('-').map(p => parseInt(p));
                const maxBeds = parts.length > 1 ? parts[1] : parts[0];
                if (isNaN(maxBeds) || maxBeds < filters.bedrooms) return false;
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
            if (filters.areaRange[0] > 0 || filters.areaRange[1] < 500) {
                const areaStr = dev.specs.areaRange;
                if (areaStr && areaStr !== '—') {
                    const nums = areaStr.replace(/[^\d\-–]/g, '').split(/[-–]/).map(Number).filter(n => !isNaN(n));
                    const devMin = nums[0] || 0;
                    const devMax = nums.length > 1 ? nums[1] : devMin;
                    if (devMax < filters.areaRange[0] || devMin > filters.areaRange[1]) return false;
                }
            }
            return true;
        }).sort((a, b) => {
            if (filters.sort === 'price-asc') return a.priceRange.min - b.priceRange.min;
            if (filters.sort === 'price-desc') return b.priceRange.min - a.priceRange.min;
            if (filters.sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            return a.order - b.order;
        });
    }, [filters, initialDevelopments]);

    const activeFilterCount = useMemo(() => {
        let c = 0;
        if (filters.search) c++;
        if (filters.type.length > 0) c++;
        if (filters.bedrooms) c++;
        if (filters.status.length > 0) c++;
        if (filters.location) c++;
        if (filters.neighborhood) c++;
        if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000) c++;
        if (filters.areaRange[0] > 0 || filters.areaRange[1] < 500) c++;
        return c;
    }, [filters]);

    const visibleDevelopments = filteredDevelopments.slice(0, visibleCount);
    const hasMore = visibleCount < filteredDevelopments.length;

    // Intersection observer for auto-load-more
    useEffect(() => {
        if (!sentinelRef.current || !hasMore || viewMode !== 'grid') return;
        const observer = new IntersectionObserver(
            entries => { if (entries[0].isIntersecting) setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredDevelopments.length)); },
            { rootMargin: '200px', threshold: 0 }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [hasMore, viewMode, filteredDevelopments.length]);

    // ── Empty portfolio ───────────────────────────────────────────────────────
    if (!initialDevelopments || initialDevelopments.length === 0) {
        return (
            <main style={{ background: PAGE_BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-12 border border-[#E2E0DB] max-w-[480px] text-center shadow-sm">
                    <div className="text-5xl mb-5">🏗️</div>
                    <h1 className="text-3xl font-bold text-[#0B1928] mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        Portfólio em <em className="text-[#5A6577]">Curadoria</em>
                    </h1>
                    <p className="text-[#5A6577] text-[15px] leading-relaxed mb-7">
                        Estamos selecionando os melhores ativos do mercado para este catálogo exclusivo.
                    </p>
                    <button
                        onClick={() => handleCTAClick('off-market')}
                        className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[#0B1928] text-white text-sm font-bold cursor-pointer hover:bg-[#1a2d42] transition-colors"
                    >
                        <MessageCircle size={16} /> Consultar Off-Market
                    </button>
                </motion.div>
                {isModalOpen && (
                    <LeadCaptureModal
                        title="Acesso Off-Market" description="Preencha seus dados para receber nossa curadoria exclusiva."
                        customInterest="Interesse em Imóveis Off-Market"
                        onClose={() => setIsModalOpen(false)} onSuccess={handleSuccess}
                    />
                )}
            </main>
        );
    }

    // ── Shared filter chip row (used in both mobile and desktop) ──────────────
    const filterChipsMobile = (
        <div className="flex gap-2 overflow-x-auto px-4 pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {[
                { label: 'Tipo', key: 'type' as const, active: filters.type.length > 0 },
                { label: 'Preço', key: 'priceRange' as const, active: filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000 },
                { label: filters.bedrooms ? `${filters.bedrooms} Quartos` : 'Quartos', key: 'bedrooms' as const, active: !!filters.bedrooms },
                { label: 'Área', key: 'areaRange' as const, active: filters.areaRange[0] > 0 || filters.areaRange[1] < 500 },
                { label: 'Status', key: 'status' as const, active: filters.status.length > 0 },
            ].map(chip => (
                <button
                    key={chip.key}
                    onClick={() => setShowMobileFilters(true)}
                    className={`flex-shrink-0 h-[34px] px-3.5 rounded-xl text-[13px] font-medium cursor-pointer whitespace-nowrap border transition-colors ${
                        chip.active
                            ? 'bg-[#0B1928] text-white border-[#0B1928]'
                            : 'bg-white text-[#2D3748] border-[#B8B3A8]'
                    }`}
                >
                    {chip.label}
                </button>
            ))}
        </div>
    );

    // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────
    const mobileView = (
        <main style={{ background: PAGE_BG, minHeight: '100vh', paddingTop: 64, paddingBottom: 32 }}>

            {/* Search bar */}
            <div className="px-4 pt-4 pb-3">
                <div className="flex items-center gap-2.5 bg-white border border-[#B8B3A8] rounded-xl px-3.5 h-12">
                    <Search size={16} className="text-[#948F84] flex-shrink-0" />
                    <input
                        type="text"
                        placeholder={availableLocations[0] ? `${availableLocations[0]}…` : 'Buscar imóveis…'}
                        value={filters.search}
                        onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                        className="flex-1 bg-transparent border-none outline-none text-[#0B1928] text-sm placeholder-[#B8B3A8]"
                    />
                    <button
                        onClick={() => setShowMobileFilters(true)}
                        className="flex items-center gap-1 text-[#0B1928] text-sm font-bold bg-none border-none cursor-pointer flex-shrink-0"
                    >
                        Filtros <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* Chip row */}
            {filterChipsMobile}

            {/* Results toolbar */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <button
                    onClick={() => setViewMode(v => v === 'map' ? 'grid' : 'map')}
                    className={`flex items-center gap-1.5 h-[34px] px-3.5 rounded-xl text-[13px] font-semibold cursor-pointer border transition-colors ${
                        viewMode === 'map'
                            ? 'bg-[#0B1928] text-white border-[#0B1928]'
                            : 'bg-white text-[#5A6577] border-[#B8B3A8]'
                    }`}
                >
                    <MapPin size={13} /> Mapa
                </button>
                <button
                    onClick={() => setFilters(f => ({ ...f, sort: f.sort === 'newest' ? 'relevant' : 'newest' }))}
                    className="flex items-center gap-1 bg-none border-none text-[#948F84] text-xs cursor-pointer"
                >
                    Ordenar: {filters.sort === 'newest' ? 'Mais Recentes' : 'Relevantes'}
                    <ChevronDown size={13} />
                </button>
            </div>

            {/* Count */}
            <div className="px-4 pb-3">
                <span className="text-sm text-[#948F84]">
                    <strong className="text-[#0B1928]">{filteredDevelopments.length}</strong> imóveis encontrados
                </span>
            </div>

            {/* Map view */}
            {viewMode === 'map' ? (
                <div className="mx-4 mb-5 rounded-2xl overflow-hidden border border-[#E2E0DB]" style={{ height: 420 }}>
                    <PropertyMap
                        developments={filteredDevelopments}
                        height="420px"
                        lang={lang}
                        selectedId={selectedId ?? undefined}
                        onMarkerClick={handleMarkerClick}
                    />
                </div>
            ) : null}

            {/* Card list */}
            <div className="flex flex-col gap-4 px-4">
                {visibleDevelopments.length > 0 ? visibleDevelopments.map(dev => (
                    <PropertyCard key={dev.id} dev={dev} lang={lang} />
                )) : (
                    <div className="text-center py-12 text-[#948F84]">
                        <div className="text-4xl mb-3 opacity-30">🔍</div>
                        <p className="mb-4">Nenhum imóvel encontrado</p>
                        <button onClick={() => setFilters(DEFAULT_FILTERS)}
                            className="px-5 py-2 rounded-xl border border-[#B8B3A8] bg-white text-[#2D3748] text-sm cursor-pointer hover:bg-[#F8F6F2] transition-colors">
                            Limpar filtros
                        </button>
                    </div>
                )}
            </div>

            {/* Load more sentinel */}
            {hasMore && <div ref={sentinelRef} style={{ height: 20 }} />}

            {/* Mobile filters drawer */}
            <AnimatePresence>
                {showMobileFilters && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-[200]"
                        onClick={() => setShowMobileFilters(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            onClick={e => e.stopPropagation()}
                            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl px-5 pt-5 pb-9 max-h-[80vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-[#0B1928] text-[17px] font-bold m-0">
                                    <SlidersHorizontal size={16} className="inline mr-2 text-[#948F84]" />
                                    Filtros
                                </h3>
                                <button onClick={() => setShowMobileFilters(false)}
                                    className="w-8 h-8 rounded-full bg-[#F0EDE8] border-none text-[#5A6577] cursor-pointer flex items-center justify-center">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Busca */}
                            <FilterSection label="Busca">
                                <input
                                    type="text"
                                    placeholder="Nome, bairro, cidade…"
                                    value={filters.search}
                                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                                    className="w-full bg-white border border-[#B8B3A8] rounded-xl px-3.5 py-2.5 text-[#0B1928] text-sm outline-none box-border focus:border-[#0B1928] transition-colors"
                                />
                            </FilterSection>

                            {/* Quartos */}
                            <FilterSection label="Quartos">
                                <div className="flex gap-2">
                                    {[null, 1, 2, 3, 4].map(n => (
                                        <button key={n ?? 'all'} onClick={() => setFilters(f => ({ ...f, bedrooms: n }))}
                                            className={`flex-1 h-9 rounded-xl text-sm font-semibold cursor-pointer border transition-colors ${
                                                filters.bedrooms === n
                                                    ? 'bg-[#0B1928] text-white border-[#0B1928]'
                                                    : 'bg-white text-[#5A6577] border-[#B8B3A8]'
                                            }`}>
                                            {n === null ? 'Todos' : `${n}+`}
                                        </button>
                                    ))}
                                </div>
                            </FilterSection>

                            {/* Tipo */}
                            <FilterSection label="Tipo">
                                <div className="flex gap-2 flex-wrap">
                                    {['Apto', 'Casa', 'Flat', 'Cobertura', 'Garden'].map(t => {
                                        const val = t.toLowerCase();
                                        const active = filters.type.includes(val);
                                        return (
                                            <button key={t} onClick={() => setFilters(f => ({ ...f, type: active ? f.type.filter(x => x !== val) : [...f.type, val] }))}
                                                className={`h-[34px] px-3.5 rounded-xl text-sm font-medium cursor-pointer border transition-colors ${
                                                    active
                                                        ? 'bg-[#0B1928] text-white border-[#0B1928]'
                                                        : 'bg-white text-[#5A6577] border-[#B8B3A8]'
                                                }`}>
                                                {t}
                                            </button>
                                        );
                                    })}
                                </div>
                            </FilterSection>

                            {/* Localização */}
                            <FilterSection label="Localização">
                                <div className="flex gap-2 flex-wrap">
                                    <button onClick={() => setFilters(f => ({ ...f, location: null, neighborhood: null }))}
                                        className={`h-[34px] px-3.5 rounded-xl text-sm cursor-pointer border transition-colors ${
                                            !filters.location ? 'bg-[#0B1928] text-white border-[#0B1928]' : 'bg-white text-[#5A6577] border-[#B8B3A8]'
                                        }`}>
                                        Todas
                                    </button>
                                    {availableLocations.map(loc => {
                                        const active = filters.location === loc;
                                        return (
                                            <button key={loc} onClick={() => setFilters(f => ({ ...f, location: active ? null : loc, neighborhood: null }))}
                                                className={`h-[34px] px-3.5 rounded-xl text-sm cursor-pointer border transition-colors ${
                                                    active ? 'bg-[#0B1928] text-white border-[#0B1928]' : 'bg-white text-[#5A6577] border-[#B8B3A8]'
                                                }`}>
                                                {loc}
                                            </button>
                                        );
                                    })}
                                </div>
                            </FilterSection>

                            {/* Actions */}
                            <div className="flex gap-2.5 mt-2">
                                <button onClick={() => { setFilters(DEFAULT_FILTERS); setShowMobileFilters(false); }}
                                    className="flex-1 h-12 rounded-xl border border-[#B8B3A8] bg-white text-[#5A6577] text-sm cursor-pointer hover:bg-[#F8F6F2] transition-colors">
                                    Limpar
                                </button>
                                <button onClick={() => setShowMobileFilters(false)}
                                    className="flex-[2] h-12 rounded-xl bg-[#0B1928] text-white text-sm font-bold cursor-pointer hover:bg-[#1a2d42] transition-colors">
                                    Ver {filteredDevelopments.length} imóveis
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Lead capture modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <LeadCaptureModal
                        title={ctaTarget === 'off-market' ? 'Acesso Off-Market' : 'Consultoria IMI'}
                        description={ctaTarget === 'off-market'
                            ? 'Receba nossa curadoria exclusiva de imóveis que não estão no catálogo aberto.'
                            : 'Fale com nossos especialistas para um atendimento baseado em dados.'}
                        customInterest={ctaTarget === 'off-market' ? 'Interesse em Imóveis Off-Market' : 'Consultoria Geral - Listagem de Imóveis'}
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={handleSuccess}
                    />
                )}
            </AnimatePresence>
        </main>
    );

    // ── DESKTOP LAYOUT ────────────────────────────────────────────────────────
    const desktopView = (
        <main style={{ background: PAGE_BG, minHeight: '100vh', paddingTop: 80, paddingBottom: 60 }}>
            <div className="max-w-[1400px] mx-auto px-6">

                {/* Top search bar */}
                <div className="mb-4">
                    <div className="flex items-center gap-3 bg-white border border-[#B8B3A8] rounded-xl px-4 h-12 max-w-[720px]">
                        <Search size={18} className="text-[#948F84] flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, bairro, cidade ou tipo…"
                            value={filters.search}
                            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                            className="flex-1 bg-transparent border-none outline-none text-[#0B1928] text-sm placeholder-[#B8B3A8]"
                        />
                        {filters.search && (
                            <button onClick={() => setFilters(f => ({ ...f, search: '' }))}
                                className="bg-none border-none text-[#948F84] cursor-pointer flex p-1 hover:text-[#5A6577] transition-colors">
                                <X size={15} />
                            </button>
                        )}
                        <button
                            onClick={() => {/* already filtering live */ }}
                            className="h-9 px-[18px] rounded-xl bg-[#0B1928] text-white text-sm font-bold cursor-pointer flex-shrink-0 hover:bg-[#1a2d42] transition-colors">
                            Buscar
                        </button>
                    </div>
                </div>

                {/* Filter chip row */}
                <div className="flex items-center gap-2 mb-5 flex-wrap">
                    {[
                        { label: 'Tipo', active: filters.type.length > 0 },
                        { label: 'Preço', active: filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000 },
                        { label: filters.bedrooms ? `${filters.bedrooms}+ Quartos` : 'Quartos', active: !!filters.bedrooms },
                        { label: 'Banheiros', active: false },
                        { label: 'Vagas', active: false },
                        { label: 'Área', active: filters.areaRange[0] > 0 || filters.areaRange[1] < 500 },
                    ].map(chip => (
                        <button key={chip.label}
                            className={`flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-medium cursor-pointer border transition-colors ${
                                chip.active
                                    ? 'bg-[#0B1928] text-white border-[#0B1928]'
                                    : 'bg-white text-[#2D3748] border-[#B8B3A8] hover:border-[#948F84]'
                            }`}>
                            {chip.label} <ChevronDown size={13} />
                        </button>
                    ))}
                    {activeFilterCount > 0 && (
                        <button onClick={() => setFilters(DEFAULT_FILTERS)}
                            className="h-10 px-3.5 rounded-xl border-none bg-none text-[#948F84] text-sm cursor-pointer underline hover:text-[#5A6577] transition-colors">
                            Limpar filtros
                        </button>
                    )}
                </div>

                {/* Results toolbar */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                        <span className="text-sm text-[#948F84]">
                            <strong className="text-[#0B1928]">{filteredDevelopments.length}</strong> imóveis encontrados
                        </span>
                        {activeFilterCount > 0 && (
                            <span className="text-xs text-[#5A6577] bg-[#F0EDE8] border border-[#E2E0DB] rounded-lg px-2.5 py-0.5">
                                {activeFilterCount} filtro{activeFilterCount !== 1 ? 's' : ''} ativo{activeFilterCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Sort */}
                        <select
                            value={filters.sort}
                            onChange={e => setFilters(f => ({ ...f, sort: e.target.value as FilterState['sort'] }))}
                            className="bg-white border border-[#B8B3A8] rounded-xl px-3 py-1.5 text-[#2D3748] text-sm cursor-pointer outline-none">
                            <option value="relevant">Ordenar por: Relevância</option>
                            <option value="newest">Mais Recentes</option>
                            <option value="price-asc">Menor Preço</option>
                            <option value="price-desc">Maior Preço</option>
                        </select>
                        {/* View toggle */}
                        <div className="flex gap-1 bg-white border border-[#E2E0DB] rounded-xl p-1">
                            {([['grid', Grid3X3], ['map', Map]] as const).map(([mode, Icon]) => (
                                <button key={mode}
                                    onClick={() => { setViewMode(mode); if (mode === 'map') setSelectedId(null); }}
                                    className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                                        viewMode === mode
                                            ? 'bg-[#0B1928] text-white border-[#0B1928]'
                                            : 'bg-transparent text-[#5A6577] border-transparent hover:bg-[#F0EDE8]'
                                    }`}>
                                    <Icon size={14} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MAP split view */}
                {viewMode === 'map' && (
                    <div className="flex flex-col md:flex-row rounded-2xl overflow-hidden border border-[#E2E0DB]" style={{ height: 'clamp(500px, calc(100vh - 220px), 860px)' }}>
                        {/* Map pane */}
                        <div className="flex-1 min-w-0 relative">
                            {filteredDevelopments.length > 0 ? (
                                <PropertyMap
                                    developments={filteredDevelopments}
                                    height="100%"
                                    lang={lang}
                                    selectedId={selectedId ?? undefined}
                                    onMarkerClick={handleMarkerClick}
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center gap-4 text-[#948F84]">
                                    <span className="text-[40px] opacity-20">🗺️</span>
                                    <p className="m-0 text-sm">Nenhum resultado com esses filtros</p>
                                    <button onClick={() => setFilters(DEFAULT_FILTERS)}
                                        className="px-5 py-2 rounded-xl border border-[#B8B3A8] bg-white text-[#5A6577] text-sm cursor-pointer hover:bg-[#F8F6F2] transition-colors">
                                        Limpar filtros
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* Sidebar */}
                        <div ref={listRef} className="w-full md:w-[380px] flex-shrink-0 overflow-y-auto md:border-l border-t md:border-t-0 border-[#E2E0DB] bg-white">
                            <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-3.5 py-3 border-b border-[#E2E0DB] z-[5]">
                                <p className="m-0 text-[11px] font-bold tracking-[0.1em] uppercase text-[#948F84]">
                                    {filteredDevelopments.length} empreendimento{filteredDevelopments.length !== 1 ? 's' : ''}
                                </p>
                                {selectedId && (
                                    <a href={`/${lang}/imoveis/${filteredDevelopments.find(d => d.id === selectedId)?.slug}`}
                                        className="block mt-1 text-[11px] text-[#0B1928] no-underline font-semibold hover:underline">
                                        Ver detalhes →
                                    </a>
                                )}
                            </div>
                            {filteredDevelopments.map(dev => (
                                <MapSidebarCard key={dev.id} dev={dev} lang={lang}
                                    selected={selectedId === dev.id}
                                    onClick={() => setSelectedId(prev => prev === dev.id ? null : dev.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* GRID view */}
                {viewMode === 'grid' && (
                    <>
                        {filteredDevelopments.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#E2E0DB]">
                                <div className="text-[40px] opacity-20 mb-3">🔍</div>
                                <h3 className="text-xl font-bold text-[#0B1928] mb-2">Nenhum ativo encontrado</h3>
                                <p className="text-[#948F84] mb-5">Tente remover alguns filtros.</p>
                                <button onClick={() => setFilters(DEFAULT_FILTERS)}
                                    className="px-6 py-2.5 rounded-xl border border-[#B8B3A8] bg-white text-[#2D3748] text-sm cursor-pointer hover:bg-[#F8F6F2] transition-colors">
                                    Limpar filtros
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {visibleDevelopments.map(dev => (
                                    <PropertyCard key={dev.id} dev={dev} lang={lang} />
                                ))}
                            </div>
                        )}

                        {/* Load more sentinel + button */}
                        {hasMore && (
                            <div ref={sentinelRef} className="flex justify-center mt-10">
                                <button
                                    onClick={() => setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredDevelopments.length))}
                                    className="flex items-center gap-2 h-11 px-7 rounded-xl border border-[#B8B3A8] bg-white text-[#5A6577] text-sm font-semibold cursor-pointer hover:bg-[#F8F6F2] transition-colors">
                                    <ChevronDown size={16} />
                                    Carregar mais
                                    <span className="text-xs opacity-60">({visibleCount} de {filteredDevelopments.length})</span>
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Bottom CTA */}
                <div className="mt-16 bg-white rounded-2xl border border-[#E2E0DB] p-10 text-center">
                    <h3 className="text-[28px] font-bold text-[#0B1928] mb-2.5" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        Não encontrou o <em className="text-[#5A6577]">imóvel ideal?</em>
                    </h3>
                    <p className="text-[#5A6577] text-[15px] leading-relaxed max-w-[520px] mx-auto mb-6">
                        Nossa curadoria vai além do catálogo. Fale com nossos especialistas para uma prospecção off-market personalizada.
                    </p>
                    <button
                        onClick={() => handleCTAClick('general')}
                        className="inline-flex items-center gap-2 h-[46px] px-7 rounded-xl bg-[#0B1928] text-white text-sm font-bold cursor-pointer hover:bg-[#1a2d42] transition-colors">
                        <MessageCircle size={16} /> Iniciar Consultoria
                    </button>
                </div>
            </div>

            {/* Lead modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <LeadCaptureModal
                        title={ctaTarget === 'off-market' ? 'Acesso Off-Market' : 'Consultoria IMI'}
                        description={ctaTarget === 'off-market'
                            ? 'Receba nossa curadoria exclusiva de imóveis que não estão no catálogo aberto.'
                            : 'Fale com nossos especialistas para um atendimento baseado em dados.'}
                        customInterest={ctaTarget === 'off-market' ? 'Interesse em Imóveis Off-Market' : 'Consultoria Geral - Listagem de Imóveis'}
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={handleSuccess}
                    />
                )}
            </AnimatePresence>
        </main>
    );

    return isMobile ? mobileView : desktopView;
}

// ── Small helper component ────────────────────────────────────────────────────

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="mb-5">
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#948F84] mb-2.5 m-0">{label}</p>
            {children}
        </div>
    );
}
