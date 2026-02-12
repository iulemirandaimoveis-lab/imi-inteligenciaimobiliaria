'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Development } from '@/types/development'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { Loader2, Save, Building2, MapPin, DollarSign, LayoutDashboard, Image as ImageIcon } from 'lucide-react'
import MediaUploader from '@/components/backoffice/imoveis/MediaUploader'
import { useDevelopers } from '@/hooks/use-developers'

const { developers } = useDevelopers()

// Add developer_id to schema
const schema = z.object({
    title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
    developer_id: z.string().optional(),
    type: z.enum(['apartment', 'house', 'commercial', 'land', 'resort', 'penthouse', 'studio']),
    status_commercial: z.enum(['draft', 'published', 'campaign', 'sold', 'private']),
    price_from: z.coerce.number().min(0, 'Valor inválido'),
    area_from: z.coerce.number().min(1, 'Área obrigatória'),
    area_to: z.coerce.number().optional(),
    bedrooms: z.coerce.number().int().min(0),
    bathrooms: z.coerce.number().int().min(0),
    parking_spaces: z.coerce.number().int().min(0),
    city: z.string().min(2, 'Cidade obrigatória'),
    neighborhood: z.string().min(2, 'Bairro obrigatório'),
    address: z.string().optional(),
    description: z.string().optional(),
    selling_points: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface DevelopmentFormProps {
    initialData?: Development
    onSubmit: (data: FormData) => Promise<void>
    isSubmitting: boolean
}

export default function DevelopmentForm({ initialData, onSubmit, isSubmitting }: DevelopmentFormProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'location' | 'specs' | 'media'>('info')

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: initialData?.title || '',
            developer_id: initialData?.developer_id || '',
            type: initialData?.type || 'apartment',
            status_commercial: initialData?.status_commercial || 'draft',
            price_from: initialData?.price_from || 0,
            area_from: initialData?.area_from || 0,
            area_to: initialData?.area_to || 0,
            bedrooms: initialData?.bedrooms || 0,
            bathrooms: initialData?.bathrooms || 0,
            parking_spaces: initialData?.parking_spaces || 0,
            city: initialData?.city || 'João Pessoa',
            neighborhood: initialData?.neighborhood || '',
            description: initialData?.description || '',
            selling_points: initialData?.selling_points?.join(', ') || '',
        }
    })

    const handleFormSubmit = async (data: FormData) => {
        // Convert selling_points string to array if needed on submit
        if (typeof data.selling_points === 'string') {
            // @ts-ignore
            data.selling_points = data.selling_points.split(',').map(s => s.trim()).filter(Boolean)
        }
        await onSubmit(data)
    }

    const tabs = [
        { id: 'info', label: 'Informações Básicas', icon: Building2 },
        { id: 'location', label: 'Localização', icon: MapPin },
        { id: 'specs', label: 'Características', icon: LayoutDashboard },
        { id: 'media', label: 'Visual & Mídia', icon: ImageIcon },
    ]

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
            {/* Tabs Navigation */}
            <div className="flex border-b border-imi-100">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === tab.id
                            ? 'border-imi-900 text-imi-900'
                            : 'border-transparent text-imi-400 hover:text-imi-900'
                            }`}
                    >
                        <tab.icon size={18} />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-imi-50 shadow-soft">
                {/* Info Tab */}
                {activeTab === 'info' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Nome do Empreendimento</label>
                                <Input {...register('title')} placeholder="Ex: Residencial Atlantis" error={errors.title?.message} className="h-14 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Tipo</label>
                                <select {...register('type')} className="w-full h-14 px-4 rounded-xl border border-imi-100 bg-white font-medium text-imi-700 focus:outline-none focus:ring-2 focus:ring-accent-500">
                                    <option value="apartment">Apartamento</option>
                                    <option value="house">Casa</option>
                                    <option value="penthouse">Cobertura</option>
                                    <option value="commercial">Comercial</option>
                                    <option value="land">Terreno</option>
                                    <option value="resort">Resort</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Construtora / Developer</label>
                            <select {...register('developer_id')} className="w-full h-14 px-4 rounded-xl border border-imi-100 bg-white font-medium text-imi-700 focus:outline-none focus:ring-2 focus:ring-accent-500">
                                <option value="">Selecione uma construtora...</option>
                                <option value="imi">IMI - Inteligência Imobiliária (Padrão)</option>
                                {developers.map(dev => (
                                    <option key={dev.id} value={dev.id}>{dev.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Status Comercial</label>
                                <select {...register('status_commercial')} className="w-full h-14 px-4 rounded-xl border border-imi-100 bg-white font-medium text-imi-700 focus:outline-none focus:ring-2 focus:ring-accent-500">
                                    <option value="draft">Rascunho (Oculto)</option>
                                    <option value="published">Publicado</option>
                                    <option value="campaign">Em Campanha (Destaque)</option>
                                    <option value="sold">100% Vendido</option>
                                    <option value="private">Privado (Off-market)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Preço Base (R$)</label>
                                <Input type="number" {...register('price_from')} prefix="R$" placeholder="0,00" className="h-14 rounded-xl" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Descrição Comercial</label>
                            <Textarea {...register('description')} rows={5} placeholder="Descreva os diferenciais..." className="rounded-xl" />
                        </div>
                    </div>
                )}

                {/* Location Tab */}
                {activeTab === 'location' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Cidade</label>
                                <Input {...register('city')} placeholder="Ex: João Pessoa" error={errors.city?.message} className="h-14 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Bairro</label>
                                <Input {...register('neighborhood')} placeholder="Ex: Altiplano" error={errors.neighborhood?.message} className="h-14 rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Endereço Completo</label>
                            <Input {...register('address')} placeholder="Rua, Número, CEP..." className="h-14 rounded-xl" />
                        </div>
                    </div>
                )}

                {/* Specs Tab */}
                {activeTab === 'specs' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Área (m²)</label>
                                <Input type="number" {...register('area_from')} placeholder="0" error={errors.area_from?.message} className="h-14 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Quartos</label>
                                <Input type="number" {...register('bedrooms')} placeholder="0" className="h-14 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Banheiros</label>
                                <Input type="number" {...register('bathrooms')} placeholder="0" className="h-14 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Vagas</label>
                                <Input type="number" {...register('parking_spaces')} placeholder="0" className="h-14 rounded-xl" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Diferenciais (Separados por vírgula)</label>
                            <Textarea {...register('selling_points')} rows={3} placeholder="Vista mar, Área de lazer completa, Automação..." className="rounded-xl" />
                        </div>
                    </div>
                )}

                {/* Media Tab */}
                {activeTab === 'media' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                        {initialData?.id ? (
                            <MediaUploader
                                propertyId={initialData.id}
                                images={initialData.gallery_images || []}
                                floorPlans={initialData.floor_plans || []}
                                videos={initialData.videos || []}
                                virtualTourUrl={initialData.virtual_tour_url}
                                brochureUrl={initialData.brochure_url}
                                onUpdate={async (data) => {
                                    // Normally we would update via API here, but for this form we might need parent handler
                                    console.log('Media update:', data)
                                }}
                            />
                        ) : (
                            <div className="text-center py-20 bg-imi-50 rounded-xl border border-dashed border-imi-100">
                                <p className="text-imi-400 font-bold">Salve o empreendimento primeiro para gerenciar a mídia.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-imi-100">
                <Button type="submit" disabled={isSubmitting} className="h-14 px-10 bg-imi-900 text-white rounded-2xl shadow-elevated hover:bg-imi-800 transition-all active:scale-95 text-sm font-black uppercase tracking-widest">
                    {isSubmitting ? <Loader2 className="animate-spin mr-3" /> : <Save className="mr-3" size={18} />}
                    Salvar Alterações
                </Button>
            </div>
        </form>
    )
}
