'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard,
    Building2,
    Users,
    FileText,
    DollarSign,
    Briefcase,
    Target,
    FileEdit,
    Activity,
    BarChart3,
    Lightbulb,
    Settings,
    Layers,
    MessageSquare,
    Bell,
} from 'lucide-react'

const navigation = [
    {
        name: 'Dashboard',
        href: '/backoffice/dashboard',
        icon: LayoutDashboard,
        group: 'principal',
    },
    {
        name: 'Imóveis',
        href: '/backoffice/imoveis',
        icon: Building2,
        group: 'operacoes',
    },
    {
        name: 'Leads',
        href: '/backoffice/leads',
        icon: Users,
        group: 'operacoes',
    },
    {
        name: 'Avaliações',
        href: '/backoffice/avaliacoes',
        icon: FileText,
        group: 'operacoes',
    },
    {
        name: 'Crédito',
        href: '/backoffice/credito',
        icon: DollarSign,
        group: 'operacoes',
    },
    {
        name: 'Consultoria',
        href: '/backoffice/consultoria',
        icon: Briefcase,
        group: 'operacoes',
    },
    {
        name: 'Construtoras',
        href: '/backoffice/construtoras',
        icon: Building2,
        group: 'operacoes',
    },
    {
        name: 'Equipe',
        href: '/backoffice/equipe',
        icon: Users,
        group: 'operacoes',
    },
    {
        name: 'Campanhas',
        href: '/backoffice/campanhas',
        icon: Target,
        group: 'marketing',
    },
    {
        name: 'Conteúdo',
        href: '/backoffice/conteudos',
        icon: FileEdit,
        group: 'marketing',
    },
    {
        name: 'Tracking',
        href: '/backoffice/tracking',
        icon: Activity,
        group: 'marketing',
    },
    {
        name: 'Relatórios',
        href: '/backoffice/relatorios',
        icon: BarChart3,
        group: 'gestao',
    },
    {
        name: 'Playbooks',
        href: '/backoffice/playbooks',
        icon: Lightbulb,
        group: 'gestao',
    },
    {
        name: 'IA & Automação',
        href: '/backoffice/automacoes',
        icon: Lightbulb,
        group: 'sistema',
    },
    {
        name: 'Integrações',
        href: '/backoffice/integracoes',
        icon: Layers,
        group: 'sistema',
    },
    {
        name: 'WhatsApp',
        href: '/backoffice/whatsapp',
        icon: MessageSquare,
        group: 'sistema',
    },
    {
        name: 'Notificações',
        href: '/backoffice/notificacoes',
        icon: Bell,
        group: 'sistema',
    },
    {
        name: 'Configurações',
        href: '/backoffice/settings',
        icon: Settings,
        group: 'sistema',
    },
]

const groups = {
    principal: 'Principal',
    operacoes: 'Operações',
    marketing: 'Marketing',
    gestao: 'Gestão',
    sistema: 'Sistema',
}

export function DesktopSidebar() {
    const pathname = usePathname()

    return (
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
            <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
                {/* Logo */}
                <div className="flex h-16 shrink-0 items-center">
                    <Link href="/backoffice/dashboard" className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500">
                            <span className="text-sm font-bold text-white">IMI</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">Atlantis</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                        {Object.entries(groups).map(([key, label]) => (
                            <li key={key}>
                                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                                    {label}
                                </div>
                                <ul role="list" className="-mx-2 space-y-1">
                                    {navigation
                                        .filter((item) => item.group === key)
                                        .map((item) => {
                                            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                                            return (
                                                <li key={item.name}>
                                                    <Link
                                                        href={item.href}
                                                        className={`
                              group flex gap-x-3 rounded-lg p-2 text-sm font-medium leading-6 transition-colors
                              ${isActive
                                                                ? 'bg-accent-50 text-accent-600'
                                                                : 'text-gray-700 hover:text-accent-600 hover:bg-gray-50'
                                                            }
                            `}
                                                    >
                                                        <item.icon
                                                            className={`h-5 w-5 shrink-0 ${isActive ? 'text-accent-600' : 'text-gray-400 group-hover:text-accent-600'
                                                                }`}
                                                            aria-hidden="true"
                                                        />
                                                        {item.name}
                                                    </Link>
                                                </li>
                                            )
                                        })}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </div>
    )
}
