'use client'

import { useState } from 'react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity } from 'lucide-react'

interface ChartPoint { mes: string; leads: number; receita: number }

type Period = '1M' | '3M' | '6M' | '1A'

const PERIOD_OPTS: { label: string; value: Period; months: number }[] = [
    { label: '1M', value: '1M', months: 1 },
    { label: '3M', value: '3M', months: 3 },
    { label: '6M', value: '6M', months: 6 },
    { label: '1A', value: '1A', months: 12 },
]

interface PerformanceChartProps {
    chartData: ChartPoint[]
}

export default function PerformanceChart({ chartData }: PerformanceChartProps) {
    const [period, setPeriod] = useState<Period>('6M')
    const periodMonths = PERIOD_OPTS.find(p => p.value === period)?.months ?? 6
    const filteredChartData = chartData.slice(-periodMonths)

    return (
        <>
            <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Activity size={13} style={{ color: 'var(--accent-400)' }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Performance
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] mt-1.5">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--info)' }} />
                            <span style={{ color: 'var(--text-muted)' }}>Leads</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--success)' }} />
                            <span style={{ color: 'var(--text-muted)' }}>Receita</span>
                        </span>
                    </div>
                </div>
                {/* Period tabs */}
                <div className="flex items-center gap-0.5 flex-shrink-0 p-0.5 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-default)' }}>
                    {PERIOD_OPTS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setPeriod(opt.value)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                            style={{
                                background: period === opt.value ? 'rgba(200,164,74,0.18)' : 'transparent',
                                color: period === opt.value ? 'var(--accent-400)' : 'var(--text-muted)',
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
            <div style={{ height: 170 }}>
                {filteredChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                            <defs>
                                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="var(--info, #60A5FA)" stopOpacity={0.28} />
                                    <stop offset="95%" stopColor="var(--info, #60A5FA)" stopOpacity={0.01} />
                                </linearGradient>
                                <linearGradient id="greenGrad2" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.24} />
                                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0.01} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="mes" axisLine={false} tickLine={false}
                                tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }} />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: 6,
                                    color: 'var(--text-primary)',
                                    fontSize: 11,
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                                }}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter={((v: any, name: any) => [
                                    name === 'leads' ? `${v} leads` : `R$ ${v}k`,
                                    name === 'leads' ? 'Leads' : 'Receita',
                                ]) as any}
                            />
                            <Area type="monotone" dataKey="leads" stroke="var(--info)" strokeWidth={2}
                                fill="url(#blueGrad)" dot={false}
                                activeDot={{ r: 4, fill: 'var(--info)', strokeWidth: 0 }} />
                            <Area type="monotone" dataKey="receita" stroke="var(--success)" strokeWidth={2}
                                fill="url(#greenGrad2)" dot={false}
                                activeDot={{ r: 4, fill: 'var(--success)', strokeWidth: 0 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Sem dados para o período
                        </p>
                    </div>
                )}
            </div>
        </>
    )
}
