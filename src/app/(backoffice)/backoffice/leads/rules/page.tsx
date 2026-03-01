// ============================================
// BLOCO 4 — SCRIPT 9: REGRAS DE PONTUAÇÃO
// ⚠️ COPIAR EXATAMENTE — NÃO MODIFICAR
// ============================================

/**
 * SALVAR EM: src/app/(backoffice)/backoffice/leads/rules/page.tsx
 */

'use client'

import { useState } from 'react'
import {
    Settings,
    Zap,
    Target,
    Plus,
    ChevronRight,
    Building,
    MapPin,
    DollarSign,
    Mail,
    MessageSquare,
    Phone,
    Eye,
    Star,
    TrendingUp,
    Edit,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Info,
    Save,
    X,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Regras mockadas contextualizadas Recife
const REGRAS_INICIAIS = [
    {
        id: 1,
        nome: 'Engajamento Alto no Instagram',
        descricao: 'Lead interagiu com 3+ posts do IMI nos últimos 7 dias',
        gatilho: 'Interações Instagram ≥ 3 em 7 dias',
        pontos: 20,
        ativa: true,
        categoria: 'comportamento',
        icone: Zap,
        cor: 'text-orange-500 bg-orange-50 border-orange-100',
        execucoes: 127,
    },
    {
        id: 2,
        nome: 'Perfil ICP — Alto Padrão',
        descricao: 'Lead atende ao perfil ideal: renda ≥ R$30k/mês, interesse em imóveis ≥ R$500k',
        gatilho: 'Budget declarado ≥ R$ 500.000',
        pontos: 35,
        ativa: true,
        categoria: 'perfil',
        icone: Target,
        cor: 'text-blue-600 bg-blue-50 border-blue-100',
        execucoes: 89,
    },
    {
        id: 3,
        nome: 'Interesse em Boa Viagem',
        descricao: 'Lead sinalizou interesse em imóveis no bairro de Boa Viagem',
        gatilho: 'Localização: Boa Viagem selecionada',
        pontos: 15,
        ativa: true,
        categoria: 'localizacao',
        icone: MapPin,
        cor: 'text-green-600 bg-green-50 border-green-100',
        execucoes: 201,
    },
    {
        id: 4,
        nome: 'Interesse em Pina / Candeias',
        descricao: 'Bairros de alta valorização e menor concorrência',
        gatilho: 'Localização: Pina ou Candeias selecionada',
        pontos: 10,
        ativa: true,
        categoria: 'localizacao',
        icone: MapPin,
        cor: 'text-teal-600 bg-teal-50 border-teal-100',
        execucoes: 145,
    },
    {
        id: 5,
        nome: 'Email Aberto 3x na Semana',
        descricao: 'Lead abre consistentemente as newsletters da IMI',
        gatilho: 'Open rate ≥ 3 em 7 dias',
        pontos: 15,
        ativa: true,
        categoria: 'comportamento',
        icone: Mail,
        cor: 'text-purple-600 bg-purple-50 border-purple-100',
        execucoes: 64,
    },
    {
        id: 6,
        nome: 'WhatsApp Respondido',
        descricao: 'Lead respondeu mensagem do corretor via WhatsApp',
        gatilho: 'Resposta WhatsApp em < 2 horas',
        pontos: 25,
        ativa: true,
        categoria: 'comportamento',
        icone: MessageSquare,
        cor: 'text-green-700 bg-green-50 border-green-100',
        execucoes: 43,
    },
    {
        id: 7,
        nome: 'Ligação Atendida',
        descricao: 'Lead atendeu ligação do consultor',
        gatilho: 'Chamada atendida registrada no CRM',
        pontos: 30,
        ativa: true,
        categoria: 'comportamento',
        icone: Phone,
        cor: 'text-blue-600 bg-blue-50 border-blue-100',
        execucoes: 32,
    },
    {
        id: 8,
        nome: 'Visita ao Site: Página de Imóvel',
        descricao: 'Lead visitou página de produto específico no site',
        gatilho: 'Pageview /imoveis/* ≥ 2 sessões',
        pontos: 10,
        ativa: true,
        categoria: 'comportamento',
        icone: Eye,
        cor: 'text-gray-600 bg-gray-100 border-gray-200',
        execucoes: 312,
    },
    {
        id: 9,
        nome: 'Interesse em Reserva Atlantis',
        descricao: 'Lead demonstrou interesse no produto carro-chefe da IMI',
        gatilho: 'UTM campaign contém "reserva-atlantis"',
        pontos: 20,
        ativa: true,
        categoria: 'produto',
        icone: Star,
        cor: 'text-[#486581] bg-accent-50 border-accent-100',
        execucoes: 78,
    },
    {
        id: 10,
        nome: 'Lead Inativo 30 dias',
        descricao: 'Sem interação por 30 dias — reduz score',
        gatilho: 'Última interação > 30 dias',
        pontos: -20,
        ativa: true,
        categoria: 'decay',
        icone: TrendingUp,
        cor: 'text-red-600 bg-red-50 border-red-100',
        execucoes: 56,
    },
    {
        id: 11,
        nome: 'Empresa: Hospital / Clínica',
        descricao: 'Lead trabalha em empresa de saúde — perfil de alto poder aquisitivo',
        gatilho: 'Setor = Saúde (Hospital, Clínica, Consultório)',
        pontos: 15,
        ativa: false,
        categoria: 'perfil',
        icone: Building,
        cor: 'text-pink-600 bg-pink-50 border-pink-100',
        execucoes: 0,
    },
]

const CATEGORIAS_LABEL: Record<string, string> = {
    comportamento: 'Comportamento',
    perfil: 'Perfil',
    localizacao: 'Localização',
    produto: 'Produto',
    decay: 'Decaimento',
}

export default function LeadRulesPage() {
    const [regras, setRegras] = useState(REGRAS_INICIAIS)
    const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null)
    const [mostrarInativas, setMostrarInativas] = useState(false)

    const toggleRegra = (id: number) => {
        setRegras(prev =>
            prev.map(r => (r.id === id ? { ...r, ativa: !r.ativa } : r))
        )
    }

    const regrasFiltradas = regras.filter(r => {
        if (!mostrarInativas && !r.ativa) return false
        if (filtroCategoria && r.categoria !== filtroCategoria) return false
        return true
    })

    const stats = {
        total: regras.length,
        ativas: regras.filter(r => r.ativa).length,
        scoreMaximo: regras.filter(r => r.ativa && r.pontos > 0).reduce((a, r) => a + r.pontos, 0),
        execucoesTotais: regras.reduce((a, r) => a + r.execucoes, 0),
    }

    const categorias = [...new Set(regras.map(r => r.categoria))]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Regras de Pontuação</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Configure como leads são qualificados automaticamente
                    </p>
                </div>
                <button className="flex items-center gap-2 h-11 px-6 bg-[#16162A] text-white rounded-xl font-medium hover:bg-[#0F0F1E]">
                    <Plus size={18} />
                    Nova Regra
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total de Regras', value: stats.total, color: 'text-gray-900' },
                    { label: 'Regras Ativas', value: stats.ativas, color: 'text-green-700' },
                    { label: 'Score Máximo', value: `${stats.scoreMaximo} pts`, color: 'text-[#0F0F1E]' },
                    { label: 'Execuções Totais', value: stats.execucoesTotais.toLocaleString('pt-BR'), color: 'text-blue-700' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{s.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Info box */}
            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 flex items-start gap-3">
                <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-blue-900">Como funciona o Lead Scoring</p>
                    <p className="text-xs text-blue-700 mt-0.5">
                        Cada lead começa com 0 pontos. As regras somam ou subtraem pontos automaticamente.
                        Leads com score ≥ 50 são classificados como <strong>Quentes</strong>,
                        20-49 como <strong>Mornos</strong>, e abaixo de 20 como <strong>Frios</strong>.
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Categoria:</span>
                <button
                    onClick={() => setFiltroCategoria(null)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${!filtroCategoria ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    Todas
                </button>
                {categorias.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFiltroCategoria(filtroCategoria === cat ? null : cat)}
                        className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors capitalize ${filtroCategoria === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {CATEGORIAS_LABEL[cat] || cat}
                    </button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                    <button
                        onClick={() => setMostrarInativas(!mostrarInativas)}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                    >
                        {mostrarInativas ? <ToggleRight size={18} className="text-[#486581]" /> : <ToggleLeft size={18} />}
                        Mostrar inativas
                    </button>
                </div>
            </div>

            {/* Lista de regras */}
            <div className="space-y-3">
                {regrasFiltradas.map(regra => {
                    const Icon = regra.icone
                    return (
                        <div
                            key={regra.id}
                            className={`bg-white rounded-2xl border p-5 transition-all group ${regra.ativa ? 'border-gray-100 hover:shadow-sm' : 'border-gray-100 opacity-60'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Ícone */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${regra.cor}`}>
                                    <Icon size={22} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">{regra.nome}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">{regra.descricao}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {/* Score badge */}
                                            <span className={`px-2.5 py-1 rounded-lg text-sm font-bold ${regra.pontos > 0
                                                    ? 'bg-green-50 text-green-700'
                                                    : 'bg-red-50 text-red-700'
                                                }`}>
                                                {regra.pontos > 0 ? '+' : ''}{regra.pontos} pts
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mt-2">
                                        {/* Gatilho */}
                                        <div className="flex items-center gap-1.5">
                                            <Zap size={11} className="text-gray-400" />
                                            <span className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-0.5 rounded-md">
                                                {regra.gatilho}
                                            </span>
                                        </div>

                                        {/* Categoria */}
                                        <span className="text-xs text-gray-400">
                                            {CATEGORIAS_LABEL[regra.categoria]}
                                        </span>

                                        {/* Execuções */}
                                        {regra.execucoes > 0 && (
                                            <span className="text-xs text-gray-400">
                                                {regra.execucoes} execuções
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Ações */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Editar"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        onClick={() => toggleRegra(regra.id)}
                                        className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium transition-colors"
                                        title={regra.ativa ? 'Desativar' : 'Ativar'}
                                    >
                                        {regra.ativa ? (
                                            <>
                                                <ToggleRight size={16} className="text-green-600" />
                                                <span className="text-green-700">Ativa</span>
                                            </>
                                        ) : (
                                            <>
                                                <ToggleLeft size={16} className="text-gray-400" />
                                                <span className="text-gray-500">Inativa</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {regrasFiltradas.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                        <Settings size={40} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-gray-500">Nenhuma regra encontrada</p>
                        <button className="mt-3 text-sm text-[#486581] hover:text-[#0F0F1E] font-medium">
                            + Criar primeira regra
                        </button>
                    </div>
                )}
            </div>

            {/* Score preview */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                    Simulador de Score
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    {[
                        { label: 'Lead Frio', range: '0–19 pts', color: 'bg-gray-100 text-gray-700', desc: 'Nutrição automática' },
                        { label: 'Lead Morno', range: '20–49 pts', color: 'bg-orange-50 text-orange-700', desc: 'Follow-up em 48h' },
                        { label: 'Lead Quente', range: '50+ pts', color: 'bg-red-50 text-red-700', desc: 'Contato imediato' },
                    ].map(cat => (
                        <div key={cat.label} className={`${cat.color} rounded-xl p-4`}>
                            <p className="text-sm font-bold">{cat.label}</p>
                            <p className="text-xs font-mono mt-1">{cat.range}</p>
                            <p className="text-xs mt-2 opacity-70">{cat.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
