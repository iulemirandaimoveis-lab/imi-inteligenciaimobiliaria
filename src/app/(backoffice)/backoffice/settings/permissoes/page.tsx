'use client'

import { useState } from 'react'
import {
    Shield,
    Save,
    RotateCcw,
    Eye,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'

type Perms = { view: boolean; create: boolean; edit: boolean; delete: boolean }
type PermChange = { role: string; module: string; action: string; allowed: boolean }

const initialRoles = [
    {
        id: 1,
        name: 'Admin',
        description: 'Acesso completo ao sistema',
        usuarios: 2,
        color: 'red',
        permissions: {
            leads: { view: true, create: true, edit: true, delete: true },
            imoveis: { view: true, create: true, edit: true, delete: true },
            avaliacoes: { view: true, create: true, edit: true, delete: true },
            campanhas: { view: true, create: true, edit: true, delete: true },
            financeiro: { view: true, create: true, edit: true, delete: true },
            relatorios: { view: true, create: true, edit: true, delete: true },
            settings: { view: true, create: true, edit: true, delete: true },
            equipe: { view: true, create: true, edit: true, delete: true },
        },
    },
    {
        id: 2,
        name: 'Gestor',
        description: 'Gestão de operações e equipe',
        usuarios: 3,
        color: 'orange',
        permissions: {
            leads: { view: true, create: true, edit: true, delete: false },
            imoveis: { view: true, create: true, edit: true, delete: false },
            avaliacoes: { view: true, create: true, edit: true, delete: false },
            campanhas: { view: true, create: true, edit: true, delete: false },
            financeiro: { view: true, create: false, edit: false, delete: false },
            relatorios: { view: true, create: true, edit: true, delete: false },
            settings: { view: true, create: false, edit: false, delete: false },
            equipe: { view: true, create: true, edit: true, delete: false },
        },
    },
    {
        id: 3,
        name: 'Corretor',
        description: 'Vendas e atendimento de leads',
        usuarios: 8,
        color: 'blue',
        permissions: {
            leads: { view: true, create: true, edit: true, delete: false },
            imoveis: { view: true, create: false, edit: false, delete: false },
            avaliacoes: { view: true, create: false, edit: false, delete: false },
            campanhas: { view: false, create: false, edit: false, delete: false },
            financeiro: { view: false, create: false, edit: false, delete: false },
            relatorios: { view: true, create: false, edit: false, delete: false },
            settings: { view: false, create: false, edit: false, delete: false },
            equipe: { view: true, create: false, edit: false, delete: false },
        },
    },
    {
        id: 4,
        name: 'Avaliador',
        description: 'Avaliações e laudos técnicos',
        usuarios: 2,
        color: 'purple',
        permissions: {
            leads: { view: true, create: false, edit: false, delete: false },
            imoveis: { view: true, create: false, edit: false, delete: false },
            avaliacoes: { view: true, create: true, edit: true, delete: false },
            campanhas: { view: false, create: false, edit: false, delete: false },
            financeiro: { view: false, create: false, edit: false, delete: false },
            relatorios: { view: true, create: false, edit: false, delete: false },
            settings: { view: false, create: false, edit: false, delete: false },
            equipe: { view: false, create: false, edit: false, delete: false },
        },
    },
    {
        id: 5,
        name: 'Marketing',
        description: 'Campanhas e conteúdo',
        usuarios: 2,
        color: 'green',
        permissions: {
            leads: { view: true, create: false, edit: false, delete: false },
            imoveis: { view: true, create: false, edit: false, delete: false },
            avaliacoes: { view: false, create: false, edit: false, delete: false },
            campanhas: { view: true, create: true, edit: true, delete: false },
            financeiro: { view: false, create: false, edit: false, delete: false },
            relatorios: { view: true, create: false, edit: false, delete: false },
            settings: { view: false, create: false, edit: false, delete: false },
            equipe: { view: false, create: false, edit: false, delete: false },
        },
    },
]

const modules = [
    { key: 'leads', label: 'Leads' },
    { key: 'imoveis', label: 'Imóveis' },
    { key: 'avaliacoes', label: 'Avaliações' },
    { key: 'campanhas', label: 'Campanhas' },
    { key: 'financeiro', label: 'Financeiro' },
    { key: 'relatorios', label: 'Relatórios' },
    { key: 'settings', label: 'Configurações' },
    { key: 'equipe', label: 'Equipe' },
]

const actions = [
    { key: 'view', label: 'Visualizar', icon: Eye },
    { key: 'create', label: 'Criar', icon: Edit },
    { key: 'edit', label: 'Editar', icon: Edit },
    { key: 'delete', label: 'Excluir', icon: Trash2 },
]

const getRoleAccentColor = (color: string) => {
    const colors: Record<string, string> = {
        red: 'rgba(239,68,68,0.15)',
        orange: 'rgba(249,115,22,0.15)',
        blue: 'rgba(59,130,246,0.15)',
        purple: 'rgba(168,85,247,0.15)',
        green: 'rgba(34,197,94,0.15)',
    }
    return colors[color] || colors.blue
}

const getRoleTextColor = (color: string) => {
    const colors: Record<string, string> = {
        red: '#f87171',
        orange: '#fb923c',
        blue: '#60a5fa',
        purple: '#c084fc',
        green: '#4ade80',
    }
    return colors[color] || colors.blue
}

export default function PermissoesPage() {
    const [roles, setRoles] = useState(initialRoles)
    const [selectedRoleId, setSelectedRoleId] = useState(initialRoles[0].id)
    const [pendingChanges, setPendingChanges] = useState<PermChange[]>([])
    const [saving, setSaving] = useState(false)

    const selectedRole = roles.find(r => r.id === selectedRoleId)!
    const hasChanges = pendingChanges.length > 0

    const handleToggle = (moduleKey: string, actionKey: string) => {
        const modulePerms = selectedRole.permissions[moduleKey as keyof typeof selectedRole.permissions] as Perms
        const currentValue = modulePerms[actionKey as keyof Perms]
        const newValue = !currentValue

        setRoles(prev => prev.map(role => {
            if (role.id !== selectedRoleId) return role
            return {
                ...role,
                permissions: {
                    ...role.permissions,
                    [moduleKey]: {
                        ...(role.permissions[moduleKey as keyof typeof role.permissions] as Perms),
                        [actionKey]: newValue,
                    }
                }
            }
        }))

        setPendingChanges(prev => {
            const filtered = prev.filter(
                c => !(c.role === selectedRole.name && c.module === moduleKey && c.action === actionKey)
            )
            return [...filtered, { role: selectedRole.name, module: moduleKey, action: actionKey, allowed: newValue }]
        })
    }

    const handleSave = async () => {
        if (saving || !hasChanges) return
        setSaving(true)
        try {
            const results = await Promise.allSettled(
                pendingChanges.map(change =>
                    fetch('/api/permissions', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(change),
                    })
                )
            )
            const failed = results.filter(r => r.status === 'rejected').length
            if (failed === 0) {
                toast.success(`${pendingChanges.length} permissão(ões) salva(s) com sucesso!`)
                setPendingChanges([])
            } else {
                toast.error(`${failed} permissão(ões) falharam ao salvar`)
            }
        } catch {
            toast.error('Erro ao salvar permissões')
        }
        setSaving(false)
    }

    const handleDiscard = () => {
        setRoles(JSON.parse(JSON.stringify(initialRoles)))
        setPendingChanges([])
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageIntelHeader
                moduleLabel="CONTROLE DE ACESSO"
                title="Permissões e Roles"
                subtitle={
                    hasChanges
                        ? `Gerencie permissões de acesso por função — ${pendingChanges.length} alteração(ões) pendente(s)`
                        : 'Gerencie permissões de acesso por função'
                }
                actions={
                    hasChanges ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDiscard}
                                disabled={saving}
                                className="flex items-center gap-2 h-11 px-5 rounded-xl font-medium transition-all hover:opacity-80 disabled:opacity-40"
                                style={{ border: `1px solid ${T.border}`, color: T.textMuted, background: 'transparent' }}
                            >
                                <RotateCcw size={15} />
                                Descartar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 h-11 px-5 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
                                style={{ background: 'var(--bo-accent)' }}
                            >
                                {saving
                                    ? <><Loader2 size={15} className="animate-spin" /> Salvando...</>
                                    : <><Save size={15} /> Salvar Alterações</>
                                }
                            </button>
                        </div>
                    ) : undefined
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Roles', value: roles.length },
                    { label: 'Total Usuários', value: roles.reduce((acc, r) => acc + r.usuarios, 0) },
                    { label: 'Módulos', value: modules.length },
                    { label: 'Ações', value: actions.length },
                ].map(stat => (
                    <div key={stat.label} className="rounded-2xl p-4" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>{stat.label}</p>
                        <p className="text-2xl font-bold" style={{ color: T.text }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                {/* Roles Sidebar */}
                <div className="lg:col-span-1">
                    <div className="rounded-2xl p-4 sticky top-6" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        <h2 className="text-[10px] font-bold uppercase tracking-wider mb-4" style={{ color: T.textMuted }}>
                            Roles do Sistema
                        </h2>
                        <div className="space-y-2">
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRoleId(role.id)}
                                    className="w-full text-left p-3 rounded-xl transition-all"
                                    style={{
                                        border: selectedRoleId === role.id
                                            ? `2px solid ${getRoleTextColor(role.color)}40`
                                            : `1px solid ${T.border}`,
                                        background: selectedRoleId === role.id ? getRoleAccentColor(role.color) : 'transparent',
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold text-sm" style={{ color: T.text }}>{role.name}</span>
                                        <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                                            style={{
                                                background: getRoleAccentColor(role.color),
                                                color: getRoleTextColor(role.color),
                                            }}>
                                            {role.usuarios}
                                        </span>
                                    </div>
                                    <p className="text-xs line-clamp-2" style={{ color: T.textMuted }}>{role.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Permissions Matrix */}
                <div className="lg:col-span-3">
                    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                        {/* Matrix Header */}
                        <div className="p-5" style={{ borderBottom: `1px solid ${T.border}`, background: T.elevated }}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: getRoleAccentColor(selectedRole.color) }}>
                                    <Shield size={20} style={{ color: getRoleTextColor(selectedRole.color) }} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold" style={{ color: T.text }}>{selectedRole.name}</h2>
                                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold"
                                            style={{
                                                background: getRoleAccentColor(selectedRole.color),
                                                color: getRoleTextColor(selectedRole.color),
                                            }}>
                                            {selectedRole.usuarios} usuários
                                        </span>
                                    </div>
                                    <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>{selectedRole.description}</p>
                                </div>
                            </div>
                            <p className="text-[11px] mt-2" style={{ color: T.textMuted }}>
                                Clique nos ícones para alternar permissões individualmente
                            </p>
                        </div>

                        {/* Matrix Table */}
                        <div className="overflow-x-auto" style={{ background: T.card ?? T.surface }}>
                            <table className="w-full">
                                <thead style={{ background: T.elevated, borderBottom: `1px solid ${T.border}` }}>
                                    <tr>
                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider w-44"
                                            style={{ color: T.textMuted }}>
                                            Módulo
                                        </th>
                                        {actions.map((action) => (
                                            <th key={action.key} className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider"
                                                style={{ color: T.textMuted }}>
                                                <div className="flex flex-col items-center gap-1">
                                                    <action.icon size={13} />
                                                    <span>{action.label}</span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {modules.map((module, idx) => {
                                        const perms = selectedRole.permissions[module.key as keyof typeof selectedRole.permissions] as Perms

                                        return (
                                            <tr key={module.key}
                                                style={{ borderTop: idx > 0 ? `1px solid ${T.border}` : undefined }}>
                                                <td className="px-5 py-4 text-sm font-medium" style={{ color: T.text }}>
                                                    {module.label}
                                                </td>
                                                {actions.map((action) => {
                                                    const hasPermission = perms[action.key as keyof Perms]
                                                    const isPending = pendingChanges.some(
                                                        c => c.role === selectedRole.name && c.module === module.key && c.action === action.key
                                                    )

                                                    return (
                                                        <td key={action.key} className="px-5 py-4 text-center">
                                                            <button
                                                                onClick={() => handleToggle(module.key, action.key)}
                                                                className="inline-flex items-center justify-center rounded-xl p-1.5 transition-all hover:opacity-70"
                                                                title={hasPermission ? 'Clique para revogar' : 'Clique para conceder'}
                                                                style={{
                                                                    outline: isPending ? '2px solid #fb923c' : 'none',
                                                                    outlineOffset: '2px',
                                                                    background: hasPermission ? 'rgba(52,211,153,0.08)' : 'transparent',
                                                                }}
                                                            >
                                                                {hasPermission ? (
                                                                    <CheckCircle size={19} style={{ color: '#34d399' }} />
                                                                ) : (
                                                                    <XCircle size={19} style={{ color: T.border }} />
                                                                )}
                                                            </button>
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Card */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(51,78,104,0.08)', border: '1px solid rgba(51,78,104,0.25)' }}>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#829AB1' }}>Sobre as Roles</p>
                <ul className="space-y-1.5 text-sm" style={{ color: T.textMuted }}>
                    <li><strong style={{ color: T.text }}>Admin:</strong> Acesso completo a todos os módulos</li>
                    <li><strong style={{ color: T.text }}>Gestor:</strong> Pode gerenciar operações mas não excluir dados críticos</li>
                    <li><strong style={{ color: T.text }}>Corretor:</strong> Foco em leads e vendas, acesso limitado a relatórios</li>
                    <li><strong style={{ color: T.text }}>Avaliador:</strong> Especializado em avaliações técnicas</li>
                    <li><strong style={{ color: T.text }}>Marketing:</strong> Gestão de campanhas e conteúdo</li>
                </ul>
            </div>
        </div>
    )
}
