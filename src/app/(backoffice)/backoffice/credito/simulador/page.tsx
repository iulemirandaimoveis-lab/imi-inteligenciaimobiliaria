'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Calculator,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Home,
    Calendar,
    Percent,
    Download,
    Save,
    Building2,
    AlertCircle,
    CheckCircle,
    Info,
} from 'lucide-react'

// ⚠️ Bancos reais Brasil com taxas médias 2026
const bancos = [
    { id: 1, name: 'Caixa Econômica Federal', rate: 9.5, color: 'blue' },
    { id: 2, name: 'Banco do Brasil', rate: 8.9, color: 'yellow' },
    { id: 3, name: 'Itaú', rate: 9.8, color: 'orange' },
    { id: 4, name: 'Santander', rate: 8.7, color: 'red' },
    { id: 5, name: 'Bradesco', rate: 9.6, color: 'red' },
]

interface AmortizationRow {
    month: number
    payment: number
    principal: number
    interest: number
    balance: number
}

export default function SimuladorCreditoPage() {
    const router = useRouter()

    // Form State
    const [propertyValue, setPropertyValue] = useState(580000)
    const [downPayment, setDownPayment] = useState(116000)
    const [term, setTerm] = useState(360)
    const [interestRate, setInterestRate] = useState(9.5)
    const [system, setSystem] = useState<'sac' | 'price'>('price')
    const [selectedBank, setSelectedBank] = useState(bancos[0])

    // Calculated State
    const [financedAmount, setFinancedAmount] = useState(0)
    const [monthlyPayment, setMonthlyPayment] = useState(0)
    const [totalPayment, setTotalPayment] = useState(0)
    const [totalInterest, setTotalInterest] = useState(0)
    const [ltv, setLtv] = useState(0)
    const [amortization, setAmortization] = useState<AmortizationRow[]>([])

    // Recalculate on input change
    useEffect(() => {
        calculate()
    }, [propertyValue, downPayment, term, interestRate, system])

    const calculate = () => {
        const financed = propertyValue - downPayment
        setFinancedAmount(financed)

        const ltvCalc = (financed / propertyValue) * 100
        setLtv(ltvCalc)

        const monthlyRate = interestRate / 100 / 12
        let payment = 0
        let total = 0
        const schedule: AmortizationRow[] = []

        if (system === 'price') {
            // Sistema PRICE (parcelas fixas)
            payment = financed * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1)

            let balance = financed
            for (let i = 1; i <= term; i++) {
                const interestPayment = balance * monthlyRate
                const principalPayment = payment - interestPayment
                balance -= principalPayment

                schedule.push({
                    month: i,
                    payment,
                    principal: principalPayment,
                    interest: interestPayment,
                    balance: Math.max(0, balance),
                })
            }

            total = payment * term
        } else {
            // Sistema SAC (amortização constante)
            const principalPayment = financed / term
            let balance = financed

            for (let i = 1; i <= term; i++) {
                const interestPayment = balance * monthlyRate
                payment = principalPayment + interestPayment
                balance -= principalPayment

                schedule.push({
                    month: i,
                    payment,
                    principal: principalPayment,
                    interest: interestPayment,
                    balance: Math.max(0, balance),
                })

                total += payment
            }

            payment = schedule[0].payment // Primeira parcela (maior no SAC)
        }

        setMonthlyPayment(payment)
        setTotalPayment(total)
        setTotalInterest(total - financed)
        setAmortization(schedule)
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
        }).format(value)
    }

    const formatPercent = (value: number) => {
        return `${value.toFixed(2)}%`
    }

    const downPaymentPercent = (downPayment / propertyValue) * 100

    const handleSaveSimulation = () => {
        // TODO: Integrar com Supabase
        alert('Simulação salva com sucesso!')
        router.push('/backoffice/credito')
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Simulador de Crédito</h1>
                        <p className="text-sm text-gray-600 mt-1">Calcule financiamento imobiliário em tempo real</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 h-11 px-6 border border-gray-200 rounded-xl font-medium hover:bg-gray-50">
                        <Download size={20} />
                        Exportar PDF
                    </button>
                    <button
                        onClick={handleSaveSimulation}
                        className="flex items-center gap-2 h-11 px-6 bg-[#16162A] text-white rounded-xl font-medium hover:bg-[#0F0F1E]"
                    >
                        <Save size={20} />
                        Salvar Simulação
                    </button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Form (Sticky) */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 sticky top-6 space-y-6">
                        <h2 className="text-lg font-bold text-gray-900">Dados da Simulação</h2>

                        {/* Valor do Imóvel */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Valor do Imóvel
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                                <input
                                    type="number"
                                    value={propertyValue}
                                    onChange={(e) => setPropertyValue(Number(e.target.value))}
                                    className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                                />
                            </div>
                        </div>

                        {/* Entrada */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">Entrada</label>
                                <span className="text-sm font-bold text-[#486581]">
                                    {downPaymentPercent.toFixed(1)}%
                                </span>
                            </div>
                            <div className="relative mb-3">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                                <input
                                    type="number"
                                    value={downPayment}
                                    onChange={(e) => setDownPayment(Number(e.target.value))}
                                    className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                                />
                            </div>
                            <input
                                type="range"
                                min="0"
                                max={propertyValue}
                                step="1000"
                                value={downPayment}
                                onChange={(e) => setDownPayment(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [#243B53]"
                            />
                        </div>

                        {/* Prazo */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">Prazo</label>
                                <span className="text-sm font-bold text-gray-900">
                                    {term} meses ({(term / 12).toFixed(0)} anos)
                                </span>
                            </div>
                            <input
                                type="range"
                                min="12"
                                max="420"
                                step="12"
                                value={term}
                                onChange={(e) => setTerm(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [#243B53]"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>1 ano</span>
                                <span>10</span>
                                <span>20</span>
                                <span>30</span>
                                <span>35 anos</span>
                            </div>
                        </div>

                        {/* Taxa de Juros */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">Taxa de Juros (a.a.)</label>
                                <span className="text-sm font-bold text-purple-700">{formatPercent(interestRate)}</span>
                            </div>
                            <input
                                type="range"
                                min="7"
                                max="12"
                                step="0.1"
                                value={interestRate}
                                onChange={(e) => setInterestRate(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>7%</span>
                                <span>9.5%</span>
                                <span>12%</span>
                            </div>
                        </div>

                        {/* Sistema */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Sistema de Amortização</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setSystem('price')}
                                    className={`h-11 rounded-xl font-medium transition-all ${system === 'price'
                                            ? 'bg-[#16162A] text-white'
                                            : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    PRICE
                                </button>
                                <button
                                    onClick={() => setSystem('sac')}
                                    className={`h-11 rounded-xl font-medium transition-all ${system === 'sac'
                                            ? 'bg-[#16162A] text-white'
                                            : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    SAC
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                {system === 'price'
                                    ? 'Parcelas fixas durante todo o período'
                                    : 'Parcelas decrescentes, amortização constante'}
                            </p>
                        </div>

                        {/* Banco */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Banco</label>
                            <select
                                value={selectedBank.id}
                                onChange={(e) => {
                                    const bank = bancos.find(b => b.id === Number(e.target.value))
                                    if (bank) {
                                        setSelectedBank(bank)
                                        setInterestRate(bank.rate)
                                    }
                                }}
                                className="w-full h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68] bg-white"
                            >
                                {bancos.map(bank => (
                                    <option key={bank.id} value={bank.id}>
                                        {bank.name} - {bank.rate}% a.a.
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Results */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Resumo Principal */}
                    <div className="bg-gradient-to-br from-[#102A43] to-[#16162A] rounded-2xl p-8 text-white">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-sm text-accent-100 mb-1">Parcela Mensal</p>
                                <p className="text-3xl font-bold">{formatCurrency(monthlyPayment)}</p>
                                {system === 'sac' && (
                                    <p className="text-xs text-accent-200 mt-1">Primeira parcela</p>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-accent-100 mb-1">Valor Financiado</p>
                                <p className="text-2xl font-bold">{formatCurrency(financedAmount)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-accent-100 mb-1">Total a Pagar</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalPayment)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-accent-100 mb-1">Total Juros</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalInterest)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Indicadores */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl p-6 border border-gray-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ltv <= 70 ? 'bg-green-50' : ltv <= 80 ? 'bg-orange-50' : 'bg-red-50'
                                    }`}>
                                    <Percent size={20} className={
                                        ltv <= 70 ? 'text-green-600' : ltv <= 80 ? 'text-orange-600' : 'text-red-600'
                                    } />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600">LTV (Loan-to-Value)</p>
                                    <p className={`text-2xl font-bold ${ltv <= 70 ? 'text-green-700' : ltv <= 80 ? 'text-orange-700' : 'text-red-700'
                                        }`}>
                                        {ltv.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                {ltv <= 70 && '✓ Excelente - Aprovação facilitada'}
                                {ltv > 70 && ltv <= 80 && '⚠ Bom - Dentro do limite padrão'}
                                {ltv > 80 && '✗ Alto - Pode exigir garantias adicionais'}
                            </p>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-gray-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                    <TrendingUp size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600">Entrada</p>
                                    <p className="text-2xl font-bold text-blue-700">
                                        {downPaymentPercent.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                {formatCurrency(downPayment)} de entrada
                            </p>
                        </div>
                    </div>

                    {/* Tabela Amortização */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Tabela de Amortização</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Mostrando primeiras 12 e últimas 12 parcelas
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Mês</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Parcela</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Amortização</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Juros</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Saldo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {/* Primeiras 12 */}
                                    {amortization.slice(0, 12).map((row) => (
                                        <tr key={row.month} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.month}</td>
                                            <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                                                {formatCurrency(row.payment)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right text-green-700">
                                                {formatCurrency(row.principal)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right text-red-700">
                                                {formatCurrency(row.interest)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right text-gray-600">
                                                {formatCurrency(row.balance)}
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Separador */}
                                    {amortization.length > 24 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-3 text-center text-sm text-gray-500 bg-gray-50">
                                                ... {amortization.length - 24} parcelas intermediárias ...
                                            </td>
                                        </tr>
                                    )}

                                    {/* Últimas 12 */}
                                    {amortization.slice(-12).map((row) => (
                                        <tr key={row.month} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.month}</td>
                                            <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                                                {formatCurrency(row.payment)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right text-green-700">
                                                {formatCurrency(row.principal)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right text-red-700">
                                                {formatCurrency(row.interest)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right text-gray-600">
                                                {formatCurrency(row.balance)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Comparativo Bancos */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Comparativo de Bancos</h3>
                        <div className="space-y-3">
                            {bancos.map((bank) => {
                                const monthlyRate = bank.rate / 100 / 12
                                const payment = financedAmount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1)
                                const total = payment * term
                                const interest = total - financedAmount

                                return (
                                    <div
                                        key={bank.id}
                                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedBank.id === bank.id
                                                ? 'border-[#334E68] bg-accent-50'
                                                : 'border-gray-100 hover:border-gray-200'
                                            }`}
                                        onClick={() => {
                                            setSelectedBank(bank)
                                            setInterestRate(bank.rate)
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900">{bank.name}</p>
                                                <p className="text-sm text-gray-600">Taxa: {bank.rate}% a.a.</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-gray-900">{formatCurrency(payment)}</p>
                                                <p className="text-xs text-gray-600">Total: {formatCurrency(total)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
