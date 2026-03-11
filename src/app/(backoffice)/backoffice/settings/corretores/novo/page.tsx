'use client'

import React, { useState } from 'react'
import { UserPlus, Shield, CheckCircle, Smartphone, Mail, Key, User, CheckSquare } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createBroker, BrokerFormData } from '@/hooks/use-brokers'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'

const schema = z.object({
    name: z.string().min(3, 'Nome muito curto'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(10, 'Telefone inválido'),
    creci: z.string().min(4, 'CRECI inválido'),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirmação inválida'),
    status: z.enum(['active', 'inactive']),
    permissions: z.array(z.string()).min(1, 'Selecione pelo menos um módulo'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

const modules = [
    {
        category: 'Operação',
        items: [
            { id: 'imoveis', label: 'Imóveis' },
            { id: 'leads', label: 'Leads' },
            { id: 'pipeline', label: 'Pipeline' },
            { id: 'tracking', label: 'Tracking' },
        ]
    },
    {
        category: 'Marketing',
        items: [
            { id: 'conteudo', label: 'Conteúdo' },
            { id: 'campanhas', label: 'Campanhas' },
        ]
    },
    {
        category: 'Comercial',
        items: [
            { id: 'avaliacoes', label: 'Avaliações' },
            { id: 'credito', label: 'Crédito' },
            { id: 'consultorias', label: 'Consultorias' },
            { id: 'agenda', label: 'Agenda' },
        ]
    },
    {
        category: 'Sistema',
        items: [
            { id: 'relatorios', label: 'Relatórios' },
        ]
    }
]

export default function NovoCorretorPage() {
    const router = useRouter()
    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            status: 'active',
            permissions: ['dashboard'], // Dashboard is mandatory
        }
    })

    const selectedPermissions = watch('permissions') || []

    const togglePermission = (id: string) => {
        if (id === 'dashboard') return // Dashboard is locked

        const current = selectedPermissions
        if (current.includes(id)) {
            setValue('permissions', current.filter(p => p !== id))
        } else {
            setValue('permissions', [...current, id])
        }
    }

    const toggleCategory = (items: { id: string }[]) => {
        const itemIds = items.map(i => i.id)
        const allSelected = itemIds.every(id => selectedPermissions.includes(id))

        if (allSelected) {
            // Deselect all
            setValue('permissions', selectedPermissions.filter(p => !itemIds.includes(p)))
        } else {
            // Select all
            const newPermissions = Array.from(new Set([...selectedPermissions, ...itemIds]))
            setValue('permissions', newPermissions)
        }
    }

    const onSubmit = async (data: FormData) => {
        try {
            await createBroker(data as BrokerFormData)
            toast.success('Corretor cadastrado com sucesso!')
            router.push('/backoffice/settings/corretores')
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Erro ao criar corretor')
        }
    }

    const fieldStyle = { background: T.elevated, border: `1px solid ${T.border}`, color: T.text }

    return (
        <div className="space-y-6 pb-20 max-w-5xl mx-auto">
            <PageIntelHeader
                title="Cadastrar Novo Corretor"
                subtitle="Preencha os dados e defina as permissões de acesso"
                actions={
                    <button type="button" onClick={() => router.back()}
                        className="h-11 px-5 rounded-xl text-sm font-medium transition-all"
                        style={{ border: `1px solid ${T.border}`, color: T.textMuted, background: T.elevated }}>
                        Cancelar
                    </button>
                }
            />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Personal Data */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Dados Pessoais */}
                        <div className="rounded-2xl p-6" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <h2 className="text-sm font-bold mb-5" style={{ color: T.text }}>Dados Pessoais</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-xs font-semibold block" style={{ color: T.textMuted }}>Nome Completo *</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                                        <input type="text" placeholder="Ex: João da Silva" {...register('name')}
                                            className="w-full h-11 pl-9 pr-4 rounded-xl outline-none text-sm"
                                            style={fieldStyle} />
                                    </div>
                                    {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold block" style={{ color: T.textMuted }}>Email Corporativo *</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                                        <input type="email" placeholder="joao@imi.com.br" {...register('email')}
                                            className="w-full h-11 pl-9 pr-4 rounded-xl outline-none text-sm"
                                            style={fieldStyle} />
                                    </div>
                                    {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold block" style={{ color: T.textMuted }}>Telefone / WhatsApp *</label>
                                    <div className="relative">
                                        <Smartphone size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                                        <input type="text" placeholder="(11) 99999-9999" {...register('phone')}
                                            className="w-full h-11 pl-9 pr-4 rounded-xl outline-none text-sm"
                                            style={fieldStyle} />
                                    </div>
                                    {errors.phone && <p className="text-xs text-red-400">{errors.phone.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold block" style={{ color: T.textMuted }}>CRECI *</label>
                                    <div className="relative">
                                        <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                                        <input type="text" placeholder="12345-F" {...register('creci')}
                                            className="w-full h-11 pl-9 pr-4 rounded-xl outline-none text-sm"
                                            style={fieldStyle} />
                                    </div>
                                    {errors.creci && <p className="text-xs text-red-400">{errors.creci.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold block" style={{ color: T.textMuted }}>Status</label>
                                    <select {...register('status')}
                                        className="w-full h-11 px-4 rounded-xl outline-none text-sm"
                                        style={fieldStyle}>
                                        <option value="active">Ativo</option>
                                        <option value="inactive">Inativo</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Segurança */}
                        <div className="rounded-2xl p-6" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <h2 className="text-sm font-bold mb-5" style={{ color: T.text }}>Segurança</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold block" style={{ color: T.textMuted }}>Senha de Acesso *</label>
                                    <div className="relative">
                                        <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                                        <input type="password" placeholder="Mínimo 8 caracteres" {...register('password')}
                                            className="w-full h-11 pl-9 pr-4 rounded-xl outline-none text-sm"
                                            style={fieldStyle} />
                                    </div>
                                    {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold block" style={{ color: T.textMuted }}>Confirmar Senha *</label>
                                    <div className="relative">
                                        <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                                        <input type="password" placeholder="Repita a senha" {...register('confirmPassword')}
                                            className="w-full h-11 pl-9 pr-4 rounded-xl outline-none text-sm"
                                            style={fieldStyle} />
                                    </div>
                                    {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Permissions */}
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl overflow-hidden sticky top-6"
                            style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <div className="p-5" style={{ borderBottom: `1px solid ${T.border}` }}>
                                <h3 className="font-display font-bold text-lg flex items-center gap-2" style={{ color: T.text }}>
                                    <Shield size={20} style={{ color: T.accent }} /> Permissões
                                </h3>
                                <p className="text-xs mt-1" style={{ color: T.textMuted }}>Selecione os módulos que este corretor poderá acessar.</p>
                            </div>

                            <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                                {/* Mandatory Dashboard */}
                                <div className="p-4 rounded-xl flex items-center justify-between"
                                    style={{ background: `${T.accent}15`, border: `1px solid ${T.accent}30` }}>
                                    <span className="font-bold text-sm flex items-center gap-2" style={{ color: T.accent }}>
                                        <CheckCircle size={16} /> Dashboard
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Obrigatório</span>
                                </div>

                                {modules.map((module) => (
                                    <div key={module.category} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-black uppercase tracking-widest" style={{ color: T.textMuted }}>{module.category}</h4>
                                            <button
                                                type="button"
                                                onClick={() => toggleCategory(module.items)}
                                                className="text-[10px] font-bold hover:underline"
                                                style={{ color: T.accent }}
                                            >
                                                Inverter
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {module.items.map((item) => {
                                                const isSelected = selectedPermissions.includes(item.id)
                                                return (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => togglePermission(item.id)}
                                                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200"
                                                        style={{
                                                            background: isSelected ? `${T.accent}10` : T.elevated,
                                                            border: isSelected ? `1px solid ${T.accent}40` : `1px solid ${T.border}`,
                                                        }}
                                                    >
                                                        <div className="w-5 h-5 rounded-md flex items-center justify-center border transition-colors"
                                                            style={{
                                                                background: isSelected ? T.accent : 'transparent',
                                                                borderColor: isSelected ? T.accent : T.border,
                                                                color: '#fff',
                                                            }}>
                                                            {isSelected && <CheckSquare size={14} />}
                                                        </div>
                                                        <span className="text-sm font-medium"
                                                            style={{ color: isSelected ? T.text : T.textMuted }}>
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4" style={{ background: T.elevated, borderTop: `1px solid ${T.border}` }}>
                                <p className="text-xs text-center" style={{ color: T.textMuted }}>
                                    {selectedPermissions.length} módulos selecionados
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6" style={{ borderTop: `1px solid ${T.border}` }}>
                    <button type="button" onClick={() => router.back()}
                        className="h-11 px-6 rounded-xl text-sm font-medium transition-all"
                        style={{ border: `1px solid ${T.border}`, color: T.textMuted, background: 'transparent' }}>
                        Cancelar
                    </button>
                    <button type="submit" disabled={isSubmitting}
                        className="flex items-center gap-2 h-11 px-6 text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-60"
                        style={{ background: T.accent }}>
                        <UserPlus size={16} />
                        {isSubmitting ? 'Cadastrando...' : 'Cadastrar Corretor'}
                    </button>
                </div>
            </form>
        </div>
    )
}
