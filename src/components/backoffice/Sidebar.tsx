'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Building2,
    Calendar,
    Settings,
    LogOut,
    Sparkles,
    BarChart3,
    MousePointerClick,
    Zap,
    PieChart,
    Layers,
    FileText,
    CreditCard,
    MessageSquare,
    ChevronRight,
    Search,
    UserCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const sidebarItems = [
    { label: 'Dashboard', href: '/backoffice/dashboard', icon: LayoutDashboard },
    { label: 'Imóveis', href: '/backoffice/imoveis', icon: Building2 },
    { label: 'Construtoras', href: '/backoffice/construtoras', icon: Building2 },
    { label: 'Leads', href: '/backoffice/leads', icon: Users },
    { label: 'Campanhas', href: '/backoffice/campanhas', icon: BarChart3 },
    { label: 'Conteúdo & IA', href: '/backoffice/conteudo', icon: Sparkles, badge: 'IA' },
    { label: 'Tracking', href: '/backoffice/tracking', icon: MousePointerClick, badge: 'AUTO' },
    { label: 'Avaliações', href: '/backoffice/avaliacoes', icon: FileText, badge: 'BREVE' },
    { label: 'Crédito', href: '/backoffice/credito', icon: CreditCard, badge: 'BREVE' },
    { label: 'Agenda', href: '/backoffice/agenda', icon: Calendar, badge: 'BREVE' },
    { label: 'WhatsApp', href: '/backoffice/whatsapp', icon: MessageSquare, badge: 'BREVE' },
    { label: 'Relatórios', href: '/backoffice/relatorios', icon: PieChart },
    { label: 'Integrações', href: '/backoffice/integracoes', icon: Layers, badge: 'BREVE' },
    { label: 'Corretores', href: '/backoffice/settings/corretores', icon: UserCircle },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredItems = sidebarItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:border-r lg:border-white/5 lg:bg-background-dark/95 fixed inset-y-0 left-0 z-30 transition-all duration-300 shadow-[20px_0_40px_-10px_rgba(0,0,0,0.3)] backdrop-blur-3xl">
            {/* Branding - Elegant Header */}
            <div className="p-8 pb-6 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

                <div className="flex items-center gap-4 mb-8 relative z-10 group cursor-default">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary via-primary-light to-primary-dark rounded-2xl flex items-center justify-center text-background-dark font-display font-bold text-2xl shadow-glow transition-transform duration-500 group-hover:rotate-[10deg]">
                        I
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white font-display tracking-tight leading-none group-hover:text-primary-light transition-colors">IMI Admin</h2>
                        <div className="h-px w-8 bg-primary/50 my-1 rounded-full group-hover:w-full transition-all duration-500" />
                        <p className="text-[10px] text-primary-light font-bold uppercase tracking-[0.3em] opacity-80">Inteligência Imob.</p>
                    </div>
                </div>

                {/* Micro-Search */}
                <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar menu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-9 pr-3 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-primary/30 focus:bg-white/10 transition-all"
                    />
                </div>
            </div>

            {/* Navigation - Scrollable Area */}
            <nav className="flex-1 overflow-y-auto px-4 space-y-1.5 custom-scrollbar pb-6">
                {filteredItems.map((item) => {
                    const isActive = item.href === '/backoffice/dashboard'
                        ? pathname === item.href
                        : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-500 relative overflow-hidden ${isActive
                                ? 'bg-gradient-to-r from-primary/20 to-transparent text-primary font-medium shadow-[inset_0_0_20px_rgba(212,175,55,0.05)] border-l-4 border-primary'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent hover:pl-5'
                                }`}
                        >
                            {/* Active Glow Effect */}
                            {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-50" />
                            )}

                            <item.icon
                                size={20}
                                className={`relative z-10 transition-all duration-300 ${isActive ? 'text-primary scale-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]' : 'group-hover:text-white group-hover:scale-105'}`}
                                strokeWidth={isActive ? 2.5 : 1.5}
                            />

                            <span className="relative z-10 text-sm tracking-wide font-medium">{item.label}</span>

                            {/* Chevron for depth */}
                            {isActive && <ChevronRight size={14} className="ml-auto text-primary animate-pulse-slow" />}

                            {/* Badge */}
                            {item.badge && !isActive && (
                                <span className={`ml-auto px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider border relative z-10 
                                    ${item.badge === 'IA' ? 'bg-primary/20 text-primary border-primary/30 shadow-[0_0_10px_rgba(212,175,55,0.2)]' : ''}
                                    ${item.badge === 'AUTO' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : ''}
                                    ${item.badge === 'BREVE' ? 'bg-white/10 text-gray-400 border-white/10' : ''}
                                `}>
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Actions - Glassmorphism */}
            <div className="p-4 pt-2">
                <div className="p-1 border border-white/5 bg-gradient-to-b from-white/5 to-black/40 rounded-3xl backdrop-blur-md shadow-lg">
                    <Link
                        href="/backoffice/settings"
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 mb-1 ${pathname === '/backoffice/settings'
                            ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <Settings size={18} />
                        <span className="text-sm">Configurações</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 group mt-1"
                    >
                        <span className="flex items-center gap-3">
                            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium">Sair</span>
                        </span>
                    </button>
                </div>

                {/* User Profile Mini */}
                <div className="mt-4 px-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10" />
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">Administrador</span>
                        <span className="text-[10px] text-gray-500">online</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
