'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { useEffect } from 'react'

interface MobileMenuProps {
    isOpen: boolean
    onClose: () => void
    navigation: Array<{ name: string; href: string }>
    lang: string
    pathname: string
}

export default function MobileMenu({
    isOpen,
    onClose,
    navigation,
    lang,
    pathname,
}: MobileMenuProps) {
    // Prevent scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen) return null

    const languages = [
        { code: 'pt', label: 'Português', flag: '🇧🇷' },
        { code: 'en', label: 'English', flag: '🇺🇸' },
    ]

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-imi-900/50 backdrop-blur-sm z-40 lg:hidden"
                onClick={onClose}
            />

            {/* Menu Panel */}
            <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-imi-900 z-50 lg:hidden shadow-2xl border-l border-white/10">
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                        <div className="flex items-center gap-4">
                            <span className="font-playfair text-3xl font-bold text-white tracking-tight">IMI</span>
                            <div className="h-8 w-[1px] bg-imi-200"></div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-medium leading-none mb-1">
                                    Inteligência
                                </span>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-medium leading-none">
                                    Imobiliária
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
                            aria-label="Fechar menu"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto px-6 py-6">
                        <div className="space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={onClose}
                                        className={`block px-4 py-3 text-base font-medium rounded-xl transition-colors ${isActive
                                            ? 'bg-[#C5A572]/10 text-[#C5A572] border-l-4 border-[#C5A572]'
                                            : 'text-white/80 hover:bg-white/5'
                                            }`}
                                    >
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </div>

                        {/* Language Selector - Mobile */}
                        <div className="mt-8 pt-6 border-t border-imi-100">
                            <p className="text-xs font-medium text-imi-600 uppercase tracking-wider mb-3">
                                Idioma
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {languages.map((language) => (
                                    <Link
                                        key={language.code}
                                        href={pathname.replace(`/${lang}`, `/${language.code}`)}
                                        onClick={onClose}
                                        className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl border-2 transition-all ${lang === language.code
                                            ? 'border-accent-500 bg-accent-50 text-accent-700'
                                            : 'border-imi-200 text-imi-700 hover:border-accent-300 hover:bg-accent-50/50'
                                            }`}
                                    >
                                        <span className="text-xl">{language.flag}</span>
                                        <span>{language.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </nav>

                    {/* Footer CTA */}
                    <div className="p-6 border-t border-white/10">
                        <Link
                            href={`/${lang}/contato`}
                            onClick={onClose}
                            className="flex items-center justify-center gap-2 w-full h-12 bg-[#25D366] text-white rounded-xl font-medium hover:bg-[#128C7E] transition-all shadow-sm"
                        >
                            Falar pelo WhatsApp
                        </Link>

                        <p className="text-center text-xs text-white/40 mt-4">
                            Iule Miranda
                            <br />
                            <span className="text-[#C5A572]">CRECI 17933 | CNAI 53290</span>
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
