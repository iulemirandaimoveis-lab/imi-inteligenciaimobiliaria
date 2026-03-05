'use client'

import React, { useState } from 'react'
import PageHeader from '@/components/backoffice/PageHeader'
import { UserPlus, Shield, CheckCircle, Smartphone, Mail, Lock, User, Square, Key, CheckSquare, ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardHeader } from '@/components/ui/Card'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createBroker, BrokerFormData } from '@/hooks/use-brokers'

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    hover: 'var(--bo-hover)',
    accent: 'var(--bo-accent)',
}

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

    return (
        <div className="space-y-8 animate-fade-in pb-20 max-w-5xl mx-auto">
            <PageHeader
                title="Cadastrar Novo Corretor"
                description="Preencha os dados e defina as permissões de acesso."
                breadcrumbs={[
                    { label: 'Configurações', href: '/backoffice/settings' },
                    { label: 'Corretores', href: '/backoffice/settings/corretores' },
                    { label: 'Novo' }
                ]}
            />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Personal Data */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <CardHeader title="Dados Pessoais" className="px-6 pt-6 pb-0" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-bold" style={{ color: T.text }}>Nome Completo</label>
                                    <Input
                                        placeholder="Ex: João da Silva"
                                        {...register('name')}
                                        error={errors.name?.message}
                                        leftIcon={<User size={18} />}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold" style={{ color: T.text }}>Email Corporativo</label>
                                    <Input
                                        placeholder="joao@imi.com.br"
                                        {...register('email')}
                                        error={errors.email?.message}
                                        leftIcon={<Mail size={18} />}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold" style={{ color: T.text }}>Telefone / WhatsApp</label>
                                    <Input
                                        placeholder="(11) 99999-9999"
                                        {...register('phone')}
                                        error={errors.phone?.message}
                                        leftIcon={<Smartphone size={18} />}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold" style={{ color: T.text }}>CRECI</label>
                                    <Input
                                        placeholder="12345-F"
                                        {...register('creci')}
                                        error={errors.creci?.message}
                                        leftIcon={<Shield size={18} />}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold" style={{ color: T.text }}>Status</label>
                                    <select
                                        {...register('status')}
                                        className="w-full h-10 px-4 rounded-xl outline-none transition-all appearance-none"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                                    >
                                        <option value="active">Ativo</option>
                                        <option value="inactive">Inativo</option>
                                    </select>
                                </div>
                            </div>
                        </Card>

                        <Card style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <CardHeader title="Segurança" className="px-6 pt-6 pb-0" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold" style={{ color: T.text }}>Senha de Acesso</label>
                                    <Input
                                        type="password"
                                        placeholder="Mínimo 8 caracteres"
                                        {...register('password')}
                                        error={errors.password?.message}
                                        leftIcon={<Key size={18} />}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold" style={{ color: T.text }}>Confirmar Senha</label>
                                    <Input
                                        type="password"
                                        placeholder="Repita a senha"
                                        {...register('confirmPassword')}
                                        error={errors.confirmPassword?.message}
                                        leftIcon={<Key size={18} />}
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Permissions */}
                    <div className="lg:col-span-1">
                        <div className="rounded-3xl overflow-hidden sticky top-6"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <div className="p-6" style={{ borderBottom: `1px solid ${T.border}`, background: T.elevated }}>
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

                <div className="flex justify-end gap-4 pt-6" style={{ borderTop: `1px solid ${T.border}` }}>
                    <Button variant="outline" type="button" onClick={() => router.back()}>Cancelar</Button>
                    <Button variant="primary" type="submit" loading={isSubmitting} icon={<UserPlus size={18} />}>
                        Cadastrar Corretor
                    </Button>
                </div>
            </form>
        </div>
    )
}
