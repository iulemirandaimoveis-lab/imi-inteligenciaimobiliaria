'use client'

import React from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts'

interface PropertyAnalyticsProps {
    propertyId: string
}

// Mock data for demonstration until we have real analytics aggregation
const data = [
    { name: 'Jan', views: 400, leads: 24 },
    { name: 'Fev', views: 300, leads: 18 },
    { name: 'Mar', views: 200, leads: 98 },
    { name: 'Abr', views: 278, leads: 39 },
    { name: 'Mai', views: 189, leads: 48 },
    { name: 'Jun', views: 239, leads: 38 },
    { name: 'Jul', views: 349, leads: 43 },
]

export default function PropertyAnalytics({ propertyId }: PropertyAnalyticsProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-2xl border border-imi-100 shadow-soft">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-imi-900 tracking-tight font-display">Performance Geral</h3>
                    <p className="text-xs text-imi-400 font-black uppercase tracking-widest mt-1">Visualizações vs Leads (Últimos 6 Meses)</p>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{
                                top: 10,
                                right: 30,
                                left: 0,
                                bottom: 0,
                            }}
                        >
                            <defs>
                                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="views"
                                stroke="#1e3a8a"
                                fillOpacity={1}
                                fill="url(#colorViews)"
                                strokeWidth={3}
                            />
                            <Area
                                type="monotone"
                                dataKey="leads"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorLeads)"
                                strokeWidth={3}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-2xl border border-imi-100 shadow-soft">
                    <h3 className="text-lg font-bold text-imi-900 tracking-tight mb-6 font-display">Fontes de Tráfego</h3>
                    <div className="space-y-4">
                        {[
                            { source: 'Google Organic', percent: 45, color: 'bg-blue-500' },
                            { source: 'Instagram Ads', percent: 30, color: 'bg-purple-500' },
                            { source: 'Direct', percent: 15, color: 'bg-green-500' },
                            { source: 'Referral', percent: 10, color: 'bg-orange-500' },
                        ].map((item, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-xs font-bold text-imi-600 mb-2 uppercase tracking-wide">
                                    <span>{item.source}</span>
                                    <span>{item.percent}%</span>
                                </div>
                                <div className="w-full bg-imi-50 rounded-full h-2 overflow-hidden">
                                    <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.percent}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-imi-100 shadow-soft">
                    <h3 className="text-lg font-bold text-imi-900 tracking-tight mb-6 font-display">Conversão por Dispositivo</h3>
                    <div className="flex items-end justify-around h-[180px] px-4">
                        {[
                            { device: 'Mobile', value: 85, color: 'bg-imi-800' },
                            { device: 'Desktop', value: 45, color: 'bg-imi-400' },
                            { device: 'Tablet', value: 20, color: 'bg-imi-200' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-2 group">
                                <span className="text-xs font-bold text-imi-900 bg-white px-2 py-1 rounded-lg shadow-sm border border-imi-100 opacity-0 group-hover:opacity-100 transition-opacity mb-2">
                                    {item.value}%
                                </span>
                                <div className={`w-12 rounded-t-xl transition-all hover:opacity-90 ${item.color}`} style={{ height: `${item.value * 1.5}px` }}></div>
                                <span className="text-[10px] font-black text-imi-400 uppercase tracking-widest mt-2">{item.device}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
