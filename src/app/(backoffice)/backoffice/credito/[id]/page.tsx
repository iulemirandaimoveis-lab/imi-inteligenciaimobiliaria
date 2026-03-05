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

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    hover: 'var(--bo-hover)',
    accent: 'var(--bo-accent)',
}

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
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.text }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: T.text }}>Crédito Imobiliário</h1>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-sm font-medium" style={{ color: T.textMuted }}>Protocolo: {credit.protocol}</span>
                            <span style={{ color: T.border }}>•</span>
                            {getStatusBadge(credit.status)}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        className="h-10 px-4 rounded-xl font-medium flex items-center gap-2"
                        style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.text }}
                    >
                        <Download size={18} />
                        Exportar
                    </button>
                    <button
                        className="h-10 px-4 rounded-xl font-medium flex items-center gap-2"
                        style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.text }}
                    >
                        <Mail size={18} />
                        Enviar Email
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Valor do Imóvel */}
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Home size={20} className="text-blue-600" />
                        </div>
                        <p className="text-sm font-medium" style={{ color: T.textMuted }}>Valor do Imóvel</p>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: T.text }}>
                        {formatCurrency(credit.property.saleValue)}
                    </p>
                </div>

                {/* Financiado */}
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                            <DollarSign size={20} className="text-green-600" />
                        </div>
                        <p className="text-sm font-medium" style={{ color: T.textMuted }}>Valor Financiado</p>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: T.text }}>
                        {formatCurrency(credit.financing.financedAmount)}
                    </p>
                    <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                        LTV: {credit.financing.ltv}%
                    </p>
                </div>

                {/* Parcela */}
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <CreditCard size={20} className="text-purple-600" />
                        </div>
                        <p className="text-sm font-medium" style={{ color: T.textMuted }}>Parcela Mensal</p>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: T.text }}>
                        {formatCurrency(credit.financing.monthlyPayment)}
                    </p>
                    <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                        {credit.financing.term} meses
                    </p>
                </div>

                {/* Taxa */}
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                            <Percent size={20} className="text-orange-600" />
                        </div>
                        <p className="text-sm font-medium" style={{ color: T.textMuted }}>Taxa de Juros</p>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: T.text }}>
                        {credit.financing.interestRate}% a.a.
                    </p>
                    <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                        Sistema {credit.financing.system}
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Dados do Cliente */}
                    <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: T.text }}>
                            <User size={20} className="text-blue-600" />
                            Dados do Cliente
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>Nome Completo</p>
                                <p className="text-sm font-medium" style={{ color: T.text }}>{credit.client.name}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>CPF</p>
                                <p className="text-sm font-medium" style={{ color: T.text }}>{credit.client.cpf}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>Email</p>
                                <p className="text-sm font-medium" style={{ color: T.text }}>{credit.client.email}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>Telefone</p>
                                <p className="text-sm font-medium" style={{ color: T.text }}>{credit.client.phone}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>Profissão</p>
                                <p className="text-sm font-medium" style={{ color: T.text }}>{credit.client.occupation}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>Renda Mensal</p>
                                <p className="text-sm font-medium" style={{ color: T.text }}>{formatCurrency(credit.client.income)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Dados do Imóvel */}
                    <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: T.text }}>
                            <Building2 size={20} className="text-green-600" />
                            Dados do Imóvel
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>Endereço</p>
                                <p className="text-sm font-medium" style={{ color: T.text }}>{credit.property.address}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>Tipo</p>
                                <p className="text-sm font-medium" style={{ color: T.text }}>{credit.property.type}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>Área</p>
                                <p className="text-sm font-medium" style={{ color: T.text }}>{credit.property.area}m²</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>Quartos</p>
                                <p className="text-sm font-medium" style={{ color: T.text }}>{credit.property.bedrooms}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>Banheiros</p>
                                <p className="text-sm font-medium" style={{ color: T.text }}>{credit.property.bathrooms}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabela de Amortização */}
                    <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: T.text }}>
                                <Calculator size={20} className="text-purple-600" />
                                Tabela de Amortização
                            </h3>
                            <button
                                onClick={() => setShowAmortization(!showAmortization)}
                                className="flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-400"
                            >
                                {showAmortization ? 'Ocultar' : 'Mostrar'} tabela
                                {showAmortization ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </div>

                        {showAmortization && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                            <th className="text-left py-3 px-2 font-medium" style={{ color: T.textMuted }}>Mês</th>
                                            <th className="text-right py-3 px-2 font-medium" style={{ color: T.textMuted }}>Parcela</th>
                                            <th className="text-right py-3 px-2 font-medium" style={{ color: T.textMuted }}>Amortização</th>
                                            <th className="text-right py-3 px-2 font-medium" style={{ color: T.textMuted }}>Juros</th>
                                            <th className="text-right py-3 px-2 font-medium" style={{ color: T.textMuted }}>Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {amortizationTable.map((row) => (
                                            <tr key={row.month} style={{ borderBottom: `1px solid ${T.border}` }}>
                                                <td className="py-3 px-2 font-medium" style={{ color: T.text }}>{row.month}</td>
                                                <td className="text-right py-3 px-2" style={{ color: T.text }}>{formatCurrency(row.payment)}</td>
                                                <td className="text-right py-3 px-2" style={{ color: T.textMuted }}>{formatCurrency(row.amortization)}</td>
                                                <td className="text-right py-3 px-2" style={{ color: T.textMuted }}>{formatCurrency(row.interest)}</td>
                                                <td className="text-right py-3 px-2 font-medium" style={{ color: T.text }}>{formatCurrency(row.balance)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p className="text-xs mt-4" style={{ color: T.textMuted }}>
                                    Mostrando primeiros 12 meses de {credit.financing.term} meses totais
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Análise de Risco */}
                    <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: T.text }}>
                            <TrendingUp size={20} className="text-orange-600" />
                            Análise de Risco
                        </h3>

                        <div className="space-y-4">
                            {/* LTV */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium" style={{ color: T.textMuted }}>LTV (Loan to Value)</p>
                                    <p className="text-sm font-bold" style={{ color: T.text }}>{credit.financing.ltv}%</p>
                                </div>
                                <div className="h-2 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                                    <div
                                        className={`h-full ${credit.financing.ltv <= 80 ? 'bg-green-500' : 'bg-orange-500'}`}
                                        style={{ width: `${credit.financing.ltv}%` }}
                                    />
                                </div>
                                <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                                    {credit.financing.ltv <= 80 ? 'Dentro do limite recomendado' : 'Acima do limite'}
                                </p>
                            </div>

                            {/* DTI */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium" style={{ color: T.textMuted }}>DTI (Debt to Income)</p>
                                    <p className="text-sm font-bold" style={{ color: T.text }}>{credit.financing.dti}%</p>
                                </div>
                                <div className="h-2 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                                    <div
                                        className={`h-full ${credit.financing.dti <= 30 ? 'bg-green-500' : 'bg-orange-500'}`}
                                        style={{ width: `${credit.financing.dti}%` }}
                                    />
                                </div>
                                <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                                    {credit.financing.dti <= 30 ? 'Comprometimento saudável' : 'Comprometimento elevado'}
                                </p>
                            </div>

                            {/* Entrada */}
                            <div className="pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium" style={{ color: T.textMuted }}>Entrada</p>
                                    <p className="text-sm font-bold" style={{ color: T.text }}>{formatCurrency(credit.financing.downPayment)}</p>
                                </div>
                                <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                                    {((credit.financing.downPayment / credit.property.saleValue) * 100).toFixed(0)}% do valor total
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Documentos */}
                    <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: T.text }}>
                            <FileText size={20} className="text-blue-600" />
                            Documentos
                        </h3>

                        <div className="space-y-3">
                            {credit.documents.map((doc, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-xl" style={{ background: T.elevated }}>
                                    <div className="flex items-center gap-3">
                                        <FileText size={18} style={{ color: T.textMuted }} />
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: T.text }}>{doc.name}</p>
                                            <p className="text-xs" style={{ color: T.textMuted }}>{doc.uploadedAt}</p>
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
                    <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: T.text }}>
                            <Calendar size={20} className="text-purple-600" />
                            Timeline
                        </h3>

                        <div className="space-y-4">
                            {credit.timeline.map((item, index) => (
                                <div key={index} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.status === 'completed' ? 'bg-green-100' :
                                                item.status === 'current' ? 'bg-blue-100' :
                                                    ''
                                            }`}
                                            style={item.status === 'pending' ? { background: T.elevated } : undefined}
                                        >
                                            {item.status === 'completed' ? (
                                                <CheckCircle size={16} className="text-green-600" />
                                            ) : item.status === 'current' ? (
                                                <Clock size={16} className="text-blue-600" />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full" style={{ background: T.textMuted }} />
                                            )}
                                        </div>
                                        {index < credit.timeline.length - 1 && (
                                            <div className={`w-0.5 h-8 ${item.status === 'completed' ? 'bg-green-200' : ''
                                                }`}
                                                style={item.status !== 'completed' ? { background: T.border } : undefined}
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <p className={`text-sm font-medium ${item.status === 'current' ? 'text-blue-500' : ''
                                            }`}
                                            style={item.status !== 'current' ? { color: T.text } : undefined}
                                        >
                                            {item.event}
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: T.textMuted }}>{item.date}</p>
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
