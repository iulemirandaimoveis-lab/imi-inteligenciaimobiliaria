'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
    { name: 'Seg', visits: 400 },
    { name: 'Ter', visits: 300 },
    { name: 'Qua', visits: 550 },
    { name: 'Qui', visits: 450 },
    { name: 'Sex', visits: 600 },
    { name: 'Sáb', visits: 800 },
    { name: 'Dom', visits: 700 },
]

export default function VisitsChart() {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#486581" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#486581" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.3} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                        itemStyle={{ color: '#0F1E28', fontWeight: 'bold' }}
                        labelStyle={{ color: '#6B7280', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="visits"
                        stroke="#486581"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorVisits)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
