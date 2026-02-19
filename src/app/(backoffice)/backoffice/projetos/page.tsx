'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Plus,
    Search,
    Building2,
    MapPin,
    Calendar,
    TrendingUp,
    DollarSign,
    Users,
    Eye,
    Edit,
    MoreVertical,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Dados mockados
const projetosData = [
    {
        id: 1,
        nome: 'Reserva Atlantis',
        tipo: 'Loteamento Premium',
        localizacao: 'Litoral Norte PE — Catuama',
        status: 'estruturacao',
        statusLabel: 'Estruturação',
        descricao: 'Desenvolvimento costeiro sustentável com tecnologia REGEN. Posicionado para fundos soberanos e family offices internacionais.',
        areaTotal: '1.200.000 m²',
        unidades: 320,
        unidadesVendidas: 0,
        vgv: 480000000,
        captacaoAlvo: 120000000,
        captacaoAtual: 42000000,
        parceiros: ['Construtora Central', 'Arquitetura Ltda'],
        dataLancamento: '2026-09-01',
        dataEntrega: '2030-12-01',
        cobertura: 'Internacional',
        investidoresAlvo: 'Sovereign Wealth Funds, Family Offices',
        avatar: 'RA',
        avatarColor: 'bg-blue-600',
    },
    {
        id: 2,
        nome: 'Ocean Blue',
        tipo: 'Residencial Alto Padrão',
        localizacao: 'Boa Viagem, Recife/PE',
        status: 'lancamento',
        statusLabel: 'Lançamento',
        descricao: 'Empreendimento residencial de alto padrão com coberturas duplex e vista mar permanente.',
        areaTotal: '8.400 m²',
        unidades: 48,
        unidadesVendidas: 12,
        vgv: 96000000,
        captacaoAlvo: 24000000,
        captacaoAtual: 18000000,
        parceiros: ['Construtora Central'],
        dataLancamento: '2025-10-15',
        dataEntrega: '2028-06-01',
        cobertura: 'Nacional',
        investidoresAlvo: 'Pessoa Física Alta Renda, FII',
        avatar: 'OB',
        avatarColor: 'bg-accent-600',
    },
    {
        id: 3,
        nome: 'Peninsula Blue',
        tipo: 'Multiuso',
        localizacao: 'Piedade, Recife/PE',
        status: 'planejamento',
        statusLabel: 'Planejamento',
        descricao: 'Complexo multiuso com torres residenciais, comercial e âncora gastronômica. Próximo ao Parque dos Manguezais.',
        areaTotal: '22.000 m²',
        unidades: 180,
        unidadesVendidas: 0,
        vgv: 162000000,
        captacaoAlvo: 55000000,
        captacaoAtual: 8500000,
        parceiros: ['Construtora Norte', 'Arquitetura Premium'],
        dataLancamento: '2027-03-01',
        dataEntrega: '2031-06-01',
        cobertura: 'Nacional',
        investidoresAlvo: 'FII, Corporate Investors',
        avatar: 'PB',
        avatarColor: 'bg-purple-600',
    },
]

const statusConfig: Record<string, { bg: string; text: string }> = {
    estruturacao: { bg: 'bg-blue-50', text: 'text-blue-700' },
    planejamento: { bg: 'bg-orange-50', text: 'text-orange-700' },
    lancamento: { bg: 'bg-green-50', text: 'text-green-700' },
    construcao: { bg: 'bg-purple-50', text: 'text-purple-700' },
    concluido: { bg: 'bg-gray-100', text: 'text-gray-700' },
}

export default function ProjetosPage() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('todos')

    const filtered = projetosData.filter(p => {
        const matchesSearch =
            p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.localizacao.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'todos' || p.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const totalVgv = projetosData.reduce((s, p) => s + p.vgv, 0)
    const totalCaptacao = projetosData.reduce((s, p) => s + p.captacaoAtual, 0)
    const totalUnidades = projetosData.reduce((s, p) => s + p.unidades, 0)

    const formatCurrency = (v: number) =>
        v >= 1000000 ? `R$ ${(v / 1000000).toFixed(0)}M` : `R$ ${(v / 1000).toFixed(0)}K`

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Projetos</h1>
                    <p className="text-sm text-gray-600 mt-1">Empreendimentos estruturados e captação IMI</p>
                </div>
                <button
                    onClick={() => router.push('/backoffice/projetos/novo')}
                    className="flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 transition-colors"
                >
                    <Plus size={20} />
                    Novo Projeto
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 border">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Projetos Ativos</p>
                    <p className="text-3xl font-bold text-gray-900">{projetosData.length}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">VGV Total</p>
                    <p className="text-3xl font-bold text-accent-700">{formatCurrency(totalVgv)}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border">
                    <p className="text-xs text-green-600 uppercase tracking-wider mb-2">Captação Atual</p>
                    <p className="text-3xl font-bold text-green-700">{formatCurrency(totalCaptacao)}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total Unidades</p>
                    <p className="text-3xl font-bold text-gray-900">{totalUnidades.toLocaleString('pt-BR')}</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl p-4 border flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou localização..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm"
                    />
                </div>
                {['todos', 'planejamento', 'estruturacao', 'lancamento', 'construcao'].map(s => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 h-9 rounded-lg text-sm font-medium transition-colors capitalize ${statusFilter === s ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {s === 'todos' ? 'Todos' : s === 'estruturacao' ? 'Estruturação' : s === 'lancamento' ? 'Lançamento' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {/* Cards de Projetos */}
            <div className="space-y-4">
                {filtered.map(p => {
                    const progressCaptacao = (p.captacaoAtual / p.captacaoAlvo) * 100
                    const progressVendas = p.unidades > 0 ? (p.unidadesVendidas / p.unidades) * 100 : 0
                    const sc = statusConfig[p.status] || statusConfig.planejamento

                    return (
                        <div
                            key={p.id}
                            className="bg-white rounded-2xl border hover:shadow-lg transition-all cursor-pointer"
                            onClick={() => router.push(`/backoffice/projetos/${p.id}`)}
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 ${p.avatarColor} rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0`}>
                                            {p.avatar}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-bold text-gray-900">{p.nome}</h3>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${sc.bg} ${sc.text}`}>
                                                    {p.statusLabel}
                                                </span>
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                                    {p.tipo}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <MapPin size={14} />
                                                {p.localizacao}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={e => { e.stopPropagation(); router.push(`/backoffice/projetos/${p.id}`) }}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <Eye size={16} className="text-gray-500" />
                                        </button>
                                        <button
                                            onClick={e => { e.stopPropagation(); router.push(`/backoffice/projetos/${p.id}/editar`) }}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <Edit size={16} className="text-gray-500" />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 mb-5">{p.descricao}</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">VGV</p>
                                        <p className="text-lg font-bold text-accent-700">{formatCurrency(p.vgv)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Unidades</p>
                                        <p className="text-lg font-bold text-gray-900">{p.unidades}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Área Total</p>
                                        <p className="text-lg font-bold text-gray-900">{p.areaTotal}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Lançamento</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {new Date(p.dataLancamento).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs text-gray-500">Captação</span>
                                            <span className="text-xs font-bold text-gray-900">
                                                {formatCurrency(p.captacaoAtual)} / {formatCurrency(p.captacaoAlvo)} ({progressCaptacao.toFixed(0)}%)
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-accent-500 rounded-full"
                                                style={{ width: `${Math.min(progressCaptacao, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    {p.unidadesVendidas > 0 && (
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-xs text-gray-500">Vendas</span>
                                                <span className="text-xs font-bold text-gray-900">
                                                    {p.unidadesVendidas}/{p.unidades} ({progressVendas.toFixed(0)}%)
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${progressVendas}%` }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
