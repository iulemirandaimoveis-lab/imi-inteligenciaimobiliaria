'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { UserCircle, Search, Plus, Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useBrokers, updateBrokerStatus } from '@/hooks/use-brokers'
import { toast } from 'sonner'
import { format } from 'date-fns'

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    hover: 'var(--bo-hover)',
    accent: 'var(--bo-accent)',
}

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
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>Gestão de Corretores</h1>
                    <p className="text-sm mt-0.5" style={{ color: T.textMuted }}>Controle de acesso, permissões e desempenho da equipe comercial</p>
                </div>
                <Link href="/backoffice/settings/corretores/novo"
                    className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: '#1E3A5F' }}>
                    <Plus size={16} /> Novo Corretor
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Total Registrados', value: brokers.length, color: T.accent, bg: 'rgba(72,101,129,0.12)', icon: UserCircle },
                    { label: 'Ativos', value: activeBrokers, color: '#4ADE80', bg: 'rgba(74,222,128,0.1)', icon: CheckCircle },
                    { label: 'Inativos', value: inactiveBrokers, color: T.textMuted, bg: 'rgba(148,163,184,0.1)', icon: XCircle },
                ].map(s => {
                    const Icon = s.icon
                    return (
                        <div key={s.label} className="flex items-center justify-between rounded-xl p-5"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: T.textMuted }}>{s.label}</p>
                                <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
                            </div>
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                                <Icon size={22} style={{ color: s.color }} />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Filters + List */}
            <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                {/* Filter bar */}
                <div className="p-5 border-b flex flex-col md:flex-row gap-4 justify-between items-center"
                    style={{ borderColor: T.border, background: T.elevated }}>
                    <div className="relative w-full md:w-80">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, email ou CRECI..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full h-10 pl-9 pr-3 rounded-xl text-sm outline-none"
                            style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
                        />
                    </div>
                    <div className="flex gap-2">
                        {[{ v: 'all', l: 'Todos' }, { v: 'active', l: 'Ativos' }, { v: 'inactive', l: 'Inativos' }].map(tab => (
                            <button key={tab.v} onClick={() => setStatusFilter(tab.v)}
                                className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                style={{
                                    background: statusFilter === tab.v ? T.accent : 'transparent',
                                    color: statusFilter === tab.v ? '#fff' : T.textMuted,
                                    border: `1px solid ${statusFilter === tab.v ? T.accent : T.border}`,
                                }}>
                                {tab.l}
                            </button>
                        ))}
                    </div>
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
                                            <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                                                style={{
                                                    background: broker.status === 'active' ? 'rgba(74,222,128,0.12)' : 'rgba(148,163,184,0.1)',
                                                    color: broker.status === 'active' ? '#4ADE80' : T.textMuted,
                                                }}>
                                                {broker.status === 'active' ? 'Ativo' : 'Inativo'}
                                            </span>
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
                                                style={{ color: broker.status === 'active' ? '#F87171' : '#4ADE80' }}
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
