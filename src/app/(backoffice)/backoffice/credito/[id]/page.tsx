'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    ArrowLeft,
    DollarSign,
    Home,
    Calendar,
    TrendingUp,
    FileText,
    Download,
    Mail,
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
    Loader2,
    AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

const supabase = createClient()

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    hover: 'var(--bo-hover)',
    accent: 'var(--bo-accent)',
}

interface CreditApplication {
    id: string
    protocol: string
    status: string
    created_at: string
    client_name: string
    client_email: string | null
    client_phone: string | null
    client_cpf: string | null
    client_income: number | null
    client_occupation: string | null
    property_address: string | null
    property_type: string | null
    property_value: number
    property_area: number | null
    bank: string | null
    financed_amount: number
    down_payment: number | null
    term_months: number
    interest_rate: number | null
    monthly_payment: number | null
    system: string | null
    ltv: number | null
    dti: number | null
    documents: Array<{ name: string; status: string; uploadedAt?: string }> | null
    timeline: Array<{ date: string; event: string; status: string }> | null
}

export default function CreditoDetalhesPage() {
    const router = useRouter()
    const params = useParams()
    const [credit, setCredit] = useState<CreditApplication | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showAmortization, setShowAmortization] = useState(false)

    useEffect(() => {
        async function fetchCredit() {
            try {
                const { data, error } = await supabase
                    .from('credit_applications')
                    .select('*')
                    .eq('id', params.id)
                    .single()
                if (error) throw new Error(error.message)
                setCredit(data as CreditApplication)
            } catch (err: any) {
                setError(err.message || 'Crédito não encontrado')
            } finally {
                setLoading(false)
            }
        }
        if (params.id) fetchCredit()
    }, [params.id])

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value)

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { label: string; color: string; icon: React.ElementType }> = {
            approved:     { label: 'Aprovado',     color: 'bg-green-100 text-green-700',  icon: CheckCircle },
            aprovado:     { label: 'Aprovado',     color: 'bg-green-100 text-green-700',  icon: CheckCircle },
            pending:      { label: 'Pendente',     color: 'bg-yellow-100 text-yellow-700', icon: Clock },
            pendente:     { label: 'Pendente',     color: 'bg-yellow-100 text-yellow-700', icon: Clock },
            rejected:     { label: 'Rejeitado',    color: 'bg-red-100 text-red-700',       icon: XCircle },
            recusado:     { label: 'Rejeitado',    color: 'bg-red-100 text-red-700',       icon: XCircle },
            under_review: { label: 'Em Análise',   color: 'bg-blue-100 text-blue-700',     icon: AlertCircle },
            analise:      { label: 'Em Análise',   color: 'bg-blue-100 text-blue-700',     icon: AlertCircle },
            documents:    { label: 'Documentação', color: 'bg-purple-100 text-purple-700', icon: FileText },
            documentacao: { label: 'Documentação', color: 'bg-purple-100 text-purple-700', icon: FileText },
        }
        const badge = badges[status] || badges.pending
        const Icon = badge.icon
        return (
            <span className={`px-3 py-1.5 ${badge.color} rounded-lg text-sm font-medium flex items-center gap-2 w-fit`}>
                <Icon size={16} />
                {badge.label}
            </span>
        )
    }

    const generateAmortization = (financedAmount: number, interestRate: number, term: number) => {
        const monthlyRate = interestRate / 100 / 12
        const amortization = financedAmount / term
        return Array.from({ length: 12 }, (_, i) => {
            const balance = financedAmount - (amortization * i)
            const interest = balance * monthlyRate
            const payment = amortization + interest
            const newBalance = balance - amortization
            return { month: i + 1, payment, amortization, interest, balance: newBalance }
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: T.accent }} />
                    <p style={{ color: T.textMuted }}>Carregando crédito...</p>
                </div>
            </div>
        )
    }

    if (error || !credit) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-400" />
                    <h2 className="text-lg font-bold mb-2" style={{ color: T.text }}>Erro ao carregar</h2>
                    <p className="text-sm mb-4" style={{ color: T.textMuted }}>{error || 'Crédito não encontrado'}</p>
                    <button
                        onClick={() => router.push('/backoffice/credito')}
                        className="px-4 py-2 rounded-xl text-white text-sm font-medium"
                        style={{ backgroundColor: T.accent }}
                    >
                        Voltar para lista
                    </button>
                </div>
            </div>
        )
    }

    const amortizationTable = (credit.interest_rate && credit.financed_amount && credit.term_months)
        ? generateAmortization(credit.financed_amount, credit.interest_rate, credit.term_months)
        : []

    const documents = Array.isArray(credit.documents) ? credit.documents : []
    const timeline = Array.isArray(credit.timeline) ? credit.timeline : []

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
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
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="text-sm font-medium" style={{ color: T.textMuted }}>
                                Protocolo: {credit.protocol}
                            </span>
                            <span style={{ color: T.border }}>•</span>
                            {getStatusBadge(credit.status)}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => toast.info('Exportação em desenvolvimento')}
                        className="h-10 px-4 rounded-xl font-medium flex items-center gap-2"
                        style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.text }}
                    >
                        <Download size={18} />
                        Exportar
                    </button>
                    {credit.client_email && (
                        <a
                            href={`mailto:${credit.client_email}`}
                            className="h-10 px-4 rounded-xl font-medium flex items-center gap-2"
                            style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.text }}
                        >
                            <Mail size={18} />
                            Enviar Email
                        </a>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                            <Home size={20} className="text-blue-400" />
                        </div>
                        <p className="text-sm font-medium" style={{ color: T.textMuted }}>Valor do Imóvel</p>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: T.text }}>
                        {formatCurrency(credit.property_value)}
                    </p>
                </div>

                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                            <DollarSign size={20} className="text-green-400" />
                        </div>
                        <p className="text-sm font-medium" style={{ color: T.textMuted }}>Valor Financiado</p>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: T.text }}>
                        {formatCurrency(credit.financed_amount)}
                    </p>
                    {credit.ltv != null && (
                        <p className="text-xs mt-1" style={{ color: T.textMuted }}>LTV: {credit.ltv}%</p>
                    )}
                </div>

                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                            <CreditCard size={20} className="text-purple-400" />
                        </div>
                        <p className="text-sm font-medium" style={{ color: T.textMuted }}>Parcela Mensal</p>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: T.text }}>
                        {credit.monthly_payment ? formatCurrency(credit.monthly_payment) : '—'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: T.textMuted }}>{credit.term_months} meses</p>
                </div>

                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
                            <Percent size={20} className="text-orange-400" />
                        </div>
                        <p className="text-sm font-medium" style={{ color: T.textMuted }}>Taxa de Juros</p>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: T.text }}>
                        {credit.interest_rate ? `${credit.interest_rate}% a.a.` : '—'}
                    </p>
                    {credit.system && (
                        <p className="text-xs mt-1" style={{ color: T.textMuted }}>Sistema {credit.system}</p>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Dados do Cliente */}
                    <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: T.text }}>
                            <User size={20} className="text-blue-400" />
                            Dados do Cliente
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>Nome Completo</p>
                                <p className="text-sm font-medium" style={{ color: T.text }}>{credit.client_name}</p>
                            </div>
                            {credit.client_cpf && (
                                <div>
                                    <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>CPF</p>
                                    <p className="text-sm font-medium font-mono" style={{ color: T.text }}>{credit.client_cpf}</p>
                                </div>
                            )}
                            {credit.client_email && (
                                <div>
                                    <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>Email</p>
                                    <p className="text-sm font-medium" style={{ color: T.text }}>{credit.client_email}</p>
                                </div>
                            )}
                            {credit.client_phone && (
                                <div>
                                    <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>Telefone</p>
                                    <p className="text-sm font-medium" style={{ color: T.text }}>{credit.client_phone}</p>
                                </div>
                            )}
                            {credit.client_occupation && (
                                <div>
                                    <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>Profissão</p>
                                    <p className="text-sm font-medium" style={{ color: T.text }}>{credit.client_occupation}</p>
                                </div>
                            )}
                            {credit.client_income && (
                                <div>
                                    <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>Renda Mensal</p>
                                    <p className="text-sm font-medium" style={{ color: T.text }}>{formatCurrency(credit.client_income)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dados do Imóvel */}
                    <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: T.text }}>
                            <Building2 size={20} className="text-green-400" />
                            Dados do Imóvel
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {credit.property_address && (
                                <div className="col-span-2">
                                    <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>Endereço</p>
                                    <p className="text-sm font-medium" style={{ color: T.text }}>{credit.property_address}</p>
                                </div>
                            )}
                            {credit.property_type && (
                                <div>
                                    <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>Tipo</p>
                                    <p className="text-sm font-medium" style={{ color: T.text }}>{credit.property_type}</p>
                                </div>
                            )}
                            {credit.property_area && (
                                <div>
                                    <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>Área</p>
                                    <p className="text-sm font-medium" style={{ color: T.text }}>{credit.property_area}m²</p>
                                </div>
                            )}
                            {credit.bank && (
                                <div>
                                    <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>Banco</p>
                                    <p className="text-sm font-medium" style={{ color: T.text }}>{credit.bank}</p>
                                </div>
                            )}
                            {credit.down_payment && (
                                <div>
                                    <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>Entrada</p>
                                    <p className="text-sm font-medium" style={{ color: T.text }}>{formatCurrency(credit.down_payment)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabela de Amortização */}
                    {amortizationTable.length > 0 && (
                        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: T.text }}>
                                    <Calculator size={20} className="text-purple-400" />
                                    Tabela de Amortização
                                </h3>
                                <button
                                    onClick={() => setShowAmortization(!showAmortization)}
                                    className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300"
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
                                        Mostrando primeiros 12 meses de {credit.term_months} meses totais
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Análise de Risco */}
                    {(credit.ltv != null || credit.dti != null) && (
                        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: T.text }}>
                                <TrendingUp size={20} className="text-orange-400" />
                                Análise de Risco
                            </h3>
                            <div className="space-y-4">
                                {credit.ltv != null && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium" style={{ color: T.textMuted }}>LTV (Loan to Value)</p>
                                            <p className="text-sm font-bold" style={{ color: T.text }}>{credit.ltv}%</p>
                                        </div>
                                        <div className="h-2 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                                            <div
                                                className={`h-full ${credit.ltv <= 80 ? 'bg-green-500' : 'bg-orange-500'}`}
                                                style={{ width: `${Math.min(credit.ltv, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                                            {credit.ltv <= 80 ? 'Dentro do limite recomendado' : 'Acima do limite'}
                                        </p>
                                    </div>
                                )}
                                {credit.dti != null && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium" style={{ color: T.textMuted }}>DTI (Debt to Income)</p>
                                            <p className="text-sm font-bold" style={{ color: T.text }}>{credit.dti}%</p>
                                        </div>
                                        <div className="h-2 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                                            <div
                                                className={`h-full ${credit.dti <= 30 ? 'bg-green-500' : 'bg-orange-500'}`}
                                                style={{ width: `${Math.min(credit.dti, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                                            {credit.dti <= 30 ? 'Comprometimento saudável' : 'Comprometimento elevado'}
                                        </p>
                                    </div>
                                )}
                                {credit.down_payment && (
                                    <div className="pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium" style={{ color: T.textMuted }}>Entrada</p>
                                            <p className="text-sm font-bold" style={{ color: T.text }}>{formatCurrency(credit.down_payment)}</p>
                                        </div>
                                        <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                                            {((credit.down_payment / credit.property_value) * 100).toFixed(0)}% do valor total
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Documentos */}
                    {documents.length > 0 && (
                        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: T.text }}>
                                <FileText size={20} className="text-blue-400" />
                                Documentos
                            </h3>
                            <div className="space-y-3">
                                {documents.map((doc, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-xl" style={{ background: T.elevated }}>
                                        <div className="flex items-center gap-3">
                                            <FileText size={18} style={{ color: T.textMuted }} />
                                            <div>
                                                <p className="text-sm font-medium" style={{ color: T.text }}>{doc.name}</p>
                                                {doc.uploadedAt && (
                                                    <p className="text-xs" style={{ color: T.textMuted }}>{doc.uploadedAt}</p>
                                                )}
                                            </div>
                                        </div>
                                        {doc.status === 'approved' ? (
                                            <CheckCircle size={18} className="text-green-500" />
                                        ) : (
                                            <Clock size={18} className="text-yellow-500" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    {timeline.length > 0 ? (
                        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: T.text }}>
                                <Calendar size={20} className="text-purple-400" />
                                Timeline
                            </h3>
                            <div className="space-y-4">
                                {timeline.map((item, index) => (
                                    <div key={index} className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                    item.status === 'completed' ? 'bg-green-500/15' :
                                                    item.status === 'current'   ? 'bg-blue-500/15' : ''
                                                }`}
                                                style={item.status === 'pending' ? { background: T.elevated } : undefined}
                                            >
                                                {item.status === 'completed' ? (
                                                    <CheckCircle size={16} className="text-green-500" />
                                                ) : item.status === 'current' ? (
                                                    <Clock size={16} className="text-blue-400" />
                                                ) : (
                                                    <div className="w-2 h-2 rounded-full" style={{ background: T.textMuted }} />
                                                )}
                                            </div>
                                            {index < timeline.length - 1 && (
                                                <div
                                                    className={`w-0.5 h-8 ${item.status === 'completed' ? 'bg-green-500/30' : ''}`}
                                                    style={item.status !== 'completed' ? { background: T.border } : undefined}
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <p
                                                className={`text-sm font-medium`}
                                                style={{ color: item.status === 'current' ? '#60A5FA' : T.text }}
                                            >
                                                {item.event}
                                            </p>
                                            <p className="text-xs mt-1" style={{ color: T.textMuted }}>{item.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Timeline vazia — info básica */
                        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: T.text }}>
                                <Calendar size={20} className="text-purple-400" />
                                Informações
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Criado em</p>
                                    <p className="text-sm font-medium" style={{ color: T.text }}>
                                        {new Date(credit.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
