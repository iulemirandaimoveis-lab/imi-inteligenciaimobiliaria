'use client';

import { useState } from 'react';

export function LeverageCalculator() {
    const [propertyValue, setPropertyValue] = useState(500000);
    const [appreciationRate, setAppreciationRate] = useState(5);

    const downPayment = propertyValue * 0.40;
    const cashProfit5Years = propertyValue * Math.pow((1 + appreciationRate / 100), 5) - propertyValue;
    const cashRoi = (cashProfit5Years / propertyValue) * 100;

    const leveragedProfit5Years = (propertyValue * Math.pow((1 + appreciationRate / 100), 5)) - propertyValue;
    const leveragedRoi = (leveragedProfit5Years / downPayment) * 100;

    return (
        <div className="bg-navy-950 p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-white/[0.05] h-full flex flex-col">
            <h3 className="text-xl font-bold text-white mb-2 font-display">Poder da Alavancagem</h3>
            <p className="text-sm text-white/50 mb-8">Saiba como o crédito inteligente multiplica o retorno sobre seu capital no tempo.</p>

            <div className="space-y-8 flex-grow">
                <div>
                    <div className="flex justify-between mb-4">
                        <label className="text-xs font-bold text-white/50 uppercase tracking-widest">
                            Valorização Anual Esperada
                        </label>
                        <span className="font-bold text-white">{appreciationRate}%</span>
                    </div>
                    <input
                        type="range"
                        min="2"
                        max="10"
                        step="0.5"
                        value={appreciationRate}
                        onChange={(e) => setAppreciationRate(Number(e.target.value))}
                        className="w-full h-2 bg-navy-800 rounded-lg appearance-none cursor-pointer accent-[#486581]"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-navy-950 rounded-2xl border border-white/[0.05]">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Investimento à Vista</div>
                        <div className="text-3xl font-bold text-white mb-1">{cashRoi.toFixed(0)}%</div>
                        <p className="text-[10px] text-white/40 font-medium">ROI Estimado em 5 Anos</p>
                    </div>

                    <div className="p-6 bg-navy-800 rounded-2xl border border-white/10 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-navy-800 opacity-10 rounded-full blur-2xl -mr-12 -mt-12" />
                        <div className="relative z-10">
                            <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4">Financiado (40% down)</div>
                            <div className="text-3xl font-bold text-navy-300 mb-1">{leveragedRoi.toFixed(0)}%</div>
                            <p className="text-[10px] text-white/50 font-medium">ROI Alavancado em 5 Anos</p>
                        </div>
                    </div>
                </div>

                <div className="bg-navy-800/5 border border-navy-600/10 p-4 rounded-xl">
                    <p className="text-xs text-gray-300 leading-relaxed font-medium">
                        <span className="text-navy-300 font-bold block mb-1">Insight Estratégico:</span>
                        Ao usar o crédito bancário, você ganha a valorização sobre o valor TOTAL do imóvel, tendo investido apenas a entrada. Isso gera um efeito multiplicador no seu capital.
                    </p>
                </div>
            </div>
        </div>
    );
}
