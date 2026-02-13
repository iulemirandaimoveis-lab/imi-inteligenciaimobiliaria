'use client'

import React, { useEffect } from 'react'
import { Search } from 'lucide-react'
import NotificationsPopover from './NotificationsPopover'
import UserDropdown from './UserDropdown'

export default function DesktopHeader() {
    // Escuta CMD+K para simular clique no botão de busca
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                // A ação de abrir o CommandPalette é controlada dentro dele, 
                // mas podemos adicionar um feedback visual aqui se quisermos.
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <header className="hidden lg:flex sticky top-0 z-40 h-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 shadow-sm px-8 items-center justify-between animate-fade-in-down">
            {/* Search Trigger */}
            <div className="flex-1 max-w-xl">
                <button
                    onClick={() => {
                        // Dispatch event to open CommandPalette
                        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
                    }}
                    className="group w-full flex items-center gap-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-2.5 text-sm text-gray-400 hover:border-primary/50 hover:shadow-glow-sm transition-all duration-300"
                >
                    <Search size={18} className="group-hover:text-primary transition-colors" />
                    <span className="flex-1 text-left font-medium">Buscar rapidamente...</span>
                    <div className="flex items-center gap-1">
                        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-1.5 font-mono text-[10px] font-medium text-gray-400 group-hover:text-primary transition-colors">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </div>
                </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 ml-8">
                {/* Theme Toggle could go here */}

                <div className="h-8 w-px bg-gray-200 dark:bg-white/10 mx-2" />

                <NotificationsPopover />
                <UserDropdown />
            </div>
        </header>
    )
}
