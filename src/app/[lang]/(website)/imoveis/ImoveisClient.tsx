'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Development } from './types/development';
import { FilterState } from './components/AdvancedFilter';
import LeadCaptureModal from './components/LeadCaptureModal';
import {
    Search, MapPin, Heart, Share2, Bed, Bath, Car, Maximize2,
    ChevronDown, ChevronRight, SlidersHorizontal, MessageCircle, X,
    Map, Grid3X3, Home, DollarSign, Ruler, ArrowUpRight, Sparkles,
    Eye, TrendingUp, Building2, Phone, CheckCircle, Star,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { calcIMIScore, getScoreColor, getScoreLabel } from '@/features/properties/services/score.service';
import type { IMIProperty } from '@/features/properties/types';
import dynamic from 'next/dynamic';
import Image from 'next/image';

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
    listingCategory: 'all',
};

const CATEGORY_TABS: { value: FilterState['listingCategory']; label: string; icon: string }[] = [
    { value: 'all', label: 'Todos', icon: '' },
    { value: 'comprar', label: 'Comprar', icon: '' },
    { value: 'aluguel', label: 'Alugar', icon: '' },
    { value: 'temporada', label: 'Temporada', icon: '' },
    { value: 'short_stay', label: 'Short Stay', icon: '' },
];

/* ── Brand Kit Light-theme tokens (from imi-UNIFIED-MASTER) ──────── */
const PAGE_BG = '#F0EDE5';     // --Lr
const CARD_BG = '#FFFFFF';     // --Lc
const NAVY = '#0B1928';        // --La
const TEXT_PRIMARY = '#0C1220'; // --Lt1
const TEXT_BODY = '#2D3748';   // --Lt2
const TEXT_MUTED = '#948F84';  // --Lb2
const TEXT_SUB = '#5A6577';    // --Lt3
const BORDER = '#B8B3A8';      // --Lb (2px solid)
const BORDER_LIGHT = '#D9D5CB'; // --Lf
const R = { btn: 6, input: 6, card: 10, panel: 14 }; // brand kit radii

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

const CATEGORY_BADGE: Record<string, { bg: string; color: string; label: string }> = {
    aluguel:    { bg: '#6366F1', color: '#fff', label: 'Aluguel' },
    temporada:  { bg: '#F97316', color: '#fff', label: 'Temporada' },
    short_stay: { bg: '#EC4899', color: '#fff', label: 'Short Stay' },
};

const PropertyMap = dynamic(() => import('@/components/maps/PropertyMap'), {
    ssr: false,
    loading: () => (
        <div style={{ height: '100%', minHeight: 400, background: '#F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: TEXT_MUTED, fontSize: 14 }}>Carregando mapa...</span>
        </div>
    ),
});

// ── Property Card — Premium Proptech Design ──────────────────────────────────

function PropertyCard({ dev, lang, index = 0 }: { dev: Development; lang: string; index?: number }) {
    const isRental = dev.listingCategory && dev.listingCategory !== 'comprar';
    const catBadge = isRental ? CATEGORY_BADGE[dev.listingCategory] : null;
    const badge = catBadge || BADGE_STYLES[dev.status] || BADGE_STYLES.launch;
    const label = catBadge?.label || BADGE_LABELS[dev.status] || dev.status;
    const price = isRental
        ? (dev.dailyRate ? formatCurrency(dev.dailyRate) : dev.monthlyRate ? formatCurrency(dev.monthlyRate) : 'Consultar')
        : formatPrice(dev.priceRange.min);
    const priceLabel = isRental
        ? (dev.dailyRate ? '/dia' : dev.monthlyRate ? '/mês' : '')
        : '';
    const detailHref = isRental
        ? `/${lang}/imoveis/rental/${dev.rentalId}`
        : `/${lang}/imoveis/${dev.slug}`;
    const typeLabel = dev.tags.includes('casas') ? 'Casa' : 'Apartamento';
    const area = dev.specs.areaRange !== '—' ? dev.specs.areaRange : null;
    const locationStr = [dev.location.neighborhood, dev.location.city].filter(Boolean).join(', ');
    const [isHovered, setIsHovered] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);

    const handleShare = (e: import('react').MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `${window.location.origin}/${lang}/imoveis/${dev.slug}`;
        if (navigator.share) {
            navigator.share({ title: dev.name, text: dev.shortDescription || dev.name, url }).catch(() => {});
        } else {
            navigator.clipboard.writeText(url).then(() => {
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2000);
            });
        }
    };

    // IMI Score
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
    const imiScore = calcIMIScore(imiProp);
    const scoreColor = getScoreColor(imiScore);

    return (
        <motion.article
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.3, delay: (index % 6) * 0.04, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative bg-white overflow-hidden flex flex-col cursor-pointer"
            style={{
                borderRadius: R.card,
                boxShadow: isHovered
                    ? '0 20px 60px rgba(11,25,40,0.15), 0 8px 24px rgba(11,25,40,0.08)'
                    : '0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
                transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
                transition: 'all 0.35s cubic-bezier(.16,1,.3,1)',
                border: `2px solid ${isHovered ? TEXT_MUTED : BORDER}`,
            }}
        >
            {/* Image Container */}
            <a href={detailHref} className="block relative aspect-[16/10] bg-[#F0EDE8] flex-shrink-0 overflow-hidden">
                {dev.images.main ? (
                    <Image
                        src={dev.images.main}
                        alt={dev.name}
                        fill
                        loading="lazy"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                        style={{
                            transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                            transition: 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <Building2 size={32} className="text-[#B8B3A8] opacity-30" strokeWidth={1} />
                        <span className="text-[#B8B3A8] text-[9px] font-bold tracking-[0.15em] uppercase">{dev.name}</span>
                    </div>
                )}

                {/* Gradient overlay — always visible, stronger on hover */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: isHovered
                            ? 'linear-gradient(180deg, rgba(11,25,40,0.1) 0%, rgba(11,25,40,0.0) 40%, rgba(11,25,40,0.5) 100%)'
                            : 'linear-gradient(180deg, rgba(11,25,40,0.05) 0%, rgba(11,25,40,0.0) 50%, rgba(11,25,40,0.3) 100%)',
                        transition: 'background 0.4s ease',
                    }}
                />

                {/* Status badge — brand kit Lb-navy style */}
                <div className="absolute top-3 left-3 z-[2]">
                    <span
                        className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.05em] uppercase px-3 py-1.5"
                        style={{
                            borderRadius: R.btn,
                            background: badge.bg === NAVY ? 'rgba(11,25,40,0.85)' : badge.bg,
                            color: badge.color,
                            backdropFilter: 'blur(12px)',
                            border: '2px solid rgba(255,255,255,0.18)',
                        }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                        {label}
                    </span>
                </div>

                {/* IMI Score — brand kit badge */}
                <div className="absolute bottom-3 left-3 z-[2]">
                    <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1"
                        style={{
                            borderRadius: R.btn,
                            background: 'rgba(11,25,40,0.80)',
                            backdropFilter: 'blur(12px)',
                            border: '2px solid rgba(200,164,74,0.20)',
                        }}
                    >
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: scoreColor, flexShrink: 0, boxShadow: `0 0 6px ${scoreColor}` }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", letterSpacing: '-0.02em' }}>{imiScore}</span>
                        <span style={{ fontSize: 8, fontWeight: 700, color: '#C8A44A', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>IMI</span>
                    </span>
                </div>

                {/* Heart + Share — glass circles */}
                <div
                    className="absolute top-3 right-3 flex gap-1.5 z-[2]"
                    style={{
                        opacity: isHovered ? 1 : 0.7,
                        transform: isHovered ? 'translateY(0)' : 'translateY(-4px)',
                        transition: 'all 0.3s ease',
                    }}
                >
                    <button
                        onClick={e => e.preventDefault()}
                        aria-label="Favoritar"
                        className="w-[44px] h-[44px] sm:w-[34px] sm:h-[34px] rounded-full flex items-center justify-center cursor-pointer border-none active:scale-[0.92]"
                        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', color: '#5A6577', transition: 'all 0.2s ease', WebkitTapHighlightColor: 'transparent' }}
                    >
                        <Heart size={15} />
                    </button>
                    <button
                        onClick={handleShare}
                        aria-label={shareCopied ? 'Link copiado!' : 'Compartilhar'}
                        title={shareCopied ? 'Link copiado!' : 'Compartilhar'}
                        className="w-[44px] h-[44px] sm:w-[34px] sm:h-[34px] rounded-full flex items-center justify-center cursor-pointer border-none active:scale-[0.92]"
                        style={{ background: shareCopied ? '#C8A44A' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', color: shareCopied ? '#fff' : '#5A6577', transition: 'all 0.2s ease', WebkitTapHighlightColor: 'transparent' }}
                    >
                        <Share2 size={15} />
                    </button>
                </div>

                {/* Property type chip — bottom right */}
                <div
                    className="absolute bottom-3 right-3 z-[2]"
                    style={{
                        opacity: isHovered ? 1 : 0,
                        transform: isHovered ? 'translateY(0)' : 'translateY(4px)',
                        transition: 'all 0.3s ease 0.05s',
                    }}
                >
                    <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-white/80 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/10">
                        {typeLabel} {area ? `· ${area}` : ''}
                    </span>
                </div>
            </a>

            {/* Content Body */}
            <div className="px-5 pt-4 pb-5 flex flex-col gap-1.5 flex-1">
                {/* Name */}
                <a href={detailHref} className="block text-[#0B1928] no-underline group-hover:text-[#1a3a5c] transition-colors">
                    <h3 className="text-[16px] font-bold leading-snug m-0" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        {dev.name}
                    </h3>
                </a>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-[#5A6577] text-[12px]">
                    <MapPin size={11} className="flex-shrink-0 text-[#948F84]" />
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">{locationStr}</span>
                </div>

                {/* Specs chips — brand kit Lb-navy style */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {dev.specs.bedroomsRange && dev.specs.bedroomsRange !== '—' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1" style={{ color: TEXT_PRIMARY, background: PAGE_BG, borderRadius: R.btn, border: `2px solid ${BORDER_LIGHT}` }}>
                            <Bed size={11} style={{ color: TEXT_MUTED }} />
                            {dev.specs.bedroomsRange}
                        </span>
                    )}
                    {dev.specs.bathroomsRange && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1" style={{ color: TEXT_PRIMARY, background: PAGE_BG, borderRadius: R.btn, border: `2px solid ${BORDER_LIGHT}` }}>
                            <Bath size={11} style={{ color: TEXT_MUTED }} />
                            {dev.specs.bathroomsRange}
                        </span>
                    )}
                    {dev.specs.parkingRange && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1" style={{ color: TEXT_PRIMARY, background: PAGE_BG, borderRadius: R.btn, border: `2px solid ${BORDER_LIGHT}` }}>
                            <Car size={11} style={{ color: TEXT_MUTED }} />
                            {dev.specs.parkingRange}
                        </span>
                    )}
                    {area && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1" style={{ color: TEXT_PRIMARY, background: PAGE_BG, borderRadius: R.btn, border: `2px solid ${BORDER_LIGHT}` }}>
                            <Ruler size={11} style={{ color: TEXT_MUTED }} />
                            {area}
                        </span>
                    )}
                </div>

                {/* Price + CTA */}
                <div className="pt-3.5 mt-auto flex items-center justify-between" style={{ borderTop: `2px solid ${BORDER_LIGHT}` }}>
                    <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.1em] m-0 mb-0.5" style={{ color: TEXT_MUTED }}>
                            {isRental ? '' : (dev.priceRange.min > 0 ? 'A partir de' : '')}
                        </p>
                        <span className="text-lg font-bold" style={{ color: TEXT_PRIMARY, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em' }}>
                            {price}
                            {priceLabel && <span className="text-xs font-normal ml-0.5" style={{ color: TEXT_MUTED }}>{priceLabel}</span>}
                        </span>
                    </div>
                    <a
                        href={detailHref}
                        className="inline-flex items-center gap-1.5 h-11 px-5 text-[10px] font-bold tracking-[0.1em] uppercase no-underline transition-all duration-300 active:scale-[0.97]"
                        style={{
                            borderRadius: R.btn,
                            background: isHovered ? NAVY : CARD_BG,
                            color: isHovered ? '#fff' : NAVY,
                            border: `2px solid ${isHovered ? NAVY : BORDER}`,
                            boxShadow: isHovered ? '0 2px 8px rgba(11,25,40,0.2)' : 'none',
                        }}
                    >
                        Ver Imóvel <ArrowUpRight size={12} style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.3s' }} />
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
                borderBottom: `2px solid ${BORDER_LIGHT}`,
                borderLeft: selected ? `3px solid ${NAVY}` : '3px solid transparent',
                background: selected ? PAGE_BG : 'transparent',
            }}
        >
            <div className="flex-shrink-0 w-[72px] h-[60px] overflow-hidden relative" style={{ borderRadius: R.btn, background: PAGE_BG }}>
                {dev.images.main
                    ? <Image src={dev.images.main} alt={dev.name} fill className="object-cover" sizes="72px" />
                    : <div className="w-full h-full flex items-center justify-center opacity-20">🏢</div>
                }
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="text-[#0B1928] text-xs font-bold leading-tight m-0 overflow-hidden line-clamp-1">
                        {dev.name}
                    </p>
                    <span className="flex-shrink-0 text-[9px] font-semibold px-[7px] py-0.5 uppercase" style={{ borderRadius: R.btn, background: badge.bg, color: badge.color }}>
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

// ── Broker Card — appears on all viewports per guide P0 ────────────────────────

function BrokerCard({ compact = false }: { compact?: boolean }) {
    return (
        <div
            className={`flex ${compact ? 'flex-row items-center gap-3' : 'flex-col gap-4'}`}
            style={{
                borderRadius: R.card,
                border: `2px solid ${BORDER}`,
                background: compact ? CARD_BG : `linear-gradient(135deg, ${CARD_BG} 0%, ${PAGE_BG} 100%)`,
                padding: compact ? 14 : 20,
            }}
        >
            {/* Avatar */}
            <div
                className="flex-shrink-0 flex items-center justify-center font-bold"
                style={{
                    width: compact ? 48 : 64, height: compact ? 48 : 64,
                    borderRadius: compact ? 14 : 18,
                    background: 'linear-gradient(135deg, #C8A44A 0%, #A08830 100%)',
                    color: '#fff', fontSize: compact ? 18 : 22,
                }}
            >
                IM
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`font-semibold text-[${TEXT_PRIMARY}] ${compact ? 'text-sm' : 'text-base'}`}>Iule Miranda</span>
                    <CheckCircle size={14} className="text-[#C8A44A]" />
                </div>
                <div className="text-[11px] text-[#948F84]">CRECI 12345 · Consultora de investimentos</div>
                {!compact && (
                    <div className="flex items-center gap-1 mt-1.5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} size={12} className={i <= 4 ? 'text-[#C8A44A] fill-[#C8A44A]' : 'text-[#E2E0DB]'} />
                        ))}
                        <span className="text-[11px] text-[#948F84] ml-1">4.8 (127)</span>
                    </div>
                )}
            </div>
            {/* Actions */}
            {compact ? (
                <div className="flex gap-2">
                    <a href="https://wa.me/5581997230455" target="_blank" rel="noopener noreferrer"
                        className="w-[38px] h-[38px] flex items-center justify-center border-none cursor-pointer"
                        style={{ borderRadius: R.btn, background: '#25D366', color: '#fff' }}>
                        <MessageCircle size={16} />
                    </a>
                    <a href="tel:+5581997230455"
                        className="w-[38px] h-[38px] flex items-center justify-center cursor-pointer"
                        style={{ borderRadius: R.btn, border: `2px solid ${BORDER}`, background: CARD_BG, color: TEXT_SUB }}>
                        <Phone size={16} />
                    </a>
                </div>
            ) : (
                <div className="flex gap-2">
                    <a href="https://wa.me/5581997230455" target="_blank" rel="noopener noreferrer"
                        className="flex-1 h-11 flex items-center justify-center gap-2 text-white text-sm font-semibold no-underline cursor-pointer"
                        style={{ borderRadius: R.btn, background: '#25D366' }}>
                        <MessageCircle size={15} /> WhatsApp
                    </a>
                    <a href="tel:+5581997230455"
                        className="flex-1 h-11 flex items-center justify-center gap-2 text-sm font-semibold no-underline cursor-pointer"
                        style={{ borderRadius: R.btn, border: `2px solid ${BORDER}`, background: CARD_BG, color: TEXT_SUB }}>
                        <Phone size={15} /> Ligar
                    </a>
                </div>
            )}
        </div>
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
            listingCategory: (params.get('categoria') as FilterState['listingCategory']) || prev.listingCategory,
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
        if (filters.listingCategory !== 'all') params.set('categoria', filters.listingCategory);
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
            // Category filter
            if (filters.listingCategory !== 'all' && dev.listingCategory !== filters.listingCategory) return false;
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
                    className="bg-white rounded-3xl p-6 sm:p-12 border border-[#E2E0DB] max-w-[calc(100vw-32px)] sm:max-w-[480px] mx-4 text-center shadow-sm">
                    <div className="text-5xl mb-5">🏗️</div>
                    <h1 className="text-3xl font-bold text-[#0B1928] mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        Portfólio em <em className="text-[#5A6577]">Curadoria</em>
                    </h1>
                    <p className="text-[#5A6577] text-[15px] leading-relaxed mb-7">
                        Estamos selecionando os melhores ativos do mercado para este catálogo exclusivo.
                    </p>
                    <button
                        onClick={() => handleCTAClick('off-market')}
                        className="inline-flex items-center gap-2 h-11 px-6 text-[11px] font-bold uppercase tracking-[0.08em] text-white cursor-pointer transition-colors"
                        style={{ borderRadius: R.btn, background: NAVY, border: 'none', boxShadow: '0 2px 8px rgba(11,25,40,0.2)' }}
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
                    className="flex-shrink-0 h-[34px] px-3.5 text-[11px] font-semibold cursor-pointer whitespace-nowrap transition-colors"
                    style={{
                        borderRadius: R.btn,
                        background: chip.active ? NAVY : CARD_BG,
                        color: chip.active ? '#fff' : TEXT_BODY,
                        border: `2px solid ${chip.active ? NAVY : BORDER}`,
                    }}
                >
                    {chip.label}
                </button>
            ))}
        </div>
    );

    // ── Category tabs (shared) ──────────────────────────────────────────────
    const categoryTabs = (
        <div className="flex gap-1 overflow-x-auto px-4 py-2" style={{ scrollbarWidth: 'none' }}>
            {CATEGORY_TABS.map(tab => (
                <button
                    key={tab.value}
                    onClick={() => setFilters(f => ({ ...f, listingCategory: tab.value }))}
                    className="flex-shrink-0 h-9 px-4 text-[11px] font-bold tracking-[0.05em] uppercase cursor-pointer transition-all"
                    style={{
                        borderRadius: R.btn,
                        background: filters.listingCategory === tab.value ? NAVY : CARD_BG,
                        color: filters.listingCategory === tab.value ? '#fff' : TEXT_BODY,
                        border: `2px solid ${filters.listingCategory === tab.value ? NAVY : BORDER}`,
                    }}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );

    // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────
    const mobileView = (
        <main style={{ background: PAGE_BG, minHeight: '100vh', paddingTop: 64, paddingBottom: 32 }}>

            {/* Category tabs */}
            {categoryTabs}

            {/* Search bar — brand kit Linp */}
            <div className="px-4 pt-2 pb-3">
                <div className="flex items-center gap-2.5 px-3.5 h-12" style={{ background: PAGE_BG, border: `2px solid ${BORDER}`, borderRadius: R.btn }}>
                    <Search size={16} style={{ color: TEXT_MUTED, flexShrink: 0 }} />
                    <input
                        type="text"
                        placeholder={availableLocations[0] ? `${availableLocations[0]}…` : 'Buscar imóveis…'}
                        value={filters.search}
                        onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                        className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
                        style={{ color: TEXT_PRIMARY }}
                    />
                    <button
                        onClick={() => setShowMobileFilters(true)}
                        className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-none border-none cursor-pointer flex-shrink-0"
                        style={{ color: NAVY }}
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
                    className="flex items-center gap-1.5 h-[34px] px-3.5 text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                    style={{
                        borderRadius: R.btn,
                        background: viewMode === 'map' ? NAVY : CARD_BG,
                        color: viewMode === 'map' ? '#fff' : TEXT_SUB,
                        border: `2px solid ${viewMode === 'map' ? NAVY : BORDER}`,
                    }}
                >
                    <MapPin size={13} /> Mapa
                </button>
                <button
                    onClick={() => setFilters(f => ({ ...f, sort: f.sort === 'newest' ? 'relevant' : 'newest' }))}
                    className="flex items-center gap-1 bg-none border-none text-xs cursor-pointer"
                    style={{ color: TEXT_MUTED }}
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

            {/* Map view — responsive height */}
            {viewMode === 'map' ? (
                <div className="mx-4 mb-5 overflow-hidden" style={{ height: 'min(420px, 55vh)', borderRadius: R.card, border: `2px solid ${BORDER}` }}>
                    <PropertyMap
                        developments={filteredDevelopments}
                        height="100%"
                        lang={lang}
                        darkMode={false}
                        selectedId={selectedId ?? undefined}
                        onMarkerClick={handleMarkerClick}
                    />
                </div>
            ) : null}

            {/* Card list */}
            <div className="flex flex-col gap-4 px-4">
                {visibleDevelopments.length > 0 ? visibleDevelopments.map((dev, i) => (
                    <PropertyCard key={dev.id} dev={dev} lang={lang} index={i} />
                )) : (
                    <div className="text-center py-12 text-[#948F84]">
                        <div className="text-4xl mb-3 opacity-30">🔍</div>
                        <p className="mb-4">Nenhum imóvel encontrado</p>
                        <button onClick={() => setFilters(DEFAULT_FILTERS)}
                            className="px-5 py-2 text-[11px] font-semibold cursor-pointer transition-colors"
                            style={{ borderRadius: R.btn, border: `2px solid ${BORDER}`, background: CARD_BG, color: TEXT_BODY }}>
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
                            className="absolute bottom-0 left-0 right-0 bg-white px-5 pt-5 pb-9 max-h-[80vh] overflow-y-auto"
                            style={{ borderRadius: `${R.panel}px ${R.panel}px 0 0` }}
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
                                    className="w-full bg-white px-3.5 py-2.5 text-sm outline-none box-border transition-colors"
                                    style={{ border: `2px solid ${BORDER}`, borderRadius: R.btn, color: TEXT_PRIMARY }}
                                />
                            </FilterSection>

                            {/* Quartos */}
                            <FilterSection label="Quartos">
                                <div className="flex gap-2">
                                    {[null, 1, 2, 3, 4].map(n => (
                                        <button key={n ?? 'all'} onClick={() => setFilters(f => ({ ...f, bedrooms: n }))}
                                            className="flex-1 h-9 text-[11px] font-bold uppercase cursor-pointer transition-colors"
                                            style={{
                                                borderRadius: R.btn,
                                                background: filters.bedrooms === n ? NAVY : CARD_BG,
                                                color: filters.bedrooms === n ? '#fff' : TEXT_SUB,
                                                border: `2px solid ${filters.bedrooms === n ? NAVY : BORDER}`,
                                            }}>
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
                                                className="h-[34px] px-3.5 text-[11px] font-semibold cursor-pointer transition-colors"
                                                style={{
                                                    borderRadius: R.btn,
                                                    background: active ? NAVY : CARD_BG,
                                                    color: active ? '#fff' : TEXT_SUB,
                                                    border: `2px solid ${active ? NAVY : BORDER}`,
                                                }}>
                                                {t}
                                            </button>
                                        );
                                    })}
                                </div>
                            </FilterSection>

                            {/* Faixa de Preço */}
                            <FilterSection label="Faixa de Preço">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="R$ mín"
                                        value={filters.priceRange[0] > 0 ? filters.priceRange[0] : ''}
                                        onChange={e => setFilters(f => ({ ...f, priceRange: [Number(e.target.value) || 0, f.priceRange[1]] }))}
                                        className="flex-1 min-w-0 bg-white px-3 py-2.5 text-sm outline-none box-border transition-colors"
                                        style={{ border: `2px solid ${BORDER}`, borderRadius: R.btn, color: TEXT_PRIMARY }}
                                    />
                                    <span className="text-[#948F84] text-xs">até</span>
                                    <input
                                        type="number"
                                        placeholder="R$ máx"
                                        value={filters.priceRange[1] < 10000000 ? filters.priceRange[1] : ''}
                                        onChange={e => setFilters(f => ({ ...f, priceRange: [f.priceRange[0], Number(e.target.value) || 10000000] }))}
                                        className="flex-1 min-w-0 bg-white px-3 py-2.5 text-sm outline-none box-border transition-colors"
                                        style={{ border: `2px solid ${BORDER}`, borderRadius: R.btn, color: TEXT_PRIMARY }}
                                    />
                                </div>
                            </FilterSection>

                            {/* Área */}
                            <FilterSection label="Área (m²)">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="mín"
                                        value={filters.areaRange[0] > 0 ? filters.areaRange[0] : ''}
                                        onChange={e => setFilters(f => ({ ...f, areaRange: [Number(e.target.value) || 0, f.areaRange[1]] }))}
                                        className="flex-1 min-w-0 bg-white px-3 py-2.5 text-sm outline-none box-border transition-colors"
                                        style={{ border: `2px solid ${BORDER}`, borderRadius: R.btn, color: TEXT_PRIMARY }}
                                    />
                                    <span className="text-[#948F84] text-xs">até</span>
                                    <input
                                        type="number"
                                        placeholder="máx"
                                        value={filters.areaRange[1] < 500 ? filters.areaRange[1] : ''}
                                        onChange={e => setFilters(f => ({ ...f, areaRange: [f.areaRange[0], Number(e.target.value) || 500] }))}
                                        className="flex-1 min-w-0 bg-white px-3 py-2.5 text-sm outline-none box-border transition-colors"
                                        style={{ border: `2px solid ${BORDER}`, borderRadius: R.btn, color: TEXT_PRIMARY }}
                                    />
                                </div>
                            </FilterSection>

                            {/* Status */}
                            <FilterSection label="Status">
                                <div className="flex gap-2 flex-wrap">
                                    {[
                                        { val: 'launch', label: 'Lançamento' },
                                        { val: 'ready', label: 'Pronta Entrega' },
                                        { val: 'under_construction', label: 'Em Obra' },
                                    ].map(s => {
                                        const active = filters.status.includes(s.val);
                                        return (
                                            <button key={s.val} onClick={() => setFilters(f => ({ ...f, status: active ? f.status.filter(x => x !== s.val) : [...f.status, s.val] }))}
                                                className="h-[34px] px-3.5 text-[11px] font-semibold cursor-pointer transition-colors"
                                                style={{
                                                    borderRadius: R.btn,
                                                    background: active ? NAVY : CARD_BG,
                                                    color: active ? '#fff' : TEXT_SUB,
                                                    border: `2px solid ${active ? NAVY : BORDER}`,
                                                }}>
                                                {s.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </FilterSection>

                            {/* Localização */}
                            <FilterSection label="Localização">
                                <div className="flex gap-2 flex-wrap">
                                    <button onClick={() => setFilters(f => ({ ...f, location: null, neighborhood: null }))}
                                        className="h-[34px] px-3.5 text-[11px] font-semibold cursor-pointer transition-colors"
                                        style={{
                                            borderRadius: R.btn,
                                            background: !filters.location ? NAVY : CARD_BG,
                                            color: !filters.location ? '#fff' : TEXT_SUB,
                                            border: `2px solid ${!filters.location ? NAVY : BORDER}`,
                                        }}>
                                        Todas
                                    </button>
                                    {availableLocations.map(loc => {
                                        const active = filters.location === loc;
                                        return (
                                            <button key={loc} onClick={() => setFilters(f => ({ ...f, location: active ? null : loc, neighborhood: null }))}
                                                className="h-[34px] px-3.5 text-[11px] font-semibold cursor-pointer transition-colors"
                                                style={{
                                                    borderRadius: R.btn,
                                                    background: active ? NAVY : CARD_BG,
                                                    color: active ? '#fff' : TEXT_SUB,
                                                    border: `2px solid ${active ? NAVY : BORDER}`,
                                                }}>
                                                {loc}
                                            </button>
                                        );
                                    })}
                                </div>
                            </FilterSection>

                            {/* Actions — brand kit Lbtn */}
                            <div className="flex gap-2.5 mt-2">
                                <button onClick={() => { setFilters(DEFAULT_FILTERS); setShowMobileFilters(false); }}
                                    className="flex-1 h-12 text-[11px] font-bold uppercase tracking-[0.08em] cursor-pointer transition-colors"
                                    style={{ borderRadius: R.btn, border: `2px solid ${BORDER}`, background: CARD_BG, color: TEXT_SUB }}>
                                    Limpar
                                </button>
                                <button onClick={() => setShowMobileFilters(false)}
                                    className="flex-[2] h-12 text-[11px] font-bold uppercase tracking-[0.08em] text-white cursor-pointer transition-colors"
                                    style={{ borderRadius: R.btn, background: NAVY, border: 'none', boxShadow: '0 2px 8px rgba(11,25,40,0.2)' }}>
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

                {/* Search + Filters — brand kit panel */}
                <div
                    className="px-5 pt-5 pb-5 mb-5"
                    style={{
                        borderRadius: R.panel,
                        background: CARD_BG,
                        border: `2px solid ${BORDER}`,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.05)',
                    }}
                >
                    {/* Category tabs — brand kit Lbtn style */}
                    <div className="flex gap-1.5 mb-4 pb-4" style={{ borderBottom: `2px solid ${BORDER_LIGHT}` }}>
                        {CATEGORY_TABS.map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => setFilters(f => ({ ...f, listingCategory: tab.value }))}
                                className="h-9 px-4 text-[11px] font-bold tracking-[0.08em] uppercase cursor-pointer transition-all duration-200"
                                style={{
                                    borderRadius: R.btn,
                                    background: filters.listingCategory === tab.value ? NAVY : 'transparent',
                                    color: filters.listingCategory === tab.value ? '#fff' : TEXT_BODY,
                                    border: `2px solid ${filters.listingCategory === tab.value ? NAVY : BORDER}`,
                                    boxShadow: filters.listingCategory === tab.value ? '0 2px 8px rgba(11,25,40,0.2)' : 'none',
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search row — brand kit Linp style */}
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="flex-1 flex items-center gap-3 px-4 h-[44px] transition-all duration-300"
                            style={{ borderRadius: R.btn, background: PAGE_BG, border: `2px solid ${BORDER}` }}
                            onFocus={e => { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(11,25,40,0.07)'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            <Search size={15} style={{ color: TEXT_MUTED, flexShrink: 0 }} />
                            <input
                                type="text"
                                placeholder="Buscar por nome, bairro, cidade ou tipo…"
                                value={filters.search}
                                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                                className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
                                style={{ color: TEXT_PRIMARY }}
                            />
                            {filters.search && (
                                <button onClick={() => setFilters(f => ({ ...f, search: '' }))}
                                    className="bg-none border-none cursor-pointer flex p-1 transition-colors" style={{ color: TEXT_MUTED, borderRadius: R.btn }}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => {/* already filtering live */ }}
                            className="h-[44px] px-6 text-[11px] font-bold tracking-[0.1em] uppercase text-white cursor-pointer flex-shrink-0 transition-all duration-200 flex items-center gap-2 hover:opacity-90"
                            style={{ borderRadius: R.btn, background: NAVY, border: 'none', boxShadow: '0 2px 8px rgba(11,25,40,0.18)' }}>
                            <Search size={13} /> Buscar
                        </button>
                    </div>

                    {/* Filter controls — structured with group labels */}
                    <div className="space-y-2.5">
                        {/* Row 1: Tipo + Quartos */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-bold tracking-[0.14em] uppercase flex items-center gap-1 whitespace-nowrap" style={{ color: TEXT_MUTED }}>
                                <Home size={10} style={{ color: TEXT_MUTED }} /> Tipo
                            </span>
                            {['Apto', 'Casa', 'Flat', 'Cobertura', 'Garden'].map(t => {
                                const val = t.toLowerCase();
                                const active = filters.type.includes(val);
                                return (
                                    <button key={t} onClick={() => setFilters(f => ({ ...f, type: active ? f.type.filter(x => x !== val) : [...f.type, val] }))}
                                        className="h-[34px] px-3.5 text-[11px] font-semibold cursor-pointer transition-all duration-200"
                                        style={{
                                            borderRadius: R.btn,
                                            background: active ? NAVY : CARD_BG,
                                            color: active ? '#fff' : TEXT_SUB,
                                            border: `2px solid ${active ? NAVY : BORDER}`,
                                        }}>
                                        {t}
                                    </button>
                                );
                            })}

                            <div className="w-px h-5 mx-0.5" style={{ background: BORDER_LIGHT }} />

                            <span className="text-[9px] font-bold tracking-[0.14em] uppercase flex items-center gap-1 whitespace-nowrap" style={{ color: TEXT_MUTED }}>
                                <Bed size={10} style={{ color: TEXT_MUTED }} /> Quartos
                            </span>
                            {[null, 1, 2, 3, 4].map(n => (
                                <button key={n ?? 'all'} onClick={() => setFilters(f => ({ ...f, bedrooms: f.bedrooms === n ? null : n }))}
                                    className="h-[34px] px-3.5 text-[11px] font-semibold cursor-pointer transition-all duration-200"
                                    style={{
                                        borderRadius: R.btn,
                                        background: filters.bedrooms === n ? NAVY : CARD_BG,
                                        color: filters.bedrooms === n ? '#fff' : TEXT_SUB,
                                        border: `2px solid ${filters.bedrooms === n ? NAVY : BORDER}`,
                                    }}>
                                    {n === null ? 'Todos' : `${n}+`}
                                </button>
                            ))}
                        </div>

                        {/* Row 2: Price + Area + Clear */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 h-[34px] px-3" style={{ borderRadius: R.btn, border: `2px solid ${BORDER}`, background: CARD_BG }}>
                                <DollarSign size={11} style={{ color: TEXT_MUTED }} />
                                <input type="number" placeholder="Min" value={filters.priceRange[0] > 0 ? filters.priceRange[0] : ''}
                                    onChange={e => setFilters(f => ({ ...f, priceRange: [Number(e.target.value) || 0, f.priceRange[1]] }))}
                                    className="w-[65px] bg-transparent border-none outline-none text-[12px] font-medium" style={{ color: TEXT_BODY }} />
                                <span className="text-[11px]" style={{ color: BORDER }}>—</span>
                                <input type="number" placeholder="Máx" value={filters.priceRange[1] < 10000000 ? filters.priceRange[1] : ''}
                                    onChange={e => setFilters(f => ({ ...f, priceRange: [f.priceRange[0], Number(e.target.value) || 10000000] }))}
                                    className="w-[65px] bg-transparent border-none outline-none text-[12px] font-medium" style={{ color: TEXT_BODY }} />
                            </div>

                            <div className="flex items-center gap-1.5 h-[34px] px-3" style={{ borderRadius: R.btn, border: `2px solid ${BORDER}`, background: CARD_BG }}>
                                <Ruler size={11} style={{ color: TEXT_MUTED }} />
                                <input type="number" placeholder="m² mín" value={filters.areaRange[0] > 0 ? filters.areaRange[0] : ''}
                                    onChange={e => setFilters(f => ({ ...f, areaRange: [Number(e.target.value) || 0, f.areaRange[1]] }))}
                                    className="w-[52px] bg-transparent border-none outline-none text-[12px] font-medium" style={{ color: TEXT_BODY }} />
                                <span className="text-[11px]" style={{ color: BORDER }}>—</span>
                                <input type="number" placeholder="máx" value={filters.areaRange[1] < 500 ? filters.areaRange[1] : ''}
                                    onChange={e => setFilters(f => ({ ...f, areaRange: [f.areaRange[0], Number(e.target.value) || 500] }))}
                                    className="w-[52px] bg-transparent border-none outline-none text-[12px] font-medium" style={{ color: TEXT_BODY }} />
                            </div>

                            {activeFilterCount > 0 && (
                                <button onClick={() => setFilters(DEFAULT_FILTERS)}
                                    className="h-[34px] px-3 text-[11px] font-semibold cursor-pointer hover:bg-red-100 transition-all flex items-center gap-1.5"
                                    style={{ borderRadius: R.btn, border: '2px solid #FECACA', background: '#FEF2F2', color: '#B91C1C' }}>
                                    <X size={11} /> Limpar filtros
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Results toolbar */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2.5">
                        <span className="text-[20px] font-bold tabular-nums" style={{ color: TEXT_PRIMARY, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.04em' }}>
                            {filteredDevelopments.length}
                        </span>
                        <span className="text-[13px] font-medium" style={{ color: TEXT_MUTED }}>
                            imóveis encontrados
                        </span>
                        {activeFilterCount > 0 && (
                            <span className="text-[10px] font-bold px-2.5 py-1" style={{ color: NAVY, background: '#E8EDF5', borderRadius: 20 }}>
                                {activeFilterCount} filtro{activeFilterCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Sort */}
                        <select
                            value={filters.sort}
                            onChange={e => setFilters(f => ({ ...f, sort: e.target.value as FilterState['sort'] }))}
                            className="h-[36px] px-3.5 text-[12px] font-medium cursor-pointer outline-none appearance-none pr-8 transition-all duration-200"
                            style={{
                                borderRadius: R.btn,
                                background: PAGE_BG,
                                border: `2px solid ${BORDER}`,
                                color: TEXT_BODY,
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23948F84' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 10px center',
                            }}>
                            <option value="relevant">Relevância</option>
                            <option value="newest">Mais Recentes</option>
                            <option value="price-asc">Menor Preço</option>
                            <option value="price-desc">Maior Preço</option>
                        </select>
                        {/* View toggle */}
                        <div className="flex p-[3px]" style={{ background: CARD_BG, border: `2px solid ${BORDER}`, borderRadius: R.btn + 2 }}>
                            {([['grid', Grid3X3, 'Grade'], ['map', Map, 'Mapa']] as [string, typeof Grid3X3, string][]).map(([mode, Icon, lbl]) => (
                                <button key={mode}
                                    onClick={() => { setViewMode(mode as 'grid' | 'map'); if (mode === 'map') setSelectedId(null); }}
                                    className="flex items-center gap-1.5 h-[30px] px-3.5 text-[11px] font-bold tracking-[0.05em] uppercase cursor-pointer transition-all duration-200"
                                    style={{
                                        borderRadius: R.btn,
                                        background: viewMode === mode ? NAVY : 'transparent',
                                        color: viewMode === mode ? '#fff' : TEXT_SUB,
                                        boxShadow: viewMode === mode ? '0 1px 6px rgba(11,25,40,0.18)' : 'none',
                                    }}>
                                    <Icon size={12} />
                                    {lbl}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MAP split view */}
                {viewMode === 'map' && (
                    <div className="flex flex-col md:flex-row overflow-hidden" style={{ height: 'clamp(500px, calc(100vh - 220px), 860px)', borderRadius: R.panel, border: `2px solid ${BORDER}` }}>
                        {/* Map pane */}
                        <div className="flex-1 min-w-0 relative">
                            {filteredDevelopments.length > 0 ? (
                                <PropertyMap
                                    developments={filteredDevelopments}
                                    height="100%"
                                    lang={lang}
                                    darkMode={false}
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
                        <div ref={listRef} className="w-full md:w-[380px] flex-shrink-0 overflow-y-auto" style={{ borderLeft: `2px solid ${BORDER}`, background: CARD_BG }}>
                            <div className="sticky top-0 px-3.5 py-3 z-[5]" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: `2px solid ${BORDER_LIGHT}` }}>
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
                            <div className="text-center py-20 bg-white border-dashed" style={{ borderRadius: R.card, border: `2px dashed ${BORDER}` }}>
                                <div className="text-[40px] opacity-20 mb-3">🔍</div>
                                <h3 className="text-xl font-bold text-[#0B1928] mb-2">Nenhum ativo encontrado</h3>
                                <p className="text-[#948F84] mb-5">Tente remover alguns filtros.</p>
                                <button onClick={() => setFilters(DEFAULT_FILTERS)}
                                    className="px-6 py-2.5 text-[11px] font-semibold cursor-pointer transition-colors"
                                    style={{ borderRadius: R.btn, border: `2px solid ${BORDER}`, background: CARD_BG, color: TEXT_BODY }}>
                                    Limpar filtros
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {visibleDevelopments.map((dev, i) => (
                                    <PropertyCard key={dev.id} dev={dev} lang={lang} index={i} />
                                ))}
                            </div>
                        )}

                        {/* Load more sentinel + button */}
                        {hasMore && (
                            <div ref={sentinelRef} className="flex justify-center mt-10">
                                <button
                                    onClick={() => setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredDevelopments.length))}
                                    className="flex items-center gap-2 h-[38px] px-6 text-[11px] font-bold tracking-[0.08em] uppercase cursor-pointer transition-all hover:border-[#948F84]"
                                    style={{ borderRadius: R.btn, border: `2px solid ${BORDER}`, background: CARD_BG, color: TEXT_SUB }}>
                                    <ChevronDown size={14} />
                                    Carregar mais
                                    <span className="text-[10px] opacity-50 font-normal">({visibleCount} de {filteredDevelopments.length})</span>
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Bottom CTA — brand kit glass + gold accents */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-20 p-12 text-center relative overflow-hidden"
                    style={{
                        borderRadius: R.panel,
                        background: 'linear-gradient(135deg, #050B14 0%, #0A1624 50%, #050B14 100%)',
                        boxShadow: '0 20px 60px rgba(11,25,40,0.4)',
                        border: '2px solid rgba(200,164,74,0.14)',
                    }}
                >
                    {/* Gold radial glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] opacity-[0.06] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(200,164,74,0.6), transparent 70%)' }} />
                    {/* Top gold line */}
                    <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,164,74,0.3), transparent)' }} />
                    <Sparkles size={28} className="mx-auto mb-4 relative" style={{ color: '#C8A44A' }} />
                    <h3 className="text-[30px] font-medium text-white mb-3 relative" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        Não encontrou o <em style={{ color: '#C8A44A', fontStyle: 'italic' }}>imóvel ideal?</em>
                    </h3>
                    <p className="text-[15px] leading-relaxed max-w-[480px] mx-auto mb-8 relative" style={{ color: '#8E99AB' }}>
                        Nossa curadoria vai além do catálogo. Acesse empreendimentos off-market e receba uma prospecção personalizada.
                    </p>
                    <div className="flex items-center justify-center gap-3 relative">
                        <button
                            onClick={() => handleCTAClick('general')}
                            className="inline-flex items-center gap-2 h-[48px] px-8 text-[11px] font-bold tracking-[0.08em] uppercase cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                            style={{ borderRadius: R.btn, background: '#fff', color: NAVY, border: 'none' }}
                        >
                            <MessageCircle size={16} /> Iniciar Consultoria
                        </button>
                        <button
                            onClick={() => handleCTAClick('off-market')}
                            className="inline-flex items-center gap-2 h-[48px] px-8 text-[11px] font-bold tracking-[0.08em] uppercase cursor-pointer transition-all duration-300 relative overflow-hidden hover:-translate-y-0.5"
                            style={{
                                borderRadius: R.btn,
                                background: 'transparent',
                                color: '#fff',
                                border: '2px solid rgba(200,164,74,0.20)',
                                boxShadow: '0 0 14px rgba(200,164,74,0.06)',
                            }}
                        >
                            <Eye size={16} /> Ver Off-Market
                            <span className="absolute bottom-0 left-0 right-0 h-[2px] opacity-60" style={{ background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)' }} />
                        </button>
                    </div>
                </motion.div>
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
