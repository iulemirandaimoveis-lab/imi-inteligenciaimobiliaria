'use client'

import { useState } from 'react'
import { Search, Bell, User, LogOut, Settings, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export default function DesktopHeader() {
    const router = useRouter()
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <header className="hidden lg:block lg:fixed lg:top-0 lg:right-0 lg:left-64 lg:z-30 lg:h-16 lg:bg-white lg:border-b lg:border-imi-100">
            <div className="h-full px-6 flex items-center justify-between">
                {/* Left: Search */}
                <div className="flex-1 max-w-md">
                    <button
                        onClick={() => {
                            // Trigger CommandPalette
                            const event = new KeyboardEvent('keydown', {
                                key: 'k',
                                metaKey: true,
                                bubbles: true
                            })
                            document.dispatchEvent(event)
                        }}
                        className="
              w-full h-10 px-4 
              flex items-center gap-3
              bg-imi-50 border border-imi-200 rounded-xl
              text-sm text-imi-500
              transition-all duration-200
              hover:border-accent-300 hover:bg-white
              focus:outline-none focus:ring-2 focus:ring-accent-500
            "
                    >
                        <Search size={16} className="text-imi-400" />
                        <span>Buscar...</span>
                        <div className="ml-auto flex items-center gap-1">
                            <kbd className="px-2 py-0.5 text-xs font-semibold bg-white border border-imi-200 rounded">
                                ⌘
                            </kbd>
                            <kbd className="px-2 py-0.5 text-xs font-semibold bg-white border border-imi-200 rounded">
                                K
                            </kbd>
                        </div>
                    </button>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="
                relative w-10 h-10 rounded-xl
                flex items-center justify-center
                text-imi-700 hover:bg-imi-50
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-accent-500
              "
                        >
                            <Bell size={20} />
                            {/* Badge */}
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowNotifications(false)}
                                />
                                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl border border-imi-100 shadow-xl z-20 animate-slide-down">
                                    <div className="p-4 border-b border-imi-100">
                                        <h3 className="text-sm font-bold text-imi-900">Notificações</h3>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto scrollbar-thin">
                                        {/* Empty state */}
                                        <div className="p-8 text-center">
                                            <Bell size={32} className="mx-auto mb-3 text-imi-300" />
                                            <p className="text-sm text-imi-600">Nenhuma notificação</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="
                flex items-center gap-3 h-10 px-3 rounded-xl
                bg-imi-50 border border-imi-200
                text-sm font-medium text-imi-700
                hover:bg-white hover:border-accent-300
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-accent-500
              "
                        >
                            <div className="w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center">
                                <User size={14} className="text-accent-700" />
                            </div>
                            <span>Iule Miranda</span>
                            <ChevronDown size={16} className="text-imi-400" />
                        </button>

                        {/* User Dropdown */}
                        {showUserMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowUserMenu(false)}
                                />
                                <div className="absolute right-0 top-12 w-56 bg-white rounded-xl border border-imi-100 shadow-xl z-20 animate-slide-down">
                                    <div className="p-3 border-b border-imi-100">
                                        <p className="text-sm font-medium text-imi-900">Iule Miranda</p>
                                        <p className="text-xs text-imi-500 mt-0.5">iulemirandaimoveis@gmail.com</p>
                                        <p className="text-xs text-accent-600 font-medium mt-1">
                                            CRECI 17933
                                        </p>
                                    </div>
                                    <div className="p-2">
                                        <button
                                            onClick={() => {
                                                setShowUserMenu(false)
                                                router.push('/backoffice/settings')
                                            }}
                                            className="
                        w-full flex items-center gap-3 px-3 py-2 rounded-lg
                        text-sm font-medium text-imi-700
                        hover:bg-imi-50
                        transition-colors
                      "
                                        >
                                            <Settings size={16} />
                                            <span>Configurações</span>
                                        </button>
                                        <button
                                            onClick={handleSignOut}
                                            className="
                        w-full flex items-center gap-3 px-3 py-2 rounded-lg
                        text-sm font-medium text-red-600
                        hover:bg-red-50
                        transition-colors
                      "
                                        >
                                            <LogOut size={16} />
                                            <span>Sair</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
