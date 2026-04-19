'use client';

import { useState, useEffect } from 'react';
import type { ConvenienceData, POICategoryResult } from '@/types/poi';

interface POIGridProps {
    developmentId: string;
    latitude: number;
    longitude: number;
    imovelType?: 'short_stay' | 'residencial';
}

export function formatDistance(meters: number): string {
    if (!meters) return '';
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
    const palette =
        score >= 85 ? { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' }
        : score >= 70 ? { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' }
        : score >= 55 ? { bg: '#FEFCE8', text: '#713F12', border: '#FDE68A' }
        : score >= 40 ? { bg: '#FFF7ED', text: '#7C2D12', border: '#FED7AA' }
        : { bg: '#FEF2F2', text: '#7F1D1D', border: '#FECACA' };

    return (
        <div
            data-testid="score-badge"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 9999,
                border: `1px solid ${palette.border}`,
                background: palette.bg,
            }}
        >
            <span style={{ fontFamily: "var(--fm, 'JetBrains Mono', monospace)", fontSize: 14, fontWeight: 700, color: palette.text }}>{score}</span>
            <span style={{ fontSize: 12, color: palette.text, opacity: 0.7 }}>/100</span>
            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: palette.text, opacity: 0.8 }}>{label}</span>
        </div>
    );
}

function POICategoryCard({ cat }: { cat: POICategoryResult }) {
    const hasData = cat.items.length > 0;
    return (
        <div
            data-testid="poi-category-card"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 12,
                border: `1px solid rgba(184,179,168,${hasData ? '0.3' : '0.15'})`,
                background: hasData ? '#FFFFFF' : '#F8F6F2',
                opacity: hasData ? 1 : 0.6,
                transition: 'box-shadow 0.15s ease',
            }}
        >
            <div style={{ fontSize: 20, flexShrink: 0 }}>{cat.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0B1928', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.label}
                </div>
                {hasData ? (
                    <div style={{ fontSize: 11, color: '#948F84', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cat.items[0].name}
                    </div>
                ) : (
                    <div style={{ fontSize: 11, color: '#B8B3A8', marginTop: 2 }}>Não encontrado</div>
                )}
            </div>
            {hasData && cat.nearest_distance_meters > 0 && (
                <div style={{ fontSize: 11, fontFamily: "var(--fm, 'JetBrains Mono', monospace)", color: '#0B1928', flexShrink: 0, fontWeight: 600 }}>
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
            <div data-testid="poi-grid-loading" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ height: 32, background: '#F0EDE5', borderRadius: 9999, width: 160 }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} style={{ height: 60, background: '#F0EDE5', borderRadius: 12 }} />
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
        <section data-testid="poi-grid" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0B1928', margin: '0 0 2px' }}>
                        Conveniência e Proximidade
                    </h3>
                    <p style={{ fontSize: 12, color: '#948F84', margin: 0 }}>
                        Serviços e pontos de interesse próximos
                    </p>
                </div>
                <ScoreBadge score={data.score} label={data.score_label} />
            </div>

            {/* Category grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {data.categories.map((cat) => (
                    <POICategoryCard key={cat.category} cat={cat} />
                ))}
            </div>

            {/* Top-rated highlights */}
            {highlights.length > 0 && (
                <div style={{ paddingTop: 12, borderTop: '1px solid rgba(184,179,168,0.25)' }}>
                    <p style={{ fontSize: 10, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, margin: '0 0 8px' }}>
                        Destaques próximos
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {highlights.map((poi) => (
                            <div
                                key={poi.place_id}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '4px 10px',
                                    background: '#F8F6F2',
                                    borderRadius: 9999,
                                    border: '1px solid rgba(184,179,168,0.3)',
                                    fontSize: 12,
                                }}
                            >
                                <span style={{ color: '#C8A44A' }}>★</span>
                                <span style={{ color: '#0B1928', fontWeight: 600 }}>{poi.rating?.toFixed(1)}</span>
                                <span style={{ color: '#B8B3A8' }}>·</span>
                                <span style={{ color: '#948F84', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>{poi.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <p style={{ fontSize: 10, color: '#B8B3A8', margin: 0 }}>
                Dados via Google Places · Atualizado a cada 7 dias
            </p>
        </section>
    );
}
