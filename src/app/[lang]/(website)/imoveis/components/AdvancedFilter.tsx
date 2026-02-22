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
    sort: 'price-asc' | 'price-desc' | 'newest' | 'relevant';
}

interface AdvancedFilterProps {
    filters: FilterState;
    onFilterChange: (newFilters: FilterState) => void;
    locations: string[]; // List of available cities/neighborhoods
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

export default function AdvancedFilter({ filters, onFilterChange, locations, maxPrice = 10000000 }: AdvancedFilterProps) {
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
                            <SlidersHorizontal className="w-5 h-5 text-[#C49D5B]" />
                            Filtrar Imóveis
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
                                                {filters.location === loc && <Check className="w-4 h-4 text-[#C49D5B]" />}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </div>

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
                                                    {isSelected && <Check className="w-4 h-4 text-[#C49D5B]" />}
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
                                                {filters.bedrooms === num && <Check className="w-4 h-4 text-[#C49D5B]" />}
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

                            {(filters.location || filters.type.length > 0 || filters.bedrooms || filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) && (
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
                                                    ? "bg-[#C49D5B]/10 border-[#C49D5B]/50 text-[#C49D5B] shadow-sm"
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
                                                        ? "bg-[#C49D5B]/10 border-[#C49D5B]/50 text-[#C49D5B] shadow-sm"
                                                        : "bg-transparent border-white/10 text-[#9CA3AF] hover:bg-white/5"
                                                )}
                                            >
                                                {loc}
                                            </button>
                                        ))}
                                    </div>
                                </div>

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
                                                            ? "bg-[#C49D5B]/10 border-[#C49D5B]/50 text-[#C49D5B] shadow-sm"
                                                            : "bg-transparent border-white/10 text-[#9CA3AF] hover:bg-white/5"
                                                    )}
                                                >
                                                    {opt.label}
                                                    {isSelected && <Check className="w-4 h-4 text-[#C49D5B]" />}
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
                                                    ? "bg-[#C49D5B]/10 border-[#C49D5B]/50 text-[#C49D5B] shadow-sm"
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
                                                        ? "bg-[#C49D5B]/10 border-[#C49D5B]/50 text-[#C49D5B] shadow-sm"
                                                        : "bg-transparent border-white/10 text-[#9CA3AF] hover:bg-white/5"
                                                )}
                                            >
                                                {num}+
                                            </button>
                                        ))}
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
                                        className="flex-[2] justify-center bg-[#C49D5B] text-[#141420] hover:bg-[#D4A96A] h-[50px] rounded-lg font-bold shadow-[0_4px_14px_rgba(196,157,91,0.4)]"
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
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300",
                active
                    ? "bg-[#21263A] border-[#21263A] border-l-2 border-l-[#C49D5B] text-white"
                    : hasValue
                        ? "bg-[#C49D5B]/10 border-[#C49D5B]/30 text-[#C49D5B]"
                        : "bg-white/5 border-white/10 text-[#9CA3AF] hover:bg-white/10 hover:border-white/20 hover:text-white"
            )}
        >
            <Icon className="w-4 h-4" />
            <span className="truncate max-w-[120px]">{label}</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", active && "rotate-180")} />
        </button>
    );
}
