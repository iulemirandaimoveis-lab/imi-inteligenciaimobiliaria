'use client'
import React, { useState, useEffect } from 'react'
import {
    UserPlus, Shield, CheckCircle, Smartphone, Mail, User, CheckSquare,
    Copy, Eye, EyeOff, ArrowLeft, Briefcase, Award, Loader2, Users
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'

const schema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('Email inválido'),
    phone: z.string().optional(),
    creci: z.string().optional(),
    role: z.enum(['broker', 'broker_manager']),
    status: z.enum(['active', 'inactive']),
    permissions: z.array(z.string()).min(1, 'Selecione pelo menos um módulo'),
    team_id: z.string().optional(),
    new_team_name: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Team {
    id: string
    name: string
    leader?: { name: string } | null
}

const ROLES = [
    { id: 'broker', label: 'Corretor', desc: 'Acesso aos módulos selecionados', icon: User },
    { id: 'broker_manager', label: 'Gerente', desc: 'Acesso total + gestão de equipe', icon: Briefcase },
] as const

const modules = [
    {
        category: 'Operação',
        items: [
            { id: 'imoveis', label: 'Imóveis', desc: 'Cadastro e gestão de imóveis' },
            { id: 'leads', label: 'Leads', desc: 'CRM e pipeline de vendas' },
            { id: 'tracking', label: 'Tracking', desc: 'QR codes e analytics' },
            { id: 'agenda', label: 'Agenda', desc: 'Calendário e visitas' },
        ]
    },
    {
        category: 'Comercial',
        items: [
            { id: 'avaliacoes', label: 'Avaliações', desc: 'Motor NBR 14653' },
            { id: 'contratos', label: 'Contratos', desc: 'Gestão de contratos' },
            { id: 'financeiro', label: 'Financeiro', desc: 'Transações e metas' },
            { id: 'consultorias', label: 'Consultorias', desc: 'Consultoria imobiliária' },
        ]
    },
    {
        category: 'Marketing',
        items: [
            { id: 'conteudo', label: 'Conteúdo', desc: 'Criação e publicação' },
            { id: 'campanhas', label: 'Campanhas', desc: 'Ads e campanhas' },
            { id: 'relatorios', label: 'Relatórios', desc: 'Dados e relatórios' },
        ]
    },
]

export default function NovoCorretorPage() {
    const router = useRouter()
    const [createdResult, setCreatedResult] = useState<{
        name: string; email: string; temp_password: string
    } | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [copied, setCopied] = useState(false)
    const [teams, setTeams] = useState<Team[]>([])
    const [loadingTeams, setLoadingTeams] = useState(true)

    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            role: 'broker',
            status: 'active',
            permissions: ['dashboard', 'imoveis', 'leads', 'agenda'],
            team_id: '',
        }
    })

    const selectedPermissions = watch('permissions') || []
    const selectedRole = watch('role')
    const selectedTeamId = watch('team_id')

    // Fetch active teams
    useEffect(() => {
        fetch('/api/teams')
            .then(r => r.json())
            .then(j => setTeams(j.data || []))
            .catch(() => setTeams([]))
            .finally(() => setLoadingTeams(false))
    }, [])

    // When switching to broker_manager, default to "create new team"
    useEffect(() => {
        if (selectedRole === 'broker_manager' && selectedTeamId === '') {
            setValue('team_id', 'new')
        } else if (selectedRole === 'broker' && selectedTeamId === 'new') {
            setValue('team_id', '')
        }
    }, [selectedRole, selectedTeamId, setValue])

    const togglePermission = (id: string) => {
        if (id === 'dashboard') return
        const current = selectedPermissions
        if (current.includes(id)) {
            setValue('permissions', current.filter(p => p !== id))
        } else {
            setValue('permissions', [...current, id])
        }
    }

    const selectAllPermissions = () => {
        const allIds = ['dashboard', ...modules.flatMap(m => m.items.map(i => i.id))]
        setValue('permissions', allIds)
    }

    const onSubmit = async (data: FormData) => {
        try {
            // 1. Create broker
            const res = await fetch('/api/brokers/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    creci: data.creci,
                    role: data.role,
                    status: data.status,
                    permissions: data.permissions,
                }),
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error || 'Erro ao cadastrar')

            const brokerId: string = result.id
            const brokerUserId: string = result.user_id

            // 2. Team assignment
            if (data.team_id === 'new' && data.role === 'broker_manager') {
                // Create new team with this manager as leader
                const teamName = data.new_team_name?.trim() || `Equipe ${data.name.split(' ')[0]}`
                const teamRes = await fetch('/api/teams', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: teamName, leader_id: brokerUserId }),
                })
                if (!teamRes.ok) {
                    const j = await teamRes.json()
                    toast.warning(`Membro criado, mas erro ao criar equipe: ${j.error}`)
                }
            } else if (data.team_id && data.team_id !== 'new' && data.team_id !== '') {
                // Add to existing team
                const memberRes = await fetch(`/api/teams/${data.team_id}/members`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        broker_id: brokerId,
                        role: data.role === 'broker_manager' ? 'leader' : 'member',
                    }),
                })
                if (!memberRes.ok) {
                    const j = await memberRes.json()
                    toast.warning(`Membro criado, mas erro ao assignar equipe: ${j.error}`)
                }
            }

            setCreatedResult({
                name: result.name,
                email: result.email,
                temp_password: result.temp_password,
            })
            toast.success(`${result.name} cadastrado com sucesso!`)
        } catch (error: unknown) {
            toast.error((error instanceof Error ? error.message : null) || 'Erro ao criar corretor')
        }
    }

    const handleCopy = () => {
        if (!createdResult) return
        const text = `Acesso IMI Backoffice\nEmail: ${createdResult.email}\nSenha provisória: ${createdResult.temp_password}\n\nAcesse: https://www.iulemirandaimoveis.com.br/login\nVocê será solicitado a alterar a senha no primeiro acesso.`
        navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success('Dados de acesso copiados!')
        setTimeout(() => setCopied(false), 3000)
    }

    const fieldStyle: React.CSSProperties = { background: T.elevated, border: `1px solid ${T.border}`, color: T.text }

    // ── SUCCESS STATE ──────────────────────────────────────────────
    if (createdResult) {
        return (
            <div className="space-y-6 pb-20 max-w-2xl mx-auto">
                <PageIntelHeader
                    moduleLabel="EQUIPE"
                    title="Corretor Cadastrado"
                    subtitle="Compartilhe os dados de acesso com o novo membro"
                />

                <div className="rounded-xl p-8 text-center space-y-6"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
                        style={{ background: `${T.success}15` }}>
                        <CheckCircle size={40} style={{ color: T.success }} />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold" style={{ color: T.text }}>{createdResult.name}</h2>
                        <p className="text-sm mt-1" style={{ color: T.textMuted }}>{createdResult.email}</p>
                    </div>

                    <div className="rounded-lg p-5 text-left space-y-4"
                        style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                            style={{ color: T.accent }}>
                            <Shield size={14} /> Dados de Acesso Provisório
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: T.textDim }}>Email</p>
                                <p className="text-sm font-mono" style={{ color: T.text }}>{createdResult.email}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: T.textDim }}>Senha Provisória</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-mono flex-1" style={{ color: T.text }}>
                                        {showPassword ? createdResult.temp_password : '••••••••••••'}
                                    </p>
                                    <button onClick={() => setShowPassword(!showPassword)}
                                        className="p-1.5 rounded hover:opacity-80" style={{ color: T.textMuted }}>
                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 rounded-lg text-xs"
                            style={{ background: `${T.warning}10`, border: `1px solid ${T.warning}30`, color: T.warning }}>
                            O usuário será solicitado a alterar a senha no primeiro acesso.
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={handleCopy}
                            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-lg text-sm font-semibold transition-all"
                            style={{ background: T.accent, color: '#0B1928' }}>
                            <Copy size={16} />
                            {copied ? 'Copiado!' : 'Copiar Dados de Acesso'}
                        </button>
                        <button onClick={() => router.push('/backoffice/equipe')}
                            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-lg text-sm font-medium transition-all"
                            style={{ border: `1px solid ${T.border}`, color: T.textMuted }}>
                            Ver Equipe
                        </button>
                    </div>

                    <button onClick={() => { setCreatedResult(null); setShowPassword(false) }}
                        className="text-xs font-medium hover:underline" style={{ color: T.accent }}>
                        + Cadastrar outro corretor
                    </button>
                </div>
            </div>
        )
    }

    // ── FORM STATE ─────────────────────────────────────────────────
    return (
        <div className="space-y-6 pb-20 max-w-5xl mx-auto">
            <PageIntelHeader
                moduleLabel="EQUIPE · CADASTRO"
                title="Novo Membro da Equipe"
                subtitle="O sistema gera uma senha provisória automaticamente. O usuário altera no primeiro acesso."
                breadcrumbs={[
                    { label: 'Equipe', href: '/backoffice/equipe' },
                    { label: 'Novo Membro' },
                ]}
                actions={
                    <button type="button" onClick={() => router.back()}
                        className="flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium transition-all"
                        style={{ border: `1px solid ${T.border}`, color: T.textMuted }}>
                        <ArrowLeft size={14} /> Voltar
                    </button>
                }
            />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Form Fields */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Dados Pessoais */}
                        <div className="rounded-xl p-6" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${T.accent}15` }}>
                                    <User size={16} style={{ color: T.accent }} />
                                </div>
                                <h2 className="text-sm font-bold" style={{ color: T.text }}>Dados Pessoais</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="sm:col-span-2 space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: T.textDim }}>Nome Completo *</label>
                                    <div className="relative">
                                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" style={{ color: T.textMuted }} />
                                        <input type="text" placeholder="Ex: João da Silva Santos" {...register('name')}
                                            className="w-full h-12 pl-10 pr-4 rounded-lg outline-none text-sm"
                                            style={fieldStyle} />
                                    </div>
                                    {errors.name && <p className="text-xs" style={{ color: T.error }}>{errors.name.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: T.textDim }}>Email Corporativo *</label>
                                    <div className="relative">
                                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" style={{ color: T.textMuted }} />
                                        <input type="email" placeholder="nome@imi.com" {...register('email')}
                                            className="w-full h-12 pl-10 pr-4 rounded-lg outline-none text-sm"
                                            style={fieldStyle} />
                                    </div>
                                    {errors.email && <p className="text-xs" style={{ color: T.error }}>{errors.email.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: T.textDim }}>Telefone / WhatsApp</label>
                                    <div className="relative">
                                        <Smartphone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" style={{ color: T.textMuted }} />
                                        <input type="text" placeholder="(83) 99999-9999" {...register('phone')}
                                            className="w-full h-12 pl-10 pr-4 rounded-lg outline-none text-sm"
                                            style={fieldStyle} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: T.textDim }}>CRECI</label>
                                    <div className="relative">
                                        <Award size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" style={{ color: T.textMuted }} />
                                        <input type="text" placeholder="12345-F" {...register('creci')}
                                            className="w-full h-12 pl-10 pr-4 rounded-lg outline-none text-sm"
                                            style={fieldStyle} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: T.textDim }}>Status</label>
                                    <select {...register('status')}
                                        className="w-full h-12 px-4 rounded-lg outline-none text-sm"
                                        style={fieldStyle}>
                                        <option value="active">Ativo</option>
                                        <option value="inactive">Inativo</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Cargo */}
                        <div className="rounded-xl p-6" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${T.accent}15` }}>
                                    <Briefcase size={16} style={{ color: T.accent }} />
                                </div>
                                <h2 className="text-sm font-bold" style={{ color: T.text }}>Cargo</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {ROLES.map(({ id, label, desc, icon: Icon }) => {
                                    const isSelected = selectedRole === id
                                    return (
                                        <label key={id}
                                            className="flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all"
                                            style={{
                                                background: isSelected ? `${T.accent}10` : T.surface,
                                                border: isSelected ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
                                            }}>
                                            <input type="radio" value={id} {...register('role')} className="sr-only" />
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                                style={{ background: isSelected ? `${T.accent}20` : T.hover }}>
                                                <Icon size={18} style={{ color: isSelected ? T.accent : T.textMuted }} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold" style={{ color: isSelected ? T.text : T.textMuted }}>{label}</p>
                                                <p className="text-xs mt-0.5" style={{ color: T.textDim }}>{desc}</p>
                                            </div>
                                        </label>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Equipe */}
                        <div className="rounded-xl p-6" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <div className="flex items-center gap-2 mb-5">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${T.accent}15` }}>
                                    <Users size={16} style={{ color: T.accent }} />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold" style={{ color: T.text }}>Equipe</h2>
                                    <p className="text-[11px] mt-0.5" style={{ color: T.textDim }}>
                                        {selectedRole === 'broker_manager'
                                            ? 'Gerentes podem liderar uma equipe existente ou criar uma nova'
                                            : 'Opcional — associe o corretor a uma equipe'}
                                    </p>
                                </div>
                            </div>

                            {loadingTeams ? (
                                <div className="h-12 rounded-lg animate-pulse" style={{ background: T.surface }} />
                            ) : (
                                <div className="space-y-3">
                                    <select
                                        {...register('team_id')}
                                        className="w-full h-12 px-4 rounded-lg outline-none text-sm"
                                        style={fieldStyle}
                                    >
                                        <option value="">Sem equipe</option>
                                        {teams.map(t => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}{t.leader ? ` — Gestor: ${t.leader.name}` : ''}
                                            </option>
                                        ))}
                                        {selectedRole === 'broker_manager' && (
                                            <option value="new">✦ Criar nova equipe</option>
                                        )}
                                    </select>

                                    {selectedTeamId === 'new' && selectedRole === 'broker_manager' && (
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: T.textDim }}>
                                                Nome da Nova Equipe
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ex: Equipe Alpha, Equipe Centro..."
                                                {...register('new_team_name')}
                                                className="w-full h-12 px-4 rounded-lg outline-none text-sm"
                                                style={fieldStyle}
                                            />
                                            <p className="text-[10px]" style={{ color: T.textDim }}>
                                                Deixe em branco para usar &quot;Equipe {'{nome}'}&quot; automaticamente
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Password info */}
                        <div className="rounded-xl p-5 flex items-start gap-3"
                            style={{ background: `${T.info}08`, border: `1px solid ${T.info}20` }}>
                            <Shield size={18} className="flex-shrink-0 mt-0.5" style={{ color: T.info }} />
                            <div>
                                <p className="text-sm font-semibold" style={{ color: T.text }}>Senha gerada automaticamente</p>
                                <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                                    O sistema gera uma senha provisória de 12 caracteres. Após o cadastro, você verá a senha
                                    para compartilhar com o corretor. Ele deverá alterá-la no primeiro acesso ao backoffice.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Permissions */}
                    <div className="lg:col-span-1">
                        <div className="rounded-xl overflow-hidden sticky top-20"
                            style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <div className="p-5" style={{ borderBottom: `1px solid ${T.border}` }}>
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: T.text }}>
                                        <Shield size={16} style={{ color: T.accent }} /> Permissões
                                    </h3>
                                    <button type="button" onClick={selectAllPermissions}
                                        className="text-[10px] font-bold uppercase tracking-wider hover:underline"
                                        style={{ color: T.accent }}>
                                        Selecionar Todos
                                    </button>
                                </div>
                                <p className="text-xs mt-1" style={{ color: T.textDim }}>
                                    Módulos que este membro poderá acessar
                                </p>
                            </div>

                            <div className="p-5 space-y-5 max-h-[500px] overflow-y-auto">
                                {/* Dashboard locked */}
                                <div className="p-3.5 rounded-lg flex items-center justify-between"
                                    style={{ background: `${T.accent}10`, border: `1px solid ${T.accent}25` }}>
                                    <span className="font-semibold text-sm flex items-center gap-2" style={{ color: T.accent }}>
                                        <CheckCircle size={14} /> Dashboard
                                    </span>
                                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: T.textDim }}>Obrigatório</span>
                                </div>

                                {modules.map((mod) => (
                                    <div key={mod.category} className="space-y-2.5">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: T.textDim }}>
                                            {mod.category}
                                        </h4>
                                        {mod.items.map((item) => {
                                            const isSelected = selectedPermissions.includes(item.id)
                                            return (
                                                <div key={item.id} onClick={() => togglePermission(item.id)}
                                                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
                                                    style={{
                                                        background: isSelected ? `${T.accent}08` : 'transparent',
                                                        border: isSelected ? `1px solid ${T.accent}30` : `1px solid ${T.border}`,
                                                    }}>
                                                    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                                                        style={{
                                                            background: isSelected ? T.accent : 'transparent',
                                                            border: `1.5px solid ${isSelected ? T.accent : T.border}`,
                                                        }}>
                                                        {isSelected && <CheckSquare size={12} style={{ color: '#0B1928' }} />}
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium block" style={{ color: isSelected ? T.text : T.textMuted }}>
                                                            {item.label}
                                                        </span>
                                                        <span className="text-[10px]" style={{ color: T.textDim }}>{item.desc}</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 text-center" style={{ borderTop: `1px solid ${T.border}` }}>
                                <p className="text-xs font-mono" style={{ color: T.textDim }}>
                                    {selectedPermissions.length} módulos selecionados
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6"
                    style={{ borderTop: `1px solid ${T.border}` }}>
                    <button type="button" onClick={() => router.back()}
                        className="h-12 px-6 rounded-lg text-sm font-medium transition-all"
                        style={{ border: `1px solid ${T.border}`, color: T.textMuted }}>
                        Cancelar
                    </button>
                    <button type="submit" disabled={isSubmitting}
                        className="flex items-center justify-center gap-2 h-12 px-8 rounded-lg text-sm font-bold transition-all disabled:opacity-60"
                        style={{ background: T.accent, color: '#0B1928' }}>
                        {isSubmitting ? (
                            <><Loader2 size={16} className="animate-spin" /> Cadastrando...</>
                        ) : (
                            <><UserPlus size={16} /> Cadastrar Membro</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
