'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, LogOut, Settings, HelpCircle, ChevronDown, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function UserDropdown() {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()
    const supabase = createClient()
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            router.push('/login')
            router.refresh()
        } catch (error) {
            console.error('Error logging out:', error)
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-all group"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary via-primary-light to-primary-dark p-[2px] shadow-sm">
                    <div className="w-full h-full rounded-full bg-white dark:bg-card-dark flex items-center justify-center overflow-hidden">
                        <img
                            src="https://avatar.vercel.sh/imi-admin"
                            alt="User Avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
                <div className="hidden md:flex flex-col items-start gap-0.5">
                    <span className="text-xs font-bold text-gray-900 dark:text-white leading-none group-hover:text-primary transition-colors">
                        Admin IMI
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                        Super User
                    </span>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-56 bg-white dark:bg-card-dark rounded-2xl shadow-soft-xl border border-gray-100 dark:border-white/10 overflow-hidden z-50 origin-top-right py-1"
                    >
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Logado como</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">admin@imi.intelligence.com</p>
                        </div>

                        <div className="p-1 space-y-0.5">
                            <button
                                onClick={() => router.push('/backoffice/profile')}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-primary rounded-xl transition-colors group"
                            >
                                <User size={16} className="group-hover:scale-110 transition-transform text-gray-400 group-hover:text-primary" />
                                Meu Perfil
                            </button>
                            <button
                                onClick={() => router.push('/backoffice/settings')}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-primary rounded-xl transition-colors group"
                            >
                                <Settings size={16} className="group-hover:rotate-45 transition-transform text-gray-400 group-hover:text-primary" />
                                Configurações
                            </button>
                            <button
                                onClick={() => router.push('/backoffice/support')}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-blue-500 rounded-xl transition-colors group"
                            >
                                <HelpCircle size={16} className="group-hover:bounce transition-transform text-gray-400 group-hover:text-blue-500" />
                                Suporte / Ajuda
                            </button>
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-gray-100 dark:via-white/10 to-transparent my-1" />

                        <div className="p-1">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 rounded-xl transition-colors group"
                            >
                                <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                                Sair da Conta
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
