'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Building2,
    Users,
    Plus,
    MoreHorizontal,
    X,
    Sparkles,
    Calendar,
    Zap,
    BarChart3,
    TrendingUp,
    FileText,
    CreditCard,
    Phone,
    Clock,
    PieChart,
    Shield,
    Layers,
    MessageSquare,
    Settings,
    UserCircle,
    Lock,
    ScrollText,
    MousePointerClick,
    Megaphone
} from 'lucide-react'

const mainItems = [
    { label: 'Dashboard', href: '/backoffice/dashboard', icon: LayoutDashboard },
    { label: 'Imóveis', href: '/backoffice/imoveis', icon: Building2 },
    { label: 'Leads', href: '/backoffice/leads', icon: Users },
]

const expandedMenu = [
    {
        group: 'Operação',
        items: [
            { label: 'Dashboard', href: '/backoffice/dashboard', icon: LayoutDashboard },
            { label: 'Imóveis', href: '/backoffice/imoveis', icon: Building2 },
            { label: 'Construtoras', href: '/backoffice/construtoras', icon: Building2 },
            { label: 'Leads', href: '/backoffice/leads', icon: Users },
            { label: 'Pipeline', href: '/backoffice/leads/pipeline', icon: TrendingUp },
            { label: 'Tracking', href: '/backoffice/tracking', icon: MousePointerClick },
        ]
    },
    {
        group: 'Marketing',
        items: [
            { label: 'Conteúdo', href: '/backoffice/conteudo', icon: FileText },
            { label: 'Calendário', href: '/backoffice/conteudo/calendario', icon: Calendar },
            { label: 'Automação IA', href: '/backoffice/conteudo/automacao', icon: Sparkles },
            { label: 'Campanhas', href: '/backoffice/campanhas', icon: Megaphone },
        ]
    },
    {
        group: 'Comercial',
        items: [
            { label: 'Avaliações', href: '/backoffice/avaliacoes', icon: FileText },
            { label: 'Crédito', href: '/backoffice/credito', icon: CreditCard },
            { label: 'Consultorias', href: '/backoffice/consultorias', icon: Phone },
            { label: 'Agenda', href: '/backoffice/agenda', icon: Clock },
        ]
    },
    {
        group: 'Sistema',
        items: [
            { label: 'Relatórios', href: '/backoffice/relatorios', icon: PieChart },
            { label: 'Audit Trail', href: '/backoffice/relatorios/audit', icon: Shield },
            { label: 'Integrações', href: '/backoffice/integracoes', icon: Layers },
            { label: 'WhatsApp', href: '/backoffice/whatsapp', icon: MessageSquare },
            { label: 'Configurações', href: '/backoffice/settings', icon: Settings },
            { label: 'Corretores', href: '/backoffice/settings/corretores', icon: UserCircle },
            { label: 'Usuários', href: '/backoffice/settings/usuarios', icon: UserCircle },
            { label: 'Permissões', href: '/backoffice/settings/permissoes', icon: Lock },
            { label: 'Logs', href: '/backoffice/settings/logs', icon: ScrollText },
        ]
    },
]

export default function MobileBottomNav() {
    const pathname = usePathname()
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <>
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-card-dark border-t border-gray-100 dark:border-white/5 z-40 pb-safe">
                <div className="h-16 px-2 flex items-center justify-around">
                    {mainItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all ${isActive
                                        ? 'text-primary'
                                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                    }`}
                            >
                                <item.icon size={20} className={isActive ? 'drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]' : ''} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        )
                    })}

                    <button
                        onClick={() => setIsExpanded(true)}
                        className="w-14 h-14 -mt-6 rounded-full bg-gradient-to-br from-primary via-primary-light to-primary-dark text-background-dark flex items-center justify-center shadow-glow hover:scale-105 transition-all active:scale-95 border-4 border-background-light dark:border-background-dark"
                    >
                        <Plus size={24} strokeWidth={3} />
                    </button>

                    <button
                        onClick={() => setIsExpanded(true)}
                        className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
                    >
                        <MoreHorizontal size={20} strokeWidth={2} />
                        <span className="text-[10px] font-medium">Mais</span>
                    </button>
                </div>
            </nav>

            {/* Expanded Menu Drawer */}
            {isExpanded && (
                <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
                    <div
                        className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm"
                        onClick={() => setIsExpanded(false)}
                    />

                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-card-dark rounded-t-[2.5rem] max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up border-t border-white/10">
                        <div className="sticky top-0 bg-white/95 dark:bg-card-dark/95 border-b border-gray-100 dark:border-white/5 px-8 py-6 flex items-center justify-between z-10 backdrop-blur-md rounded-t-[2.5rem]">
                            <div>
                                <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">Menu Completo</h2>
                                <p className="text-xs text-primary font-bold uppercase tracking-widest mt-1">Navegação Global</p>
                            </div>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:bg-primary/20 hover:text-primary transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-6 py-6 space-y-8 pb-Safe">
                            {expandedMenu.map((section) => (
                                <div key={section.group}>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 pl-2">
                                        {section.group}
                                    </h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        {section.items.map((item) => {
                                            const isActive = pathname === item.href
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setIsExpanded(false)}
                                                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all active:scale-95 ${isActive
                                                            ? 'bg-primary/10 border-primary/30 text-primary shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                                                            : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-600 dark:text-gray-400 hover:bg-white hover:border-gray-200 dark:hover:bg-white/10 dark:hover:border-white/10'
                                                        }`}
                                                >
                                                    <item.icon size={24} strokeWidth={isActive ? 2 : 1.5} />
                                                    <span className="text-[10px] font-bold text-center leading-tight">{item.label}</span>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="h-20" />
                    </div>
                </div>
            )}
        </>
    )
}
