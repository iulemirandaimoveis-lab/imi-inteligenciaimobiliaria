'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard,
    Building2,
    Users,
    Building,
    FileText,
    CreditCard,
    MessageSquare,
    TrendingUp,
    FileBarChart,
    Calendar,
    Settings,
    Zap,
    Globe,
    Link2,
    Megaphone,
    BookOpen,
} from 'lucide-react'

const navigation = [
    { name: 'Dashboard', href: '/backoffice/dashboard', icon: LayoutDashboard },

    // Operações Core
    {
        category: 'Operações',
        items: [
            { name: 'Imóveis', href: '/backoffice/imoveis', icon: Building2, badge: null },
            { name: 'Leads', href: '/backoffice/leads', icon: Users, badge: 'new' },
            { name: 'Construtoras', href: '/backoffice/construtoras', icon: Building },
            { name: 'Consultorias', href: '/backoffice/consultoria', icon: MessageSquare },
        ]
    },

    // Serviços
    {
        category: 'Serviços',
        items: [
            { name: 'Avaliações', href: '/backoffice/avaliacoes', icon: FileText },
            { name: 'Crédito', href: '/backoffice/credito', icon: CreditCard },
        ]
    },

    // Marketing
    {
        category: 'Marketing',
        items: [
            { name: 'Campanhas', href: '/backoffice/campanhas', icon: Megaphone },
            { name: 'Conteúdo', href: '/backoffice/conteudos', icon: BookOpen },
            { name: 'Tracking', href: '/backoffice/tracking', icon: Link2 },
        ]
    },

    // Gestão
    {
        category: 'Gestão',
        items: [
            { name: 'Relatórios', href: '/backoffice/relatorios', icon: FileBarChart },
            { name: 'Agenda', href: '/backoffice/agenda', icon: Calendar },
            { name: 'Automações', href: '/backoffice/automacoes', icon: Zap },
            { name: 'Integrações', href: '/backoffice/integracoes', icon: Globe },
        ]
    },

    // Sistema
    {
        category: 'Sistema',
        items: [
            { name: 'Configurações', href: '/backoffice/settings', icon: Settings },
        ]
    },
]

export default function DesktopSidebar() {
    const pathname = usePathname()

    const isActive = (href: string) => {
        if (href === '/backoffice/dashboard') {
            return pathname === href
        }
        return pathname.startsWith(href)
    }

    return (
        <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 lg:border-r lg:border-imi-100 lg:bg-white">
            {/* Logo */}
            <div className="flex items-center gap-3 h-16 px-6 border-b border-imi-100">
                <div className="flex items-center gap-3">
                    <div className="text-xl font-bold text-imi-900">IMI</div>
                    <div>
                        <div className="text-[10px] font-medium text-imi-600 uppercase tracking-wider leading-tight">
                            Inteligência
                        </div>
                        <div className="text-[10px] font-medium text-imi-600 uppercase tracking-wider leading-tight -mt-0.5">
                            Imobiliária
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
                {/* Dashboard */}
                <div>
                    <Link
                        href="/backoffice/dashboard"
                        className={`
              flex items-center gap-3 h-12 px-3 rounded-xl
              text-sm font-medium transition-all duration-200
              ${isActive('/backoffice/dashboard')
                                ? 'bg-accent-50 text-accent-700 border-l-4 border-accent-500 pl-[8px]'
                                : 'text-imi-700 hover:bg-imi-50 hover:text-imi-900'
                            }
            `}
                    >
                        <LayoutDashboard size={20} className="flex-shrink-0" />
                        <span>Dashboard</span>
                    </Link>
                </div>

                {/* Categorias */}
                {navigation.slice(1).map((section) => (
                    <div key={section.category}>
                        <div className="px-3 mb-2">
                            <h3 className="text-xs font-bold text-imi-500 uppercase tracking-wider">
                                {section.category}
                            </h3>
                        </div>
                        <div className="space-y-1">
                            {section.items?.map((item) => {
                                const Icon = item.icon
                                const active = isActive(item.href)

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`
                      flex items-center gap-3 h-12 px-3 rounded-xl
                      text-sm font-medium transition-all duration-200
                      ${active
                                                ? 'bg-accent-50 text-accent-700 border-l-4 border-accent-500 pl-[8px]'
                                                : 'text-imi-700 hover:bg-imi-50 hover:text-imi-900'
                                            }
                    `}
                                    >
                                        <Icon size={20} className="flex-shrink-0" />
                                        <span className="flex-1">{item.name}</span>
                                        {item.badge && (
                                            <span className="px-2 py-0.5 text-[10px] font-bold bg-accent-500 text-white rounded-full uppercase">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-imi-100">
                <div className="px-3 py-2 bg-imi-50 rounded-xl">
                    <p className="text-xs font-medium text-imi-700 mb-1">
                        Iule Miranda
                    </p>
                    <p className="text-[10px] text-accent-600 font-medium">
                        CRECI 17933 | CNAI 53290
                    </p>
                </div>
            </div>
        </aside>
    )
}
