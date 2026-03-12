'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { UserCircle, Search, Plus, Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useBrokers, updateBrokerStatus } from '@/hooks/use-brokers'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { T } from '@/app/(backoffice)/lib/theme'
import { getStatusConfig } from '@/app/(backoffice)/lib/constants'
import { PageIntelHeader, KPICard, FilterTabs, StatusBadge } from '@/app/(backoffice)/components/ui'
import type { FilterTab } from '@/app/(backoffice)/components/ui'

export default function CorretoresPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const { brokers, isLoading, mutate } = useBrokers({ search: searchTerm, status: statusFilter })

    const handleStatusToggle = async (id: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
            await updateBrokerStatus(id, newStatus)
            toast.success(`Corretor ${newStatus === 'active' ? 'ativado' : 'inativado'} com sucesso`)
            mutate()
        } catch {
            toast.error('Erro ao atualizar status')
        }
    }

    const activeBrokers = brokers.filter(b => b.status === 'active').length
    const inactiveBrokers = brokers.filter(b => b.status === 'inactive').length

    return (
        <div className="space-y-6">
            <PageIntelHeader
                moduleLabel="SETTINGS · EQUIPE"
                title="Gestão de Corretores"
                subtitle="Controle de acesso, permissões e desempenho da equipe comercial"
                actions={
                    <Link href="/backoffice/settings/corretores/novo"
                        className="bo-btn bo-btn-primary"
                        style={{ background: T.accent }}>
                        <Plus size={16} /> Novo Corretor
                    </Link>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                <KPICard label="Total Registrados" value={String(brokers.length)} icon={<UserCircle size={15} />} size="sm" />
                <KPICard label="Ativos" value={String(activeBrokers)} icon={<CheckCircle size={15} />} accent="green" size="sm" />
                <KPICard label="Inativos" value={String(inactiveBrokers)} icon={<XCircle size={15} />} size="sm" />
            </div>

            {/* Filters + List */}
            <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                {/* Filter bar */}
                <div className="p-4 border-b space-y-3"
                    style={{ borderColor: T.border, background: T.elevated }}>
                    <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textDim }} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, email ou CRECI..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full h-9 pl-8 pr-3 rounded-xl text-xs outline-none"
                            style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
                        />
                    </div>
                    <FilterTabs
                        tabs={[
                            { id: 'all',      label: 'Todos',   count: brokers.length },
                            { id: 'active',   label: 'Ativos',  count: activeBrokers,   dotColor: getStatusConfig('ativo').dot },
                            { id: 'inactive', label: 'Inativos',count: inactiveBrokers, dotColor: getStatusConfig('inativo').dot },
                        ] as FilterTab[]}
                        active={statusFilter}
                        onChange={setStatusFilter}
                    />
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center p-16">
                        <Loader2 size={24} className="animate-spin" style={{ color: T.accent }} />
                    </div>
                ) : brokers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                    {['Corretor', 'Contato', 'CRECI', 'Status', 'Permissões', ''].map(h => (
                                        <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider"
                                            style={{ color: T.textMuted }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {brokers.map((broker, i) => (
                                    <tr key={broker.id}
                                        className="transition-colors group"
                                        style={{ borderTop: i > 0 ? `1px solid ${T.border}` : 'none' }}>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden"
                                                    style={{ background: 'rgba(72,101,129,0.15)', color: T.accent }}>
                                                    {broker.avatar_url
                                                        ? <Image src={broker.avatar_url} alt={broker.name} fill className="object-cover" />
                                                        : broker.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold" style={{ color: T.text }}>{broker.name}</p>
                                                    <p className="text-xs" style={{ color: T.textMuted }}>
                                                        Cadastrado em {format(new Date(broker.created_at), 'dd/MM/yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm" style={{ color: T.text }}>{broker.email}</p>
                                            <p className="text-xs" style={{ color: T.textMuted }}>{broker.phone || '—'}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <code className="text-xs px-2 py-1 rounded font-mono"
                                                style={{ background: T.elevated, color: T.textMuted }}>
                                                {broker.creci}
                                            </code>
                                        </td>
                                        <td className="px-5 py-4">
                                            <StatusBadge statusKey={broker.status === 'active' ? 'ativo' : 'inativo'} size="xs" />
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <Shield size={14} style={{ color: T.textMuted }} />
                                                <span className="text-sm" style={{ color: T.textMuted }}>
                                                    {broker.permissions?.length || 0} módulos
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={() => handleStatusToggle(broker.id, broker.status)}
                                                className="p-2 rounded-lg transition-all hover:opacity-80"
                                                style={{ color: broker.status === 'active' ? getStatusConfig('perdido').dot : getStatusConfig('ativo').dot }}
                                                title={broker.status === 'active' ? 'Desativar' : 'Ativar'}>
                                                {broker.status === 'active' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <UserCircle size={36} className="opacity-20" style={{ color: T.textMuted }} />
                        <p className="text-sm font-semibold" style={{ color: T.textMuted }}>
                            {searchTerm ? 'Nenhum corretor encontrado' : 'Nenhum corretor cadastrado'}
                        </p>
                        {!searchTerm && (
                            <Link href="/backoffice/settings/corretores/novo"
                                className="text-sm font-semibold" style={{ color: T.accent }}>
                                Cadastrar primeiro corretor
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
