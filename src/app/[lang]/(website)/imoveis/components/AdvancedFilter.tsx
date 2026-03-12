'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, ChevronDown, Check, MapPin, Building, BedDouble, DollarSign, Zap, Search, ArrowUpDown, Ruler } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface FilterState {
    search: string;
    status: string[];
    type: string[];
    bedrooms: number | null;
    priceRange: [number, number];
    areaRange: [number, number];
    location: string | null;
    neighborhood: string | null;
    sort: 'price-asc' | 'price-desc' | 'newest' | 'relevant';
}

interface AdvancedFilterProps {
    filters: FilterState;
    onFilterChange: (newFilters: FilterState) => void;
    locations: string[];
    neighborhoods?: string[];
    maxPrice?: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PRICE_MIN = 0;
const PRICE_MAX = 10_000_000;
const PRICE_STEP = 50_000;

const STATUS_OPTIONS = [
    { label: 'Lançamento', value: 'launch', color: '#3B82F6', dot: '🔵' },
    { label: 'Em Construção', value: 'under_construction', color: '#F59E0B', dot: '🟡' },
    { label: 'Pronta Entrega', value: 'ready', color: '#10B981', dot: '🟢' },
];

const TYPE_OPTIONS = [
    { label: 'Apartamento', value: 'apto' },
    { label: 'Casa', value: 'casa' },
    { label: 'Flat / Studio', value: 'flat' },
    { label: 'Cobertura', value: 'cobertura' },
    { label: 'Garden', value: 'garden' },
];

const SORT_OPTIONS: { label: string; value: FilterState['sort'] }[] = [
    { label: 'Relevância', value: 'relevant' },
    { label: 'Menor Preço', value: 'price-asc' },
    { label: 'Maior Preço', value: 'price-desc' },
    { label: 'Mais Recente', value: 'newest' },
];

const SORT_LABEL: Record<string, string> = {
    relevant: 'Relevância', 'price-asc': 'Menor Preço',
    'price-desc': 'Maior Preço', newest: 'Mais Recente',
};

// ── Area constants ───────────────────────────────────────────────────────────
const AREA_MIN = 0;
const AREA_MAX = 500;

const AREA_PRESETS: { label: string; range: [number, number] }[] = [
    { label: 'Até 50m²', range: [0, 50] },
    { label: 'Até 100m²', range: [0, 100] },
    { label: 'Até 200m²', range: [0, 200] },
    { label: 'Acima 200m²', range: [200, AREA_MAX] },
];

function fmtArea(v: number): string {
    if (v <= 0) return 'Sem mínimo';
    if (v >= AREA_MAX) return 'Sem limite';
    return `${v}m²`;
}

// ── Price formatting ──────────────────────────────────────────────────────────
function fmtPrice(v: number): string {
    if (v <= 0) return 'Sem mínimo';
    if (v >= PRICE_MAX) return 'Sem limite';
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    return `R$ ${Math.round(v / 1000)}K`;
}

// ── PriceRangeSlider ──────────────────────────────────────────────────────────
interface PriceRangeSliderProps {
    value: [number, number];
    onChange: (v: [number, number]) => void;
}

function PriceRangeSlider({ value, onChange }: PriceRangeSliderProps) {
    const toPercent = (v: number) => ((v - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

    const PRESETS: { label: string; range: [number, number] }[] = [
        { label: 'Até 500K', range: [0, 500_000] },
        { label: 'Até 1M',   range: [0, 1_000_000] },
        { label: 'Até 2M',   range: [0, 2_000_000] },
        { label: 'Acima 2M', range: [2_000_000, PRICE_MAX] },
    ];

    return (
        <div className="px-1">
            {/* Labels */}
            <div className="flex justify-between mb-5">
                <span style={{ color: '#486581', fontSize: 12, fontWeight: 700 }}>{fmtPrice(value[0])}</span>
                <span style={{ color: '#486581', fontSize: 12, fontWeight: 700 }}>{fmtPrice(value[1])}</span>
            </div>

            {/* Track */}
            <div style={{ position: 'relative', height: 28, marginBottom: 20 }}>
                {/* Track bg */}
                <div style={{
                    position: 'absolute', top: '50%', left: 0, right: 0,
                    height: 4, borderRadius: 9999,
                    background: 'rgba(255,255,255,0.1)',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                }} />
                {/* Filled range */}
                <div style={{
                    position: 'absolute', top: '50%',
                    left: `${toPercent(value[0])}%`,
                    right: `${100 - toPercent(value[1])}%`,
                    height: 4, borderRadius: 9999,
                    background: 'linear-gradient(90deg, #334E68, #486581)',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                }} />

                {/* Min thumb */}
                <input
                    type="range"
                    min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP}
                    value={value[0]}
                    onChange={e => {
                        const v = Math.min(Number(e.target.value), value[1] - PRICE_STEP);
                        onChange([v, value[1]]);
                    }}
                    className="price-thumb-input"
                    style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        background: 'transparent', outline: 'none', margin: 0, padding: 0,
                        cursor: 'pointer',
                        zIndex: value[0] > PRICE_MAX * 0.85 ? 5 : 3,
                        WebkitAppearance: 'none', appearance: 'none',
                    }}
                />
                {/* Max thumb */}
                <input
                    type="range"
                    min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP}
                    value={value[1]}
                    onChange={e => {
                        const v = Math.max(Number(e.target.value), value[0] + PRICE_STEP);
                        onChange([value[0], v]);
                    }}
                    className="price-thumb-input"
                    style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        background: 'transparent', outline: 'none', margin: 0, padding: 0,
                        cursor: 'pointer', zIndex: 4,
                        WebkitAppearance: 'none', appearance: 'none',
                    }}
                />

                {/* Visual thumbs (pointer-events none — purely decorative) */}
                <div style={{
                    position: 'absolute', top: '50%',
                    left: `${toPercent(value[0])}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'white', border: '2.5px solid #486581',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    pointerEvents: 'none', zIndex: 6,
                }} />
                <div style={{
                    position: 'absolute', top: '50%',
                    left: `${toPercent(value[1])}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'white', border: '2.5px solid #486581',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    pointerEvents: 'none', zIndex: 6,
                }} />
            </div>

            {/* Quick presets */}
            <div className="flex gap-2 flex-wrap">
                {PRESETS.map(p => {
                    const active = value[0] === p.range[0] && value[1] === p.range[1];
                    return (
                        <button
                            key={p.label}
                            onClick={() => onChange(p.range)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                                active
                                    ? "bg-[#102A43]/20 border-[#334E68]/60 text-[#486581]"
                                    : "border-white/10 text-[#6B7280] hover:bg-white/5 hover:text-[#9CA3AF]"
                            )}
                        >
                            {p.label}
                        </button>
                    );
                })}
                {(value[0] > 0 || value[1] < PRICE_MAX) && (
                    <button
                        onClick={() => onChange([PRICE_MIN, PRICE_MAX])}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
                    >
                        Limpar
                    </button>
                )}
            </div>

            {/* CSS for thumb styling */}
            <style>{`
                .price-thumb-input::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 28px; height: 28px;
                    border-radius: 50%;
                    background: transparent;
                    cursor: pointer;
                    pointer-events: all;
                }
                .price-thumb-input::-moz-range-thumb {
                    width: 28px; height: 28px;
                    border-radius: 50%;
                    background: transparent;
                    cursor: pointer;
                    border: none;
                }
                .price-thumb-input::-webkit-slider-runnable-track { background: transparent; }
                .price-thumb-input::-moz-range-track { background: transparent; }
            `}</style>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdvancedFilter({
    filters,
    onFilterChange,
    locations,
    neighborhoods = [],
    maxPrice = PRICE_MAX,
}: AdvancedFilterProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [dropdownSearch, setDropdownSearch] = useState<Record<string, string>>({});
    const [mobileFilters, setMobileFilters] = useState<FilterState>(filters);

    const getSearch = (key: string) => dropdownSearch[key] ?? '';
    const setSearch = (key: string, val: string) =>
        setDropdownSearch(prev => ({ ...prev, [key]: val }));

    // Clear search on dropdown close
    const openDropdown = (key: string) => {
        setSearch(key, '');
        setActiveDropdown(activeDropdown === key ? null : key);
    };

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = isMobileOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMobileOpen]);

    // Sync mobile filters when drawer opens
    useEffect(() => {
        if (isMobileOpen) setMobileFilters(filters);
    }, [isMobileOpen, filters]);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!activeDropdown) return;
        const handle = (e: MouseEvent) => {
            const t = e.target as HTMLElement;
            if (!t.closest('.filter-dropdown') && !t.closest('[data-filter-trigger]')) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('click', handle);
        return () => document.removeEventListener('click', handle);
    }, [activeDropdown]);

    const updateFilter = (key: keyof FilterState, value: unknown) =>
        onFilterChange({ ...filters, [key]: value });

    const updateMobileFilter = (key: keyof FilterState, value: unknown) =>
        setMobileFilters(prev => ({ ...prev, [key]: value }));

    const clearFilters = () => {
        const cleared: FilterState = {
            search: '', status: [], type: [], bedrooms: null,
            priceRange: [PRICE_MIN, maxPrice], areaRange: [AREA_MIN, AREA_MAX],
            location: null, neighborhood: null, sort: 'relevant',
        };
        onFilterChange(cleared);
        setMobileFilters(cleared);
        setActiveDropdown(null);
    };

    const applyMobileFilters = () => {
        onFilterChange(mobileFilters);
        setIsMobileOpen(false);
    };

    // Badge count — all active filter categories
    const activeFilterCount = [
        filters.search ? 1 : 0,
        filters.location ? 1 : 0,
        filters.neighborhood ? 1 : 0,
        filters.status.length > 0 ? 1 : 0,
        filters.type.length > 0 ? 1 : 0,
        filters.bedrooms ? 1 : 0,
        (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) ? 1 : 0,
        (filters.areaRange[0] > 0 || filters.areaRange[1] < AREA_MAX) ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    const hasAnyFilter = activeFilterCount > 0;

    return (
        <div className="sticky top-20 z-40 w-full">
            <div className="bg-[#0D0F14]/80 backdrop-blur-xl border-b border-white/[0.05] shadow-sm py-4">
                <div className="container-custom">
                    <div className="flex items-center justify-between gap-4">

                        {/* ── Mobile toggle ─────────────────────────────── */}
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsMobileOpen(true)}
                            className="lg:hidden flex items-center gap-2.5 bg-[#1A1E2A] text-white px-5 py-3.5 rounded-xl font-bold text-sm shadow-md w-full justify-center active:bg-[#21263A] border border-[#21263A] transition-colors"
                        >
                            <SlidersHorizontal className="w-4.5 h-4.5 text-[#486581]" />
                            Filtrar Imóveis
                            {activeFilterCount > 0 && (
                                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </motion.button>

                        {/* ── Desktop filter bar ────────────────────────── */}
                        <div className="hidden lg:flex items-center gap-2 flex-wrap overflow-visible">

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={e => updateFilter('search', e.target.value)}
                                    placeholder="Buscar..."
                                    className="w-[180px] focus:w-[260px] pl-10 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#334E68] focus:bg-white/[0.08] transition-all duration-300"
                                />
                                {filters.search && (
                                    <button
                                        onClick={() => updateFilter('search', '')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#6B7280] hover:text-white transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Location */}
                            <div className="relative">
                                <FilterButton
                                    label={filters.location || "Localização"}
                                    icon={MapPin}
                                    active={activeDropdown === 'location'}
                                    hasValue={!!filters.location}
                                    onClick={() => openDropdown('location')}
                                />
                                {activeDropdown === 'location' && (
                                    <DropdownPanel width={256} maxH={320}>
                                        {locations.length > 4 && (
                                            <SearchInput
                                                value={getSearch('location')}
                                                onChange={v => setSearch('location', v)}
                                                placeholder="Buscar cidade..."
                                            />
                                        )}
                                        <DropdownItem
                                            label="Todas as localizações"
                                            active={!filters.location}
                                            onClick={() => { updateFilter('location', null); setActiveDropdown(null); }}
                                        />
                                        {locations
                                            .filter(loc => loc.toLowerCase().includes(getSearch('location').toLowerCase()))
                                            .map(loc => (
                                                <DropdownItem
                                                    key={loc} label={loc}
                                                    active={filters.location === loc}
                                                    onClick={() => { updateFilter('location', loc); setActiveDropdown(null); }}
                                                />
                                            ))}
                                    </DropdownPanel>
                                )}
                            </div>

                            {/* Neighborhood */}
                            {neighborhoods.length > 0 && (
                                <div className="relative">
                                    <FilterButton
                                        label={filters.neighborhood || "Bairro"}
                                        icon={MapPin}
                                        active={activeDropdown === 'neighborhood'}
                                        hasValue={!!filters.neighborhood}
                                        onClick={() => openDropdown('neighborhood')}
                                    />
                                    {activeDropdown === 'neighborhood' && (
                                        <DropdownPanel width={256} maxH={300}>
                                            {neighborhoods.length > 4 && (
                                                <SearchInput
                                                    value={getSearch('neighborhood')}
                                                    onChange={v => setSearch('neighborhood', v)}
                                                    placeholder="Buscar bairro..."
                                                />
                                            )}
                                            <DropdownItem
                                                label="Todos os bairros"
                                                active={!filters.neighborhood}
                                                onClick={() => { updateFilter('neighborhood', null); setActiveDropdown(null); }}
                                            />
                                            {neighborhoods
                                                .filter(h => h.toLowerCase().includes(getSearch('neighborhood').toLowerCase()))
                                                .map(h => (
                                                    <DropdownItem
                                                        key={h} label={h}
                                                        active={filters.neighborhood === h}
                                                        onClick={() => { updateFilter('neighborhood', h); setActiveDropdown(null); }}
                                                    />
                                                ))}
                                        </DropdownPanel>
                                    )}
                                </div>
                            )}

                            {/* Status */}
                            <div className="relative">
                                <FilterButton
                                    label={filters.status.length > 0
                                        ? STATUS_OPTIONS.filter(o => filters.status.includes(o.value)).map(o => o.label).join(', ')
                                        : "Status"
                                    }
                                    icon={Zap}
                                    active={activeDropdown === 'status'}
                                    hasValue={filters.status.length > 0}
                                    onClick={() => openDropdown('status')}
                                />
                                {activeDropdown === 'status' && (
                                    <DropdownPanel width={220}>
                                        {STATUS_OPTIONS.map(opt => {
                                            const sel = filters.status.includes(opt.value);
                                            return (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => {
                                                        const next = sel
                                                            ? filters.status.filter(s => s !== opt.value)
                                                            : [...filters.status, opt.value];
                                                        updateFilter('status', next);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-4 py-2.5 rounded-xl text-sm hover:bg-[#21263A] transition-colors flex items-center justify-between mb-1",
                                                        sel ? "bg-[#21263A] font-bold text-white" : "text-[#9CA3AF]"
                                                    )}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color, display: 'inline-block', flexShrink: 0 }} />
                                                        {opt.label}
                                                    </span>
                                                    {sel && <Check className="w-4 h-4 text-[#486581]" />}
                                                </button>
                                            );
                                        })}
                                    </DropdownPanel>
                                )}
                            </div>

                            {/* Type */}
                            <div className="relative">
                                <FilterButton
                                    label="Tipo"
                                    icon={Building}
                                    active={activeDropdown === 'type'}
                                    hasValue={filters.type.length > 0}
                                    onClick={() => openDropdown('type')}
                                />
                                {activeDropdown === 'type' && (
                                    <DropdownPanel width={210}>
                                        {TYPE_OPTIONS.map(opt => {
                                            const sel = filters.type.includes(opt.value);
                                            return (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => {
                                                        const next = sel
                                                            ? filters.type.filter(t => t !== opt.value)
                                                            : [...filters.type, opt.value];
                                                        updateFilter('type', next);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-4 py-2.5 rounded-xl text-sm hover:bg-[#21263A] transition-colors flex justify-between items-center mb-1",
                                                        sel ? "bg-[#21263A] font-bold text-white" : "text-[#9CA3AF]"
                                                    )}
                                                >
                                                    {opt.label}
                                                    {sel && <Check className="w-4 h-4 text-[#486581]" />}
                                                </button>
                                            );
                                        })}
                                    </DropdownPanel>
                                )}
                            </div>

                            {/* Bedrooms */}
                            <div className="relative">
                                <FilterButton
                                    label={filters.bedrooms ? `${filters.bedrooms}+ Quartos` : "Quartos"}
                                    icon={BedDouble}
                                    active={activeDropdown === 'bedrooms'}
                                    hasValue={!!filters.bedrooms}
                                    onClick={() => openDropdown('bedrooms')}
                                />
                                {activeDropdown === 'bedrooms' && (
                                    <DropdownPanel width={190}>
                                        <DropdownItem
                                            label="Qualquer"
                                            active={!filters.bedrooms}
                                            onClick={() => updateFilter('bedrooms', null)}
                                        />
                                        {[1, 2, 3, 4].map(n => (
                                            <DropdownItem
                                                key={n} label={`${n}+ Quartos`}
                                                active={filters.bedrooms === n}
                                                onClick={() => updateFilter('bedrooms', n)}
                                            />
                                        ))}
                                    </DropdownPanel>
                                )}
                            </div>

                            {/* Area */}
                            <div className="relative">
                                <FilterButton
                                    label={
                                        filters.areaRange[0] > 0 || filters.areaRange[1] < AREA_MAX
                                            ? `${fmtArea(filters.areaRange[0])} – ${fmtArea(filters.areaRange[1])}`
                                            : "Área"
                                    }
                                    icon={Ruler}
                                    active={activeDropdown === 'area'}
                                    hasValue={filters.areaRange[0] > 0 || filters.areaRange[1] < AREA_MAX}
                                    onClick={() => openDropdown('area')}
                                />
                                {activeDropdown === 'area' && (
                                    <DropdownPanel width={220}>
                                        <DropdownItem
                                            label="Qualquer área"
                                            active={filters.areaRange[0] === AREA_MIN && filters.areaRange[1] === AREA_MAX}
                                            onClick={() => { updateFilter('areaRange', [AREA_MIN, AREA_MAX]); setActiveDropdown(null); }}
                                        />
                                        {AREA_PRESETS.map(p => {
                                            const active = filters.areaRange[0] === p.range[0] && filters.areaRange[1] === p.range[1];
                                            return (
                                                <DropdownItem
                                                    key={p.label}
                                                    label={p.label}
                                                    active={active}
                                                    onClick={() => { updateFilter('areaRange', p.range); setActiveDropdown(null); }}
                                                />
                                            );
                                        })}
                                    </DropdownPanel>
                                )}
                            </div>

                            {/* Price — range slider dropdown */}
                            <div className="relative">
                                <FilterButton
                                    label={
                                        filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice
                                            ? `${fmtPrice(filters.priceRange[0])} – ${fmtPrice(filters.priceRange[1])}`
                                            : "Preço"
                                    }
                                    icon={DollarSign}
                                    active={activeDropdown === 'price'}
                                    hasValue={filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice}
                                    onClick={() => openDropdown('price')}
                                />
                                {activeDropdown === 'price' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="filter-dropdown absolute top-full left-0 mt-2 bg-[#1A1E2A] rounded-2xl shadow-2xl border border-white/[0.05] p-5 z-50"
                                        style={{ width: 300 }}
                                    >
                                        <PriceRangeSlider
                                            value={filters.priceRange}
                                            onChange={v => updateFilter('priceRange', v)}
                                        />
                                    </motion.div>
                                )}
                            </div>

                            {/* Sort */}
                            <div className="relative ml-auto">
                                <FilterButton
                                    label={SORT_LABEL[filters.sort] || 'Ordenar'}
                                    icon={ArrowUpDown}
                                    active={activeDropdown === 'sort'}
                                    hasValue={filters.sort !== 'relevant'}
                                    onClick={() => openDropdown('sort')}
                                />
                                {activeDropdown === 'sort' && (
                                    <DropdownPanel width={190}>
                                        {SORT_OPTIONS.map(opt => (
                                            <DropdownItem
                                                key={opt.value}
                                                label={opt.label}
                                                active={filters.sort === opt.value}
                                                onClick={() => { updateFilter('sort', opt.value); setActiveDropdown(null); }}
                                            />
                                        ))}
                                    </DropdownPanel>
                                )}
                            </div>

                            {/* Clear filters */}
                            {hasAnyFilter && (
                                <button
                                    onClick={clearFilters}
                                    className="text-xs font-bold text-red-400 hover:text-red-300 uppercase tracking-wider px-3 transition-colors"
                                >
                                    Limpar
                                </button>
                            )}
                        </div>

                        {/* Desktop active filter badge */}
                        {activeFilterCount > 0 && (
                            <span className="hidden lg:flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold flex-shrink-0">
                                {activeFilterCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Mobile full-screen filter sheet ───────────────────────── */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsMobileOpen(false)}
                            className="fixed inset-0 bg-black/60 z-50 lg:hidden backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: '100%' }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: '100%' }}
                            transition={{ type: "spring", damping: 28, stiffness: 220 }}
                            className="fixed inset-x-0 bottom-0 top-[8vh] z-50 bg-[#0D0F14] rounded-t-3xl flex flex-col overflow-hidden shadow-2xl lg:hidden border-t border-white/10"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05] flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <h2 className="font-display text-xl font-bold text-white">Filtros</h2>
                                    {activeFilterCount > 0 && (
                                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsMobileOpen(false)}
                                    className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5 text-[#9CA3AF]" />
                                </button>
                            </div>

                            {/* Scrollable content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                                {/* Busca */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-[#6C757D] uppercase tracking-[0.15em] mb-4">Buscar</h3>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
                                        <input
                                            type="text"
                                            value={mobileFilters.search}
                                            onChange={e => updateMobileFilter('search', e.target.value)}
                                            placeholder="Nome, bairro, cidade, construtora..."
                                            className="w-full pl-11 pr-10 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#334E68] transition-colors"
                                        />
                                        {mobileFilters.search && (
                                            <button
                                                onClick={() => updateMobileFilter('search', '')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#6B7280] hover:text-white transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Localização */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-[#6C757D] uppercase tracking-[0.15em] mb-4">Localização</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <MobileChip
                                            label="Todas"
                                            active={!mobileFilters.location}
                                            onClick={() => updateMobileFilter('location', null)}
                                        />
                                        {locations.map(loc => (
                                            <MobileChip
                                                key={loc} label={loc}
                                                active={mobileFilters.location === loc}
                                                onClick={() => updateMobileFilter('location', loc)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Bairro */}
                                {neighborhoods.length > 0 && (
                                    <div>
                                        <h3 className="text-[11px] font-bold text-[#6C757D] uppercase tracking-[0.15em] mb-4">Bairro</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <MobileChip
                                                label="Todos"
                                                active={!mobileFilters.neighborhood}
                                                onClick={() => updateMobileFilter('neighborhood', null)}
                                            />
                                            {neighborhoods.map(h => (
                                                <MobileChip
                                                    key={h} label={h}
                                                    active={mobileFilters.neighborhood === h}
                                                    onClick={() => updateMobileFilter('neighborhood', h)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Status */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-[#6C757D] uppercase tracking-[0.15em] mb-4">Status do Empreendimento</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {STATUS_OPTIONS.map(opt => {
                                            const sel = mobileFilters.status.includes(opt.value);
                                            return (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => {
                                                        const next = sel
                                                            ? mobileFilters.status.filter(s => s !== opt.value)
                                                            : [...mobileFilters.status, opt.value];
                                                        updateMobileFilter('status', next);
                                                    }}
                                                    className={cn(
                                                        "px-4 py-3 rounded-xl text-[13px] font-semibold border flex items-center justify-between transition-all",
                                                        sel
                                                            ? "bg-[#102A43]/10 border-[#334E68]/50 text-[#486581]"
                                                            : "bg-transparent border-white/10 text-[#9CA3AF] hover:bg-white/5"
                                                    )}
                                                >
                                                    <span className="flex items-center gap-3">
                                                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: opt.color, display: 'inline-block', flexShrink: 0 }} />
                                                        {opt.label}
                                                    </span>
                                                    {sel && <Check className="w-4 h-4 text-[#486581]" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Tipo */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-[#6C757D] uppercase tracking-[0.15em] mb-4">Tipo do Imóvel</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {TYPE_OPTIONS.map(opt => {
                                            const sel = mobileFilters.type.includes(opt.value);
                                            return (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => {
                                                        const next = sel
                                                            ? mobileFilters.type.filter(t => t !== opt.value)
                                                            : [...mobileFilters.type, opt.value];
                                                        updateMobileFilter('type', next);
                                                    }}
                                                    className={cn(
                                                        "px-4 py-3 rounded-xl text-[13px] font-semibold border flex justify-between items-center transition-all",
                                                        sel
                                                            ? "bg-[#102A43]/10 border-[#334E68]/50 text-[#486581]"
                                                            : "bg-transparent border-white/10 text-[#9CA3AF] hover:bg-white/5"
                                                    )}
                                                >
                                                    {opt.label}
                                                    {sel && <Check className="w-4 h-4 text-[#486581]" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Quartos */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-[#6C757D] uppercase tracking-[0.15em] mb-4">Quartos</h3>
                                    <div className="grid grid-cols-5 gap-2">
                                        <button
                                            onClick={() => updateMobileFilter('bedrooms', null)}
                                            className={cn(
                                                "py-3 rounded-xl text-[13px] font-semibold border flex justify-center items-center transition-all",
                                                !mobileFilters.bedrooms
                                                    ? "bg-[#102A43]/10 border-[#334E68]/50 text-[#486581]"
                                                    : "bg-transparent border-white/10 text-[#9CA3AF] hover:bg-white/5"
                                            )}
                                        >
                                            Todos
                                        </button>
                                        {[1, 2, 3, 4].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => updateMobileFilter('bedrooms', n)}
                                                className={cn(
                                                    "py-3 rounded-xl text-[13px] font-semibold border flex justify-center items-center transition-all",
                                                    mobileFilters.bedrooms === n
                                                        ? "bg-[#102A43]/10 border-[#334E68]/50 text-[#486581]"
                                                        : "bg-transparent border-white/10 text-[#9CA3AF] hover:bg-white/5"
                                                )}
                                            >
                                                {n}+
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Área */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-[#6C757D] uppercase tracking-[0.15em] mb-4">Área (m²)</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => updateMobileFilter('areaRange', [AREA_MIN, AREA_MAX])}
                                            className={cn(
                                                "px-4 py-3 rounded-xl text-[13px] font-semibold border flex justify-between items-center transition-all",
                                                mobileFilters.areaRange[0] === AREA_MIN && mobileFilters.areaRange[1] === AREA_MAX
                                                    ? "bg-[#102A43]/10 border-[#334E68]/50 text-[#486581]"
                                                    : "bg-transparent border-white/10 text-[#9CA3AF] hover:bg-white/5"
                                            )}
                                        >
                                            Qualquer
                                            {mobileFilters.areaRange[0] === AREA_MIN && mobileFilters.areaRange[1] === AREA_MAX && (
                                                <Check className="w-4 h-4 text-[#486581]" />
                                            )}
                                        </button>
                                        {AREA_PRESETS.map(p => {
                                            const sel = mobileFilters.areaRange[0] === p.range[0] && mobileFilters.areaRange[1] === p.range[1];
                                            return (
                                                <button
                                                    key={p.label}
                                                    onClick={() => updateMobileFilter('areaRange', p.range)}
                                                    className={cn(
                                                        "px-4 py-3 rounded-xl text-[13px] font-semibold border flex justify-between items-center transition-all",
                                                        sel
                                                            ? "bg-[#102A43]/10 border-[#334E68]/50 text-[#486581]"
                                                            : "bg-transparent border-white/10 text-[#9CA3AF] hover:bg-white/5"
                                                    )}
                                                >
                                                    {p.label}
                                                    {sel && <Check className="w-4 h-4 text-[#486581]" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Faixa de Preço — range slider */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-[#6C757D] uppercase tracking-[0.15em] mb-6">Faixa de Preço</h3>
                                    <PriceRangeSlider
                                        value={mobileFilters.priceRange}
                                        onChange={v => updateMobileFilter('priceRange', v)}
                                    />
                                </div>

                                {/* Ordenação */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-[#6C757D] uppercase tracking-[0.15em] mb-4">Ordenação</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {SORT_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => updateMobileFilter('sort', opt.value)}
                                                className={cn(
                                                    "px-4 py-3 rounded-xl text-[13px] font-semibold border flex justify-between items-center transition-all",
                                                    mobileFilters.sort === opt.value
                                                        ? "bg-[#102A43]/10 border-[#334E68]/50 text-[#486581]"
                                                        : "bg-transparent border-white/10 text-[#9CA3AF] hover:bg-white/5"
                                                )}
                                            >
                                                {opt.label}
                                                {mobileFilters.sort === opt.value && <Check className="w-4 h-4 text-[#486581]" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-5 border-t border-white/[0.05] flex-shrink-0" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1 justify-center border-white/20 text-white hover:bg-white/5 h-[50px] rounded-xl font-bold"
                                        onClick={clearFilters}
                                    >
                                        Limpar
                                    </Button>
                                    <Button
                                        className="flex-[2] justify-center bg-[#102A43] text-white hover:bg-[#16375e] h-[50px] rounded-xl font-bold shadow-[0_4px_14px_rgba(16,42,67,0.5)]"
                                        onClick={applyMobileFilters}
                                    >
                                        Ver Resultados
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Reusable sub-components ───────────────────────────────────────────────────

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div className="relative mb-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280] pointer-events-none" />
            <input
                autoFocus
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder || 'Buscar...'}
                className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[13px] text-white placeholder-[#6B7280] outline-none focus:border-[#334E68] transition-colors"
            />
        </div>
    );
}

interface FilterButtonProps {
    label: string;
    icon: React.ElementType;
    active: boolean;
    hasValue?: boolean;
    onClick: () => void;
}

function FilterButton({ label, icon: Icon, active, hasValue, onClick }: FilterButtonProps) {
    return (
        <button
            data-filter-trigger
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 whitespace-nowrap",
                active
                    ? "bg-[#21263A] border-[#21263A] border-l-2 border-l-[#334E68] text-white"
                    : hasValue
                        ? "bg-[#102A43]/15 border-[#334E68]/40 text-[#486581]"
                        : "bg-white/5 border-white/10 text-[#9CA3AF] hover:bg-white/10 hover:border-white/20 hover:text-white"
            )}
        >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate max-w-[130px]">{label}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 flex-shrink-0 transition-transform", active && "rotate-180")} />
        </button>
    );
}

interface DropdownPanelProps {
    children: React.ReactNode;
    width?: number;
    maxH?: number;
}

function DropdownPanel({ children, width = 240, maxH }: DropdownPanelProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="filter-dropdown absolute top-full left-0 mt-2 bg-[#1A1E2A] rounded-2xl shadow-2xl border border-white/[0.06] p-2 z-50"
            style={{ width, ...(maxH ? { maxHeight: maxH, overflowY: 'auto' } : {}) }}
        >
            {children}
        </motion.div>
    );
}

interface DropdownItemProps {
    label: string;
    active?: boolean;
    onClick: () => void;
}

function DropdownItem({ label, active, onClick }: DropdownItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left px-4 py-2.5 rounded-xl text-sm hover:bg-[#21263A] transition-colors flex justify-between items-center mb-0.5",
                active ? "bg-[#21263A] font-bold text-white" : "text-[#9CA3AF]"
            )}
        >
            {label}
            {active && <Check className="w-4 h-4 text-[#486581] flex-shrink-0" />}
        </button>
    );
}

interface MobileChipProps {
    label: string;
    active: boolean;
    onClick: () => void;
}

function MobileChip({ label, active, onClick }: MobileChipProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition-all whitespace-nowrap",
                active
                    ? "bg-[#102A43]/15 border-[#334E68]/50 text-[#486581]"
                    : "bg-transparent border-white/10 text-[#9CA3AF] hover:bg-white/5"
            )}
        >
            {label}
        </button>
    );
}
