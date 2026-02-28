'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users,
    Plus,
    Search,
    Mail,
    Phone,
    Shield,
    Edit,
    MoreVertical,
    CheckCircle,
    XCircle,
    Clock,
    Award,
    TrendingUp,
    X,
    Loader2,
    UserPlus,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const supabase = createClient()

const T = {
    bg: 'transparent', surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)', textDim: 'var(--bo-text-muted)',
    gold: '#3B82F6',
}

type UserRole = 'admin' | 'manager' | 'agent' | 'viewer'
type UserStatus = 'active' | 'inactive' | 'pending'

interface TeamMember {
    id: string
    name: string
    email: string
    phone: string
    role: UserRole
    status: UserStatus
    avatar_url?: string
    joined_at: string
    last_active_at: string
    total_leads: number
    total_sales: number
    total_revenue: number
}

const ROLE_CFG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    admin: { label: 'Administrador', color: '#A89EC4', bg: 'rgba(168,158,196,0.12)', icon: Shield },
    manager: { label: 'Gerente', color: '#7B9EC4', bg: 'rgba(123,158,196,0.12)', icon: Award },
    agent: { label: 'Corretor', color: '#6BB87B', bg: 'rgba(107,184,123,0.12)', icon: Users },
    viewer: { label: 'Visualizador', color: '#8B93A7', bg: 'rgba(139,147,167,0.12)', icon: Users },
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    active: { label: 'Ativo', color: '#6BB87B', bg: 'rgba(107,184,123,0.12)', icon: CheckCircle },
    inactive: { label: 'Inativo', color: '#E57373', bg: 'rgba(229,115,115,0.12)', icon: XCircle },
    pending: { label: 'Pendente', color: '#3B82F6', bg: 'rgba(26,26,46,0.12)', icon: Clock },
}

export default function EquipePage() {
    const router = useRouter()
    const [team, setTeam] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
    const [showAddModal, setShowAddModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [newMember, setNewMember] = useState({
        name: '', email: '', phone: '', role: 'agent' as UserRole,
    })

    // Fetch team from Supabase
    useEffect(() => {
        async function fetchTeam() {
            try {
                const { data, error } = await supabase
                    .from('team_members')
                    .select('*')
                    .order('joined_at', { ascending: false })

                if (error) {
                    console.error('Error fetching team:', error)
                    setTeam([])
                } else {
                    setTeam((data || []).map((m: any) => ({
                        id: m.id,
                        name: m.name || '',
                        email: m.email || '',
                        phone: m.phone || '',
                        role: m.role || 'agent',
                        status: m.status || 'active',
                        avatar_url: m.avatar_url,
                        joined_at: m.joined_at || m.created_at || new Date().toISOString(),
                        last_active_at: m.last_active_at || m.updated_at || new Date().toISOString(),
                        total_leads: m.total_leads || 0,
                        total_sales: m.total_sales || 0,
                        total_revenue: Number(m.total_revenue) || 0,
                    })))
                }
            } catch (err) {
                console.error('Error:', err)
                setTeam([])
            } finally {
                setLoading(false)
            }
        }
        fetchTeam()
    }, [])

    // Add member to team_members table
    const handleAddMember = async () => {
        if (!newMember.name || !newMember.email) {
            toast.error('Nome e email sao obrigatorios')
            return
        }

        setSaving(true)
        try {
            const { data, error } = await supabase
                .from('team_members')
                .insert({
                    name: newMember.name,
                    email: newMember.email,
                    phone: newMember.phone || null,
                    role: newMember.role,
                    status: 'pending',
                    total_leads: 0,
                    total_sales: 0,
                    total_revenue: 0,
                })
                .select()
                .single()

            if (error) {
                console.error('Error adding member:', error)
                toast.error('Erro ao adicionar membro: ' + error.message)
            } else if (data) {
                setTeam(prev => [{
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    phone: data.phone || '',
                    role: data.role || 'agent',
                    status: data.status || 'pending',
                    avatar_url: data.avatar_url,
                    joined_at: data.joined_at || new Date().toISOString(),
                    last_active_at: data.last_active_at || new Date().toISOString(),
                    total_leads: 0,
                    total_sales: 0,
                    total_revenue: 0,
                }, ...prev])
                toast.success('Membro adicionado com sucesso!')
                setShowAddModal(false)
                setNewMember({ name: '', email: '', phone: '', role: 'agent' })
            }
        } catch (err) {
            console.error('Error:', err)
            toast.error('Erro inesperado ao adicionar membro')
        } finally {
            setSaving(false)
        }
    }

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value)

    const formatLastActive = (timestamp: string) => {
        if (!timestamp) return '-'
        const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000)
        if (diff < 60) return `${diff}m`
        if (diff < 1440) return `${Math.floor(diff / 60)}h`
        return new Date(timestamp).toLocaleDateString('pt-BR')
    }

    const filteredTeam = team
        .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.email.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(m => roleFilter === 'all' || m.role === roleFilter)

    const totalStats = team.reduce(
        (acc, m) => ({
            leads: acc.leads + (m.total_leads || 0),
            sales: acc.sales + (m.total_sales || 0),
            revenue: acc.revenue + (m.total_revenue || 0),
        }),
        { leads: 0, sales: 0, revenue: 0 }
    )

    const KPIS = [
        { label: 'Total de Leads', value: totalStats.leads, icon: Users, color: '#7B9EC4' },
        { label: 'Total de Vendas', value: totalStats.sales, icon: CheckCircle, color: '#6BB87B' },
        { label: 'Receita Total', value: formatCurrency(totalStats.revenue), icon: TrendingUp, color: '#A89EC4' },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 size={24} className="animate-spin" style={{ color: T.gold }} />
            </div>
        )
    }

    return (
        <div className="space-y-5 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>Gestao de Equipe</h1>
                    <p className="text-sm mt-0.5" style={{ color: T.textDim }}>
                        {team.length} membros &bull; {team.filter(m => m.status === 'active').length} ativos
                    </p>
                </div>
                <motion.button whileTap={{ scale: 0.96 }}
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)', boxShadow: '0 2px 12px rgba(59,130,246,0.30)' }}>
                    <Plus size={16} /> Adicionar
                </motion.button>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {KPIS.map((k, i) => (
                    <motion.div key={k.label}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-2xl p-4"
                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: `${k.color}18` }}>
                                <k.icon size={16} style={{ color: k.color }} />
                            </div>
                            <p className="text-xs font-medium" style={{ color: T.textDim }}>{k.label}</p>
                        </div>
                        <p className="text-xl font-bold" style={{ color: T.text }}>{k.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="rounded-2xl p-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
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
                        <option value="all">Todas</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Gerente</option>
                        <option value="agent">Corretor</option>
                        <option value="viewer">Visualizador</option>
                    </select>
                </div>
            </div>

            {/* Team members */}
            <div className="space-y-2">
                {filteredTeam.map((member, i) => {
                    const role = ROLE_CFG[member.role] || ROLE_CFG.agent
                    const status = STATUS_CFG[member.status] || STATUS_CFG.active
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
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                                    style={{ background: 'rgba(26,26,46,0.15)', color: T.gold }}>
                                    {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                        <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{member.name}</p>
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
                                        <span className="text-[11px] flex items-center gap-1 truncate" style={{ color: T.textDim }}>
                                            <Mail size={10} /> {member.email}
                                        </span>
                                        {member.phone && (
                                            <span className="text-[11px] flex items-center gap-1 hidden sm:flex" style={{ color: T.textDim }}>
                                                <Phone size={10} /> {member.phone}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                                    <div className="text-right">
                                        <p className="text-xs font-bold" style={{ color: T.text }}>{member.total_leads}</p>
                                        <p className="text-[10px]" style={{ color: T.textDim }}>leads</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold" style={{ color: '#6BB87B' }}>{member.total_sales}</p>
                                        <p className="text-[10px]" style={{ color: T.textDim }}>vendas</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px]" style={{ color: T.textDim }}>
                                            <Clock size={9} className="inline mr-1" />{formatLastActive(member.last_active_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {filteredTeam.length === 0 && !loading && (
                <div className="text-center py-16" style={{ color: T.textDim }}>
                    <Users size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">
                        {team.length === 0 ? 'Nenhum membro cadastrado. Adicione o primeiro!' : 'Nenhum membro encontrado.'}
                    </p>
                </div>
            )}

            {/* Add Member Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50"
                            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                            onClick={() => setShowAddModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-x-4 top-[15%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 rounded-2xl overflow-hidden"
                            style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${T.border}` }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
                                        <UserPlus size={16} style={{ color: '#3B82F6' }} />
                                    </div>
                                    <h3 className="text-base font-bold" style={{ color: T.text }}>Novo Membro</h3>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ color: T.textDim }}>
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: T.textDim }}>Nome completo *</label>
                                    <input
                                        type="text"
                                        value={newMember.name}
                                        onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))}
                                        placeholder="Ex: Maria Santos"
                                        className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                                        style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: T.textDim }}>Email *</label>
                                    <input
                                        type="email"
                                        value={newMember.email}
                                        onChange={e => setNewMember(p => ({ ...p, email: e.target.value }))}
                                        placeholder="email@empresa.com"
                                        className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                                        style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: T.textDim }}>Telefone</label>
                                    <input
                                        type="tel"
                                        value={newMember.phone}
                                        onChange={e => setNewMember(p => ({ ...p, phone: e.target.value }))}
                                        placeholder="(81) 99999-9999"
                                        className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                                        style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: T.textDim }}>Funcao</label>
                                    <select
                                        value={newMember.role}
                                        onChange={e => setNewMember(p => ({ ...p, role: e.target.value as UserRole }))}
                                        className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                                        style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
                                    >
                                        <option value="admin">Administrador</option>
                                        <option value="manager">Gerente</option>
                                        <option value="agent">Corretor</option>
                                        <option value="viewer">Visualizador</option>
                                    </select>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center gap-3 p-5" style={{ borderTop: `1px solid ${T.border}` }}>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 h-11 rounded-xl text-sm font-medium transition-all active:scale-95"
                                    style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textDim }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddMember}
                                    disabled={saving || !newMember.name || !newMember.email}
                                    className="flex-1 h-11 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                    style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
                                >
                                    {saving ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : 'Adicionar'}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
