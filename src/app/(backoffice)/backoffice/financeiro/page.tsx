'use client'

import { useState } from 'react'
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    Download,
    ArrowUpCircle,
    ArrowDownCircle,
    BarChart3,
    Filter,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Dados mockados
const fluxoMensal = [
    { mes: 'Set/25', entradas: 380000, saidas: 220000, saldo: 160000 },
    { mes: 'Out/25', entradas: 420000, saidas: 195000, saldo: 225000 },
    { mes: 'Nov/25', entradas: 310000, saidas: 240000, saldo: 70000 },
    { mes: 'Dez/25', entradas: 580000, saidas: 260000, saldo: 320000 },
    { mes: 'Jan/26', entradas: 490000, saidas: 210000, saldo: 280000 },
    { mes: 'Fev/26', entradas: 345000, saidas: 185000, saldo: 160000 },
]

const lancamentos = [
    {
        id: 1,
        data: '2026-02-18',
        descricao: 'Comissão Venda - Reserva Atlantis Apto 905',
        categoria: 'Comissão',
        tipo: 'entrada',
        valor: 48000,
        status: 'confirmado',
    },
    {
        id: 2,
        data: '2026-02-17',
        descricao: 'Honorário Avaliação - Villa Jardins Unidade 304',
        categoria: 'Honorário',
        tipo: 'entrada',
        valor: 12500,
        status: 'confirmado',
    },
    {
        id: 3,
        data: '2026-02-16',
        descricao: 'Folha de Pagamento - Fevereiro 2026',
        categoria: 'Pessoal',
        tipo: 'saida',
        valor: 45000,
        status: 'confirmado',
    },
    {
        id: 4,
        data: '2026-02-15',
        descricao: 'Comissão Venda - Ocean Blue Cobertura',
        categoria: 'Comissão',
        tipo: 'entrada',
        valor: 72000,
        status: 'confirmado',
    },
    {
        id: 5,
        data: '2026-02-14',
        descricao: 'Meta Ads - Campanha Reserva Atlantis',
        categoria: 'Marketing',
        tipo: 'saida',
        valor: 8500,
        status: 'confirmado',
    },
    {
        id: 6,
        data: '2026-02-13',
        descricao: 'Aluguel Escritório - Boa Viagem',
        categoria: 'Infraestrutura',
        tipo: 'saida',
        valor: 7200,
        status: 'confirmado',
    },
    {
        id: 7,
        data: '2026-02-12',
        descricao: 'Honorário Consultoria - Fundo Soberano Qatar',
        categoria: 'Consultoria',
        tipo: 'entrada',
        valor: 95000,
        status: 'pendente',
    },
    {
        id: 8,
        data: '2026-02-10',
        descricao: 'Ferramentas SaaS (Supabase, Vercel, Claude API)',
        categoria: 'Tecnologia',
        tipo: 'saida',
        valor: 3200,
        status: 'confirmado',
    },
    {
        id: 9,
        data: '2026-02-08',
        descricao: 'Comissão Venda - Smart Pina Unidade 12B',
        categoria: 'Comissão',
        tipo: 'entrada',
        valor: 31500,
        status: 'confirmado',
    },
    {
        id: 10,
        data: '2026-02-06',
        descricao: 'Assessoria Jurídica - Contratos Fevereiro',
        categoria: 'Jurídico',
        tipo: 'saida',
        valor: 6800,
        status: 'confirmado',
    },
]

const maxBarValue = Math.max(...fluxoMensal.map(m => Math.max(m.entradas, m.saidas)))

export default function FluxoCaixaPage() {
    const [tipoFilter, setTipoFilter] = useState<'todos' | 'entrada' | 'saida'>('todos')
    const [periodoFilter, setPeriodoFilter] = useState('fev26')

    const filtered = lancamentos.filter(l => tipoFilter === 'todos' || l.tipo === tipoFilter)

    const totalEntradas = lancamentos.filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0)
    const totalSaidas = lancamentos.filter(l => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0)
    const saldoLiquido = totalEntradas - totalSaidas
    const saldoAnterior = 280000 // Janeiro

    const formatCurrency = (v: number) =>
        v >= 1000000
            ? `R$ ${(v / 1000000).toFixed(2)}M`
            : `R$ ${v.toLocaleString('pt-BR')}`

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Fluxo de Caixa</h1>
                    <p className="text-sm text-gray-600 mt-1">Entradas, saídas e saldo operacional</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={periodoFilter}
                        onChange={e => setPeriodoFilter(e.target.value)}
                        className="h-11 px-4 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    >
                        <option value="jan26">Janeiro 2026</option>
                        <option value="fev26">Fevereiro 2026</option>
                        <option value="mar26">Março 2026</option>
                    </select>
                    <button className="flex items-center gap-2 h-11 px-5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                        <Download size={16} />
                        Exportar
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 border">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Anterior</p>
                        <DollarSign size={18} className="text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(saldoAnterior)}</p>
                    <p className="text-xs text-gray-500 mt-1">Jan/26</p>
                </div>
                <div className="bg-white rounded-xl p-5 border">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-green-600 uppercase tracking-wider">Entradas</p>
                        <ArrowUpCircle size={18} className="text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-700">{formatCurrency(totalEntradas)}</p>
                    <p className="text-xs text-gray-500 mt-1">{lancamentos.filter(l => l.tipo === 'entrada').length} lançamentos</p>
                </div>
                <div className="bg-white rounded-xl p-5 border">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-red-600 uppercase tracking-wider">Saídas</p>
                        <ArrowDownCircle size={18} className="text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-red-700">{formatCurrency(totalSaidas)}</p>
                    <p className="text-xs text-gray-500 mt-1">{lancamentos.filter(l => l.tipo === 'saida').length} lançamentos</p>
                </div>
                <div className={`rounded-xl p-5 border ${saldoLiquido >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <p className={`text-xs font-medium uppercase tracking-wider ${saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Saldo Período
                        </p>
                        {saldoLiquido >= 0 ? <TrendingUp size={18} className="text-green-500" /> : <TrendingDown size={18} className="text-red-500" />}
                    </div>
                    <p className={`text-2xl font-bold ${saldoLiquido >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency(saldoLiquido)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Saldo final: {formatCurrency(saldoAnterior + saldoLiquido)}
                    </p>
                </div>
            </div>

            {/* Gráfico de Barras (CSS puro) */}
            <div className="bg-white rounded-2xl p-6 border">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Evolução 6 Meses</h2>
                    <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-green-500 inline-block" />
                            Entradas
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-red-400 inline-block" />
                            Saídas
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-[#1A1A2E] inline-block" />
                            Saldo
                        </span>
                    </div>
                </div>
                <div className="flex items-end gap-4 h-48">
                    {fluxoMensal.map((m) => (
                        <div key={m.mes} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full flex items-end gap-1 h-40">
                                {/* Entradas */}
                                <div className="flex-1 flex flex-col justify-end">
                                    <div
                                        className="bg-green-500 rounded-t-sm transition-all"
                                        style={{ height: `${(m.entradas / maxBarValue) * 100}%` }}
                                    />
                                </div>
                                {/* Saídas */}
                                <div className="flex-1 flex flex-col justify-end">
                                    <div
                                        className="bg-red-400 rounded-t-sm transition-all"
                                        style={{ height: `${(m.saidas / maxBarValue) * 100}%` }}
                                    />
                                </div>
                                {/* Saldo */}
                                <div className="flex-1 flex flex-col justify-end">
                                    <div
                                        className={`rounded-t-sm transition-all ${m.saldo >= 0 ? 'bg-[#1A1A2E]' : 'bg-red-600'}`}
                                        style={{ height: `${(Math.abs(m.saldo) / maxBarValue) * 100}%` }}
                                    />
                                </div>
                            </div>
                            <span className="text-xs text-gray-500 font-medium">{m.mes}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lançamentos */}
            <div className="bg-white rounded-2xl border overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Lançamentos</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setTipoFilter('todos')}
                            className={`px-4 h-9 rounded-lg text-sm font-medium transition-colors ${tipoFilter === 'todos' ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setTipoFilter('entrada')}
                            className={`px-4 h-9 rounded-lg text-sm font-medium transition-colors ${tipoFilter === 'entrada' ? 'bg-green-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            Entradas
                        </button>
                        <button
                            onClick={() => setTipoFilter('saida')}
                            className={`px-4 h-9 rounded-lg text-sm font-medium transition-colors ${tipoFilter === 'saida' ? 'bg-red-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            Saídas
                        </button>
                    </div>
                </div>
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrição</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoria</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.map((l) => (
                            <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {new Date(l.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {l.tipo === 'entrada'
                                            ? <ArrowUpCircle size={16} className="text-green-500 flex-shrink-0" />
                                            : <ArrowDownCircle size={16} className="text-red-500 flex-shrink-0" />
                                        }
                                        <span className="text-sm text-gray-900">{l.descricao}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                        {l.categoria}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${l.status === 'confirmado'
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-orange-50 text-orange-700'
                                        }`}>
                                        {l.status === 'confirmado' ? 'Confirmado' : 'Pendente'}
                                    </span>
                                </td>
                                <td className={`px-6 py-4 text-right text-sm font-bold ${l.tipo === 'entrada' ? 'text-green-700' : 'text-red-700'}`}>
                                    {l.tipo === 'saida' ? '-' : '+'}{formatCurrency(l.valor)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
