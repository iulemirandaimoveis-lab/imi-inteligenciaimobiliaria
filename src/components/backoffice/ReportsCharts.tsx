'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#C49D5B', '#7B9EC4', '#6BB87B', '#E8A87C', '#A89EC4', '#E57373'];

export default function ReportsCharts({ leadsData, consData }: { leadsData: any[], consData: any[] }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-2xl p-6 shadow-sm"
                style={{
                    background: 'var(--bo-elevated)',
                    border: '1px solid var(--bo-border)',
                }}>
                <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--bo-text)' }}>Leads por Estágio</h2>
                <div className="h-[300px] w-full">
                    {leadsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={leadsData}>
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: 'var(--bo-text-muted)' }} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{ fill: 'var(--bo-text-muted)' }} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)', borderRadius: '10px', color: 'var(--bo-text)' }} />
                                <Bar dataKey="count" fill="#C49D5B" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-sm" style={{ color: 'var(--bo-text-muted)' }}>Sem dados suficientes</div>
                    )}
                </div>
            </div>

            <div className="rounded-2xl p-6 shadow-sm"
                style={{
                    background: 'var(--bo-elevated)',
                    border: '1px solid var(--bo-border)',
                }}>
                <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--bo-text)' }}>Consultorias por Status</h2>
                <div className="h-[300px] w-full">
                    {consData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={consData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="count"
                                >
                                    {consData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)', borderRadius: '10px', color: 'var(--bo-text)' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-sm" style={{ color: 'var(--bo-text-muted)' }}>Sem dados suficientes</div>
                    )}
                </div>
            </div>
        </div>
    );
}
