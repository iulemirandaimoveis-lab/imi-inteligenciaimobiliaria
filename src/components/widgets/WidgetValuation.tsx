'use client'

import { useState } from 'react'

const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const BRAZIL_LOCATION_TREE: Record<string, Record<string, string[]>> = {
    'AC': { 'Rio Branco': ['Bosque', 'Estação Experimental', 'Vila Ivonete'] },
    'AL': { 'Maceió': ['Ponta Verde', 'Jatiúca', 'Farol'] },
    'AP': { 'Macapá': ['Trem', 'Santa Rita', 'Central'] },
    'AM': { 'Manaus': ['Adrianópolis', 'Ponta Negra', 'Flores'] },
    'BA': { 'Salvador': ['Barra', 'Pituba', 'Rio Vermelho'] },
    'CE': { 'Fortaleza': ['Meireles', 'Aldeota', 'Cocó'] },
    'DF': { 'Brasília': ['Asa Sul', 'Asa Norte', 'Lago Sul'] },
    'ES': { 'Vitória': ['Praia do Canto', 'Jardim da Penha', 'Mata da Praia'] },
    'GO': { 'Goiânia': ['Setor Bueno', 'Marista', 'Jardim Goiás'] },
    'MA': { 'São Luís': ['Ponta d Areia', 'Calhau', 'Renascença'] },
    'MT': { 'Cuiabá': ['Goiabeiras', 'Duque de Caxias', 'Araés'] },
    'MS': { 'Campo Grande': ['Jardim dos Estados', 'Chácara Cachoeira', 'Vila Nasser'] },
    'MG': { 'Belo Horizonte': ['Savassi', 'Lourdes', 'Funcionários'] },
    'PA': { 'Belém': ['Umarizal', 'Nazaré', 'Batista Campos'] },
    'PB': { 'João Pessoa': ['Tambaú', 'Manaíra', 'Cabo Branco'] },
    'PR': { 'Curitiba': ['Batel', 'Água Verde', 'Bigorrilho'] },
    'PE': { 'Recife': ['Boa Viagem', 'Espinheiro', 'Graças'] },
    'PI': { 'Teresina': ['Jóquei', 'Ininga', 'Fátima'] },
    'RJ': { 'Rio de Janeiro': ['Leblon', 'Ipanema', 'Barra da Tijuca'] },
    'RN': { 'Natal': ['Ponta Negra', 'Petrópolis', 'Tirol'] },
    'RS': { 'Porto Alegre': ['Moinhos de Vento', 'Bela Vista', 'Petrópolis'] },
    'RO': { 'Porto Velho': ['Caiari', 'Embratel', 'Nova Porto Velho'] },
    'RR': { 'Boa Vista': ['Caçari', 'Centro', 'Paraviana'] },
    'SC': { 'Florianópolis': ['Centro', 'Agronômica', 'Jurerê'] },
    'SP': { 'São Paulo': ['Itaim Bibi', 'Moema', 'Vila Mariana'] },
    'SE': { 'Aracaju': ['Atalaia', 'Jardins', '13 de Julho'] },
    'TO': { 'Palmas': ['Plano Diretor Sul', 'Plano Diretor Norte', 'Taquaralto'] },
}

export function WidgetValuation() {
    const [area, setArea] = useState(120)
    const [rooms, setRooms] = useState(3)
    const [parking, setParking] = useState(2)
    const [tipo, setTipo] = useState('Apartamento')
    const [estado, setEstado] = useState('PE')
    const [municipio, setMunicipio] = useState('Recife')
    const [bairro, setBairro] = useState('Boa Viagem')
    const [result, setResult] = useState<{ total: number; low: number; high: number; m2: number } | null>(null)
    const estados = Object.keys(BRAZIL_LOCATION_TREE)
    const municipios = Object.keys(BRAZIL_LOCATION_TREE[estado] ?? {})
    const bairros = BRAZIL_LOCATION_TREE[estado]?.[municipio] ?? []

    function estimate() {
        let base = 9800
        if (tipo === 'Cobertura') base = 14200
        if (tipo === 'Casa') base = 7400
        const m2 = Math.round(base * (1 + (rooms - 2) * 0.04) * (1 + parking * 0.03))
        const total = Math.round(m2 * area)
        setResult({ total, low: Math.round(total * 0.91), high: Math.round(total * 1.09), m2 })
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={S.label}>Brasil &gt; Estados &gt; Municípios &gt; Bairros</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <select style={S.input} value={estado} onChange={e => {
                            const uf = e.target.value
                            const nextMunicipios = Object.keys(BRAZIL_LOCATION_TREE[uf] ?? {})
                            const nextMunicipio = nextMunicipios[0] ?? ''
                            const nextBairro = BRAZIL_LOCATION_TREE[uf]?.[nextMunicipio]?.[0] ?? ''
                            setEstado(uf)
                            setMunicipio(nextMunicipio)
                            setBairro(nextBairro)
                        }}>
                            {estados.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                        </select>
                        <select style={S.input} value={municipio} onChange={e => {
                            const city = e.target.value
                            setMunicipio(city)
                            setBairro(BRAZIL_LOCATION_TREE[estado]?.[city]?.[0] ?? '')
                        }}>
                            {municipios.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                        <select style={{ ...S.input, gridColumn: 'span 2' }} value={bairro} onChange={e => setBairro(e.target.value)}>
                            {bairros.map(region => <option key={region} value={region}>{region}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={S.label}>Área (m²)</label>
                    <input style={S.input} type="number" value={area} onChange={e => setArea(Number(e.target.value))} min={20} max={2000} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={S.label}>Quartos</label>
                    <select style={S.input} value={rooms} onChange={e => setRooms(Number(e.target.value))}>
                        {[1,2,3,4].map(n => <option key={n} value={n}>{n}{n===4?'+':''}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={S.label}>Vagas</label>
                    <select style={S.input} value={parking} onChange={e => setParking(Number(e.target.value))}>
                        {[0,1,2,3].map(n => <option key={n} value={n}>{n}{n===3?'+':''}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={S.label}>Tipo</label>
                    <select style={S.input} value={tipo} onChange={e => setTipo(e.target.value)}>
                        {['Apartamento','Casa','Cobertura'].map(t => <option key={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            <button onClick={estimate} style={S.btn}>Estimar Valor →</button>

            {result && (
                <div style={S.result}>
                    <p style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(200,164,74,0.7)', marginBottom: 4 }}>Valor Estimado IMI</p>
                    <p style={{ fontFamily: 'var(--font-display,"Playfair Display",serif)', fontSize: 34, color: '#fff', letterSpacing: '-1px', lineHeight: 1 }}>{fmtBRL(result.total)}</p>
                    <p style={{ fontSize: 12, color: 'rgba(200,164,74,0.6)', marginTop: 4 }}>Faixa: {fmtBRL(result.low)} – {fmtBRL(result.high)}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                        {[
                            ['Preço/m²', fmtBRL(result.m2)],
                            ['Comparáveis', '14 imóveis'],
                        ].map(([l, v]) => (
                            <div key={l} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 12px' }}>
                                <div style={{ fontSize: 10, color: 'rgba(200,164,74,0.55)' }}>{l}</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginTop: 2 }}>{v}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(200,164,74,0.6)', marginBottom: 5 }}>
                            <span>Confiabilidade do Modelo</span><span>87%</span>
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 99 }}>
                            <div style={{ height: '100%', width: '87%', background: 'var(--gold,#C8A44A)', borderRadius: 99 }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const S = {
    label: { fontSize: 10, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const, color: 'var(--text-secondary)' },
    input: {
        background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--r-sm,4px)',
        padding: '9px 12px', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', width: '100%',
    },
    btn: {
        width: '100%', padding: '11px', background: 'var(--accent-400)', color: 'var(--navy,#0B1928)',
        border: 'none', borderRadius: 'var(--r-sm,4px)', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
        cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase' as const,
    },
    result: {
        background: 'linear-gradient(135deg, var(--navy,#0B1928) 0%, var(--navy-raised,#1A3250) 100%)',
        borderRadius: 12, padding: 22, border: '1px solid rgba(200,164,74,0.20)',
    },
}
