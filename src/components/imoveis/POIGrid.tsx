'use client';

import { useState, useEffect } from 'react';
import type { ConvenienceData, POICategoryResult } from '@/types/poi';

interface POIGridProps {
    developmentId: string;
    latitude: number;
    longitude: number;
    imovelType?: 'short_stay' | 'residencial';
}

function formatDistance(meters: number): string {
    if (!meters) return '';
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
    const color =
        score >= 85 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        : score >= 70 ? 'bg-green-500/20 text-green-400 border-green-500/30'
        : score >= 55 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        : score >= 40 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
        : 'bg-red-500/20 text-red-400 border-red-500/30';

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${color}`}>
            <span className="font-mono text-sm">{score}</span>
            <span>/100</span>
            <span className="text-[10px] uppercase tracking-wider opacity-80">{label}</span>
        </div>
    );
}

function POICategoryCard({ cat }: { cat: POICategoryResult }) {
    const hasData = cat.items.length > 0;
    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                hasData
                    ? 'bg-white/5 border-white/10 hover:bg-white/[0.08]'
                    : 'bg-white/[0.02] border-white/5 opacity-50'
            }`}
        >
            <div className="text-xl flex-shrink-0">{cat.icon}</div>
            <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white/90 truncate">{cat.label}</div>
                {hasData ? (
                    <div className="text-xs text-white/50 mt-0.5 truncate">
                        {cat.items[0].name}
                    </div>
                ) : (
                    <div className="text-xs text-white/30 mt-0.5">Não encontrado</div>
                )}
            </div>
            {hasData && cat.nearest_distance_meters > 0 && (
                <div className="text-xs font-mono text-white/60 flex-shrink-0">
                    {formatDistance(cat.nearest_distance_meters)}
                </div>
            )}
        </div>
    );
}

export function POIGrid({
    developmentId,
    latitude,
    longitude,
    imovelType = 'residencial',
}: POIGridProps) {
    const [data, setData] = useState<ConvenienceData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!latitude || !longitude || latitude === 0 || longitude === 0) {
            setLoading(false);
            return;
        }

        fetch(
            `/api/pois?lat=${latitude}&lng=${longitude}&id=${developmentId}&type=${imovelType}`,
        )
            .then((r) => (r.ok ? r.json() : null))
            .then((result: ConvenienceData | null) => setData(result))
            .catch(() => null)
            .finally(() => setLoading(false));
    }, [developmentId, latitude, longitude, imovelType]);

    if (loading) {
        return (
            <div className="space-y-3 animate-pulse">
                <div className="h-8 bg-white/5 rounded-full w-40" />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-16 bg-white/5 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!data) return null;

    const highlights = data.categories
        .flatMap((c) => c.items)
        .filter((p) => p.rating && p.rating >= 4.0)
        .slice(0, 4);

    return (
        <section className="space-y-4">
            {/* Header with score */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-white/90">
                        Conveniência e Proximidade
                    </h3>
                    <p className="text-xs text-white/40 mt-0.5">
                        Serviços e pontos de interesse próximos
                    </p>
                </div>
                <ScoreBadge score={data.score} label={data.score_label} />
            </div>

            {/* Category grid */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {data.categories.map((cat) => (
                    <POICategoryCard key={cat.category} cat={cat} />
                ))}
            </div>

            {/* Top-rated highlights */}
            {highlights.length > 0 && (
                <div className="pt-2 border-t border-white/[0.08]">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
                        Destaques próximos
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {highlights.map((poi) => (
                            <div
                                key={poi.place_id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-full border border-white/10 text-xs"
                            >
                                <span className="text-amber-400">★</span>
                                <span className="text-white/70">{poi.rating?.toFixed(1)}</span>
                                <span className="text-white/50">·</span>
                                <span className="text-white/60 truncate max-w-[100px]">{poi.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <p className="text-[10px] text-white/20">
                Dados via Google Places · Atualizado a cada 7 dias
            </p>
        </section>
    );
}
