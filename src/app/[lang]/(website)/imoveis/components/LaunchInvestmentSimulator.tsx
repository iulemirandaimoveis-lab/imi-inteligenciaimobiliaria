'use client';

import React, { useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Calendar, DollarSign, BarChart2, Info } from 'lucide-react';

const GOLD = '#C8A44A';
const NAVY = '#0B1928';
const TEAL = '#0C9E95';

interface ScenarioData {
    label: string;
    sublabel: string;
    dailyRate: number;
    occupancy: number;
    appreciation: number; // % a.a.
    monthlyNet: number;
}

interface SimulatorProps {
    basePrice?: number;
    propertyName?: string;
}

const SCENARIOS: Record<string, ScenarioData> = {
    conservador: {
        label: 'Conservador',
        sublabel: 'Base prudente',
        dailyRate: 220,
        occupancy: 55,
        appreciation: 8,
        monthlyNet: 3500,
    },
    realista: {
        label: 'Realista',
        sublabel: 'Mais provável',
        dailyRate: 280,
        occupancy: 65,
        appreciation: 10,
        monthlyNet: 4800,
    },
    agressivo: {
        label: 'Agressivo',
        sublabel: 'Alto desempenho',
        dailyRate: 320,
        occupancy: 75,
        appreciation: 12,
        monthlyNet: 6500,
    },
};

function fmtCurrency(value: number): string {
    if (value >= 1_000_000) {
        const m = value / 1_000_000;
        return `R$ ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(2).replace(/\.?0+$/, '').replace('.', ',')}M`;
    }
    if (value >= 1_000) {
        return `R$ ${(value / 1_000).toFixed(0)}k`;
    }
    return `R$ ${value.toLocaleString('pt-BR')}`;
}

function calcProjection(price: number, monthlyRent: number, appreciation: number, years: number) {
    const futureValue = price * Math.pow(1 + appreciation / 100, years);
    const totalRent = monthlyRent * 12 * years;
    const totalPatrimony = futureValue + totalRent;
    const roi = ((totalPatrimony - price) / price) * 100;
    return { futureValue, totalRent, totalPatrimony, roi };
}

export default function LaunchInvestmentSimulator({ basePrice = 490000, propertyName }: SimulatorProps) {
    const [scenario, setScenario] = useState<'conservador' | 'realista' | 'agressivo'>('realista');
    const [horizon, setHorizon] = useState<5 | 10>(5);
    const uid = useId();

    const sc = SCENARIOS[scenario];
    const proj = calcProjection(basePrice, sc.monthlyNet, sc.appreciation, horizon);
    const annualRent = sc.monthlyNet * 12;
    const rentYield = (annualRent / basePrice) * 100;

    // Bar widths for projection chart (normalize against 10yr agressivo)
    const maxRef = calcProjection(basePrice, SCENARIOS.agressivo.monthlyNet, SCENARIOS.agressivo.appreciation, 10).totalPatrimony;
    const barPcts = (Object.keys(SCENARIOS) as Array<keyof typeof SCENARIOS>).map(key => {
        const p = calcProjection(basePrice, SCENARIOS[key].monthlyNet, SCENARIOS[key].appreciation, horizon);
        return { key, pct: Math.round((p.totalPatrimony / maxRef) * 100) };
    });

    return (
        <section style={{ background: '#FFFFFF', borderRadius: 20, border: '1px solid rgba(184,179,168,0.3)', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            {/* Header stripe */}
            <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${GOLD} 40%, ${TEAL} 100%)` }} />

            <div style={{ padding: '32px 28px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 2, borderRadius: 1, background: GOLD }} />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', color: '#948F84', textTransform: 'uppercase', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                        Simulação de Retorno
                    </span>
                </div>
                <h2 style={{ fontSize: 26, fontWeight: 700, color: NAVY, fontFamily: "var(--font-heading, 'Playfair Display', serif)", margin: '0 0 6px', lineHeight: 1.2 }}>
                    Quanto esse imóvel vai<br />
                    <em style={{ fontStyle: 'italic', color: GOLD }}>te pagar por mês?</em>
                </h2>
                <p style={{ fontSize: 13, color: '#948F84', margin: '0 0 28px', lineHeight: 1.6, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                    Baseado em short stay (Airbnb/Booking), localização premium e mercado de Garanhuns.
                    {propertyName && ` Referência: ${propertyName}.`}
                </p>
            </div>

            {/* Scenario Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, borderTop: '1px solid rgba(184,179,168,0.2)', borderBottom: '1px solid rgba(184,179,168,0.2)' }}>
                {(Object.entries(SCENARIOS) as [string, ScenarioData][]).map(([key, sc]) => (
                    <button
                        key={key}
                        onClick={() => setScenario(key as typeof scenario)}
                        style={{
                            padding: '14px 12px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            border: 'none',
                            borderRight: key !== 'agressivo' ? '1px solid rgba(184,179,168,0.2)' : 'none',
                            background: scenario === key ? 'rgba(200,164,74,0.07)' : '#F9F8F6',
                            borderBottom: scenario === key ? `2px solid ${GOLD}` : '2px solid transparent',
                            transition: 'all 0.2s',
                            position: 'relative',
                        }}
                    >
                        <p style={{ fontSize: 12, fontWeight: 700, color: scenario === key ? GOLD : '#6B7280', margin: '0 0 2px', fontFamily: "var(--fu, 'Outfit', sans-serif)", letterSpacing: '0.3px' }}>
                            {sc.label}
                        </p>
                        <p style={{ fontSize: 10, color: '#B8B3A8', margin: 0, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                            {sc.sublabel}
                        </p>
                        {key === 'realista' && (
                            <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: GOLD, color: '#FFFFFF', letterSpacing: '0.5px', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                                ★ MAIS PROVÁVEL
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div style={{ padding: '28px' }}>
                {/* Main metrics grid */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${scenario}-metrics`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 28 }}>
                            <MetricCard
                                icon={DollarSign}
                                label="Renda mensal líquida"
                                value={`R$ ${sc.monthlyNet.toLocaleString('pt-BR')}`}
                                accent={GOLD}
                                highlight
                            />
                            <MetricCard
                                icon={Calendar}
                                label="Diária média"
                                value={`R$ ${sc.dailyRate}`}
                                accent={TEAL}
                            />
                            <MetricCard
                                icon={TrendingUp}
                                label="Ocupação estimada"
                                value={`${sc.occupancy}%`}
                                accent={NAVY}
                            />
                            <MetricCard
                                icon={BarChart2}
                                label={`Yield anual`}
                                value={`${rentYield.toFixed(1).replace('.', ',')}%`}
                                accent={GOLD}
                            />
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Horizon toggle + projection */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, margin: 0, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                            Projeção patrimonial
                        </h3>
                        <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', padding: '3px', borderRadius: 10 }}>
                            {([5, 10] as const).map(yr => (
                                <button
                                    key={yr}
                                    onClick={() => setHorizon(yr)}
                                    style={{ padding: '5px 14px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: horizon === yr ? NAVY : 'transparent', color: horizon === yr ? '#FFFFFF' : '#6B7280', transition: 'all 0.15s', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                                >
                                    {yr} anos
                                </button>
                            ))}
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${scenario}-${horizon}-proj`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                        >
                            {/* Projection highlight */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                                <div style={{ padding: '16px', background: '#F8F6F2', borderRadius: 12, border: '1px solid rgba(184,179,168,0.25)', textAlign: 'center' }}>
                                    <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 6px', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Valor do Imóvel</p>
                                    <p style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: 0, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>{fmtCurrency(proj.futureValue)}</p>
                                </div>
                                <div style={{ padding: '16px', background: '#F8F6F2', borderRadius: 12, border: '1px solid rgba(184,179,168,0.25)', textAlign: 'center' }}>
                                    <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 6px', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Renda Acumulada</p>
                                    <p style={{ fontSize: 18, fontWeight: 700, color: TEAL, margin: 0, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>{fmtCurrency(proj.totalRent)}</p>
                                </div>
                                <div style={{ padding: '16px', background: `rgba(200,164,74,0.06)`, borderRadius: 12, border: `1px solid rgba(200,164,74,0.25)`, textAlign: 'center' }}>
                                    <p style={{ fontSize: 9, fontWeight: 700, color: '#8B6914', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 6px', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Patrimônio Total</p>
                                    <p style={{ fontSize: 18, fontWeight: 700, color: GOLD, margin: 0, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>{fmtCurrency(proj.totalPatrimony)}</p>
                                </div>
                            </div>

                            {/* Scenario comparison bars */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                                {barPcts.map(({ key, pct }) => {
                                    const s = SCENARIOS[key];
                                    const isActive = key === scenario;
                                    return (
                                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <span style={{ width: 80, fontSize: 11, fontWeight: isActive ? 700 : 500, color: isActive ? NAVY : '#9CA3AF', flexShrink: 0, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                                                {s.label}
                                            </span>
                                            <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 1.2, ease: [0.165, 0.84, 0.44, 1] }}
                                                    style={{
                                                        height: '100%',
                                                        borderRadius: 3,
                                                        background: isActive
                                                            ? `linear-gradient(90deg, ${GOLD}, rgba(200,164,74,0.6))`
                                                            : 'rgba(184,179,168,0.4)',
                                                    }}
                                                />
                                            </div>
                                            <span style={{ width: 64, textAlign: 'right', fontSize: 12, fontWeight: 700, color: isActive ? GOLD : '#9CA3AF', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", flexShrink: 0 }}>
                                                {fmtCurrency(calcProjection(basePrice, SCENARIOS[key].monthlyNet, SCENARIOS[key].appreciation, horizon).totalPatrimony)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ROI highlight */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: NAVY, borderRadius: 12, gap: 20 }}>
                                <div>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', fontFamily: "var(--fu, 'Outfit', sans-serif)", letterSpacing: '1px', textTransform: 'uppercase' }}>
                                        Quem investe <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{fmtCurrency(basePrice)}</strong> hoje
                                    </p>
                                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                                        pode ter em {horizon} anos — cenário {sc.label.toLowerCase()}:
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <p style={{ fontSize: 28, fontWeight: 700, color: GOLD, margin: 0, lineHeight: 1, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                                        +{Math.round(proj.roi)}%
                                    </p>
                                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0', fontFamily: "var(--fu, 'Outfit', sans-serif)", letterSpacing: '1px', textTransform: 'uppercase' }}>
                                        Retorno total
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footnote */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '12px 14px', background: '#F8F6F2', borderRadius: 10 }}>
                    <Info style={{ width: 13, height: 13, color: '#B8B3A8', flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 10, color: '#B8B3A8', margin: 0, lineHeight: 1.6, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                        Projeções baseadas em premissas de mercado de Garanhuns/PE. Rentabilidade passada não garante resultados futuros.
                        Valores sujeitos a alteração. Obra em regime de administração a preço de custo (condomínio fechado).
                        Parcelas corrigidas mensalmente pelo INCC-FGV.
                    </p>
                </div>
            </div>
        </section>
    );
}

function MetricCard({
    icon: Icon,
    label,
    value,
    accent,
    highlight = false,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    accent: string;
    highlight?: boolean;
}) {
    return (
        <div style={{
            padding: '16px 14px',
            borderRadius: 12,
            background: highlight ? `rgba(200,164,74,0.06)` : '#F8F6F2',
            border: `1px solid ${highlight ? 'rgba(200,164,74,0.25)' : 'rgba(184,179,168,0.25)'}`,
            textAlign: 'center',
        }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: highlight ? GOLD : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <Icon style={{ width: 13, height: 13, color: highlight ? '#FFFFFF' : accent }} />
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: highlight ? GOLD : NAVY, margin: '0 0 3px', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", lineHeight: 1 }}>
                {value}
            </p>
            <p style={{ fontSize: 9, color: '#948F84', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', margin: 0, fontFamily: "var(--fu, 'Outfit', sans-serif)", lineHeight: 1.3 }}>
                {label}
            </p>
        </div>
    );
}
