'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '../components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge, KPICard } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardBody } from '@/components/ui/Card'
import {
    TableContainer,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    TablePagination,
} from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import {
    Plus,
    Search,
    Filter,
    MessageSquare,
    Eye,
    CheckCircle,
    Clock,
    XCircle,
    Globe,
    DollarSign,
    TrendingUp,
    UserCheck
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const mockConsultations = [
    {
        id: '1',
        client_name: 'Maria Santos',
        client_email: 'maria@exemplo.com',
        client_phone: '(81) 99999-2222',
        consultation_type: 'investment',
        jurisdiction: 'Brazil',
        budget_range: 'R$ 1M - 5M',
        status: 'active',
        created_at: '2024-02-08',
    },
    {
        id: '2',
        client_name: 'Carlos Oliveira',
        client_email: 'carlos@exemplo.com',
        client_phone: '(81) 99999-3333',
        consultation_type: 'relocation',
        jurisdiction: 'USA',
        budget_range: '$ 500k - 1M',
        status: 'completed',
        created_at: '2024-02-01',
    },
    {
        id: '3',
        client_name: 'Ana Paula',
        client_email: 'ana@exemplo.com',
        client_phone: '(81) 99999-4444',
        consultation_type: 'diversification',
        jurisdiction: 'Dubai',
        budget_range: '$ 5M+',
        status: 'pending',
        created_at: '2024-02-12',
    },
]

export default function ConsultoriasPage() {
    const router = useRouter()
    const [consultations, setConsultations] = useState(mockConsultations)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    const stats = {
        total: consultations.length,
        active: consultations.filter((c) => c.status === 'active').length,
        completed: consultations.filter((c) => c.status === 'completed').length,
        pending: consultations.filter((c) => c.status === 'pending').length,
    }

    const filteredConsultations = consultations.filter((consultation) => {
        const matchesSearch =
            consultation.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            consultation.client_email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus =
            statusFilter === 'all' || consultation.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const totalPages = Math.ceil(filteredConsultations.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedConsultations = filteredConsultations.slice(
        startIndex,
        startIndex + itemsPerPage
    )

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { variant: any; label: string; icon: any }> = {
            pending: { variant: 'warning', label: 'Em Triagem', icon: Clock },
            active: { variant: 'primary', label: 'Atendimento Ativo', icon: MessageSquare },
            completed: { variant: 'success', label: 'Efetivada', icon: CheckCircle },
            cancelled: { variant: 'danger', label: 'Arquivada', icon: XCircle },
        }
        return configs[status] || configs.pending
    }

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            investment: 'Investimento Global',
            relocation: 'Relocação / Golden Visa',
            diversification: 'Diversificação de Portfólio',
            tax_optimization: 'Otimização Fiscal Int.',
            estate_planning: 'Sucessão & Trust',
        }
        return labels[type] || type
    }

    const getJurisdictionFlag = (jurisdiction: string) => {
        const flags: Record<string, string> = {
            Brazil: '🇧🇷',
            USA: '🇺🇸',
            Dubai: '🇦🇪',
            Portugal: '🇵🇹',
            Spain: '🇪🇸',
        }
        return flags[jurisdiction] || '🌎'
    }

    return (
        <div className="space-y-8">
            <PageHeader
                title="Consultorias Estratégicas"
                subtitle="Gestão de Family Office e Ativos Internacionais"
                breadcrumbs={[
                    { name: 'Dashboard', href: '/backoffice/backoffice/dashboard' },
                    { name: 'Consultorias High-End' },
                ]}
                action={
                    <Button
                        icon={<Plus size={20} />}
                        onClick={() => router.push('/backoffice/backoffice/consultoria/nova')}
                        className="shadow-glow"
                    >
                        Nova Consultoria
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    label="Total de Briefings"
                    value={stats.total}
                    icon={<Globe />}
                    variant="primary"
                    className="shadow-elevated"
                />
                <KPICard
                    label="Inbound Pendente"
                    value={stats.pending}
                    icon={<Clock />}
                    variant="warning"
                    className="shadow-elevated"
                />
                <KPICard
                    label="Consultorias Ativas"
                    value={stats.active}
                    icon={<TrendingUp />}
                    variant="primary"
                    className="bg-imi-950 text-white border-imi-800 shadow-glow"
                />
                <KPICard
                    label="Conversões Totais"
                    value={stats.completed}
                    icon={<UserCheck />}
                    variant="success"
                    className="shadow-elevated"
                />
            </div>

            <Card className="shadow-elevated border-imi-50">
                <CardBody className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                            <Input
                                placeholder="Filtrar por investidor, email ou jurisdição..."
                                leftIcon={<Search size={20} className="text-imi-400" />}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-14 bg-imi-50/50"
                            />
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <Select
                                className="h-14 w-48 bg-white font-black uppercase text-[10px] tracking-widest"
                                options={[
                                    { value: 'all', label: 'Todas as Fases' },
                                    { value: 'pending', label: 'Triagem' },
                                    { value: 'active', label: 'Ativa' },
                                    { value: 'completed', label: 'Efetivada' },
                                    { value: 'cancelled', label: 'Arquivada' },
                                ]}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            />
                            <Button variant="outline" icon={<Filter size={18} />} className="h-14 px-6 font-black uppercase text-[10px] tracking-widest">
                                Avançado
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {filteredConsultations.length === 0 ? (
                <EmptyState
                    icon={MessageSquare}
                    title="Nenhuma consultoria registrada"
                    description={
                        searchTerm || statusFilter !== 'all'
                            ? 'Nenhum investidor corresponde aos filtros aplicados.'
                            : 'Você ainda não registrou consultorias de luxo ou internacionais.'
                    }
                    action={
                        !searchTerm && statusFilter === 'all'
                            ? {
                                label: 'Iniciar Primeira Consultoria',
                                onClick: () => router.push('/backoffice/backoffice/consultoria/nova'),
                                icon: <Plus />,
                            }
                            : undefined
                    }
                />
            ) : (
                <Card className="shadow-elevated border-imi-50 overflow-hidden">
                    <TableContainer className="border-none shadow-none">
                        <Table>
                            <TableHeader className="bg-imi-50/50">
                                <TableRow>
                                    <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest">Investidor</TableHead>
                                    <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest">Estratégia</TableHead>
                                    <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest">Jurisdição</TableHead>
                                    <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-center">Ticket Alvo</TableHead>
                                    <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-center">Fase Atual</TableHead>
                                    <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-right">Data de Entrada</TableHead>
                                    <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedConsultations.map((consultation) => {
                                    const statusConfig = getStatusConfig(consultation.status)
                                    const StatusIcon = statusConfig.icon

                                    return (
                                        <TableRow key={consultation.id} className="hover:bg-imi-50/30 transition-colors">
                                            <TableCell className="py-6">
                                                <div className="group">
                                                    <p className="font-black text-imi-900 group-hover:text-accent-600 transition-colors uppercase tracking-tight">
                                                        {consultation.client_name}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-imi-400 uppercase tracking-widest">
                                                        {consultation.client_email}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <span className="text-[11px] font-black text-imi-500 uppercase tracking-tight">
                                                    {getTypeLabel(consultation.consultation_type)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl shadow-sm rounded-md">{getJurisdictionFlag(consultation.jurisdiction)}</span>
                                                    <span className="text-[11px] font-black text-imi-950 uppercase tracking-tighter">
                                                        {consultation.jurisdiction}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6 text-center">
                                                <span className="text-[11px] font-black text-accent-700 bg-accent-50 px-3 py-1 rounded-full border border-accent-100">
                                                    {consultation.budget_range}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-6 text-center">
                                                <Badge
                                                    variant={statusConfig.variant}
                                                    icon={<StatusIcon size={12} />}
                                                    className="bg-white"
                                                >
                                                    <span className="font-black text-[9px] uppercase tracking-widest">{statusConfig.label}</span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-6 text-right">
                                                <span className="text-[11px] font-black text-imi-400">
                                                    {new Date(consultation.created_at).toLocaleDateString('pt-BR')}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-6 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    icon={<Eye size={18} />}
                                                    onClick={() =>
                                                        router.push(`/backoffice/backoffice/consultoria/${consultation.id}`)
                                                    }
                                                    className="hover:bg-imi-100"
                                                >
                                                    Dossiê
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <div className="p-6 bg-imi-50/30 border-t border-imi-100">
                        <TablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredConsultations.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </Card>
            )}
        </div>
    )
}
