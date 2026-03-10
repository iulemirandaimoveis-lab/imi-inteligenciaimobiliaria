/**
 * MarketReport — Relatório de Mercado IMI
 * Formato: 1:1 (Instagram / Facebook)
 * Duração: 10s @30fps = 300 frames
 */
import {
    AbsoluteFill, spring, useCurrentFrame, useVideoConfig,
    interpolate, Sequence,
} from 'remotion'

export interface MarketReportProps {
    month: string               // e.g. "Março 2026"
    headline: string            // e.g. "VGV cresce 18% em Recife"
    stats: Array<{
        label: string
        value: string
        change: string          // e.g. "+18%" or "-3%"
        positive: boolean
    }>
    insightText: string         // 2-3 lines of market insight
    accentColor?: string
    logoUrl?: string
}

function Counter({ frame, from, to, delay }: { frame: number; from: number; to: number; delay: number }) {
    const progress = interpolate(frame - delay, [0, 45], [0, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        easing: (t) => 1 - Math.pow(1 - t, 3),
    })
    return <>{Math.round(from + (to - from) * progress)}</>
}

function StatCard({
    stat, index, accentColor,
}: {
    stat: MarketReportProps['stats'][0]
    index: number
    accentColor: string
}) {
    const frame = useCurrentFrame()
    const delay = 60 + index * 18
    const opacity = interpolate(frame - delay, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    const y = spring({ fps: 30, frame: frame - delay, config: { stiffness: 200, damping: 22 }, durationInFrames: 30 })
    const translateY = interpolate(y, [0, 1], [30, 0])

    const changeColor = stat.positive ? '#34d399' : '#f87171'

    return (
        <div style={{
            opacity,
            transform: `translateY(${translateY}px)`,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Accent line top */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: 2,
                background: `linear-gradient(90deg, ${accentColor}, transparent)`,
            }} />

            <div style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.45)',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
            }}>
                {stat.label}
            </div>

            <div style={{
                fontSize: 32,
                fontWeight: 900,
                color: 'white',
                letterSpacing: '-1px',
                lineHeight: 1,
            }}>
                {stat.value}
            </div>

            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: stat.positive ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                borderRadius: 20,
                padding: '4px 10px',
                alignSelf: 'flex-start',
            }}>
                <span style={{ color: changeColor, fontSize: 14 }}>{stat.positive ? '▲' : '▼'}</span>
                <span style={{ color: changeColor, fontWeight: 700, fontSize: 14 }}>{stat.change}</span>
            </div>
        </div>
    )
}

export const MarketReport: React.FC<MarketReportProps> = ({
    month,
    headline,
    stats,
    insightText,
    accentColor = '#2C7BE5',
    logoUrl,
}) => {
    const frame = useCurrentFrame()
    const { durationInFrames } = useVideoConfig()

    const progress = (frame / durationInFrames) * 100

    // Header animations
    const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    const headlineY = spring({ fps: 30, frame: frame - 15, config: { stiffness: 160, damping: 22 }, durationInFrames: 40 })
    const headlineTranslate = interpolate(headlineY, [0, 1], [20, 0])

    // Insight text
    const insightOpacity = interpolate(frame, [120, 150], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

    const gridCols = stats.length <= 2 ? stats.length : 2

    return (
        <AbsoluteFill style={{
            background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1117 50%, #0a1929 100%)',
            fontFamily: "'Inter', -apple-system, sans-serif",
            padding: 60,
            display: 'flex',
            flexDirection: 'column',
            gap: 32,
        }}>
            {/* Header */}
            <div style={{ opacity: headerOpacity, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: accentColor,
                }}>
                    Relatório de Mercado · {month}
                </div>
                <div style={{
                    background: accentColor,
                    borderRadius: 8,
                    padding: '6px 14px',
                    fontWeight: 800,
                    fontSize: 14,
                    color: 'white',
                }}>
                    IMI
                </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

            {/* Headline */}
            <div style={{ transform: `translateY(${headlineTranslate}px)` }}>
                <div style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: 'white',
                    lineHeight: 1.2,
                    letterSpacing: '-0.8px',
                    marginBottom: 8,
                }}>
                    {headline}
                </div>
                <div style={{ height: 3, width: 60, background: accentColor, borderRadius: 2 }} />
            </div>

            {/* Stats grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                gap: 16,
                flex: 1,
            }}>
                {stats.slice(0, 4).map((stat, i) => (
                    <StatCard key={i} stat={stat} index={i} accentColor={accentColor} />
                ))}
            </div>

            {/* Insight text */}
            {insightText && (
                <div style={{
                    opacity: insightOpacity,
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${accentColor}33`,
                    borderRadius: 12,
                    padding: '16px 20px',
                    fontSize: 15,
                    color: 'rgba(255,255,255,0.6)',
                    lineHeight: 1.55,
                    fontStyle: 'italic',
                }}>
                    💡 {insightText}
                </div>
            )}

            {/* Footer */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: insightOpacity,
            }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
                    Fonte: IMI — Inteligência Imobiliária
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
                    imi.com.br
                </div>
            </div>

            {/* Progress bar */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.06)' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: accentColor }} />
            </div>
        </AbsoluteFill>
    )
}

export const marketReportDefaultProps: MarketReportProps = {
    month: 'Março 2026',
    headline: 'VGV cresce 18% em Recife',
    stats: [
        { label: 'VGV Total', value: 'R$ 2,1B', change: '+18%', positive: true },
        { label: 'Novas Unidades', value: '1.240', change: '+12%', positive: true },
        { label: 'Ticket Médio', value: 'R$ 680k', change: '+7%', positive: true },
        { label: 'Estoque', value: '340', change: '-5%', positive: false },
    ],
    insightText: 'Boa Viagem lidera com 38% do VGV total. Tendência de alta continua para Q2 2026.',
    accentColor: '#2C7BE5',
}
