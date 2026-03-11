'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, UserCheck, UserX, Crown, Shield, User,
    Search, Plus, Mail, Phone, Calendar, ChevronRight,
    MoreHorizontal, Edit, Trash2, CheckCircle, XCircle,
    Activity, Award
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { useBrokers, updateBrokerStatus, type Broker } from '@/hooks/use-brokers'
import { PageIntelHeader, KPICard, FilterTabs, type FilterTab } from '../../components/ui'
import { T } from '../../lib/theme'

/* ─── ROLE CONFIG ──────────────────────────────────────────────── */
const ROLE_CFG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    broker:         { label: 'Corretor',  icon: User,   color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
    broker_manager: { label: 'Gerente',   icon: Crown,  color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
    admin:          { label: 'Admin',     icon: Shield, color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
}

/* ─── BROKER CARD ──────────────────────────────────────────────── */
function BrokerCard({ broker, index, onToggleStatus }: {
    broker: Broker
    index: number
    onToggleStatus: (id: string, current: string) => Promise<void>
}) {
    const [menuOpen, setMenuOpen] = useState(false)
    const role = ROLE_CFG[broker.role] || ROLE_CFG.broker
    const RoleIcon = role.icon
    const isActive = broker.status === 'active'

    const initials = broker.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()

    const lastLogin = broker.last_login_at
        ? formatDistanceToNow(new Date(broker.last_login_at), { addSuffix: true, locale: ptBR })
        : 'Nunca'

    const joined = broker.created_at
        ? format(new Date(broker.created_at), 'MMM yyyy', { locale: ptBR })
        : '—'

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="group relative rounded-2xl overflow-hidden transition-all duration-200"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
            {/* Active indicator top bar */}
            <div
                className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300"
                style={{
                    background: isActive
                        ? 'linear-gradient(90deg, transparent 0%, rgba(74,222,128,0.6) 50%, transparent 100%)'
                        : 'linear-gradient(90deg, transparent 0%, rgba(100,116,139,0.3) 50%, transparent 100%)',
                }}
            />

            <div className="p-5">
                {/* Header: avatar + name + actions */}
                <div className="flex items-start gap-3 mb-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <div
                            className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center text-sm font-bold"
                            style={{
                                background: isActive ? 'rgba(59,130,246,0.15)' : T.elevated,
                                border: `1px solid ${isActive ? 'rgba(59,130,246,0.25)' : T.border}`,
                                color: isActive ? '#60A5FA' : T.textMuted,
                            }}
                        >
                            {broker.avatar_url ? (
                                <Image
                                    src={broker.avatar_url}
                                    alt={broker.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                initials
                            )}
                        </div>
                        {/* Online dot */}
                        <div
                            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                            style={{
                                background: isActive ? '#4ADE80' : '#64748B',
                                borderColor: T.surface,
                            }}
                        />
                    </div>

                    {/* Name + role */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: T.text }}>
                            {broker.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                                className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                                style={{ color: role.color, background: role.bg }}
                            >
                                <RoleIcon size={9} />
                                {role.label}
                            </span>
                            <span
                                className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                                style={{
                                    color: isActive ? '#4ADE80' : '#64748B',
                                    background: isActive ? 'rgba(74,222,128,0.10)' : 'rgba(100,116,139,0.10)',
                                }}
                            >
                                {isActive ? <CheckCircle size={9} /> : <XCircle size={9} />}
                                {isActive ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>
                    </div>

                    {/* Actions menu */}
                    <div className="relative" onClick={e => e.stopPropagation()}>
                        <motion.button
                            whileTap={{ scale: 0.88 }}
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                        >
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
                                        className="absolute right-0 top-9 z-50 w-44 rounded-xl overflow-hidden shadow-2xl"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                                    >
                                        <Link
                                            href={`/backoffice/settings/corretores`}
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium hover:bg-[var(--bo-hover)] transition-colors"
                                            style={{ color: T.text }}
                                        >
                                            <Edit size={11} /> Editar Perfil
                                        </Link>
                                        <button
                                            onClick={() => { setMenuOpen(false); onToggleStatus(broker.id, broker.status) }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium hover:bg-[var(--bo-hover)] transition-colors"
                                            style={{ color: isActive ? '#f87171' : '#4ADE80' }}
                                        >
                                            {isActive ? <XCircle size={11} /> : <CheckCircle size={11} />}
                                            {isActive ? 'Desativar' : 'Ativar'}
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Contact info */}
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

                {/* Footer: join date + last login */}
                <div
                    className="flex items-center justify-between pt-3 text-[10px]"
                    style={{ borderTop: `1px solid ${T.border}`, color: T.textDim }}
                >
                    <div className="flex items-center gap-1">
                        <Calendar size={9} className="opacity-60" />
                        <span>Desde {joined}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Activity size={9} className="opacity-60" />
                        <span>{lastLogin}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

/* ─── EMPTY STATE ──────────────────────────────────────────────── */
function EmptyEquipe({ onAddFirst }: { onAddFirst: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-16 text-center"
            style={{ background: T.elevated, border: `1px solid ${T.border}` }}
        >
            <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(96,165,250,0.10)' }}
            >
                <Users size={28} style={{ color: '#60A5FA', opacity: 0.7 }} />
            </div>
            <h3 className="text-base font-semibold mb-2" style={{ color: T.text }}>
                Nenhum membro na equipe
            </h3>
            <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: T.textMuted }}>
                Adicione corretores e gerentes para começar a gerenciar sua equipe comercial.
            </p>
            <button
                onClick={onAddFirst}
                className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
                style={{ background: T.accent }}
            >
                <Plus size={15} /> Adicionar Primeiro Membro
            </button>
        </motion.div>
    )
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────── */
const FILTER_TABS: FilterTab[] = [
    { id: 'all',      label: 'Todos' },
    { id: 'active',   label: 'Ativos' },
    { id: 'inactive', label: 'Inativos' },
    { id: 'broker',   label: 'Corretores' },
    { id: 'manager',  label: 'Gerentes' },
]

export default function EquipePage() {
    const [search, setSearch] = useState('')
    const [tab, setTab] = useState('all')

    const { brokers, isLoading, mutate } = useBrokers({
        search,
        status: tab === 'active' ? 'active' : tab === 'inactive' ? 'inactive' : 'all',
    })

    const filteredByRole = tab === 'broker'
        ? brokers.filter(b => b.role === 'broker')
        : tab === 'manager'
        ? brokers.filter(b => b.role === 'broker_manager')
        : brokers

    const activeCount   = brokers.filter(b => b.status === 'active').length
    const inactiveCount = brokers.filter(b => b.status === 'inactive').length
    const managerCount  = brokers.filter(b => b.role === 'broker_manager').length

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

    return (
        <div className="space-y-6">
            <PageIntelHeader
                moduleLabel="EQUIPE · RH"
                title="Equipe Comercial"
                subtitle="Gestão de corretores, gerentes e permissões"
                actions={
                    <Link
                        href="/backoffice/settings/corretores/novo"
                        className="flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
                        style={{ background: T.accent }}
                    >
                        <Plus size={15} /> Novo Membro
                    </Link>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPICard
                    label="Total Equipe"
                    value={brokers.length}
                    icon={<Users size={14} />}
                    accent="blue"
                    size="sm"
                />
                <KPICard
                    label="Ativos"
                    value={activeCount}
                    icon={<UserCheck size={14} />}
                    accent="green"
                    size="sm"
                    delta={brokers.length > 0 ? Math.round((activeCount / brokers.length) * 100) : 0}
                    deltaLabel="da equipe"
                />
                <KPICard
                    label="Inativos"
                    value={inactiveCount}
                    icon={<UserX size={14} />}
                    accent="hot"
                    size="sm"
                />
                <KPICard
                    label="Gerentes"
                    value={managerCount}
                    icon={<Crown size={14} />}
                    accent="ai"
                    size="sm"
                />
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-1 min-w-0">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: T.textMuted }}
                    />
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou CRECI..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 rounded-xl text-sm outline-none"
                        style={{
                            background: T.elevated,
                            border: `1px solid ${T.border}`,
                            color: T.text,
                        }}
                    />
                </div>
                <FilterTabs
                    tabs={FILTER_TABS}
                    active={tab}
                    onChange={setTab}
                />
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="rounded-2xl p-5 animate-pulse"
                            style={{ background: T.surface, border: `1px solid ${T.border}`, height: 200 }}
                        />
                    ))}
                </div>
            ) : filteredByRole.length === 0 ? (
                <EmptyEquipe onAddFirst={() => window.location.href = '/backoffice/settings/corretores/novo'} />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {filteredByRole.map((broker, i) => (
                            <BrokerCard
                                key={broker.id}
                                broker={broker}
                                index={i}
                                onToggleStatus={handleToggleStatus}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Footer: manage link */}
            {!isLoading && filteredByRole.length > 0 && (
                <div className="flex justify-end">
                    <Link
                        href="/backoffice/settings/corretores"
                        className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
                        style={{ color: T.textDim }}
                    >
                        Gerenciar corretores em Configurações
                        <ChevronRight size={13} />
                    </Link>
                </div>
            )}
        </div>
    )
}
