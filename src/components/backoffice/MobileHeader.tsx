'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, Bell, Search } from 'lucide-react'

interface MobileHeaderProps {
    title?: string
    showBack?: boolean
}

export default function MobileHeader({
    title,
    showBack = true
}: MobileHeaderProps) {
    const pathname = usePathname()
    const router = useRouter()

    const getTitle = () => {
        if (title) return title
        if (pathname.includes('/imoveis')) return 'Imóveis'
        if (pathname.includes('/leads')) return 'Leads'
        if (pathname.includes('/campanhas')) return 'Campanhas'
        if (pathname.includes('/conteudo')) return 'Conteúdo & IA'
        if (pathname.includes('/settings')) return 'Configurações'
        if (pathname.includes('/dashboard')) return 'Dashboard'
        return 'IMI Admin'
    }

    // Only show back button on deeper routes
    const isRoot = pathname === '/backoffice/dashboard' ||
        pathname === '/backoffice/imoveis' ||
        pathname === '/backoffice/leads'

    const displayedShowBack = showBack && !isRoot

    return (
        <header className="sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl h-20 px-6 flex items-center justify-between lg:hidden border-b border-gray-100 dark:border-white/5 shadow-soft">
            <div className="flex items-center gap-4">
                {displayedShowBack && (
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center text-gray-500 shadow-sm border border-gray-100 dark:border-white/10"
                    >
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                )}

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-background-dark font-display font-bold text-lg shadow-glow">
                        I
                    </div>
                    <div>
                        <h1 className="font-display font-bold text-lg text-gray-900 dark:text-white tracking-tight leading-none">
                            {getTitle()}
                        </h1>
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-1">INTELIGÊNCIA</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button className="w-10 h-10 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-white/10 shadow-sm">
                    <Search size={18} />
                </button>
                <button className="relative w-10 h-10 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-white/10 shadow-sm">
                    <Bell size={18} />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white dark:ring-background-dark shadow-glow"></span>
                </button>
            </div>
        </header>
    )
}
