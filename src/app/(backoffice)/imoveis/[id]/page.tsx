'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageHeader from '../../components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { CardSkeleton } from '@/components/ui/EmptyState'
import {
    Edit,
    Eye,
    Trash2,
    MoreVertical,
    MapPin,
    Home,
    Calendar,
    DollarSign,
    Image as ImageIcon,
    FileText,
    TrendingUp,
    Package,
} from 'lucide-react'
import { useDevelopments } from '@/hooks/use-developments'

export default function ImovelDetalhesPage() {
    const params = useParams()
    const router = useRouter()
    const { developments, isLoading } = useDevelopments()
    const [activeTab, setActiveTab] = useState<'detalhes' | 'midias' | 'unidades' | 'analytics' | 'eventos'>('detalhes')

    const development = developments?.find((dev: any) => dev.id === params.id)

    if (isLoading) {
        return (
            <div className="space-y-6">
                <CardSkeleton />
                <CardSkeleton />
            </div>
        )
    }

    if (!development) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Imóvel não encontrado"
                    breadcrumbs={[
                        { name: 'Dashboard', href: '/backoffice/dashboard' },
                        { name: 'Imóveis', href: '/backoffice/imoveis' },
                    ]}
                />
                <Card>
                    <CardBody>
                        <p className="text-center text-imi-600 py-8">
                            Este imóvel não existe ou foi removido.
                        </p>
                    </CardBody>
                </Card>
            </div>
        )
    }

    // Status badge variant
    const getStatusVariant = (status: string) => {
        const variants: Record<string, any> = {
            published: 'success',
            draft: 'warning',
            archived: 'neutral',
        }
        return (variants[status] || 'neutral') as any
    }

    const tabs = [
        { id: 'detalhes', label: 'Detalhes', icon: FileText },
        { id: 'midias', label: 'Mídias', icon: ImageIcon },
        { id: 'unidades', label: 'Unidades', icon: Package },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        { id: 'eventos', label: 'Eventos', icon: Calendar },
    ]

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title={development.name}
                subtitle={`${development.neighborhood || ''}${development.neighborhood && development.city ? ', ' : ''}${development.city || ''}`}
                breadcrumbs={[
                    { name: 'Dashboard', href: '/backoffice/dashboard' },
                    { name: 'Imóveis', href: '/backoffice/imoveis' },
                    { name: development.name },
                ]}
                action={
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            icon={<Eye size={20} />}
                            onClick={() => window.open(`/pt/imoveis/${development.slug}`, '_blank')}
                        >
                            Ver no Site
                        </Button>
                        <Button
                            icon={<Edit size={20} />}
                            onClick={() => router.push(`/backoffice/imoveis/${development.id}/editar`)}
                        >
                            Editar
                        </Button>
                        <Button variant="ghost" icon={<MoreVertical size={20} />} />
                    </div>
                }
            />

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardBody>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center">
                                <Home size={24} className="text-accent-700" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-imi-400 uppercase tracking-widest mb-1">Tipo</p>
                                <p className="text-base font-bold text-imi-950 truncate capitalize">
                                    {development.property_type || development.type || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Package size={24} className="text-blue-700" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-imi-400 uppercase tracking-widest mb-1">Unidades</p>
                                <p className="text-base font-bold text-imi-950 truncate">
                                    {development.total_units || 0}
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <DollarSign size={24} className="text-green-700" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-imi-400 uppercase tracking-widest mb-1">Preço Inicial</p>
                                <p className="text-base font-bold text-imi-950 truncate">
                                    {development.price_min
                                        ? `R$ ${(development.price_min / 1000).toLocaleString('pt-BR')}k`
                                        : 'Sob Consulta'
                                    }
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                <MapPin size={24} className="text-purple-700" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-imi-400 uppercase tracking-widest mb-1">Status</p>
                                <div className="flex">
                                    <Badge variant={getStatusVariant(development.status)}>
                                        {development.status === 'published' ? 'Publicado' :
                                            development.status === 'draft' ? 'Rascunho' :
                                                development.status === 'archived' ? 'Arquivado' :
                                                    development.status || 'N/A'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Tabs */}
            <div className="border-b border-imi-100">
                <nav className="flex gap-1 px-1 overflow-x-auto scrollbar-none">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const active = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-bold uppercase tracking-widest
                  border-b-2 transition-all duration-200 whitespace-nowrap
                  ${active
                                        ? 'border-accent-500 text-accent-700 bg-accent-50/50'
                                        : 'border-transparent text-imi-500 hover:text-imi-900 hover:bg-imi-50'
                                    }
                `}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="animate-fade-in">
                {activeTab === 'detalhes' && (
                    <Card>
                        <CardHeader title="Informações do Empreendimento" />
                        <CardBody>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-black text-imi-400 uppercase tracking-[0.2em] mb-2">Nome do Ativo</p>
                                        <p className="text-lg font-bold text-imi-900">{development.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-imi-400 uppercase tracking-[0.2em] mb-2">Geolocalização</p>
                                        <p className="text-lg font-bold text-imi-900">
                                            {development.neighborhood}, {development.city} - {development.state}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-black text-imi-400 uppercase tracking-[0.2em] mb-2">ID do Sistema</p>
                                        <code className="text-sm font-bold text-imi-500 bg-imi-50 px-2 py-1 rounded-md">{development.id}</code>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-imi-400 uppercase tracking-[0.2em] mb-2">Slug URL</p>
                                        <p className="text-sm font-bold text-accent-600">/imoveis/{development.slug}</p>
                                    </div>
                                </div>

                                {development.description && (
                                    <div className="md:col-span-2 pt-6 border-t border-imi-50">
                                        <p className="text-[10px] font-black text-imi-400 uppercase tracking-[0.2em] mb-4">Memorial Descritivo / Marketing</p>
                                        <p className="text-base text-imi-700 leading-relaxed max-w-4xl">
                                            {development.description}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                )}

                {activeTab === 'midias' && (
                    <Card>
                        <CardHeader
                            title="Galeria de Mídias"
                            subtitle="Imagens, Vídeos e Tours 360 do Empreendimento"
                            action={
                                <Button size="sm" icon={<ImageIcon size={16} />}>
                                    Adicionar Mídia
                                </Button>
                            }
                        />
                        <CardBody>
                            <div className="text-center py-20 bg-imi-50/50 rounded-3xl border-2 border-dashed border-imi-100">
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6">
                                    <ImageIcon size={32} className="text-imi-200" />
                                </div>
                                <h4 className="text-lg font-bold text-imi-900 mb-2">Central de Ativos Digitais</h4>
                                <p className="text-sm text-imi-500 max-w-sm mx-auto">
                                    Otimize a apresentação do seu imóvel com fotos profissionais e vídeos em alta resolução.
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {activeTab === 'unidades' && (
                    <Card>
                        <CardHeader
                            title="Tabela de Unidades"
                            subtitle="Estoque, Disponibilidade e Precificação Individual"
                            action={
                                <Button
                                    size="sm"
                                    onClick={() => router.push(`/backoffice/imoveis/${development.id}/unidades`)}
                                >
                                    Gerenciar Unidades
                                </Button>
                            }
                        />
                        <CardBody>
                            <div className="text-center py-20 bg-imi-50/50 rounded-3xl border-2 border-dashed border-imi-100">
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6">
                                    <Package size={32} className="text-imi-200" />
                                </div>
                                <h4 className="text-lg font-bold text-imi-900 mb-2">{development.total_units || 0} Unidades Estruturadas</h4>
                                <p className="text-sm text-imi-600 mb-8 max-w-sm mx-auto">
                                    Monitore o inventário real e a velocidade de vendas do empreendimento.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push(`/backoffice/imoveis/${development.id}/unidades`)}
                                >
                                    Ver Inventário Completo
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {activeTab === 'analytics' && (
                    <Card>
                        <CardHeader
                            title="Performance de Mercado"
                            subtitle="Visualizações, Cliques e Conversão de Leads"
                        />
                        <CardBody>
                            <div className="text-center py-20 bg-imi-50/50 rounded-3xl border-2 border-dashed border-imi-100">
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6">
                                    <TrendingUp size={32} className="text-imi-200" />
                                </div>
                                <h4 className="text-lg font-bold text-imi-900 mb-2">Monitoramento de Performance</h4>
                                <p className="text-sm text-imi-500 max-w-sm mx-auto">
                                    Em breve: Gráficos de comportamento do usuário e integração com GA4.
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {activeTab === 'eventos' && (
                    <Card>
                        <CardHeader title="Linha do Tempo de Gestão" subtitle="Histórico de alterações e eventos importantes" />
                        <CardBody>
                            <div className="text-center py-20 bg-imi-50/50 rounded-3xl border-2 border-dashed border-imi-100">
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6">
                                    <Calendar size={32} className="text-imi-200" />
                                </div>
                                <h4 className="text-lg font-bold text-imi-900 mb-2">Timeline do Ativo</h4>
                                <p className="text-sm text-imi-500 max-w-sm mx-auto">
                                    Acompanhe cada mudança de preço, status e atualizações de mídia.
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                )}
            </div>
        </div>
    )
}
