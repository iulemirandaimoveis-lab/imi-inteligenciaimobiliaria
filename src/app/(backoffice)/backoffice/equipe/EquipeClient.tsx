'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, Plus, Search, Mail, Phone, Shield, Edit, Trash2,
    MoreVertical, CheckCircle, XCircle, Clock, Award, TrendingUp,
    X, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { getStatusConfig } from '@/app/(backoffice)/lib/constants'

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
    stats?: { leads: number; sales: number; revenue: number }
}

const ROLE_CFG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    admin:    { label: 'Administrador', color: '#A89EC4', bg: 'rgba(168,158,196,0.12)', icon: Shield },
    manager:  { label: 'Gerente',       color: '#7B9EC4', bg: 'rgba(123,158,196,0.12)', icon: Award },
    agent:    { label: 'Corretor',      color: '#6BB87B', bg: 'rgba(107,184,123,0.12)', icon: Users },
    corretor: { label: 'Corretor',      color: '#6BB87B', bg: 'rgba(107,184,123,0.12)', icon: Users },
    viewer:   { label: 'Visualizador',  color: '#8B93A7', bg: 'rgba(139,147,167,0.12)', icon: Users },
}

const STATUS_ICONS_EQUIPE: Record<string, any> = { active: CheckCircle, inactive: XCircle, pending: Clock }
const STATUS_CFG = Object.fromEntries(
    Object.entries({ active: 'ativo', inactive: 'inativo', pending: 'pendente' }).map(([key, cfgKey]) => {
        const cfg = getStatusConfig(cfgKey)
        return [key, { label: cfg.label, color: cfg.dot, bg: `${cfg.dot}1f`, icon: STATUS_ICONS_EQUIPE[key] || Clock }]
    })
) as Record<string, { label: string; color: string; bg: string; icon: any }>

const EMPTY_FORM = { name: '', email: '', phone: '', role: 'agent', status: 'active' }

function memberFromJson(json: any): TeamMember {
    return {
        id: json.id,
        name: json.name || 'Sem Nome',
        email: json.email || '',
        phone: json.phone || '',
        role: json.role || 'agent',
        status: json.status || 'pending',
        joinedAt: json.joined_at,
        lastActive: json.last_active_at || json.updated_at || json.joined_at,
        stats: {
            leads: json.total_leads || 0,
            sales: json.total_sales || 0,
            revenue: Number(json.total_revenue) || 0,
        },
    }
}

export default function EquipeClient({ initialTeam }: { initialTeam: TeamMember[] }) {
    const [team, setTeam] = useState<TeamMember[]>(initialTeam)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [showModal, setShowModal] = useState(false)
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
    const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM })
    const [saving, setSaving] = useState(false)
    const [menuOpen, setMenuOpen] = useState<string | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)

    const formatLastActive = (timestamp?: string) => {
        if (!timestamp) return 'Nunca'
        const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000)
        if (diff < 60) return `${diff}m atrás`
        if (diff < 1440) return `${Math.floor(diff / 60)}h atrás`
        return new Date(timestamp).toLocaleDateString('pt-BR')
    }

    const filteredTeam = team
        .filter(m =>
            m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .filter(m => roleFilter === 'all' || m.role === roleFilter)

    const totalStats = team.reduce(
        (acc, m) => ({
            leads: acc.leads + (m.stats?.leads || 0),
            sales: acc.sales + (m.stats?.sales || 0),
            revenue: acc.revenue + (m.stats?.revenue || 0),
        }),
        { leads: 0, sales: 0, revenue: 0 }
    )

    const openAdd = () => {
        setEditingMember(null)
        setForm({ ...EMPTY_FORM })
        setShowModal(true)
    }

    const openEdit = (member: TeamMember) => {
        setEditingMember(member)
        setForm({
            name: member.name,
            email: member.email,
            phone: member.phone || '',
            role: member.role,
            status: member.status,
        })
        setMenuOpen(null)
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingMember(null)
        setForm({ ...EMPTY_FORM })
    }

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('Nome é obrigatório'); return }
        if (!form.email.trim()) { toast.error('E-mail é obrigatório'); return }

        setSaving(true)
        try {
            const isEditing = !!editingMember
            const res = await fetch('/api/equipe', {
                method: isEditing ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isEditing ? { id: editingMember.id, ...form } : form),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Erro ao salvar membro')

            const member = memberFromJson(json)

            if (isEditing) {
                setTeam(prev => prev.map(m => m.id === member.id ? member : m))
                toast.success('Membro atualizado com sucesso!')
            } else {
                setTeam(prev => [...prev, member])
                toast.success(`${member.name} adicionado à equipe!`)
            }
            closeModal()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    const [confirmDelete, setConfirmDelete] = useState<TeamMember | null>(null)

    const handleDeleteConfirm = (member: TeamMember) => {
        setMenuOpen(null)
        setConfirmDelete(member)
    }

    const handleDelete = async () => {
        if (!confirmDelete) return
        const member = confirmDelete
        setConfirmDelete(null)
        setDeleting(member.id)
        try {
            const res = await fetch(`/api/equipe?id=${member.id}`, { method: 'DELETE' })
            if (!res.ok) {
                const json = await res.json()
                throw new Error(json.error || 'Erro ao remover membro')
            }
            setTeam(prev => prev.filter(m => m.id !== member.id))
            toast.success(`${member.name} removido da equipe`)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setDeleting(null)
        }
    }

    const KPIS = [
        { label: 'Membros', value: team.length, icon: Users, color: '#7B9EC4' },
        { label: `Ativos`, value: team.filter(m => m.status === 'active').length, icon: CheckCircle, color: '#6BB87B' },
        { label: 'Leads Total', value: totalStats.leads, icon: TrendingUp, color: '#E8A87C' },
    ]

    const inputStyle: React.CSSProperties = {
        background: T.surface,
        border: `1px solid ${T.border}`,
        color: T.text,
        height: '44px',
        borderRadius: '12px',
        padding: '0 14px',
        fontSize: '14px',
        outline: 'none',
        width: '100%',
    }

    return (
        <div className="space-y-5 max-w-5xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>Gestão de Equipe</h1>
                    <p className="text-sm mt-0.5" style={{ color: T.textDim }}>
                        {team.length} membros &bull; {team.filter(m => m.status === 'active').length} ativos
                    </p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={openAdd}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white flex-shrink-0 transition-all"
                    style={{ background: 'var(--bo-accent)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                >
                    <Plus size={16} /> Adicionar Membro
                </motion.button>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {KPIS.map((k, i) => (
                    <motion.div key={k.label}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-2xl p-4"
                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        <div className="flex items-center gap-2 mb-2">
                            <k.icon size={14} style={{ color: k.color }} />
                            <p className="text-xs" style={{ color: T.textDim }}>{k.label}</p>
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
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
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

            {/* Team list */}
            <div className="space-y-2">
                {filteredTeam.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-16 rounded-2xl"
                        style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <Users size={36} className="mx-auto mb-3" style={{ color: T.textDim, opacity: 0.3 }} />
                        <p className="text-sm font-semibold" style={{ color: T.text }}>
                            {team.length === 0 ? 'Nenhum membro cadastrado' : 'Nenhum resultado encontrado'}
                        </p>
                        <p className="text-xs mt-1" style={{ color: T.textDim }}>
                            {team.length === 0
                                ? 'Clique em "Adicionar Membro" para cadastrar o primeiro'
                                : 'Tente ajustar os filtros de busca'}
                        </p>
                        {team.length === 0 && (
                            <button
                                onClick={openAdd}
                                className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium text-white"
                                style={{ background: 'var(--bo-accent)' }}>
                                <Plus size={14} /> Adicionar primeiro membro
                            </button>
                        )}
                    </motion.div>
                )}

                {filteredTeam.map((member, i) => {
                    const role = ROLE_CFG[member.role] || ROLE_CFG['viewer']
                    const status = STATUS_CFG[member.status] || STATUS_CFG['pending']
                    const isBeingDeleted = deleting === member.id

                    return (
                        <motion.div
                            key={member.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: isBeingDeleted ? 0.4 : 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="rounded-2xl p-4 transition-all"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        >
                            <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <div
                                    className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 uppercase"
                                    style={{ background: 'var(--bo-elevated)', color: 'var(--bo-text-muted)' }}>
                                    {member.name
                                        ? member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                                        : '??'}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <p className="text-sm font-semibold" style={{ color: T.text }}>{member.name}</p>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                                            style={{ color: role.color, background: role.bg, borderColor: `${role.color}30` }}>
                                            {role.label}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                                            style={{ color: status.color, background: status.bg, borderColor: `${status.color}30` }}>
                                            {status.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="text-[11px] flex items-center gap-1" style={{ color: T.textDim }}>
                                            <Mail size={10} /> {member.email}
                                        </span>
                                        {member.phone && (
                                            <span className="text-[11px] hidden sm:flex items-center gap-1" style={{ color: T.textDim }}>
                                                <Phone size={10} /> {member.phone}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Stats (desktop) */}
                                <div className="hidden md:flex items-center gap-5 flex-shrink-0 text-right">
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: T.text }}>{member.stats?.leads || 0}</p>
                                        <p className="text-[10px]" style={{ color: T.textDim }}>leads</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: getStatusConfig('ativo').dot }}>{member.stats?.sales || 0}</p>
                                        <p className="text-[10px]" style={{ color: T.textDim }}>vendas</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px]" style={{ color: T.textDim }}>
                                            <Clock size={9} className="inline mr-1" />
                                            {formatLastActive(member.lastActive)}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="relative flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => openEdit(member)}
                                        disabled={isBeingDeleted}
                                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-[var(--bo-hover)]"
                                        style={{ color: T.textDim }}
                                        title="Editar membro">
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        onClick={() => setMenuOpen(menuOpen === member.id ? null : member.id)}
                                        disabled={isBeingDeleted}
                                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-[var(--bo-hover)]"
                                        style={{ color: T.textDim }}>
                                        {isBeingDeleted
                                            ? <Loader2 size={14} className="animate-spin" />
                                            : <MoreVertical size={14} />}
                                    </button>

                                    {/* Context menu */}
                                    <AnimatePresence>
                                        {menuOpen === member.id && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.92, y: -4 }}
                                                transition={{ duration: 0.12 }}
                                                className="absolute right-0 top-10 z-50 rounded-xl shadow-xl overflow-hidden"
                                                style={{ background: T.elevated, border: `1px solid ${T.border}`, minWidth: '150px' }}>
                                                <button
                                                    onClick={() => openEdit(member)}
                                                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left transition-colors hover:bg-[var(--bo-hover)]">
                                                    <Edit size={13} style={{ color: T.textDim }} />
                                                    <span style={{ color: T.text }}>Editar</span>
                                                </button>
                                                <div style={{ height: '1px', background: T.border }} />
                                                <button
                                                    onClick={() => handleDeleteConfirm(member)}
                                                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left transition-colors hover:bg-red-500/10">
                                                    <Trash2 size={13} style={{ color: getStatusConfig('cancelada').dot }} />
                                                    <span style={{ color: getStatusConfig('cancelada').dot }}>Remover</span>
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* ADD / EDIT MODAL */}
            <AnimatePresence>
                {showModal && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                            onClick={closeModal}
                        />

                        {/* Sheet (bottom on mobile, centered on desktop) */}
                        <motion.div
                            initial={{ opacity: 0, y: 80 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 80 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                            className="fixed bottom-0 left-0 right-0 z-50 lg:inset-0 lg:flex lg:items-center lg:justify-center pointer-events-none"
                        >
                            <div
                                className="pointer-events-auto rounded-t-3xl lg:rounded-2xl w-full lg:max-w-md max-h-[92vh] overflow-y-auto"
                                style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                {/* Drag handle */}
                                <div className="pt-4 pb-1 flex justify-center lg:hidden">
                                    <div className="w-9 h-1 rounded-full" style={{ background: T.border }} />
                                </div>

                                <div className="p-6">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-base font-bold" style={{ color: T.text }}>
                                                {editingMember ? 'Editar Membro' : 'Novo Membro'}
                                            </h2>
                                            <p className="text-xs mt-0.5" style={{ color: T.textDim }}>
                                                {editingMember
                                                    ? 'Atualize as informações do membro'
                                                    : 'Preencha os dados para adicionar à equipe'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={closeModal}
                                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-[var(--bo-hover)]"
                                            style={{ color: T.textDim }}>
                                            <X size={16} />
                                        </button>
                                    </div>

                                    {/* Form fields */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-semibold block mb-1.5" style={{ color: T.textDim }}>
                                                Nome completo *
                                            </label>
                                            <input
                                                type="text"
                                                value={form.name}
                                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                                placeholder="Ex: Ana Silva"
                                                autoFocus
                                                style={inputStyle}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold block mb-1.5" style={{ color: T.textDim }}>
                                                E-mail *
                                            </label>
                                            <input
                                                type="email"
                                                value={form.email}
                                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                                placeholder="ana@imobiliaria.com"
                                                style={inputStyle}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold block mb-1.5" style={{ color: T.textDim }}>
                                                Telefone
                                            </label>
                                            <input
                                                type="tel"
                                                value={form.phone}
                                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                                placeholder="(11) 99999-9999"
                                                style={inputStyle}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-semibold block mb-1.5" style={{ color: T.textDim }}>
                                                    Função
                                                </label>
                                                <select
                                                    value={form.role}
                                                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                                    style={inputStyle}>
                                                    <option value="admin">Administrador</option>
                                                    <option value="manager">Gerente</option>
                                                    <option value="agent">Corretor</option>
                                                    <option value="viewer">Visualizador</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold block mb-1.5" style={{ color: T.textDim }}>
                                                    Status
                                                </label>
                                                <select
                                                    value={form.status}
                                                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                                                    style={inputStyle}>
                                                    <option value="active">Ativo</option>
                                                    <option value="pending">Pendente</option>
                                                    <option value="inactive">Inativo</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-3 mt-6">
                                        <button
                                            onClick={closeModal}
                                            disabled={saving}
                                            className="flex-1 h-11 rounded-xl text-sm font-medium transition-all"
                                            style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textDim }}>
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex-1 h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
                                            style={{
                                                background: saving ? 'var(--bo-elevated)' : 'var(--bo-accent)',
                                                boxShadow: saving ? 'none' : '0 2px 8px rgba(30,58,95,0.4)',
                                            }}>
                                            {saving && <Loader2 size={15} className="animate-spin" />}
                                            {saving
                                                ? 'Salvando...'
                                                : editingMember
                                                    ? 'Salvar Alterações'
                                                    : 'Adicionar Membro'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Backdrop to close context menus */}
            {menuOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
            )}

            {/* Delete Confirmation Dialog */}
            <AnimatePresence>
                {confirmDelete && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                            onClick={() => setConfirmDelete(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="pointer-events-auto rounded-2xl p-6 w-full max-w-sm text-center"
                                style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                <Trash2 size={28} className="mx-auto mb-3" style={{ color: getStatusConfig('erro').dot }} />
                                <h3 className="text-base font-bold mb-1" style={{ color: T.text }}>Remover membro?</h3>
                                <p className="text-sm mb-5" style={{ color: T.textDim }}>
                                    <strong>{confirmDelete.name}</strong> será removido da equipe. Esta ação não pode ser desfeita.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setConfirmDelete(null)}
                                        className="flex-1 h-10 rounded-xl text-sm font-medium"
                                        style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted }}>
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="flex-1 h-10 rounded-xl text-sm font-semibold text-white"
                                        style={{ background: getStatusConfig('erro').dot }}>
                                        Remover
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
