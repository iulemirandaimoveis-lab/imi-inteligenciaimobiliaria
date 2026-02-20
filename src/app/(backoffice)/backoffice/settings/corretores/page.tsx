'use client'

import React, { useState } from 'react'
import PageHeader from '@/components/backoffice/PageHeader'
import { UserCircle, Search, Filter, Plus, Shield, CheckCircle, XCircle, MoreVertical } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/backoffice/EmptyState'
import Link from 'next/link'
import { useBrokers, updateBrokerStatus } from '@/hooks/use-brokers'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function CorretoresPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const { brokers, isLoading, mutate } = useBrokers({ search: searchTerm, status: statusFilter })

    const handleStatusToggle = async (id: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
            await updateBrokerStatus(id, newStatus)
            toast.success(`Corretor ${newStatus === 'active' ? 'ativado' : 'inativado'} com sucesso`)
            mutate()
        } catch (error) {
            toast.error('Erro ao atualizar status')
        }
    }

    const activeBrokers = brokers.filter(b => b.status === 'active').length
    const inactiveBrokers = brokers.filter(b => b.status === 'inactive').length

    return (
        <div className="space-y-8 animate-fade-in custom-scrollbar pb-20">
            <PageHeader
                title="Gestão de Corretores"
                description="Controle de acesso, permições e desempenho da equipe comercial."
                breadcrumbs={[
                    { label: 'Configurações', href: '/backoffice/settings' },
                    { label: 'Corretores' }
                ]}
                action={
                    <Link href="/backoffice/settings/corretores/novo">
                        <Button icon={<Plus size={18} />}>Novo Corretor</Button>
                    </Link>
                }
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card padding="md" className="flex items-center justify-between bg-white dark:bg-card-dark border-gray-100 dark:border-white/5">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Registrados</p>
                        <p className="text-3xl font-display font-bold text-gray-900 dark:text-white mt-1">{brokers.length}</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-xl text-primary"><UserCircle size={24} /></div>
                </Card>
                <Card padding="md" className="flex items-center justify-between bg-white dark:bg-card-dark border-gray-100 dark:border-white/5">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Ativos</p>
                        <p className="text-3xl font-display font-bold text-green-600 mt-1">{activeBrokers}</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-xl text-green-600"><CheckCircle size={24} /></div>
                </Card>
                <Card padding="md" className="flex items-center justify-between bg-white dark:bg-card-dark border-gray-100 dark:border-white/5">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Inativos</p>
                        <p className="text-3xl font-display font-bold text-gray-400 mt-1">{inactiveBrokers}</p>
                    </div>
                    <div className="p-3 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-400"><XCircle size={24} /></div>
                </Card>
            </div>

            {/* Filters & List */}
            <div className="bg-white dark:bg-card-dark rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50 dark:bg-card-darker/50">
                    <div className="relative w-full md:w-96">
                        <Input
                            placeholder="Buscar por nome, email ou CRECI..."
                            leftIcon={<Search size={18} />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white dark:bg-card-dark border-gray-200 dark:border-white/10"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === 'all' ? 'bg-white dark:bg-white/10 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setStatusFilter('active')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === 'active' ? 'bg-white dark:bg-white/10 text-green-600 shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                        >
                            Ativos
                        </button>
                        <button
                            onClick={() => setStatusFilter('inactive')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === 'inactive' ? 'bg-white dark:bg-white/10 text-gray-400 shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                        >
                            Inativos
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : brokers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-white/5 text-xs text-gray-400 uppercase tracking-wider">
                                    <th className="p-6 font-bold">Corretor</th>
                                    <th className="p-6 font-bold">Contato</th>
                                    <th className="p-6 font-bold">CRECI</th>
                                    <th className="p-6 font-bold">Status</th>
                                    <th className="p-6 font-bold">Permissões</th>
                                    <th className="p-6 font-bold text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {brokers.map((broker) => (
                                    <tr key={broker.id} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {broker.avatar_url ? (
                                                        <img src={broker.avatar_url} alt={broker.name} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        broker.name.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{broker.name}</p>
                                                    <p className="text-xs text-gray-500">Cadastrado em {format(new Date(broker.created_at), 'dd/MM/yyyy')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                                <p>{broker.email}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{broker.phone || '-'}</p>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="font-mono text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded">
                                                {broker.creci}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <Badge variant={broker.status === 'active' ? 'success' : 'default'} size="sm">
                                                {broker.status === 'active' ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <Shield size={16} className="text-gray-400" />
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                    {broker.permissions?.length || 0} módulos
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <button
                                                onClick={() => handleStatusToggle(broker.id, broker.status)}
                                                className="text-gray-400 hover:text-primary transition-colors p-2"
                                                title={broker.status === 'active' ? 'Desativar' : 'Ativar'}
                                            >
                                                {broker.status === 'active' ? <XCircle size={20} /> : <CheckCircle size={20} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
                        <EmptyState
                            icon={UserCircle}
                            title="Nenhum corretor encontrado"
                            description={searchTerm ? "Tente ajustar os termos da busca." : "Comece cadastrando sua equipe comercial."}
                            action={
                                !searchTerm && (
                                    <Link href="/backoffice/settings/corretores/novo">
                                        <Button variant="primary" icon={<Plus size={18} />}>Cadastrar Primeiro Corretor</Button>
                                    </Link>
                                )
                            }
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
