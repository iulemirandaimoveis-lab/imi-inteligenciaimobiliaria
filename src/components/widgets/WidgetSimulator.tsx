'use client'
import { useState, useMemo } from 'react'

function formatBRL(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function calcPrice(principal: number, annualRate: number, months: number): number {
    if (annualRate === 0) return principal / months
    const r = annualRate / 100 / 12
    return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
}

export function WidgetSimulator() {
    const [valorImovel, setValorImovel] = useState(500000)
    const [entrada, setEntrada] = useState(20)
    const [prazo, setPrazo] = useState(30)
    const [taxa, setTaxa] = useState(10.5)

    const { parcela, totalFinanciado, totalPago, totalJuros, amortPoints } = useMemo(() => {
        const totalFinanciado = valorImovel * (1 - entrada / 100)
        const months = prazo * 12
        const parcela = calcPrice(totalFinanciado, taxa, months)
        const totalPago = parcela * months
        const totalJuros = totalPago - totalFinanciado

        // Build amortization sparkline (sample every year)
        const r = taxa / 100 / 12
        const amortPoints: number[] = []
        let saldo = totalFinanciado
        for (let year = 0; year <= prazo; year += Math.max(1, Math.floor(prazo / 12))) {
            amortPoints.push(saldo)
            // Advance one year
            for (let m = 0; m < 12 && year < prazo; m++) {
                const juros = saldo * r
                const amort = parcela - juros
                saldo = Math.max(0, saldo - amort)
            }
        }
        amortPoints.push(0)

        return { parcela, totalFinanciado, totalPago, totalJuros, amortPoints }
    }, [valorImovel, entrada, prazo, taxa])

    // Sparkline
    const spW = 300, spH = 60
    const spMax = amortPoints[0] || 1
    const spPts = amortPoints.map((v, i) =>
        `${(i / (amortPoints.length - 1)) * spW},${spH - (v / spMax) * (spH - 6) - 2}`
    ).join(' ')

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

    const sliderStyle: React.CSSProperties = {
        width: '100%',
        accentColor: 'var(--bo-accent,#C8A44A)',
        cursor: 'pointer',
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Title */}
            <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bo-text-muted)', fontFamily: 'var(--font-ui)', marginBottom: 2 }}>
                    Simulador
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--bo-text)', fontFamily: 'var(--font-display,"Playfair Display",serif)' }}>
                    Financiamento Imobiliário
                </div>
            </div>

            {/* Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px' }}>
                    <div>
                        <label style={labelStyle}>Valor do Imóvel (R$)</label>
                        <input
                            style={inputStyle}
                            type="number"
                            value={valorImovel}
                            onChange={e => setValorImovel(Math.max(0, Number(e.target.value)))}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Taxa de Juros (% a.a.)</label>
                        <input
                            style={inputStyle}
                            type="number"
                            step="0.1"
                            value={taxa}
                            onChange={e => setTaxa(Math.max(0, Number(e.target.value)))}
                        />
                    </div>
                </div>

                {/* Entrada slider */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>Entrada</label>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--bo-accent,#C8A44A)' }}>
                            {entrada}% — {formatBRL(valorImovel * entrada / 100)}
                        </span>
                    </div>
                    <input type="range" min={5} max={80} step={5} value={entrada}
                        onChange={e => setEntrada(Number(e.target.value))} style={sliderStyle} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                        <span style={{ fontSize: 9, color: 'var(--bo-text-muted)' }}>5%</span>
                        <span style={{ fontSize: 9, color: 'var(--bo-text-muted)' }}>80%</span>
                    </div>
                </div>

                {/* Prazo slider */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>Prazo</label>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--bo-accent,#C8A44A)' }}>
                            {prazo} anos ({prazo * 12} meses)
                        </span>
                    </div>
                    <input type="range" min={10} max={35} step={5} value={prazo}
                        onChange={e => setPrazo(Number(e.target.value))} style={sliderStyle} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                        <span style={{ fontSize: 9, color: 'var(--bo-text-muted)' }}>10 anos</span>
                        <span style={{ fontSize: 9, color: 'var(--bo-text-muted)' }}>35 anos</span>
                    </div>
                </div>
            </div>

            {/* Parcela destaque */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(200,164,74,0.12), rgba(200,164,74,0.05))',
                border: '1px solid rgba(200,164,74,0.30)',
                borderRadius: 10, padding: '14px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <div>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--bo-text-muted)', marginBottom: 4 }}>Parcela Mensal</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--bo-accent,#C8A44A)', fontFamily: 'var(--font-display,"Playfair Display",serif)', lineHeight: 1 }}>
                        {formatBRL(parcela)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--bo-text-muted)', marginTop: 4 }}>
                        Sistema Price — {prazo * 12} parcelas
                    </div>
                </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                    { label: 'Total Financiado', value: formatBRL(totalFinanciado) },
                    { label: 'Total Pago', value: formatBRL(totalPago) },
                    { label: 'Total Juros', value: formatBRL(totalJuros) },
                ].map(s => (
                    <div key={s.label} style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)', borderRadius: 7, padding: '8px 10px' }}>
                        <div style={{ fontSize: 8, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>{s.label}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--bo-text)', fontFamily: 'var(--font-ui)' }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Amortization sparkline */}
            <div>
                <div style={{ fontSize: 9, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                    Evolução do Saldo Devedor
                </div>
                <svg width="100%" viewBox={`0 0 ${spW} ${spH}`} preserveAspectRatio="none" style={{ height: spH }}>
                    <defs>
                        <linearGradient id="amortGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--bo-accent,#C8A44A)" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="var(--bo-accent,#C8A44A)" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <polyline points={`${spPts} ${spW},${spH} 0,${spH}`} fill="url(#amortGrad)" stroke="none" />
                    <polyline points={spPts} fill="none" stroke="var(--bo-accent,#C8A44A)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
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
                Ver tabela completa
            </button>
        </div>
    )
}
