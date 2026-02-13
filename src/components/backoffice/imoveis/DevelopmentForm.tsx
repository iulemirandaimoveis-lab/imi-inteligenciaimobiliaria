'use client'

import { useState, useEffect } from 'react'
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

const schema = z.object({
    name: z.string().min(5, 'Nome deve ter pelo menos 5 caracteres'),
    developer_id: z.string().optional(),
    property_type: z.enum(['apartment', 'house', 'commercial', 'land', 'mixed']).optional(),
    status: z.enum(['launch', 'ready', 'under_construction']),
    price_min: z.coerce.number().min(0, 'Valor inválido'),

    // Specs maps to specs JSONB
    area_min: z.coerce.number().min(0, 'Área obrigatória'),
    area_max: z.coerce.number().optional(),
    bedrooms: z.coerce.number().int().min(0),
    bathrooms: z.coerce.number().int().min(0),
    parking_spots: z.coerce.number().int().min(0),

    city: z.string().min(2, 'Cidade obrigatória'),
    neighborhood: z.string().min(2, 'Bairro obrigatório'),
    address: z.string().optional(),
    description: z.string().optional(),
    selling_points: z.string().optional(), // Maps to features JSONB
})

type FormData = z.infer<typeof schema>

interface DevelopmentFormProps {
    initialData?: Development
    onSubmit: (data: any) => Promise<void>
    isSubmitting: boolean
}

export default function DevelopmentForm({ initialData, onSubmit, isSubmitting }: DevelopmentFormProps) {
    const { developers } = useDevelopers()
    const [activeTab, setActiveTab] = useState<'info' | 'location' | 'specs' | 'media'>('info')

    // Media States
    const [gallery, setGallery] = useState<string[]>(initialData?.images?.gallery || [])
    const [videos, setVideos] = useState<string[]>(initialData?.images?.videos || [])
    const [floorPlans, setFloorPlans] = useState<string[]>(initialData?.images?.floorPlans || [])

    // Update internal state if initialData changes (e.g. after save)
    useEffect(() => {
        if (initialData?.images) {
            setGallery(initialData.images.gallery || [])
            setVideos(initialData.images.videos || [])
            setFloorPlans(initialData.images.floorPlans || [])
        }
    }, [initialData])

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: initialData?.name || '',
            developer_id: initialData?.developer_id || '',
            property_type: (initialData?.property_type as any) || 'apartment',
            status: initialData?.status || 'launch',
            price_min: initialData?.price_from || 0, // Mapped from price_from

            // Map from specs
            area_min: initialData?.specs?.area || initialData?.specs?.area_min || 0,
            area_max: initialData?.specs?.area_max || 0,
            bedrooms: initialData?.specs?.bedrooms || 0,
            bathrooms: initialData?.specs?.bathrooms || 0,
            parking_spots: initialData?.specs?.parking_spots || 0,

            city: initialData?.city || 'João Pessoa',
            neighborhood: initialData?.neighborhood || '',
            address: initialData?.address || '',
            description: initialData?.description || '',
            selling_points: initialData?.features?.join(', ') || '',
        }
    })

    const handleFormSubmit = async (data: FormData) => {
        // Transform for API
        const features = typeof data.selling_points === 'string'
            ? data.selling_points.split(',').map(s => s.trim()).filter(Boolean)
            : []

        // Construct images object
        const images = {
            main: gallery.length > 0 ? gallery[0] : '', // Default main image to first gallery image
            gallery,
            videos,
            floorPlans
        }

        const apiData = {
            name: data.name,
            developer_id: data.developer_id || null,
            property_type: data.property_type,
            status: data.status,
            price_from: data.price_min, // Map back to price_from
            // price_to: ... (not in form yet)
            city: data.city,
            neighborhood: data.neighborhood,
            address: data.address,
            description: data.description,
            features: features,
            specs: {
                area: data.area_min, // legacy
                area_min: data.area_min,
                area_max: data.area_max,
                bedrooms: data.bedrooms,
                bathrooms: data.bathrooms,
                parking_spots: data.parking_spots
            },
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            parking_spaces: data.parking_spots,
            images: images, // Include images
            video_url: videos.length > 0 ? videos[0] : null, // Fallback for video_url column
            region: 'paraiba', // Default or add field
            state: 'PB' // Default or add field
        }

        await onSubmit(apiData)
    }

    const tabs = [
        { id: 'info', label: 'Informações', icon: Building2 },
        { id: 'location', label: 'Localização', icon: MapPin },
        { id: 'specs', label: 'Características', icon: LayoutDashboard },
        { id: 'media', label: 'Visual & Mídia', icon: ImageIcon },
    ]

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
            {/* Tabs Navigation */}
            <div className="flex border-b border-imi-100 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id
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
                                <Input {...register('name')} placeholder="Ex: Residencial Atlantis" error={errors.name?.message} className="h-14 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Tipo</label>
                                <select {...register('property_type')} className="w-full h-14 px-4 rounded-xl border border-imi-100 bg-white font-medium text-imi-700 focus:outline-none focus:ring-2 focus:ring-accent-500">
                                    <option value="apartment">Apartamento</option>
                                    <option value="house">Casa</option>
                                    <option value="commercial">Comercial</option>
                                    <option value="land">Terreno</option>
                                    <option value="mixed">Misto</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Construtora / Developer</label>
                            <select {...register('developer_id')} className="w-full h-14 px-4 rounded-xl border border-imi-100 bg-white font-medium text-imi-700 focus:outline-none focus:ring-2 focus:ring-accent-500">
                                <option value="">Selecione uma construtora...</option>
                                {developers?.map(dev => (
                                    <option key={dev.id} value={dev.id}>{dev.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Status Comercial</label>
                                <select {...register('status')} className="w-full h-14 px-4 rounded-xl border border-imi-100 bg-white font-medium text-imi-700 focus:outline-none focus:ring-2 focus:ring-accent-500">
                                    <option value="launch">Lançamento</option>
                                    <option value="under_construction">Em Obras</option>
                                    <option value="ready">Pronto</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Preço Base (R$)</label>
                                <Input type="number" {...register('price_min')} prefix="R$" placeholder="0,00" className="h-14 rounded-xl" />
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
                                <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Área Mín (m²)</label>
                                <Input type="number" {...register('area_min')} placeholder="0" error={errors.area_min?.message} className="h-14 rounded-xl" />
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
                                <Input type="number" {...register('parking_spots')} placeholder="0" className="h-14 rounded-xl" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Diferenciais / Features</label>
                            <Textarea {...register('selling_points')} rows={3} placeholder="Vista mar, Área de lazer completa..." className="rounded-xl" />
                        </div>
                    </div>
                )}

                {/* Media Tab */}
                {activeTab === 'media' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-300">
                        {initialData?.id ? (
                            <>
                                <div className="space-y-4">
                                    <MediaUploader
                                        type="gallery"
                                        label="Galeria de Imagens"
                                        description="Fotos de alta resolução do empreendimento. A primeira imagem será a capa."
                                        value={gallery}
                                        onChange={setGallery}
                                        developmentId={initialData.id}
                                        maxFiles={20}
                                    />
                                    {gallery.length > 0 && (
                                        <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100">
                                            <span className="font-bold">Nota:</span> A imagem #1 será usada como capa nos Cards do site.
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-imi-100 my-6"></div>

                                <MediaUploader
                                    type="floorplans"
                                    label="Plantas Baixas"
                                    description="Imagens das plantas das unidades."
                                    value={floorPlans}
                                    onChange={setFloorPlans}
                                    developmentId={initialData.id}
                                    maxFiles={10}
                                />

                                <div className="border-t border-imi-100 my-6"></div>

                                <MediaUploader
                                    type="videos"
                                    label="Vídeos"
                                    description="Vídeos promocionais ou tour virtual (MP4)."
                                    value={videos}
                                    onChange={setVideos}
                                    developmentId={initialData.id}
                                    maxFiles={3}
                                />
                            </>
                        ) : (
                            <div className="text-center py-20 bg-imi-50 rounded-xl border border-dashed border-imi-100">
                                <ImageIcon className="w-12 h-12 mx-auto text-imi-300 mb-4" />
                                <p className="text-imi-600 font-bold mb-2">Salve o empreendimento primeiro</p>
                                <p className="text-xs text-imi-400">O upload de mídia requer um registro salvo para criar as pastas.</p>
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
