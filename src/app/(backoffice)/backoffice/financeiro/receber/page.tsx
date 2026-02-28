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
    User,
    Building2,
    Mail,
    Phone,
    Download,
    Filter,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Contas a receber mockadas
const contasReceberData = [
    {
        id: 1,
        protocol: 'REC-2026-001',
        cliente: 'Maria Santos Silva',
        cpf: '123.456.789-00',
        email: 'maria.santos@gmail.com',
        phone: '(81) 99845-3421',
        imovel: 'Reserva Atlantis Apto 802',
        descricao: 'Primeira parcela de sinal',
        valor: 58000,
        vencimento: '2026-02-20',
        dataCriacao: '2026-02-10',
        status: 'pendente',
        categoria: 'Sinal',
        formaPagamento: 'Transferência',
        observacoes: 'Cliente confirmou transferência para dia 20',
    },
    {
        id: 2,
        protocol: 'REC-2026-002',
        cliente: 'João Pedro Almeida',
        cpf: '234.567.890-11',
        email: 'joao.almeida@hotmail.com',
        phone: '(81) 98732-1098',
        imovel: 'Villa Jardins Casa 12',
        descricao: 'Parcela 2/10 da entrada',
        valor: 85000,
        vencimento: '2026-02-22',
        dataCriacao: '2026-02-05',
        status: 'pendente',
        categoria: 'Entrada',
        formaPagamento: 'TED',
        observacoes: null,
    },
    {
        id: 3,
        protocol: 'REC-2026-003',
        cliente: 'Ana Carolina Ferreira',
        cpf: '345.678.901-22',
        email: 'anacarolina.f@outlook.com',
        phone: '(81) 99234-5678',
        imovel: 'Smart Pina Apto 304',
        descricao: 'Pagamento integral',
        valor: 42000,
        vencimento: '2026-02-25',
        dataCriacao: '2026-02-12',
        status: 'atrasado',
        categoria: 'À Vista',
        formaPagamento: 'PIX',
        observacoes: 'Cliente solicitou prorrogação para dia 28',
    },
    {
        id: 4,
        protocol: 'REC-2026-004',
        cliente: 'Roberto Carlos Mendes',
        cpf: '456.789.012-33',
        email: 'roberto.mendes@empresarial.com.br',
        phone: '(81) 98123-4567',
        imovel: 'Ocean Blue Cobertura',
        descricao: 'Segunda parcela entrada',
        valor: 185000,
        vencimento: '2026-02-28',
        dataCriacao: '2026-02-08',
        status: 'pendente',
        categoria: 'Entrada',
        formaPagamento: 'Cheque',
        observacoes: 'Cheque depositado, aguardando compensação',
    },
    {
        id: 5,
        protocol: 'REC-2026-005',
        cliente: 'Patricia Lima Costa',
        cpf: '567.890.123-44',
        email: 'patricia.lima@gmail.com',
        phone: '(81) 99876-5432',
        imovel: 'Península Gardens Casa 8',
        descricao: 'Primeira parcela',
        valor: 120000,
        vencimento: '2026-02-15',
        dataCriacao: '2026-02-01',
        status: 'recebido',
        categoria: 'Entrada',
        formaPagamento: 'Transferência',
        observacoes: null,
        dataRecebimento: '2026-02-14',
    },
    {
        id: 6,
        protocol: 'REC-2026-006',
        cliente: 'Fernando Augusto Silva',
        cpf: '678.901.234-55',
        email: 'fernando.augusto@email.com',
        phone: '(81) 99123-4567',
        imovel: 'Candeias Park Apto 501',
        descricao: 'Pagamento final',
        valor: 28000,
        vencimento: '2026-02-18',
        dataCriacao: '2026-02-10',
        status: 'recebido',
        categoria: 'Final',
        formaPagamento: 'PIX',
        observacoes: null,
        dataRecebimento: '2026-02-17',
    },
]

export default function ContasReceberPage() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const filteredContas = contasReceberData.filter(conta => {
        const matchesSearch =
            conta.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conta.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conta.imovel.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || conta.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const stats = {
        total: contasReceberData.length,
        pendentes: contasReceberData.filter(c => c.status === 'pendente').length,
        atrasados: contasReceberData.filter(c => c.status === 'atrasado').length,
        recebidos: contasReceberData.filter(c => c.status === 'recebido').length,
        valorTotal: contasReceberData.reduce((acc, c) => acc + c.valor, 0),
        valorPendente: contasReceberData.filter(c => c.status !== 'recebido').reduce((acc, c) => acc + c.valor, 0),
    }

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; color: string; bg: string; icon: any }> = {
            pendente: { label: 'Pendente', color: 'text-orange-700', bg: 'bg-orange-50', icon: Clock },
            atrasado: { label: 'Atrasado', color: 'text-red-700', bg: 'bg-red-50', icon: AlertCircle },
            recebido: { label: 'Recebido', color: 'text-green-700', bg: 'bg-green-50', icon: CheckCircle },
        }
        return configs[status] || configs.pendente
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
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
                    <h1 className="text-2xl font-bold text-gray-900">Contas a Receber</h1>
                    <p className="text-sm text-gray-600 mt-1">Gerencie recebimentos e cobranças</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 h-11 px-6 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                        <Download size={20} />
                        Exportar
                    </button>
                    <button
                        onClick={() => router.push('/backoffice/financeiro/receber/novo')}
                        className="flex items-center gap-2 h-11 px-6 bg-[#16162A] text-white rounded-xl font-medium hover:bg-[#0F0F1E] transition-colors"
                    >
                        <Plus size={20} />
                        Nova Cobrança
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
                    <p className="text-xs text-green-600 mb-1">Recebidos</p>
                    <p className="text-2xl font-bold text-green-700">{stats.recebidos}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Valor Total</p>
                    <p className="text-xl font-bold text-gray-900">{formatPrice(stats.valorTotal)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-orange-600 mb-1">A Receber</p>
                    <p className="text-xl font-bold text-orange-700">{formatPrice(stats.valorPendente)}</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por protocolo, cliente ou imóvel..."
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
                        <option value="recebido">Recebido</option>
                    </select>
                </div>
            </div>

            {/* Lista */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {filteredContas.map((conta) => {
                        const statusConfig = getStatusConfig(conta.status)
                        const StatusIcon = statusConfig.icon
                        const isAtrasado = conta.status === 'atrasado'
                        const isRecebido = conta.status === 'recebido'

                        return (
                            <div
                                key={conta.id}
                                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => router.push(`/backoffice/financeiro/receber/${conta.id}`)}
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
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                                        {conta.categoria}
                                                    </span>
                                                </div>
                                                <h3 className="font-semibold text-gray-900 mb-1">{conta.cliente}</h3>
                                                <p className="text-sm text-gray-600">{conta.imovel}</p>
                                                <p className="text-sm text-gray-600">{conta.descricao}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-gray-900 mb-1">
                                                    {formatPrice(conta.valor)}
                                                </p>
                                                <p className="text-xs text-gray-500">{conta.formaPagamento}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                Vencimento: {new Date(conta.vencimento).toLocaleDateString('pt-BR')}
                                            </span>
                                            <span className={`flex items-center gap-1 font-medium ${isAtrasado ? 'text-red-600' : isRecebido ? 'text-green-600' : 'text-orange-600'
                                                }`}>
                                                <Clock size={14} />
                                                {isRecebido
                                                    ? `Recebido em ${new Date(conta.dataRecebimento!).toLocaleDateString('pt-BR')}`
                                                    : getDaysUntil(conta.vencimento)
                                                }
                                            </span>
                                        </div>

                                        {conta.observacoes && (
                                            <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded">
                                                {conta.observacoes}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                window.location.href = `mailto:${conta.email}`
                                            }}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <Mail size={16} className="text-gray-600" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                window.location.href = `https://wa.me/55${conta.phone.replace(/\D/g, '')}`
                                            }}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <Phone size={16} className="text-gray-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
