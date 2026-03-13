'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    Plus,
    Search,
    Building2,
    Eye,
    Edit,
    TrendingUp,
    TrendingDown,
    Landmark,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { getStatusConfig } from '@/app/(backoffice)/lib/constants'
import { PageIntelHeader, KPICard, FilterTabs, ActionMenu, StatusBadge } from '@/app/(backoffice)/components/ui'
import type { FilterTab } from '@/app/(backoffice)/components/ui'

const supabase = createClient()

interface BankAccount {
    id: string
    banco: string
    agencia: string | null
    conta: string | null
    tipo: string | null
    saldo: number
    saldo_anterior: number | null
    titular: string | null
    cnpj: string | null
    gerente: string | null
    telefone_gerente: string | null
    is_active: boolean
    ultima_movimentacao: string | null
    created_at: string
}

export default function ContasBancariasPage() {
    const router = useRouter()
    const [contas, setContas] = useState<BankAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [tipoFilter, setTipoFilter] = useState('all')

    useEffect(() => {
        async function fetchContas() {
            const { data, error } = await supabase
                .from('bank_accounts')
                .select('*')
                .order('created_at', { ascending: false })

            if (!error && data) setContas(data as BankAccount[])
            setLoading(false)
        }
        fetchContas()
    }, [])

    const filteredContas = contas.filter(conta => {
        const matchesSearch =
            conta.banco.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (conta.conta || '').includes(searchTerm)
        const matchesTipo = tipoFilter === 'all' || conta.tipo === tipoFilter
        return matchesSearch && matchesTipo
    })

    const contasAtivas = contas.filter(c => c.is_active)
    const saldoTotal = contasAtivas.reduce((acc, c) => acc + (c.saldo || 0), 0)

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(price)

    const getTimeAgo = (dateStr: string | null) => {
        if (!dateStr) return 'Sem movimentação'
        const now = new Date()
        const past = new Date(dateStr)
        const diffMinutes = Math.floor((now.getTime() - past.getTime()) / 60000)
        if (diffMinutes < 60) return `${diffMinutes}min atrás`
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atrás`
        return `${Math.floor(diffMinutes / 1440)}d atrás`
    }

    const getVariacao = (conta: BankAccount) => {
        if (!conta.saldo_anterior || conta.saldo_anterior === 0) return 0
        return ((conta.saldo - conta.saldo_anterior) / conta.saldo_anterior) * 100
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageIntelHeader
                moduleLabel="FINANCEIRO"
                title="Contas Bancárias"
                subtitle="Gerencie suas contas e saldos"
                actions={
                    <button
                        onClick={() => router.push('/backoffice/financeiro/contas/nova')}
                        className="flex items-center gap-2 h-11 px-6 text-white rounded-xl font-semibold transition-opacity hover:opacity-80"
                        style={{ background: T.accent }}
                    >
                        <Plus size={18} />
                        Nova Conta
                    </button>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KPICard
                    label="Contas Ativas"
                    value={loading ? '—' : contasAtivas.length}
                    icon={<Landmark size={14} />}
                    accent="blue"
                    size="sm"
                />
                <KPICard
                    label="Saldo Total"
                    value={loading ? '—' : formatPrice(saldoTotal)}
                    icon={<TrendingUp size={14} />}
                    accent="green"
                    size="sm"
                />
                <KPICard
                    label="Média por Conta"
                    value={loading ? '—' : (contasAtivas.length > 0 ? formatPrice(saldoTotal / contasAtivas.length) : '—')}
                    icon={<Building2 size={14} />}
                    accent="cold"
                    size="sm"
                />
                <KPICard
                    label="Inativas"
                    value={loading ? '—' : contas.filter(c => !c.is_active).length}
                    icon={<TrendingDown size={14} />}
                    accent="hot"
                    size="sm"
                />
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: T.textMuted }} />
                    <input
                        type="text"
                        placeholder="Buscar por banco ou conta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 rounded-xl outline-none text-sm"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                    />
                </div>
                <FilterTabs
                    tabs={[
                        { id: 'all',          label: 'Todas',       count: contas.length },
                        { id: 'Corrente',     label: 'Corrente',    dotColor: '#60A5FA' },
                        { id: 'Poupança',     label: 'Poupança',    dotColor: 'var(--bo-success)' },
                        { id: 'Investimento', label: 'Investimento',dotColor: 'var(--bo-warning)' },
                    ] as FilterTab[]}
                    active={tipoFilter}
                    onChange={setTipoFilter}
                />
            </div>

            {/* Lista de Contas */}
            {loading ? null : filteredContas.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredContas.map((conta) => {
                        const variacao = getVariacao(conta)
                        const variacaoPositiva = variacao >= 0

                        return (
                            <div
                                key={conta.id}
                                className="rounded-2xl p-6 transition-all hover:brightness-105 cursor-pointer"
                                style={{
                                    background: conta.is_active ? T.surface : T.elevated,
                                    border: `1px solid ${T.border}`,
                                }}
                                onClick={() => router.push(`/backoffice/financeiro/contas/${conta.id}`)}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                            style={{ background: conta.is_active ? `${T.accent}15` : T.elevated }}>
                                            <Building2 size={24} style={{ color: conta.is_active ? T.accent : T.textMuted }} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold mb-1" style={{ color: T.text }}>{conta.banco}</h3>
                                            <p className="text-sm" style={{ color: T.textMuted }}>
                                                {conta.agencia ? `Ag ${conta.agencia}` : ''}{conta.conta ? ` • CC ${conta.conta}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge statusKey={conta.is_active ? 'ativo' : 'inativo'} size="xs" dot />
                                        {conta.tipo && (
                                            <span className="px-2 py-1 text-xs font-semibold rounded-lg"
                                                style={{ background: `${getStatusConfig('em_negociacao').dot}1f`, color: getStatusConfig('em_negociacao').dot }}>
                                                {conta.tipo}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Saldo */}
                                <div className="mb-4 pb-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Saldo Atual</p>
                                    <div className="flex items-end justify-between">
                                        <p className="text-3xl font-bold"
                                            style={{ color: conta.is_active ? T.text : T.textMuted }}>
                                            {formatPrice(conta.saldo)}
                                        </p>
                                        {conta.saldo_anterior != null && conta.saldo_anterior > 0 && (
                                            <div className="flex items-center gap-1 text-sm font-medium"
                                                style={{ color: variacaoPositiva ? 'var(--bo-success)' : 'var(--bo-error)' }}>
                                                {variacaoPositiva ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                                {Math.abs(variacao).toFixed(1)}%
                                            </div>
                                        )}
                                    </div>
                                    {conta.saldo_anterior != null && conta.saldo_anterior > 0 && (
                                        <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                                            Anterior: {formatPrice(conta.saldo_anterior)}
                                        </p>
                                    )}
                                </div>

                                {/* Info */}
                                {(conta.titular || conta.gerente) && (
                                    <div className="space-y-3 mb-4">
                                        {conta.titular && (
                                            <div>
                                                <p className="text-xs mb-1" style={{ color: T.textMuted }}>Titular</p>
                                                <p className="text-sm font-medium" style={{ color: T.text }}>{conta.titular}</p>
                                                {conta.cnpj && (
                                                    <p className="text-xs" style={{ color: T.textMuted }}>{conta.cnpj}</p>
                                                )}
                                            </div>
                                        )}
                                        {conta.gerente && (
                                            <div>
                                                <p className="text-xs mb-1" style={{ color: T.textMuted }}>Gerente</p>
                                                <p className="text-sm font-medium" style={{ color: T.text }}>{conta.gerente}</p>
                                                {conta.telefone_gerente && (
                                                    <p className="text-xs" style={{ color: T.textMuted }}>{conta.telefone_gerente}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                                    <span className="text-xs" style={{ color: T.textMuted }}>
                                        Última movimentação: {getTimeAgo(conta.ultima_movimentacao)}
                                    </span>
                                    <ActionMenu
                                        size="sm"
                                        items={[
                                            { label: 'Ver Extrato', icon: <Eye size={14} />, onClick: () => router.push(`/backoffice/financeiro/contas/${conta.id}/extrato`) },
                                            { label: 'Editar', icon: <Edit size={14} />, onClick: () => router.push(`/backoffice/financeiro/contas/${conta.id}/editar`) },
                                        ]}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                /* Empty State */
                <div className="rounded-2xl p-12 text-center"
                    style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-20"
                        style={{ background: T.elevated }}>
                        <Landmark size={32} style={{ color: T.textMuted }} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: T.text }}>
                        {searchTerm || tipoFilter !== 'all' ? 'Nenhuma conta encontrada' : 'Nenhuma conta cadastrada'}
                    </h3>
                    <p className="mb-6 text-sm" style={{ color: T.textMuted }}>
                        {searchTerm || tipoFilter !== 'all'
                            ? 'Tente ajustar os filtros de busca'
                            : 'Adicione suas contas bancárias para gerenciar saldos e movimentações'}
                    </p>
                    {!searchTerm && tipoFilter === 'all' && (
                        <button
                            onClick={() => router.push('/backoffice/financeiro/contas/nova')}
                            className="inline-flex items-center gap-2 h-11 px-6 text-white rounded-xl font-medium hover:brightness-110 transition-colors"
                            style={{ background: T.accent }}
                        >
                            <Plus size={20} />
                            Nova Conta
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
