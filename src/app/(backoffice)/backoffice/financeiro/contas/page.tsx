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

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    hover: 'var(--bo-hover)',
    accent: '#486581',
}

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
                    <h1 className="text-2xl font-bold" style={{ color: T.text }}>Contas Bancárias</h1>
                    <p className="text-sm mt-1" style={{ color: T.textMuted }}>Gerencie suas contas e saldos</p>
                </div>
                <button
                    onClick={() => router.push('/backoffice/financeiro/contas/nova')}
                    className="flex items-center gap-2 h-11 px-6 text-white rounded-xl font-medium transition-colors hover:brightness-110"
                    style={{ background: T.accent }}
                >
                    <Plus size={20} />
                    Nova Conta
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Contas Ativas</p>
                    <p className="text-2xl font-bold" style={{ color: T.text }}>{contasAtivas.length}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-xs mb-1 text-green-500">Saldo Total</p>
                    <p className="text-2xl font-bold text-green-500">{formatPrice(saldoTotal)}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Média por Conta</p>
                    <p className="text-2xl font-bold" style={{ color: T.text }}>
                        {formatPrice(saldoTotal / contasAtivas.length)}
                    </p>
                </div>
                <div className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Inativas</p>
                    <p className="text-2xl font-bold text-red-400">
                        {contasData.filter(c => !c.ativa).length}
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                        <input
                            type="text"
                            placeholder="Buscar por banco ou conta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 rounded-xl outline-none focus:ring-2 focus:ring-[#334E68]"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                        />
                    </div>
                    <select
                        value={tipoFilter}
                        onChange={(e) => setTipoFilter(e.target.value)}
                        className="h-11 px-4 rounded-xl outline-none focus:ring-2 focus:ring-[#334E68]"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
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
                            className="rounded-2xl p-6 transition-all hover:brightness-105 cursor-pointer"
                            style={{
                                background: conta.ativa ? T.surface : T.elevated,
                                border: `1px solid ${T.border}`,
                            }}
                            onClick={() => router.push(`/backoffice/financeiro/contas/${conta.id}`)}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ background: conta.ativa ? `${T.accent}15` : T.elevated }}>
                                        <Building2 size={24} style={{ color: conta.ativa ? T.accent : T.textMuted }} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold mb-1" style={{ color: T.text }}>{conta.banco}</h3>
                                        <p className="text-sm" style={{ color: T.textMuted }}>
                                            Ag {conta.agencia} • CC {conta.conta}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {conta.ativa ? (
                                        <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded">
                                            Ativa
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 text-xs font-medium rounded"
                                            style={{ background: T.elevated, color: T.textMuted }}>
                                            Inativa
                                        </span>
                                    )}
                                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs font-medium rounded">
                                        {conta.tipo}
                                    </span>
                                </div>
                            </div>

                            {/* Saldo */}
                            <div className="mb-4 pb-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                                <p className="text-xs mb-1" style={{ color: T.textMuted }}>Saldo Atual</p>
                                <div className="flex items-end justify-between">
                                    <p className="text-3xl font-bold"
                                        style={{ color: conta.ativa ? T.text : T.textMuted }}>
                                        {formatPrice(conta.saldo)}
                                    </p>
                                    <div className={`flex items-center gap-1 text-sm font-medium ${variacaoPositiva ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {variacaoPositiva ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                        {Math.abs(conta.variacao).toFixed(1)}%
                                    </div>
                                </div>
                                <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                                    Anterior: {formatPrice(conta.saldoAnterior)}
                                </p>
                            </div>

                            {/* Info */}
                            <div className="space-y-3 mb-4">
                                <div>
                                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Titular</p>
                                    <p className="text-sm font-medium" style={{ color: T.text }}>{conta.titular}</p>
                                    <p className="text-xs" style={{ color: T.textMuted }}>{conta.cnpj}</p>
                                </div>
                                <div>
                                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Gerente</p>
                                    <p className="text-sm font-medium" style={{ color: T.text }}>{conta.gerente}</p>
                                    <p className="text-xs" style={{ color: T.textMuted }}>{conta.telefoneGerente}</p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                                <span className="text-xs" style={{ color: T.textMuted }}>
                                    Última movimentação: {getTimeAgo(conta.ultimaMovimentacao)}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            router.push(`/backoffice/financeiro/contas/${conta.id}/extrato`)
                                        }}
                                        className="p-2 rounded-lg transition-colors"
                                        style={{ color: T.textMuted }}
                                        onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            router.push(`/backoffice/financeiro/contas/${conta.id}/editar`)
                                        }}
                                        className="p-2 rounded-lg transition-colors"
                                        style={{ color: T.textMuted }}
                                        onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <Edit size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Empty State */}
            {filteredContas.length === 0 && (
                <div className="rounded-xl p-12 text-center"
                    style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ background: T.elevated }}>
                        <Search size={32} style={{ color: T.textMuted }} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: T.text }}>Nenhuma conta encontrada</h3>
                    <p className="mb-6" style={{ color: T.textMuted }}>Tente ajustar os filtros ou adicionar uma nova conta</p>
                    <button
                        onClick={() => router.push('/backoffice/financeiro/contas/nova')}
                        className="inline-flex items-center gap-2 h-11 px-6 text-white rounded-xl font-medium hover:brightness-110 transition-colors"
                        style={{ background: T.accent }}
                    >
                        <Plus size={20} />
                        Nova Conta
                    </button>
                </div>
            )}
        </div>
    )
}
