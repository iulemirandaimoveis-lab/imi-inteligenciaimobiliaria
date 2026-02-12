'use client'

import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'

export default function Dashboard() {
    return (
        <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            {/* Greeting */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Bem-vindo de volta,</p>
                    <h2 className="text-2xl font-display font-bold text-text-header-light dark:text-white flex items-center gap-2">
                        Iule Miranda
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">v2.2 (13:42)</span>
                    </h2>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* New Leads Card */}
                <div className="col-span-1 bg-white dark:bg-card-dark p-4 rounded-xl shadow-soft border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-card-hover transition-all duration-300">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Icon name="groups" size={32} className="text-primary" />
                    </div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Novos Leads</p>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-display font-bold text-text-header-light dark:text-white">42</span>
                        <span className="text-xs font-medium text-green-500 mb-1.5 flex items-center gap-0.5">
                            <Icon name="arrow_upward" size={14} /> 12%
                        </span>
                    </div>
                    <div className="mt-3 h-1 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-2/3 rounded-full" style={{ width: '68%' }}></div>
                    </div>
                </div>

                {/* Active Properties Card */}
                <div className="col-span-1 bg-white dark:bg-card-dark p-4 rounded-xl shadow-soft border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-card-hover transition-all duration-300">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Icon name="apartment" size={32} className="text-primary" />
                    </div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Imóveis Ativos</p>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-display font-bold text-text-header-light dark:text-white">18</span>
                        <span className="text-xs font-medium text-gray-400 mb-1.5">Total</span>
                    </div>
                    <div className="mt-3 flex gap-1">
                        <div className="h-1 flex-1 bg-blue-500 rounded-full"></div>
                        <div className="h-1 flex-1 bg-blue-500 rounded-full"></div>
                        <div className="h-1 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    </div>
                </div>

                {/* VGV Card (Full Width) */}
                <div className="col-span-2 bg-imi-dark-blue dark:bg-card-dark p-5 rounded-xl shadow-lg border border-gray-800 dark:border-gray-700 relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Valor Geral de Vendas (VGV)</p>
                            <h3 className="text-2xl font-display font-bold text-white mb-1">R$ 14.5M</h3>
                            <p className="text-xs text-primary font-medium">Campanha Q1 2026</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-2 rounded-lg">
                            <Icon name="trending_up" className="text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Critical Alerts */}
            <section className="mb-6">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-display font-bold text-lg text-text-header-light dark:text-white">Alertas Críticos</h3>
                    <button className="text-xs font-medium text-primary hover:text-yellow-600 transition-colors">Ver Todos</button>
                </div>
                <div className="space-y-3">
                    <div className="bg-white dark:bg-card-dark p-4 rounded-xl shadow-soft border-l-4 border-red-500 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer active:scale-[0.99]">
                        <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-full shrink-0">
                            <Icon name="warning" size={14} className="text-red-500" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Documentação Pendente</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Imóvel: Edifício Horizon #402. Prazo expira em 24h.</p>
                        </div>
                        <Icon name="chevron_right" size={16} className="text-gray-400" />
                    </div>
                </div>
            </section>

            {/* Recent Activity */}
            <section>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-display font-bold text-lg text-text-header-light dark:text-white">Atividades Recentes</h3>
                </div>
                <div className="bg-white dark:bg-card-dark rounded-xl shadow-soft divide-y divide-gray-100 dark:divide-gray-800">
                    <div className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer active:scale-[0.99]">
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 font-bold text-xs">
                            JD
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">João Doria</h4>
                                <span className="text-[10px] text-gray-400">10 min</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Novo lead qualificado via LinkedIn.</p>
                        </div>
                    </div>

                    <div className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer active:scale-[0.99]">
                        <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-400 font-bold text-xs">
                            MS
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Maria Silva</h4>
                                <span className="text-[10px] text-gray-400">2h atrás</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Agendou visita para o Edifício Jardins.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
