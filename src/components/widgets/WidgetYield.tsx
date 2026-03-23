'use client'
import { useState, useMemo } from 'react'

const BENCHMARK = 5.8
const NEIGHBORHOODS = [
    { name: 'Recife Antigo', yield: 7.2 },
    { name: 'Boa Viagem', yield: 5.8 },
    { name: 'Casa Forte', yield: 4.9 },
    { name: 'Pina', yield: 6.3 },
]

function parseBRL(v: string): number {
    return parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0
}

function formatBRL(v: number): string {
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function WidgetYield() {
    const [valorImovel, setValorImovel] = useState('500000')
    const [aluguelMensal, setAluguelMensal] = useState('2500')
    const [iptu, setIptu] = useState('300')
    const [condominio, setCondominio] = useState('600')

    const { yieldBruto, yieldLiquido } = useMemo(() => {
        const valor = parseBRL(valorImovel)
        const aluguel = parseBRL(aluguelMensal)
        const custos = parseBRL(iptu) + parseBRL(condominio)
        if (!valor || valor === 0) return { yieldBruto: 0, yieldLiquido: 0 }
        const yieldBruto = ((aluguel * 12) / valor) * 100
        const yieldLiquido = (((aluguel - custos) * 12) / valor) * 100
        return { yieldBruto, yieldLiquido }
    }, [valorImovel, aluguelMensal, iptu, condominio])

    const barWidth = Math.min((yieldBruto / 12) * 100, 100)
    const benchmarkPos = (BENCHMARK / 12) * 100

    const inputStyle: React.CSSProperties = {
        width: '100%',
        background: 'var(--bg-base)',
        border: '1px solid var(--border-default)',
        borderRadius: 6,
        padding: '7px 10px',
        fontSize: 13,
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-ui)',
        outline: 'none',
        boxSizing: 'border-box',
    }

    const labelStyle: React.CSSProperties = {
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-ui)',
        marginBottom: 4,
        display: 'block',
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Title */}
            <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', marginBottom: 2 }}>
                    Calculadora de Yield
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display,"Playfair Display",serif)' }}>
                    Retorno sobre Aluguel
                </div>
            </div>

            {/* Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px' }}>
                <div>
                    <label style={labelStyle}>Valor do Imóvel (R$)</label>
                    <input
                        style={inputStyle}
                        value={valorImovel}
                        onChange={e => setValorImovel(e.target.value.replace(/\D/g, ''))}
                        placeholder="500000"
                    />
                </div>
                <div>
                    <label style={labelStyle}>Aluguel Mensal (R$)</label>
                    <input
                        style={inputStyle}
                        value={aluguelMensal}
                        onChange={e => setAluguelMensal(e.target.value.replace(/\D/g, ''))}
                        placeholder="2500"
                    />
                </div>
                <div>
                    <label style={labelStyle}>IPTU Mensal (R$)</label>
                    <input
                        style={inputStyle}
                        value={iptu}
                        onChange={e => setIptu(e.target.value.replace(/\D/g, ''))}
                        placeholder="300"
                    />
                </div>
                <div>
                    <label style={labelStyle}>Condomínio (R$)</label>
                    <input
                        style={inputStyle}
                        value={condominio}
                        onChange={e => setCondominio(e.target.value.replace(/\D/g, ''))}
                        placeholder="600"
                    />
                </div>
            </div>

            {/* Results */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: 'rgba(200,164,74,0.08)', border: '1px solid rgba(200,164,74,0.25)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Yield Bruto a.a.</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent-400,#C8A44A)', fontFamily: 'var(--font-display,"Playfair Display",serif)', lineHeight: 1 }}>
                        {yieldBruto.toFixed(2)}%
                    </div>
                </div>
                <div style={{ background: 'rgba(45,143,92,0.08)', border: '1px solid rgba(45,143,92,0.20)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Yield Líquido a.a.</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: yieldLiquido >= BENCHMARK ? 'var(--success,#2D8F5C)' : 'var(--text-primary)', fontFamily: 'var(--font-display,"Playfair Display",serif)', lineHeight: 1 }}>
                        {yieldLiquido.toFixed(2)}%
                    </div>
                </div>
            </div>

            {/* Benchmark bar */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Seu yield vs média Recife</span>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Benchmark: {BENCHMARK}% a.a.</span>
                </div>
                <div style={{ position: 'relative', height: 10, background: 'var(--border-default)', borderRadius: 5, overflow: 'visible' }}>
                    {/* Your yield bar */}
                    <div style={{
                        position: 'absolute', left: 0, top: 0, height: '100%',
                        width: `${barWidth}%`,
                        background: 'linear-gradient(90deg, var(--accent-400,#C8A44A), rgba(200,164,74,0.6))',
                        borderRadius: 5,
                        transition: 'width 0.4s ease',
                    }} />
                    {/* Benchmark line */}
                    <div style={{
                        position: 'absolute', top: -3, bottom: -3,
                        left: `${benchmarkPos}%`,
                        width: 2, background: 'var(--text-primary)', borderRadius: 1,
                        opacity: 0.5,
                    }} />
                </div>
            </div>

            {/* Neighborhood comparison */}
            <div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Comparativo por Bairro
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {NEIGHBORHOODS.map(n => (
                        <div key={n.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 90, fontSize: 11, color: 'var(--text-primary)', flexShrink: 0, fontFamily: 'var(--font-ui)' }}>{n.name}</div>
                            <div style={{ flex: 1, height: 6, background: 'var(--border-default)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${(n.yield / 10) * 100}%`,
                                    background: n.yield >= BENCHMARK
                                        ? 'linear-gradient(90deg, var(--accent-400,#C8A44A), rgba(200,164,74,0.7))'
                                        : 'linear-gradient(90deg, rgba(200,164,74,0.5), rgba(200,164,74,0.3))',
                                    borderRadius: 3,
                                }} />
                            </div>
                            <div style={{
                                width: 38, textAlign: 'right', fontSize: 11, fontWeight: 600,
                                color: n.yield >= BENCHMARK ? 'var(--accent-400,#C8A44A)' : 'var(--text-secondary)',
                                fontFamily: 'var(--font-ui)',
                            }}>
                                {n.yield.toFixed(1)}%
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <p style={{ fontSize: 9, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4, borderTop: '1px solid var(--border-default)', paddingTop: 8 }}>
                Yield líquido calculado após IPTU e condomínio. Não inclui IR, vacância ou manutenção.
            </p>
        </div>
    )
}
