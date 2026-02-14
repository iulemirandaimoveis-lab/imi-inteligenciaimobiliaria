'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageHeader from '../../../components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Input'
import { CardSkeleton } from '@/components/ui/EmptyState'
import {
    Edit,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    User,
    Home,
    DollarSign,
    FileText,
    Calendar,
    Phone,
    Mail,
    MapPin,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const supabase = createClient()

export default function CreditoDetalhesPage() {
    const params = useParams()
    const router = useRouter()
    const [request, setRequest] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showStatusModal, setShowStatusModal] = useState(false)
    const [newStatus, setNewStatus] = useState('')
    const [statusNotes, setStatusNotes] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
        async function fetchRequest() {
            try {
                const { data, error } = await supabase
                    .from('credit_requests')
                    .select('*')
                    .eq('id', params.id)
                    .single()

                if (error) throw error
                setRequest(data)
                setNewStatus(data.status)
            } catch (error) {
                console.error('Erro ao buscar solicitação:', error)
                toast.error('Não foi possível carregar os detalhes da solicitação.')
            } finally {
                setIsLoading(false)
            }
        }

        if (params.id) {
            fetchRequest()
        }
    }, [params.id])

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { variant: any; label: string; icon: any }> = {
            pending: { variant: 'warning', label: 'Pendente', icon: Clock },
            analyzing: { variant: 'info', label: 'Em Análise', icon: TrendingUp },
            approved: { variant: 'success', label: 'Aprovado', icon: CheckCircle },
            rejected: { variant: 'danger', label: 'Rejeitado', icon: XCircle },
        }
        return configs[status] || configs.pending
    }

    const handleUpdateStatus = async () => {
        setIsUpdating(true)

        try {
            const { error } = await supabase
                .from('credit_requests')
                .update({
                    status: newStatus,
                    notes: statusNotes ? `${request.notes || ''}\n\n[Update ${new Date().toLocaleDateString()}]: ${statusNotes}` : request.notes,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', params.id)

            if (error) throw error

            setRequest((prev: any) => ({ ...prev, status: newStatus }))
            setShowStatusModal(false)
            toast.success('Status da solicitação atualizado com sucesso!')
        } catch (error) {
            console.error('Erro ao atualizar:', error)
            toast.error('Erro ao atualizar status da solicitação.')
        } finally {
            setIsUpdating(false)
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <CardSkeleton />
            </div>
        )
    }

    if (!request) {
        return (
            <div className="space-y-6">
                <PageHeader title="Solicitação não encontrada" />
                <Card>
                    <CardBody>
                        <p className="text-center text-imi-600 py-12">
                            O registro de crédito solicitado não foi localizado em nossa base de dados.
                        </p>
                    </CardBody>
                </Card>
            </div>
        )
    }

    const statusConfig = getStatusConfig(request.status)
    const StatusIcon = statusConfig.icon

    // Cálculos de Engenharia de Crédito
    const ltv = ((request.requested_amount / request.property_value) * 100).toFixed(1)
    const monthlyIncome = request.income
    const maxInstallment = monthlyIncome * 0.3 // 30% da renda
    const estimatedRate = 10.5 // % ao ano (simulação IMI)
    const estimatedMonths = 360 // 30 anos
    const monthlyRate = estimatedRate / 12 / 100
    const estimatedInstallment =
        (request.requested_amount * monthlyRate * Math.pow(1 + monthlyRate, estimatedMonths)) /
        (Math.pow(1 + monthlyRate, estimatedMonths) - 1)

    const canApprove = estimatedInstallment <= maxInstallment && Number(ltv) <= 80

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Dossiê de Crédito #${request.id.slice(0, 8).toUpperCase()}`}
                subtitle={`Proponente: ${request.client_name}`}
                breadcrumbs={[
                    { name: 'Dashboard', href: '/backoffice/backoffice/dashboard' },
                    { name: 'Crédito', href: '/backoffice/backoffice/credito' },
                    { name: 'Detalhes da Operação' },
                ]}
                action={
                    <div className="flex items-center gap-4">
                        <Badge variant={statusConfig.variant} size="lg" icon={<StatusIcon size={16} />} dot>
                            {statusConfig.label}
                        </Badge>
                        <Button
                            variant="primary"
                            icon={<Edit size={20} />}
                            onClick={() => setShowStatusModal(true)}
                            className="shadow-glow"
                        >
                            Gestão de Status
                        </Button>
                    </div>
                }
            />

            {/* Credit Intelligence Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-accent-100 bg-accent-50/10">
                    <CardBody className="flex flex-col items-center">
                        <p className="text-[10px] font-black text-accent-600 uppercase tracking-widest mb-1">Loan-to-Value (LTV)</p>
                        <p className="text-3xl font-black text-imi-950">{ltv}%</p>
                        <Badge variant={Number(ltv) <= 80 ? 'success' : 'danger'} size="sm" className="mt-2">
                            {Number(ltv) <= 80 ? 'Exposição Segura' : 'Alavancagem Crítica'}
                        </Badge>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="flex flex-col items-center">
                        <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-1">Parcela Estimada</p>
                        <p className="text-2xl font-black text-imi-900">
                            R$ {estimatedInstallment.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-[10px] text-imi-500 mt-2 font-medium">Tx. Simulação: {estimatedRate}% a.a.</p>
                    </CardBody>
                </Card>

                <Card className={estimatedInstallment <= maxInstallment ? 'bg-white' : 'border-red-100 bg-red-50/10'}>
                    <CardBody className="flex flex-col items-center">
                        <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-1">Comprometimento</p>
                        <p className="text-3xl font-black text-imi-950">
                            {((estimatedInstallment / monthlyIncome) * 100).toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-imi-500 mt-2 font-medium">Limite Bancário: 30%</p>
                    </CardBody>
                </Card>

                <Card className={canApprove ? 'bg-imi-950 border-imi-900' : 'bg-red-950 border-red-900'}>
                    <CardBody className="flex flex-col items-center">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Rating IMI</p>
                        <p className={`text-2xl font-black ${canApprove ? 'text-accent-400' : 'text-red-400'}`}>
                            {canApprove ? 'Aprovável' : 'Restrito'}
                        </p>
                        <div className={`mt-2 flex items-center gap-1 text-[10px] font-bold ${canApprove ? 'text-green-400' : 'text-red-400'}`}>
                            {canApprove ? <CheckCircle size={10} /> : <XCircle size={10} />}
                            {canApprove ? 'Score de Saúde OK' : 'Risco de Rejeição'}
                        </div>
                    </CardBody>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Dados do Cliente */}
                    <Card>
                        <CardHeader title="Perfil do Proponente" icon={<User size={18} className="text-accent-500" />} />
                        <CardBody className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                <div>
                                    <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-2">Nome Civil</p>
                                    <p className="text-base font-bold text-imi-900">{request.client_name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-2">CPF / Documento</p>
                                    <p className="text-base font-bold text-imi-900">{request.client_cpf}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-imi-50 flex items-center justify-center text-imi-400">
                                        <Mail size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-imi-300 uppercase tracking-widest">E-mail</p>
                                        <p className="text-sm font-bold text-imi-900">{request.client_email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-imi-50 flex items-center justify-center text-imi-400">
                                        <Phone size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-imi-300 uppercase tracking-widest">WhatsApp</p>
                                        <p className="text-sm font-bold text-imi-900">{request.client_phone}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-2">Data de Nascimento</p>
                                    <p className="text-sm font-bold text-imi-900">
                                        {request.client_birthdate ? new Date(request.client_birthdate).toLocaleDateString('pt-BR') : 'Não informada'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-2">Estado Civil</p>
                                    <p className="text-sm font-bold text-imi-900 capitalize">
                                        {request.client_marital_status || 'Não informado'}
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Dados do Financiamento */}
                    <Card className="bg-white border-imi-100">
                        <CardHeader title="Engenharia Financeira" icon={<DollarSign size={18} className="text-green-500" />} />
                        <CardBody className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                <div className="p-4 bg-accent-50/50 rounded-2xl border border-accent-100">
                                    <p className="text-[10px] font-black text-accent-600 uppercase tracking-widest mb-2">Valor Solicitado (Lending)</p>
                                    <p className="text-2xl font-black text-accent-700">
                                        R$ {request.requested_amount.toLocaleString('pt-BR')}
                                    </p>
                                </div>
                                <div className="p-4 bg-imi-50/50 rounded-2xl border border-imi-100">
                                    <p className="text-[10px] font-black text-imi-500 uppercase tracking-widest mb-2">Renda Mensal Comprovada</p>
                                    <p className="text-2xl font-black text-imi-900">
                                        R$ {request.income.toLocaleString('pt-BR')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-2">Regime de Trabalho</p>
                                    <Badge variant="neutral" size="lg">{request.employment_type}</Badge>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-2">Tempo de Ocupação</p>
                                    <p className="text-sm font-bold text-imi-900">{request.employment_time || 'Não informado'}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${request.has_fgts ? 'bg-green-100 text-green-600' : 'bg-imi-100 text-imi-400'}`}>
                                        <CheckCircle size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest">Utilização de FGTS</p>
                                        <p className="text-sm font-bold text-imi-900">{request.has_fgts ? 'Vinculado à proposta' : 'Não habilitado'}</p>
                                    </div>
                                </div>
                                {request.has_fgts && (
                                    <div>
                                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">Saldo FGTS Declarado</p>
                                        <p className="text-lg font-black text-green-700">
                                            R$ {request.fgts_value?.toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Observações */}
                    {request.notes && (
                        <Card>
                            <CardHeader title="Notas do Analista / Contexto" icon={<FileText size={18} className="text-imi-400" />} />
                            <CardBody className="p-8">
                                <div className="p-6 bg-imi-50 border border-imi-100 rounded-2xl">
                                    <p className="text-sm text-imi-700 leading-relaxed whitespace-pre-wrap italic">
                                        "{request.notes}"
                                    </p>
                                </div>
                            </CardBody>
                        </Card>
                    )}
                </div>

                <div className="space-y-8">
                    {/* Cololateral / Imóvel */}
                    <Card className="shadow-none border-imi-100">
                        <CardHeader title="Ativo de Garantia" icon={<Home size={18} className="text-imi-900" />} />
                        <CardBody className="p-6">
                            <div className="space-y-6">
                                <div className="aspect-video bg-imi-50 rounded-2xl flex items-center justify-center border border-imi-100 overflow-hidden relative">
                                    <Home size={48} className="text-imi-200" />
                                    <div className="absolute top-4 right-4 group">
                                        <Badge variant="primary" size="sm">{request.property_type}</Badge>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-1 text-center">Valor de Avaliação</p>
                                        <p className="text-2xl font-black text-imi-950 text-center">
                                            R$ {request.property_value.toLocaleString('pt-BR')}
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-imi-50 space-y-3">
                                        <div className="flex gap-3">
                                            <MapPin size={16} className="text-imi-400 shrink-0 mt-1" />
                                            <p className="text-xs font-bold text-imi-700 leading-relaxed">
                                                {request.property_address || 'Endereço não especificado'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 ml-7">
                                            <Badge variant="neutral" size="sm">{request.property_city}</Badge>
                                            <span className="text-xs font-black text-imi-300">/</span>
                                            <Badge variant="neutral" size="sm">{request.property_state}</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Timeline do Processo */}
                    <Card>
                        <CardHeader title="Ciclo da Operação" icon={<Calendar size={18} className="text-imi-400" />} />
                        <CardBody className="p-6">
                            <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-imi-100">
                                <div className="relative flex flex-col items-start">
                                    <div className="absolute -left-[22px] w-4 h-4 rounded-full bg-accent-500 border-4 border-white shadow-sm ring-1 ring-accent-500/20" />
                                    <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-1">
                                        {new Date(request.created_at).toLocaleString('pt-BR')}
                                    </p>
                                    <p className="text-sm font-bold text-imi-900">Protocolo de Entrada</p>
                                    <p className="text-xs text-imi-500">Solicitação inicial enviada pelo consultor.</p>
                                </div>

                                {request.updated_at !== request.created_at && (
                                    <div className="relative flex flex-col items-start">
                                        <div className="absolute -left-[22px] w-4 h-4 rounded-full bg-imi-400 border-4 border-white shadow-sm" />
                                        <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-1">
                                            {new Date(request.updated_at).toLocaleString('pt-BR')}
                                        </p>
                                        <p className="text-sm font-bold text-imi-900">Última Atualização</p>
                                        <p className="text-xs text-imi-500">Mudança de status ou notas técnicas.</p>
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Modal: Gestão Estratégica de Status */}
            <Modal
                open={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                size="md"
            >
                <ModalHeader title="Efetivar Mudança de Status" subtitle="Analise os critérios de crédito antes de confirmar" />
                <ModalBody className="p-8">
                    <div className="space-y-8">
                        <Select
                            label="Novo Posicionamento no Pipeline"
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="h-14 font-bold"
                            options={[
                                { value: 'pending', label: 'Pendente - Aguardando Documentos' },
                                { value: 'analyzing', label: 'Em Análise Técnico-Bancária' },
                                { value: 'approved', label: 'Aprovado - Carta Emitida' },
                                { value: 'rejected', label: 'Rejeitado / Restrição Detectada' },
                            ]}
                        />

                        <Textarea
                            label="Observações do Analista (Registro Auditável)"
                            value={statusNotes}
                            onChange={(e) => setStatusNotes(e.target.value)}
                            rows={4}
                            placeholder="Descreva o motivo da aprovação ou os pontos de atenção detectados na análise de crédito..."
                            className="bg-imi-50/30"
                        />

                        <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                            <p className="text-xs font-bold text-yellow-700 flex items-center gap-2">
                                <Clock size={14} /> Confirmação de Governança
                            </p>
                            <p className="text-xs text-yellow-600 mt-2">
                                A mudança de status para **Aprovado** ou **Rejeitado** enviará automaticamente um protocolo de atualização para o e-mail do cliente proponente.
                            </p>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter className="bg-imi-50/50 p-8">
                    <Button variant="outline" onClick={() => setShowStatusModal(false)} className="h-14 px-8 border-imi-200">
                        Cancelar Operação
                    </Button>
                    <Button onClick={handleUpdateStatus} loading={isUpdating} className="h-14 px-12 shadow-glow">
                        Confirmar e Notificar
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}
