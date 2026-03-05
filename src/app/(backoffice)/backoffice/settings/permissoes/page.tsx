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

const T = {
    bg: 'var(--bo-surface)',
    card: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    sub: 'var(--bo-text-muted)',
}

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

        // Update local UI state optimistically
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

        // Track change (upsert: replace previous if same role+module+action)
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
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: T.text }}>Permissões e Roles</h1>
                    <p className="text-sm mt-1" style={{ color: T.sub }}>
                        Gerencie permissões de acesso por função
                        {hasChanges && (
                            <span className="ml-2 text-xs font-semibold" style={{ color: '#fb923c' }}>
                                • {pendingChanges.length} alteração(ões) pendente(s)
                            </span>
                        )}
                    </p>
                </div>
                {hasChanges && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDiscard}
                            disabled={saving}
                            className="flex items-center gap-2 h-10 px-5 rounded-xl font-medium transition-all hover:opacity-80 disabled:opacity-40"
                            style={{ border: `1px solid ${T.border}`, color: T.text, background: 'transparent' }}
                        >
                            <RotateCcw size={16} />
                            Descartar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 h-10 px-5 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
                            style={{ background: 'var(--bo-accent)' }}
                        >
                            {saving
                                ? <><Loader2 size={16} className="animate-spin" /> Salvando...</>
                                : <><Save size={16} /> Salvar Alterações</>
                            }
                        </button>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Roles', value: roles.length },
                    { label: 'Total Usuários', value: roles.reduce((acc, r) => acc + r.usuarios, 0) },
                    { label: 'Módulos', value: modules.length },
                    { label: 'Ações', value: actions.length },
                ].map(stat => (
                    <div key={stat.label} className="rounded-xl p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                        <p className="text-xs mb-1" style={{ color: T.sub }}>{stat.label}</p>
                        <p className="text-2xl font-bold" style={{ color: T.text }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Roles Sidebar */}
                <div className="lg:col-span-1">
                    <div className="rounded-2xl p-4 sticky top-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                        <h2 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: T.sub }}>
                            Roles
                        </h2>
                        <div className="space-y-2">
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRoleId(role.id)}
                                    className="w-full text-left p-3 rounded-xl transition-all"
                                    style={{
                                        border: selectedRoleId === role.id
                                            ? '2px solid #334E68'
                                            : `1px solid ${T.border}`,
                                        background: selectedRoleId === role.id ? 'rgba(51,78,104,0.15)' : 'transparent',
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold text-sm" style={{ color: T.text }}>{role.name}</span>
                                        <span className="px-2 py-0.5 rounded text-xs font-medium"
                                            style={{
                                                background: getRoleAccentColor(role.color),
                                                color: getRoleTextColor(role.color),
                                            }}>
                                            {role.usuarios}
                                        </span>
                                    </div>
                                    <p className="text-xs line-clamp-2" style={{ color: T.sub }}>{role.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Permissions Matrix */}
                <div className="lg:col-span-3">
                    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                        {/* Matrix Header */}
                        <div className="p-6" style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
                            <div className="flex items-center gap-3 mb-2">
                                <Shield size={24} className="text-[var(--bo-accent)]" />
                                <h2 className="text-lg font-bold" style={{ color: T.text }}>{selectedRole.name}</h2>
                                <span className="px-3 py-1 rounded-lg text-xs font-medium"
                                    style={{
                                        background: getRoleAccentColor(selectedRole.color),
                                        color: getRoleTextColor(selectedRole.color),
                                    }}>
                                    {selectedRole.usuarios} usuários
                                </span>
                            </div>
                            <p className="text-sm" style={{ color: T.sub }}>{selectedRole.description}</p>
                            <p className="text-xs mt-2" style={{ color: T.sub }}>
                                Clique nos ícones para alternar permissões
                            </p>
                        </div>

                        {/* Matrix Table */}
                        <div className="overflow-x-auto" style={{ background: T.card }}>
                            <table className="w-full">
                                <thead style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider w-48"
                                            style={{ color: T.sub }}>
                                            Módulo
                                        </th>
                                        {actions.map((action) => (
                                            <th key={action.key} className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                                                style={{ color: T.sub }}>
                                                <div className="flex flex-col items-center gap-1">
                                                    <action.icon size={14} />
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
                                                <td className="px-6 py-4 text-sm font-medium" style={{ color: T.text }}>
                                                    {module.label}
                                                </td>
                                                {actions.map((action) => {
                                                    const hasPermission = perms[action.key as keyof Perms]
                                                    const isPending = pendingChanges.some(
                                                        c => c.role === selectedRole.name && c.module === module.key && c.action === action.key
                                                    )

                                                    return (
                                                        <td key={action.key} className="px-6 py-4 text-center">
                                                            <button
                                                                onClick={() => handleToggle(module.key, action.key)}
                                                                className="inline-flex items-center justify-center rounded-lg p-1 transition-all hover:opacity-70"
                                                                title={hasPermission ? 'Clique para revogar' : 'Clique para conceder'}
                                                                style={{
                                                                    outline: isPending ? '2px solid #fb923c' : 'none',
                                                                    outlineOffset: '2px',
                                                                }}
                                                            >
                                                                {hasPermission ? (
                                                                    <CheckCircle size={20} className="text-green-400" />
                                                                ) : (
                                                                    <XCircle size={20} style={{ color: T.border }} />
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
            <div className="rounded-xl p-6" style={{ background: 'rgba(51,78,104,0.1)', border: '1px solid rgba(51,78,104,0.3)' }}>
                <h3 className="text-sm font-bold text-[#829AB1] mb-2">💡 Sobre Permissões</h3>
                <ul className="space-y-1 text-sm" style={{ color: T.sub }}>
                    <li>• <strong style={{ color: T.text }}>Admin:</strong> Acesso completo a todos os módulos</li>
                    <li>• <strong style={{ color: T.text }}>Gestor:</strong> Pode gerenciar operações mas não pode excluir dados críticos</li>
                    <li>• <strong style={{ color: T.text }}>Corretor:</strong> Foco em leads e vendas, acesso limitado a relatórios</li>
                    <li>• <strong style={{ color: T.text }}>Avaliador:</strong> Especializado em avaliações técnicas</li>
                    <li>• <strong style={{ color: T.text }}>Marketing:</strong> Gestão de campanhas e conteúdo</li>
                </ul>
            </div>
        </div>
    )
}
