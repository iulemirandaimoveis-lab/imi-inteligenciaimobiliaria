'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Developer } from '@/hooks/use-developers'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { Loader2, Save, Building2, Globe, Mail, Phone, ImageIcon } from 'lucide-react'
import MediaUploader from '@/components/backoffice/imoveis/MediaUploader'

const schema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    description: z.string().optional(),
    website: z.string().url('URL inválida').optional().or(z.literal('')),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface DeveloperFormProps {
    initialData?: Developer
    onSubmit: (data: any) => Promise<void>
    isSubmitting: boolean
}

export default function DeveloperForm({ initialData, onSubmit, isSubmitting }: DeveloperFormProps) {
    const [logo, setLogo] = useState<string[]>(initialData?.logo_url ? [initialData.logo_url] : [])

    useEffect(() => {
        if (initialData?.logo_url) {
            setLogo([initialData.logo_url])
        }
    }, [initialData])

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            website: initialData?.website || '',
            email: initialData?.email || '',
            phone: initialData?.phone || '',
        }
    })

    const handleFormSubmit = async (data: FormData) => {
        const apiData = {
            ...data,
            logo_url: logo.length > 0 ? logo[0] : null
        }
        await onSubmit(apiData)
    }

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-imi-50 shadow-soft space-y-6">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-imi-900 mb-4">
                            <Building2 className="text-imi-400" />
                            Informações da Construtora
                        </h3>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Razão Social / Nome Fantasia</label>
                            <Input {...register('name')} placeholder="Ex: Moura Dubeux" error={errors.name?.message} className="h-14 rounded-xl" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Sobre a Construtora</label>
                            <Textarea {...register('description')} rows={4} placeholder="Histórico, diferenciais, etc..." className="rounded-xl" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-imi-400 uppercase tracking-widest flex items-center gap-1">
                                    <Globe size={12} /> Website
                                </label>
                                <Input {...register('website')} placeholder="https://..." error={errors.website?.message} className="h-14 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-imi-400 uppercase tracking-widest flex items-center gap-1">
                                    <Mail size={12} /> Email de Contato
                                </label>
                                <Input {...register('email')} placeholder="comercial@..." error={errors.email?.message} className="h-14 rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-imi-400 uppercase tracking-widest flex items-center gap-1">
                                <Phone size={12} /> Telefone / WhatsApp
                            </label>
                            <Input {...register('phone')} placeholder="(83) 9..." className="h-14 rounded-xl" />
                        </div>
                    </div>
                </div>

                {/* Right Column: Logo */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-imi-50 shadow-soft space-y-6">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-imi-900 mb-4">
                            <ImageIcon className="text-imi-400" />
                            Identidade Visual
                        </h3>

                        {initialData?.id ? (
                            <div className="space-y-4">
                                <MediaUploader
                                    type="logo"
                                    label="Logo da Construtora"
                                    description="Aparecerá nos cards dos imóveis."
                                    value={logo}
                                    onChange={setLogo}
                                    entityId={initialData.id}
                                    entityType="developer"
                                    maxFiles={1}
                                />
                                {logo.length > 0 && (
                                    <div className="p-4 bg-imi-50 rounded-xl border border-imi-100 text-center">
                                        <p className="text-xs text-imi-500 mb-2 font-bold uppercase tracking-widest">Preview</p>
                                        <div className="bg-white p-4 rounded-lg shadow-sm inline-block">
                                            <img src={logo[0]} alt="Logo Preview" className="h-16 object-contain" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-imi-50 rounded-xl border border-dashed border-imi-100">
                                <Building2 className="w-12 h-12 mx-auto text-imi-300 mb-4" />
                                <p className="text-imi-600 font-bold mb-2">Salve primeiro</p>
                                <p className="text-xs text-imi-400">O upload da logo requer que a construtora seja criada antes.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-imi-100">
                <Button type="submit" disabled={isSubmitting} className="h-14 px-10 bg-imi-900 text-white rounded-2xl shadow-elevated hover:bg-imi-800 transition-all active:scale-95 text-sm font-black uppercase tracking-widest">
                    {isSubmitting ? <Loader2 className="animate-spin mr-3" /> : <Save className="mr-3" size={18} />}
                    Salvar Construtora
                </Button>
            </div>
        </form>
    )
}
