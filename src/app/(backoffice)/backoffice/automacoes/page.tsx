'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Plus,
    Search,
    Play,
    Pause,
    Edit,
    Trash2,
    Zap,
    Mail,
    MessageSquare,
    Calendar,
    Users,
    FileText,
    CheckCircle,
    Clock,
    TrendingUp,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Automações mockadas
const automacoesData = [
    {
        id: 1,
        nome: 'Boas-vindas Novos Leads',
        descricao: 'Envia email de boas-vindas automaticamente quando um novo lead é capturado',
        trigger: 'Novo Lead Criado',
        acoes: ['Enviar Email', 'Criar Tarefa Follow-up', 'Notificar Equipe'],
        status: 'ativa',
        execucoes: 127,
        ultimaExecucao: '2026-02-18T14:30:00',
        taxaSucesso: 98.4,
        categoria: 'Leads',
        icone: Mail,
    },
    {
        id: 2,
        nome: 'Follow-up Automático 24h',
        descricao: 'Envia WhatsApp automático 24h após primeiro contato',
        trigger: 'Lead sem resposta por 24h',
        acoes: ['Enviar WhatsApp', 'Atualizar Status', 'Agendar Ligação'],
        status: 'ativa',
        execucoes: 89,
        ultimaExecucao: '2026-02-18T10:15:00',
        taxaSucesso: 94.5,
        categoria: 'Leads',
        icone: MessageSquare,
    },
    {
        id: 3,
        nome: 'Lembrete Vistorias Agendadas',
        descricao: 'Notifica equipe 1 dia antes de vistorias agendadas',
        trigger: 'Vistoria daqui a 1 dia',
        acoes: ['Notificar Avaliador', 'Enviar Lembrete Cliente', 'Preparar Documentos'],
        status: 'ativa',
        execucoes: 23,
        ultimaExecucao: '2026-02-17T09:00:00',
        taxaSucesso: 100,
        categoria: 'Avaliações',
        icone: Calendar,
    },
    {
        id: 4,
        nome: 'Distribuição Leads Equipe',
        descricao: 'Distribui novos leads automaticamente entre corretores disponíveis',
        trigger: 'Novo Lead com score > 70',
        acoes: ['Analisar Disponibilidade', 'Atribuir Corretor', 'Notificar Corretor'],
        status: 'ativa',
        execucoes: 56,
        ultimaExecucao: '2026-02-18T15:45:00',
        taxaSucesso: 96.4,
        categoria: 'Equipe',
        icone: Users,
    },
    {
        id: 5,
        nome: 'Relatório Semanal Automático',
        descricao: 'Gera e envia relatório de performance toda segunda às 8h',
        trigger: 'Segunda-feira 08:00',
        acoes: ['Gerar Relatório', 'Enviar para Gestores', 'Salvar Histórico'],
        status: 'pausada',
        execucoes: 8,
        ultimaExecucao: '2026-02-17T08:00:00',
        taxaSucesso: 100,
        categoria: 'Relatórios',
        icone: FileText,
    },
    {
        id: 6,
        nome: 'Atualização Status Pipeline',
        descricao: 'Move leads automaticamente no pipeline baseado em atividade',
        trigger: 'Lead sem atividade por 7 dias',
        acoes: ['Atualizar Status', 'Alertar Responsável', 'Sugerir Ações'],
        status: 'ativa',
        execucoes: 34,
        ultimaExecucao: '2026-02-18T12:00:00',
        taxaSucesso: 91.2,
        categoria: 'Leads',
        icone: TrendingUp,
    },
]

export default function AutomacoesPage() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const [categoriaFilter, setCategoriaFilter] = useState('all')

    const filteredAutomacoes = automacoesData.filter(automacao => {
        const matchesSearch =
            automacao.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            automacao.descricao.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategoria = categoriaFilter === 'all' || automacao.categoria === categoriaFilter
        return matchesSearch && matchesCategoria
    })

    const stats = {
        total: automacoesData.length,
        ativas: automacoesData.filter(a => a.status === 'ativa').length,
        pausadas: automacoesData.filter(a => a.status === 'pausada').length,
        execucoesHoje: automacoesData.reduce((acc, a) => acc + a.execucoes, 0),
        taxaMediaSucesso: (automacoesData.reduce((acc, a) => acc + a.taxaSucesso, 0) / automacoesData.length).toFixed(1),
    }

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; color: string; bg: string; icon: any }> = {
            ativa: { label: 'Ativa', color: 'text-green-700', bg: 'bg-green-50', icon: Play },
            pausada: { label: 'Pausada', color: 'text-orange-700', bg: 'bg-orange-50', icon: Pause },
        }
        return configs[status] || configs.pausada
    }

    const getCategoriaColor = (categoria: string) => {
        const colors: Record<string, string> = {
            'Leads': 'bg-blue-50 text-blue-700',
            'Avaliações': 'bg-purple-50 text-purple-700',
            'Equipe': 'bg-green-50 text-green-700',
            'Relatórios': 'bg-orange-50 text-orange-700',
        }
        return colors[categoria] || 'bg-gray-50 text-gray-700'
    }

    const getTimeAgo = (dateStr: string) => {
        const now = new Date()
        const past = new Date(dateStr)
        const diffMinutes = Math.floor((now.getTime() - past.getTime()) / 60000)

        if (diffMinutes < 60) return `${diffMinutes}min atrás`
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atrás`
        return `${Math.floor(diffMinutes / 1440)}d atrás`
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">IA & Automações</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Workflows automáticos e inteligência artificial
                    </p>
                </div>
                <button
                    onClick={() => router.push('/backoffice/automacoes/nova')}
                    className="flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 transition-colors"
                >
                    <Plus size={20} />
                    Nova Automação
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-green-600 mb-1">Ativas</p>
                    <p className="text-2xl font-bold text-green-700">{stats.ativas}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-orange-600 mb-1">Pausadas</p>
                    <p className="text-2xl font-bold text-orange-700">{stats.pausadas}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Execuções Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.execucoesHoje}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Taxa Sucesso</p>
                    <p className="text-2xl font-bold text-green-700">{stats.taxaMediaSucesso}%</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar automações..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                        />
                    </div>
                    <select
                        value={categoriaFilter}
                        onChange={(e) => setCategoriaFilter(e.target.value)}
                        className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
                    >
                        <option value="all">Todas as categorias</option>
                        <option value="Leads">Leads</option>
                        <option value="Avaliações">Avaliações</option>
                        <option value="Equipe">Equipe</option>
                        <option value="Relatórios">Relatórios</option>
                    </select>
                </div>
            </div>

            {/* Grid de Automações */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredAutomacoes.map((automacao) => {
                    const statusConfig = getStatusConfig(automacao.status)
                    const StatusIcon = statusConfig.icon
                    const AutomacaoIcon = automacao.icone

                    return (
                        <div
                            key={automacao.id}
                            className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
                            onClick={() => router.push(`/backoffice/automacoes/${automacao.id}`)}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <AutomacaoIcon size={24} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-1">{automacao.nome}</h3>
                                        <p className="text-sm text-gray-600">{automacao.descricao}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.color}`}>
                                        <StatusIcon size={12} />
                                        {statusConfig.label}
                                    </span>
                                </div>
                            </div>

                            {/* Trigger */}
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap size={14} className="text-gray-600" />
                                    <span className="text-xs font-semibold text-gray-600 uppercase">Trigger</span>
                                </div>
                                <p className="text-sm font-medium text-gray-900">{automacao.trigger}</p>
                            </div>

                            {/* Ações */}
                            <div className="mb-4">
                                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Ações</p>
                                <div className="flex flex-wrap gap-2">
                                    {automacao.acoes.map((acao, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                                            {acao}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Execuções</p>
                                    <p className="text-lg font-bold text-gray-900">{automacao.execucoes}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Sucesso</p>
                                    <p className="text-lg font-bold text-green-700">{automacao.taxaSucesso}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Última</p>
                                    <p className="text-xs font-medium text-gray-700">{getTimeAgo(automacao.ultimaExecucao)}</p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoriaColor(automacao.categoria)}`}>
                                    {automacao.categoria}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            // Toggle status
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        {automacao.status === 'ativa' ? (
                                            <Pause size={16} className="text-orange-600" />
                                        ) : (
                                            <Play size={16} className="text-green-600" />
                                        )}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            router.push(`/backoffice/automacoes/${automacao.id}/editar`)
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Edit size={16} className="text-gray-600" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Empty State */}
            {filteredAutomacoes.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma automação encontrada</h3>
                    <p className="text-gray-600 mb-6">Tente ajustar os filtros ou criar uma nova automação</p>
                    <button
                        onClick={() => router.push('/backoffice/automacoes/nova')}
                        className="inline-flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700"
                    >
                        <Plus size={20} />
                        Nova Automação
                    </button>
                </div>
            )}
        </div>
    )
}
