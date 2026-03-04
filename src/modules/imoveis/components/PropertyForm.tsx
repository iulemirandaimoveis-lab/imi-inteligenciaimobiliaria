'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sparkles, Loader2 } from 'lucide-react'
import { propertySchema, PropertyFormData } from '../validations'
import { Property } from '../types'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import MediaUploader from '@/components/ui/MediaUploader'

interface PropertyFormProps {
    property?: Property
    onSubmit: (data: PropertyFormData) => Promise<void>
    onCancel: () => void
    isSubmitting?: boolean
}

export default function PropertyForm({ property, onSubmit, onCancel, isSubmitting }: PropertyFormProps) {
    const supabase = createClient()
    const [developers, setDevelopers] = useState<Array<{ id: string; name: string }>>([])
    const [isGenerating, setIsGenerating] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<PropertyFormData>({
        resolver: zodResolver(propertySchema) as any,
        defaultValues: property ? {
            name: property.name,
            slug: property.slug,
            description: property.description || '',
            developer_id: property.developer_id || '',
            type: property.type,
            status: property.status,
            address: property.address,
            neighborhood: property.neighborhood,
            city: property.city,
            state: property.state,
            zipcode: property.zipcode || '',
            price_from: property.price_from,
            price_to: property.price_to,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            parking_spaces: property.parking_spaces,
            area_from: property.area_from,
            area_to: property.area_to,
            units: property.units,
            floors: property.floors,
            delivery: property.delivery || null,
            launch_date: property.launch_date || null,
            featured: !!property.featured,
            image: property.image || '',
            gallery_images: property.gallery_images || [],
            floor_plans: property.floor_plans || [],
            country: property.country || 'Brasil',
            region: property.region || 'paraiba',
            status_commercial: property.status_commercial || 'draft',
            target_audience: property.target_audience || '',
        } : {
            status: 'active',
            status_commercial: 'draft',
            type: 'apartment',
            country: 'Brasil',
            region: 'paraiba',
            featured: false,
            units: 1,
            image: '',
            gallery_images: [],
            floor_plans: [],
        },
    })

    useEffect(() => {
        fetchDevelopers()
    }, [])

    async function fetchDevelopers() {
        const { data } = await supabase
            .from('developers')
            .select('id, name')
            .eq('active', true)
            .order('name')

        if (data) setDevelopers(data)
    }

    // Auto-gerar slug a partir do nome
    const name = watch('name')
    useEffect(() => {
        if (name && !property) {
            const slug = name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
            setValue('slug', slug)
        }
    }, [name, property, setValue])

    async function handleGenerateAIDescription() {
        const values = watch()
        if (!values.name) {
            alert('Por favor, preencha o nome do empreendimento primeiro.')
            return
        }

        setIsGenerating(true)
        try {
            const response = await fetch('/api/ai/generate-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: values.name,
                    type: values.type,
                    neighborhood: values.neighborhood,
                    city: values.city,
                    features: [
                        values.bedrooms ? `${values.bedrooms} quartos` : '',
                        values.bathrooms ? `${values.bathrooms} banheiros` : '',
                        values.area_from ? `${values.area_from}m²` : '',
                    ].filter(Boolean)
                })
            })

            const data = await response.json()
            if (data.description) {
                setValue('description', data.description)
            }
        } catch (err) {
            console.error('IA Description fail:', err)
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <form onSubmit={handleSubmit((data) => onSubmit(data as unknown as PropertyFormData))} className="space-y-8">
            {/* Informações Básicas */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-imi-900 uppercase tracking-widest mb-6">Informações Básicas</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <Input
                        label="Nome do Empreendimento *"
                        {...register('name')}
                        error={errors.name?.message}
                    />

                    <Input
                        label="Slug (URL amigável) *"
                        {...register('slug')}
                        error={errors.slug?.message}
                    />

                    <Select
                        label="Construtora *"
                        {...register('developer_id')}
                        error={errors.developer_id?.message}
                        options={[
                            { value: '', label: 'Selecione...' },
                            ...developers.map(dev => ({ value: dev.id, label: dev.name }))
                        ]}
                    />

                    <Select
                        label="Tipo *"
                        {...register('type')}
                        error={errors.type?.message}
                        options={[
                            { value: 'apartment', label: 'Apartamento' },
                            { value: 'house', label: 'Casa' },
                            { value: 'penthouse', label: 'Cobertura' },
                            { value: 'studio', label: 'Studio' },
                            { value: 'land', label: 'Terreno' },
                            { value: 'commercial', label: 'Comercial' },
                            { value: 'resort', label: 'Resort/Hotel' },
                        ]}
                    />

                    <Select
                        label="Status Interno *"
                        {...register('status')}
                        error={errors.status?.message}
                        options={[
                            { value: 'active', label: 'Ativo' },
                            { value: 'inactive', label: 'Inativo' },
                            { value: 'pending', label: 'Pendente' },
                            { value: 'sold', label: 'Vendido' },
                        ]}
                    />

                    <Select
                        label="Status Comercial (Site) *"
                        {...register('status_commercial')}
                        error={errors.status_commercial?.message}
                        options={[
                            { value: 'draft', label: 'Rascunho (Oculto)' },
                            { value: 'published', label: 'Publicado' },
                            { value: 'campaign', label: 'Em Campanha' },
                            { value: 'private', label: 'Venda Privada' },
                            { value: 'sold', label: 'Vendido' },
                        ]}
                    />

                    <div className="md:col-span-2 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-imi-900 uppercase tracking-widest">Descrição *</label>
                            <button
                                type="button"
                                onClick={handleGenerateAIDescription}
                                disabled={isGenerating}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent-600 hover:text-accent-700 transition-colors bg-accent-50 px-3 py-1.5 rounded-lg border border-accent-100"
                            >
                                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                Gerar via Inteligência IA
                            </button>
                        </div>
                        <Textarea
                            {...register('description')}
                            error={errors.description?.message}
                            rows={6}
                        />
                    </div>
                </div>
            </div>

            {/* Localização */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-imi-900 uppercase tracking-widest mb-6">Localização</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <Input
                            label="Endereço *"
                            {...register('address')}
                            error={errors.address?.message}
                        />
                    </div>

                    <Input
                        label="Bairro *"
                        {...register('neighborhood')}
                        error={errors.neighborhood?.message}
                    />

                    <Input
                        label="Cidade *"
                        {...register('city')}
                        error={errors.city?.message}
                    />

                    <Input
                        label="Estado (UF) *"
                        {...register('state')}
                        error={errors.state?.message}
                        maxLength={2}
                        placeholder="PE"
                    />

                    <Input
                        label="País *"
                        {...register('country')}
                        error={errors.country?.message}
                        placeholder="Brasil"
                    />

                    <Select
                        label="Região Estratégica *"
                        {...register('region')}
                        error={errors.region?.message}
                        options={[
                            { value: 'paraiba', label: 'Paraíba' },
                            { value: 'pernambuco', label: 'Pernambuco' },
                            { value: 'sao-paulo', label: 'São Paulo' },
                            { value: 'dubai', label: 'Dubai (Internacional)' },
                            { value: 'usa', label: 'USA (Internacional)' },
                            { value: 'other', label: 'Outras Regiões' },
                        ]}
                    />

                    <Input
                        label="CEP"
                        {...register('zipcode')}
                        error={errors.zipcode?.message}
                        placeholder="00000-000"
                    />
                </div>
            </div>

            {/* Valores */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-imi-900 uppercase tracking-widest mb-6">Valores</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <Input
                        label="Preço A Partir De *"
                        type="number"
                        step="0.01"
                        {...register('price_from', { valueAsNumber: true })}
                        error={errors.price_from?.message}
                        placeholder="500000"
                    />

                    <Input
                        label="Preço Até"
                        type="number"
                        step="0.01"
                        {...register('price_to', {
                            setValueAs: (v) => v === '' ? null : Number(v)
                        })}
                        error={errors.price_to?.message}
                        placeholder="1000000"
                    />
                </div>
            </div>

            {/* Características */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-imi-900 uppercase tracking-widest mb-6">Características</h3>
                <div className="grid md:grid-cols-3 gap-6">
                    <Input
                        label="Quartos"
                        type="number"
                        {...register('bedrooms', {
                            setValueAs: (v) => v === '' ? null : Number(v)
                        })}
                        error={errors.bedrooms?.message}
                        min={0}
                    />

                    <Input
                        label="Banheiros"
                        type="number"
                        {...register('bathrooms', {
                            setValueAs: (v) => v === '' ? null : Number(v)
                        })}
                        error={errors.bathrooms?.message}
                        min={0}
                    />

                    <Input
                        label="Vagas de Garagem"
                        type="number"
                        {...register('parking_spaces', {
                            setValueAs: (v) => v === '' ? null : Number(v)
                        })}
                        error={errors.parking_spaces?.message}
                        min={0}
                    />

                    <Input
                        label="Área A Partir De (m²)"
                        type="number"
                        step="0.01"
                        {...register('area_from', {
                            setValueAs: (v) => v === '' ? null : Number(v)
                        })}
                        error={errors.area_from?.message}
                    />

                    <Input
                        label="Área Até (m²)"
                        type="number"
                        step="0.01"
                        {...register('area_to', {
                            setValueAs: (v) => v === '' ? null : Number(v)
                        })}
                        error={errors.area_to?.message}
                    />

                    <Input
                        label="Número de Unidades *"
                        type="number"
                        {...register('units', { valueAsNumber: true })}
                        error={errors.units?.message}
                        min={1}
                    />

                    <Input
                        label="Número de Andares"
                        type="number"
                        {...register('floors', {
                            setValueAs: (v) => v === '' ? null : Number(v)
                        })}
                        error={errors.floors?.message}
                        min={1}
                    />
                </div>
            </div>

            {/* Datas */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-imi-900 uppercase tracking-widest mb-6">Datas</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <Input
                        label="Previsão de Entrega"
                        type="month"
                        {...register('delivery')}
                        error={errors.delivery?.message}
                    />

                    <Input
                        label="Data de Lançamento"
                        type="date"
                        {...register('launch_date')}
                        error={errors.launch_date?.message}
                    />
                </div>
            </div>

            {/* Mídia e Público */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-8">
                <h3 className="text-sm font-bold text-imi-900 uppercase tracking-widest mb-6">Mídia e Público-Alvo</h3>

                <MediaUploader
                    label="Imagem Principal (Thumbnail)"
                    value={watch('image') ?? ''}
                    onChange={(url) => setValue('image', url as string)}
                    folder="properties/thumbnails"
                />

                <MediaUploader
                    label="Galeria de Fotos"
                    multiple
                    value={watch('gallery_images')}
                    onChange={(urls) => setValue('gallery_images', urls as string[])}
                    folder="properties/gallery"
                />

                <MediaUploader
                    label="Plantas Humanizadas"
                    multiple
                    value={watch('floor_plans')}
                    onChange={(urls) => setValue('floor_plans', urls as string[])}
                    folder="properties/floor-plans"
                />

                <div className="grid md:grid-cols-2 gap-6 pt-4">
                    <Input
                        label="Público-Alvo"
                        {...register('target_audience')}
                        error={errors.target_audience?.message}
                        placeholder="Ex: Investidores, Famílias..."
                    />
                </div>
            </div>

            {/* Destaque */}
            <div className="flex items-center gap-2 p-4 bg-imi-50 rounded-lg border border-imi-100">
                <input
                    type="checkbox"
                    id="featured"
                    {...register('featured')}
                    className="w-5 h-5 rounded border-imi-200 text-imi-900 focus:ring-imi-900/20"
                />
                <label htmlFor="featured" className="text-sm font-bold text-imi-900 uppercase tracking-widest cursor-pointer">
                    Marcar como destaque comercial
                </label>
            </div>

            {/* Ações */}
            <div className="flex gap-4 pt-6">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? 'Processando...' : (property ? 'Atualizar Dados' : 'Cadastrar Empreendimento')}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isSubmitting}>
                    Descartar Alterações
                </Button>
            </div>
        </form>
    )
}
