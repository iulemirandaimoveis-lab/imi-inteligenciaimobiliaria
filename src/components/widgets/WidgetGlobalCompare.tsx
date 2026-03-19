'use client'
import { useState } from 'react'

type Metric = 'Preço/m²' | 'Yield' | 'Valorização'

const CITIES = [
    { name: 'Recife', flag: '🇧🇷', isHighlight: true },
    { name: 'São Paulo', flag: '🇧🇷', isHighlight: false },
    { name: 'Rio de Janeiro', flag: '🇧🇷', isHighlight: false },
    { name: 'Fortaleza', flag: '🇧🇷', isHighlight: false },
    { name: 'Maceió', flag: '🇧🇷', isHighlight: false },
    { name: 'Lisboa', flag: '🇵🇹', isHighlight: false },
    { name: 'Miami', flag: '🇺🇸', isHighlight: false },
]

const DATA: Record<Metric, { value: number; label: string; unit: string }[]> = {
    'Preço/m²': [
        { value: 7800, label: 'R$ 7.800', unit: 'R$/m²' },
        { value: 14200, label: 'R$ 14.200', unit: 'R$/m²' },
        { value: 12400, label: 'R$ 12.400', unit: 'R$/m²' },
        { value: 6900, label: 'R$ 6.900', unit: 'R$/m²' },
        { value: 5400, label: 'R$ 5.400', unit: 'R$/m²' },
        { value: 18900, label: '€ 18.900', unit: '€/m²' },
        { value: 38000, label: '$ 38.000', unit: '$/m²' },
    ],
    'Yield': [
        { value: 7.2, label: '7.2%', unit: 'a.a.' },
        { value: 5.1, label: '5.1%', unit: 'a.a.' },
        { value: 4.8, label: '4.8%', unit: 'a.a.' },
        { value: 6.9, label: '6.9%', unit: 'a.a.' },
        { value: 7.8, label: '7.8%', unit: 'a.a.' },
        { value: 3.2, label: '3.2%', unit: 'a.a.' },
        { value: 3.8, label: '3.8%', unit: 'a.a.' },
    ],
    'Valorização': [
        { value: 12.4, label: '+12.4%', unit: '12m' },
        { value: 8.7, label: '+8.7%', unit: '12m' },
        { value: 6.2, label: '+6.2%', unit: '12m' },
        { value: 11.1, label: '+11.1%', unit: '12m' },
        { value: 9.8, label: '+9.8%', unit: '12m' },
        { value: 4.3, label: '+4.3%', unit: '12m' },
        { value: 5.9, label: '+5.9%', unit: '12m' },
    ],
}

const METRICS: Metric[] = ['Preço/m²', 'Yield', 'Valorização']

export function WidgetGlobalCompare() {
    const [metric, setMetric] = useState<Metric>('Preço/m²')
    const metricData = DATA[metric]
    const maxValue = Math.max(...metricData.map(d => d.value))

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Title */}
            <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', marginBottom: 2 }}>
                    Comparativo Global
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display,"Playfair Display",serif)' }}>
                    Recife vs Outras Cidades
                </div>
            </div>

            {/* Metric toggle */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 3 }}>
                {METRICS.map(m => (
                    <button
                        key={m}
                        onClick={() => setMetric(m)}
                        style={{
                            flex: 1,
                            padding: '5px 8px',
                            borderRadius: 6,
                            border: 'none',
                            background: metric === m ? 'var(--bg-surface)' : 'transparent',
                            color: metric === m ? 'var(--imi-gold-500,#C8A44A)' : 'var(--text-secondary)',
                            fontSize: 10,
                            fontWeight: metric === m ? 700 : 500,
                            fontFamily: 'var(--font-ui)',
                            cursor: 'pointer',
                            letterSpacing: '0.03em',
                            transition: 'all 0.2s',
                            boxShadow: metric === m ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                        }}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {/* Comparison bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {CITIES.map((city, i) => {
                    const d = metricData[i]
                    const barPct = (d.value / maxValue) * 100
                    const isHighlight = city.isHighlight

                    return (
                        <div key={city.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {/* City */}
                            <div style={{
                                width: 108, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                            }}>
                                <span style={{ fontSize: 13 }}>{city.flag}</span>
                                <span style={{
                                    fontSize: 11,
                                    fontWeight: isHighlight ? 700 : 400,
                                    color: isHighlight ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    fontFamily: 'var(--font-ui)',
                                }}>
                                    {city.name}
                                </span>
                            </div>

                            {/* Bar */}
                            <div style={{ flex: 1, height: 22, background: 'var(--border-default)', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${barPct}%`,
                                    background: isHighlight
                                        ? 'linear-gradient(90deg, var(--imi-gold-500,#C8A44A), rgba(200,164,74,0.7))'
                                        : 'linear-gradient(90deg, rgba(200,164,74,0.35), rgba(200,164,74,0.15))',
                                    borderRadius: 5,
                                    transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1)',
                                    display: 'flex', alignItems: 'center',
                                    paddingLeft: 8,
                                }}>
                                    {barPct > 25 && (
                                        <span style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: isHighlight ? 'var(--navy,#0B1928)' : 'var(--text-primary)',
                                        }}>
                                            {d.label}
                                        </span>
                                    )}
                                </div>
                                {barPct <= 25 && (
                                    <span style={{
                                        position: 'absolute',
                                        left: `${barPct + 2}%`,
                                        top: '50%', transform: 'translateY(-50%)',
                                        fontSize: 10, fontWeight: 600,
                                        color: 'var(--text-primary)',
                                    }}>
                                        {d.label}
                                    </span>
                                )}
                            </div>

                            {/* Unit */}
                            <div style={{ width: 28, fontSize: 8, color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0 }}>
                                {d.unit}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Recife highlight badge */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px',
                background: 'rgba(200,164,74,0.07)',
                border: '1px solid rgba(200,164,74,0.20)',
                borderRadius: 8,
            }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--imi-gold-500,#C8A44A)', flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>
                    Recife oferece melhor custo-benefício entre as capitais brasileiras em {metric.toLowerCase()}
                </span>
            </div>

            {/* Source */}
            <p style={{ fontSize: 9, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4, borderTop: '1px solid var(--border-default)', paddingTop: 8 }}>
                Dados: FipeZap, Idealista, Zillow — Fev/2026. Valores convertidos para comparação relativa.
            </p>
        </div>
    )
}
