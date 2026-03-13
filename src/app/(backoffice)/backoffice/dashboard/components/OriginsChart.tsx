
'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { T } from '@/app/(backoffice)/lib/theme'

interface OriginsChartProps {
    data: Array<{ name: string; value: number }>
}

const COLORS = ['#0F172A', '#EAB308', 'var(--bo-text-muted)', '#94A3B8', '#CBD5E1']

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
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                        }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
