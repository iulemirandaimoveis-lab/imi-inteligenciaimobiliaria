'use client'
import { useState, useMemo } from 'react'

const CDI_RATE = 10.5 // % a.a.

function formatBRL(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatPct(v: number): string {
    return v.toFixed(2) + '%'
}

interface DonutProps {
    capitalPct: number // 0–100
    rentalPct: number  // 0–100 (remainder)
    size?: number
}

function DonutChart({ capitalPct, rentalPct, size = 110 }: DonutProps) {
    const cx = size / 2, cy = size / 2
    const r = size * 0.38
    const stroke = size * 0.14

    const toRad = (deg: number) => (deg * Math.PI) / 180
    const circumference = 2 * Math.PI * r

    // Capital segment
    const capDash = (capitalPct / 100) * circumference
    // Rental segment starts after capital
    const renDash = (rentalPct / 100) * circumference
    const capOffset = 0
    const renOffset = -(capDash) // rotate to start after capital

    // Convert to SVG arc for better rendering
    const capAngle = (capitalPct / 100) * 360
    const renAngle = (rentalPct / 100) * 360

    const polarToCart = (angleDeg: number) => ({
        x: cx + r * Math.cos(toRad(angleDeg - 90)),
        y: cy + r * Math.sin(toRad(angleDeg - 90)),
    })

    const arcPath = (startDeg: number, endDeg: number) => {
        const s = polarToCart(startDeg)
        const e = polarToCart(endDeg)
        const la = endDeg - startDeg > 180 ? 1 : 0
        return `M ${s.x} ${s.y} A ${r} ${r} 0 ${la} 1 ${e.x} ${e.y}`
    }

    const capStart = 0, capEnd = capAngle
    const renStart = capAngle, renEnd = capAngle + renAngle

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <defs>
                <linearGradient id="capGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--bo-accent,#C8A44A)" />
                    <stop offset="100%" stopColor="rgba(200,164,74,0.6)" />
                </linearGradient>
                <linearGradient id="renGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--bo-success,#2D8F5C)" />
                    <stop offset="100%" stopColor="rgba(45,143,92,0.6)" />
                </linearGradient>
            </defs>

            {/* Background ring */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bo-border)" strokeWidth={stroke} />

            {/* Capital arc */}
            {capAngle > 0 && capAngle < 360 && (
                <path d={arcPath(capStart, capEnd)} fill="none"
                    stroke="url(#capGrad)" strokeWidth={stroke} strokeLinecap="butt" />
            )}
            {capAngle >= 360 && (
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#capGrad)" strokeWidth={stroke} />
            )}

            {/* Rental arc */}
            {renAngle > 0 && capAngle < 360 && (
                <path d={arcPath(renStart, renEnd)} fill="none"
                    stroke="url(#renGrad)" strokeWidth={stroke} strokeLinecap="butt" />
            )}

            {/* Center text */}
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize={size * 0.16} fontWeight="700"
                fill="var(--bo-text)" fontFamily="Playfair Display, serif">
                ROI
            </text>
            <text x={cx} y={cy + size * 0.12} textAnchor="middle" fontSize={size * 0.11}
                fill="var(--bo-text-muted)" fontFamily="Montserrat, sans-serif">
                total
            </text>
        </svg>
    )
}

export function WidgetRoiCalc() {
    const [compraBRL, setCompraBRL] = useState(400000)
    const [atualBRL, setAtualBRL] = useState(520000)
    const [anos, setAnos] = useState(5)
    const [aluguelMes, setAluguelMes] = useState(2200)

    const {
        ganhoCapital, rendaTotal, roiTotal, roiAnual,
        capitalPct, rentalPct, cdiEquiv,
    } = useMemo(() => {
        const ganhoCapital = Math.max(0, atualBRL - compraBRL)
        const rendaTotal = aluguelMes * 12 * anos
        const totalRetorno = ganhoCapital + rendaTotal
        const roiTotal = compraBRL > 0 ? (totalRetorno / compraBRL) * 100 : 0
        const roiAnual = anos > 0 ? (Math.pow(1 + roiTotal / 100, 1 / anos) - 1) * 100 : 0
        const capitalPct = totalRetorno > 0 ? (ganhoCapital / totalRetorno) * 100 : 50
        const rentalPct = 100 - capitalPct

        // CDI equivalent total
        const cdiEquiv = compraBRL * (Math.pow(1 + CDI_RATE / 100, anos) - 1)

        return { ganhoCapital, rendaTotal, roiTotal, roiAnual, capitalPct, rentalPct, cdiEquiv }
    }, [compraBRL, atualBRL, anos, aluguelMes])

    const inputStyle: React.CSSProperties = {
        width: '100%',
        background: 'var(--bo-bg)',
        border: '1px solid var(--bo-border)',
        borderRadius: 6,
        padding: '7px 10px',
        fontSize: 13,
        color: 'var(--bo-text)',
        fontFamily: 'var(--font-ui)',
        outline: 'none',
        boxSizing: 'border-box',
    }

    const labelStyle: React.CSSProperties = {
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        color: 'var(--bo-text-muted)',
        fontFamily: 'var(--font-ui)',
        marginBottom: 4,
        display: 'block',
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Title */}
            <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bo-text-muted)', fontFamily: 'var(--font-ui)', marginBottom: 2 }}>
                    Análise de Investimento
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--bo-text)', fontFamily: 'var(--font-display,"Playfair Display",serif)' }}>
                    Calculadora de ROI
                </div>
            </div>

            {/* Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px' }}>
                <div>
                    <label style={labelStyle}>Valor de Compra (R$)</label>
                    <input style={inputStyle} type="number" value={compraBRL}
                        onChange={e => setCompraBRL(Math.max(0, Number(e.target.value)))} />
                </div>
                <div>
                    <label style={labelStyle}>Valor Atual Est. (R$)</label>
                    <input style={inputStyle} type="number" value={atualBRL}
                        onChange={e => setAtualBRL(Math.max(0, Number(e.target.value)))} />
                </div>
                <div>
                    <label style={labelStyle}>Aluguel Recebido (R$/mês)</label>
                    <input style={inputStyle} type="number" value={aluguelMes}
                        onChange={e => setAluguelMes(Math.max(0, Number(e.target.value)))} />
                </div>
                <div>
                    <label style={labelStyle}>Anos de Posse</label>
                    <input style={inputStyle} type="number" min={1} max={30} value={anos}
                        onChange={e => setAnos(Math.max(1, Number(e.target.value)))} />
                </div>
            </div>

            {/* Donut + stats row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <DonutChart capitalPct={capitalPct} rentalPct={rentalPct} />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                        <div style={{ fontSize: 9, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>ROI Total</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--bo-accent,#C8A44A)', fontFamily: 'var(--font-display,"Playfair Display",serif)', lineHeight: 1 }}>
                            {formatPct(roiTotal)}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 9, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>ROI Anualizado</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: roiAnual > CDI_RATE ? 'var(--bo-success,#2D8F5C)' : 'var(--bo-text)', fontFamily: 'var(--font-ui)' }}>
                            {formatPct(roiAnual)} a.a.
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--bo-accent,#C8A44A)' }} />
                    <span style={{ fontSize: 10, color: 'var(--bo-text-muted)' }}>Ganho de capital</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--bo-success,#2D8F5C)' }} />
                    <span style={{ fontSize: 10, color: 'var(--bo-text-muted)' }}>Renda de aluguel</span>
                </div>
            </div>

            {/* Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                    { label: 'Ganho Capital', value: formatBRL(ganhoCapital), color: 'var(--bo-accent,#C8A44A)' },
                    { label: `Renda Aluguel (${anos}a)`, value: formatBRL(rendaTotal), color: 'var(--bo-success,#2D8F5C)' },
                ].map(s => (
                    <div key={s.label} style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)', borderRadius: 8, padding: '8px 12px' }}>
                        <div style={{ fontSize: 9, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: 'var(--font-ui)' }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* CDI comparison */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px',
                background: 'var(--bo-surface)',
                border: '1px solid var(--bo-border)',
                borderRadius: 8,
            }}>
                <div>
                    <div style={{ fontSize: 9, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
                        CDI no mesmo período
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bo-text-muted)', fontFamily: 'var(--font-ui)' }}>
                        {CDI_RATE}% a.a. × {anos} anos
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--bo-text-muted)', fontFamily: 'var(--font-ui)' }}>
                        {formatBRL(cdiEquiv)}
                    </div>
                    <div style={{
                        fontSize: 10, fontWeight: 600, marginTop: 2,
                        color: ganhoCapital + rendaTotal > cdiEquiv ? 'var(--bo-success,#2D8F5C)' : '#E05A5A',
                    }}>
                        {ganhoCapital + rendaTotal > cdiEquiv
                            ? `▲ Imóvel supera CDI em ${formatBRL(ganhoCapital + rendaTotal - cdiEquiv)}`
                            : `▼ CDI supera imóvel em ${formatBRL(cdiEquiv - ganhoCapital - rendaTotal)}`
                        }
                    </div>
                </div>
            </div>

            {/* CTA */}
            <button style={{
                background: 'transparent',
                border: '1px solid var(--bo-accent,#C8A44A)',
                borderRadius: 7,
                padding: '9px 16px',
                color: 'var(--bo-accent,#C8A44A)',
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'var(--font-ui)',
                cursor: 'pointer',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                transition: 'background 0.2s',
            }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,164,74,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
                Simular nova propriedade
            </button>
        </div>
    )
}
