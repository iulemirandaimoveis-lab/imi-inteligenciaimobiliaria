'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useDevelopers } from '@/hooks/use-developers'
import Wizard from '@/components/ui/Wizard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Card from '@/components/ui/Card'
import { ArrowRight, ArrowLeft, Save, Building2, MapPin, LayoutDashboard } from 'lucide-react'

// Schema - Unified
const schema = z.object({
    // Step 1
    name: z.string().min(5, 'Nome deve ter pelo menos 5 caracteres'),
    developer_id: z.string().optional(),
    property_type: z.enum(['apartment', 'house', 'commercial', 'land', 'mixed']),
    status: z.enum(['launch', 'ready', 'under_construction']),
    price_min: z.coerce.number().min(0, 'Valor inválido'),

    // Step 2
    city: z.string().min(2, 'Cidade obrigatória'),
    neighborhood: z.string().min(2, 'Bairro obrigatório'),
    address: z.string().optional(),
    area_min: z.coerce.number().min(1, 'Área obrigatória'),
    bedrooms: z.coerce.number().int().min(0),
    bathrooms: z.coerce.number().int().min(0),
    parking_spots: z.coerce.number().int().min(0),

    // Step 3
    description: z.string().optional(),
    selling_points: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface PropertyWizardProps {
    onSubmit: (data: any) => Promise<void>
    isSubmitting: boolean
}

export default function PropertyWizard({ onSubmit, isSubmitting }: PropertyWizardProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const { developers } = useDevelopers()

    const { register, handleSubmit, trigger, formState: { errors, isValid } } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        defaultValues: {
            property_type: 'apartment',
            status: 'launch',
            city: 'João Pessoa'
        }
    })

    const steps = [
        { id: 'info', title: 'Informações Básicas' },
        { id: 'specs', title: 'Localização e Medidas' },
        { id: 'details', title: 'Detalhes Finais' },
    ]

    const handleNext = async () => {
        let fieldsToValidate: (keyof FormData)[] = []

        if (currentStep === 0) {
            fieldsToValidate = ['name', 'developer_id', 'property_type', 'status', 'price_min']
        } else if (currentStep === 1) {
            fieldsToValidate = ['city', 'neighborhood', 'address', 'area_min', 'bedrooms', 'bathrooms', 'parking_spots']
        }

        const isStepValid = await trigger(fieldsToValidate)
        if (isStepValid) {
            setCurrentStep(prev => prev + 1)
        }
    }

    const handleBack = () => {
        setCurrentStep(prev => prev - 1)
    }

    const onFinalSubmit = async (data: FormData) => {
        // Transform for API
        const features = typeof data.selling_points === 'string'
            ? data.selling_points.split(',').map(s => s.trim()).filter(Boolean)
            : []

        const apiData = {
            name: data.name,
            developer_id: data.developer_id,
            property_type: data.property_type,
            status: data.status,
            price_min: data.price_min,
            city: data.city,
            neighborhood: data.neighborhood,
            address: data.address,
            description: data.description,
            features: features,
            specs: {
                area: data.area_min,
                bedrooms: data.bedrooms,
                bathrooms: data.bathrooms,
                parking_spots: data.parking_spots
            }
        }
        await onSubmit(apiData)
    }

    return (
        <div className="w-full">
            <Wizard steps={steps} currentStep={currentStep} />

            <form onSubmit={handleSubmit(onFinalSubmit)} className="mt-8">
                <Card variant="default" padding="lg">
                    {/* Step 1: Info */}
                    {currentStep === 0 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Nome do Empreendimento" {...register('name')} placeholder="Ex: Residencial Atlantis" error={errors.name?.message} />

                                <Select
                                    label="Construtora"
                                    {...register('developer_id')}
                                    error={errors.developer_id?.message}
                                    options={[
                                        { value: '', label: 'Selecione...' },
                                        ...(developers?.map(dev => ({ value: dev.id, label: dev.name })) || [])
                                    ]}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Select
                                    label="Tipo"
                                    {...register('property_type')}
                                    error={errors.property_type?.message}
                                    options={[
                                        { value: 'apartment', label: 'Apartamento' },
                                        { value: 'house', label: 'Casa' },
                                        { value: 'commercial', label: 'Comercial' },
                                        { value: 'land', label: 'Terreno' }
                                    ]}
                                />

                                <Select
                                    label="Status da Obra"
                                    {...register('status')}
                                    error={errors.status?.message}
                                    options={[
                                        { value: 'launch', label: 'Lançamento' },
                                        { value: 'under_construction', label: 'Em Obras' },
                                        { value: 'ready', label: 'Pronto' }
                                    ]}
                                />

                                <Input label="Preço Base (R$)" type="number" {...register('price_min')} placeholder="0,00" error={errors.price_min?.message} />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Specs */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Cidade" {...register('city')} placeholder="Ex: João Pessoa" error={errors.city?.message} />
                                <Input label="Bairro" {...register('neighborhood')} placeholder="Ex: Altiplano" error={errors.neighborhood?.message} />
                            </div>
                            <Input label="Endereço Completo" {...register('address')} placeholder="Rua, Número..." />

                            <div className="h-px bg-gray-100 dark:bg-white/10 my-4" />

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <Input label="Área (m²)" type="number" {...register('area_min')} placeholder="0" error={errors.area_min?.message} />
                                <Input label="Quartos" type="number" {...register('bedrooms')} placeholder="0" />
                                <Input label="Banheiros" type="number" {...register('bathrooms')} placeholder="0" />
                                <Input label="Vagas" type="number" {...register('parking_spots')} placeholder="0" />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Details */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <Textarea label="Descrição Comercial" {...register('description')} rows={6} placeholder="Descreva os diferenciais, localização privilegiada, acabamentos..." />

                            <Textarea label="Diferenciais (separados por vírgula)" {...register('selling_points')} rows={3} placeholder="Vista mar, Área de lazer, Perto de escola..." />

                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20 text-sm text-blue-600 dark:text-blue-400">
                                <p className="font-bold mb-1">Próximo Passo: Mídia</p>
                                <p>Após salvar os dados iniciais, você será redirecionado para a tela de edição onde poderá fazer o upload de fotos, vídeos e plantas.</p>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Actions */}
                <div className="flex justify-between mt-8">
                    {currentStep > 0 ? (
                        <Button type="button" variant="outline" onClick={handleBack} icon={<ArrowLeft size={18} />}>
                            Voltar
                        </Button>
                    ) : (
                        <div /> // Spacer
                    )}

                    {currentStep < steps.length - 1 ? (
                        <Button type="button" onClick={handleNext} icon={<ArrowRight size={18} />} className="flex-row-reverse">
                            Próximo
                        </Button>
                    ) : (
                        <Button type="submit" loading={isSubmitting} icon={<Save size={18} />}>
                            Finalizar Cadastro
                        </Button>
                    )}
                </div>
            </form>
        </div>
    )
}
