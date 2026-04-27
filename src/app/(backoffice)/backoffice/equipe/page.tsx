'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, UserCheck, UserX, Crown, Shield, User,
    Search, Plus, Mail, Phone, Calendar, ChevronRight,
    MoreHorizontal, Edit, Trash2, CheckCircle, XCircle,
    Activity, Award, LayoutGrid, Building2, X, Loader2,
    ChevronDown, ChevronUp, UserMinus
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { useBrokers, updateBrokerStatus, type Broker } from '@/hooks/use-brokers'
import { PageIntelHeader, KPICard, FilterTabs, type FilterTab } from '../../components/ui'
import { T } from '../../lib/theme'
import { getStatusConfig } from '../../lib/constants'

/* ─── TYPES ─────────────────────────────────────────────────────── */
interface TeamMember {
    id: string
    role: 'leader' | 'member' | 'viewer'
    joined_at: string
    broker: {
        id: string
        name: string
        email: string
        avatar_url: string | null
        role: string
        status: string
    } | null
}

interface Team {
    id: string
    name: string
    description: string | null
    color: string
    status: string
    created_at: string
    leader_id: string | null
    leader: { id: string; name: string; email: string; avatar_url: string | null; role: string } | null
    team_members: TeamMember[]
}

/* ─── ROLE CONFIG ───────────────────────────────────────────────── */
const ROLE_CFG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    broker:         { label: 'Corretor',        icon: User,   color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
    broker_manager: { label: 'Gerente',         icon: Crown,  color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
    admin:          { label: 'Administrador',   icon: Shield, color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
}

function Avatar({ name, url, size = 8 }: { name: string; url?: string | null; size?: number }) {
    const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    const cls = `rounded-[6px] flex items-center justify-center text-[10px] font-bold flex-shrink-0`
    const style = { width: `${size * 4}px`, height: `${size * 4}px`, background: 'rgba(96,165,250,0.15)', color: 'var(--info)', border: `1px solid rgba(96,165,250,0.25)` }
    if (url) return (
        <div className={`relative overflow-hidden ${cls}`} style={style}>
            <Image src={url} alt={name} fill className="object-cover" />
        </div>
    )
    return <div className={cls} style={style}>{initials}</div>
}

/* ─── BROKER CARD ───────────────────────────────────────────────── */
function BrokerCard({ broker, index, onToggleStatus, onDelete }: {
    broker: Broker
    index: number
    onToggleStatus: (id: string, current: string) => Promise<void>
    onDelete: (broker: Broker) => void
}) {
    const [menuOpen, setMenuOpen] = useState(false)
    const role = ROLE_CFG[broker.role] || ROLE_CFG.broker
    const RoleIcon = role.icon
    const isActive = broker.status === 'active'

    const initials = broker.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    const lastLogin = broker.last_login_at
        ? formatDistanceToNow(new Date(broker.last_login_at), { addSuffix: true, locale: ptBR })
        : 'Nunca'
    const joined = broker.created_at ? format(new Date(broker.created_at), 'MMM yyyy', { locale: ptBR }) : '—'

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="group relative rounded-lg overflow-hidden transition-all duration-200"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
            <div className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: isActive
                    ? `linear-gradient(90deg, transparent, ${getStatusConfig('ativo').dot}99, transparent)`
                    : `linear-gradient(90deg, transparent, ${getStatusConfig('inativo').dot}4d, transparent)` }} />

            <div className="p-5">
                <div className="flex items-start gap-3 mb-4">
                    <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-[6px] overflow-hidden flex items-center justify-center text-sm font-bold"
                            style={{ background: isActive ? 'rgba(96,165,250,0.15)' : T.elevated, border: `1px solid ${isActive ? 'rgba(96,165,250,0.25)' : T.border}`, color: isActive ? 'var(--info)' : T.textMuted }}>
                            {broker.avatar_url ? (
                                <Image src={broker.avatar_url} alt={broker.name} fill className="object-cover" />
                            ) : initials}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                            style={{ background: getStatusConfig(isActive ? 'ativo' : 'inativo').dot, borderColor: T.surface }} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{broker.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                                style={{ color: role.color, background: role.bg }}>
                                <RoleIcon size={9} /> {role.label}
                            </span>
                            {(() => {
                                const sc = getStatusConfig(isActive ? 'ativo' : 'inativo')
                                return (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                                        style={{ color: sc.dot, background: `${sc.dot}1a` }}>
                                        {isActive ? <CheckCircle size={9} /> : <XCircle size={9} />} {sc.label}
                                    </span>
                                )
                            })()}
                        </div>
                    </div>

                    <div className="relative" onClick={e => e.stopPropagation()}>
                        <motion.button whileTap={{ scale: 0.88 }}
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="w-7 h-7 rounded-[6px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <MoreHorizontal size={13} style={{ color: T.textMuted }} />
                        </motion.button>

                        <AnimatePresence>
                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.88, y: -6 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.88, y: -6 }}
                                        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                                        className="absolute right-0 top-9 z-50 w-44 rounded-lg overflow-hidden shadow-2xl"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                        <Link href={`/backoffice/settings/corretores/${broker.id}/editar`}
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium hover:bg-[var(--bg-hover)] transition-colors"
                                            style={{ color: T.text }}>
                                            <Edit size={11} /> Editar Perfil
                                        </Link>
                                        <button
                                            onClick={() => { setMenuOpen(false); onToggleStatus(broker.id, broker.status) }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium hover:bg-[var(--bg-hover)] transition-colors"
                                            style={{ color: isActive ? T.error : T.success }}>
                                            {isActive ? <XCircle size={11} /> : <CheckCircle size={11} />}
                                            {isActive ? 'Desativar' : 'Ativar'}
                                        </button>
                                        <div style={{ height: '1px', background: T.border }} />
                                        <button onClick={() => { setMenuOpen(false); onDelete(broker) }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium hover:bg-red-500/10 transition-colors"
                                            style={{ color: '#ef4444' }}>
                                            <Trash2 size={11} /> Remover
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: T.textDim }}>
                        <Mail size={10} className="flex-shrink-0 opacity-60" />
                        <span className="truncate">{broker.email}</span>
                    </div>
                    {broker.phone && (
                        <div className="flex items-center gap-2 text-[11px]" style={{ color: T.textDim }}>
                            <Phone size={10} className="flex-shrink-0 opacity-60" />
                            <span>{broker.phone}</span>
                        </div>
                    )}
                    {broker.creci && (
                        <div className="flex items-center gap-2 text-[11px]" style={{ color: T.textDim }}>
                            <Award size={10} className="flex-shrink-0 opacity-60" />
                            <span className="font-mono">CRECI {broker.creci}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-3 text-[10px]"
                    style={{ borderTop: `1px solid ${T.border}`, color: T.textDim }}>
                    <div className="flex items-center gap-1"><Calendar size={9} className="opacity-60" /><span>Desde {joined}</span></div>
                    <div className="flex items-center gap-1"><Activity size={9} className="opacity-60" /><span>{lastLogin}</span></div>
                </div>
            </div>
        </motion.div>
    )
}

/* ─── TEAM CARD ─────────────────────────────────────────────────── */
function TeamCard({ team, allBrokers, onRefresh }: {
    team: Team
    allBrokers: Broker[]
    onRefresh: () => void
}) {
    const [expanded, setExpanded] = useState(false)
    const [addingMember, setAddingMember] = useState(false)
    const [selectedBrokerId, setSelectedBrokerId] = useState('')
    const [saving, setSaving] = useState(false)
    const [removing, setRemoving] = useState<string | null>(null)

    const members = team.team_members.filter(m => m.broker?.status === 'active')
    const memberBrokerIds = new Set(members.map(m => m.broker?.id).filter(Boolean))
    const availableBrokers = allBrokers.filter(b =>
        !memberBrokerIds.has(b.id) &&
        b.status === 'active'
    )

    const handleAddMember = async () => {
        if (!selectedBrokerId) return
        setSaving(true)
        try {
            const res = await fetch(`/api/teams/${team.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ broker_id: selectedBrokerId }),
            })
            const j = await res.json()
            if (!res.ok) throw new Error(j.error)
            toast.success('Membro adicionado à equipe')
            setAddingMember(false)
            setSelectedBrokerId('')
            onRefresh()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Erro ao adicionar')
        } finally {
            setSaving(false)
        }
    }

    const handleRemoveMember = async (brokerId: string, brokerName: string) => {
        setRemoving(brokerId)
        try {
            const res = await fetch(`/api/teams/${team.id}/members?broker_id=${brokerId}`, { method: 'DELETE' })
            const j = await res.json()
            if (!res.ok) throw new Error(j.error)
            toast.success(`${brokerName} removido da equipe`)
            onRefresh()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Erro ao remover')
        } finally {
            setRemoving(null)
        }
    }

    const teamColor = team.color || '#3D6FFF'
    const nonLeaderMembers = members.filter(m => m.role !== 'leader')

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl overflow-hidden"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
            <div className="h-1" style={{ background: teamColor }} />
            <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: `${teamColor}20`, border: `1px solid ${teamColor}40` }}>
                            <Building2 size={14} style={{ color: teamColor }} />
                        </div>
                        <div>
                            <p className="text-sm font-bold" style={{ color: T.text }}>{team.name}</p>
                            <p className="text-[10px]" style={{ color: T.textDim }}>
                                {members.length} membro{members.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setExpanded(e => !e)}
                        className="w-7 h-7 rounded-[6px] flex items-center justify-center"
                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        {expanded
                            ? <ChevronUp size={13} style={{ color: T.textMuted }} />
                            : <ChevronDown size={13} style={{ color: T.textMuted }} />}
                    </button>
                </div>

                {/* Leader */}
                {team.leader ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg mb-3"
                        style={{ background: `${teamColor}08`, border: `1px solid ${teamColor}20` }}>
                        <Avatar name={team.leader.name} url={team.leader.avatar_url} size={8} />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: T.text }}>{team.leader.name}</p>
                            <p className="text-[10px] truncate" style={{ color: T.textDim }}>{team.leader.email}</p>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                            style={{ color: teamColor, background: `${teamColor}20` }}>
                            Gestor
                        </span>
                    </div>
                ) : (
                    <div className="p-3 rounded-lg mb-3 text-xs text-center"
                        style={{ background: T.elevated, border: `1px dashed ${T.border}`, color: T.textDim }}>
                        Sem gestor definido
                    </div>
                )}

                {/* Member avatars preview */}
                {nonLeaderMembers.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-3">
                        {nonLeaderMembers.slice(0, 5).map(m => m.broker && (
                            <div key={m.id} title={m.broker.name}>
                                <Avatar name={m.broker.name} url={m.broker.avatar_url} size={7} />
                            </div>
                        ))}
                        {nonLeaderMembers.length > 5 && (
                            <div className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[9px] font-bold"
                                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}>
                                +{nonLeaderMembers.length - 5}
                            </div>
                        )}
                        <span className="text-[10px] ml-1" style={{ color: T.textDim }}>
                            {nonLeaderMembers.length} corretor{nonLeaderMembers.length !== 1 ? 'es' : ''}
                        </span>
                    </div>
                )}

                {/* Expanded */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-1.5 pt-1" style={{ borderTop: `1px solid ${T.border}` }}>
                                <p className="text-[10px] font-bold uppercase tracking-wider pt-3 pb-1"
                                    style={{ color: T.textDim }}>Membros da Equipe</p>

                                {nonLeaderMembers.length === 0 && !addingMember && (
                                    <p className="text-xs py-2" style={{ color: T.textDim }}>
                                        Nenhum corretor nesta equipe ainda.
                                    </p>
                                )}

                                {nonLeaderMembers.map(m => m.broker && (
                                    <div key={m.id} className="flex items-center gap-2.5 p-2 rounded-lg group/member"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                        <Avatar name={m.broker.name} url={m.broker.avatar_url} size={6} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate" style={{ color: T.text }}>{m.broker.name}</p>
                                            <p className="text-[10px] truncate" style={{ color: T.textDim }}>{m.broker.email}</p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveMember(m.broker!.id, m.broker!.name)}
                                            disabled={removing === m.broker.id}
                                            className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover/member:opacity-100 transition-opacity"
                                            style={{ color: T.error }}>
                                            {removing === m.broker.id
                                                ? <Loader2 size={11} className="animate-spin" />
                                                : <UserMinus size={11} />}
                                        </button>
                                    </div>
                                ))}

                                {addingMember ? (
                                    <div className="flex items-center gap-2 pt-1">
                                        <select value={selectedBrokerId} onChange={e => setSelectedBrokerId(e.target.value)}
                                            className="flex-1 h-9 px-3 rounded-lg text-xs outline-none"
                                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}>
                                            <option value="">Selecionar corretor...</option>
                                            {availableBrokers.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                        <button onClick={handleAddMember} disabled={!selectedBrokerId || saving}
                                            className="h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                                            style={{ background: T.accent, color: '#0B1928' }}>
                                            {saving ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                                            OK
                                        </button>
                                        <button onClick={() => { setAddingMember(false); setSelectedBrokerId('') }}
                                            className="h-9 w-9 rounded-lg flex items-center justify-center"
                                            style={{ border: `1px solid ${T.border}`, color: T.textMuted }}>
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => setAddingMember(true)}
                                        className="w-full mt-1 h-8 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                                        style={{ border: `1px dashed ${T.border}`, color: T.textDim }}>
                                        <Plus size={11} /> Adicionar Membro
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

/* ─── NOVA EQUIPE MODAL ─────────────────────────────────────────── */
function NovaEquipeModal({ managers, onClose, onCreated }: {
    managers: Broker[]
    onClose: () => void
    onCreated: () => void
}) {
    const [name, setName] = useState('')
    const [leaderId, setLeaderId] = useState('')
    const [color, setColor] = useState('#3D6FFF')
    const [saving, setSaving] = useState(false)

    const COLORS = ['#3D6FFF', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4']

    const handleCreate = async () => {
        if (!name.trim()) { toast.error('Nome da equipe é obrigatório'); return }
        setSaving(true)
        try {
            const res = await fetch('/api/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), leader_id: leaderId || null, color }),
            })
            const j = await res.json()
            if (!res.ok) throw new Error(j.error)
            toast.success(`Equipe "${name}" criada!`)
            onCreated()
            onClose()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Erro ao criar equipe')
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 12 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
                <div className="pointer-events-auto rounded-xl w-full max-w-md shadow-2xl"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center justify-between p-5"
                        style={{ borderBottom: `1px solid ${T.border}` }}>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${T.accent}15` }}>
                                <Building2 size={15} style={{ color: T.accent }} />
                            </div>
                            <h3 className="font-bold text-sm" style={{ color: T.text }}>Nova Equipe</h3>
                        </div>
                        <button onClick={onClose} className="w-7 h-7 rounded-[6px] flex items-center justify-center"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <X size={13} style={{ color: T.textMuted }} />
                        </button>
                    </div>

                    <div className="p-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: T.textDim }}>
                                Nome da Equipe *
                            </label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)}
                                placeholder="Ex: Equipe Alpha, Equipe Zona Sul..."
                                className="w-full h-11 px-4 rounded-lg outline-none text-sm"
                                style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: T.textDim }}>
                                Gestor
                            </label>
                            <select value={leaderId} onChange={e => setLeaderId(e.target.value)}
                                className="w-full h-11 px-4 rounded-lg outline-none text-sm"
                                style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}>
                                <option value="">Sem gestor por enquanto</option>
                                {managers.map(m => (
                                    <option key={m.user_id} value={m.user_id}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: T.textDim }}>
                                Cor da Equipe
                            </label>
                            <div className="flex items-center gap-2">
                                {COLORS.map(c => (
                                    <button key={c} type="button" onClick={() => setColor(c)}
                                        className="w-7 h-7 rounded-full transition-transform"
                                        style={{
                                            background: c,
                                            outline: color === c ? `3px solid ${c}` : 'none',
                                            outlineOffset: '2px',
                                            transform: color === c ? 'scale(1.15)' : 'scale(1)',
                                        }} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 p-5" style={{ borderTop: `1px solid ${T.border}` }}>
                        <button onClick={onClose} className="flex-1 h-10 rounded-lg text-sm font-medium"
                            style={{ border: `1px solid ${T.border}`, color: T.textMuted }}>
                            Cancelar
                        </button>
                        <button onClick={handleCreate} disabled={saving || !name.trim()}
                            className="flex-1 h-10 rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                            style={{ background: T.accent, color: '#0B1928' }}>
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                            Criar Equipe
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    )
}

/* ─── EMPTY STATE ───────────────────────────────────────────────── */
function EmptyEquipe({ onAddFirst }: { onAddFirst: () => void }) {
    return (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-lg p-16 text-center"
            style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
            <div className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(96,165,250,0.10)' }}>
                <Users size={28} style={{ color: 'var(--info)', opacity: 0.7 }} />
            </div>
            <h3 className="text-base font-semibold mb-2" style={{ color: T.text }}>Nenhum membro na equipe</h3>
            <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: T.textMuted }}>
                Adicione corretores e gerentes para começar a gerenciar sua equipe comercial.
            </p>
            <button onClick={onAddFirst} className="bo-btn bo-btn-primary" style={{ background: T.accent }}>
                <Plus size={15} /> Adicionar Primeiro Membro
            </button>
        </motion.div>
    )
}

/* ─── MAIN PAGE ─────────────────────────────────────────────────── */
const FILTER_TABS: FilterTab[] = [
    { id: 'all',      label: 'Todos' },
    { id: 'active',   label: 'Ativos' },
    { id: 'inactive', label: 'Inativos' },
    { id: 'broker',   label: 'Corretores' },
    { id: 'manager',  label: 'Gerentes' },
]

export default function EquipePage() {
    const [view, setView] = useState<'members' | 'teams'>('members')
    const [search, setSearch] = useState('')
    const [tab, setTab] = useState('all')
    const [confirmDelete, setConfirmDelete] = useState<Broker | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [teams, setTeams] = useState<Team[]>([])
    const [loadingTeams, setLoadingTeams] = useState(false)
    const [showNovaEquipe, setShowNovaEquipe] = useState(false)

    const { brokers, isLoading, mutate } = useBrokers({
        search,
        status: tab === 'active' ? 'active' : tab === 'inactive' ? 'inactive' : 'all',
    })

    const fetchTeams = useCallback(async () => {
        setLoadingTeams(true)
        try {
            const res = await fetch('/api/teams')
            const j = await res.json()
            setTeams(j.data || [])
        } catch {
            toast.error('Erro ao carregar equipes')
        } finally {
            setLoadingTeams(false)
        }
    }, [])

    useEffect(() => {
        if (view === 'teams') fetchTeams()
    }, [view, fetchTeams])

    const filteredByRole = tab === 'broker'
        ? brokers.filter(b => b.role === 'broker')
        : tab === 'manager'
        ? brokers.filter(b => b.role === 'broker_manager')
        : brokers

    const activeCount   = brokers.filter(b => b.status === 'active').length
    const inactiveCount = brokers.filter(b => b.status === 'inactive').length
    const managerCount  = brokers.filter(b => b.role === 'broker_manager').length
    const managers      = brokers.filter(b => b.role === 'broker_manager' && b.status === 'active')

    const teamMemberBrokerIds = new Set(
        teams.flatMap(t => t.team_members.map(m => m.broker?.id).filter(Boolean))
    )
    const unassignedBrokers = brokers.filter(b => !teamMemberBrokerIds.has(b.id) && b.status === 'active')

    const handleToggleStatus = async (id: string, current: string) => {
        const newStatus = current === 'active' ? 'inactive' : 'active'
        try {
            await updateBrokerStatus(id, newStatus as 'active' | 'inactive')
            toast.success(`Membro ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso`)
            mutate()
        } catch {
            toast.error('Erro ao atualizar status')
        }
    }

    const handleDelete = async () => {
        if (!confirmDelete) return
        setDeleting(true)
        try {
            const res = await fetch(`/api/equipe?id=${confirmDelete.id}`, { method: 'DELETE' })
            if (!res.ok) {
                const json = await res.json()
                throw new Error(json.error || 'Erro ao remover')
            }
            toast.success(`${confirmDelete.name} removido da equipe`)
            mutate()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao remover membro')
        } finally {
            setDeleting(false)
            setConfirmDelete(null)
        }
    }

    return (
        <div className="space-y-6">
            <PageIntelHeader
                moduleLabel="EQUIPE · RH"
                title="Equipe Comercial"
                subtitle="Gestão de corretores, gerentes e permissões"
                actions={
                    <div className="flex items-center gap-2">
                        {view === 'teams' && (
                            <button onClick={() => setShowNovaEquipe(true)}
                                className="bo-btn"
                                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}>
                                <Building2 size={14} /> Nova Equipe
                            </button>
                        )}
                        <Link href="/backoffice/settings/corretores/novo"
                            className="bo-btn bo-btn-primary"
                            style={{ background: T.accent }}>
                            <Plus size={15} /> Novo Membro
                        </Link>
                    </div>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPICard label="Total Equipe" value={brokers.length} icon={<Users size={14} />} accent="blue" size="sm" />
                <KPICard label="Ativos" value={activeCount} icon={<UserCheck size={14} />} accent="green" size="sm"
                    delta={brokers.length > 0 ? Math.round((activeCount / brokers.length) * 100) : 0}
                    deltaLabel="da equipe" />
                <KPICard label="Inativos" value={inactiveCount} icon={<UserX size={14} />} accent="hot" size="sm" />
                <KPICard label="Gerentes" value={managerCount} icon={<Crown size={14} />} accent="ai" size="sm" />
            </div>

            {/* View Toggle + Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex items-center rounded-lg overflow-hidden flex-shrink-0"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                    <button onClick={() => setView('members')}
                        className="flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold transition-colors"
                        style={{ background: view === 'members' ? T.accent : 'transparent', color: view === 'members' ? '#0B1928' : T.textMuted }}>
                        <LayoutGrid size={13} /> Por Membro
                    </button>
                    <button onClick={() => setView('teams')}
                        className="flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold transition-colors"
                        style={{ background: view === 'teams' ? T.accent : 'transparent', color: view === 'teams' ? '#0B1928' : T.textMuted }}>
                        <Building2 size={13} /> Por Equipe
                    </button>
                </div>

                {view === 'members' ? (
                    <>
                        <div className="relative flex-1 min-w-0">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                style={{ color: T.textMuted }} />
                            <input type="text" placeholder="Buscar por nome, email ou CRECI..."
                                value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full h-10 pl-9 pr-4 rounded-[6px] text-sm outline-none"
                                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }} />
                        </div>
                        <FilterTabs tabs={FILTER_TABS} active={tab} onChange={setTab} />
                    </>
                ) : (
                    <div className="relative flex-1 min-w-0">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ color: T.textMuted }} />
                        <input type="text" placeholder="Buscar equipes..."
                            className="w-full h-10 pl-9 pr-4 rounded-[6px] text-sm outline-none"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }} />
                    </div>
                )}
            </div>

            {/* ── VIEW: POR MEMBRO ── */}
            {view === 'members' && (
                <>
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="rounded-lg p-5 animate-pulse"
                                    style={{ background: T.surface, border: `1px solid ${T.border}`, height: 200 }} />
                            ))}
                        </div>
                    ) : filteredByRole.length === 0 ? (
                        <EmptyEquipe onAddFirst={() => window.location.href = '/backoffice/settings/corretores/novo'} />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence>
                                {filteredByRole.map((broker, i) => (
                                    <BrokerCard key={broker.id} broker={broker} index={i}
                                        onToggleStatus={handleToggleStatus}
                                        onDelete={(b) => setConfirmDelete(b)} />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                    {!isLoading && filteredByRole.length > 0 && (
                        <div className="flex justify-end">
                            <Link href="/backoffice/settings/corretores"
                                className="inline-flex items-center gap-1.5 text-xs font-medium hover:opacity-80"
                                style={{ color: T.textDim }}>
                                Gerenciar corretores em Configurações <ChevronRight size={13} />
                            </Link>
                        </div>
                    )}
                </>
            )}

            {/* ── VIEW: POR EQUIPE ── */}
            {view === 'teams' && (
                <>
                    {loadingTeams ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="rounded-xl p-5 animate-pulse"
                                    style={{ background: T.surface, border: `1px solid ${T.border}`, height: 220 }} />
                            ))}
                        </div>
                    ) : teams.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="rounded-xl p-12 text-center"
                            style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
                                style={{ background: 'rgba(96,165,250,0.10)' }}>
                                <Building2 size={24} style={{ color: 'var(--info)', opacity: 0.7 }} />
                            </div>
                            <h3 className="text-sm font-semibold mb-2" style={{ color: T.text }}>Nenhuma equipe criada</h3>
                            <p className="text-xs mb-5 max-w-xs mx-auto" style={{ color: T.textMuted }}>
                                Organize seus corretores em equipes com gestores definidos.
                            </p>
                            <button onClick={() => setShowNovaEquipe(true)}
                                className="inline-flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold"
                                style={{ background: T.accent, color: '#0B1928' }}>
                                <Plus size={14} /> Criar Primeira Equipe
                            </button>
                        </motion.div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {teams.map(team => (
                                    <TeamCard key={team.id} team={team} allBrokers={brokers} onRefresh={fetchTeams} />
                                ))}
                            </div>

                            {unassignedBrokers.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="h-px flex-1" style={{ background: T.border }} />
                                        <span className="text-[11px] font-bold uppercase tracking-wider px-2" style={{ color: T.textDim }}>
                                            Sem equipe ({unassignedBrokers.length})
                                        </span>
                                        <div className="h-px flex-1" style={{ background: T.border }} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {unassignedBrokers.map((b, i) => (
                                            <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="flex items-center gap-3 p-3 rounded-lg"
                                                style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                                <Avatar name={b.name} url={b.avatar_url} size={7} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium truncate" style={{ color: T.text }}>{b.name}</p>
                                                    <p className="text-[10px]" style={{ color: T.textDim }}>
                                                        {ROLE_CFG[b.role]?.label || b.role}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Delete Confirmation */}
            <AnimatePresence>
                {confirmDelete && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                            onClick={() => !deleting && setConfirmDelete(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                            <div className="pointer-events-auto rounded-xl p-6 w-full max-w-sm text-center"
                                style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                <Trash2 size={28} className="mx-auto mb-3" style={{ color: '#ef4444' }} />
                                <h3 className="text-base font-bold mb-1" style={{ color: T.text }}>Remover membro?</h3>
                                <p className="text-sm mb-5" style={{ color: T.textMuted }}>
                                    <strong>{confirmDelete.name}</strong> será removido permanentemente da equipe e perderá acesso ao sistema.
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={() => setConfirmDelete(null)} disabled={deleting}
                                        className="flex-1 h-10 rounded-[6px] text-sm font-medium"
                                        style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted }}>
                                        Cancelar
                                    </button>
                                    <button onClick={handleDelete} disabled={deleting}
                                        className="flex-1 h-10 rounded-[6px] text-sm font-semibold text-white flex items-center justify-center gap-2"
                                        style={{ background: '#ef4444' }}>
                                        {deleting ? 'Removendo...' : 'Remover'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Nova Equipe Modal */}
            <AnimatePresence>
                {showNovaEquipe && (
                    <NovaEquipeModal
                        managers={managers}
                        onClose={() => setShowNovaEquipe(false)}
                        onCreated={fetchTeams}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
