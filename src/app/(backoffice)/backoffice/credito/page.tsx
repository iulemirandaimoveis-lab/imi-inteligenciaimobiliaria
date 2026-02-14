'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '../../components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge, KPICard } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
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
import { EmptyState, TableSkeleton } from '@/components/ui/EmptyState'
import {
  Plus,
  Search,
  Filter,
  CreditCard,
  Eye,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
} from 'lucide-react'

// Mock data (depois virá do Supabase)
const mockRequests = [
  {
    id: '1',
    client_name: 'João Silva',
    client_email: 'joao@exemplo.com',
    client_phone: '(81) 99999-1111',
    property_type: 'Apartamento',
    property_value: 450000,
    requested_amount: 360000,
    income: 12000,
    employment_type: 'CLT',
    status: 'pending',
    created_at: '2024-02-10',
  },
  {
    id: '2',
    client_name: 'Maria Santos',
    client_email: 'maria@exemplo.com',
    client_phone: '(81) 99999-2222',
    property_type: 'Casa',
    property_value: 680000,
    requested_amount: 544000,
    income: 18000,
    employment_type: 'Empresário',
    status: 'approved',
    created_at: '2024-02-08',
  },
  {
    id: '3',
    client_name: 'Pedro Costa',
    client_email: 'pedro@exemplo.com',
    client_phone: '(81) 99999-3333',
    property_type: 'Apartamento',
    property_value: 320000,
    requested_amount: 256000,
    income: 8500,
    employment_type: 'CLT',
    status: 'analyzing',
    created_at: '2024-02-05',
  },
  {
    id: '4',
    client_name: 'Ana Oliveira',
    client_email: 'ana@exemplo.com',
    client_phone: '(81) 99999-4444',
    property_type: 'Casa',
    property_value: 890000,
    requested_amount: 712000,
    income: 25000,
    employment_type: 'Servidor Público',
    status: 'rejected',
    created_at: '2024-02-01',
  },
]

export default function CreditoPage() {
  const router = useRouter()
  const [requests, setRequests] = useState(mockRequests)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Stats
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    analyzing: requests.filter((r) => r.status === 'analyzing').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
    totalValue: requests
      .filter((r) => r.status === 'approved')
      .reduce((acc, r) => acc + r.requested_amount, 0),
  }

  // Filtros
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.client_email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Paginação
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedRequests = filteredRequests.slice(
    startIndex,
    startIndex + itemsPerPage
  )

  // Status config
  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { variant: any; label: string; icon: any }
    > = {
      pending: { variant: 'warning', label: 'Pendente', icon: Clock },
      analyzing: { variant: 'info', label: 'Em Análise', icon: TrendingUp },
      approved: { variant: 'success', label: 'Aprovado', icon: CheckCircle },
      rejected: { variant: 'danger', label: 'Rejeitado', icon: XCircle },
    }
    return configs[status] || configs.pending
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crédito Imobiliário"
        subtitle="Gerencie solicitações de financiamento e pipeline bancário"
        breadcrumbs={[
          { name: 'Dashboard', href: '/backoffice/dashboard' },
          { name: 'Crédito' },
        ]}
        action={
          <Button
            icon={<Plus size={20} />}
            onClick={() => router.push('/backoffice/credito/novo')}
          >
            Nova Solicitação
          </Button>
        }
      />

      {/* KPIs Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
        <Card className="bg-white">
          <CardBody className="flex flex-col items-center">
            <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-1">Solicitações</p>
            <p className="text-3xl font-bold text-imi-900">{stats.total}</p>
          </CardBody>
        </Card>
        <Card className="border-yellow-100 bg-yellow-50/10">
          <CardBody className="flex flex-col items-center">
            <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-1">Pendentes</p>
            <p className="text-3xl font-bold text-yellow-700">{stats.pending}</p>
          </CardBody>
        </Card>
        <Card className="border-blue-100 bg-blue-50/10">
          <CardBody className="flex flex-col items-center">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Em Análise</p>
            <p className="text-3xl font-bold text-blue-700">{stats.analyzing}</p>
          </CardBody>
        </Card>
        <Card className="border-green-100 bg-green-50/10">
          <CardBody className="flex flex-col items-center">
            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Aprovados</p>
            <p className="text-3xl font-bold text-green-700">{stats.approved}</p>
          </CardBody>
        </Card>
        <Card className="border-red-100 bg-red-50/10">
          <CardBody className="flex flex-col items-center">
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Rejeitados</p>
            <p className="text-3xl font-bold text-red-700">{stats.rejected}</p>
          </CardBody>
        </Card>
        <Card className="bg-imi-950 border-imi-900 shadow-elevated">
          <CardBody className="flex flex-col items-center">
            <p className="text-[10px] font-black text-accent-500 uppercase tracking-[0.2em] mb-1">Volume</p>
            <p className="text-xl font-black text-white">
              R$ {(stats.totalValue / 1000000).toFixed(1)}M
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Control Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Filtrar por nome do cliente ou e-mail corporativo..."
              leftIcon={<Search size={20} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12"
            />
          </div>
          <div className="flex gap-4">
            <Select
              className="w-48 h-12"
              options={[
                { value: 'all', label: 'Status: Todos' },
                { value: 'pending', label: 'Pendente' },
                { value: 'analyzing', label: 'Em Análise' },
                { value: 'approved', label: 'Aprovado' },
                { value: 'rejected', label: 'Rejeitado' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
            <Button variant="outline" icon={<Filter size={20} />} className="h-12 px-6">
              Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Credit Pipeline Table */}
      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhuma solicitação em carteira"
          description={
            searchTerm || statusFilter !== 'all'
              ? 'Nenhum registro para o filtro selecionado.'
              : 'Você ainda não registrou fluxos de crédito imobiliário.'
          }
          action={
            !searchTerm && statusFilter === 'all'
              ? {
                label: 'Iniciar Primeira Simulação',
                onClick: () => router.push('/backoffice/credito/novo'),
                icon: <Plus />,
              }
              : undefined
          }
          className="bg-white border-dashed border-2"
        />
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente / Perfil</TableHead>
                <TableHead>Typology</TableHead>
                <TableHead>Market Value</TableHead>
                <TableHead>Solicitado</TableHead>
                <TableHead>Renda Mensal</TableHead>
                <TableHead>Status Pipeline</TableHead>
                <TableHead>Emissão</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.map((req) => {
                const statusConfig = getStatusConfig(req.status)
                const StatusIcon = statusConfig.icon

                return (
                  <TableRow key={req.id} hover>
                    <TableCell>
                      <div>
                        <p className="font-bold text-imi-950">{req.client_name}</p>
                        <p className="text-[10px] font-medium text-imi-400 uppercase tracking-wider">{req.employment_type}</p>
                      </div>
                    </TableCell>
                    <TableCell>{req.property_type}</TableCell>
                    <TableCell>
                      <span className="font-medium text-imi-600">
                        R$ {(req.property_value / 1000).toLocaleString('pt-BR')}k
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-black text-accent-700">
                        R$ {(req.requested_amount / 1000).toLocaleString('pt-BR')}k
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-imi-900">
                        R$ {(req.income / 1000).toLocaleString('pt-BR')}k
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant} size="sm" dot>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-imi-500">
                        {new Date(req.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Eye size={18} />}
                        onClick={() =>
                          router.push(`/backoffice/credito/${req.id}`)
                        }
                        className="text-imi-400 hover:text-accent-600"
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredRequests.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </TableContainer>
      )}
    </div>
  )
}
