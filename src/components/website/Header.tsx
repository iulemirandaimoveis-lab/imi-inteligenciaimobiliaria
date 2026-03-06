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
    { code: 'en', flag: '🇺🇸', label: 'EN' },
    { code: 'es', flag: '🇪🇸', label: 'ES' },
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
                            transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.7 }}
                            className="fixed top-0 right-0 bottom-0 w-[min(82vw,320px)] bg-white z-[210] flex flex-col shadow-2xl"
                            style={{ maxHeight: '100dvh' }}
                        >
                            {/* Drawer Header — compacto */}
                            <div className="flex items-center justify-between px-5 h-[54px] border-b border-black/[0.06] flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="text-[18px] font-black text-[#1A1A1A]"
                                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                    >
                                        IMI
                                    </span>
                                    <div className="h-3.5 w-px bg-black/10" />
                                    <span className="text-[9px] font-bold text-[#ADB5BD] uppercase tracking-[0.2em]">Navegação</span>
                                </div>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-black/[0.05] text-[#6C757D] transition-colors"
                                    aria-label="Fechar menu"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Nav Items — scrollable, compacto -15% */}
                            <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
                                <div className="space-y-0.5">
                                    {NAV_ITEMS.map((item, i) => {
                                        const active = isActive(item.key)
                                        return (
                                            <motion.div
                                                key={item.key}
                                                initial={{ opacity: 0, x: 12 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.03, duration: 0.18 }}
                                            >
                                                <Link
                                                    href={`/${lang}/${item.key}`}
                                                    onClick={() => setOpen(false)}
                                                    className={`flex items-center h-[46px] px-4 rounded-xl text-[14px] font-semibold transition-all duration-150 ${active
                                                        ? 'bg-[#F4F6F8] text-[#1A1A1A] border-l-[3px] border-[#334E68] pl-[13px]'
                                                        : 'text-[#495057] hover:bg-[#F4F6F8] hover:text-[#1A1A1A]'
                                                        }`}
                                                >
                                                    {item.label}
                                                </Link>
                                            </motion.div>
                                        )
                                    })}
                                </div>

                                {/* CTA WhatsApp — compacto */}
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="mt-4"
                                >
                                    <a
                                        href={`https://wa.me/${settings?.companyPhone?.replace(/\D/g, '') || '5581997230455'}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => setOpen(false)}
                                        className="flex items-center justify-center gap-2 w-full bg-[#102A43] hover:bg-[#0a1c2e] text-white font-bold text-[14px] h-[44px] rounded-xl transition-all duration-200 active:scale-[0.97]"
                                    >
                                        <MessageCircle size={16} />
                                        WhatsApp
                                    </a>
                                </motion.div>

                                {/* Language Selector — compacto, bandeiras menores */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.30 }}
                                    className="flex gap-1.5 mt-3"
                                >
                                    {LANGS.map((l) => (
                                        <Link
                                            key={l.code}
                                            href={`/${l.code}`}
                                            onClick={() => setOpen(false)}
                                            title={l.label}
                                            className={`flex-1 h-9 flex items-center justify-center rounded-lg text-lg transition-all duration-150 ${lang === l.code
                                                ? 'bg-[#1A1A1A] ring-2 ring-[#334E68] ring-offset-1'
                                                : 'bg-[#F4F6F8] border border-[#E9ECEF] hover:border-[#334E68]/30'
                                                }`}
                                        >
                                            {l.flag}
                                        </Link>
                                    ))}
                                </motion.div>

                                {/* Credencial mínima — apenas CRECI */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.35 }}
                                    className="mt-3 px-3 py-2.5 rounded-xl border border-black/[0.05]"
                                    style={{ background: '#F8F9FA' }}
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-[#1A1A1A] text-[13px]">Iule Miranda</p>
                                        <p className="text-[10px] text-[#ADB5BD] font-bold uppercase tracking-[0.15em]">CRECI 17933</p>
                                    </div>
                                    <a
                                        href={`https://wa.me/${settings?.companyPhone?.replace(/\D/g, '') || '5581997230455'}`}
                                        className="text-[12px] text-[#6C757D] mt-1 block hover:text-[#1A1A1A] transition-colors"
                                    >
                                        {settings?.companyPhone || '+55 81 9 9723-0455'}
                                    </a>
                                </motion.div>

                                <div className="h-6" />
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
