'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, PieChart, Info } from 'lucide-react';

export function InvestmentSimulator() {
    const [propertyValue, setPropertyValue] = useState(500000);
    const [downPaymentPercent, setDownPaymentPercent] = useState(40);
    const [interestRate, setInterestRate] = useState(6.5);
    const [rentalYield, setRentalYield] = useState(8);

    const [monthlyCashflow, setMonthlyCashflow] = useState(0);
    const [cocReturn, setCocReturn] = useState(0);

    useEffect(() => {
        const downPayment = propertyValue * (downPaymentPercent / 100);
        const loanAmount = propertyValue - downPayment;

        const monthlyRate = interestRate / 100 / 12;
        const numberOfPayments = 30 * 12;
        const monthlyMortgage = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

        const grossMonthlyIncome = (propertyValue * (rentalYield / 100)) / 12;
        const expenses = grossMonthlyIncome * 0.40;

        const netOperatingIncome = grossMonthlyIncome - expenses;
        const cashflow = netOperatingIncome - monthlyMortgage;

        const annualCashflow = cashflow * 12;
        const initialInvestment = downPayment + (propertyValue * 0.04);

        const cashOnCash = (annualCashflow / initialInvestment) * 100;

        setMonthlyCashflow(cashflow);
        setCocReturn(cashOnCash);
    }, [propertyValue, downPaymentPercent, interestRate, rentalYield]);

    return (
        <div className="bg-[#0D0F14] rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-white/[0.05]" id="simulator">
            <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Inputs */}
                <div className="p-8 md:p-12 space-y-10">
                    <h3 className="text-2xl font-bold text-white font-display flex items-center gap-3">
                        <TrendingUp className="w-6 h-6 text-[#3B82F6]" />
                        Configurar Cenário
                    </h3>

                    <div className="space-y-8">
                        {/* Property Value */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-2">
                                    Valor do Imóvel
                                </label>
                                <span className="text-xl font-bold text-white">${propertyValue.toLocaleString()}</span>
                            </div>
                            <input
                                type="range"
                                min="200000"
                                max="2000000"
                                step="50000"
                                value={propertyValue}
                                onChange={(e) => setPropertyValue(Number(e.target.value))}
                                className="w-full h-2 bg-[#1A1E2A] rounded-lg appearance-none cursor-pointer [#3B82F6]"
                            />
                        </div>

                        {/* Down Payment */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-[#9CA3AF] uppercase tracking-wider">
                                    Entrada (Down Payment)
                                </label>
                                <span className="text-xl font-bold text-white">{downPaymentPercent}%</span>
                            </div>
                            <input
                                type="range"
                                min="25"
                                max="100"
                                step="5"
                                value={downPaymentPercent}
                                onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                                className="w-full h-2 bg-[#1A1E2A] rounded-lg appearance-none cursor-pointer [#3B82F6]"
                            />
                            <div className="text-xs text-[#6B7280] font-medium">Equivalente a: ${(propertyValue * (downPaymentPercent / 100)).toLocaleString()}</div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Interest Rate */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">
                                        Taxa de Juros (a.a.)
                                    </label>
                                    <span className="font-bold text-white">{interestRate}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="4"
                                    max="10"
                                    step="0.25"
                                    value={interestRate}
                                    onChange={(e) => setInterestRate(Number(e.target.value))}
                                    className="w-full h-2 bg-[#1A1E2A] rounded-lg appearance-none cursor-pointer [#3B82F6]"
                                />
                            </div>

                            {/* Yield */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">
                                        Yield Bruto (%)
                                    </label>
                                    <span className="font-bold text-white">{rentalYield}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="4"
                                    max="15"
                                    step="0.5"
                                    value={rentalYield}
                                    onChange={(e) => setRentalYield(Number(e.target.value))}
                                    className="w-full h-2 bg-[#1A1E2A] rounded-lg appearance-none cursor-pointer [#3B82F6]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Result */}
                <div className="bg-[#141420] border-l border-white/[0.05] p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#1A1A2E] opacity-5 rounded-full blur-3xl -mr-32 -mt-32" />

                    <div className="relative z-10 space-y-12">
                        <div>
                            <p className="text-[#9CA3AF] text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-[#3B82F6]" />
                                Fluxo de Caixa Mensal Limpo
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-5xl font-bold font-display ${monthlyCashflow >= 0 ? 'text-white' : 'text-[#EF4444]'}`}>
                                    ${Math.abs(monthlyCashflow).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                                <span className="text-[#6B7280] font-medium">/ mês</span>
                            </div>
                            {monthlyCashflow < 0 && <p className="text-[#EF4444] text-xs mt-2 font-medium">Saldo Negativo no Cenário Atual</p>}
                        </div>

                        <div className="h-px bg-white/10" />

                        <div>
                            <p className="text-[#9CA3AF] text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                <PieChart className="w-4 h-4 text-[#3B82F6]" />
                                Retorno Cash-on-Cash
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-5xl font-bold font-display ${cocReturn > 0 ? 'text-[#3B82F6]' : 'text-[#EF4444]'}`}>
                                    {cocReturn.toFixed(1)}%
                                </span>
                                <span className="text-[#6B7280] font-medium">ao ano</span>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex gap-3 text-xs text-[#9CA3AF] leading-relaxed">
                            <Info className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                            <p>
                                Estimativa líquida após hipoteca, impostos, HOA e taxas de gestão. Calculado com base no capital inicial investido (entrada + custos de fechamento).
                            </p>
                        </div>
                    </div>

                    <div className="mt-12 relative z-10">
                        <button className="w-full inline-flex items-center justify-center gap-3 h-14 px-8 text-[14px] font-bold uppercase tracking-widest bg-[#1A1E2A] text-white rounded-xl border border-[#21263A] border-l-2 border-[#3B82F6] shadow-[0_8px_32px_rgba(26,26,46,0.15)] hover:bg-[#21263A] transition-all duration-300">
                            Receber Plano Detalhado
                        </button>
                    </div>
                </div>
            </div>
            <div className="bg-white/5 py-4 px-8 text-[10px] text-[#9CA3AF] text-center uppercase tracking-tighter">
                * Simulação informativa para fins de projeção. Resultados reais podem variar conforme mercado e gestão.
            </div>
        </div>
    );
}
