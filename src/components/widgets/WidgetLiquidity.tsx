'use client'

const LIQUIDITY_SCORE = 73
const GAUGE_VALUE = LIQUIDITY_SCORE // 0–100

const SEGMENTS = [
    { name: 'Apartamento 2Q', score: 89, label: '89 pts' },
    { name: 'Cobertura', score: 41, label: '41 pts' },
    { name: 'Casa', score: 58, label: '58 pts' },
    { name: 'Comercial', score: 34, label: '34 pts' },
]

function getLiquidityLabel(score: number): { text: string; color: string } {
    if (score >= 70) return { text: 'Alta Liquidez', color: 'var(--success,#2D8F5C)' }
    if (score >= 45) return { text: 'Liquidez Média', color: 'var(--accent-400,#3D6FFF)' }
    return { text: 'Baixa Liquidez', color: '#E05A5A' }
}

function GaugeArc({ value }: { value: number }) {
    const cx = 80, cy = 80, r = 60
    // Arc from 180° to 0° (left to right, bottom semicircle excluded)
    // We use -210° to 30° (240° total arc)
    const startAngleDeg = 210
    const totalDeg = 240
    const endAngleDeg = startAngleDeg - totalDeg // = -30

    const toRad = (deg: number) => (deg * Math.PI) / 180

    // Track arc: from 210° to -30° (going counter-clockwise i.e. decreasing angle)
    const trackStart = { x: cx + r * Math.cos(toRad(210)), y: cy - r * Math.sin(toRad(210)) }
    const trackEnd = { x: cx + r * Math.cos(toRad(-30)), y: cy - r * Math.sin(toRad(-30)) }

    // Value arc
    const valueAngle = 210 - (value / 100) * 240
    const valueEnd = { x: cx + r * Math.cos(toRad(valueAngle)), y: cy - r * Math.sin(toRad(valueAngle)) }
    const largeArc = (value / 100) * 240 > 180 ? 1 : 0

    // Needle
    const needleAngle = toRad(valueAngle)
    const needleLen = 45
    const needleX = cx + needleLen * Math.cos(needleAngle)
    const needleY = cy - needleLen * Math.sin(needleAngle)

    // Zone colors
    // Low: 0-40 red, Medium: 40-70 gold, High: 70-100 green
    // We'll draw three arc segments
    const zoneArcs = [
        { from: 210, to: 210 - 96, color: '#E05A5A', label: '' },   // 0–40: 96°
        { from: 210 - 96, to: 210 - 168, color: 'var(--accent-400,#3D6FFF)', label: '' }, // 40–70: 72°
        { from: 210 - 168, to: 210 - 240, color: 'var(--success,#2D8F5C)', label: '' }, // 70–100: 72°
    ]

    const arcPath = (from: number, to: number) => {
        const s = { x: cx + r * Math.cos(toRad(from)), y: cy - r * Math.sin(toRad(from)) }
        const e = { x: cx + r * Math.cos(toRad(to)), y: cy - r * Math.sin(toRad(to)) }
        const la = Math.abs(from - to) > 180 ? 1 : 0
        return `M ${s.x} ${s.y} A ${r} ${r} 0 ${la} 1 ${e.x} ${e.y}`
    }

    return (
        <svg width="160" height="110" viewBox="0 0 160 110">
            <defs>
                <linearGradient id="valueGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--accent-400,#3D6FFF)" />
                    <stop offset="100%" stopColor="var(--success,#2D8F5C)" />
                </linearGradient>
            </defs>

            {/* Zone track arcs */}
            {zoneArcs.map((z, i) => (
                <path key={i} d={arcPath(z.from, z.to)} fill="none" stroke={z.color}
                    strokeWidth="8" strokeLinecap="butt" opacity="0.18" />
            ))}

            {/* Value arc */}
            <path
                d={`M ${trackStart.x} ${trackStart.y} A ${r} ${r} 0 ${largeArc} 1 ${valueEnd.x} ${valueEnd.y}`}
                fill="none"
                stroke="url(#valueGrad)"
                strokeWidth="8"
                strokeLinecap="round"
            />

            {/* Needle */}
            <line x1={cx} y1={cy} x2={needleX} y2={needleY}
                stroke="var(--text-primary)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx={cx} cy={cy} r="5" fill="var(--text-primary)" />
            <circle cx={cx} cy={cy} r="2.5" fill="var(--bg-base)" />

            {/* Tick marks */}
            {[0, 25, 50, 75, 100].map(v => {
                const a = toRad(210 - (v / 100) * 240)
                const r1 = r + 6, r2 = r + 12
                return (
                    <line key={v}
                        x1={cx + r1 * Math.cos(a)} y1={cy - r1 * Math.sin(a)}
                        x2={cx + r2 * Math.cos(a)} y2={cy - r2 * Math.sin(a)}
                        stroke="var(--border-default)" strokeWidth="1.5" />
                )
            })}

            {/* Labels */}
            <text x={cx + (r + 18) * Math.cos(toRad(210))} y={cy - (r + 18) * Math.sin(toRad(210))}
                fontSize="8" fill="var(--text-secondary)" textAnchor="middle">0</text>
            <text x={cx + (r + 18) * Math.cos(toRad(-30))} y={cy - (r + 18) * Math.sin(toRad(-30))}
                fontSize="8" fill="var(--text-secondary)" textAnchor="middle">100</text>
        </svg>
    )
}

export function WidgetLiquidity() {
    const { text: liquidityText, color: liquidityColor } = getLiquidityLabel(LIQUIDITY_SCORE)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Title */}
            <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', marginBottom: 2 }}>
                    Mercado Recife
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display,"Playfair Display",serif)' }}>
                    Índice de Liquidez
                </div>
            </div>

            {/* Gauge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <GaugeArc value={GAUGE_VALUE} />
                <div style={{ textAlign: 'center', marginTop: -4 }}>
                    <div style={{
                        fontSize: 36, fontWeight: 700,
                        color: liquidityColor,
                        fontFamily: 'var(--font-display,"Playfair Display",serif)',
                        lineHeight: 1,
                    }}>
                        {LIQUIDITY_SCORE}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: liquidityColor, marginTop: 4 }}>
                        {liquidityText}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Tempo Médio de Venda</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display,"Playfair Display",serif)', lineHeight: 1 }}>47</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>dias</div>
                </div>
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Absorção Mensal</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display,"Playfair Display",serif)', lineHeight: 1 }}>12.4%</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>do estoque</div>
                </div>
            </div>

            {/* By segment */}
            <div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Por Segmento
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {SEGMENTS.map(seg => (
                        <div key={seg.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 110, fontSize: 11, color: 'var(--text-primary)', flexShrink: 0 }}>{seg.name}</div>
                            <div style={{ flex: 1, height: 7, background: 'var(--border-default)', borderRadius: 6, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${seg.score}%`,
                                    background: seg.score >= 70
                                        ? 'var(--success,#2D8F5C)'
                                        : seg.score >= 45
                                            ? 'var(--accent-400,#3D6FFF)'
                                            : '#E05A5A',
                                    borderRadius: 6,
                                    opacity: 0.8,
                                    transition: 'width 0.4s ease',
                                }} />
                            </div>
                            <div style={{ width: 42, textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                {seg.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Badge */}
            <div style={{
                display: 'inline-flex', alignSelf: 'flex-start',
                alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 6,
                background: 'rgba(45,143,92,0.10)',
                border: '1px solid rgba(45,143,92,0.25)',
            }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success,#2D8F5C)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success,#2D8F5C)' }}>
                    Mercado em expansão
                </span>
            </div>
        </div>
    )
}
