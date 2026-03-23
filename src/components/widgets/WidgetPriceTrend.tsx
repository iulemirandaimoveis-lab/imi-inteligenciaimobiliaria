'use client'

import { useState } from 'react'

const BAIRROS = [
    { name: 'Boa Viagem', price: 9800, pct: 8.4 },
    { name: 'Pina', price: 7200, pct: 6.1 },
    { name: 'Miramar', price: 11200, pct: 11.2 },
    { name: 'Casa Forte', price: 6800, pct: 4.8 },
    { name: 'Recife Antigo', price: 14500, pct: 13.5 },
]

export function WidgetPriceTrend() {
    const [active, setActive] = useState(0)
    const b = BAIRROS[active]

    // Generate 12 data points trending from 90% to 100% of current price
    const points = Array.from({ length: 12 }, (_, i) =>
        Math.round(b.price * (0.9 + 0.1 * (i / 11)))
    )
    const max = Math.max(...points)
    const min = Math.min(...points)
    const range = max - min || 1

    // SVG sparkline
    const w = 340, h = 120
    const pts = points.map((v, i) => `${(i / 11) * w},${h - ((v - min) / range) * (h - 10) - 2}`).join(' ')

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {BAIRROS.map((nb, i) => (
                    <button
                        key={nb.name}
                        onClick={() => setActive(i)}
                        style={{
                            padding: '4px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                            fontFamily: 'inherit', transition: 'all 150ms',
                            background: active === i ? 'var(--bg-active)' : 'var(--bg-surface)',
                            border: `1px solid ${active === i ? 'var(--accent-400)' : 'var(--border-default)'}`,
                            color: active === i ? 'var(--accent-400)' : 'var(--text-secondary)',
                            fontWeight: active === i ? 700 : 400,
                        }}
                    >{nb.name}</button>
                ))}
            </div>

            {/* Value */}
            <div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-display,"Playfair Display",serif)', fontSize: 36, color: 'var(--text-primary)', letterSpacing: '-1.5px', lineHeight: 1 }}>
                        R$&nbsp;{b.price.toLocaleString('pt-BR')}
                    </span>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)', paddingBottom: 4 }}>/m²</span>
                </div>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', borderRadius: 6, marginTop: 6,
                    background: 'rgba(45,143,92,0.10)', color: 'var(--success,#2D8F5C)',
                    fontSize: 11, fontWeight: 600,
                }}>
                    ↑ +{b.pct}% nos últimos 12 meses
                </div>
            </div>

            {/* Sparkline */}
            <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: 120 }}>
                <defs>
                    <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--gold,#C8A44A)" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="var(--gold,#C8A44A)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polyline points={`${pts} ${w},${h} 0,${h}`} fill="url(#tg)" stroke="none" />
                <polyline points={pts} fill="none" stroke="var(--accent-400,#C8A44A)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)' }}>
                {['Mar','Mai','Jul','Set','Nov','Jan','Mar'].map(m => <span key={m}>{m}</span>)}
            </div>
        </div>
    )
}
