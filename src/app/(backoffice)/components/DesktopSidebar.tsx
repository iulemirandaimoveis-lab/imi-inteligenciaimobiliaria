'use client'
// NAVIGATION_VERSION: v2.0.1 - ADDED FINANCEIRO & PROJETOS

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
    Banknote,
    FolderOpen,
} from 'lucide-react'

const navigation = [
    // Principal
    {
        name: 'Dashboard',
        href: '/backoffice/dashboard',
        icon: LayoutDashboard,
        group: 'principal',
    },
    // Operações
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
    // Marketing
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
    // Financeiro
    {
        name: 'Financeiro',
        href: '/backoffice/financeiro',
        icon: Banknote,
        group: 'financeiro',
    },
    {
        name: 'Projetos',
        href: '/backoffice/projetos',
        icon: FolderOpen,
        group: 'financeiro',
    },
    // Gestão
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
    // Sistema
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
    operacoes: 'Operações Hub',
    marketing: 'Marketing & IA',
    financeiro: 'Financeiro & Projetos',
    gestao: 'Gestão & Dashboards',
    sistema: 'Configuração Geral',
}

export function DesktopSidebar() {
    const pathname = usePathname()

    return (
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-imi-900 px-6 pb-4">
                {/* Logo */}
                <div className="flex h-16 shrink-0 items-center">
                    <Link href="/backoffice/dashboard" className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500">
                            <span className="text-sm font-bold text-imi-900">IMI</span>
                        </div>
                        <span className="text-lg font-bold text-white">Atlantis</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                        {Object.entries(groups).map(([key, label]) => (
                            <li key={key}>
                                <div className="text-xs font-semibold uppercase tracking-wider text-imi-400 mb-2">
                                    {label}
                                </div>
                                <ul role="list" className="-mx-2 space-y-0.5">
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
                                                                ? 'bg-white/10 text-white'
                                                                : 'text-imi-300 hover:text-white hover:bg-white/5'
                                                            }
                                                        `}
                                                    >
                                                        <item.icon
                                                            className={`h-5 w-5 shrink-0 ${isActive ? 'text-accent-400' : 'text-imi-400 group-hover:text-accent-400'}`}
                                                            aria-hidden="true"
                                                        />
                                                        {item.name}
                                                        {isActive && (
                                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-400 self-center" />
                                                        )}
                                                    </Link>
                                                </li>
                                            )
                                        })}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Footer */}
                <div className="border-t border-imi-800 pt-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center text-xs font-bold text-imi-900">
                            IM
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">Iule Miranda</p>
                            <p className="text-xs text-imi-400 truncate">Admin</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
