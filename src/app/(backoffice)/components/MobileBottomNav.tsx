'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard,
    Building2,
    Users,
    Menu,
    X,
    Building,
    FileText,
    CreditCard,
    MessageSquare,
    Megaphone,
    BookOpen,
    Link2,
    FileBarChart,
    Calendar,
    Zap,
    Globe,
    Settings,
} from 'lucide-react'

const mainNav = [
    { name: 'Dashboard', href: '/backoffice/dashboard', icon: LayoutDashboard },
    { name: 'Imóveis', href: '/backoffice/imoveis', icon: Building2 },
    { name: 'Leads', href: '/backoffice/leads', icon: Users },
]

const drawerSections = [
    {
        category: 'Operações',
        items: [
            { name: 'Imóveis', href: '/backoffice/imoveis', icon: Building2 },
            { name: 'Leads', href: '/backoffice/leads', icon: Users },
            { name: 'Construtoras', href: '/backoffice/construtoras', icon: Building },
            { name: 'Consultorias', href: '/backoffice/consultoria', icon: MessageSquare },
        ],
    },
    {
        category: 'Serviços',
        items: [
            { name: 'Avaliações', href: '/backoffice/avaliacoes', icon: FileText },
            { name: 'Crédito', href: '/backoffice/credito', icon: CreditCard },
        ],
    },
    {
        category: 'Marketing',
        items: [
            { name: 'Campanhas', href: '/backoffice/campanhas', icon: Megaphone },
            { name: 'Conteúdo', href: '/backoffice/conteudos', icon: BookOpen },
            { name: 'Tracking', href: '/backoffice/tracking', icon: Link2 },
        ],
    },
    {
        category: 'Gestão',
        items: [
            { name: 'Relatórios', href: '/backoffice/relatorios', icon: FileBarChart },
            { name: 'Agenda', href: '/backoffice/agenda', icon: Calendar },
            { name: 'Automações', href: '/backoffice/automacoes', icon: Zap },
            { name: 'Integrações', href: '/backoffice/integracoes', icon: Globe },
        ],
    },
    {
        category: 'Sistema',
        items: [
            { name: 'Configurações', href: '/backoffice/settings', icon: Settings },
        ],
    },
]

export default function MobileBottomNav() {
    const pathname = usePathname()
    const [showDrawer, setShowDrawer] = useState(false)

    const isActive = (href: string) => {
        if (href === '/backoffice/dashboard') {
            return pathname === href
        }
        return pathname.startsWith(href)
    }

    return (
        <>
            {/* Bottom Navigation Bar */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-imi-100 safe-area-bottom">
                <div className="grid grid-cols-4 h-16">
                    {/* Main Nav Items */}
                    {mainNav.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                  flex flex-col items-center justify-center gap-1
                  transition-colors duration-200
                  ${active ? 'text-accent-600' : 'text-imi-600'}
                `}
                            >
                                <Icon size={20} className={active ? 'text-accent-600' : 'text-imi-600'} />
                                <span className="text-[10px] font-medium">{item.name}</span>
                                {active && (
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-accent-500 rounded-t-full" />
                                )}
                            </Link>
                        )
                    })}

                    {/* Menu Button */}
                    <button
                        onClick={() => setShowDrawer(true)}
                        className="flex flex-col items-center justify-center gap-1 text-imi-600"
                    >
                        <Menu size={20} />
                        <span className="text-[10px] font-medium">Menu</span>
                    </button>
                </div>
            </nav>

            {/* Drawer Overlay */}
            {showDrawer && (
                <>
                    {/* Backdrop */}
                    <div
                        className="lg:hidden fixed inset-0 bg-imi-900/50 backdrop-blur-sm z-50 animate-fade-in"
                        onClick={() => setShowDrawer(false)}
                    />

                    {/* Drawer Panel */}
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] animate-slide-up">
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-imi-100">
                                <div className="flex items-center gap-3">
                                    <div className="text-lg font-bold text-imi-900">IMI</div>
                                    <div>
                                        <div className="text-[10px] font-medium text-imi-600 uppercase tracking-wider leading-tight">
                                            Inteligência
                                        </div>
                                        <div className="text-[10px] font-medium text-imi-600 uppercase tracking-wider leading-tight -mt-0.5">
                                            Imobiliária
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowDrawer(false)}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-imi-700 hover:bg-imi-100 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Navigation */}
                            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin">
                                {/* Dashboard */}
                                <div>
                                    <Link
                                        href="/backoffice/dashboard"
                                        onClick={() => setShowDrawer(false)}
                                        className={`
                      flex items-center gap-3 h-12 px-4 rounded-xl
                      text-sm font-medium transition-all duration-200
                      ${isActive('/backoffice/dashboard')
                                                ? 'bg-accent-50 text-accent-700 border-l-4 border-accent-500 pl-3'
                                                : 'text-imi-700 hover:bg-imi-50'
                                            }
                    `}
                                    >
                                        <LayoutDashboard size={20} />
                                        <span>Dashboard</span>
                                    </Link>
                                </div>

                                {/* Categorias */}
                                {drawerSections.map((section) => (
                                    <div key={section.category}>
                                        <div className="px-4 mb-2">
                                            <h3 className="text-xs font-bold text-imi-500 uppercase tracking-wider">
                                                {section.category}
                                            </h3>
                                        </div>
                                        <div className="space-y-1">
                                            {section.items.map((item) => {
                                                const Icon = item.icon
                                                const active = isActive(item.href)

                                                return (
                                                    <Link
                                                        key={item.name}
                                                        href={item.href}
                                                        onClick={() => setShowDrawer(false)}
                                                        className={`
                              flex items-center gap-3 h-12 px-4 rounded-xl
                              text-sm font-medium transition-all duration-200
                              ${active
                                                                ? 'bg-accent-50 text-accent-700 border-l-4 border-accent-500 pl-3'
                                                                : 'text-imi-700 hover:bg-imi-50'
                                                            }
                            `}
                                                    >
                                                        <Icon size={20} />
                                                        <span>{item.name}</span>
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </nav>

                            {/* Footer */}
                            <div className="p-4 border-t border-imi-100">
                                <div className="px-4 py-3 bg-imi-50 rounded-xl">
                                    <p className="text-xs font-medium text-imi-700 mb-1">
                                        Iule Miranda
                                    </p>
                                    <p className="text-[10px] text-accent-600 font-medium">
                                        CRECI 17933 | CNAI 53290
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
