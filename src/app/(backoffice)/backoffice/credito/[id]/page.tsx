'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
    ArrowLeft,
    DollarSign,
    Home,
    Calendar,
    TrendingUp,
    FileText,
    Download,
    Mail,
    Phone,
    User,
    Building2,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Calculator,
    Percent,
    CreditCard,
} from 'lucide-react'

// Mock data (seria carregado do Supabase)
const mockCreditData = {
    id: 'CRD-2026-001',
    protocol: 'CRD-2026-001',
    status: 'approved',
    createdAt: '2026-02-01',

    // Cliente
    client: {
        name: 'Carlos Eduardo Silva',
        email: 'carlos.silva@email.com',
        phone: '(81) 99876-5432',
        cpf: '123.456.789-00',
        income: 15000,
        occupation: 'Engenheiro Civil',
    },

    // Imóvel
    property: {
        address: 'Av. Boa Viagem, 3500 - Apto 802',
        type: 'Apartamento',
        saleValue: 680000,
        area: 95,
        bedrooms: 3,
        bathrooms: 2,
    },

    // Financiamento
    financing: {
        bank: 'Caixa Econômica Federal',
        financedAmount: 544000,
        downPayment: 136000,
        term: 360,
        interestRate: 9.5,
        monthlyPayment: 4589.20,
        system: 'SAC',
        ltv: 80,
        dti: 30.6,
    },

    // Documentos
    documents: [
        { name: 'RG e CPF', status: 'approved', uploadedAt: '2026-02-01' },
        { name: 'Comprovante de Renda', status: 'approved', uploadedAt: '2026-02-01' },
        { name: 'Comprovante de Residência', status: 'approved', uploadedAt: '2026-02-02' },
        { name: 'Certidão de Casamento', status: 'approved', uploadedAt: '2026-02-02' },
        { name: 'FGTS', status: 'pending', uploadedAt: '2026-02-03' },
    ],

    // Timeline
    timeline: [
        { date: '2026-02-01', event: 'Solicitação criada', status: 'completed' },
        { date: '2026-02-02', event: 'Documentos enviados', status: 'completed' },
        { date: '2026-02-05', event: 'Análise de crédito iniciada', status: 'completed' },
        { date: '2026-02-08', event: 'Aprovado pela Caixa', status: 'completed' },
        { date: '2026-02-15', event: 'Aguardando assinatura', status: 'current' },
        { date: '2026-02-20', event: 'Liberação dos recursos', status: 'pending' },
    ],
}

export default function CreditoDetalhesPage() {
    const router = useRouter()
    const params = useParams()
    const [showAmortization, setShowAmortization] = useState(false)

    const credit = mockCreditData

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
        }).format(value)
    }

    const getStatusBadge = (status: string) => {
        const badges = {
            approved: { label: 'Aprovado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
            pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
            rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-700', icon: XCircle },
            analysis: { label: 'Em Análise', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
        }
        const badge = badges[status as keyof typeof badges] || badges.pending
        const Icon = badge.icon

        return (
            <span className={`px-3 py-1.5 ${badge.color} rounded-lg text-sm font-medium flex items-center gap-2 w-fit`}>
                <Icon size={16} />
                {badge.label}
            </span>
        )
    }

    // Gerar tabela de amortização (primeiros 12 meses)
    const generateAmortization = () => {
        const { financedAmount, interestRate, term } = credit.financing
        const monthlyRate = interestRate / 100 / 12
        const amortization = financedAmount / term

        return Array.from({ length: 12 }, (_, i) => {
            const month = i + 1
            const balance = financedAmount - (amortization * i)
            const interest = balance * monthlyRate
            const payment = amortization + interest
            const newBalance = balance - amortization

            return {
                month,
                payment,
                amortization,
                interest,
                balance: newBalance,
            }
        })
    }

    const amortizationTable = generateAmortization()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Crédito Imobiliário</h1>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-sm font-medium text-gray-600">Protocolo: {credit.protocol}</span>
                            <span className="text-gray-300">•</span>
                            {getStatusBadge(credit.status)}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="h-10 px-4 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 flex items-center gap-2">
                        <Download size={18} />
                        Exportar
                    </button>
                    <button className="h-10 px-4 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 flex items-center gap-2">
                        <Mail size={18} />
                        Enviar Email
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Valor do Imóvel */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Home size={20} className="text-blue-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">Valor do Imóvel</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(credit.property.saleValue)}
                    </p>
                </div>

                {/* Financiado */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                            <DollarSign size={20} className="text-green-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">Valor Financiado</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(credit.financing.financedAmount)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        LTV: {credit.financing.ltv}%
                    </p>
                </div>

                {/* Parcela */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <CreditCard size={20} className="text-purple-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">Parcela Mensal</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(credit.financing.monthlyPayment)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        {credit.financing.term} meses
                    </p>
                </div>

                {/* Taxa */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                            <Percent size={20} className="text-orange-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">Taxa de Juros</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {credit.financing.interestRate}% a.a.
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        Sistema {credit.financing.system}
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Dados do Cliente */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <User size={20} className="text-blue-600" />
                            Dados do Cliente
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-medium text-gray-600 mb-1">Nome Completo</p>
                                <p className="text-sm font-medium text-gray-900">{credit.client.name}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-600 mb-1">CPF</p>
                                <p className="text-sm font-medium text-gray-900">{credit.client.cpf}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-600 mb-1">Email</p>
                                <p className="text-sm font-medium text-gray-900">{credit.client.email}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-600 mb-1">Telefone</p>
                                <p className="text-sm font-medium text-gray-900">{credit.client.phone}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-600 mb-1">Profissão</p>
                                <p className="text-sm font-medium text-gray-900">{credit.client.occupation}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-600 mb-1">Renda Mensal</p>
                                <p className="text-sm font-medium text-gray-900">{formatCurrency(credit.client.income)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Dados do Imóvel */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Building2 size={20} className="text-green-600" />
                            Dados do Imóvel
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <p className="text-xs font-medium text-gray-600 mb-1">Endereço</p>
                                <p className="text-sm font-medium text-gray-900">{credit.property.address}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-600 mb-1">Tipo</p>
                                <p className="text-sm font-medium text-gray-900">{credit.property.type}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-600 mb-1">Área</p>
                                <p className="text-sm font-medium text-gray-900">{credit.property.area}m²</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-600 mb-1">Quartos</p>
                                <p className="text-sm font-medium text-gray-900">{credit.property.bedrooms}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-600 mb-1">Banheiros</p>
                                <p className="text-sm font-medium text-gray-900">{credit.property.bathrooms}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabela de Amortização */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Calculator size={20} className="text-purple-600" />
                                Tabela de Amortização
                            </h3>
                            <button
                                onClick={() => setShowAmortization(!showAmortization)}
                                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                {showAmortization ? 'Ocultar' : 'Mostrar'} tabela
                                {showAmortization ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </div>

                        {showAmortization && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-2 font-medium text-gray-600">Mês</th>
                                            <th className="text-right py-3 px-2 font-medium text-gray-600">Parcela</th>
                                            <th className="text-right py-3 px-2 font-medium text-gray-600">Amortização</th>
                                            <th className="text-right py-3 px-2 font-medium text-gray-600">Juros</th>
                                            <th className="text-right py-3 px-2 font-medium text-gray-600">Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {amortizationTable.map((row) => (
                                            <tr key={row.month} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-2 font-medium text-gray-900">{row.month}</td>
                                                <td className="text-right py-3 px-2 text-gray-900">{formatCurrency(row.payment)}</td>
                                                <td className="text-right py-3 px-2 text-gray-700">{formatCurrency(row.amortization)}</td>
                                                <td className="text-right py-3 px-2 text-gray-700">{formatCurrency(row.interest)}</td>
                                                <td className="text-right py-3 px-2 font-medium text-gray-900">{formatCurrency(row.balance)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p className="text-xs text-gray-600 mt-4">
                                    Mostrando primeiros 12 meses de {credit.financing.term} meses totais
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Análise de Risco */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUp size={20} className="text-orange-600" />
                            Análise de Risco
                        </h3>

                        <div className="space-y-4">
                            {/* LTV */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-700">LTV (Loan to Value)</p>
                                    <p className="text-sm font-bold text-gray-900">{credit.financing.ltv}%</p>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${credit.financing.ltv <= 80 ? 'bg-green-500' : 'bg-orange-500'}`}
                                        style={{ width: `${credit.financing.ltv}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                    {credit.financing.ltv <= 80 ? 'Dentro do limite recomendado' : 'Acima do limite'}
                                </p>
                            </div>

                            {/* DTI */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-700">DTI (Debt to Income)</p>
                                    <p className="text-sm font-bold text-gray-900">{credit.financing.dti}%</p>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${credit.financing.dti <= 30 ? 'bg-green-500' : 'bg-orange-500'}`}
                                        style={{ width: `${credit.financing.dti}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                    {credit.financing.dti <= 30 ? 'Comprometimento saudável' : 'Comprometimento elevado'}
                                </p>
                            </div>

                            {/* Entrada */}
                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-700">Entrada</p>
                                    <p className="text-sm font-bold text-gray-900">{formatCurrency(credit.financing.downPayment)}</p>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                    {((credit.financing.downPayment / credit.property.saleValue) * 100).toFixed(0)}% do valor total
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Documentos */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-blue-600" />
                            Documentos
                        </h3>

                        <div className="space-y-3">
                            {credit.documents.map((doc, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <FileText size={18} className="text-gray-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                            <p className="text-xs text-gray-600">{doc.uploadedAt}</p>
                                        </div>
                                    </div>
                                    {doc.status === 'approved' ? (
                                        <CheckCircle size={18} className="text-green-600" />
                                    ) : (
                                        <Clock size={18} className="text-yellow-600" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-purple-600" />
                            Timeline
                        </h3>

                        <div className="space-y-4">
                            {credit.timeline.map((item, index) => (
                                <div key={index} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.status === 'completed' ? 'bg-green-100' :
                                                item.status === 'current' ? 'bg-blue-100' :
                                                    'bg-gray-100'
                                            }`}>
                                            {item.status === 'completed' ? (
                                                <CheckCircle size={16} className="text-green-600" />
                                            ) : item.status === 'current' ? (
                                                <Clock size={16} className="text-blue-600" />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-gray-400" />
                                            )}
                                        </div>
                                        {index < credit.timeline.length - 1 && (
                                            <div className={`w-0.5 h-8 ${item.status === 'completed' ? 'bg-green-200' : 'bg-gray-200'
                                                }`} />
                                        )}
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <p className={`text-sm font-medium ${item.status === 'current' ? 'text-blue-700' : 'text-gray-900'
                                            }`}>
                                            {item.event}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1">{item.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
