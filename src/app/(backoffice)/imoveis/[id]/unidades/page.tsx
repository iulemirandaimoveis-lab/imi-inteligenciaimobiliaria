'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageHeader from '../../../components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import {
    TableContainer,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '@/components/ui/Table'
import { EmptyState, CardSkeleton } from '@/components/ui/EmptyState'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import {
    Plus,
    Package,
    Edit,
    Trash2,
    Download,
    Upload,
    Filter,
} from 'lucide-react'
import { useDevelopments } from '@/hooks/use-developments'

// Mock units data (depois virá do Supabase)
const mockUnits = [
    { id: '1', number: '101', floor: '1', bedrooms: 2, bathrooms: 2, area: 65, price: 450000, status: 'available' },
    { id: '2', number: '102', floor: '1', bedrooms: 3, bathrooms: 2, area: 85, price: 580000, status: 'reserved' },
    { id: '3', number: '103', floor: '1', bedrooms: 2, bathrooms: 2, area: 65, price: 450000, status: 'sold' },
    { id: '4', number: '201', floor: '2', bedrooms: 3, bathrooms: 3, area: 95, price: 680000, status: 'available' },
    { id: '5', number: '202', floor: '2', bedrooms: 2, bathrooms: 2, area: 70, price: 490000, status: 'available' },
]

export default function UnidadesPage() {
    const params = useParams()
    const router = useRouter()
    const { developments, isLoading } = useDevelopments()
    const development = developments?.find((dev: any) => dev.id === params.id)

    const [units, setUnits] = useState(mockUnits)
    const [showAddModal, setShowAddModal] = useState(false)
    const [filterStatus, setFilterStatus] = useState('all')

    const getStatusVariant = (status: string) => {
        const variants: Record<string, any> = {
            available: 'success',
            reserved: 'warning',
            sold: 'neutral',
        }
        return (variants[status] || 'neutral') as any
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            available: 'Disponível',
            reserved: 'Reservada',
            sold: 'Vendida',
        }
        return labels[status] || status
    }

    const filteredUnits = units.filter((unit) => {
        if (filterStatus === 'all') return true
        return unit.status === filterStatus
    })

    const stats = {
        total: units.length,
        available: units.filter((u) => u.status === 'available').length,
        reserved: units.filter((u) => u.status === 'reserved').length,
        sold: units.filter((u) => u.status === 'sold').length,
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
                <PageHeader title="Empreendimento não encontrado" />
                <Card>
                    <CardBody>
                        <p className="text-center text-imi-600 py-8">
                            O empreendimento solicitado não existe ou você não possui permissão para acessá-lo.
                        </p>
                    </CardBody>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Gestão de Unidades"
                subtitle={`Inventário e disponibilidade: ${development.name}`}
                breadcrumbs={[
                    { name: 'Dashboard', href: '/backoffice/dashboard' },
                    { name: 'Imóveis', href: '/backoffice/imoveis' },
                    { name: development.name, href: `/backoffice/imoveis/${development.id}` },
                    { name: 'Unidades' },
                ]}
                action={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" icon={<Download size={20} />} className="hidden lg:flex">
                            Exportar
                        </Button>
                        <Button variant="outline" icon={<Upload size={20} />} className="hidden lg:flex">
                            Importar
                        </Button>
                        <Button icon={<Plus size={20} />} onClick={() => setShowAddModal(true)}>
                            Nova Unidade
                        </Button>
                    </div>
                }
            />

            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white">
                    <CardBody className="flex flex-col items-center">
                        <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-1">Carga Total</p>
                        <p className="text-3xl font-bold text-imi-900">{stats.total}</p>
                    </CardBody>
                </Card>
                <Card className="border-green-100 bg-green-50/10">
                    <CardBody className="flex flex-col items-center">
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Disponíveis</p>
                        <p className="text-3xl font-bold text-green-700">{stats.available}</p>
                    </CardBody>
                </Card>
                <Card className="border-yellow-100 bg-yellow-50/10">
                    <CardBody className="flex flex-col items-center">
                        <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-1">Reservadas</p>
                        <p className="text-3xl font-bold text-yellow-700">{stats.reserved}</p>
                    </CardBody>
                </Card>
                <Card className="bg-imi-50 border-imi-100">
                    <CardBody className="flex flex-col items-center">
                        <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-1">Vendidas</p>
                        <p className="text-3xl font-bold text-imi-700">{stats.sold}</p>
                    </CardBody>
                </Card>
            </div>

            {/* Control Bar */}
            <Card className="py-4 px-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-4 w-full md:w-auto">
                        <Select
                            className="md:w-64"
                            options={[
                                { value: 'all', label: 'Todos os status' },
                                { value: 'available', label: 'Disponível' },
                                { value: 'reserved', label: 'Reservada' },
                                { value: 'sold', label: 'Vendida' },
                            ]}
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button variant="ghost" icon={<Filter size={18} />} className="flex-1 md:flex-none">
                            Filtragem Avançada
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Inventory Table */}
            {filteredUnits.length === 0 ? (
                <EmptyState
                    icon={Package}
                    title="Nenhuma unidade encontrada"
                    description="Inicie a carga do inventário para começar a gerenciar as vendas deste empreendimento."
                    action={{
                        label: 'Adicionar Primeira Unidade',
                        onClick: () => setShowAddModal(true),
                        icon: <Plus size={18} />,
                    }}
                    className="bg-white border-dashed border-2"
                />
            ) : (
                <TableContainer>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Identificador</TableHead>
                                <TableHead>Pavimento</TableHead>
                                <TableHead>Quartos</TableHead>
                                <TableHead>WCs</TableHead>
                                <TableHead>Área Privativa</TableHead>
                                <TableHead>Valor de Mercado</TableHead>
                                <TableHead>Status Atual</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUnits.map((unit) => (
                                <TableRow key={unit.id} hover>
                                    <TableCell>
                                        <span className="font-bold text-imi-900">UA-{unit.number}</span>
                                    </TableCell>
                                    <TableCell>{unit.floor}º andar</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 font-medium">
                                            {unit.bedrooms} <span className="text-xs text-imi-400 font-normal">Qts</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{unit.bathrooms}</TableCell>
                                    <TableCell>
                                        <span className="font-bold text-imi-950">{unit.area}</span>
                                        <span className="text-xs text-imi-400 ml-1">m²</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-black text-imi-900">
                                            R$ {(unit.price / 1000).toLocaleString('pt-BR')}k
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(unit.status)} size="sm" dot>
                                            {getStatusLabel(unit.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="sm" icon={<Edit size={16} />} />
                                            <Button variant="ghost" size="sm" icon={<Trash2 size={16} />} className="text-red-400 hover:text-red-600 hover:bg-red-50" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Modal: Cadastro de Unidade */}
            <Modal open={showAddModal} onClose={() => setShowAddModal(false)} size="md">
                <ModalHeader
                    title="Sessão: Cadastro de Unidade"
                    subtitle="Insira os dados técnicos do imóvel individual"
                />
                <ModalBody>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <Input label="Número / Identificador" placeholder="Ex: 101" />
                            <Input label="Andar / Pavimento" placeholder="Ex: 1" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <Input label="Quartos" type="number" placeholder="2" />
                            <Input label="Banheiros" type="number" placeholder="2" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <Input label="Área Privativa (m²)" type="number" placeholder="65" />
                            <Input label="Valor Base (R$)" type="number" placeholder="450000" />
                        </div>
                        <Select
                            label="Status Inicial"
                            options={[
                                { value: 'available', label: 'Disponível' },
                                { value: 'reserved', label: 'Reservada' },
                                { value: 'sold', label: 'Vendida' },
                            ]}
                        />
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                        Descartar
                    </Button>
                    <Button onClick={() => setShowAddModal(false)} className="flex-1 shadow-glow">
                        Efetivar Unidade
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}
