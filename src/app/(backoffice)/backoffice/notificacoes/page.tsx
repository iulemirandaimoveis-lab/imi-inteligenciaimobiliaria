'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    Filter,
    Calendar,
    User,
    Home,
    DollarSign,
    TrendingUp,
    FileText,
    AlertCircle,
    Info,
    CheckCircle,
} from 'lucide-react'

type NotificationType = 'lead' | 'property' | 'credit' | 'evaluation' | 'campaign' | 'system'
type NotificationPriority = 'high' | 'medium' | 'low'

interface Notification {
    id: string
    type: NotificationType
    priority: NotificationPriority
    title: string
    message: string
    timestamp: string
    read: boolean
    actionUrl?: string
}

const mockNotifications: Notification[] = [
    {
        id: '1',
        type: 'lead',
        priority: 'high',
        title: 'Novo Lead Qualificado',
        message: 'Maria Santos (Score 18/20) demonstrou interesse em apartamento de 3 quartos em Boa Viagem',
        timestamp: '2026-02-15T18:30:00',
        read: false,
        actionUrl: '/backoffice/leads/1',
    },
    {
        id: '2',
        type: 'credit',
        priority: 'high',
        title: 'Crédito Aprovado',
        message: 'Financiamento de Carlos Silva foi aprovado pela Caixa. Valor: R$ 544.000',
        timestamp: '2026-02-15T16:45:00',
        read: false,
        actionUrl: '/backoffice/credito/1',
    },
    {
        id: '3',
        type: 'evaluation',
        priority: 'medium',
        title: 'Laudo Concluído',
        message: 'Avaliação técnica AVL-2026-001 foi finalizada e está disponível para download',
        timestamp: '2026-02-15T14:20:00',
        read: false,
        actionUrl: '/backoffice/avaliacoes/1',
    },
    {
        id: '4',
        type: 'campaign',
        priority: 'medium',
        title: 'Meta de Campanha Atingida',
        message: 'Campanha "Reserva Atlantis - Instagram" atingiu 50 leads (100% da meta)',
        timestamp: '2026-02-15T12:10:00',
        read: true,
        actionUrl: '/backoffice/campanhas/1/analytics',
    },
    {
        id: '5',
        type: 'property',
        priority: 'low',
        title: 'Novo Empreendimento Publicado',
        message: 'Empreendimento "Vista Mar Residence" foi publicado com sucesso',
        timestamp: '2026-02-15T10:00:00',
        read: true,
        actionUrl: '/backoffice/imoveis/1',
    },
    {
        id: '6',
        type: 'system',
        priority: 'low',
        title: 'Atualização do Sistema',
        message: 'Nova versão disponível com melhorias de performance e correções',
        timestamp: '2026-02-15T08:00:00',
        read: true,
    },
]

export default function NotificacoesPage() {
    const router = useRouter()
    const [notifications, setNotifications] = useState(mockNotifications)
    const [filter, setFilter] = useState<'all' | 'unread'>('all')
    const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all')

    const getTypeIcon = (type: NotificationType) => {
        const icons = {
            lead: User,
            property: Home,
            credit: DollarSign,
            evaluation: FileText,
            campaign: TrendingUp,
            system: Info,
        }
        return icons[type]
    }

    const getTypeColor = (type: NotificationType) => {
        const colors = {
            lead: 'bg-blue-100 text-blue-600',
            property: 'bg-green-100 text-green-600',
            credit: 'bg-purple-100 text-purple-600',
            evaluation: 'bg-orange-100 text-orange-600',
            campaign: 'bg-pink-100 text-pink-600',
            system: 'bg-gray-100 text-gray-600',
        }
        return colors[type]
    }

    const getPriorityBadge = (priority: NotificationPriority) => {
        const badges = {
            high: { label: 'Alta', color: 'bg-red-100 text-red-700' },
            medium: { label: 'Média', color: 'bg-yellow-100 text-yellow-700' },
            low: { label: 'Baixa', color: 'bg-gray-100 text-gray-600' },
        }
        return badges[priority]
    }

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 60) return `${minutes}m atrás`
        if (hours < 24) return `${hours}h atrás`
        if (days < 7) return `${days}d atrás`
        return date.toLocaleDateString('pt-BR')
    }

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        )
    }

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id)
        if (notification.actionUrl) {
            router.push(notification.actionUrl)
        }
    }

    const filteredNotifications = notifications
        .filter(n => filter === 'all' || !n.read)
        .filter(n => typeFilter === 'all' || n.type === typeFilter)

    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        {unreadCount} não lida{unreadCount !== 1 ? 's' : ''} de {notifications.length} total
                    </p>
                </div>

                <button
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className="flex items-center gap-2 h-10 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <CheckCheck size={18} />
                    Marcar todas como lidas
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Filtros:</span>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Todas ({notifications.length})
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'unread'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Não lidas ({unreadCount})
                        </button>
                    </div>

                    <div className="h-6 w-px bg-gray-200" />

                    {/* Type Filter */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as NotificationType | 'all')}
                        className="h-10 px-4 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="all">Todos os tipos</option>
                        <option value="lead">Leads</option>
                        <option value="property">Imóveis</option>
                        <option value="credit">Crédito</option>
                        <option value="evaluation">Avaliações</option>
                        <option value="campaign">Campanhas</option>
                        <option value="system">Sistema</option>
                    </select>
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                        <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            Nenhuma notificação
                        </h3>
                        <p className="text-sm text-gray-600">
                            {filter === 'unread'
                                ? 'Você está em dia! Não há notificações não lidas.'
                                : 'Não há notificações para exibir.'}
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map((notification) => {
                        const TypeIcon = getTypeIcon(notification.type)
                        const typeColor = getTypeColor(notification.type)
                        const priorityBadge = getPriorityBadge(notification.priority)

                        return (
                            <div
                                key={notification.id}
                                className={`bg-white rounded-2xl p-6 border transition-all ${notification.read
                                        ? 'border-gray-100'
                                        : 'border-blue-200 bg-blue-50/30'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl ${typeColor} flex items-center justify-center flex-shrink-0`}>
                                        <TypeIcon size={24} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-base font-bold text-gray-900">
                                                    {notification.title}
                                                </h3>
                                                {!notification.read && (
                                                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                                                )}
                                            </div>
                                            <span className={`px-3 py-1 ${priorityBadge.color} rounded-lg text-xs font-medium flex-shrink-0`}>
                                                {priorityBadge.label}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-700 mb-3">
                                            {notification.message}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Calendar size={14} />
                                                {formatTimestamp(notification.timestamp)}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {!notification.read && (
                                                    <button
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Check size={14} />
                                                        Marcar como lida
                                                    </button>
                                                )}
                                                {notification.actionUrl && (
                                                    <button
                                                        onClick={() => handleNotificationClick(notification)}
                                                        className="h-8 px-3 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                                    >
                                                        Ver detalhes
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteNotification(notification.id)}
                                                    className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
