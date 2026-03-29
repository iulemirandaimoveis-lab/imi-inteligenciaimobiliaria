/**
 * PropertyIntelligence — IMI Score + Market Intelligence for public property pages
 * Server component — uses score.service pure functions
 */

import type { IMIProperty } from '@/features/properties/types'
import {
    calcIMIScore,
    calcYieldEst,
    calcMarketDelta,
    calcLiquidityIndex,
    calcPricePerSqm,
    getScoreColor,
    getScoreLabel,
} from '@/features/properties/services/score.service'

interface Props {
    property: IMIProperty
}

export default function PropertyIntelligence({ property }: Props) {
    const score = calcIMIScore(property)
    const yieldEst = calcYieldEst(property)
    const marketDelta = calcMarketDelta(property)
    const liquidity = calcLiquidityIndex(property)
    const pricePerSqm = calcPricePerSqm(property.price, property.area)
    const scoreColor = getScoreColor(score)
    const scoreLabel = getScoreLabel(score)

    // Generate insights based on computed data
    const insights: string[] = []
    if (marketDelta > 5) insights.push(`Preço ${marketDelta.toFixed(1)}% abaixo da média do bairro — oportunidade de valorização.`)
    else if (marketDelta < -5) insights.push(`Preço ${Math.abs(marketDelta).toFixed(1)}% acima da média do bairro — posicionamento premium.`)
    else insights.push('Preço alinhado com a média do bairro — boa relação custo-benefício.')

    if (yieldEst >= 6) insights.push(`Yield estimado de ${yieldEst}% a.a. — acima da média para a região.`)
    else if (yieldEst >= 4.5) insights.push(`Yield estimado de ${yieldEst}% a.a. — dentro da média de mercado.`)
    else insights.push(`Yield estimado de ${yieldEst}% a.a. — perfil de valorização patrimonial.`)

    if (liquidity >= 70) insights.push('Alta liquidez — bairro com forte demanda e baixo tempo médio de venda.')
    else if (liquidity >= 40) insights.push('Liquidez moderada — demanda estável com tempo de venda dentro da média.')
    else insights.push('Liquidez seletiva — mercado de nicho com compradores específicos.')

    const metrics = [
        { label: 'Yield Est.', value: `${yieldEst}%`, sub: 'a.a.', color: '#2563EB' },
        { label: 'vs Mercado', value: `${marketDelta > 0 ? '+' : ''}${marketDelta.toFixed(1)}%`, sub: marketDelta > 0 ? 'abaixo' : 'acima', color: marketDelta > 0 ? '#16A34A' : '#DC2626' },
        { label: 'Liquidez', value: `${liquidity}`, sub: '/100', color: '#7C3AED' },
        ...(pricePerSqm ? [{ label: 'R$/m²', value: pricePerSqm.toLocaleString('pt-BR'), sub: '', color: '#0B1928' }] : []),
    ]

    return (
        <div style={{
            background: '#FFFFFF',
            border: '1px solid rgba(184,179,168,0.3)',
            borderRadius: 20,
            padding: '32px 28px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 32, height: 2, borderRadius: 1, background: '#B8B3A8' }} />
                <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.25em', fontWeight: 700, color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                    Inteligência IMI
                </span>
            </div>
            <h3 style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#0B1928',
                fontFamily: "var(--font-heading, 'Playfair Display', serif)",
                margin: '0 0 24px',
            }}>
                Análise de Investimento
            </h3>

            {/* IMI Score Hero */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                marginBottom: 28,
                padding: '20px 24px',
                background: '#0B1928',
                borderRadius: 16,
            }}>
                {/* Score Circle */}
                <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: `conic-gradient(${scoreColor} ${score * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <div style={{
                        width: 58,
                        height: 58,
                        borderRadius: '50%',
                        background: '#0B1928',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                    }}>
                        <span style={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: scoreColor,
                            fontFamily: "var(--fm, 'JetBrains Mono', monospace)",
                            lineHeight: 1,
                        }}>
                            {score}
                        </span>
                    </div>
                </div>
                <div>
                    <p style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.2em',
                        color: '#C8A44A',
                        margin: '0 0 4px',
                        fontFamily: "var(--fu, 'Outfit', sans-serif)",
                    }}>
                        IMI Score
                    </p>
                    <p style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#FFFFFF',
                        margin: '0 0 2px',
                        fontFamily: "var(--font-heading, 'Playfair Display', serif)",
                    }}>
                        {scoreLabel}
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                        Análise composta de 5 fatores
                    </p>
                </div>
            </div>

            {/* Metrics Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 12,
                marginBottom: 24,
            }}>
                {metrics.map((m, i) => (
                    <div key={i} style={{
                        background: '#F8F6F2',
                        border: '1px solid rgba(184,179,168,0.3)',
                        borderRadius: 14,
                        padding: '14px 12px',
                        textAlign: 'center',
                    }}>
                        <p style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em',
                            color: '#948F84',
                            margin: '0 0 6px',
                            fontFamily: "var(--fu, 'Outfit', sans-serif)",
                        }}>
                            {m.label}
                        </p>
                        <p style={{
                            fontSize: 22,
                            fontWeight: 700,
                            color: m.color,
                            fontFamily: "var(--fm, 'JetBrains Mono', monospace)",
                            margin: 0,
                            lineHeight: 1,
                        }}>
                            {m.value}
                        </p>
                        {m.sub && (
                            <p style={{ fontSize: 11, color: '#948F84', margin: '2px 0 0' }}>{m.sub}</p>
                        )}
                    </div>
                ))}
            </div>

            {/* Insights */}
            <div style={{
                borderTop: '1px solid rgba(184,179,168,0.3)',
                paddingTop: 20,
            }}>
                <p style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    color: '#948F84',
                    margin: '0 0 12px',
                    fontFamily: "var(--fu, 'Outfit', sans-serif)",
                }}>
                    Insights
                </p>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {insights.map((text, i) => (
                        <li key={i} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 8,
                            fontSize: 13,
                            color: '#4A4539',
                            lineHeight: 1.5,
                        }}>
                            <span style={{ color: '#C8A44A', fontWeight: 700, flexShrink: 0 }}>•</span>
                            {text}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Disclaimer */}
            <p style={{
                fontSize: 10,
                color: '#B8B3A8',
                margin: '16px 0 0',
                lineHeight: 1.5,
            }}>
                Índices calculados por algoritmos IMI. Consulte para avaliação formal NBR 14653.
            </p>
        </div>
    )
}
