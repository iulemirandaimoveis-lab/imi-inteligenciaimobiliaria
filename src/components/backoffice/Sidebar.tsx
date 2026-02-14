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
import Badge from '@/components/ui/Badge';

const sidebarItems = [
    { label: 'Dashboard', href: '/backoffice/dashboard', icon: LayoutDashboard },
    { label: 'Imóveis', href: '/backoffice/imoveis', icon: Building2 },
    { label: 'Construtoras', href: '/backoffice/construtoras', icon: Building2 },
    { label: 'Leads', href: '/backoffice/leads', icon: Users },
    { label: 'Campanhas', href: '/backoffice/campanhas', icon: BarChart3 },
    { label: 'Conteúdo & IA', href: '/backoffice/conteudo', icon: Sparkles, badge: 'IA' },
    { label: 'Tracking', href: '/backoffice/tracking', icon: MousePointerClick, badge: 'AUTO' },
    { label: 'Avaliações', href: '/backoffice/avaliacoes', icon: FileText },
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
        <aside className="hidden lg:flex lg:flex-col lg:w-80 lg:border-r lg:border-white/5 lg:bg-imi-900 fixed inset-y-0 left-0 z-50 shadow-xl">
            {/* Branding - Minimal & Powerful */}
            <div className="p-4 pb-4 flex flex-col relative">
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-md flex items-center justify-center text-accent-500 font-display font-bold text-2xl shadow-xl ring-1 ring-white/5">
                        I
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-xl font-display font-bold text-white tracking-tighter leading-none">IMI ATLANTIS</h2>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="w-1 h-1 rounded-full bg-accent-500 animate-pulse" />
                            <p className="text-xs text-accent-500 font-bold uppercase tracking-widest opacity-80">Operational Hub</p>
                        </div>
                    </div>
                </div>

                {/* Search - Refined & Subtle Hub */}
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent-500 transition-colors w-4 h-4" strokeWidth={1.5} />
                    <input
                        type="text"
                        placeholder="Comando de Sistema..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-md h-input pl-10 pr-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent-500 transition-all font-medium"
                    />
                </div>
            </div>

            {/* Navigation - Strategic Discipline */}
            <nav className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar pb-5">
                {filteredItems.map((item) => {
                    const isActive = item.href === '/backoffice/dashboard'
                        ? pathname === item.href
                        : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group flex items-center justify-between px-4 h-btn rounded-md transition-all duration-200 relative ${isActive
                                ? 'bg-white/5 text-white shadow-md border border-white/5'
                                : 'text-imi-400 hover:text-white hover:bg-white/[0.02]'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon
                                    size={18}
                                    strokeWidth={isActive ? 2 : 1.5}
                                    className={`transition-colors duration-200 ${isActive ? 'text-accent-500' : 'text-imi-400 group-hover:text-imi-200'}`}
                                />
                                <span className={`text-sm font-bold uppercase tracking-wide ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                                    {item.label}
                                </span>
                            </div>

                            {item.badge && (
                                <Badge
                                    size="sm"
                                    variant={isActive ? 'primary' : 'default'}
                                >
                                    {item.badge}
                                </Badge>
                            )}

                            {isActive && (
                                <div className="absolute left-[-12px] w-1 h-4 bg-accent-500 rounded-r-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer - Institutional Stability */}
            <div className="p-4 border-t border-white/5 bg-white/[0.01]">
                <Link
                    href="/backoffice/settings"
                    className={`flex items-center gap-3 px-4 h-btn rounded-md transition-all duration-200 mb-1 ${pathname.startsWith('/backoffice/settings')
                        ? 'bg-white/5 text-white shadow-md border border-white/5'
                        : 'text-imi-400 hover:text-white hover:bg-white/[0.02]'
                        }`}
                >
                    <Settings size={18} strokeWidth={1.5} className={pathname.startsWith('/backoffice/settings') ? 'text-accent-500' : ''} />
                    <span className="text-sm font-bold uppercase tracking-wide">Configurações</span>
                </Link>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 h-btn rounded-md text-imi-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
                >
                    <LogOut size={18} strokeWidth={1.5} />
                    <span className="text-sm font-bold uppercase tracking-wide">Encerrar Sessão</span>
                </button>

                {/* Context Info */}
                <div className="mt-4 px-4 py-3 bg-white/[0.02] rounded-lg border border-white/5 flex items-center gap-3">
                    <UserCircle size={24} strokeWidth={1.5} className="text-accent-500" />
                    <div className="flex flex-col leading-tight">
                        <span className="text-sm font-bold text-white tracking-tight">Gestor IMI</span>
                        <span className="text-[10px] text-accent-500 font-bold uppercase tracking-widest opacity-60">Acesso Total</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
