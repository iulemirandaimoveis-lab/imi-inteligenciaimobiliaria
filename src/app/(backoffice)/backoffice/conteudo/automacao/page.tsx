// ============================================
// BLOCO 4 — SCRIPT 5: AUTOMAÇÃO DE CONTEÚDO
// ⚠️ COPIAR EXATAMENTE — NÃO MODIFICAR
// ============================================

/**
 * SALVAR EM: src/app/(backoffice)/backoffice/conteudo/automacao/page.tsx
 *
 * Dashboard de automação de fluxo de conteúdo com IA.
 * Permite configurar temas automáticos, canais e horários.
 */

'use client'

import { useState } from 'react'
import {
    Zap,
    Bot,
    RefreshCw,
    Plus,
    Play,
    Settings,
    Calendar,
    Instagram,
    Linkedin,
    Mail,
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    BarChart3,
    Search,
    MoreVertical,
    ToggleLeft,
    ToggleRight,
    ArrowRight,
    Sparkles,
    ChevronRight,
    Pause,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Fluxos de automação mockados contextualizados Recife
const FLUXOS_AUTOMACAO = [
    {
        id: 1,
        nome: 'Newsletter Semanal: Mercado Recife',
        desc: 'Gera e envia resumo do mercado imobiliário toda segunda 08:00',
        model: 'Claude 3.5 Sonnet',
        status: 'ativo',
        canais: ['email'],
        ultimaExec: '2026-02-16T08:00:00',
        proximaExec: '2026-02-23T08:00:00',
        sucesso_rate: 98,
    },
    {
        id: 2,
        nome: 'Dose Diária: Investidor Premium',
        desc: 'Post curto sobre rentabilidade e novas unidades no Instagram',
        model: 'Gemini 1.5 Flash',
        status: 'ativo',
        canais: ['instagram'],
        ultimaExec: '2026-02-19T10:00:00',
        proximaExec: '2026-02-20T10:00:00',
        sucesso_rate: 94,
    },
    {
        id: 3,
        nome: 'LinkedIn Insight: Relatório Trimestral',
        desc: 'Análise profunda de dados de valorização em Boa Viagem/Pina',
        model: 'Claude 3.5 Sonnet',
        status: 'pausado',
        canais: ['linkedin'],
        ultimaExec: '2026-01-15T09:00:00',
        proximaExec: 'Pendente',
        sucesso_rate: 100,
    },
    {
        id: 4,
        nome: 'Blog SEO: Guia de Bairros',
        desc: 'Gera artigo otimizado sobre um bairro diferente a cada 15 dias',
        model: 'GPT-4o',
        status: 'configurar',
        canais: ['blog'],
        ultimaExec: null,
        proximaExec: 'Manual',
        sucesso_rate: null,
    },
]

const CANAL_ICONS: Record<string, any> = {
    instagram: Instagram,
    linkedin: Linkedin,
    email: Mail,
    blog: FileText,
}

export default function AutomacaoConteudoPage() {
    const [fluxos, setFluxos] = useState(FLUXOS_AUTOMACAO)
    const [busca, setBusca] = useState('')

    const toggleStatus = (id: number) => {
        setFluxos(prev =>
            prev.map(f => {
                if (f.id === id) {
                    const novoStatus = f.status === 'ativo' ? 'pausado' : 'ativo'
                    return { ...f, status: novoStatus }
                }
                return f
            })
        )
    }

    const fluxosFiltrados = fluxos.filter(f =>
        f.nome.toLowerCase().includes(busca.toLowerCase()) ||
        f.desc.toLowerCase().includes(busca.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-accent-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-accent-100">
                        <Bot size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Automação de Conteúdo</h1>
                        <p className="text-sm text-gray-600 mt-0.5">
                            Configure agentes de IA para criar e agendar posts automaticamente
                        </p>
                    </div>
                </div>
                <button className="flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 shadow-lg shadow-accent-100 transition-all">
                    <Plus size={18} />
                    Criar Novo Pipeline
                </button>
            </div>

            {/* Stats e Insight */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Carga de IA</p>
                        <div className="flex items-end justify-between">
                            <p className="text-3xl font-bold text-gray-900">84%</p>
                            <div className="w-16 h-8 bg-accent-50 rounded flex items-end p-1 gap-0.5">
                                <div className="flex-1 bg-accent-200 h-1/2 rounded-full" />
                                <div className="flex-1 bg-accent-300 h-3/4 rounded-full" />
                                <div className="flex-1 bg-accent-600 h-full rounded-full" />
                            </div>
                        </div>
                        <p className="text-[10px] text-accent-600 font-medium mt-2">Capacidade otimizada</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Posts Gerados</p>
                        <div className="flex items-end justify-between">
                            <p className="text-3xl font-bold text-gray-900">127</p>
                            <BarChart3 size={24} className="text-blue-500 mb-1" />
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium mt-2">Últimos 30 dias</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Reach Orgânico</p>
                        <div className="flex items-end justify-between">
                            <p className="text-3xl font-bold text-gray-900">+12%</p>
                            <TrendingUpIcon size={24} className="text-green-500 mb-1" />
                        </div>
                        <p className="text-[10px] text-green-600 font-medium mt-2">Powered by AI strategy</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-2xl p-6 text-white relative overflow-hidden">
                    <Sparkles className="absolute -top-4 -right-4 w-24 h-24 text-white/5" />
                    <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                        <Zap size={16} className="text-accent-400" />
                        Insight da IA
                    </h3>
                    <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                        "Posts sobre <strong>Airbnb em Boa Viagem</strong> performam 40% melhor às quintas-feiras. Recomendo ativar o pipeline de posts curtos para este tema."
                    </p>
                    <button className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 py-2 px-4 rounded-xl transition-all">
                        Ativar Sugestão <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* Lista de Pipelines */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            placeholder="Buscar pipeline de automação..."
                            className="w-full h-11 pl-11 pr-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-accent-500"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 h-11 px-4 bg-gray-50 text-gray-600 rounded-2xl text-xs font-bold hover:bg-gray-100 transition-all uppercase tracking-widest">
                            <RefreshCw size={14} />
                            Forçar Sync Global
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-gray-50">
                    {fluxosFiltrados.map(fluxo => (
                        <div key={fluxo.id} className="p-6 flex flex-col md:flex-row md:items-center gap-6 group hover:bg-gray-50/50 transition-colors">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-base font-bold text-gray-900">{fluxo.nome}</h3>
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${fluxo.status === 'ativo' ? 'bg-green-50 text-green-700' :
                                            fluxo.status === 'pausado' ? 'bg-amber-50 text-amber-700' :
                                                'bg-gray-100 text-gray-500'
                                        }`}>
                                        {fluxo.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 leading-relaxed max-w-xl">{fluxo.desc}</p>
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center gap-1.5">
                                        <Bot size={14} className="text-accent-600" />
                                        <span className="text-xs font-semibold text-gray-700">{fluxo.model}</span>
                                    </div>
                                    <div className="h-4 w-px bg-gray-200" />
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={14} className="text-gray-400" />
                                        <span className="text-xs text-gray-500 font-medium">Próximo: {fluxo.proximaExec}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 md:gap-12">
                                <div className="flex -space-x-2">
                                    {fluxo.canais.map(canal => {
                                        const Icon = CANAL_ICONS[canal]
                                        return (
                                            <div key={canal} className="w-8 h-8 rounded-full bg-white border-2 border-gray-50 flex items-center justify-center text-gray-600 hover:text-accent-600 transition-colors shadow-sm" title={canal}>
                                                <Icon size={14} />
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Sucesso</p>
                                    <p className="text-sm font-bold text-gray-900">{fluxo.sucesso_rate ? `${fluxo.sucesso_rate}%` : '—'}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleStatus(fluxo.id)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${fluxo.status === 'ativo' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                                            }`}
                                    >
                                        {fluxo.status === 'ativo' ? <Pause size={18} /> : <Play size={18} />}
                                    </button>
                                    <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all">
                                        <Settings size={18} />
                                    </button>
                                    <button className="w-10 h-10 flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-all text-gray-400 hover:text-gray-600">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                    <button className="text-xs font-bold text-gray-400 hover:text-accent-600 uppercase tracking-widest transition-colors flex items-center gap-2 mx-auto">
                        Ver Logs de Automação Completos <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    )
}

function TrendingUpIcon({ className, size }: { className?: string; size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
        </svg>
    )
}
