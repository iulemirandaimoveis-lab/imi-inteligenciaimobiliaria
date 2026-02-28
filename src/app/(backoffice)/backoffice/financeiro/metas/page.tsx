'use client'

import { useState } from 'react'
import {
    Target,
    Trophy,
    TrendingUp,
    Clock,
    Plus,
    Flame,
    Award,
    Star,
    ChevronRight,
    ArrowRight,
    CircleCheck,
    CalendarDays,
    BarChart
} from 'lucide-react'

// Mock Data
const METAS_ATUAIS = [
    {
        id: '1',
        title: 'Meta de VGC - Q1 2026',
        metric: 'vendas_vgc',
        target_value: 2000000,
        current_value: 850000,
        start_date: '2026-01-01',
        end_date: '2026-03-31',
        status: 'in_progress',
        color: 'blue'
    },
    {
        id: '2',
        title: 'Captação de Imóveis Alto Padrão',
        metric: 'imoveis_captados',
        target_value: 15,
        current_value: 8,
        start_date: '2026-02-01',
        end_date: '2026-02-28',
        status: 'in_progress',
        color: 'amber'
    },
    {
        id: '3',
        title: 'Conversão de Leads (Investidores)',
        metric: 'leads_convertidos',
        target_value: 5,
        current_value: 5,
        start_date: '2026-01-15',
        end_date: '2026-02-15',
        status: 'achieved',
        color: 'emerald'
    }
]

const HISTORICO_CONQUISTAS = [
    { id: 1, title: 'Top Captador Janeiro', date: '31 Jan 2026', icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-100' },
    { id: 2, title: 'Venda Expressa (<10 dias)', date: '15 Jan 2026', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-100' },
    { id: 3, title: 'Corretor Estrela 2025', date: '31 Dez 2025', icon: Star, color: 'text-blue-500', bg: 'bg-blue-100' }
]

export default function MetasGamificationPage() {
    const formatValue = (metric: string, value: number) => {
        if (metric === 'vendas_vgc' || metric === 'comissoes') {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
        }
        return value.toString()
    }

    const calculateDaysLeft = (endDate: string) => {
        const end = new Date(endDate).getTime()
        const now = new Date('2026-02-20').getTime() // Fixed to mockup current date
        const diff = Math.ceil((end - now) / (1000 * 3600 * 24))
        return diff > 0 ? diff : 0
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Metas & Performance</h1>
                    <p className="text-sm text-gray-600 mt-1">Acompanhe seus objetivos e conquistas gamificadas.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors self-start sm:self-auto">
                    <Plus size={16} />
                    Nova Meta
                </button>
            </div>

            {/* Top Stats / Gamification Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Trophy size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold mb-6">
                            <Flame size={14} className="text-orange-400" />
                            <span className="text-orange-50">Nível 12 • Corretor Sênior</span>
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Continue o ótimo trabalho!</h2>
                        <p className="text-gray-300 max-w-md text-sm leading-relaxed mb-8">
                            Você está a apenas 2 captações exclusivas de alcançar a sua meta mensal e desbloquear o selo "Top Captador".
                        </p>

                        <div className="flex items-center gap-6">
                            <div>
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">XP Atual</p>
                                <p className="text-2xl font-bold">14.500 <span className="text-sm font-normal text-gray-400">/ 15.000</span></p>
                            </div>
                            <div className="flex-1 max-w-xs">
                                <div className="h-2 w-full bg-gray-700/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 w-[90%] rounded-full shadow-[0_0_10px_rgba(251,146,60,0.5)]"></div>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">500 XP para o próximo nível</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900">Suas Conquistas</h3>
                        <button className="text-[#3B82F6] text-sm font-medium hover:underline flex items-center gap-1">
                            Ver todas <ChevronRight size={14} />
                        </button>
                    </div>
                    <div className="space-y-4 flex-1">
                        {HISTORICO_CONQUISTAS.map(conquista => {
                            const Icon = conquista.icon
                            return (
                                <div key={conquista.id} className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${conquista.bg} ${conquista.color}`}>
                                        <Icon size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{conquista.title}</p>
                                        <p className="text-xs text-gray-500">{conquista.date}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Metas em Andamento */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Target size={20} className="text-[#3B82F6]" />
                        Metas de Performance
                    </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {METAS_ATUAIS.map(meta => {
                        const isAchieved = meta.current_value >= meta.target_value
                        const progress = Math.min(100, (meta.current_value / meta.target_value) * 100)
                        const daysLeft = calculateDaysLeft(meta.end_date)

                        return (
                            <div key={meta.id} className={`bg-white rounded-2xl border transition-all hover:border-[#3B82F6]/30 hover:shadow-lg hover:shadow-[#3B82F6]/5 ${isAchieved ? 'border-emerald-100' : 'border-gray-100'}`}>
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isAchieved ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                            {isAchieved ? 'Atingida' : 'Em Andamento'}
                                        </span>
                                        {!isAchieved && (
                                            <div className="flex items-center gap-1 text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-1 rounded-md">
                                                <Clock size={12} />
                                                {daysLeft} dias
                                            </div>
                                        )}
                                        {isAchieved && (
                                            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">
                                                <CircleCheck size={12} />
                                                Concluída
                                            </div>
                                        )}
                                    </div>

                                    <h4 className="text-base font-bold text-gray-900 mb-6">{meta.title}</h4>

                                    <div className="space-y-2">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-1">Progresso</p>
                                                <p className="text-xl font-bold text-gray-900">
                                                    {formatValue(meta.metric, meta.current_value)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-1">Meta</p>
                                                <p className="text-sm font-semibold text-gray-500">
                                                    {formatValue(meta.metric, meta.target_value)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${isAchieved ? 'bg-emerald-500' : meta.color === 'blue' ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 text-right font-medium">{progress.toFixed(1)}%</p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-50 bg-gray-50/50 p-4 rounded-b-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <CalendarDays size={14} />
                                        <span>Até {new Date(meta.end_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                                    </div>
                                    <button className="text-sm text-[#3B82F6] font-semibold hover:text-[#2563EB] transition-colors flex items-center gap-1">
                                        Detalhes <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Insights / Dicas Gamificadas */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 relative overflow-hidden flex items-center gap-6">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                    <BarChart size={24} />
                </div>
                <div className="z-10">
                    <h4 className="text-base font-bold text-gray-900 mb-1">Dica de Performance IMI</h4>
                    <p className="text-sm text-gray-600">Com base nos seus dados das últimas semanas, sugerimos focar em ligações Follow-Up hoje. Corretores que ligam até as 10h têm 30% a mais de chance de agendar uma visita.</p>
                </div>
            </div>

        </div>
    )
}
