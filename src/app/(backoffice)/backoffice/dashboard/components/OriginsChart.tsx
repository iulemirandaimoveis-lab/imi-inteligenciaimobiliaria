
'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { T } from '@/app/(backoffice)/lib/theme'

interface OriginsChartProps {
    data: Array<{ name: string; value: number }>
}

const COLORS = ['var(--text-primary)', 'var(--imi-gold-500)', 'var(--text-secondary)', 'var(--text-tertiary)', 'var(--border-subtle)']

export default function OriginsChart({ data }: OriginsChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-[200px] sm:h-[280px] lg:h-[300px] flex items-center justify-center text-imi-300 italic text-sm">
                Aguardando dados de origem...
            </div>
        )
    }

    return (
        <div className="h-[200px] sm:h-[280px] lg:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
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
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
