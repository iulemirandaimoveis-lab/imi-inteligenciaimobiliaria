'use client'
import { useState } from 'react'

type Segment = 'Residencial' | 'Comercial' | 'Luxo'

const DATA: Record<Segment, { name: string; score: number; trend: '↑' | '→' | '↓' }[]> = {
    Residencial: [
        { name: 'Boa Viagem', score: 92, trend: '↑' },
        { name: 'Casa Forte', score: 78, trend: '↑' },
        { name: 'Pina', score: 71, trend: '→' },
        { name: 'Aflitos', score: 65, trend: '↑' },
        { name: 'Recife Antigo', score: 58, trend: '→' },
        { name: 'Várzea', score: 43, trend: '↓' },
    ],
    Comercial: [
        { name: 'Recife Antigo', score: 88, trend: '↑' },
        { name: 'Boa Viagem', score: 74, trend: '→' },
        { name: 'Santo Amaro', score: 67, trend: '↑' },
        { name: 'Pina', score: 55, trend: '→' },
        { name: 'Aflitos', score: 41, trend: '↓' },
        { name: 'Casa Forte', score: 36, trend: '↓' },
    ],
    Luxo: [
        { name: 'Boa Viagem', score: 95, trend: '↑' },
        { name: 'Casa Forte', score: 83, trend: '↑' },
        { name: 'Recife Antigo', score: 72, trend: '↑' },
        { name: 'Pina', score: 61, trend: '→' },
        { name: 'Setúbal', score: 54, trend: '→' },
        { name: 'Aflitos', score: 38, trend: '↓' },
    ],
}

const TREND_COLORS: Record<string, string> = {
    '↑': 'var(--bo-success,#2D8F5C)',
    '→': 'var(--bo-text-muted)',
    '↓': '#E05A5A',
}

const SEGMENTS: Segment[] = ['Residencial', 'Comercial', 'Luxo']

export function WidgetDemandTrend() {
    const [activeSegment, setActiveSegment] = useState<Segment>('Residencial')
    const rows = DATA[activeSegment]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Title */}
            <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bo-text-muted)', fontFamily: 'var(--font-ui)', marginBottom: 2 }}>
                    Demanda Imobiliária
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--bo-text)', fontFamily: 'var(--font-display,"Playfair Display",serif)' }}>
                    Demanda por Segmento
                </div>
                <div style={{ fontSize: 10, color: 'var(--bo-text-muted)', marginTop: 3 }}>
                    Índice de busca ativa nos últimos 30 dias
                </div>
            </div>

            {/* Segment chips */}
            <div style={{ display: 'flex', gap: 6 }}>
                {SEGMENTS.map(seg => (
                    <button
                        key={seg}
                        onClick={() => setActiveSegment(seg)}
                        style={{
                            padding: '5px 14px',
                            borderRadius: 999,
                            border: activeSegment === seg
                                ? '1px solid var(--bo-accent,#C8A44A)'
                                : '1px solid var(--bo-border)',
                            background: activeSegment === seg
                                ? 'rgba(200,164,74,0.12)'
                                : 'transparent',
                            color: activeSegment === seg
                                ? 'var(--bo-accent,#C8A44A)'
                                : 'var(--bo-text-muted)',
                            fontSize: 10,
                            fontWeight: 600,
                            fontFamily: 'var(--font-ui)',
                            cursor: 'pointer',
                            letterSpacing: '0.05em',
                            transition: 'all 0.2s',
                        }}
                    >
                        {seg}
                    </button>
                ))}
            </div>

            {/* Bar chart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rows.map((row, i) => (
                    <div key={row.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Rank */}
                        <div style={{ width: 14, fontSize: 9, color: 'var(--bo-text-muted)', textAlign: 'center', flexShrink: 0 }}>
                            {i + 1}
                        </div>
                        {/* Name */}
                        <div style={{ width: 96, fontSize: 11, color: 'var(--bo-text)', flexShrink: 0, fontFamily: 'var(--font-ui)' }}>
                            {row.name}
                        </div>
                        {/* Bar */}
                        <div style={{ flex: 1, height: 20, background: 'var(--bo-border)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                            <div style={{
                                height: '100%',
                                width: `${row.score}%`,
                                background: `linear-gradient(90deg, var(--bo-accent,#C8A44A), rgba(200,164,74,0.55))`,
                                borderRadius: 6,
                                transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                                display: 'flex', alignItems: 'center', paddingLeft: 8,
                            }}>
                                {row.score > 20 && (
                                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--navy,#0B1928)' }}>
                                        {row.score}
                                    </span>
                                )}
                            </div>
                            {row.score <= 20 && (
                                <span style={{ position: 'absolute', left: `${row.score + 2}%`, top: '50%', transform: 'translateY(-50%)', fontSize: 10, fontWeight: 700, color: 'var(--bo-text)' }}>
                                    {row.score}
                                </span>
                            )}
                        </div>
                        {/* Trend */}
                        <div style={{ width: 14, fontSize: 13, color: TREND_COLORS[row.trend], flexShrink: 0, textAlign: 'center' }}>
                            {row.trend}
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div style={{
                display: 'flex', gap: 16, paddingTop: 8,
                borderTop: '1px solid var(--bo-border)',
            }}>
                {([
                    { symbol: '↑', label: 'Alta', color: TREND_COLORS['↑'] },
                    { symbol: '→', label: 'Estável', color: TREND_COLORS['→'] },
                    { symbol: '↓', label: 'Baixa', color: TREND_COLORS['↓'] },
                ] as const).map(t => (
                    <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 11, color: t.color }}>{t.symbol}</span>
                        <span style={{ fontSize: 9, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.label}</span>
                    </div>
                ))}
                <div style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--bo-text-muted)' }}>
                    Score 0–100
                </div>
            </div>
        </div>
    )
}
