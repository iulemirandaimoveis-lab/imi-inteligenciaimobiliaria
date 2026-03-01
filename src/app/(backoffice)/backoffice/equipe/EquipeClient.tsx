'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Users,
    Plus,
    Search,
    Mail,
    Phone,
    Shield,
    Edit,
    Trash2,
    MoreVertical,
    CheckCircle,
    XCircle,
    Clock,
    Award,
    TrendingUp,
} from 'lucide-react'

const T = {
    bg: 'transparent', surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)', textDim: 'var(--bo-text-muted)',
    gold: '#486581',
}

type UserRole = 'admin' | 'manager' | 'agent' | 'viewer' | string
type UserStatus = 'active' | 'inactive' | 'pending' | string

interface TeamMember {
    id: string
    name: string
    email: string
    phone: string
    role: UserRole
    status: UserStatus
    joinedAt?: string
    lastActive?: string
    stats?: {
        leads: number
        sales: number
        revenue: number
    }
}

const ROLE_CFG: Record<UserRole | string, { label: string; color: string; bg: string; icon: any }> = {
    admin: { label: 'Administrador', color: '#A89EC4', bg: 'rgba(168,158,196,0.12)', icon: Shield },
    manager: { label: 'Gerente', color: '#7B9EC4', bg: 'rgba(123,158,196,0.12)', icon: Award },
    agent: { label: 'Corretor', color: '#6BB87B', bg: 'rgba(107,184,123,0.12)', icon: Users },
    corretor: { label: 'Corretor', color: '#6BB87B', bg: 'rgba(107,184,123,0.12)', icon: Users },
    viewer: { label: 'Visualizador', color: '#8B93A7', bg: 'rgba(139,147,167,0.12)', icon: Users },
}

const STATUS_CFG: Record<UserStatus | string, { label: string; color: string; bg: string; icon: any }> = {
    active: { label: 'Ativo', color: '#6BB87B', bg: 'rgba(107,184,123,0.12)', icon: CheckCircle },
    inactive: { label: 'Inativo', color: '#E57373', bg: 'rgba(229,115,115,0.12)', icon: XCircle },
    pending: { label: 'Pendente', color: '#486581', bg: 'rgba(26,26,46,0.12)', icon: Clock },
}

export default function EquipeClient({ initialTeam }: { initialTeam: TeamMember[] }) {
    const router = useRouter()
    const [team] = useState<TeamMember[]>(initialTeam)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value)

    const formatLastActive = (timestamp?: string) => {
        if (!timestamp) return 'Nunca';
        const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000)
        if (diff < 60) return `${diff}m atrás`
        if (diff < 1440) return `${Math.floor(diff / 60)}h atrás`
        return new Date(timestamp).toLocaleDateString('pt-BR')
    }

    const filteredTeam = team
        .filter(m => m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || m.email?.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(m => roleFilter === 'all' || m.role === roleFilter)

    const totalStats = team.reduce(
        (acc, m) => ({ leads: acc.leads + (m.stats?.leads || 0), sales: acc.sales + (m.stats?.sales || 0), revenue: acc.revenue + (m.stats?.revenue || 0) }),
        { leads: 0, sales: 0, revenue: 0 }
    )

    const KPIS = [
        { label: 'Total de Leads', value: totalStats.leads, icon: Users, color: '#7B9EC4' },
        { label: 'Total de Vendas', value: totalStats.sales, icon: CheckCircle, color: '#6BB87B' },
        { label: 'Receita Total', value: formatCurrency(totalStats.revenue), icon: TrendingUp, color: '#A89EC4' },
    ]

    return (
        <div className="space-y-5 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>Gestão de Equipe</h1>
                    <p className="text-sm mt-0.5" style={{ color: T.textDim }}>
                        {team.length} membros &bull; {team.filter(m => m.status === 'active').length} ativos
                    </p>
                </div>
                <motion.button whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                    style={{ background: '#486581', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                    <Plus size={16} /> Adicionar Membro
                </motion.button>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {KPIS.map((k, i) => (
                    <motion.div key={k.label}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-2xl p-5"
                        style={{ background: T.elevated, border: `1px solid ${T.borderGold}` }}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: `${k.color}18` }}>
                                <k.icon size={18} style={{ color: k.color }} />
                            </div>
                            <p className="text-xs font-medium" style={{ color: T.textDim }}>{k.label}</p>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: T.text }}>{k.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textDim }} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nome ou email..."
                            className="w-full h-10 pl-9 pr-4 rounded-xl text-sm outline-none"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text, caretColor: T.gold }}
                            onFocus={e => (e.currentTarget.style.border = `1px solid ${T.borderGold}`)}
                            onBlur={e => (e.currentTarget.style.border = `1px solid ${T.border}`)}
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                        className="h-10 px-4 rounded-xl text-sm outline-none"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                    >
                        <option value="all">Todas as funções</option>
                        <option value="admin">Administrador</option>
                        <option value="manager">Gerente</option>
                        <option value="agent">Corretor</option>
                        <option value="viewer">Visualizador</option>
                    </select>
                </div>
            </div>

            {/* Team members */}
            <div className="space-y-2">
                {filteredTeam.map((member, i) => {
                    const role = ROLE_CFG[member.role] || ROLE_CFG['viewer']
                    const status = STATUS_CFG[member.status] || STATUS_CFG['pending']
                    return (
                        <motion.div key={member.id}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="rounded-2xl p-4 transition-all"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = `1px solid ${T.borderGold}`; (e.currentTarget as HTMLElement).style.background = T.elevated }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = `1px solid ${T.border}`; (e.currentTarget as HTMLElement).style.background = T.surface }}
                        >
                            <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 uppercase"
                                    style={{ background: 'rgba(26,26,46,0.15)', color: T.gold }}>
                                    {member.name ? member.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'U'}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                        <p className="text-sm font-semibold" style={{ color: T.text }}>{member.name || 'Sem Nome'}</p>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                            style={{ color: role.color, background: role.bg }}>
                                            {role.label}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                            style={{ color: status.color, background: status.bg }}>
                                            {status.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="text-[11px] flex items-center gap-1" style={{ color: T.textDim }}>
                                            <Mail size={10} /> {member.email}
                                        </span>
                                        <span className="text-[11px] flex items-center gap-1 hidden sm:flex" style={{ color: T.textDim }}>
                                            <Phone size={10} /> {member.phone || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                                    <div className="text-right">
                                        <p className="text-xs font-bold" style={{ color: T.text }}>{member.stats?.leads || 0}</p>
                                        <p className="text-[10px]" style={{ color: T.textDim }}>leads</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold" style={{ color: '#6BB87B' }}>{member.stats?.sales || 0}</p>
                                        <p className="text-[10px]" style={{ color: T.textDim }}>vendas</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px]" style={{ color: T.textDim }}>
                                            <Clock size={9} className="inline mr-1" />{formatLastActive(member.lastActive)}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                                        style={{ color: T.textDim }}
                                        onMouseEnter={e => (e.currentTarget.style.background = T.elevated)}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        <Edit size={13} />
                                    </button>
                                    <button className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                                        style={{ color: T.textDim }}
                                        onMouseEnter={e => (e.currentTarget.style.background = T.elevated)}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        <MoreVertical size={13} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {filteredTeam.length === 0 && (
                <div className="text-center py-16" style={{ color: T.textDim }}>
                    <Users size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Nenhum membro encontrado</p>
                </div>
            )}
        </div>
    )
}
