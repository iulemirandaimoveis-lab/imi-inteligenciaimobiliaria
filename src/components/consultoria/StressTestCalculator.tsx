'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export function StressTestCalculator() {
    const [vacancyRate, setVacancyRate] = useState(30);

    const grossIncome = 50000;
    const expenses = 20000;
    const mortgage = 24000;

    const effectiveIncome = grossIncome * ((100 - vacancyRate) / 100);
    const netPosition = effectiveIncome - expenses - mortgage;

    const isSafe = netPosition > 0;

    return (
        <div className="bg-[#0D0F14] p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-white/[0.05] h-full flex flex-col">
            <h3 className="text-xl font-bold text-white mb-2 font-display">Teste de Estresse</h3>
            <p className="text-sm text-[#9CA3AF] mb-8">Avalie a resiliência do seu investimento frente a períodos de baixa ocupação.</p>

            <div className="space-y-8 flex-grow">
                <div>
                    <div className="flex justify-between mb-4">
                        <label className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest">
                            Simular Taxa de Vacância
                        </label>
                        <span className={`font-bold ${vacancyRate > 50 ? 'text-[#EF4444]' : 'text-white'}`}>{vacancyRate}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={vacancyRate}
                        onChange={(e) => setVacancyRate(Number(e.target.value))}
                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-colors duration-500 ${isSafe ? 'bg-[#1A1E2A] accent-[#486581]' : 'bg-[#EF4444]/20 accent-[#EF4444]'}`}
                    />
                </div>

                <div className={`p-8 rounded-2xl border-2 transition-all duration-500 flex flex-col items-center text-center ${isSafe ? 'bg-[#141420] border-white/[0.05]' : 'bg-[#EF4444]/10 border-[#EF4444]/30 shadow-lg shadow-[#EF4444]/10'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isSafe ? 'bg-[#1A1E2A] text-[#486581] border border-white/10' : 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'}`}>
                        {isSafe ? <CheckCircle2 className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8 animate-pulse" />}
                    </div>

                    <h4 className={`text-xl font-bold mb-3 font-display ${isSafe ? 'text-white' : 'text-[#EF4444]'}`}>
                        {isSafe ? 'Investimento Resiliente' : 'Alerta de Fluxo de Caixa'}
                    </h4>

                    <p className={`text-sm leading-relaxed ${isSafe ? 'text-[#9CA3AF]' : 'text-[#EF4444]/80'}`}>
                        {isSafe
                            ? `Mesmo com o imóvel vazio em ${vacancyRate}% do ano, sua operação continua solvente e saudável.`
                            : `Atenção: Com ${vacancyRate}% de vacância, o aluguel não cobre as despesas e financiamento no cenário simulado.`
                        }
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-auto">
                    <div className="text-center">
                        <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">Ponto de Equilíbrio</div>
                        <div className="text-sm font-bold text-white">12% de Vacância</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">Margem de Segurança</div>
                        <div className="text-sm font-bold text-white">Alta</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
