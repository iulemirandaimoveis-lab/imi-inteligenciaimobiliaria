'use client'
import { useState, useEffect } from 'react'

// Simulated index data
const IDX_BASE = 1.847
const IDX_DELTA = 2.34
const SPARKLINE_PTS = [1.64, 1.67, 1.71, 1.70, 1.74, 1.78, 1.76, 1.80, 1.82, 1.81, 1.83, 1.84, 1.85, 1.847]

export function WidgetImiIndex() {
    const w = 340, h = 80
    const min = Math.min(...SPARKLINE_PTS)
    const max = Math.max(...SPARKLINE_PTS)
    const range = max - min || 1
    const pts = SPARKLINE_PTS.map((v, i) =>
        `${(i / (SPARKLINE_PTS.length - 1)) * w},${h - ((v - min) / range) * (h - 10) - 2}`
    ).join(' ')

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', marginBottom: 4 }}>Índice IMI Recife</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                        <span style={{ fontFamily: 'var(--font-display,"Playfair Display",serif)', fontSize: 40, color: 'var(--text-primary)', letterSpacing: '-1.5px', lineHeight: 1 }}>
                            {IDX_BASE.toFixed(3)}
                        </span>
                        <div style={{ paddingBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, background: 'rgba(45,143,92,0.10)', color: 'var(--success,#2D8F5C)', fontSize: 11, fontWeight: 600 }}>
                            ↑ +{IDX_DELTA}% hoje
                        </div>
                    </div>
                </div>
                {/* Tiny live dot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success,#2D8F5C)', boxShadow: '0 0 6px var(--success,#2D8F5C)' }} />
                    <span style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ao vivo</span>
                </div>
            </div>

            {/* Sparkline */}
            <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: 80 }}>
                <defs>
                    <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--gold,#C8A44A)" stopOpacity="0.20" />
                        <stop offset="100%" stopColor="var(--gold,#C8A44A)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polyline points={`${pts} ${w},${h} 0,${h}`} fill="url(#ig)" stroke="none" />
                <polyline points={pts} fill="none" stroke="var(--imi-gold-500,#C8A44A)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {/* Last point dot */}
                <circle cx={w} cy={h - ((IDX_BASE - min) / range) * (h - 10) - 2} r="4" fill="var(--imi-gold-500,#C8A44A)" />
            </svg>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                {[
                    { label: 'Abertura', value: '1.803' },
                    { label: 'Máx 52sem', value: '1.892' },
                    { label: 'Mín 52sem', value: '1.641' },
                    { label: 'Volume (trans/mês)', value: '847' },
                ].map(s => (
                    <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{s.value}</span>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <p style={{ fontSize: 9, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4, borderTop: '1px solid var(--border-default)', paddingTop: 8 }}>
                Índice composto por volume, preço/m² e velocidade de absorção — base Jan/2024 = 1.000
            </p>
        </div>
    )
}
