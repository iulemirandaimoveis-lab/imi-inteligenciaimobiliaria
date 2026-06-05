'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency as formatBRL } from '@/lib/utils';
import { MessageCircle, Info, Loader2, LayoutTemplate, X, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

interface DevelopmentUnitsProps {
    propertyId: string;
    propertyName: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UnitRow = Record<string, any>;

// ─── Floor Plan Modal ─────────────────────────────────────────────────────────

function FloorPlanModal({ unit, onClose }: { unit: UnitRow; onClose: () => void }) {
    const handleBackdrop = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    }, [onClose]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
            onClick={handleBackdrop}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-2xl rounded-[20px] overflow-hidden"
                style={{
                    background: '#fff',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
                    style={{ background: '#FAFAF8', flexShrink: 0 }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-5 rounded-full" style={{ background: '#C8A44A' }} />
                        <div>
                            <h3 className="font-bold text-gray-900 text-[15px]" style={{ fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                                {unit.unit_name}
                            </h3>
                            <p className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold">
                                {unit.unit_type === 'apartment' ? 'Apartamento' : (unit.unit_type || 'Unidade')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                        aria-label="Fechar"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Floor plan image */}
                <div className="relative flex-1 min-h-0 bg-gray-50" style={{ minHeight: 280 }}>
                    {unit.floor_plan_url ? (
                        <a href={unit.floor_plan_url} target="_blank" rel="noopener noreferrer" className="group block w-full h-full" style={{ minHeight: 280 }}>
                            <div className="relative w-full" style={{ minHeight: 280, height: '100%' }}>
                                <Image
                                    src={unit.floor_plan_url}
                                    alt={`Planta — ${unit.unit_name}`}
                                    fill
                                    className="object-contain p-6"
                                    sizes="(max-width: 768px) 100vw, 672px"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <div className="bg-black/50 rounded-full p-2.5">
                                        <ZoomIn className="text-white" size={20} />
                                    </div>
                                </div>
                            </div>
                        </a>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <LayoutTemplate className="w-12 h-12 text-gray-200" strokeWidth={1} />
                            <p className="text-gray-400 text-sm font-medium">Planta em breve</p>
                        </div>
                    )}
                </div>

                {/* Info strip */}
                <div
                    className="flex items-center justify-between gap-4 px-6 py-4 border-t border-gray-100"
                    style={{ background: '#FAFAF8', flexShrink: 0, flexWrap: 'wrap' }}
                >
                    <div className="flex items-center gap-6">
                        {unit.area && (
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Área</p>
                                <p className="font-bold text-gray-900 text-sm">{unit.area}m²</p>
                            </div>
                        )}
                        {(unit.bedrooms ?? 0) > 0 && (
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Quartos</p>
                                <p className="font-bold text-gray-900 text-sm">{unit.bedrooms}</p>
                            </div>
                        )}
                        {(unit.bathrooms ?? 0) > 0 && (
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Banheiros</p>
                                <p className="font-bold text-gray-900 text-sm">{unit.bathrooms}</p>
                            </div>
                        )}
                        {(unit.parking_spots ?? 0) > 0 && (
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Vagas</p>
                                <p className="font-bold text-gray-900 text-sm">{unit.parking_spots}</p>
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Valor</p>
                        <p className="font-bold text-gray-900 text-lg">
                            {unit.price ? formatBRL(unit.price) : (unit.total_price ? formatBRL(unit.total_price) : 'Sob Consulta')}
                        </p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DevelopmentUnits({ propertyId, propertyName }: DevelopmentUnitsProps) {
    const [units, setUnits] = useState<UnitRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [floorPlanUnit, setFloorPlanUnit] = useState<UnitRow | null>(null);

    useEffect(() => {
        const supabase = createClient();
        let cancelled = false;

        // Safety net: after 10s treat as error so spinner never hangs indefinitely
        const timeout = setTimeout(() => {
            if (!cancelled) { setIsLoading(false); setFetchError(true); }
        }, 10_000);

        async function fetchUnits() {
            try {
                const { data, error } = await supabase
                    .from('development_units')
                    .select('*')
                    .eq('development_id', propertyId)
                    .eq('status', 'available');

                if (cancelled) return;
                if (error) { setFetchError(true); }
                else if (data) {
                    // Sort by tower name then by the trailing numeric portion of unit_name
                    const sorted = [...data].sort((a, b) => {
                        const towerCmp = (a.tower || '').localeCompare(b.tower || '');
                        if (towerCmp !== 0) return towerCmp;
                        const numA = parseInt((a.unit_name || '').replace(/\D+/g, '') || '0', 10);
                        const numB = parseInt((b.unit_name || '').replace(/\D+/g, '') || '0', 10);
                        return numA - numB;
                    });
                    setUnits(sorted);
                }
            } catch {
                if (!cancelled) setFetchError(true);
            } finally {
                if (!cancelled) { clearTimeout(timeout); setIsLoading(false); }
            }
        }
        fetchUnits();
        return () => { cancelled = true; clearTimeout(timeout); };
    }, [propertyId]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-[10px] border border-dashed border-gray-200">
                <Loader2 className="w-6 h-6 text-gray-300 animate-spin mb-3" />
                <p className="text-gray-400 font-semibold text-xs uppercase tracking-widest">Carregando unidades...</p>
            </div>
        );
    }

    if (fetchError || units.length === 0) return null;

    const unitsToShow = showAll ? units : units.slice(0, 10);

    const handleWhatsApp = (unit: UnitRow) => {
        const message = encodeURIComponent(
            `Olá! Tenho interesse na unidade ${unit.unit_name} do empreendimento ${propertyName}. Gostaria de mais informações.`
        );
        window.open(`https://wa.me/5581997230455?text=${message}`, '_blank');
    };

    const typologyLabel = (type: string) => {
        if (!type) return '—';
        if (type === 'apartment') return 'Apto';
        return type;
    };

    return (
        <>
            <div className="scroll-mt-32" id="inventory">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-1 h-6 rounded-full" style={{ background: '#C8A44A' }} />
                            <h2
                                className="text-xl text-gray-900 font-bold tracking-tight"
                                style={{ fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                            >
                                Disponibilidade
                            </h2>
                        </div>
                        <p className="text-gray-500 font-light text-[15px]">
                            Unidades disponíveis para investimento neste empreendimento.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-[4px] text-gray-400 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">
                        <Info className="w-3.5 h-3.5 text-navy-200" />
                        <span>{units.length} {units.length === 1 ? 'unidade' : 'unidades'}</span>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-hidden rounded-[10px] border border-gray-100">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="text-left p-4 font-bold text-gray-400 text-[11px] uppercase tracking-widest">Unidade</th>
                                <th className="text-left p-4 font-bold text-gray-400 text-[11px] uppercase tracking-widest">Tipologia</th>
                                <th className="text-left p-4 font-bold text-gray-400 text-[11px] uppercase tracking-widest">Área</th>
                                <th className="text-right p-4 font-bold text-gray-400 text-[11px] uppercase tracking-widest">Valor</th>
                                <th className="text-center p-4 font-bold text-gray-400 text-[11px] uppercase tracking-widest" colSpan={2}>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {unitsToShow.map((unit, idx) => {
                                const prevTower = idx > 0 ? unitsToShow[idx - 1].tower : null;
                                const showTowerHeader = unit.tower && unit.tower !== prevTower;
                                return (
                                    <Fragment key={unit.id}>
                                        {showTowerHeader && (
                                            <tr>
                                                <td colSpan={6} className="px-4 pt-4 pb-2 bg-gray-50/60 border-b border-gray-100">
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                                                        {unit.tower}
                                                    </span>
                                                </td>
                                            </tr>
                                        )}
                                        <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 font-bold text-gray-900 text-sm">{unit.unit_name}</td>
                                            <td className="p-4">
                                                <span className="text-[11px] font-bold py-0.5 px-2.5 bg-gray-50 border border-gray-100 rounded text-gray-400 uppercase tracking-wider">
                                                    {typologyLabel(unit.unit_type)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-600 text-sm">{unit.area ? `${unit.area}m²` : '—'}</td>
                                            <td className="p-4 text-right font-bold text-gray-900">
                                                {(unit.price || unit.total_price) ? formatBRL(unit.price ?? unit.total_price) : 'Sob Consulta'}
                                            </td>
                                            <td className="p-4 pr-2 text-center">
                                                <button
                                                    onClick={() => setFloorPlanUnit(unit)}
                                                    title="Ver planta"
                                                    className="relative inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 overflow-hidden hover:opacity-90 active:scale-[0.97] border border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
                                                    style={{ minHeight: 44 }}
                                                >
                                                    <LayoutTemplate className="w-3.5 h-3.5" />
                                                    <span className="hidden lg:inline">Planta</span>
                                                </button>
                                            </td>
                                            <td className="p-4 pl-2 text-center">
                                                <button
                                                    onClick={() => handleWhatsApp(unit)}
                                                    className="relative inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 overflow-hidden hover:opacity-90 active:scale-[0.97]"
                                                    style={{ background: '#0B1928', color: '#fff', minHeight: 44 }}
                                                >
                                                    <MessageCircle className="w-3 h-3" />
                                                    Consultar
                                                    <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.5 }} />
                                                </button>
                                            </td>
                                        </tr>
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                    {unitsToShow.map((unit, idx) => {
                        const prevTower = idx > 0 ? unitsToShow[idx - 1].tower : null;
                        const showTowerHeader = unit.tower && unit.tower !== prevTower;
                        return (
                            <div key={unit.id}>
                                {showTowerHeader && (
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 px-1 pb-1 pt-3">{unit.tower}</p>
                                )}
                        <div className="bg-white border border-gray-100 rounded-[10px] p-4">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-bold text-gray-900">Unidade {unit.unit_name}</span>
                                <span className="text-[11px] font-bold px-2 py-0.5 bg-gray-50 text-gray-400 rounded-[3px] uppercase tracking-wider">
                                    {typologyLabel(unit.unit_type)}
                                </span>
                            </div>
                            {unit.area && (
                                <p className="text-xs text-gray-400 mb-2">{unit.area}m²</p>
                            )}
                            <p className="text-lg font-bold text-gray-900 mb-3">
                                {(unit.price || unit.total_price) ? formatBRL(unit.price ?? unit.total_price) : 'Sob Consulta'}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFloorPlanUnit(unit)}
                                    className="flex-1 h-11 flex items-center justify-center gap-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 active:scale-[0.97]"
                                >
                                    <LayoutTemplate className="w-3.5 h-3.5" />
                                    Ver Planta
                                </button>
                                <button
                                    onClick={() => handleWhatsApp(unit)}
                                    className="flex-1 relative h-11 flex items-center justify-center gap-1.5 px-4 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 overflow-hidden hover:opacity-90 active:scale-[0.97]"
                                    style={{ background: '#0B1928', color: '#fff' }}
                                >
                                    <MessageCircle className="w-3 h-3" />
                                    Consultar
                                    <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.5 }} />
                                </button>
                            </div>
                        </div>
                            </div>
                        );
                    })}
                </div>

                {/* Show More */}
                {units.length > 10 && !showAll && (
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={() => setShowAll(true)}
                            className="relative inline-flex items-center gap-2 h-11 px-7 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 overflow-hidden hover:opacity-90 active:scale-[0.98]"
                            style={{ background: '#0B1928', color: '#fff', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                        >
                            Ver todas as {units.length} unidades
                            <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.5 }} />
                        </button>
                    </div>
                )}
            </div>

            {/* Floor Plan Modal */}
            <AnimatePresence>
                {floorPlanUnit && (
                    <FloorPlanModal unit={floorPlanUnit} onClose={() => setFloorPlanUnit(null)} />
                )}
            </AnimatePresence>
        </>
    );
}
