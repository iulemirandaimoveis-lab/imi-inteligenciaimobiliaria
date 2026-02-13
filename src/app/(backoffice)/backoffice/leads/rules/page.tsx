'use client'

import { Settings, Zap, Target, Plus, ChevronRight } from 'lucide-react'

export default function LeadRulesPage() {
    return (
        <div className="space-y-6 pb-24 animate-fade-in max-w-4xl mx-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-display font-bold text-text-header-light dark:text-white mb-2">Regras de Pontuação</h2>
                    <p className="text-text-body-light dark:text-gray-400 max-w-md">Configure como os leads são classificados automaticamente com base em comportamento e perfil.</p>
                </div>
                <button className="bg-primary hover:bg-primary-dark text-background-dark px-4 py-2 rounded-xl shadow-glow transition-all flex items-center gap-2 font-bold text-sm">
                    <Plus size={18} />
                    Nova Regra
                </button>
            </div>

            <div className="space-y-4">
                {/* Rule 1 */}
                <div className="glass-card p-5 rounded-2xl group hover:-translate-y-1 transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform">
                                <Zap size={24} className="fill-current" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-header-light dark:text-white mb-1 group-hover:text-primary transition-colors">Engajamento Alto</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Gatilho: Abrir 3 emails em 7 dias consecutivos.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <span className="text-sm font-bold text-orange-500 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-lg">+20 pts</span>
                            <div className="w-12 h-6 bg-green-500 rounded-full p-1 cursor-pointer flex justify-end shadow-inner transition-colors">
                                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                            </div>
                            <ChevronRight className="text-gray-300 dark:text-gray-600 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                    </div>
                </div>

                {/* Rule 2 */}
                <div className="glass-card p-5 rounded-2xl group hover:-translate-y-1 transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                                <Target size={24} className="fill-current" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-header-light dark:text-white mb-1 group-hover:text-primary transition-colors">Perfil Ideal ICP</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Filtro: Cargo (C-Level) + Renda &gt; 50k.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <span className="text-sm font-bold text-blue-500 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-lg">+50 pts</span>
                            <div className="w-12 h-6 bg-green-500 rounded-full p-1 cursor-pointer flex justify-end shadow-inner transition-colors">
                                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                            </div>
                            <ChevronRight className="text-gray-300 dark:text-gray-600 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                    </div>
                </div>

                {/* Rule 3 */}
                <div className="glass-card p-5 rounded-2xl group hover:-translate-y-1 transition-all cursor-pointer opacity-60 hover:opacity-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center border border-gray-200 dark:border-white/10 group-hover:scale-110 transition-transform">
                                <Settings size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-header-light dark:text-white mb-1">Site Visitado</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Gatilho: Visitou página de preços &gt; 2x.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <span className="text-sm font-bold text-gray-400 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1 rounded-lg">+10 pts</span>
                            <div className="w-12 h-6 bg-gray-300 dark:bg-gray-700 rounded-full p-1 cursor-pointer flex justify-start shadow-inner transition-colors">
                                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                            </div>
                            <ChevronRight className="text-gray-300 dark:text-gray-600 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
