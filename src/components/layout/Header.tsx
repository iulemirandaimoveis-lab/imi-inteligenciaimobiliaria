'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, MessageCircle } from 'lucide-react'
import Button from '@/components/ui/Button'

interface HeaderProps {
    lang?: string
    dict?: any
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}

export default function Header({ lang = 'pt', dict }: HeaderProps) {
    const [isOpen, setIsOpen] = useState(false)

    const langOptions = [
        { code: 'pt', label: 'Português', flag: '🇧🇷' },
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'es', label: 'Español', flag: '🇪🇸' }
    ]

    const labels = dict || {
        services: 'Avaliações',
        properties: 'Imóveis',
        credit: 'Crédito',
        consulting: 'Consultoria',
        intelligence: 'Inteligência',
        about: 'Sobre',
        contact: 'Contato',
        whatsapp: 'WhatsApp'
    }

    const menuItems = [
        { href: `/${lang}/avaliacoes`, label: labels.services },
        { href: `/${lang}/imoveis`, label: labels.properties },
        { href: `/${lang}/credito`, label: labels.credit },
        { href: `/${lang}/consultoria`, label: labels.consulting },
        { href: `/${lang}/inteligencia`, label: labels.intelligence },
        { href: `/${lang}/sobre`, label: labels.about },
        { href: `/${lang}/contato`, label: labels.contact },
    ]

    return (
        <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-imi-100 z-50">
            <nav className="container-custom h-16 lg:h-20 flex items-center justify-between">
                <Link href={`/${lang}`} className="font-display text-xl font-bold text-imi-900">
                    IMI
                </Link>

                <div className="hidden lg:flex items-center gap-8">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-sm font-semibold text-imi-900 hover:text-accent-500 transition-colors"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="hidden lg:flex items-center gap-4">
                    {langOptions.map((opt) => (
                        <Link
                            key={opt.code}
                            href={`/${opt.code}`}
                            className={cn(
                                "text-xs font-bold transition-all p-1.5 rounded-lg",
                                lang === opt.code ? "bg-imi-900 text-white" : "text-imi-400 hover:text-imi-900 hover:bg-imi-50"
                            )}
                        >
                            {opt.code.toUpperCase()}
                        </Link>
                    ))}
                </div>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="lg:hidden w-10 h-10 flex items-center justify-center text-imi-900"
                    aria-label="Menu"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </nav>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-imi-900/50 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="fixed top-16 right-0 w-full max-w-sm h-[calc(100vh-4rem)] bg-white shadow-2xl z-50 lg:hidden overflow-y-auto">
                        <div className="p-6 space-y-4">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="block py-3 px-4 rounded-xl text-imi-900 font-semibold hover:bg-imi-50 transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            ))}

                            <div className="pt-6 border-t border-imi-100">
                                <Button asChild className="w-full h-12 bg-imi-900 hover:bg-imi-800">
                                    <a href="https://wa.me/5581997230455" target="_blank" rel="noopener noreferrer">
                                        <MessageCircle className="w-5 h-5 mr-2" />
                                        {labels.whatsapp || 'WhatsApp'}
                                    </a>
                                </Button>
                            </div>

                            {/* Mobile Lang Selector - compact flags */}
                            <div className="mt-8 flex items-center justify-center gap-4 py-6 border-t border-imi-100">
                                {langOptions.map((opt) => (
                                    <Link
                                        key={opt.code}
                                        href={`/${opt.code}`}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "flex items-center justify-center w-12 h-12 rounded-xl transition-all",
                                            lang === opt.code
                                                ? "bg-imi-900 ring-2 ring-accent-500 scale-110"
                                                : "bg-imi-50 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                                        )}
                                        title={opt.label}
                                    >
                                        <span className="text-xl">{opt.flag}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </header>
    )
}
