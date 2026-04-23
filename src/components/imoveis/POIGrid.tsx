'use client';

import { useState, useEffect } from 'react';
import {
    ShoppingCart, Pill, HeartPulse, GraduationCap, Landmark,
    ShoppingBag, TreePine, Fuel, Utensils, Waves, Dumbbell,
    Plane, MapPin, Navigation,
} from 'lucide-react';
import type { ConvenienceData, POICategoryResult, POICategory } from '@/types/poi';

const GOLD = '#C8A44A';
const NAVY = '#0B1928';

// ─── Category visual config ──────────────────────────────────────────────────
const CATEGORY_STYLE: Record<POICategory, { Icon: React.ElementType; bg: string; iconColor: string }> = {
    supermarket:   { Icon: ShoppingCart, bg: 'rgba(34,197,94,0.1)',   iconColor: '#16A34A' },
    pharmacy:      { Icon: Pill,         bg: 'rgba(59,130,246,0.1)',   iconColor: '#2563EB' },
    hospital:      { Icon: HeartPulse,   bg: 'rgba(239,68,68,0.1)',    iconColor: '#DC2626' },
    school:        { Icon: GraduationCap,bg: 'rgba(249,115,22,0.1)',   iconColor: '#EA580C' },
    bank:          { Icon: Landmark,     bg: 'rgba(139,92,246,0.1)',   iconColor: '#7C3AED' },
    shopping_mall: { Icon: ShoppingBag,  bg: 'rgba(236,72,153,0.1)',   iconColor: '#DB2777' },
    park:          { Icon: TreePine,     bg: 'rgba(22,163,74,0.1)',    iconColor: '#15803D' },
    gas_station:   { Icon: Fuel,         bg: 'rgba(217,119,6,0.1)',    iconColor: '#B45309' },
    restaurant:    { Icon: Utensils,     bg: 'rgba(225,29,72,0.1)',    iconColor: '#BE123C' },
    beach:         { Icon: Waves,        bg: 'rgba(6,182,212,0.1)',    iconColor: '#0891B2' },
    gym:           { Icon: Dumbbell,     bg: 'rgba(71,85,105,0.1)',    iconColor: '#475569' },
    airport:       { Icon: Plane,        bg: 'rgba(14,165,233,0.1)',   iconColor: '#0284C7' },
};

function getFallbackStyle() {
    return { Icon: MapPin, bg: 'rgba(200,164,74,0.1)', iconColor: GOLD };
}

function formatDistance(meters: number): string {
    if (!meters) return '';
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
}

// ─── Score badge ─────────────────────────────────────────────────────────────
function ScoreBadge({ score, label }: { score: number; label: string }) {
    const style =
        score >= 85 ? { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' }
        : score >= 70 ? { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' }
        : score >= 55 ? { bg: '#FEFCE8', text: '#854D0E', border: '#FDE68A' }
        : score >= 40 ? { bg: '#FFF7ED', text: '#9A3412', border: '#FED7AA' }
        :               { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' };

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
            <span className="text-[11px]" style={{ color: style.text, opacity: 0.65 }}>/100</span>
            <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: style.text, opacity: 0.8, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
            >
                {label}
            </span>
        </div>
    );
}

// ─── Category card ────────────────────────────────────────────────────────────
function POICategoryCard({ cat }: { cat: POICategoryResult }) {
    const hasData = cat.items.length > 0;
    const { Icon, bg, iconColor } = CATEGORY_STYLE[cat.category] ?? getFallbackStyle();

    return (
        <div
            className="flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 hover:shadow-sm"
            style={{
                background: '#FFFFFF',
                borderColor: hasData ? 'rgba(184,179,168,0.35)' : 'rgba(184,179,168,0.18)',
                opacity: hasData ? 1 : 0.5,
            }}
        >
            {/* Icon */}
            <div
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: bg }}
            >
                <Icon size={16} style={{ color: iconColor }} strokeWidth={1.75} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 pt-0.5">
                <p
                    className="text-[11px] font-bold uppercase tracking-wide leading-none mb-1"
                    style={{ color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                >
                    {cat.label}
                </p>
                {hasData ? (
                    <>
                        <p
                            className="text-[13px] font-semibold leading-tight truncate"
                            style={{ color: NAVY }}
                        >
                            {cat.items[0].name}
                        </p>
                        {cat.nearest_distance_meters > 0 && (
                            <p
                                className="text-[11px] mt-0.5"
                                style={{
                                    color: GOLD,
                                    fontFamily: "var(--fm, 'JetBrains Mono', monospace)",
                                    fontWeight: 600,
                                }}
                            >
                                {formatDistance(cat.nearest_distance_meters)}
                            </p>
                        )}
                    </>
                ) : (
                    <p className="text-[12px]" style={{ color: '#C4BFB8' }}>—</p>
                )}
            </div>
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────
interface POIGridProps {
    developmentId: string;
    latitude: number;
    longitude: number;
    imovelType?: 'short_stay' | 'residencial';
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

        fetch(`/api/pois?lat=${latitude}&lng=${longitude}&id=${developmentId}&type=${imovelType}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((result: ConvenienceData | null) => setData(result))
            .catch(() => null)
            .finally(() => setLoading(false));
    }, [developmentId, latitude, longitude, imovelType]);

    // Loading skeleton
    if (loading) {
        return (
            <section className="space-y-5">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 rounded-full animate-pulse" style={{ background: '#F0EDE5' }} />
                    <div className="h-6 w-52 rounded-lg animate-pulse" style={{ background: '#F0EDE5' }} />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-[72px] rounded-xl animate-pulse" style={{ background: '#F0EDE5' }} />
                    ))}
                </div>
            </section>
        );
    }

    // No data at all — hide section entirely (don't show 0/100 + 8 × "Não encontrado")
    if (!data || (data.score === 0 && data.categories.every((c) => c.items.length === 0))) {
        return null;
    }

    const highlights = data.categories
        .flatMap((c) => c.items)
        .filter((p) => p.rating && p.rating >= 4.0)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 5);

    const filledCats = data.categories.filter((c) => c.items.length > 0);
    const emptyCats = data.categories.filter((c) => c.items.length === 0);

    return (
        <section className="space-y-5">
            {/* Section heading */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ background: GOLD }} />
                    <div>
                        <h3
                            className="text-xl font-bold tracking-tight"
                            style={{ color: NAVY, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
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

            {/* Category grid — filled first, then empty */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[...filledCats, ...emptyCats].map((cat) => (
                    <POICategoryCard key={cat.category} cat={cat} />
                ))}
            </div>

            {/* Top-rated highlights */}
            {highlights.length > 0 && (
                <div className="pt-4" style={{ borderTop: '1px solid rgba(184,179,168,0.2)' }}>
                    <p
                        className="text-[10px] font-bold uppercase tracking-widest mb-3"
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
                                <span
                                    className="font-semibold"
                                    style={{ color: NAVY, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}
                                >
                                    {poi.rating?.toFixed(1)}
                                </span>
                                <span style={{ color: '#B8B3A8' }}>·</span>
                                <span className="truncate max-w-[110px]" style={{ color: '#4A5568' }}>
                                    {poi.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Open in Maps CTA */}
            {latitude && longitude && (
                <div className="flex items-center justify-between pt-1">
                    <p className="text-[10px]" style={{ color: '#C4BFB8' }}>
                        Google Places · Atualizado a cada 7 dias
                    </p>
                    <a
                        href={`https://www.google.com/maps/search/pontos+de+interesse/@${latitude},${longitude},15z`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold transition-opacity hover:opacity-70"
                        style={{ color: GOLD, textDecoration: 'none' }}
                    >
                        <Navigation size={11} strokeWidth={2} />
                        Ver no Maps
                    </a>
                </div>
            )}
        </section>
    );
}
