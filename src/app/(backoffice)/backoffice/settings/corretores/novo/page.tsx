'use client'

import React, { useState } from 'react'
import PageHeader from '@/components/backoffice/PageHeader'
import { UserPlus, Shield, CheckCircle, Smartphone, Mail, Lock, User, Square, Key, CheckSquare, ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createBroker, BrokerFormData } from '@/hooks/use-brokers'

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
                        <Card title="Dados Pessoais" icon={<User size={20} />} className="bg-white dark:bg-card-dark border-gray-100 dark:border-white/5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Nome Completo</label>
                                    <Input
                                        placeholder="Ex: João da Silva"
                                        {...register('name')}
                                        error={errors.name?.message}
                                        icon={<User size={18} />}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email Corporativo</label>
                                    <Input
                                        placeholder="joao@imi.com.br"
                                        {...register('email')}
                                        error={errors.email?.message}
                                        icon={<Mail size={18} />}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Telefone / WhatsApp</label>
                                    <Input
                                        placeholder="(11) 99999-9999"
                                        {...register('phone')}
                                        error={errors.phone?.message}
                                        icon={<Smartphone size={18} />}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">CRECI</label>
                                    <Input
                                        placeholder="12345-F"
                                        {...register('creci')}
                                        error={errors.creci?.message}
                                        icon={<Shield size={18} />}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Status</label>
                                    <select
                                        {...register('status')}
                                        className="w-full h-10 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-card-dark focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                    >
                                        <option value="active">Ativo</option>
                                        <option value="inactive">Inativo</option>
                                    </select>
                                </div>
                            </div>
                        </Card>

                        <Card title="Segurança" icon={<Lock size={20} />} className="bg-white dark:bg-card-dark border-gray-100 dark:border-white/5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Senha de Acesso</label>
                                    <Input
                                        type="password"
                                        placeholder="Mínimo 8 caracteres"
                                        {...register('password')}
                                        error={errors.password?.message}
                                        icon={<Key size={18} />}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Confirmar Senha</label>
                                    <Input
                                        type="password"
                                        placeholder="Repita a senha"
                                        {...register('confirmPassword')}
                                        error={errors.confirmPassword?.message}
                                        icon={<Key size={18} />}
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Permissions */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-card-dark rounded-3xl border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden sticky top-6">
                            <div className="p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-card-darker/50">
                                <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                    <Shield size={20} className="text-primary" /> Permissões
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Selecione os módulos que este corretor poderá acessar.</p>
                            </div>

                            <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                                {/* Mandatory Dashboard */}
                                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between">
                                    <span className="font-bold text-primary text-sm flex items-center gap-2">
                                        <CheckCircle size={16} /> Dashboard
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Obrigatório</span>
                                </div>

                                {modules.map((module) => (
                                    <div key={module.category} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">{module.category}</h4>
                                            <button
                                                type="button"
                                                onClick={() => toggleCategory(module.items)}
                                                className="text-[10px] text-primary hover:underline font-bold"
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
                                                        className={`
                                                            flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all duration-200
                                                            ${isSelected
                                                                ? 'bg-primary/5 border-primary/30 shadow-sm'
                                                                : 'bg-white dark:bg-card-dark border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20'
                                                            }
                                                        `}
                                                    >
                                                        <div className={`
                                                            w-5 h-5 rounded-md flex items-center justify-center border transition-colors
                                                            ${isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300 dark:border-white/20'}
                                                        `}>
                                                            {isSelected && <CheckSquare size={14} />}
                                                        </div>
                                                        <span className={`text-sm font-medium ${isSelected ? 'text-primary-dark' : 'text-gray-600 dark:text-gray-400'}`}>
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5">
                                <p className="text-xs text-center text-gray-500">
                                    {selectedPermissions.length} módulos selecionados
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-100 dark:border-white/5">
                    <Button variant="outline" type="button" onClick={() => router.back()}>Cancelar</Button>
                    <Button variant="primary" type="submit" loading={isSubmitting} icon={<UserPlus size={18} />}>
                        Cadastrar Corretor
                    </Button>
                </div>
            </form>
        </div>
    )
}
