'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import PageHeader from '../../../components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { CardSkeleton } from '@/components/ui/EmptyState'
import { Save, X, AlertCircle } from 'lucide-react'
import { useDevelopments } from '@/hooks/use-developments'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const supabase = createClient()

export default function ImovelEditarPage() {
    const params = useParams()
    const router = useRouter()
    const { developments, isLoading } = useDevelopments()
    const development = developments?.find((dev: any) => dev.id === params.id)

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        property_type: '',
        neighborhood: '',
        city: '',
        state: '',
        zipcode: '',
        address: '',
        total_units: 0,
        price_min: 0,
        price_max: 0,
        status: 'draft',
    })

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showCancelModal, setShowCancelModal] = useState(false)

    // Atualizar formData quando development carregar
    useEffect(() => {
        if (development) {
            setFormData({
                name: development.name || '',
                description: development.description || '',
                property_type: development.property_type || development.type || '',
                neighborhood: development.neighborhood || '',
                city: development.city || '',
                state: development.state || '',
                zipcode: development.zipcode || '',
                address: development.address || '',
                total_units: development.total_units || 0,
                price_min: development.price_min || 0,
                price_max: development.price_max || 0,
                status: development.status || 'draft',
            })
        }
    }, [development])

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }))
        }
    }

    const validate = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório'
        if (!formData.property_type) newErrors.property_type = 'Tipo é obrigatório'
        if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória'
        if (!formData.state.trim()) newErrors.state = 'Estado é obrigatório'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validate()) {
            toast.error('Por favor, preencha os campos obrigatórios.')
            return
        }

        setIsSubmitting(true)

        try {
            const { error } = await supabase
                .from('developments')
                .update({
                    name: formData.name,
                    description: formData.description,
                    property_type: formData.property_type,
                    type: formData.property_type, // Sync both fields for compatibility
                    neighborhood: formData.neighborhood,
                    city: formData.city,
                    state: formData.state,
                    zipcode: formData.zipcode,
                    address: formData.address,
                    total_units: Number(formData.total_units),
                    price_min: Number(formData.price_min),
                    price_max: Number(formData.price_max),
                    status: formData.status,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', params.id)

            if (error) throw error

            toast.success('Imóvel atualizado com sucesso!')
            router.push(`/backoffice/imoveis/${params.id}`)
            router.refresh()
        } catch (error) {
            console.error('Erro ao atualizar:', error)
            toast.error('Erro ao salvar as alterações.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <CardSkeleton />
            </div>
        )
    }

    if (!development) {
        return (
            <div className="space-y-6">
                <PageHeader title="Imóvel não encontrado" />
                <Card>
                    <CardBody>
                        <p className="text-center text-imi-600 py-8 font-medium">
                            Este imóvel não existe ou foi removido.
                        </p>
                    </CardBody>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Editar Ativo: ${development.name}`}
                subtitle="Gerencie as informações fundamentais do empreendimento"
                breadcrumbs={[
                    { name: 'Dashboard', href: '/backoffice/dashboard' },
                    { name: 'Imóveis', href: '/backoffice/imoveis' },
                    { name: development.name, href: `/backoffice/imoveis/${development.id}` },
                    { name: 'Editar' },
                ]}
            />

            <form onSubmit={handleSubmit} className="space-y-6 pb-12">
                {/* Informações Básicas */}
                <Card>
                    <CardHeader
                        title="Sessão 01: Identidade e Conceito"
                        subtitle="Defina o nome, tipo e a narrativa de marketing do imóvel"
                    />
                    <CardBody>
                        <div className="space-y-8">
                            <Input
                                label="Nome do Empreendimento"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                error={errors.name}
                                placeholder="Ex: Atlantis Luxury Residence"
                            />

                            <Textarea
                                label="Memorial Descritivo / Marketing"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={6}
                                hint="Utilize gatilhos mentais e destaque os diferenciais do ativo"
                                placeholder="Descreva a experiência de viver neste imóvel..."
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Select
                                    label="Classificação de Ativo"
                                    name="property_type"
                                    value={formData.property_type}
                                    onChange={handleChange}
                                    error={errors.property_type}
                                    options={[
                                        { value: '', label: 'Selecione a tipologia' },
                                        { value: 'apartamento', label: 'Apartamento' },
                                        { value: 'casa', label: 'Casa' },
                                        { value: 'terreno', label: 'Terreno' },
                                        { value: 'comercial', label: 'Comercial' },
                                        { value: 'mansao', label: 'Mansão de Luxo' },
                                    ]}
                                />

                                <Input
                                    label="Estoque (Total de Unidades)"
                                    name="total_units"
                                    type="number"
                                    value={formData.total_units}
                                    onChange={handleChange}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Localização */}
                <Card>
                    <CardHeader
                        title="Sessão 02: Geolocalização"
                        subtitle="Endereço oficial e posicionamento estratégico"
                    />
                    <CardBody>
                        <div className="space-y-8">
                            <Input
                                label="Logradouro"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Rua, Número, Complemento"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <Input
                                    label="Bairro"
                                    name="neighborhood"
                                    value={formData.neighborhood}
                                    onChange={handleChange}
                                />

                                <Input
                                    label="Cidade"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    error={errors.city}
                                />

                                <Select
                                    label="Estado (UF)"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    error={errors.state}
                                    options={[
                                        { value: '', label: 'Selecione' },
                                        { value: 'PB', label: 'Paraíba' },
                                        { value: 'PE', label: 'Pernambuco' },
                                        { value: 'RN', label: 'Rio Grande do Norte' },
                                        { value: 'SP', label: 'São Paulo' },
                                        { value: 'FL', label: 'Flórida (EUA)' },
                                        { value: 'DXB', label: 'Dubai (UAE)' },
                                    ]}
                                />
                            </div>

                            <Input
                                label="CEP / Postal Code"
                                name="zipcode"
                                value={formData.zipcode}
                                onChange={handleChange}
                                placeholder="00.000-000"
                            />
                        </div>
                    </CardBody>
                </Card>

                {/* Valores */}
                <Card>
                    <CardHeader
                        title="Sessão 03: Disponibilidade e Precificação"
                        subtitle="Defina os parâmetros financeiros e visibilidade no ecossistema"
                    />
                    <CardBody>
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Input
                                    label="Preço Mínimo (Valor base)"
                                    name="price_min"
                                    type="number"
                                    value={formData.price_min}
                                    onChange={handleChange}
                                    leftIcon={<DollarSign size={18} className="text-green-600" />}
                                />

                                <Input
                                    label="Preço Máximo (Opcional)"
                                    name="price_max"
                                    type="number"
                                    value={formData.price_max}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="pt-4 border-t border-imi-50">
                                <p className="text-[10px] font-black text-imi-400 uppercase tracking-[0.2em] mb-4">Status de Governança</p>
                                <div className="flex flex-wrap gap-4">
                                    {['draft', 'published', 'archived'].map((status) => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, status }))}
                                            className={`
                        px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border-2 transition-all
                        ${formData.status === status
                                                    ? 'bg-imi-900 border-imi-900 text-white shadow-md scale-105'
                                                    : 'bg-white border-imi-100 text-imi-400 hover:border-imi-200'}
                      `}
                                        >
                                            {status === 'draft' ? 'Rascunho' : status === 'published' ? 'Publicado' : 'Arquivado'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardBody>

                    <CardFooter className="bg-imi-50/50">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowCancelModal(true)}
                            disabled={isSubmitting}
                            className="px-8 border-imi-200 text-imi-500 hover:text-imi-900"
                        >
                            Descartar
                        </Button>
                        <Button
                            type="submit"
                            loading={isSubmitting}
                            icon={<Save size={20} />}
                            className="px-12 shadow-glow"
                        >
                            Efetivar Alterações
                        </Button>
                    </CardFooter>
                </Card>
            </form>

            {/* Modal Cancelar */}
            <Modal
                open={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                size="sm"
            >
                <ModalHeader title="Interromper Edição?" />
                <ModalBody>
                    <div className="flex items-start gap-4 p-2">
                        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                            <AlertCircle size={24} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-base font-bold text-imi-900 mb-1">Há dados não salvos!</p>
                            <p className="text-sm text-imi-600 leading-relaxed">
                                As modificações efetuadas serão perdidas permanentemente caso você abandone esta página agora.
                            </p>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="outline" onClick={() => setShowCancelModal(false)} className="flex-1">
                        Continuar Editando
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => router.push(`/backoffice/imoveis/${params.id}`)}
                        className="flex-1"
                    >
                        Sim, Descartar
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}

function DollarSign({ size, className }: { size: number; className?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
    )
}
