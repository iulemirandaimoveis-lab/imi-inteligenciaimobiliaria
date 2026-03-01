
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency as formatBRL } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { MessageCircle, Info, Loader2 } from 'lucide-react';

interface DevelopmentUnitsProps {
    propertyId: string;
    propertyName: string;
}

export default function DevelopmentUnits({ propertyId, propertyName }: DevelopmentUnitsProps) {
    const supabase = createClient();
    const [units, setUnits] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        async function fetchUnits() {
            const { data, error } = await supabase
                .from('development_units')
                .select('*')
                .eq('development_id', propertyId)
                .order('unit_name', { ascending: true });

            if (!error && data) {
                setUnits(data);
            }
            setIsLoading(false);
        }
        fetchUnits();
    }, [propertyId, supabase]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Loader2 className="w-6 h-6 text-gray-300 animate-spin mb-3" />
                <p className="text-gray-400 font-semibold text-xs uppercase tracking-widest">Carregando unidades...</p>
            </div>
        );
    }

    if (units.length === 0) return null;

    const unitsToShow = showAll ? units : units.slice(0, 10);

    const handleWhatsApp = (unit: any) => {
        const message = encodeURIComponent(
            `Olá! Tenho interesse na unidade ${unit.unit_name} do empreendimento ${propertyName}. Gostaria de mais informações.`
        );
        window.open(`https://wa.me/5581997230455?text=${message}`, '_blank');
    };

    return (
        <div className="scroll-mt-32" id="inventory">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-1 h-5 rounded-full bg-[#334E68]" />
                        <h2
                            className="text-xl text-gray-900 font-bold tracking-tight"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                            Disponibilidade
                        </h2>
                    </div>
                    <p className="text-gray-500 font-light text-[15px]">
                        Unidades disponíveis para investimento neste empreendimento.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg text-gray-400 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                    <Info className="w-3.5 h-3.5 text-[#627D98]" />
                    <span>{units.length} {units.length === 1 ? 'unidade' : 'unidades'}</span>
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-100">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100">
                            <th className="text-left p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Unidade</th>
                            <th className="text-left p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Tipologia</th>
                            <th className="text-left p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Área</th>
                            <th className="text-right p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Valor</th>
                            <th className="text-center p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {unitsToShow.map((unit) => (
                            <tr key={unit.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 font-bold text-gray-900 text-sm">{unit.unit_name}</td>
                                <td className="p-4">
                                    <span className="text-[10px] font-bold py-0.5 px-2.5 bg-gray-50 border border-gray-100 rounded text-gray-400 uppercase tracking-wider">
                                        {unit.unit_type === 'apartment' ? 'Apto' : unit.unit_type}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-600 text-sm">{unit.area ? `${unit.area}m²` : '-'}</td>
                                <td className="p-4 text-right font-bold text-gray-900">
                                    {unit.price ? formatBRL(unit.price) : 'Sob Consulta'}
                                </td>
                                <td className="p-4 text-center">
                                    <button
                                        onClick={() => handleWhatsApp(unit)}
                                        className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-gray-200 text-gray-500 hover:border-[#334E68] hover:text-gray-700 transition-colors"
                                    >
                                        <MessageCircle className="w-3 h-3" />
                                        Consultar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {unitsToShow.map((unit) => (
                    <div key={unit.id} className="bg-white border border-gray-100 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-bold text-gray-900">Unidade {unit.unit_name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-50 text-gray-400 rounded uppercase tracking-wider">
                                {unit.unit_type === 'apartment' ? 'Apto' : unit.unit_type}
                            </span>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                {unit.area && (
                                    <p className="text-xs text-gray-400 mb-0.5">{unit.area}m²</p>
                                )}
                                <p className="text-lg font-bold text-gray-900">
                                    {unit.price ? formatBRL(unit.price) : 'Sob Consulta'}
                                </p>
                            </div>
                            <button
                                onClick={() => handleWhatsApp(unit)}
                                className="h-9 px-4 rounded-lg bg-[#102A43] text-white text-xs font-semibold hover:bg-[#1A2F44] transition-colors"
                            >
                                Consultar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Show More */}
            {units.length > 10 && !showAll && (
                <div className="mt-8 text-center">
                    <button
                        className="text-gray-500 hover:text-gray-800 font-bold text-[11px] uppercase tracking-[0.2em] transition-colors"
                        onClick={() => setShowAll(true)}
                    >
                        Ver todas ({units.length} unidades)
                    </button>
                </div>
            )}
        </div>
    );
}
