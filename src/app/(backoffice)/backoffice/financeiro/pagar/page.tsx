'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Plus,
    Search,
    CheckCircle,
    Clock,
    AlertCircle,
    Calendar,
    Building2,
    FileText,
    Mail,
    Download,
    XCircle,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Contas a pagar mockadas
const contasPagarData = [
    {
        id: 1,
        protocol: 'PAG-2026-001',
        fornecedor: 'Construtora Central',
        cnpj: '12.345.678/0001-99',
        email: 'financeiro@construtoracentral.com.br',
        categoria: 'Obra',
        descricao: 'Pagamento etapa 3 - Villa Jardins',
        valor: 145000,
        vencimento: '2026-02-18',
        dataCriacao: '2026-02-08',
        status: 'pendente',
        formaPagamento: 'Transferência',
        contaBancaria: 'BB - 3456-7',
        observacoes: 'Aguardando medição final do engenheiro',
    },
    {
        id: 2,
        protocol: 'PAG-2026-002',
        fornecedor: 'Meta Ads',
        cnpj: '98.765.432/0001-11',
        email: 'invoices@meta.com',
        categoria: 'Marketing',
        descricao: 'Campanhas Instagram - Fevereiro',
        valor: 5000,
        vencimento: '2026-02-20',
        dataCriacao: '2026-02-05',
        status: 'pendente',
        formaPagamento: 'Cartão de Crédito',
        contaBancaria: 'Santander - 4567',
        observacoes: null,
    },
    {
        id: 3,
        protocol: 'PAG-2026-003',
        fornecedor: 'Google Ads',
        cnpj: '11.222.333/0001-44',
        email: 'payments@google.com',
        categoria: 'Marketing',
        descricao: 'Anúncios Google - Fevereiro',
        valor: 3000,
        vencimento: '2026-02-22',
        dataCriacao: '2026-02-01',
        status: 'pago',
        formaPagamento: 'Cartão de Crédito',
        contaBancaria: 'Santander - 4567',
        observacoes: null,
        dataPagamento: '2026-02-20',
    },
    {
        id: 4,
        protocol: 'PAG-2026-004',
        fornecedor: 'Supabase Inc',
        cnpj: '44.555.666/0001-77',
        email: 'billing@supabase.com',
        categoria: 'Infraestrutura',
        descricao: 'Plano Pro - Fevereiro',
        valor: 125,
        vencimento: '2026-02-15',
        dataCriacao: '2026-02-01',
        status: 'pago',
        formaPagamento: 'Cartão de Crédito',
        contaBancaria: 'Santander - 4567',
        observacoes: 'Pagamento automático',
        dataPagamento: '2026-02-15',
    },
    {
        id: 5,
        protocol: 'PAG-2026-005',
        fornecedor: 'Vercel Inc',
        cnpj: '77.888.999/0001-00',
        email: 'billing@vercel.com',
        categoria: 'Infraestrutura',
        descricao: 'Plano Pro - Fevereiro',
        valor: 180,
        vencimento: '2026-02-15',
        dataCriacao: '2026-02-01',
        status: 'pago',
        formaPagamento: 'Cartão de Crédito',
        contaBancaria: 'Santander - 4567',
        observacoes: 'Pagamento automático',
        dataPagamento: '2026-02-15',
    },
    {
        id: 6,
        protocol: 'PAG-2026-006',
        fornecedor: 'Energia Celpe',
        cnpj: '55.666.777/0001-88',
        email: null,
        categoria: 'Operacional',
        descricao: 'Conta de luz - Janeiro',
        valor: 850,
        vencimento: '2026-02-10',
        dataCriacao: '2026-02-01',
        status: 'atrasado',
        formaPagamento: 'Boleto',
        contaBancaria: 'BB - 3456-7',
        observacoes: 'Aguardando aprovação pagamento',
    },
    {
        id: 7,
        protocol: 'PAG-2026-007',
        fornecedor: 'Equipe IMI',
        cnpj: null,
        email: null,
        categoria: 'Pessoal',
        descricao: 'Folha de pagamento - Fevereiro',
        valor: 85000,
        vencimento: '2026-02-28',
        dataCriacao: '2026-02-15',
        status: 'pendente',
        formaPagamento: 'Transferência',
        contaBancaria: 'BB - 3456-7',
        observacoes: '5 colaboradores',
    },
]

export default function ContasPagarPage() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const filteredContas = contasPagarData.filter(conta => {
        const matchesSearch =
            conta.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conta.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conta.descricao.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || conta.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const stats = {
        total: contasPagarData.length,
        pendentes: contasPagarData.filter(c => c.status === 'pendente').length,
        atrasados: contasPagarData.filter(c => c.status === 'atrasado').length,
        pagos: contasPagarData.filter(c => c.status === 'pago').length,
        valorTotal: contasPagarData.reduce((acc, c) => acc + c.valor, 0),
        valorPendente: contasPagarData.filter(c => c.status !== 'pago').reduce((acc, c) => acc + c.valor, 0),
    }

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; color: string; bg: string; icon: any }> = {
            pendente: { label: 'Pendente', color: 'text-orange-700', bg: 'bg-orange-50', icon: Clock },
            atrasado: { label: 'Atrasado', color: 'text-red-700', bg: 'bg-red-50', icon: AlertCircle },
            pago: { label: 'Pago', color: 'text-green-700', bg: 'bg-green-50', icon: CheckCircle },
            cancelado: { label: 'Cancelado', color: 'text-gray-700', bg: 'bg-gray-50', icon: XCircle },
        }
        return configs[status] || configs.pendente
    }

    const getCategoriaColor = (categoria: string) => {
        const colors: Record<string, string> = {
            'Obra': 'bg-blue-50 text-blue-700',
            'Marketing': 'bg-purple-50 text-purple-700',
            'Infraestrutura': 'bg-green-50 text-green-700',
            'Operacional': 'bg-orange-50 text-orange-700',
            'Pessoal': 'bg-accent-50 text-[#0F0F1E]',
        }
        return colors[categoria] || 'bg-gray-50 text-gray-700'
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
        }).format(price)
    }

    const getDaysUntil = (dateStr: string) => {
        const today = new Date()
        const target = new Date(dateStr)
        const diffTime = target.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays < 0) return `${Math.abs(diffDays)} dias atrás`
        if (diffDays === 0) return 'Hoje'
        if (diffDays === 1) return 'Amanhã'
        return `em ${diffDays} dias`
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Contas a Pagar</h1>
                    <p className="text-sm text-gray-600 mt-1">Gerencie pagamentos e despesas</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 h-11 px-6 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                        <Download size={20} />
                        Exportar
                    </button>
                    <button
                        onClick={() => router.push('/backoffice/financeiro/pagar/novo')}
                        className="flex items-center gap-2 h-11 px-6 bg-[#16162A] text-white rounded-xl font-medium hover:bg-[#0F0F1E] transition-colors"
                    >
                        <Plus size={20} />
                        Nova Despesa
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-orange-600 mb-1">Pendentes</p>
                    <p className="text-2xl font-bold text-orange-700">{stats.pendentes}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-red-600 mb-1">Atrasados</p>
                    <p className="text-2xl font-bold text-red-700">{stats.atrasados}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-green-600 mb-1">Pagos</p>
                    <p className="text-2xl font-bold text-green-700">{stats.pagos}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Valor Total</p>
                    <p className="text-xl font-bold text-gray-900">{formatPrice(stats.valorTotal)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-red-600 mb-1">A Pagar</p>
                    <p className="text-xl font-bold text-red-700">{formatPrice(stats.valorPendente)}</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por protocolo, fornecedor ou descrição..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white"
                    >
                        <option value="all">Todos os status</option>
                        <option value="pendente">Pendente</option>
                        <option value="atrasado">Atrasado</option>
                        <option value="pago">Pago</option>
                    </select>
                </div>
            </div>

            {/* Lista */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {filteredContas.map((conta) => {
                        const statusConfig = getStatusConfig(conta.status)
                        const StatusIcon = statusConfig.icon
                        const isPago = conta.status === 'pago'

                        return (
                            <div
                                key={conta.id}
                                className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${isPago ? 'opacity-60' : ''
                                    }`}
                                onClick={() => router.push(`/backoffice/financeiro/pagar/${conta.id}`)}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${statusConfig.bg}`}>
                                        <StatusIcon size={24} className={statusConfig.color} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-sm font-bold text-[#3B82F6]">{conta.protocol}</span>
                                                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoriaColor(conta.categoria)}`}>
                                                        {conta.categoria}
                                                    </span>
                                                </div>
                                                <h3 className="font-semibold text-gray-900 mb-1">{conta.fornecedor}</h3>
                                                {conta.cnpj && (
                                                    <p className="text-xs text-gray-500 mb-1">CNPJ: {conta.cnpj}</p>
                                                )}
                                                <p className="text-sm text-gray-600">{conta.descricao}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-2xl font-bold mb-1 ${isPago ? 'text-gray-500' : 'text-gray-900'}`}>
                                                    {formatPrice(conta.valor)}
                                                </p>
                                                <p className="text-xs text-gray-500">{conta.formaPagamento}</p>
                                                <p className="text-xs text-gray-500">{conta.contaBancaria}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                Vencimento: {new Date(conta.vencimento).toLocaleDateString('pt-BR')}
                                            </span>
                                            {isPago ? (
                                                <span className="flex items-center gap-1 text-green-600 font-medium">
                                                    <CheckCircle size={14} />
                                                    Pago em {new Date(conta.dataPagamento!).toLocaleDateString('pt-BR')}
                                                </span>
                                            ) : (
                                                <span className={`flex items-center gap-1 font-medium ${conta.status === 'atrasado' ? 'text-red-600' : 'text-orange-600'
                                                    }`}>
                                                    <Clock size={14} />
                                                    {getDaysUntil(conta.vencimento)}
                                                </span>
                                            )}
                                        </div>

                                        {conta.observacoes && (
                                            <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded mt-2">
                                                {conta.observacoes}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {!isPago && (
                                        <div className="flex flex-col gap-2 flex-shrink-0">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    // Marcar como pago
                                                }}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                            >
                                                Marcar Pago
                                            </button>
                                            {conta.email && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        window.location.href = `mailto:${conta.email}`
                                                    }}
                                                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    <Mail size={16} className="text-gray-600 mx-auto" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
