'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, ChevronDown, Check, Search, MapPin, Building, BedDouble, DollarSign } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface FilterState {
    status: string[];
    type: string[];
    bedrooms: number | null;
    priceRange: [number, number];
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

const PRICE_OPTIONS = [
    { label: 'Até R$ 500 mil', value: 500000 },
    { label: 'Até R$ 800 mil', value: 800000 },
    { label: 'Até R$ 1 mi', value: 1000000 },
    { label: 'Até R$ 1.5 mi', value: 1500000 },
    { label: 'Até R$ 2 mi', value: 2000000 },
    { label: 'Até R$ 3 mi', value: 3000000 },
    { label: 'Mais de R$ 3 mi', value: 3000001 },
];

const TYPE_OPTIONS = [
    { label: 'Apartamento', value: 'apto' },
    { label: 'Casa', value: 'casa' },
    { label: 'Flat / Studio', value: 'flat' },
    { label: 'Cobertura', value: 'cobertura' },
    { label: 'Garden', value: 'garden' },
];

export default function AdvancedFilter({ filters, onFilterChange, locations, neighborhoods = [], maxPrice = 10000000 }: AdvancedFilterProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Initial state for mobile drawer (cloned from props)
    const [mobileFilters, setMobileFilters] = useState<FilterState>(filters);

    // Lock body scroll when mobile filter is open
    useEffect(() => {
        if (isMobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileOpen]);

    // Helper function to update desktop filters
    const updateFilter = (key: keyof FilterState, value: any) => {
        onFilterChange({ ...filters, [key]: value });
    };

    // Helper function to update mobile filters (local state)
    const updateMobileFilter = (key: keyof FilterState, value: any) => {
        setMobileFilters(prev => ({ ...prev, [key]: value }));
    };

    // Clear all filters
    const clearFilters = () => {
        const cleared: FilterState = {
            status: [],
            type: [],
            bedrooms: null,
            priceRange: [0, maxPrice],
            location: null,
            neighborhood: null,
            sort: 'relevant'
        };
        onFilterChange(cleared);
        setMobileFilters(cleared);
        setActiveDropdown(null);
    };

    // Apply mobile filters to parent
    const applyMobileFilters = () => {
        onFilterChange(mobileFilters);
        setIsMobileOpen(false);
    };

    // Sync mobile filters when drawer opens
    useEffect(() => {
        if (isMobileOpen) {
            setMobileFilters(filters);
        }
    }, [isMobileOpen, filters]);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!activeDropdown) return;
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.filter-dropdown') && !target.closest('[data-filter-trigger]')) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [activeDropdown]);

    // Count active filters for badge
    const activeFilterCount = [
        filters.location ? 1 : 0,
        filters.neighborhood ? 1 : 0,
        filters.type.length > 0 ? 1 : 0,
        filters.bedrooms ? 1 : 0,
        (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) ? 1 : 0,
    ].reduce((sum, v) => sum + v, 0);

    return (
        <div className="sticky top-20 z-40 w-full">
            {/* Desktop / Tablet Bar */}
            <div className="bg-[#0D0F14]/80 backdrop-blur-xl border-b border-white/[0.05] shadow-sm py-4">
                <div className="container-custom">
                    <div className="flex items-center justify-between gap-4">

                        {/* Mobile Toggle - Improved UI */}
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsMobileOpen(true)}
                            className="lg:hidden flex items-center gap-2 bg-[#1A1E2A] text-white px-5 py-3.5 rounded-lg font-bold text-sm shadow-md w-full justify-center active:bg-[#21263A] border border-[#21263A] transition-colors"
                        >
                            <SlidersHorizontal className="w-5 h-5 text-[#486581]" />
                            Filtrar Imóveis
                            {activeFilterCount > 0 && (
                                <span className="ml-1 min-w-[20px] h-5 px-1.5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </motion.button>

                        {/* Desktop Filters */}
                        <div className="hidden lg:flex items-center gap-3 overflow-visible">

                            {/* Location Filter */}
                            <div className="relative">
                                <FilterButton
                                    label={filters.location || "Localização"}
                                    icon={MapPin}
                                    active={activeDropdown === 'location'}
                                    hasValue={!!filters.location}
                                    onClick={() => setActiveDropdown(activeDropdown === 'location' ? null : 'location')}
                                />
                                {activeDropdown === 'location' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="filter-dropdown absolute top-full left-0 mt-2 w-64 bg-[#1A1E2A] rounded-2xl shadow-2xl border border-white/[0.05] p-2 overflow-hidden z-50"
                                    >
                                        <button
                                            onClick={() => { updateFilter('location', null); setActiveDropdown(null); }}
                                            className={cn("w-full text-left px-4 py-2.5 rounded-xl text-sm hover:bg-[#21263A] transition-colors", !filters.location ? "font-bold text-white" : "text-[#9CA3AF]")}
                                        >
                                            Todas as localizações
                                        </button>
                                        {locations.map(loc => (
                                            <button
                                                key={loc}
                                                onClick={() => { updateFilter('location', loc); setActiveDropdown(null); }}
                                                className={cn(
                                                    "w-full text-left px-4 py-2.5 rounded-xl text-sm hover:bg-[#21263A] transition-colors flex justify-between items-center",
                                                    filters.location === loc ? "bg-[#21263A] font-bold text-white" : "text-[#9CA3AF]"
                                                )}
                                            >
                                                {loc}
                                                {filters.location === loc && <Check className="w-4 h-4 text-[#486581]" />}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </div>

                            {/* Neighborhood Filter */}
                            {neighborhoods.length > 0 && (
                                <div className="relative">
                                    <FilterButton
                                        label={filters.neighborhood || "Bairro"}
                                        icon={MapPin}
                                        active={activeDropdown === 'neighborhood'}
                                        hasValue={!!filters.neighborhood}
                                        onClick={() => setActiveDropdown(activeDropdown === 'neighborhood' ? null : 'neighborhood')}
                                    />
                                    {activeDropdown === 'neighborhood' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="filter-dropdown absolute top-full left-0 mt-2 w-64 bg-[#1A1E2A] rounded-2xl shadow-2xl border border-white/[0.05] p-2 overflow-hidden z-50 max-h-72 overflow-y-auto"
                                        >
                                            <button
                                                onClick={() => { updateFilter('neighborhood', null); setActiveDropdown(null); }}
                                                className={cn("w-full text-left px-4 py-2.5 rounded-xl text-sm hover:bg-[#21263A] transition-colors", !filters.neighborhood ? "font-bold text-white" : "text-[#9CA3AF]")}
                                            >
                                                Todos os bairros
                                            </button>
                                            {neighborhoods.map(hood => (
                                                <button
                                                    key={hood}
                                                    onClick={() => { updateFilter('neighborhood', hood); setActiveDropdown(null); }}
                                                    className={cn(
                                                        "w-full text-left px-4 py-2.5 rounded-xl text-sm hover:bg-[#21263A] transition-colors flex justify-between items-center",
                                                        filters.neighborhood === hood ? "bg-[#21263A] font-bold text-white" : "text-[#9CA3AF]"
                                                    )}
                                                >
                                                    {hood}
                                                    {filters.neighborhood === hood && <Check className="w-4 h-4 text-[#486581]" />}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {/* Type Filter */}
                            <div className="relative">
                                <FilterButton
                                    label="Tipo de Imóvel"
                                    icon={Building}
                                    active={activeDropdown === 'type'}
                                    hasValue={filters.type.length > 0}
                                    onClick={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}
                                />
                                {activeDropdown === 'type' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="filter-dropdown absolute top-full left-0 mt-2 w-56 bg-[#1A1E2A] rounded-2xl shadow-2xl border border-white/[0.05] p-2 z-50"
                                    >
                                        {TYPE_OPTIONS.map(opt => {
                                            const isSelected = filters.type.includes(opt.value);
                                            return (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => {
                                                        const newTypes = isSelected
                                                            ? filters.type.filter(t => t !== opt.value)
                                                            : [...filters.type, opt.value];
                                                        updateFilter('type', newTypes);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-4 py-2.5 rounded-xl text-sm hover:bg-[#21263A] transition-colors flex justify-between items-center mb-1",
                                                        isSelected ? "bg-[#21263A] font-bold text-white" : "text-[#9CA3AF]"
                                                    )}
                                                >
                                                    {opt.label}
                                                    {isSelected && <Check className="w-4 h-4 text-[#486581]" />}
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </div>

                            {/* Bedrooms Filter */}
                            <div className="relative">
                                <FilterButton
                                    label={filters.bedrooms ? `${filters.bedrooms}+ Quartos` : "Quartos"}
                                    icon={BedDouble}
                                    active={activeDropdown === 'bedrooms'}
                                    hasValue={!!filters.bedrooms}
                                    onClick={() => setActiveDropdown(activeDropdown === 'bedrooms' ? null : 'bedrooms')}
                                />
                                {activeDropdown === 'bedrooms' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="filter-dropdown absolute top-full left-0 mt-2 w-48 bg-[#1A1E2A] rounded-2xl shadow-2xl border border-white/[0.05] p-2 z-50"
                                    >
                                        <button onClick={() => updateFilter('bedrooms', null)} className={cn("w-full text-left px-4 py-2.5 rounded-xl text-sm hover:bg-[#21263A] mb-1 transition-colors", !filters.bedrooms ? "font-bold text-white" : "text-[#9CA3AF]")}>Qualquer</button>
                                        {[1, 2, 3, 4].map(num => (
                                            <button
                                                key={num}
                                                onClick={() => updateFilter('bedrooms', num)}
                                                className={cn(
                                                    "w-full text-left px-4 py-2.5 rounded-xl text-sm hover:bg-[#21263A] transition-colors flex justify-between items-center mb-1",
                                                    filters.bedrooms === num ? "bg-[#21263A] font-bold text-white" : "text-[#9CA3AF]"
                                                )}
                                            >
                                                {num}+ Quartos
                                                {filters.bedrooms === num && <Check className="w-4 h-4 text-[#486581]" />}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </div>

                            {/* Price Filter - Simplified Range */}
                            <div className="relative">
                                <FilterButton
                                    label="Faixa de Preço"
                                    icon={DollarSign}
                                    active={activeDropdown === 'price'}
                                    hasValue={filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice}
                                    onClick={() => setActiveDropdown(activeDropdown === 'price' ? null : 'price')}
                                />
                                {activeDropdown === 'price' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="filter-dropdown absolute top-full left-0 mt-2 w-64 bg-[#1A1E2A] rounded-2xl shadow-2xl border border-white/[0.05] p-2 z-50"
                                    >
                                        {PRICE_OPTIONS.map((opt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    if (opt.value > 3000000) updateFilter('priceRange', [3000000, maxPrice]);
                                                    else updateFilter('priceRange', [0, opt.value]);
                                                    setActiveDropdown(null);
                                                }}
                                                className="w-full text-left px-4 py-2.5 rounded-xl text-sm hover:bg-[#21263A] text-[#9CA3AF] hover:text-white mb-1 transition-colors"
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </div>

                            {(filters.location || filters.neighborhood || filters.type.length > 0 || filters.bedrooms || filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) && (
                                <button onClick={clearFilters} className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-wider ml-auto px-4">
                                    Limpar Filtros
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Filter Sheet (Full Screen) */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileOpen(false)}
                            className="fixed inset-0 bg-black/60 z-50 lg:hidden backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: '100%' }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-x-0 bottom-0 top-[10vh] z-50 bg-[#0D0F14] rounded-t-3xl flex flex-col overflow-hidden shadow-2xl lg:hidden border-t border-white/10"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05] bg-[#0D0F14] flex-shrink-0">
                                <h2 className="font-display text-xl font-bold text-white">Filtrar Imóveis</h2>
                                <button
                                    onClick={() => setIsMobileOpen(false)}
                                    className="p-2.5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5 text-[#9CA3AF]" />
                                </button>
                            </div>

                            {/* Content Scroll */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#0D0F14]">

                                {/* Location Section */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-[#6C757D] uppercase tracking-[0.15em] mb-4">Localização</h3>
                                    <div className="flex flex-wrap gap-2.5">
                                        <button
                                            onClick={() => updateMobileFilter('location', null)}
                                            className={cn(
                                                "px-4 py-2.5 rounded-lg text-[13px] font-semibold border transition-all whitespace-nowrap",
                                                !mobileFilters.location
                                                    ? "bg-[#102A43]/10 border-[#334E68]/50 text-[#486581] shadow-sm"
                                                    : "bg-transparent border-white/10 text-[#9CA3AF] hover:bg-white/5"
                                            )}
                                        >
                                            Todas
                                        </button>
                                        {locations.map(loc => (
                                            <button
                                                key={loc}
                                                onClick={() => updateMobileFilter('location', loc)}
                                                className={cn(
                                                    "px-4 py-2.5 rounded-lg text-[13px] font-semibold border transition-all whitespace-nowrap",
                                                    mobileFilters.location === loc
                                                        ? "bg-[#102A43]/10 border-[#334E68]/50 text-[#486581] shadow-sm"
                                                        : "bg-transparent border-white/10 text-[#9CA3AF] hover:bg-white/5"
                                                )}
                                            >
                                                {loc}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Neighborhood Section */}
                                {neighborhoods.length > 0 && (
                                    <div>
                                        <h3 className="text-[11px] font-bold text-[#6C757D] uppercase tracking-[0.15em] mb-4">Bairro</h3>
                                        <div className="flex flex-wrap gap-2.5">
                                            <button
                                                onClick={() => updateMobileFilter('neighborhood', null)}
                                                className={cn(
                                                    "px-4 py-2.5 rounded-lg text-[13px] font-semibold border transition-all whitespace-nowrap",
                                                    !mobileFilters.neighborhood
                                                        ? "bg-[#102A43]/10 border-[#334E68]/50 text-[#486581] shadow-sm"
                                                        : "bg-transparent border-white/10 text-[#9CA3AF] hover:bg-white/5"
                                                )}
                                            >
                                                Todos
                                            </button>
                                            {neighborhoods.map(hood => (
                                                <button
                                                    key={hood}
                                                    onClick={() => updateMobileFilter('neighborhood', hood)}
                                                    className={cn(
                                                        "px-4 py-2.5 rounded-lg text-[13px] font-semibold border transition-all whitespace-nowrap",
                                                        mobileFilters.neighborhood === hood
                                                            ? "bg-[#102A43]/10 border-[#334E68]/50 text-[#486581] shadow-sm"
                                                            : "bg-transparent border-white/10 text-[#9CA3AF] hover:bg-white/5"
                                                    )}
                                                >
                                                    {hood}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Type Section */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-[#6C757D] uppercase tracking-[0.15em] mb-4">Tipo do Imóvel</h3>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {TYPE_OPTIONS.map(opt => {
                                            const isSelected = mobileFilters.type.includes(opt.value);
                                            return (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => {
                                                        const newTypes = isSelected
                                                            ? mobileFilters.type.filter(t => t !== opt.value)
                                                            : [...mobileFilters.type, opt.value];
                                                        updateMobileFilter('type', newTypes);
                                                    }}
                                                    className={cn(
                                                        "px-4 py-3 rounded-lg text-[13px] font-semibold border text-left flex justify-between items-center transition-all",
                                                        isSelected
                                                            ? "bg-[#102A43]/10 border-[#334E68]/50 text-[#486581] shadow-sm"
                                                            : "bg-transparent border-white/10 text-[#9CA3AF] hover:bg-white/5"
                                                    )}
                                                >
                                                    {opt.label}
                                                    {isSelected && <Check className="w-4 h-4 text-[#486581]" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Bedrooms Section */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-[#6C757D] uppercase tracking-[0.15em] mb-4">Quartos</h3>
                                    <div className="grid grid-cols-5 gap-2.5">
                                        <button
                                            onClick={() => updateMobileFilter('bedrooms', null)}
                                            className={cn(
                                                "py-3 rounded-lg text-[13px] font-semibold border justify-center flex transition-all",
                                                !mobileFilters.bedrooms
                                                    ? "bg-[#102A43]/10 border-[#334E68]/50 text-[#486581] shadow-sm"
                                                    : "bg-transparent border-white/10 text-[#9CA3AF] hover:bg-white/5"
                                            )}
                                        >
                                            Todos
                                        </button>
                                        {[1, 2, 3, 4].map(num => (
                                            <button
                                                key={num}
                                                onClick={() => updateMobileFilter('bedrooms', num)}
                                                className={cn(
                                                    "py-3 rounded-lg text-[13px] font-semibold border justify-center flex transition-all text-center",
                                                    mobileFilters.bedrooms === num
                                                        ? "bg-[#102A43]/10 border-[#334E68]/50 text-[#486581] shadow-sm"
                                                        : "bg-transparent border-white/10 text-[#9CA3AF] hover:bg-white/5"
                                                )}
                                            >
                                                {num}+
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Section */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-[#6C757D] uppercase tracking-[0.15em] mb-4">Faixa de Preço</h3>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {PRICE_OPTIONS.map((opt, idx) => {
                                            const isActive = opt.value > 3000000
                                                ? mobileFilters.priceRange[0] === 3000000
                                                : mobileFilters.priceRange[1] === opt.value && mobileFilters.priceRange[0] === 0;
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        if (opt.value > 3000000) updateMobileFilter('priceRange', [3000000, maxPrice]);
                                                        else updateMobileFilter('priceRange', [0, opt.value]);
                                                    }}
                                                    className={cn(
                                                        "px-4 py-3 rounded-lg text-[13px] font-semibold border text-left transition-all",
                                                        isActive
                                                            ? "bg-[#102A43]/10 border-[#334E68]/50 text-[#486581] shadow-sm"
                                                            : "bg-transparent border-white/10 text-[#9CA3AF] hover:bg-white/5"
                                                    )}
                                                >
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-5 border-t border-white/[0.05] bg-[#0D0F14] pb-[calc(1.25rem+env(safe-area-inset-bottom))] flex-shrink-0">
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1 justify-center border-white/20 text-white hover:bg-white/5 h-[50px] rounded-lg font-bold"
                                        onClick={clearFilters}
                                    >
                                        Limpar
                                    </Button>
                                    <Button
                                        className="flex-[2] justify-center bg-[#102A43] text-[#141420] hover:bg-[#16162A] h-[50px] rounded-lg font-bold shadow-[0_4px_14px_rgba(26,26,46,0.4)]"
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

// FilterButton Component
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
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300",
                active
                    ? "bg-[#21263A] border-[#21263A] border-l-2 border-l-[#334E68] text-white"
                    : hasValue
                        ? "bg-[#102A43]/10 border-[#334E68]/30 text-[#486581]"
                        : "bg-white/5 border-white/10 text-[#9CA3AF] hover:bg-white/10 hover:border-white/20 hover:text-white"
            )}
        >
            <Icon className="w-4 h-4" />
            <span className="truncate max-w-[120px]">{label}</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", active && "rotate-180")} />
        </button>
    );
}
