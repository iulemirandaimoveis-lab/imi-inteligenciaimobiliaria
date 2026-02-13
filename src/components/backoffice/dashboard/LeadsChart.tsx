'use client'

import React from 'react'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip
} from 'recharts'

const data = [
    { name: 'Google Ads', value: 400 },
    { name: 'Instagram', value: 300 },
    { name: 'Indicação', value: 300 },
    { name: 'Portal', value: 200 },
]

const COLORS = ['#C6A87C', '#1F2937', '#9CA3AF', '#E5E7EB']

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    )
}

export default function LeadsChart() {
    return (
        <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm h-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Origem dos Leads</h3>
            <p className="text-sm text-gray-500 mb-6">Distribuição por canal de aquisição</p>

            <div className="h-[250px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            // label={renderCustomizedLabel}
                            outerRadius={80}
                            innerRadius={60}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Text */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-4 text-center pointer-events-none">
                    <span className="block text-2xl font-bold text-gray-900 dark:text-white">1.2k</span>
                    <span className="text-xs text-gray-500">Total Leads</span>
                </div>
            </div>
        </div>
    )
}
