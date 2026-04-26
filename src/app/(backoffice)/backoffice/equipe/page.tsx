'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, Crown, Shield, User, Search, Plus,
    ChevronDown, ChevronUp, MoreHorizontal, Edit, Trash2,
    CheckCircle, UserPlus, Building2,
    X, Loader2, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { T } from '../../lib/theme'
import { useTeams, createTeam, updateTeam, deleteTeam, addMemberToTeam, removeMemberFromTeam, type Team, type TeamMember } from '@/hooks/use-teams'
import { useBrokers, type Broker } from '@/hooks/use-brokers'

/* ─── CONSTANTS ────────────────────────────────────────────────── */
const ROLE_CFG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    broker:         { label: 'Corretor',        icon: User,   color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
    broker_manager: { label: 'Gerente',         icon: Crown,  color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
    admin:          { label: 'Administrador',   icon: Shield, color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
}

const TEAM_COLORS = [
    '#C9A84C', '#3B82F6', '#10B981', '#F59E0B',
    '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4',
]

/* ─── HELPERS ──────────────────────────────────────────────────── */
function initials(name: string) {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '??'
}

/* ─── AVATAR ───────────────────────────────────────────────────── */
function Avatar({ name, size = 36, color }: { name: string; size?: number; color?: string }) {
    return (
        <div
            className="flex items-center justify-center rounded-full flex-shrink-0 text-xs font-bold"
            style={{
                width: size, height: size,
                background: color ? `${color}22` : T.elevated,
                border: `1px solid ${color ? `${color}44` : T.border}`,
                color: color || T.textMuted,
            }}
        >
            {initials(name)}
        </div>
    )
}

/* ─── TEAM CARD ───────────────────────────────────────────────── */
function TeamCard({
    team, index, onEdit, onDelete, onAddMember, onRemoveMember, allBrokers,
}: {
    team: Team
    index: number
    onEdit: (t: Team) => void
    onDelete: (t: Team) => void
    onAddMember: (teamId: string, brokerId: string) => Promise<void>
    onRemoveMember: (teamId: string, brokerId: string) => Promise<void>
    allBrokers: Broker[]
}) {
    const [expanded, setExpanded] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [addingMember, setAddingMember] = useState(false)
    const [selectedBrokerId, setSelectedBrokerId] = useState('')
    const [saving, setSaving] = useState(false)

    const teamColor = team.color || '#C9A84C'
    const members = team.members || []
    const leader = members.find(m => m.user_id === team.leader_id) || null

    // Brokers not yet in this team
    const availableBrokers = allBrokers.filter(
        b => b.status === 'active' && !members.some(m => m.id === b.id)
    )

    async function handleAddMember() {
        if (!selectedBrokerId) return
        setSaving(true)
        try {
            await onAddMember(team.id, selectedBrokerId)
            setAddingMember(false)
            setSelectedBrokerId('')
        } finally {
            setSaving(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-xl overflow-hidden"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
            {/* Color accent bar */}
            <div className="h-1" style={{ background: `linear-gradient(90deg, ${teamColor}cc, ${teamColor}22)` }} />

            <div className="p-4">
                {/* Team header */}
                <div className="flex items-start gap-3">
                    {/* Team icon */}
                    <div
                        className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
                        style={{ background: `${teamColor}18`, border: `1px solid ${teamColor}33`, color: teamColor }}
                    >
                        <Building2 size={18} />
                    </div>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: T.text }}>
                            {team.name}
                        </p>
                        {team.description && (
                            <p className="text-[11px] truncate mt-0.5" style={{ color: T.textDim }}>
                                {team.description}
                            </p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold"
                                style={{ color: T.textMuted }}>
                                <Users size={9} /> {members.length} membros
                            </span>
                            {team.leader_name && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold"
                                    style={{ color: '#FBBF24' }}>
                                    <Crown size={9} /> {team.leader_name}
                                </span>
                            )}
                            {team.region && (
                                <span className="text-[10px]" style={{ color: T.textDim }}>
                                    {team.region}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            onClick={() => setExpanded(e => !e)}
                            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-white/5"
                            style={{ color: T.textMuted }}
                        >
                            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpen(o => !o)}
                                className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-white/5"
                                style={{ color: T.textMuted }}
                            >
                                <MoreHorizontal size={14} />
                            </button>
                            <AnimatePresence>
                                {menuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, y: -4 }}
                                            transition={{ duration: 0.12 }}
                                            className="absolute right-0 top-8 z-50 rounded-lg overflow-hidden shadow-2xl w-40"
                                            style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                                        >
                                            <button onClick={() => { setMenuOpen(false); onEdit(team) }}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-white/5"
                                                style={{ color: T.text }}>
                                                <Edit size={11} /> Editar Equipe
                                            </button>
                                            <button onClick={() => { setMenuOpen(false); setAddingMember(true) }}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-white/5"
                                                style={{ color: '#60A5FA' }}>
                                                <UserPlus size={11} /> Adicionar Membro
                                            </button>
                                            <div style={{ height: '1px', background: T.border }} />
                                            <button onClick={() => { setMenuOpen(false); onDelete(team) }}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-red-500/10"
                                                style={{ color: '#EF4444' }}>
                                                <Trash2 size={11} /> Excluir
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Add member inline form */}
                <AnimatePresence>
                    {addingMember && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 overflow-hidden"
                        >
                            <div className="flex gap-2 pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
                                <select
                                    value={selectedBrokerId}
                                    onChange={e => setSelectedBrokerId(e.target.value)}
                                    className="flex-1 h-9 px-3 rounded-md text-xs outline-none"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                                >
                                    <option value="">Selecionar membro...</option>
                                    {availableBrokers.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleAddMember}
                                    disabled={!selectedBrokerId || saving}
                                    className="h-9 px-3 rounded-md text-xs font-semibold text-white flex items-center gap-1 disabled:opacity-50"
                                    style={{ background: teamColor }}
                                >
                                    {saving ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                                    Adicionar
                                </button>
                                <button
                                    onClick={() => { setAddingMember(false); setSelectedBrokerId('') }}
                                    className="h-9 w-9 rounded-md flex items-center justify-center"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Members list (expanded) */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-3 space-y-1.5 pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
                                {members.length === 0 ? (
                                    <div className="text-center py-6">
                                        <Users size={20} className="mx-auto mb-2 opacity-30" style={{ color: T.textMuted }} />
                                        <p className="text-xs" style={{ color: T.textDim }}>Nenhum membro nesta equipe</p>
                                        <button
                                            onClick={() => setAddingMember(true)}
                                            className="mt-2 text-xs font-semibold"
                                            style={{ color: teamColor }}
                                        >
                                            + Adicionar primeiro membro
                                        </button>
                                    </div>
                                ) : (
                                    members.map(member => {
                                        const rc = ROLE_CFG[member.role] || ROLE_CFG.broker
                                        const RoleIcon = rc.icon
                                        const isLeader = member.user_id === team.leader_id
                                        return (
                                            <div key={member.id}
                                                className="flex items-center gap-2.5 p-2 rounded-lg group hover:bg-white/3 transition-colors"
                                                style={{ background: isLeader ? `${teamColor}08` : 'transparent' }}
                                            >
                                                <Avatar name={member.name} size={28} color={isLeader ? teamColor : undefined} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-semibold truncate" style={{ color: T.text }}>
                                                            {member.name}
                                                        </span>
                                                        {isLeader && (
                                                            <span className="text-[9px] font-bold px-1 py-0.5 rounded"
                                                                style={{ color: '#FBBF24', background: 'rgba(251,191,36,0.15)' }}>
                                                                LÍDER
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <RoleIcon size={8} style={{ color: rc.color }} />
                                                        <span className="text-[10px]" style={{ color: T.textDim }}>
                                                            {rc.label}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div
                                                        className="w-1.5 h-1.5 rounded-full"
                                                        style={{ background: member.status === 'active' ? '#10B981' : '#6B7280' }}
                                                    />
                                                    <button
                                                        onClick={() => onRemoveMember(team.id, member.id)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/15"
                                                        style={{ color: '#EF4444' }}
                                                        title="Remover da equipe"
                                                    >
                                                        <X size={11} />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}

                                {members.length > 0 && (
                                    <button
                                        onClick={() => setAddingMember(true)}
                                        className="flex items-center gap-1.5 w-full p-2 rounded-lg text-xs font-medium hover:bg-white/5 transition-colors"
                                        style={{ color: teamColor, border: `1px dashed ${teamColor}44` }}
                                    >
                                        <UserPlus size={11} /> Adicionar membro à equipe
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}

/* ─── MEMBER CARD (flat list view) ────────────────────────────── */
function MemberRow({ broker, index }: { broker: Broker; index: number }) {
    const rc = ROLE_CFG[broker.role] || ROLE_CFG.broker
    const RoleIcon = rc.icon

    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="flex items-center gap-3 p-3 rounded-lg"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
            <Avatar name={broker.name} size={36} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{broker.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                        style={{ color: rc.color, background: rc.bg }}>
                        <RoleIcon size={9} /> {rc.label}
                    </span>
                    <span className="text-[11px] truncate" style={{ color: T.textDim }}>
                        {broker.email}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-2 h-2 rounded-full"
                    style={{ background: broker.status === 'active' ? '#10B981' : '#6B7280' }} />
                <span className="text-[10px]" style={{ color: T.textDim }}>
                    {broker.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
            </div>
        </motion.div>
    )
}

/* ─── CREATE TEAM MODAL ────────────────────────────────────────── */
function CreateTeamModal({
    onClose, onCreated, brokers,
}: {
    onClose: () => void
    onCreated: () => void
    brokers: Broker[]
}) {
    const [form, setForm] = useState({
        name: '', description: '', region: '', specialty: '',
        leader_id: '', color: TEAM_COLORS[0],
    })
    const [saving, setSaving] = useState(false)

    async function handleSubmit() {
        if (!form.name.trim()) { toast.error('Nome da equipe é obrigatório'); return }
        setSaving(true)
        try {
            await createTeam({
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                region: form.region.trim() || undefined,
                specialty: form.specialty.trim() || undefined,
                leader_id: form.leader_id || null,
                color: form.color,
            })
            toast.success(`Equipe "${form.name}" criada com sucesso!`)
            onCreated()
            onClose()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao criar equipe')
        } finally {
            setSaving(false)
        }
    }

    const inputStyle: React.CSSProperties = {
        background: T.surface, border: `1px solid ${T.border}`, color: T.text,
        height: 40, borderRadius: 6, padding: '0 12px', fontSize: 13, outline: 'none', width: '100%',
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 60 }}
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                className="fixed bottom-0 left-0 right-0 z-50 lg:inset-0 lg:flex lg:items-center lg:justify-center pointer-events-none"
            >
                <div
                    className="pointer-events-auto rounded-t-2xl lg:rounded-xl w-full lg:max-w-md max-h-[92vh] overflow-y-auto"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                >
                    {/* Drag handle (mobile) */}
                    <div className="pt-3 pb-1 flex justify-center lg:hidden">
                        <div className="w-9 h-1 rounded-full" style={{ background: T.border }} />
                    </div>

                    <div className="p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-base font-bold" style={{ color: T.text }}>Nova Equipe</h2>
                                <p className="text-xs mt-0.5" style={{ color: T.textDim }}>
                                    Crie uma equipe e defina seu líder
                                </p>
                            </div>
                            <button onClick={onClose}
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5"
                                style={{ color: T.textMuted }}>
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold block mb-1.5" style={{ color: T.textDim }}>
                                    Nome da Equipe *
                                </label>
                                <input
                                    type="text" autoFocus
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Ex: Equipe Alpha, Zona Sul..."
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold block mb-1.5" style={{ color: T.textDim }}>
                                    Descrição
                                </label>
                                <input
                                    type="text"
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Foco, especialidade, missão..."
                                    style={inputStyle}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold block mb-1.5" style={{ color: T.textDim }}>
                                        Região
                                    </label>
                                    <input
                                        type="text"
                                        value={form.region}
                                        onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                                        placeholder="Ex: Zona Sul"
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold block mb-1.5" style={{ color: T.textDim }}>
                                        Especialidade
                                    </label>
                                    <input
                                        type="text"
                                        value={form.specialty}
                                        onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                                        placeholder="Ex: Alto padrão"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold block mb-1.5" style={{ color: T.textDim }}>
                                    Líder da Equipe
                                </label>
                                <select
                                    value={form.leader_id}
                                    onChange={e => setForm(f => ({ ...f, leader_id: e.target.value }))}
                                    style={inputStyle}
                                >
                                    <option value="">Sem líder (definir depois)</option>
                                    {brokers.filter(b => b.status === 'active').map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold block mb-2" style={{ color: T.textDim }}>
                                    Cor da Equipe
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {TEAM_COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setForm(f => ({ ...f, color: c }))}
                                            className="w-7 h-7 rounded-full transition-transform"
                                            style={{
                                                background: c,
                                                transform: form.color === c ? 'scale(1.25)' : 'scale(1)',
                                                boxShadow: form.color === c ? `0 0 0 2px ${T.elevated}, 0 0 0 4px ${c}` : 'none',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={onClose}
                                disabled={saving}
                                className="flex-1 h-11 rounded-lg text-sm font-medium"
                                style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="flex-1 h-11 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2"
                                style={{ background: saving ? T.elevated : form.color }}
                            >
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                {saving ? 'Criando...' : 'Criar Equipe'}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    )
}

/* ─── EDIT TEAM MODAL ──────────────────────────────────────────── */
function EditTeamModal({
    team, onClose, onUpdated, brokers,
}: {
    team: Team
    onClose: () => void
    onUpdated: () => void
    brokers: Broker[]
}) {
    const [form, setForm] = useState({
        name: team.name,
        description: team.description || '',
        region: team.region || '',
        specialty: team.specialty || '',
        leader_id: team.leader_id || '',
        color: team.color || TEAM_COLORS[0],
    })
    const [saving, setSaving] = useState(false)

    async function handleSubmit() {
        if (!form.name.trim()) { toast.error('Nome da equipe é obrigatório'); return }
        setSaving(true)
        try {
            await updateTeam(team.id, {
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                region: form.region.trim() || undefined,
                specialty: form.specialty.trim() || undefined,
                leader_id: form.leader_id || null,
                color: form.color,
            } as Partial<Team>)
            toast.success(`Equipe "${form.name}" atualizada com sucesso!`)
            onUpdated()
            onClose()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao atualizar equipe')
        } finally {
            setSaving(false)
        }
    }

    const inputStyle: React.CSSProperties = {
        background: T.surface, border: `1px solid ${T.border}`, color: T.text,
        height: 40, borderRadius: 6, padding: '0 12px', fontSize: 13, outline: 'none', width: '100%',
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 60 }}
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                className="fixed bottom-0 left-0 right-0 z-50 lg:inset-0 lg:flex lg:items-center lg:justify-center pointer-events-none"
            >
                <div
                    className="pointer-events-auto rounded-t-2xl lg:rounded-xl w-full lg:max-w-md max-h-[92vh] overflow-y-auto"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                >
                    <div className="pt-3 pb-1 flex justify-center lg:hidden">
                        <div className="w-9 h-1 rounded-full" style={{ background: T.border }} />
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-base font-bold" style={{ color: T.text }}>Editar Equipe</h2>
                                <p className="text-xs mt-0.5" style={{ color: T.textDim }}>
                                    Altere os dados da equipe
                                </p>
                            </div>
                            <button onClick={onClose}
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5"
                                style={{ color: T.textMuted }}>
                                <X size={16} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold block mb-1.5" style={{ color: T.textDim }}>
                                    Nome da Equipe *
                                </label>
                                <input
                                    type="text" autoFocus
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Ex: Equipe Alpha, Zona Sul..."
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold block mb-1.5" style={{ color: T.textDim }}>
                                    Descrição
                                </label>
                                <input
                                    type="text"
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Foco, especialidade, missão..."
                                    style={inputStyle}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold block mb-1.5" style={{ color: T.textDim }}>Região</label>
                                    <input
                                        type="text"
                                        value={form.region}
                                        onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                                        placeholder="Ex: Zona Sul"
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold block mb-1.5" style={{ color: T.textDim }}>Especialidade</label>
                                    <input
                                        type="text"
                                        value={form.specialty}
                                        onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                                        placeholder="Ex: Alto padrão"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold block mb-1.5" style={{ color: T.textDim }}>
                                    Líder da Equipe
                                </label>
                                <select
                                    value={form.leader_id}
                                    onChange={e => setForm(f => ({ ...f, leader_id: e.target.value }))}
                                    style={inputStyle}
                                >
                                    <option value="">Sem líder</option>
                                    {brokers.filter(b => b.status === 'active').map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold block mb-2" style={{ color: T.textDim }}>
                                    Cor da Equipe
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {TEAM_COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setForm(f => ({ ...f, color: c }))}
                                            className="w-7 h-7 rounded-full transition-transform"
                                            style={{
                                                background: c,
                                                transform: form.color === c ? 'scale(1.25)' : 'scale(1)',
                                                boxShadow: form.color === c ? `0 0 0 2px ${T.elevated}, 0 0 0 4px ${c}` : 'none',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={onClose}
                                disabled={saving}
                                className="flex-1 h-11 rounded-lg text-sm font-medium"
                                style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="flex-1 h-11 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2"
                                style={{ background: saving ? T.elevated : form.color }}
                            >
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    )
}

/* ─── KPI CARD ─────────────────────────────────────────────────── */
function KPI({ label, value, icon: Icon, color }: {
    label: string; value: number | string; icon: React.ElementType; color: string
}) {
    return (
        <div className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-2 mb-2">
                <Icon size={13} style={{ color }} />
                <p className="text-[11px] font-medium" style={{ color: T.textDim }}>{label}</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: T.text }}>{value}</p>
        </div>
    )
}

/* ─── MAIN PAGE ────────────────────────────────────────────────── */
type Tab = 'equipes' | 'membros'

export default function EquipePage() {
    const [tab, setTab] = useState<Tab>('equipes')
    const [search, setSearch] = useState('')
    const [showCreateTeam, setShowCreateTeam] = useState(false)
    const [editingTeam, setEditingTeam] = useState<Team | null>(null)
    const [deletingTeam, setDeletingTeam] = useState<Team | null>(null)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [roleFilter, setRoleFilter] = useState('all')

    const { teams, isLoading: teamsLoading, mutate: mutateTeams } = useTeams(search)
    const { brokers, isLoading: brokersLoading, mutate: mutateBrokers } = useBrokers({ search, status: 'all' })

    // KPI stats
    const totalMembers = useMemo(() => brokers.length, [brokers])
    const activeMembers = useMemo(() => brokers.filter(b => b.status === 'active').length, [brokers])
    const managers = useMemo(() => brokers.filter(b => b.role === 'broker_manager').length, [brokers])
    const totalTeams = teams.length

    const filteredBrokers = useMemo(() =>
        brokers.filter(b =>
            (roleFilter === 'all' || b.role === roleFilter) &&
            (search === '' || b.name.toLowerCase().includes(search.toLowerCase()) || b.email.toLowerCase().includes(search.toLowerCase()))
        ),
    [brokers, roleFilter, search])

    async function handleAddMember(teamId: string, brokerId: string) {
        try {
            await addMemberToTeam(teamId, brokerId)
            toast.success('Membro adicionado à equipe!')
            mutateTeams()
            mutateBrokers()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao adicionar membro')
        }
    }

    async function handleRemoveMember(teamId: string, brokerId: string) {
        try {
            await removeMemberFromTeam(teamId, brokerId)
            toast.success('Membro removido da equipe')
            mutateTeams()
            mutateBrokers()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao remover membro')
        }
    }

    async function handleDeleteTeam() {
        if (!deletingTeam) return
        setDeleting(true)
        try {
            await deleteTeam(deletingTeam.id)
            toast.success(`Equipe "${deletingTeam.name}" excluída`)
            mutateTeams()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao excluir equipe')
        } finally {
            setDeleting(false)
            setDeletingTeam(null)
            setConfirmDelete(false)
        }
    }

    return (
        <div className="space-y-5 max-w-6xl mx-auto">

            {/* ── HEADER ─────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase mb-1"
                        style={{ color: T.textDim }}>ORGANIZAÇÃO · RH</p>
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>Equipes & Membros</h1>
                    <p className="text-sm mt-0.5" style={{ color: T.textDim }}>
                        Gestão de equipes, líderes, corretores e performance
                    </p>
                </div>
                {tab === 'equipes' && (
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setShowCreateTeam(true)}
                        className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white flex-shrink-0"
                        style={{ background: 'var(--accent-400, #C9A84C)' }}
                    >
                        <Plus size={14} /> Nova Equipe
                    </motion.button>
                )}
                {tab === 'membros' && (
                    <a
                        href="/backoffice/settings/corretores/novo"
                        className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white flex-shrink-0"
                        style={{ background: 'var(--accent-400, #C9A84C)' }}
                    >
                        <Plus size={14} /> Novo Membro
                    </a>
                )}
            </div>

            {/* ── KPIs ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPI label="Equipes"      value={totalTeams}   icon={Building2}   color="#C9A84C" />
                <KPI label="Membros"      value={totalMembers} icon={Users}        color="#60A5FA" />
                <KPI label="Ativos"       value={activeMembers} icon={CheckCircle} color="#10B981" />
                <KPI label="Gerentes"     value={managers}     icon={Crown}        color="#FBBF24" />
            </div>

            {/* ── TABS + SEARCH ────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                {/* Tab switcher */}
                <div className="flex items-center gap-0.5 p-1 rounded-lg flex-shrink-0"
                    style={{ background: T.elevated }}>
                    {([
                        { key: 'equipes',  label: 'Equipes',  icon: Building2 },
                        { key: 'membros',  label: 'Membros',  icon: Users },
                    ] as { key: Tab; label: string; icon: React.ElementType }[]).map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                            style={{
                                background: tab === t.key ? 'var(--accent-400, #C9A84C)' : 'transparent',
                                color: tab === t.key ? '#fff' : T.textMuted,
                            }}
                        >
                            <t.icon size={12} /> {t.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative flex-1 min-w-0">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: T.textMuted }} />
                    <input
                        type="text"
                        placeholder={tab === 'equipes' ? 'Buscar equipes...' : 'Buscar por nome ou email...'}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full h-9 pl-9 pr-4 rounded-lg text-sm outline-none"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                    />
                </div>

                {/* Role filter (membros only) */}
                {tab === 'membros' && (
                    <select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        className="h-9 px-3 rounded-lg text-xs outline-none flex-shrink-0"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                    >
                        <option value="all">Todas as funções</option>
                        <option value="broker">Corretores</option>
                        <option value="broker_manager">Gerentes</option>
                        <option value="admin">Administradores</option>
                    </select>
                )}
            </div>

            {/* ── EQUIPES TAB ─────────────────────────────────────────── */}
            {tab === 'equipes' && (
                <>
                    {teamsLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="rounded-xl h-36 animate-pulse"
                                    style={{ background: T.surface, border: `1px solid ${T.border}` }} />
                            ))}
                        </div>
                    ) : teams.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="rounded-xl p-16 text-center"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        >
                            <Building2 size={32} className="mx-auto mb-4 opacity-30" style={{ color: T.textMuted }} />
                            <h3 className="text-base font-bold mb-2" style={{ color: T.text }}>
                                Nenhuma equipe criada
                            </h3>
                            <p className="text-sm mb-5 max-w-xs mx-auto" style={{ color: T.textDim }}>
                                Crie equipes para organizar seus corretores, definir líderes e monitorar performance.
                            </p>
                            <button
                                onClick={() => setShowCreateTeam(true)}
                                className="inline-flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold text-white"
                                style={{ background: 'var(--accent-400, #C9A84C)' }}
                            >
                                <Plus size={14} /> Criar Primeira Equipe
                            </button>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {teams.map((team, i) => (
                                <TeamCard
                                    key={team.id}
                                    team={team}
                                    index={i}
                                    onEdit={t => setEditingTeam(t)}
                                    onDelete={t => { setDeletingTeam(t); setConfirmDelete(true) }}
                                    onAddMember={handleAddMember}
                                    onRemoveMember={handleRemoveMember}
                                    allBrokers={brokers}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ── MEMBROS TAB ─────────────────────────────────────────── */}
            {tab === 'membros' && (
                <>
                    {brokersLoading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="rounded-lg h-16 animate-pulse"
                                    style={{ background: T.surface, border: `1px solid ${T.border}` }} />
                            ))}
                        </div>
                    ) : filteredBrokers.length === 0 ? (
                        <div className="rounded-xl p-12 text-center"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <Users size={28} className="mx-auto mb-3 opacity-30" style={{ color: T.textMuted }} />
                            <p className="text-sm font-semibold" style={{ color: T.text }}>
                                {brokers.length === 0 ? 'Nenhum membro cadastrado' : 'Nenhum resultado'}
                            </p>
                            <p className="text-xs mt-1" style={{ color: T.textDim }}>
                                {brokers.length === 0
                                    ? 'Convide membros em Configurações → Usuários'
                                    : 'Ajuste os filtros de busca'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-xs" style={{ color: T.textDim }}>
                                {filteredBrokers.length} {filteredBrokers.length === 1 ? 'membro' : 'membros'}
                            </p>
                            <div className="space-y-2">
                                {filteredBrokers.map((broker, i) => (
                                    <MemberRow key={broker.id} broker={broker} index={i} />
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ── CREATE TEAM MODAL ────────────────────────────────────── */}
            <AnimatePresence>
                {showCreateTeam && (
                    <CreateTeamModal
                        onClose={() => setShowCreateTeam(false)}
                        onCreated={() => mutateTeams()}
                        brokers={brokers}
                    />
                )}
            </AnimatePresence>

            {/* ── EDIT TEAM MODAL ──────────────────────────────────────── */}
            <AnimatePresence>
                {editingTeam && (
                    <EditTeamModal
                        team={editingTeam}
                        onClose={() => setEditingTeam(null)}
                        onUpdated={() => mutateTeams()}
                        brokers={brokers}
                    />
                )}
            </AnimatePresence>

            {/* ── DELETE TEAM CONFIRM ──────────────────────────────────── */}
            <AnimatePresence>
                {confirmDelete && deletingTeam && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                            onClick={() => { if (!deleting) { setConfirmDelete(false); setDeletingTeam(null) } }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="pointer-events-auto rounded-xl p-6 w-full max-w-sm text-center"
                                style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                <AlertCircle size={28} className="mx-auto mb-3" style={{ color: '#EF4444' }} />
                                <h3 className="text-base font-bold mb-1" style={{ color: T.text }}>
                                    Excluir equipe?
                                </h3>
                                <p className="text-sm mb-5" style={{ color: T.textDim }}>
                                    A equipe <strong style={{ color: T.text }}>{deletingTeam.name}</strong> será
                                    desativada e os membros serão desvinculados.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setConfirmDelete(false); setDeletingTeam(null) }}
                                        disabled={deleting}
                                        className="flex-1 h-10 rounded-lg text-sm font-medium"
                                        style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted }}>
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleDeleteTeam}
                                        disabled={deleting}
                                        className="flex-1 h-10 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2"
                                        style={{ background: '#EF4444' }}>
                                        {deleting && <Loader2 size={13} className="animate-spin" />}
                                        Excluir
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
