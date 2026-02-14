'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Building2,
    Users,
    FileText,
    CreditCard,
    MessageSquare,
    Megaphone,
    BarChart3,
    Settings,
    Link2,
    Calendar,
    FolderKanban,
    Sparkles,
} from 'lucide-react'

const navigation = [
    {
        category: 'Principal',
        items: [
            { name: 'Dashboard', href: '/backoffice/backoffice/dashboard', icon: LayoutDashboard },
        ],
    },
    {
        category: 'Operações',
        items: [
            { name: 'Imóveis', href: '/backoffice/backoffice/imoveis', icon: Building2 },
            { name: 'Leads', href: '/backoffice/backoffice/leads', icon: Users },
            { name: 'Avaliações', href: '/backoffice/backoffice/avaliacoes', icon: FileText },
            { name: 'Crédito', href: '/backoffice/backoffice/credito', icon: CreditCard },
        ],
    },
    {
        category: 'Serviços',
        items: [
            { name: 'Consultorias', href: '/backoffice/backoffice/consultoria', icon: MessageSquare },
        ],
    },
    {
        category: 'Marketing',
        items: [
            { name: 'Campanhas', href: '/backoffice/backoffice/campanhas', icon: Megaphone },
            { name: 'Conteúdo', href: '/backoffice/backoffice/conteudos', icon: Calendar },
            { name: 'Tracking', href: '/backoffice/backoffice/tracking', icon: Link2 },
        ],
    },
    {
        category: 'Gestão',
        items: [
            { name: 'Relatórios', href: '/backoffice/backoffice/relatorios', icon: BarChart3 },
            { name: 'Projetos', href: '/backoffice/backoffice/playbooks', icon: FolderKanban },
        ],
    },
    {
        category: 'Sistema',
        items: [
            { name: 'IA & Automação', href: '/backoffice/backoffice/automacoes', icon: Sparkles },
            { name: 'Configurações', href: '/backoffice/backoffice/settings', icon: Settings },
        ],
    },
]

export default function DesktopSidebar() {
    const pathname = usePathname()

    return (
        <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-white border-r border-gray-200">
            {/* Logo Header - Fixed */}
            <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-900">IMI</span>
                    <div className="border-l border-gray-300 pl-3">
                        <div className="text-[10px] font-medium text-gray-600 uppercase tracking-wider leading-tight">
                            Inteligência
                        </div>
                        <div className="text-[10px] font-medium text-gray-600 uppercase tracking-wider leading-tight">
                            Imobiliária
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation - Scrollable */}
            <nav className="flex-1 overflow-y-auto px-4 py-6">
                <div className="space-y-8">
                    {navigation.map((section) => (
                        <div key={section.category}>
                            <h3 className="mb-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                {section.category}
                            </h3>
                            <ul className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                                    const Icon = item.icon

                                    return (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                className={`
                          group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                          transition-all duration-200
                          ${isActive
                                                        ? 'bg-accent-50 text-accent-700 border-l-4 border-accent-500 pl-2.5'
                                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                                    }
                        `}
                                            >
                                                <Icon
                                                    size={20}
                                                    className={`
                            flex-shrink-0
                            ${isActive ? 'text-accent-600' : 'text-gray-400 group-hover:text-gray-600'}
                          `}
                                                />
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            </nav>

            {/* Footer Credentials - Fixed */}
            <div className="shrink-0 border-t border-gray-200 p-4">
                <div className="text-center">
                    <p className="text-xs font-medium text-gray-900">Iule Miranda</p>
                    <p className="text-xs text-gray-500 mt-1">
                        <span className="text-accent-600 font-medium">CRECI 17933</span>
                        {' | '}
                        <span className="text-accent-600 font-medium">CNAI 53290</span>
                    </p>
                </div>
            </div>
        </aside>
    )
}
