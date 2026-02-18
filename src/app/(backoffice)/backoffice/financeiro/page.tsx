'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Calendar,
    CreditCard,
    FileText,
    AlertCircle,
    CheckCircle,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Dados financeiros mockados Recife
const financeiroData = {
    // KPIs Principais
    kpis: {
        saldoTotal: 2847500,
        receitaMes: 1950000,
        despesaMes: 485000,
        lucroMes: 1465000,
        margemLucro: 75.1,
        crescimento: 23.5,
    },

    // Contas Bancárias
    contas: [
        { banco: 'Banco do Brasil', agencia: '3456-7', conta: '12345-6', saldo: 1850000, tipo: 'Corrente' },
        { banco: 'Caixa Econômica', agencia: '0123', conta: '98765-4', saldo: 650000, tipo: 'Poupança' },
        { banco: 'Santander', agencia: '4567', conta: '11111-2', saldo: 347500, tipo: 'Corrente' },
    ],

    // Fluxo de Caixa (últimos 6 meses)
    fluxoCaixa: [
        { mes: 'Set/25', receita: 1650000, despesa: 420000, saldo: 1230000 },
        { mes: 'Out/25', receita: 1800000, despesa: 445000, saldo: 1355000 },
        { mes: 'Nov/25', receita: 1720000, despesa: 460000, saldo: 1260000 },
        { mes: 'Dez/25', receita: 2100000, despesa: 520000, saldo: 1580000 },
        { mes: 'Jan/26', receita: 1890000, despesa: 475000, saldo: 1415000 },
        { mes: 'Fev/26', receita: 1950000, despesa: 485000, saldo: 1465000 },
    ],

    // Contas a Receber (próximos 30 dias)
    contasReceber: [
        { id: 1, cliente: 'Maria Santos Silva', imovel: 'Reserva Atlantis Apto 802', valor: 58000, vencimento: '2026-02-20', status: 'pendente' },
        { id: 2, cliente: 'João Pedro Almeida', imovel: 'Villa Jardins Casa 12', valor: 85000, vencimento: '2026-02-22', status: 'pendente' },
        { id: 3, cliente: 'Ana Carolina Ferreira', imovel: 'Smart Pina Apto 304', valor: 42000, vencimento: '2026-02-25', status: 'pendente' },
        { id: 4, cliente: 'Roberto Carlos Mendes', imovel: 'Ocean Blue Cobertura', valor: 185000, vencimento: '2026-02-28', status: 'pendente' },
    ],

    // Contas a Pagar (próximos 30 dias)
    contasPagar: [
        { id: 1, fornecedor: 'Construtora Central', descricao: 'Pagamento obra Villa Jardins', valor: 145000, vencimento: '2026-02-18', status: 'pendente' },
        { id: 2, fornecedor: 'Meta Ads', descricao: 'Campanha Instagram Fevereiro', valor: 5000, vencimento: '2026-02-20', status: 'pendente' },
        { id: 3, fornecedor: 'Google Ads', descricao: 'Anúncios Boa Viagem', valor: 3000, vencimento: '2026-02-22', status: 'pago' },
        { id: 4, fornecedor: 'Supabase', descricao: 'Plano Pro - Fevereiro', valor: 125, vencimento: '2026-02-15', status: 'pago' },
    ],

    // Despesas por Categoria
    despesasPorCategoria: [
        { categoria: 'Marketing', valor: 85000, percentual: 17.5 },
        { categoria: 'Operacional', valor: 145000, percentual: 29.9 },
        { categoria: 'Pessoal', valor: 180000, percentual: 37.1 },
        { categoria: 'Infraestrutura', valor: 45000, percentual: 9.3 },
        { categoria: 'Outras', valor: 30000, percentual: 6.2 },
    ],
}

export default function FinanceiroPage() {
    const router = useRouter()
    const [periodoFilter, setPeriodoFilter] = useState('mes')

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

        if (diffDays < 0) return 'Vencido'
        if (diffDays === 0) return 'Hoje'
        if (diffDays === 1) return 'Amanhã'
        return `${diffDays} dias`
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Gestão completa de finanças e fluxo de caixa
                    </p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={periodoFilter}
                        onChange={(e) => setPeriodoFilter(e.target.value)}
                        className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
                    >
                        <option value="hoje">Hoje</option>
                        <option value="semana">Esta Semana</option>
                        <option value="mes">Este Mês</option>
                        <option value="trimestre">Trimestre</option>
                        <option value="ano">Ano</option>
                    </select>
                </div>
            </div>

            {/* KPIs Principais */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <DollarSign size={32} />
                        <div className="px-3 py-1 rounded-full text-xs font-medium bg-white/20">
                            +{financeiroData.kpis.crescimento}%
                        </div>
                    </div>
                    <p className="text-3xl font-bold mb-1">{formatPrice(financeiroData.kpis.saldoTotal)}</p>
                    <p className="text-sm text-green-100">Saldo Total em Contas</p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={16} className="text-green-600" />
                        <p className="text-xs text-gray-600">Receita Mês</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{formatPrice(financeiroData.kpis.receitaMes)}</p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingDown size={16} className="text-red-600" />
                        <p className="text-xs text-gray-600">Despesa Mês</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{formatPrice(financeiroData.kpis.despesaMes)}</p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle size={16} className="text-accent-600" />
                        <p className="text-xs text-gray-600">Lucro Líquido</p>
                    </div>
                    <p className="text-xl font-bold text-green-700">{formatPrice(financeiroData.kpis.lucroMes)}</p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText size={16} className="text-purple-600" />
                        <p className="text-xs text-gray-600">Margem</p>
                    </div>
                    <p className="text-xl font-bold text-purple-700">{financeiroData.kpis.margemLucro}%</p>
                </div>
            </div>

            {/* Contas Bancárias */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Contas Bancárias</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {financeiroData.contas.map((conta, index) => (
                        <div key={index} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-semibold text-gray-900">{conta.banco}</span>
                                <span className="px-2 py-1 bg-white text-xs font-medium text-gray-700 rounded">
                                    {conta.tipo}
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-3">
                                Ag {conta.agencia} • CC {conta.conta}
                            </p>
                            <p className="text-2xl font-bold text-gray-900">{formatPrice(conta.saldo)}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fluxo de Caixa e Despesas por Categoria */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fluxo de Caixa */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Fluxo de Caixa (6 meses)</h2>
                    <div className="space-y-4">
                        {financeiroData.fluxoCaixa.map((item, index) => {
                            const maxSaldo = Math.max(...financeiroData.fluxoCaixa.map(f => f.saldo))
                            const barWidth = (item.saldo / maxSaldo) * 100

                            return (
                                <div key={index}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-900">{item.mes}</span>
                                        <div className="flex items-center gap-4 text-xs">
                                            <span className="flex items-center gap-1 text-green-600">
                                                <ArrowUpRight size={12} />
                                                {formatPrice(item.receita)}
                                            </span>
                                            <span className="flex items-center gap-1 text-red-600">
                                                <ArrowDownRight size={12} />
                                                {formatPrice(item.despesa)}
                                            </span>
                                            <span className="font-bold text-gray-900">
                                                {formatPrice(item.saldo)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-accent-500 rounded-full transition-all duration-500"
                                            style={{ width: `${barWidth}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Despesas por Categoria */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Despesas por Categoria</h2>
                    <div className="space-y-4">
                        {financeiroData.despesasPorCategoria.map((item, index) => (
                            <div key={index}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-900">{item.categoria}</span>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">{formatPrice(item.valor)}</p>
                                        <p className="text-xs text-gray-500">{item.percentual}%</p>
                                    </div>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${index === 0 ? 'bg-blue-500' :
                                                index === 1 ? 'bg-purple-500' :
                                                    index === 2 ? 'bg-orange-500' :
                                                        index === 3 ? 'bg-green-500' :
                                                            'bg-gray-500'
                                            }`}
                                        style={{ width: `${item.percentual}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Contas a Receber e Pagar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contas a Receber */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Contas a Receber</h2>
                        <button
                            onClick={() => router.push('/backoffice/financeiro/receber')}
                            className="text-sm font-medium text-accent-600 hover:text-accent-700"
                        >
                            Ver todas
                        </button>
                    </div>
                    <div className="space-y-3">
                        {financeiroData.contasReceber.map((conta) => (
                            <div key={conta.id} className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">{conta.cliente}</p>
                                        <p className="text-xs text-gray-600">{conta.imovel}</p>
                                    </div>
                                    <p className="text-lg font-bold text-green-700">{formatPrice(conta.valor)}</p>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">
                                        Vence: {new Date(conta.vencimento).toLocaleDateString('pt-BR')}
                                    </span>
                                    <span className="font-medium text-green-700">
                                        {getDaysUntil(conta.vencimento)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contas a Pagar */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Contas a Pagar</h2>
                        <button
                            onClick={() => router.push('/backoffice/financeiro/pagar')}
                            className="text-sm font-medium text-accent-600 hover:text-accent-700"
                        >
                            Ver todas
                        </button>
                    </div>
                    <div className="space-y-3">
                        {financeiroData.contasPagar.map((conta) => {
                            const isPago = conta.status === 'pago'

                            return (
                                <div
                                    key={conta.id}
                                    className={`p-4 rounded-xl border ${isPago
                                            ? 'bg-gray-50 border-gray-200'
                                            : 'bg-orange-50 border-orange-200'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{conta.fornecedor}</p>
                                            <p className="text-xs text-gray-600">{conta.descricao}</p>
                                        </div>
                                        <p className={`text-lg font-bold ${isPago ? 'text-gray-500' : 'text-orange-700'}`}>
                                            {formatPrice(conta.valor)}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-600">
                                            {new Date(conta.vencimento).toLocaleDateString('pt-BR')}
                                        </span>
                                        {isPago ? (
                                            <span className="flex items-center gap-1 text-green-600 font-medium">
                                                <CheckCircle size={12} />
                                                Pago
                                            </span>
                                        ) : (
                                            <span className="font-medium text-orange-700">
                                                {getDaysUntil(conta.vencimento)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
