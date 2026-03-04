'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, MessageCircle, ChevronDown } from 'lucide-react'

import { GlobalSettings } from '@/lib/settings'

interface HeaderProps {
    lang: string
    settings?: GlobalSettings
}

const NAV_ITEMS = [
    { key: 'avaliacoes', label: 'Avaliações' },
    { key: 'imoveis', label: 'Imóveis' },
    { key: 'construtoras', label: 'Construtoras' },
    { key: 'credito', label: 'Crédito' },
    { key: 'consultoria', label: 'Consultoria' },
    { key: 'inteligencia', label: 'Inteligência' },
    { key: 'biblioteca', label: 'Biblioteca' },
    { key: 'sobre', label: 'Sobre' },
    { key: 'contato', label: 'Contato' },
]

const LANGS = [
    { code: 'pt', flag: '🇧🇷', label: 'PT' },
    { code: 'en', flag: '🇬🇧', label: 'EN' },
    { code: 'ja', flag: '🇯🇵', label: 'JP' },
    { code: 'ar', flag: '🇸🇦', label: 'AR' },
]

export default function Header({ lang, settings }: HeaderProps) {
    const [open, setOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const pathname = usePathname()

    // Lock body scroll when drawer is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden'
            document.body.style.height = '100dvh'
        } else {
            document.body.style.overflow = ''
            document.body.style.height = ''
        }
        return () => {
            document.body.style.overflow = ''
            document.body.style.height = ''
        }
    }, [open])

    // Close on pathname change (navigation)
    useEffect(() => {
        setOpen(false)
    }, [pathname])

    // Scroll detection
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const isActive = (key: string) => pathname?.includes(`/${key}`)

    return (
        <>
            {/* ─── HEADER BAR ─── */}
            <header
                className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled
                    ? 'bg-white/95 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.06),0_4px_20px_rgba(0,0,0,0.05)]'
                    : 'bg-white/90 backdrop-blur-md border-b border-black/[0.06]'
                    }`}
            >
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-[60px] lg:h-[68px]">

                        {/* Logo */}
                        <Link
                            href={`/${lang}`}
                            className="flex items-center gap-2.5 sm:gap-3 group flex-shrink-0"
                        >
                            <span
                                className="text-[20px] sm:text-[22px] lg:text-[24px] font-black tracking-tight text-[#1A1A1A] group-hover:text-[#486581] transition-colors duration-200"
                                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                            >
                                IMI
                            </span>
                            <div className="h-4 w-px bg-black/15" />
                            <span className="text-[9px] font-bold text-[#8A95A0] uppercase tracking-[0.18em] leading-[1.35]">
                                Inteligência<br />Imobiliária
                            </span>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden lg:flex items-center gap-0.5">
                            {NAV_ITEMS.map((item) => {
                                const active = isActive(item.key)
                                return (
                                    <Link
                                        key={item.key}
                                        href={`/${lang}/${item.key}`}
                                        className={`relative px-3 py-2 text-[13px] font-medium tracking-tight transition-colors duration-150 rounded-lg ${active
                                            ? 'text-[#1A1A1A]'
                                            : 'text-[#6C757D] hover:text-[#1A1A1A] hover:bg-black/[0.03]'
                                            }`}
                                    >
                                        {item.label}
                                        {active && (
                                            <motion.div
                                                layoutId="nav-indicator"
                                                className="absolute bottom-0.5 left-3 right-3 h-[2px] bg-[#102A43] rounded-full"
                                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* Desktop Right */}
                        <div className="hidden lg:flex items-center gap-3">
                            <div className="flex items-center gap-1 border-r border-black/10 pr-3">
                                {LANGS.map((l) => (
                                    <Link
                                        key={l.code}
                                        href={`/${l.code}`}
                                        className={`text-[11px] font-bold px-1.5 py-0.5 rounded transition-colors duration-150 ${lang === l.code
                                            ? 'text-[#486581]'
                                            : 'text-[#ADB5BD] hover:text-[#495057]'
                                            }`}
                                    >
                                        {l.label}
                                    </Link>
                                ))}
                            </div>
                            <a
                                href={`https://wa.me/${settings?.companyPhone?.replace(/\D/g, '') || '5581997230455'}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-[#102A43] hover:bg-[#0a1c2e] text-white text-[13px] font-semibold px-4 py-2 rounded-xl transition-all duration-200"
                            >
                                <MessageCircle size={14} strokeWidth={2.5} />
                                WhatsApp
                            </a>
                        </div>

                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setOpen(true)}
                            className="lg:hidden p-2 -mr-1 rounded-xl hover:bg-black/[0.04] transition-colors text-[#1A1A1A]"
                            aria-label="Abrir menu"
                        >
                            <Menu size={22} />
                        </button>
                    </div>
                </div>
            </header>

            {/* ─── MOBILE DRAWER (portal-style, outside header) ─── */}
            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
                            onClick={() => setOpen(false)}
                            aria-hidden="true"
                        />

                        {/* Drawer Panel */}
                        <motion.div
                            key="drawer"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.8 }}
                            className="fixed top-0 right-0 bottom-0 w-[min(85vw,360px)] bg-white z-[210] flex flex-col shadow-2xl"
                            style={{ maxHeight: '100dvh' }}
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between px-6 h-16 border-b border-black/[0.06] flex-shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <span
                                        className="text-[20px] font-black text-[#1A1A1A]"
                                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                    >
                                        IMI
                                    </span>
                                    <div className="h-4 w-px bg-black/10" />
                                    <span className="text-[9px] font-bold text-[#ADB5BD] uppercase tracking-[0.2em]">Menu</span>
                                </div>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="p-2 rounded-xl hover:bg-black/[0.04] text-[#6C757D] transition-colors -mr-1"
                                    aria-label="Fechar menu"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Nav Items — scrollable */}
                            <nav className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                                <div className="space-y-0.5">
                                    {NAV_ITEMS.map((item, i) => {
                                        const active = isActive(item.key)
                                        return (
                                            <motion.div
                                                key={item.key}
                                                initial={{ opacity: 0, x: 16 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.035, duration: 0.2 }}
                                            >
                                                <Link
                                                    href={`/${lang}/${item.key}`}
                                                    onClick={() => setOpen(false)}
                                                    className={`flex items-center h-[54px] px-4 rounded-2xl text-[15px] font-semibold transition-all duration-150 ${active
                                                        ? 'bg-[#F8F9FA] text-[#1A1A1A] border-l-[3px] border-[#334E68] pl-[13px]'
                                                        : 'text-[#495057] hover:bg-[#F8F9FA] hover:text-[#1A1A1A]'
                                                        }`}
                                                >
                                                    {item.label}
                                                </Link>
                                            </motion.div>
                                        )
                                    })}
                                </div>

                                {/* CTA WhatsApp */}
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.28 }}
                                    className="mt-6"
                                >
                                    <a
                                        href={`https://wa.me/${settings?.companyPhone?.replace(/\D/g, '') || '5581997230455'}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => setOpen(false)}
                                        className="flex items-center justify-center gap-2.5 w-full bg-[#102A43] hover:bg-[#0a1c2e] text-white font-bold text-[15px] h-[52px] rounded-2xl transition-all duration-200 active:scale-[0.97] shadow-lg"
                                    >
                                        <MessageCircle size={18} />
                                        Falar pelo WhatsApp
                                    </a>
                                </motion.div>

                                {/* Language Selector */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.33 }}
                                    className="flex gap-2 mt-5"
                                >
                                    {LANGS.map((l) => (
                                        <Link
                                            key={l.code}
                                            href={`/${l.code}`}
                                            onClick={() => setOpen(false)}
                                            className={`flex-1 h-11 flex items-center justify-center rounded-xl text-xl transition-all duration-150 ${lang === l.code
                                                ? 'bg-[#1A1A1A] ring-2 ring-[#334E68] ring-offset-1'
                                                : 'bg-[#F8F9FA] border border-[#E9ECEF]'
                                                }`}
                                        >
                                            {l.flag}
                                        </Link>
                                    ))}
                                </motion.div>

                                {/* Credential Card */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.38 }}
                                    className="mt-6 p-5 bg-[#F8F9FA] rounded-2xl border border-black/[0.05]"
                                >
                                    <p className="font-bold text-[#1A1A1A] text-[15px]">Iule Miranda</p>
                                    <div className="h-[2px] w-8 bg-[#102A43] my-2 rounded-full" />
                                    <p className="text-[10px] text-[#ADB5BD] font-bold uppercase tracking-[0.2em]">
                                        CRECI 17933 · CNAI 53290
                                    </p>
                                    <a
                                        href={`https://wa.me/${settings?.companyPhone?.replace(/\D/g, '') || '5581997230455'}`}
                                        className="text-[13px] text-[#6C757D] mt-2 block hover:text-[#1A1A1A] transition-colors"
                                    >
                                        {settings?.companyPhone || '+55 81 99723-0455'}
                                    </a>
                                </motion.div>

                                {/* Bottom safe area spacer */}
                                <div className="h-8" />
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
