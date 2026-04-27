'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

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

    const languages = [
        { code: 'pt', label: 'Português', flag: '🇧🇷' },
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'ja', label: 'JP', flag: '🇯🇵' },
        { code: 'ar', label: 'AR', flag: '🇸🇦' },
        { code: 'es', label: 'ES', flag: '🇪🇸' },
    ]

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[9999] lg:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="absolute top-0 right-0 bottom-0 w-full max-w-[320px] bg-white shadow-2xl flex flex-col">
                <div className="flex items-center justify-between px-6 py-6">
                    <div className="flex items-center gap-2.5">
                        {/* IMI monogram — Playfair Display 700 · Brand Identity v1.1 LIGHT */}
                        <span
                            className="leading-none select-none"
                            style={{
                                fontFamily: "'Playfair Display', Georgia, serif",
                                fontSize: 20,
                                fontWeight: 700,
                                color: '#0B1928',
                                letterSpacing: '2px',
                            }}
                        >
                            IMI
                        </span>
                        <div style={{ width: 1, height: 22, background: '#A8842A', flexShrink: 0 }} />
                        <span
                            className="select-none"
                            style={{
                                fontSize: '7px',
                                fontWeight: 600,
                                letterSpacing: '2.2px',
                                textTransform: 'uppercase',
                                color: '#0B1928',
                                lineHeight: 1.45,
                            }}
                        >
                            INTELIGÊNCIA<br />IMOBILIÁRIA
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-[#1A1D23] hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={28} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <nav className="space-y-1 mb-8">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || (item.name === 'Construtoras' && pathname.includes('construtoras'))
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={onClose}
                                    className={`block py-4 px-5 text-lg font-bold rounded-xl transition-all border-l-[3px] ${isActive
                                            ? 'bg-gray-50 text-[#1A1D23] border-[#C5A572]'
                                            : 'text-[#1A1D23]/70 border-transparent hover:bg-gray-50'
                                        }`}
                                >
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="border-t border-gray-100 pt-8">
                        <Link
                            href={`/${lang}/contato`}
                            onClick={onClose}
                            className="flex items-center justify-center w-full h-[56px] bg-navy-900 text-white rounded-xl font-bold transition-all active:scale-[0.98] mb-8"
                        >
                            Falar pelo WhatsApp
                        </Link>

                        {/* Bandeiras quadradas arredondadas conforme print */}
                        <div className="flex justify-center gap-3 mb-10">
                            {languages.map((language) => (
                                <Link
                                    key={language.code}
                                    href={pathname.replace(`/${lang}`, `/${language.code}`)}
                                    onClick={onClose}
                                    className={`flex items-center justify-center w-12 h-12 rounded-xl border-[2.5px] transition-all bg-gray-50 ${lang === language.code
                                            ? 'border-[#C5A572] shadow-sm'
                                            : 'border-transparent opacity-60'
                                        }`}
                                >
                                    <span className="text-2xl">{language.flag}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Card Iule no final conforme print */}
                <div className="p-6 bg-gray-50">
                    <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
                        <p className="font-black text-lg text-[#1A1D23] mb-1">Iule Miranda</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">
                            CRECI 17933-F | CNAI 53290
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
