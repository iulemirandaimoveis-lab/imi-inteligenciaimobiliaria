
'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { T } from '@/app/(backoffice)/lib/theme'

interface TimelineChartProps {
    data: Array<{ month: string; leads: number }>
}

export default function TimelineChart({ data }: TimelineChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-[200px] sm:h-[280px] lg:h-[300px] flex items-center justify-center text-imi-300 italic text-sm">
                Aguardando dados temporais...
            </div>
        )
    }

    return (
        <div className="h-[200px] sm:h-[280px] lg:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                    />
                    <Tooltip
                        contentStyle={{
                            background: 'var(--bg-elevated)',
                            borderRadius: 4,
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-primary)',
                            fontSize: 11,
                            boxShadow: 'var(--shadow-md)',
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="leads"
                        stroke="var(--imi-gold-500)"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorLeads)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
