
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Development } from '../types/development';
import { formatBRL } from '../data/developments';
import Button from '@/components/ui/Button';
import { MessageCircle, Info, Loader2 } from 'lucide-react';
import Badge from '@/components/ui/Badge';

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
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <Loader2 className="w-8 h-8 text-imi-400 animate-spin mb-4" />
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Sincronizando Inventário...</p>
            </div>
        );
    }

    if (units.length === 0) return null;

    const unitsToShow = showAll ? units : units.slice(0, 10);

    const handleWhatsApp = (unit: any) => {
        const message = encodeURIComponent(
            `Olá! Tenho interesse na unidade ${unit.unit_name} do empreendimento ${propertyName}. Gostaria de mais informações sobre o fluxo de investimento.`
        );
        window.open(`https://wa.me/5581997230455?text=${message}`, '_blank');
    };

    return (
        <section className="bg-white scroll-mt-32" id="inventory">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div className="max-w-2xl">
                    <h2 className="font-display text-3xl md:text-4xl text-imi-900 mb-4 font-bold tracking-tight">Mapa de Disponibilidade</h2>
                    <p className="text-imi-500 font-light text-lg">
                        Seleção técnica de unidades com maior potencial de valorização e liquidez no ativo.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-imi-50 border border-imi-100 px-4 py-2 rounded-lg text-imi-500 text-[10px] font-black uppercase tracking-widest">
                    <Info className="w-4 h-4 text-accent-600" />
                    <span>Real-time Hub: {new Date().toLocaleDateString('pt-BR')}</span>
                </div>
            </div>

            {/* Tabela Desktop */}
            <div className="hidden md:block overflow-hidden rounded-3xl border border-imi-100 shadow-soft">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-imi-100">
                            <th className="text-left p-6 font-black text-imi-400 text-[10px] uppercase tracking-widest">Unidade</th>
                            <th className="text-left p-6 font-black text-imi-400 text-[10px] uppercase tracking-widest">Tipologia</th>
                            <th className="text-left p-6 font-black text-imi-400 text-[10px] uppercase tracking-widest">Área Privativa</th>
                            <th className="text-right p-6 font-black text-imi-400 text-[10px] uppercase tracking-widest">Investimento</th>
                            <th className="text-center p-6 font-black text-imi-400 text-[10px] uppercase tracking-widest">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {unitsToShow.map((unit) => (
                            <tr key={unit.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors group">
                                <td className="p-6 font-bold text-imi-900">{unit.unit_name}</td>
                                <td className="p-6">
                                    <span className="text-[10px] font-black py-1 px-3 bg-white border border-slate-200 rounded text-slate-400 uppercase tracking-tighter">
                                        {unit.unit_type === 'apartment' ? 'Apartamento' : unit.unit_type}
                                    </span>
                                </td>
                                <td className="p-6 text-imi-600 font-medium">{unit.area ? `${unit.area}m²` : '-'}</td>
                                <td className="p-6 text-right font-bold text-imi-900 text-lg">
                                    {unit.price ? formatBRL(unit.price) : 'Sob Consulta'}
                                </td>
                                <td className="p-6 text-center">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-10 text-[10px] px-6 uppercase tracking-widest font-black border-slate-200 hover:border-imi-900"
                                        onClick={() => handleWhatsApp(unit)}
                                    >
                                        <MessageCircle className="w-3.5 h-3.5 mr-2" />
                                        Protocolar Interesse
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards ... (Omitted for brevity in this block, keeping it simple or I can add it back) */}
            <div className="md:hidden space-y-4">
                {unitsToShow.map((unit) => (
                    <div key={unit.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-lg font-bold text-imi-900">Unidade {unit.unit_name}</span>
                            <span className="text-[10px] font-black px-2 py-1 bg-slate-50 text-slate-400 rounded uppercase tracking-widest">{unit.unit_type}</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Valor do Ativo</p>
                                <p className="text-xl font-bold text-imi-900">{unit.price ? formatBRL(unit.price) : 'Sob Consulta'}</p>
                            </div>
                            <Button size="sm" onClick={() => handleWhatsApp(unit)}>Consultar</Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Botão Ver Mais */}
            {units.length > 10 && !showAll && (
                <div className="mt-12 text-center">
                    <Button
                        variant="ghost"
                        className="text-imi-600 hover:text-imi-900 font-black text-[10px] uppercase tracking-[0.3em]"
                        onClick={() => setShowAll(true)}
                    >
                        Ver inventário completo ({units.length} ativos)
                    </Button>
                </div>
            )}
        </section>
    );
}
