'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Plus,
    Search,
    Building2,
    Eye,
    Edit,
    Trash2,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    Download,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Contas bancárias mockadas
const contasData = [
    {
        id: 1,
        banco: 'Banco do Brasil',
        agencia: '3456-7',
        conta: '12345-6',
        tipo: 'Corrente',
        saldo: 1850000,
        saldoAnterior: 1720000,
        variacao: 7.6,
        titular: 'Iule Miranda Imóveis LTDA',
        cnpj: '12.345.678/0001-99',
        gerente: 'Carlos Mendonça',
        telefoneGerente: '(81) 3456-7890',
        ativa: true,
        ultimaMovimentacao: '2026-02-17T15:30:00',
    },
    {
        id: 2,
        banco: 'Caixa Econômica Federal',
        agencia: '0123',
        conta: '98765-4',
        tipo: 'Poupança',
        saldo: 650000,
        saldoAnterior: 620000,
        variacao: 4.8,
        titular: 'Iule Miranda Imóveis LTDA',
        cnpj: '12.345.678/0001-99',
        gerente: 'Fernanda Lima',
        telefoneGerente: '(81) 3123-4567',
        ativa: true,
        ultimaMovimentacao: '2026-02-16T10:20:00',
    },
    {
        id: 3,
        banco: 'Santander',
        agencia: '4567',
        conta: '11111-2',
        tipo: 'Corrente',
        saldo: 347500,
        saldoAnterior: 380000,
        variacao: -8.6,
        titular: 'Iule Miranda Imóveis LTDA',
        cnpj: '12.345.678/0001-99',
        gerente: 'Roberto Silva',
        telefoneGerente: '(81) 3789-0123',
        ativa: true,
        ultimaMovimentacao: '2026-02-17T14:15:00',
    },
    {
        id: 4,
        banco: 'Itaú',
        agencia: '7890',
        conta: '22222-8',
        tipo: 'Investimento',
        saldo: 520000,
        saldoAnterior: 500000,
        variacao: 4.0,
        titular: 'Iule Miranda Imóveis LTDA',
        cnpj: '12.345.678/0001-99',
        gerente: 'Patricia Costa',
        telefoneGerente: '(81) 3234-5678',
        ativa: true,
        ultimaMovimentacao: '2026-02-15T09:00:00',
    },
    {
        id: 5,
        banco: 'Bradesco',
        agencia: '1234',
        conta: '33333-0',
        tipo: 'Corrente',
        saldo: 0,
        saldoAnterior: 125000,
        variacao: -100,
        titular: 'Iule Miranda Imóveis LTDA',
        cnpj: '12.345.678/0001-99',
        gerente: 'João Santos',
        telefoneGerente: '(81) 3345-6789',
        ativa: false,
        ultimaMovimentacao: '2025-12-20T16:45:00',
    },
]

export default function ContasBancariasPage() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const [tipoFilter, setTipoFilter] = useState('all')

    const filteredContas = contasData.filter(conta => {
        const matchesSearch =
            conta.banco.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conta.conta.includes(searchTerm)
        const matchesTipo = tipoFilter === 'all' || conta.tipo === tipoFilter
        return matchesSearch && matchesTipo
    })

    const contasAtivas = contasData.filter(c => c.ativa)
    const saldoTotal = contasAtivas.reduce((acc, c) => acc + c.saldo, 0)

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
        }).format(price)
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
                    <h1 className="text-2xl font-bold text-gray-900">Contas Bancárias</h1>
                    <p className="text-sm text-gray-600 mt-1">Gerencie suas contas e saldos</p>
                </div>
                <button
                    onClick={() => router.push('/backoffice/financeiro/contas/nova')}
                    className="flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 transition-colors"
                >
                    <Plus size={20} />
                    Nova Conta
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Contas Ativas</p>
                    <p className="text-2xl font-bold text-gray-900">{contasAtivas.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Saldo Total</p>
                    <p className="text-2xl font-bold text-green-700">{formatPrice(saldoTotal)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Média por Conta</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {formatPrice(saldoTotal / contasAtivas.length)}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Inativas</p>
                    <p className="text-2xl font-bold text-red-700">
                        {contasData.filter(c => !c.ativa).length}
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por banco ou conta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                        />
                    </div>
                    <select
                        value={tipoFilter}
                        onChange={(e) => setTipoFilter(e.target.value)}
                        className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
                    >
                        <option value="all">Todos os tipos</option>
                        <option value="Corrente">Corrente</option>
                        <option value="Poupança">Poupança</option>
                        <option value="Investimento">Investimento</option>
                    </select>
                </div>
            </div>

            {/* Lista de Contas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredContas.map((conta) => {
                    const variacaoPositiva = conta.variacao >= 0

                    return (
                        <div
                            key={conta.id}
                            className={`bg-white rounded-2xl p-6 border transition-all hover:shadow-lg cursor-pointer ${conta.ativa ? 'border-gray-100' : 'border-gray-200 bg-gray-50'
                                }`}
                            onClick={() => router.push(`/backoffice/financeiro/contas/${conta.id}`)}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${conta.ativa ? 'bg-accent-50' : 'bg-gray-200'
                                        }`}>
                                        <Building2 size={24} className={conta.ativa ? 'text-accent-600' : 'text-gray-500'} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-1">{conta.banco}</h3>
                                        <p className="text-sm text-gray-600">
                                            Ag {conta.agencia} • CC {conta.conta}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {conta.ativa ? (
                                        <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">
                                            Ativa
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded">
                                            Inativa
                                        </span>
                                    )}
                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                                        {conta.tipo}
                                    </span>
                                </div>
                            </div>

                            {/* Saldo */}
                            <div className="mb-4 pb-4 border-b border-gray-100">
                                <p className="text-xs text-gray-600 mb-1">Saldo Atual</p>
                                <div className="flex items-end justify-between">
                                    <p className={`text-3xl font-bold ${conta.ativa ? 'text-gray-900' : 'text-gray-500'
                                        }`}>
                                        {formatPrice(conta.saldo)}
                                    </p>
                                    <div className={`flex items-center gap-1 text-sm font-medium ${variacaoPositiva ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {variacaoPositiva ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                        {Math.abs(conta.variacao).toFixed(1)}%
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Anterior: {formatPrice(conta.saldoAnterior)}
                                </p>
                            </div>

                            {/* Info */}
                            <div className="space-y-3 mb-4">
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Titular</p>
                                    <p className="text-sm font-medium text-gray-900">{conta.titular}</p>
                                    <p className="text-xs text-gray-500">{conta.cnpj}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Gerente</p>
                                    <p className="text-sm font-medium text-gray-900">{conta.gerente}</p>
                                    <p className="text-xs text-gray-500">{conta.telefoneGerente}</p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <span className="text-xs text-gray-500">
                                    Última movimentação: {getTimeAgo(conta.ultimaMovimentacao)}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            router.push(`/backoffice/financeiro/contas/${conta.id}/extrato`)
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Eye size={16} className="text-gray-600" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            router.push(`/backoffice/financeiro/contas/${conta.id}/editar`)
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
            {filteredContas.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma conta encontrada</h3>
                    <p className="text-gray-600 mb-6">Tente ajustar os filtros ou adicionar uma nova conta</p>
                    <button
                        onClick={() => router.push('/backoffice/financeiro/contas/nova')}
                        className="inline-flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700"
                    >
                        <Plus size={20} />
                        Nova Conta
                    </button>
                </div>
            )}
        </div>
    )
}
