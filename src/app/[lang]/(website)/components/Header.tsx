'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Globe } from 'lucide-react'
import MobileMenu from './MobileMenu'

export default function Header({ lang = 'pt' }: { lang?: string }) {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const navigation = [
        { name: 'Avaliações', href: `/${lang}/avaliacoes` },
        { name: 'Imóveis', href: `/${lang}/imoveis` },
        { name: 'Construtoras', href: `/${lang}/construtoras` },
        { name: 'Crédito', href: `/${lang}/credito` },
        { name: 'Consultoria', href: `/${lang}/consultoria` },
        { name: 'Inteligência', href: `/${lang}/inteligencia` },
        { name: 'Sobre', href: `/${lang}/sobre` },
        { name: 'Contato', href: `/${lang}/contato` },
    ]

    const languages = [
        { code: 'pt', label: 'PT', flag: '🇧🇷' },
        { code: 'en', label: 'EN', flag: '🇺🇸' },
    ]

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-imi-100'
                    : 'bg-transparent'
                    }`}
            >
                <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link href={`/${lang}`} className="flex items-center gap-4">
                            <span className="font-playfair text-3xl font-bold text-imi-900 tracking-tight">IMI</span>
                            <div className="hidden md:block h-8 w-[1px] bg-imi-200"></div>
                            <div className="hidden md:flex flex-col justify-center">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-imi-600 font-medium leading-none mb-1">
                                    Inteligência
                                </span>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-imi-600 font-medium leading-none">
                                    Imobiliária
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${isActive
                                            ? 'text-accent-600 bg-accent-50'
                                            : isScrolled
                                                ? 'text-imi-700 hover:text-accent-600 hover:bg-imi-50'
                                                : 'text-white hover:text-accent-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* Right Actions */}
                        <div className="flex items-center gap-4">
                            {/* Language Selector - Desktop */}
                            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-imi-200 bg-white/90">
                                {languages.map((language) => (
                                    <Link
                                        key={language.code}
                                        href={pathname.replace(`/${lang}`, `/${language.code}`)}
                                        className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${lang === language.code
                                            ? 'bg-accent-100 text-accent-700'
                                            : 'text-imi-600 hover:bg-imi-50'
                                            }`}
                                    >
                                        <span>{language.flag}</span>
                                        <span>{language.label}</span>
                                    </Link>
                                ))}
                            </div>

                            {/* CTA Button - Desktop */}
                            <Link
                                href={`/${lang}/contato`}
                                className="hidden md:inline-flex items-center gap-2 h-11 px-6 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 transition-all shadow-sm hover:shadow-md"
                            >
                                Falar pelo WhatsApp
                            </Link>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className={`lg:hidden p-2 rounded-lg transition-colors ${isScrolled
                                    ? 'text-imi-700 hover:bg-imi-100'
                                    : 'text-white hover:bg-white/10'
                                    }`}
                                aria-label="Menu"
                            >
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                navigation={navigation}
                lang={lang}
                pathname={pathname}
            />
        </>
    )
}
