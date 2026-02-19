'use client'
// NAVIGATION_VERSION: v2.0.1 - ADDED FINANCEIRO & PROJETOS

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import {
    LayoutDashboard,
    Building2,
    Users,
    BarChart3,
    Menu,
    X,
    FileText,
    DollarSign,
    Briefcase,
    Target,
    FileEdit,
    Activity,
    Lightbulb,
    Settings,
    Layers,
    MessageSquare,
    Bell,
    Banknote,
    FolderOpen,
} from 'lucide-react'

const mainItems = [
    { name: 'Dashboard', href: '/backoffice/dashboard', icon: LayoutDashboard },
    { name: 'Imóveis', href: '/backoffice/imoveis', icon: Building2 },
    { name: 'Leads', href: '/backoffice/leads', icon: Users },
    { name: 'Relatórios', href: '/backoffice/relatorios', icon: BarChart3 },
]

const allItems = [
    {
        group: 'Principal',
        items: [
            { name: 'Dashboard', href: '/backoffice/dashboard', icon: LayoutDashboard },
        ],
    },
    {
        group: 'Operações Hub',
        items: [
            { name: 'Imóveis', href: '/backoffice/imoveis', icon: Building2 },
            { name: 'Leads', href: '/backoffice/leads', icon: Users },
            { name: 'Avaliações', href: '/backoffice/avaliacoes', icon: FileText },
            { name: 'Crédito', href: '/backoffice/credito', icon: DollarSign },
            { name: 'Consultoria', href: '/backoffice/consultoria', icon: Briefcase },
            { name: 'Construtoras', href: '/backoffice/construtoras', icon: Building2 },
            { name: 'Equipe', href: '/backoffice/equipe', icon: Users },
        ],
    },
    {
        group: 'Marketing & IA',
        items: [
            { name: 'Campanhas', href: '/backoffice/campanhas', icon: Target },
            { name: 'Conteúdo', href: '/backoffice/conteudos', icon: FileEdit },
            { name: 'Tracking', href: '/backoffice/tracking', icon: Activity },
        ],
    },
    {
        group: 'Financeiro & Projetos',
        items: [
            { name: 'Financeiro', href: '/backoffice/financeiro', icon: Banknote },
            { name: 'Projetos', href: '/backoffice/projetos', icon: FolderOpen },
        ],
    },
    {
        group: 'Gestão & Dashboards',
        items: [
            { name: 'Relatórios', href: '/backoffice/relatorios', icon: BarChart3 },
            { name: 'Playbooks', href: '/backoffice/playbooks', icon: Lightbulb },
        ],
    },
    {
        group: 'Configuração Geral',
        items: [
            { name: 'IA & Automação', href: '/backoffice/automacoes', icon: Lightbulb },
            { name: 'Integrações', href: '/backoffice/integracoes', icon: Layers },
            { name: 'WhatsApp', href: '/backoffice/whatsapp', icon: MessageSquare },
            { name: 'Notificações', href: '/backoffice/notificacoes', icon: Bell },
            { name: 'Configurações', href: '/backoffice/settings', icon: Settings },
        ],
    },
]


export function MobileBottomNav() {
    const pathname = usePathname()
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <>
            {/* Bottom Navigation Bar - Mobile Only */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200">
                <div className="flex items-center justify-around px-2 py-2">
                    {mainItems.slice(0, 3).map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors ${isActive ? 'text-accent-600' : 'text-gray-600'
                                    }`}
                            >
                                <item.icon className="h-6 w-6" />
                                <span className="text-xs mt-1 font-medium">{item.name}</span>
                            </Link>
                        )
                    })}

                    {/* Menu Button */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors ${menuOpen ? 'text-accent-600' : 'text-gray-600'
                            }`}
                    >
                        {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        <span className="text-xs mt-1 font-medium">Menu</span>
                    </button>
                </div>
            </div>

            {/* Full Menu Overlay - Mobile Only */}
            {menuOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-white overflow-y-auto pb-20">
                    <div className="p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500">
                                    <span className="text-sm font-bold text-white">IMI</span>
                                </div>
                                <span className="text-xl font-bold text-gray-900">Atlantis</span>
                            </div>
                            <button
                                onClick={() => setMenuOpen(false)}
                                className="p-2 rounded-lg hover:bg-gray-100"
                            >
                                <X className="h-6 w-6 text-gray-600" />
                            </button>
                        </div>

                        {/* Navigation Groups */}
                        <div className="space-y-8">
                            {allItems.map((group) => (
                                <div key={group.group}>
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                                        {group.group}
                                    </h3>
                                    <div className="space-y-1">
                                        {group.items.map((item) => {
                                            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                                            return (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    onClick={() => setMenuOpen(false)}
                                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                                        ? 'bg-accent-50 text-accent-600'
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <item.icon className="h-5 w-5" />
                                                    <span className="font-medium">{item.name}</span>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
