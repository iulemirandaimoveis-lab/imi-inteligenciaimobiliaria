'use client';

import { useState, useEffect } from 'react';
import type { ConvenienceData, POICategoryResult } from '@/types/poi';

const GOLD = '#C8A44A';

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
    const style =
        score >= 85
            ? { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' }
            : score >= 70
            ? { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' }
            : score >= 55
            ? { bg: '#FEFCE8', text: '#854D0E', border: '#FDE68A' }
            : score >= 40
            ? { bg: '#FFF7ED', text: '#9A3412', border: '#FED7AA' }
            : { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' };

    return (
        <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border"
            style={{ background: style.bg, borderColor: style.border }}
        >
            <span
                className="text-sm font-bold"
                style={{ color: style.text, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}
            >
                {score}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: style.text, opacity: 0.7 }}>/100</span>
            <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: style.text, opacity: 0.8 }}
            >
                {label}
            </span>
        </div>
    );
}

function POICategoryCard({ cat }: { cat: POICategoryResult }) {
    const hasData = cat.items.length > 0;
    return (
        <div
            className="flex items-center gap-3 p-3 rounded-xl border transition-colors"
            style={{
                background: hasData ? '#FFFFFF' : '#F8F6F2',
                borderColor: hasData ? 'rgba(184,179,168,0.3)' : 'rgba(184,179,168,0.15)',
                opacity: hasData ? 1 : 0.55,
            }}
        >
            <div className="text-xl flex-shrink-0">{cat.icon}</div>
            <div className="flex-1 min-w-0">
                <div
                    className="text-xs font-semibold truncate"
                    style={{ color: '#0B1928' }}
                >
                    {cat.label}
                </div>
                {hasData ? (
                    <div className="text-xs mt-0.5 truncate" style={{ color: '#948F84' }}>
                        {cat.items[0].name}
                    </div>
                ) : (
                    <div className="text-xs mt-0.5" style={{ color: '#B8B3A8' }}>
                        Não encontrado
                    </div>
                )}
            </div>
            {hasData && cat.nearest_distance_meters > 0 && (
                <div
                    className="text-xs flex-shrink-0"
                    style={{ color: '#948F84', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}
                >
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
                <div className="h-8 rounded-full w-40" style={{ background: '#F0EDE5' }} />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-16 rounded-xl" style={{ background: '#F0EDE5' }} />
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
        <section className="space-y-5">
            {/* Section heading — matches DevelopmentLocation style */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 rounded-full" style={{ background: GOLD }} />
                    <div>
                        <h3
                            className="text-xl font-bold tracking-tight"
                            style={{ color: '#0B1928', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                        >
                            Conveniência e Proximidade
                        </h3>
                        <p className="text-[12px] mt-0.5" style={{ color: '#948F84' }}>
                            Serviços e pontos de interesse próximos
                        </p>
                    </div>
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
                <div
                    className="pt-4"
                    style={{ borderTop: '1px solid rgba(184,179,168,0.2)' }}
                >
                    <p
                        className="text-[10px] font-bold uppercase tracking-widest mb-2.5"
                        style={{ color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                    >
                        Destaques próximos
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {highlights.map((poi) => (
                            <div
                                key={poi.place_id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs"
                                style={{ background: '#F8F6F2', borderColor: 'rgba(184,179,168,0.3)' }}
                            >
                                <span style={{ color: GOLD }}>★</span>
                                <span style={{ color: '#0B1928', fontWeight: 600 }}>{poi.rating?.toFixed(1)}</span>
                                <span style={{ color: '#B8B3A8' }}>·</span>
                                <span
                                    className="truncate max-w-[100px]"
                                    style={{ color: '#4A5568' }}
                                >
                                    {poi.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <p className="text-[10px]" style={{ color: '#B8B3A8' }}>
                Dados via Google Places · Atualizado a cada 7 dias
            </p>
        </section>
    );
}
