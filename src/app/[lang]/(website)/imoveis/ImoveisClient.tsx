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

const GOLD = '#3D6FFF';
const SURFACE = '#0F2035';
const BG = '#0B1928';
const TEXT = '#EBE7E0';
const TEXT_MUTED = '#8A9BB0';
const BORDER = 'rgba(200,164,74,0.12)';
const GOLD_BG = 'rgba(200,164,74,0.15)';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const formatPrice = (min: number) => {
    if (min <= 0) return 'Consultar';
    if (min >= 1_000_000) return `R$ ${(min / 1_000_000).toFixed(1).replace('.0', '')}M`;
    return `R$ ${(min / 1_000).toFixed(0)}k`;
};

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
    launch:            { bg: GOLD,      color: '#0B1928' },
    ready:             { bg: '#6BB87B', color: '#0B1928' },
    under_construction:{ bg: '#F59E0B', color: '#0B1928' },
};
const BADGE_LABELS: Record<string, string> = {
    launch: 'Lançamento', ready: 'Pronta Entrega', under_construction: 'Em Obra',
};

const PropertyMap = dynamic(() => import('@/components/maps/PropertyMap'), {
    ssr: false,
    loading: () => (
        <div style={{ height: '100%', minHeight: 400, background: SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            style={{
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 20,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Image */}
            <a href={`/${lang}/imoveis/${dev.slug}`} style={{ display: 'block', position: 'relative', aspectRatio: '16/9', background: '#071422', flexShrink: 0 }}>
                {dev.images.main ? (
                    <img src={dev.images.main} alt={dev.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, opacity: 0.15 }}>🏢</div>
                )}
                {/* Gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 40%, rgba(11,25,40,0.65) 100%)' }} />

                {/* Badge top-left */}
                <span style={{
                    position: 'absolute', top: 12, left: 12,
                    background: badge.bg, color: badge.color,
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                    padding: '3px 10px', borderRadius: 6, textTransform: 'uppercase',
                }}>
                    {label}
                </span>

                {/* Heart + Share top-right */}
                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                    {[Heart, Share2].map((Icon, i) => (
                        <button key={i} style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'rgba(11,25,40,0.6)', backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#fff',
                        }}>
                            <Icon size={14} />
                        </button>
                    ))}
                </div>

                {/* Price bottom-left */}
                <div style={{
                    position: 'absolute', bottom: 12, left: 12,
                    background: 'rgba(11,25,40,0.75)', backdropFilter: 'blur(8px)',
                    borderRadius: 6, padding: '4px 12px',
                    border: `1px solid rgba(200,164,74,0.3)`,
                }}>
                    <span style={{ color: GOLD, fontSize: 15, fontWeight: 700 }}>{price}</span>
                </div>
            </a>

            {/* Body */}
            <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {/* Name + location */}
                <div>
                    <a href={`/${lang}/imoveis/${dev.slug}`} style={{ display: 'block', color: TEXT, fontSize: 15, fontWeight: 700, lineHeight: 1.3, textDecoration: 'none', fontFamily: "'Playfair Display', Georgia, serif" }}>
                        {dev.name}
                    </a>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: TEXT_MUTED, fontSize: 12 }}>
                        <MapPin size={11} style={{ flexShrink: 0 }} />
                        <span>{dev.location.neighborhood ? `${dev.location.neighborhood}, ` : ''}{dev.location.city}</span>
                        {area && <span style={{ marginLeft: 4, color: TEXT_MUTED }}>· {area}</span>}
                    </div>
                </div>

                {/* Specs row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: TEXT_MUTED, fontSize: 12 }}>
                    {dev.specs.bedroomsRange && dev.specs.bedroomsRange !== '—' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Bed size={12} style={{ color: GOLD, flexShrink: 0 }} />
                            {dev.specs.bedroomsRange} qtos
                        </span>
                    )}
                    {dev.specs.bathroomsRange && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Bath size={12} style={{ color: GOLD, flexShrink: 0 }} />
                            {dev.specs.bathroomsRange} ban
                        </span>
                    )}
                    {dev.specs.parkingRange && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Car size={12} style={{ color: GOLD, flexShrink: 0 }} />
                            {dev.specs.parkingRange} vagas
                        </span>
                    )}
                </div>

                {/* CTA */}
                <a
                    href={`/${lang}/imoveis/${dev.slug}`}
                    style={{
                        marginTop: 4,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        height: 38, borderRadius: 6,
                        border: `1.5px solid ${GOLD}`,
                        color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                        textDecoration: 'none', transition: 'all 0.2s',
                        background: 'transparent',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = GOLD_BG; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
                >
                    Ver Imóvel
                </a>
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
            style={{
                display: 'flex', gap: 12, padding: '12px 14px',
                borderBottom: `1px solid rgba(255,255,255,0.05)`,
                borderLeft: selected ? `3px solid ${GOLD}` : '3px solid transparent',
                background: selected ? 'rgba(200,164,74,0.07)' : 'transparent',
                cursor: 'pointer', transition: 'all 0.15s',
            }}
        >
            <div style={{ flexShrink: 0, width: 72, height: 60, borderRadius: 10, overflow: 'hidden', background: '#071422' }}>
                {dev.images.main
                    ? <img src={dev.images.main} alt={dev.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>🏢</div>
                }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                    <p style={{ color: TEXT, fontSize: 12, fontWeight: 700, lineHeight: 1.3, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                        {dev.name}
                    </p>
                    <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: badge.bg, color: badge.color, textTransform: 'uppercase' }}>
                        {label}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: TEXT_MUTED, fontSize: 10, marginBottom: 5 }}>
                    <MapPin size={9} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dev.location.neighborhood || dev.location.city}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: GOLD, fontSize: 12, fontWeight: 700 }}>{formatPrice(dev.priceRange.min)}</span>
                    {dev.specs.bedroomsRange && dev.specs.bedroomsRange !== '—' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: TEXT_MUTED, fontSize: 10 }}>
                            <Bed size={9} />{dev.specs.bedroomsRange}
                        </span>
                    )}
                    {dev.specs.areaRange && dev.specs.areaRange !== '—' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: TEXT_MUTED, fontSize: 10 }}>
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
            <main style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: SURFACE, borderRadius: 24, padding: 48, border: `1px solid ${BORDER}`, maxWidth: 480, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 20 }}>🏗️</div>
                    <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 700, color: TEXT, marginBottom: 12 }}>
                        Portfólio em <em style={{ color: GOLD }}>Curadoria</em>
                    </h1>
                    <p style={{ color: TEXT_MUTED, fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
                        Estamos selecionando os melhores ativos do mercado para este catálogo exclusivo.
                    </p>
                    <button
                        onClick={() => handleCTAClick('off-market')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 24px', borderRadius: 6, background: GOLD_BG, border: `1.5px solid ${GOLD}`, color: GOLD, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
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
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 2px', scrollbarWidth: 'none' }}>
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
                    style={{
                        flexShrink: 0, height: 34, padding: '0 14px', borderRadius: 6,
                        background: chip.active ? GOLD : 'transparent',
                        border: `1.5px solid ${chip.active ? GOLD : 'rgba(200,164,74,0.3)'}`,
                        color: chip.active ? '#0B1928' : TEXT_MUTED,
                        fontSize: 13, fontWeight: chip.active ? 700 : 500, cursor: 'pointer',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {chip.label}
                </button>
            ))}
        </div>
    );

    // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────
    const mobileView = (
        <main style={{ background: BG, minHeight: '100vh', paddingTop: 64, paddingBottom: 32 }}>

            {/* Search bar */}
            <div style={{ padding: '16px 16px 12px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: SURFACE, border: `1.5px solid ${BORDER}`,
                    borderRadius: 16, padding: '0 14px', height: 48,
                }}>
                    <Search size={16} style={{ color: TEXT_MUTED, flexShrink: 0 }} />
                    <input
                        type="text"
                        placeholder={availableLocations[0] ? `${availableLocations[0]}…` : 'Buscar imóveis…'}
                        value={filters.search}
                        onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                        style={{
                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                            color: TEXT, fontSize: 14,
                        }}
                    />
                    <button
                        onClick={() => setShowMobileFilters(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, color: GOLD, fontSize: 13, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                    >
                        Filtros <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* Chip row */}
            {filterChipsMobile}

            {/* Results toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px' }}>
                <button
                    onClick={() => setViewMode(v => v === 'map' ? 'grid' : 'map')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        height: 34, padding: '0 14px', borderRadius: 6,
                        background: viewMode === 'map' ? GOLD_BG : 'transparent',
                        border: `1.5px solid ${viewMode === 'map' ? GOLD : 'rgba(200,164,74,0.25)'}`,
                        color: viewMode === 'map' ? GOLD : TEXT_MUTED, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                >
                    <MapPin size={13} /> Mapa
                </button>
                <button
                    onClick={() => setFilters(f => ({ ...f, sort: f.sort === 'newest' ? 'relevant' : 'newest' }))}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 12, cursor: 'pointer' }}
                >
                    Ordenar: {filters.sort === 'newest' ? 'Mais Recentes' : 'Relevantes'}
                    <ChevronDown size={13} />
                </button>
            </div>

            {/* Count */}
            <div style={{ padding: '0 16px 12px' }}>
                <span style={{ color: TEXT, fontSize: 14 }}>
                    <strong style={{ color: TEXT }}>{filteredDevelopments.length}</strong> imóveis encontrados
                </span>
            </div>

            {/* Map view */}
            {viewMode === 'map' ? (
                <div style={{ margin: '0 16px 20px', borderRadius: 16, overflow: 'hidden', border: `1px solid ${BORDER}`, height: 420 }}>
                    <PropertyMap
                        developments={filteredDevelopments}
                        height="420px"
                        lang={lang}
                        darkMode
                        selectedId={selectedId ?? undefined}
                        onMarkerClick={handleMarkerClick}
                    />
                </div>
            ) : null}

            {/* Card list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 16px' }}>
                {visibleDevelopments.length > 0 ? visibleDevelopments.map(dev => (
                    <PropertyCard key={dev.id} dev={dev} lang={lang} />
                )) : (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: TEXT_MUTED }}>
                        <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>🔍</div>
                        <p style={{ marginBottom: 16 }}>Nenhum imóvel encontrado</p>
                        <button onClick={() => setFilters(DEFAULT_FILTERS)}
                            style={{ padding: '8px 20px', borderRadius: 6, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, fontSize: 13, cursor: 'pointer' }}>
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
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200 }}
                        onClick={() => setShowMobileFilters(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                background: SURFACE, borderRadius: '8px 8px 0 0',
                                padding: '20px 20px 36px',
                                maxHeight: '80vh', overflowY: 'auto',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                <h3 style={{ color: TEXT, fontSize: 17, fontWeight: 700, margin: 0 }}>
                                    <SlidersHorizontal size={16} style={{ display: 'inline', marginRight: 8, color: GOLD }} />
                                    Filtros
                                </h3>
                                <button onClick={() => setShowMobileFilters(false)}
                                    style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', color: TEXT_MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                                    style={{ width: '100%', background: BG, border: `1.5px solid ${BORDER}`, borderRadius: 6, padding: '10px 14px', color: TEXT, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                                />
                            </FilterSection>

                            {/* Quartos */}
                            <FilterSection label="Quartos">
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[null, 1, 2, 3, 4].map(n => (
                                        <button key={n ?? 'all'} onClick={() => setFilters(f => ({ ...f, bedrooms: n }))}
                                            style={{
                                                flex: 1, height: 36, borderRadius: 6,
                                                background: filters.bedrooms === n ? GOLD : BG,
                                                border: `1.5px solid ${filters.bedrooms === n ? GOLD : BORDER}`,
                                                color: filters.bedrooms === n ? '#0B1928' : TEXT_MUTED,
                                                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                            }}>
                                            {n === null ? 'Todos' : `${n}+`}
                                        </button>
                                    ))}
                                </div>
                            </FilterSection>

                            {/* Tipo */}
                            <FilterSection label="Tipo">
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {['Apto', 'Casa', 'Flat', 'Cobertura', 'Garden'].map(t => {
                                        const val = t.toLowerCase();
                                        const active = filters.type.includes(val);
                                        return (
                                            <button key={t} onClick={() => setFilters(f => ({ ...f, type: active ? f.type.filter(x => x !== val) : [...f.type, val] }))}
                                                style={{
                                                    height: 34, padding: '0 14px', borderRadius: 6,
                                                    background: active ? GOLD_BG : BG,
                                                    border: `1.5px solid ${active ? GOLD : BORDER}`,
                                                    color: active ? GOLD : TEXT_MUTED,
                                                    fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer',
                                                }}>
                                                {t}
                                            </button>
                                        );
                                    })}
                                </div>
                            </FilterSection>

                            {/* Localização */}
                            <FilterSection label="Localização">
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <button onClick={() => setFilters(f => ({ ...f, location: null, neighborhood: null }))}
                                        style={{ height: 34, padding: '0 14px', borderRadius: 6, background: !filters.location ? GOLD_BG : BG, border: `1.5px solid ${!filters.location ? GOLD : BORDER}`, color: !filters.location ? GOLD : TEXT_MUTED, fontSize: 13, cursor: 'pointer' }}>
                                        Todas
                                    </button>
                                    {availableLocations.map(loc => {
                                        const active = filters.location === loc;
                                        return (
                                            <button key={loc} onClick={() => setFilters(f => ({ ...f, location: active ? null : loc, neighborhood: null }))}
                                                style={{ height: 34, padding: '0 14px', borderRadius: 6, background: active ? GOLD_BG : BG, border: `1.5px solid ${active ? GOLD : BORDER}`, color: active ? GOLD : TEXT_MUTED, fontSize: 13, cursor: 'pointer' }}>
                                                {loc}
                                            </button>
                                        );
                                    })}
                                </div>
                            </FilterSection>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                <button onClick={() => { setFilters(DEFAULT_FILTERS); setShowMobileFilters(false); }}
                                    style={{ flex: 1, height: 44, borderRadius: 6, border: `1.5px solid ${BORDER}`, background: BG, color: TEXT_MUTED, fontSize: 14, cursor: 'pointer' }}>
                                    Limpar
                                </button>
                                <button onClick={() => setShowMobileFilters(false)}
                                    style={{ flex: 2, height: 44, borderRadius: 6, border: 'none', background: GOLD, color: '#0B1928', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
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
        <main style={{ background: BG, minHeight: '100vh', paddingTop: 80, paddingBottom: 60 }}>
            <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>

                {/* Top search bar */}
                <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: SURFACE, border: `1.5px solid ${BORDER}`, borderRadius: 16, padding: '0 16px', height: 52, maxWidth: 720 }}>
                        <Search size={18} style={{ color: TEXT_MUTED, flexShrink: 0 }} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, bairro, cidade ou tipo…"
                            value={filters.search}
                            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: TEXT, fontSize: 14 }}
                        />
                        {filters.search && (
                            <button onClick={() => setFilters(f => ({ ...f, search: '' }))}
                                style={{ background: 'none', border: 'none', color: TEXT_MUTED, cursor: 'pointer', display: 'flex', padding: 4 }}>
                                <X size={15} />
                            </button>
                        )}
                        <button
                            onClick={() => {/* already filtering live */ }}
                            style={{ height: 36, padding: '0 18px', borderRadius: 6, background: GOLD, border: 'none', color: '#0B1928', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                            Buscar
                        </button>
                    </div>
                </div>

                {/* Filter chip row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                    {[
                        { label: 'Tipo', active: filters.type.length > 0 },
                        { label: 'Preço', active: filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000 },
                        { label: filters.bedrooms ? `${filters.bedrooms}+ Quartos` : 'Quartos', active: !!filters.bedrooms },
                        { label: 'Banheiros', active: false },
                        { label: 'Vagas', active: false },
                        { label: 'Área', active: filters.areaRange[0] > 0 || filters.areaRange[1] < 500 },
                    ].map(chip => (
                        <button key={chip.label}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                height: 36, padding: '0 14px', borderRadius: 6,
                                background: chip.active ? GOLD_BG : 'transparent',
                                border: `1.5px solid ${chip.active ? GOLD : 'rgba(200,164,74,0.3)'}`,
                                color: chip.active ? GOLD : TEXT_MUTED,
                                fontSize: 13, fontWeight: chip.active ? 700 : 500, cursor: 'pointer',
                            }}>
                            {chip.label} <ChevronDown size={13} />
                        </button>
                    ))}
                    {activeFilterCount > 0 && (
                        <button onClick={() => setFilters(DEFAULT_FILTERS)}
                            style={{ height: 36, padding: '0 14px', borderRadius: 6, border: 'none', background: 'none', color: TEXT_MUTED, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
                            Limpar filtros
                        </button>
                    )}
                </div>

                {/* Results toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: TEXT, fontSize: 15 }}>
                            <strong>{filteredDevelopments.length}</strong> imóveis encontrados
                        </span>
                        {activeFilterCount > 0 && (
                            <span style={{ fontSize: 12, color: GOLD, background: GOLD_BG, border: `1px solid rgba(200,164,74,0.3)`, borderRadius: 6, padding: '2px 10px' }}>
                                {activeFilterCount} filtro{activeFilterCount !== 1 ? 's' : ''} ativo{activeFilterCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Sort */}
                        <select
                            value={filters.sort}
                            onChange={e => setFilters(f => ({ ...f, sort: e.target.value as FilterState['sort'] }))}
                            style={{ background: SURFACE, border: `1.5px solid ${BORDER}`, borderRadius: 6, padding: '6px 12px', color: TEXT_MUTED, fontSize: 13, cursor: 'pointer', outline: 'none' }}>
                            <option value="relevant">Ordenar por: Relevância</option>
                            <option value="newest">Mais Recentes</option>
                            <option value="price-asc">Menor Preço</option>
                            <option value="price-desc">Maior Preço</option>
                        </select>
                        {/* View toggle */}
                        <div style={{ display: 'flex', gap: 4, background: SURFACE, border: `1.5px solid ${BORDER}`, borderRadius: 6, padding: 4 }}>
                            {([['grid', Grid3X3], ['map', Map]] as const).map(([mode, Icon]) => (
                                <button key={mode}
                                    onClick={() => { setViewMode(mode); if (mode === 'map') setSelectedId(null); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        height: 32, padding: '0 12px', borderRadius: 8,
                                        background: viewMode === mode ? GOLD_BG : 'transparent',
                                        border: viewMode === mode ? `1.5px solid ${GOLD}` : '1.5px solid transparent',
                                        color: viewMode === mode ? GOLD : TEXT_MUTED,
                                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                    }}>
                                    <Icon size={14} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MAP split view */}
                {viewMode === 'map' && (
                    <div style={{ display: 'flex', gap: 0, height: 'clamp(500px, calc(100vh - 220px), 860px)', borderRadius: 20, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                        {/* Map pane */}
                        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                            {filteredDevelopments.length > 0 ? (
                                <PropertyMap
                                    developments={filteredDevelopments}
                                    height="100%"
                                    lang={lang}
                                    darkMode
                                    selectedId={selectedId ?? undefined}
                                    onMarkerClick={handleMarkerClick}
                                />
                            ) : (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: TEXT_MUTED }}>
                                    <span style={{ fontSize: 40, opacity: 0.2 }}>🗺️</span>
                                    <p style={{ margin: 0, fontSize: 14 }}>Nenhum resultado com esses filtros</p>
                                    <button onClick={() => setFilters(DEFAULT_FILTERS)}
                                        style={{ padding: '8px 20px', borderRadius: 6, border: `1.5px solid ${BORDER}`, background: 'transparent', color: TEXT_MUTED, fontSize: 13, cursor: 'pointer' }}>
                                        Limpar filtros
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* Sidebar */}
                        <div ref={listRef} style={{ width: 380, flexShrink: 0, overflowY: 'auto', borderLeft: `1px solid ${BORDER}`, background: SURFACE }}>
                            <div style={{ position: 'sticky', top: 0, background: 'rgba(15,32,53,0.96)', backdropFilter: 'blur(8px)', padding: '12px 14px', borderBottom: `1px solid ${BORDER}`, zIndex: 5 }}>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED }}>
                                    {filteredDevelopments.length} empreendimento{filteredDevelopments.length !== 1 ? 's' : ''}
                                </p>
                                {selectedId && (
                                    <a href={`/${lang}/imoveis/${filteredDevelopments.find(d => d.id === selectedId)?.slug}`}
                                        style={{ display: 'block', marginTop: 4, fontSize: 11, color: GOLD, textDecoration: 'none', fontWeight: 600 }}>
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
                            <div style={{ textAlign: 'center', padding: '80px 0', background: SURFACE, borderRadius: 20, border: `1px dashed rgba(200,164,74,0.2)` }}>
                                <div style={{ fontSize: 40, opacity: 0.2, marginBottom: 12 }}>🔍</div>
                                <h3 style={{ color: TEXT, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Nenhum ativo encontrado</h3>
                                <p style={{ color: TEXT_MUTED, marginBottom: 20 }}>Tente remover alguns filtros.</p>
                                <button onClick={() => setFilters(DEFAULT_FILTERS)}
                                    style={{ padding: '10px 24px', borderRadius: 6, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, fontSize: 14, cursor: 'pointer' }}>
                                    Limpar filtros
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                                {visibleDevelopments.map(dev => (
                                    <PropertyCard key={dev.id} dev={dev} lang={lang} />
                                ))}
                            </div>
                        )}

                        {/* Load more sentinel + button */}
                        {hasMore && (
                            <div ref={sentinelRef} style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
                                <button
                                    onClick={() => setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredDevelopments.length))}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        height: 44, padding: '0 28px', borderRadius: 6,
                                        border: `1.5px solid ${BORDER}`, background: 'transparent',
                                        color: TEXT_MUTED, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                    }}>
                                    <ChevronDown size={16} />
                                    Carregar mais
                                    <span style={{ fontSize: 12, opacity: 0.6 }}>({visibleCount} de {filteredDevelopments.length})</span>
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Bottom CTA */}
                <div style={{ marginTop: 64, background: SURFACE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '40px 40px', textAlign: 'center' }}>
                    <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: TEXT, marginBottom: 10 }}>
                        Não encontrou o <em style={{ color: GOLD }}>imóvel ideal?</em>
                    </h3>
                    <p style={{ color: TEXT_MUTED, fontSize: 15, lineHeight: 1.7, maxWidth: 520, margin: '0 auto 24px' }}>
                        Nossa curadoria vai além do catálogo. Fale com nossos especialistas para uma prospecção off-market personalizada.
                    </p>
                    <button
                        onClick={() => handleCTAClick('general')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 46, padding: '0 28px', borderRadius: 6, background: GOLD_BG, border: `1.5px solid ${GOLD}`, color: GOLD, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
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
        <div style={{ marginBottom: 20 }}>
            <p style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, margin: '0 0 10px' }}>{label}</p>
            {children}
        </div>
    );
}
