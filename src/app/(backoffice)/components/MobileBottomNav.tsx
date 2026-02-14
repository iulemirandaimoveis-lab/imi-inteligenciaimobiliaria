'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Building2,
    Users,
    Menu,
    X,
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

export default function MobileBottomNav() {
    const pathname = usePathname()
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    const quickNavItems = [
        { name: 'Dashboard', href: '/backoffice/backoffice/dashboard', icon: LayoutDashboard },
        { name: 'Imóveis', href: '/backoffice/backoffice/imoveis', icon: Building2 },
        { name: 'Leads', href: '/backoffice/backoffice/leads', icon: Users },
    ]

    return (
        <>
            {/* Bottom Navigation Bar */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 pb-safe">
                <div className="flex items-center justify-around h-16">
                    {quickNavItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="flex flex-col items-center justify-center flex-1 h-full relative"
                            >
                                <Icon
                                    size={20}
                                    className={`mb-1 ${isActive ? 'text-accent-600' : 'text-gray-500'
                                        }`}
                                />
                                <span
                                    className={`text-xs font-medium ${isActive ? 'text-accent-600' : 'text-gray-600'
                                        }`}
                                >
                                    {item.name}
                                </span>
                                {isActive && (
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-accent-500 rounded-t-full" />
                                )}
                            </Link>
                        )
                    })}

                    {/* Menu Button */}
                    <button
                        onClick={() => setIsDrawerOpen(true)}
                        className="flex flex-col items-center justify-center flex-1 h-full"
                    >
                        <Menu size={20} className="mb-1 text-gray-500" />
                        <span className="text-xs font-medium text-gray-600">Menu</span>
                    </button>
                </div>
            </nav>

            {/* Drawer Backdrop */}
            {isDrawerOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm"
                    onClick={() => setIsDrawerOpen(false)}
                />
            )}

            {/* Drawer */}
            <div
                className={`
          lg:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl
          transform transition-transform duration-300 ease-out
          ${isDrawerOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
                style={{ maxHeight: '85vh' }}
            >
                {/* Drawer Handle */}
                <div className="flex items-center justify-center pt-4 pb-2">
                    <div className="w-12 h-1 bg-gray-300 rounded-full" />
                </div>

                {/* Drawer Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-gray-900">IMI</span>
                        <div className="border-l border-gray-300 pl-3">
                            <div className="text-[9px] font-medium text-gray-600 uppercase tracking-wider leading-tight">
                                Inteligência
                            </div>
                            <div className="text-[9px] font-medium text-gray-600 uppercase tracking-wider leading-tight">
                                Imobiliária
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsDrawerOpen(false)}
                        className="p-2 -mr-2 rounded-full hover:bg-gray-100"
                    >
                        <X size={24} className="text-gray-600" />
                    </button>
                </div>

                {/* Drawer Navigation - SCROLLABLE */}
                <nav className="overflow-y-auto px-4 py-6" style={{ maxHeight: 'calc(85vh - 140px)' }}>
                    <div className="space-y-6">
                        {navigation.map((section) => (
                            <div key={section.category}>
                                <h3 className="mb-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    {section.category}
                                </h3>
                                <ul className="space-y-1">
                                    {section.items.map((item) => {
                                        const isActive = pathname === item.href
                                        const Icon = item.icon

                                        return (
                                            <li key={item.name}>
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setIsDrawerOpen(false)}
                                                    className={`
                            group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium
                            transition-all duration-200
                            ${isActive
                                                            ? 'bg-accent-50 text-accent-700 border-l-4 border-accent-500 pl-2.5'
                                                            : 'text-gray-700 active:bg-gray-50'
                                                        }
                          `}
                                                >
                                                    <Icon
                                                        size={20}
                                                        className={`
                              flex-shrink-0
                              ${isActive ? 'text-accent-600' : 'text-gray-400'}
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

                {/* Drawer Footer */}
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="text-center">
                        <p className="text-xs font-medium text-gray-900">Iule Miranda</p>
                        <p className="text-xs text-gray-500 mt-1">
                            <span className="text-accent-600 font-medium">CRECI 17933</span>
                            {' | '}
                            <span className="text-accent-600 font-medium">CNAI 53290</span>
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
