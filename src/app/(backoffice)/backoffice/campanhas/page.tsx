'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '../../components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge, KPICard } from '@/components/ui/Badge'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import {
    Plus,
    Search,
    Filter,
    Megaphone,
    TrendingUp,
    DollarSign,
    Users,
    Eye,
    Edit,
    BarChart3,
    PlayCircle,
    PauseCircle,
    CheckCircle,
} from 'lucide-react'

// Mock data (depois virá do Supabase)
const mockCampaigns = [
    {
        id: '1',
        name: 'Lançamento Reserva Atlantis',
        type: 'instagram',
        status: 'active',
        budget: 15000,
        spent: 8750,
        impressions: 245000,
        clicks: 3420,
        leads: 87,
        conversions: 12,
        start_date: '2024-02-01',
        end_date: '2024-02-29',
        development_id: '1',
    },
    {
        id: '2',
        name: 'Facebook Ads - Villa Jardins',
        type: 'facebook',
        status: 'active',
        budget: 12000,
        spent: 11200,
        impressions: 182000,
        clicks: 2840,
        leads: 64,
        conversions: 8,
        start_date: '2024-02-05',
        end_date: '2024-02-28',
        development_id: '2',
    },
    {
        id: '3',
        name: 'Google Ads - Piedade',
        type: 'google',
        status: 'paused',
        budget: 8000,
        spent: 3200,
        impressions: 98000,
        clicks: 1560,
        leads: 42,
        conversions: 5,
        start_date: '2024-02-10',
        end_date: '2024-03-10',
        development_id: '3',
    },
    {
        id: '4',
        name: 'Email Marketing - Newsletter',
        type: 'email',
        status: 'completed',
        budget: 2000,
        spent: 1850,
        impressions: 45000,
        clicks: 890,
        leads: 28,
        conversions: 4,
        start_date: '2024-01-15',
        end_date: '2024-01-31',
        development_id: null,
    },
]

export default function CampanhasPage() {
    const router = useRouter()
    const [campaigns, setCampaigns] = useState(mockCampaigns)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')

    // Stats
    const stats = {
        total: campaigns.length,
        active: campaigns.filter((c) => c.status === 'active').length,
        totalBudget: campaigns.reduce((acc, c) => acc + c.budget, 0),
        totalSpent: campaigns.reduce((acc, c) => acc + c.spent, 0),
        totalLeads: campaigns.reduce((acc, c) => acc + c.leads, 0),
        totalConversions: campaigns.reduce((acc, c) => acc + c.conversions, 0),
    }

    const avgROI =
        stats.totalLeads > 0
            ? ((stats.totalConversions / stats.totalLeads) * 100).toFixed(1)
            : '0.0'

    // Filtros
    const filteredCampaigns = campaigns.filter((campaign) => {
        const matchesSearch = campaign.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        const matchesStatus =
            statusFilter === 'all' || campaign.status === statusFilter
        const matchesType = typeFilter === 'all' || campaign.type === typeFilter
        return matchesSearch && matchesStatus && matchesType
    })

    // Status config
    const getStatusConfig = (status: string) => {
        const configs: Record<string, { variant: any; label: string; icon: any }> = {
            active: { variant: 'success', label: 'Ativa', icon: PlayCircle },
            paused: { variant: 'warning', label: 'Pausada', icon: PauseCircle },
            completed: { variant: 'neutral', label: 'Concluída', icon: CheckCircle },
            draft: { variant: 'info', label: 'Rascunho', icon: Edit },
        }
        return configs[status] || configs.draft
    }

    // Type config
    const getTypeConfig = (type: string) => {
        const configs: Record<string, { color: string; label: string }> = {
            instagram: { color: 'bg-pink-100 text-pink-700', label: 'Instagram' },
            facebook: { color: 'bg-blue-100 text-blue-700', label: 'Facebook' },
            google: { color: 'bg-red-100 text-red-700', label: 'Google Ads' },
            email: { color: 'bg-purple-100 text-purple-700', label: 'Email' },
            whatsapp: { color: 'bg-green-100 text-green-700', label: 'WhatsApp' },
        }
        return configs[type] || { color: 'bg-imi-100 text-imi-700', label: type }
    }

    const calculateROI = (campaign: typeof mockCampaigns[0]) => {
        if (campaign.leads === 0) return '0.0'
        return ((campaign.conversions / campaign.leads) * 100).toFixed(1)
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Gestão de Campanhas"
                subtitle="Monitore o ROI e a performance de seus canais de aquisição"
                breadcrumbs={[
                    { name: 'Dashboard', href: '/backoffice/backoffice/dashboard' },
                    { name: 'Campanhas' },
                ]}
                action={
                    <Button
                        icon={<Plus size={20} />}
                        onClick={() => router.push('/backoffice/backoffice/campanhas/nova')}
                    >
                        Nova Campanha
                    </Button>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    label="Campanhas Ativas"
                    value={stats.active.toString()}
                    icon={<Megaphone />}
                    variant="primary"
                />

                <KPICard
                    label="Budget Investido"
                    value={`R$ ${(stats.totalSpent / 1000).toFixed(1)}k`}
                    change={{
                        value: Number(((stats.totalSpent / stats.totalBudget) * 100).toFixed(0)),
                        label: 'do budget total alocado',
                        trend: 'neutral'
                    }}
                    icon={<DollarSign />}
                    variant="info"
                />

                <KPICard
                    label="Leads Gerados"
                    value={stats.totalLeads.toString()}
                    icon={<Users />}
                    variant="success"
                />

                <KPICard
                    label="Taxa de Conversão"
                    value={`${avgROI}%`}
                    icon={<TrendingUp />}
                    variant={Number(avgROI) >= 5 ? 'success' : 'warning'}
                />
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Buscar campanhas por nome ou ativo..."
                        leftIcon={<Search size={20} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-4">
                    <Select
                        className="w-48"
                        options={[
                            { value: 'all', label: 'Todos os status' },
                            { value: 'active', label: 'Ativa' },
                            { value: 'paused', label: 'Pausada' },
                            { value: 'completed', label: 'Concluída' },
                            { value: 'draft', label: 'Rascunho' },
                        ]}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    />
                    <Select
                        className="w-48"
                        options={[
                            { value: 'all', label: 'Todos os canais' },
                            { value: 'instagram', label: 'Instagram' },
                            { value: 'facebook', label: 'Facebook' },
                            { value: 'google', label: 'Google Ads' },
                            { value: 'email', label: 'Email Marketing' },
                        ]}
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    />
                    <Button variant="outline" icon={<Filter size={20} />}>
                        Mais
                    </Button>
                </div>
            </div>

            {/* Campaigns Grid */}
            {filteredCampaigns.length === 0 ? (
                <EmptyState
                    icon={Megaphone}
                    title="Nenhuma campanha localizada"
                    description={
                        searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                            ? 'Tente ajustar os critérios de busca ou filtros de canal.'
                            : 'Sua base de anúncios está vazia. Inicie sua primeira campanha digital.'
                    }
                    action={
                        !searchTerm && statusFilter === 'all' && typeFilter === 'all'
                            ? {
                                label: 'Nova Campanha',
                                onClick: () => router.push('/backoffice/backoffice/campanhas/nova'),
                                icon: <Plus />,
                            }
                            : undefined
                    }
                />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {filteredCampaigns.map((campaign) => {
                        const statusConfig = getStatusConfig(campaign.status)
                        const typeConfig = getTypeConfig(campaign.type)
                        const StatusIcon = statusConfig.icon
                        const roi = calculateROI(campaign)
                        const budgetUsed = ((campaign.spent / campaign.budget) * 100).toFixed(0)

                        return (
                            <Card key={campaign.id} className="border-imi-50 shadow-elevated" hover>
                                <CardHeader
                                    title={campaign.name}
                                    subtitle={`${typeConfig.label} • ${new Date(campaign.start_date).toLocaleDateString('pt-BR')}`}
                                    action={
                                        <Badge variant={statusConfig.variant} size="sm" dot>
                                            {statusConfig.label}
                                        </Badge>
                                    }
                                />
                                <CardBody>
                                    <div className="space-y-6">
                                        {/* Budget Progress */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3 text-xs font-black uppercase tracking-widest text-imi-400">
                                                <span>Utilização do Budget</span>
                                                <span>
                                                    R$ {campaign.spent.toLocaleString()} / <span className="text-imi-900">R$ {campaign.budget.toLocaleString()}</span>
                                                </span>
                                            </div>
                                            <div className="h-2 bg-imi-50 rounded-full overflow-hidden border border-imi-100/50">
                                                <div
                                                    className={`h-full transition-all duration-1000 ease-out rounded-full ${Number(budgetUsed) >= 90
                                                            ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                                                            : Number(budgetUsed) >= 70
                                                                ? 'bg-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                                                : 'bg-accent-500 shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]'
                                                        }`}
                                                    style={{ width: `${Math.min(Number(budgetUsed), 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-2">
                                                <p className="text-[10px] font-bold text-imi-500">{budgetUsed}% consumido</p>
                                                <p className="text-[10px] font-bold text-imi-500">
                                                    {new Date(campaign.end_date).toLocaleDateString('pt-BR')} (Término)
                                                </p>
                                            </div>
                                        </div>

                                        {/* Metrics Intelligence Grid */}
                                        <div className="grid grid-cols-4 gap-4">
                                            <div className="text-center py-4 px-2 bg-imi-50/50 rounded-2xl border border-imi-100/30">
                                                <p className="text-[9px] font-black text-imi-400 uppercase tracking-tighter mb-1">Alcance</p>
                                                <p className="text-sm font-black text-imi-950">
                                                    {(campaign.impressions / 1000).toFixed(0)}k
                                                </p>
                                            </div>
                                            <div className="text-center py-4 px-2 bg-imi-50/50 rounded-2xl border border-imi-100/30">
                                                <p className="text-[9px] font-black text-imi-400 uppercase tracking-tighter mb-1">CTR%</p>
                                                <p className="text-sm font-black text-imi-950">
                                                    {((campaign.clicks / campaign.impressions) * 100).toFixed(2)}%
                                                </p>
                                            </div>
                                            <div className="text-center py-4 px-2 bg-accent-50/30 rounded-2xl border border-accent-100/20">
                                                <p className="text-[9px] font-black text-accent-600 uppercase tracking-tighter mb-1">Leads</p>
                                                <p className="text-sm font-black text-accent-700">
                                                    {campaign.leads}
                                                </p>
                                            </div>
                                            <div className="text-center py-4 px-2 bg-imi-950 rounded-2xl border border-imi-800">
                                                <p className="text-[9px] font-black text-white/40 uppercase tracking-tighter mb-1">Conv.</p>
                                                <p
                                                    className={`text-sm font-black ${Number(roi) >= 5
                                                            ? 'text-green-400'
                                                            : Number(roi) >= 2
                                                                ? 'text-yellow-400'
                                                                : 'text-red-400'
                                                        }`}
                                                >
                                                    {roi}%
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions Strategy */}
                                        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-imi-50">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={<Eye size={16} />}
                                                onClick={() => router.push(`/backoffice/backoffice/campanhas/${campaign.id}`)}
                                                className="text-imi-400 hover:text-imi-900"
                                            >
                                                Dossiê
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={<BarChart3 size={16} />}
                                                onClick={() =>
                                                    router.push(`/backoffice/backoffice/campanhas/${campaign.id}/analytics`)
                                                }
                                                className="text-imi-400 hover:text-accent-600"
                                            >
                                                Métricas
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={<Edit size={16} />}
                                                className="text-imi-400 hover:text-imi-900"
                                            >
                                                Config.
                                            </Button>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
