'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, MessageCircle } from 'lucide-react'

interface HeaderProps {
    lang: string
}

const NAV_ITEMS = [
    { key: 'avaliacoes', label: 'Avaliações' },
    { key: 'imoveis', label: 'Imóveis' },
    { key: 'construtoras', label: 'Construtoras' },
    { key: 'credito', label: 'Crédito' },
    { key: 'consultoria', label: 'Consultoria' },
    { key: 'inteligencia', label: 'Inteligência' },
    { key: 'sobre', label: 'Sobre' },
]

const LANGS = [
    { code: 'pt', flag: '🇧🇷', label: 'PT' },
    { code: 'en', flag: '🇬🇧', label: 'EN' },
    { code: 'ja', flag: '🇯🇵', label: 'JP' },
    { code: 'ar', flag: '🇸🇦', label: 'AR' },
]

export default function Header({ lang }: HeaderProps) {
    const [open, setOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    const isActive = (key: string) => pathname.includes(`/${key}`)

    return (
        <>
            {/* ─── DESKTOP + TABLET HEADER ─── */}
            <header
                className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled
                        ? 'bg-white/95 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.06),0_4px_20px_rgba(0,0,0,0.05)]'
                        : 'bg-white/80 backdrop-blur-md border-b border-black/5'
                    }`}
            >
                <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-[68px] lg:h-[76px]">

                        {/* ── Logo ── */}
                        <Link
                            href={`/${lang}`}
                            className="flex items-center gap-3 group flex-shrink-0"
                            onClick={() => setOpen(false)}
                        >
                            <span
                                className="text-[22px] lg:text-[24px] font-black tracking-tight text-[#1A1A1A] group-hover:text-[#C49D5B] transition-colors duration-200"
                                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                            >
                                IMI
                            </span>
                            <div className="h-5 w-px bg-black/15" />
                            <span className="text-[10px] lg:text-[11px] font-semibold text-[#6C757D] uppercase tracking-[0.18em] leading-[1.2] hidden sm:block">
                                Inteligência<br />Imobiliária
                            </span>
                        </Link>

                        {/* ── Desktop Nav ── */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {NAV_ITEMS.map((item) => {
                                const active = isActive(item.key)
                                return (
                                    <Link
                                        key={item.key}
                                        href={`/${lang}/${item.key}`}
                                        className={`relative px-3 py-2 text-[13px] font-medium tracking-tight transition-colors duration-200 rounded-lg ${active
                                                ? 'text-[#1A1A1A]'
                                                : 'text-[#6C757D] hover:text-[#1A1A1A] hover:bg-black/[0.03]'
                                            }`}
                                    >
                                        {item.label}
                                        {active && (
                                            <motion.div
                                                layoutId="nav-indicator"
                                                className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#C49D5B] rounded-full"
                                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* ── Desktop Right ── */}
                        <div className="hidden lg:flex items-center gap-4">
                            {/* Lang selector */}
                            <div className="flex items-center gap-1 border-r border-black/10 pr-4 mr-1">
                                {LANGS.map((l) => (
                                    <Link
                                        key={l.code}
                                        href={`/${l.code}`}
                                        className={`text-[11px] font-bold px-1.5 py-0.5 rounded transition-colors duration-150 ${lang === l.code
                                                ? 'text-[#C49D5B]'
                                                : 'text-[#ADB5BD] hover:text-[#495057]'
                                            }`}
                                    >
                                        {l.label}
                                    </Link>
                                ))}
                            </div>

                            {/* WhatsApp CTA */}
                            <a
                                href="https://wa.me/5581997230455"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#C49D5B] text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.97]"
                            >
                                <MessageCircle size={14} strokeWidth={2.5} />
                                WhatsApp
                            </a>
                        </div>

                        {/* ── Mobile Toggle ── */}
                        <button
                            onClick={() => setOpen(!open)}
                            className="lg:hidden p-2 rounded-xl hover:bg-black/[0.04] transition-colors text-[#1A1A1A] z-[110]"
                            aria-label="Menu"
                        >
                            {open ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* ─── MOBILE DRAWER ─── */}
            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[105] lg:hidden"
                            onClick={() => setOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed top-0 right-0 h-full w-full max-w-[340px] bg-white z-[110] lg:hidden flex flex-col shadow-2xl"
                        >
                            {/* Header row */}
                            <div className="flex items-center justify-between px-8 h-[68px] border-b border-black/5 flex-shrink-0">
                                <span
                                    className="text-xl font-black text-[#1A1A1A]"
                                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                >
                                    IMI
                                </span>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="p-2 rounded-xl hover:bg-black/[0.04] text-[#6C757D] transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Nav items */}
                            <nav className="flex-1 overflow-y-auto px-5 py-6">
                                <div className="space-y-1">
                                    {NAV_ITEMS.map((item, i) => {
                                        const active = isActive(item.key)
                                        return (
                                            <motion.div
                                                key={item.key}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.04, duration: 0.25 }}
                                            >
                                                <Link
                                                    href={`/${lang}/${item.key}`}
                                                    onClick={() => setOpen(false)}
                                                    className={`flex items-center h-[52px] px-4 rounded-xl text-[16px] font-semibold transition-all duration-150 ${active
                                                            ? 'bg-[#F8F9FA] text-[#1A1A1A] border-l-[3px] border-[#C49D5B]'
                                                            : 'text-[#495057] hover:bg-[#F8F9FA] hover:text-[#1A1A1A]'
                                                        }`}
                                                >
                                                    {item.label}
                                                </Link>
                                            </motion.div>
                                        )
                                    })}
                                </div>

                                {/* WhatsApp button */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="mt-8"
                                >
                                    <a
                                        href="https://wa.me/5581997230455"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => setOpen(false)}
                                        className="flex items-center justify-center gap-2 w-full bg-[#1A1A1A] hover:bg-[#C49D5B] text-white font-bold text-[15px] h-[52px] rounded-xl transition-all duration-200 active:scale-[0.97] shadow-lg"
                                    >
                                        <MessageCircle size={18} />
                                        Falar pelo WhatsApp
                                    </a>
                                </motion.div>

                                {/* Language flags */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.35 }}
                                    className="flex gap-2 mt-6"
                                >
                                    {LANGS.map((l) => (
                                        <Link
                                            key={l.code}
                                            href={`/${l.code}`}
                                            onClick={() => setOpen(false)}
                                            className={`w-11 h-11 flex items-center justify-center rounded-xl text-xl transition-all duration-150 ${lang === l.code
                                                    ? 'bg-[#1A1A1A] ring-2 ring-[#C49D5B]'
                                                    : 'bg-[#F8F9FA] opacity-50 hover:opacity-100'
                                                }`}
                                        >
                                            {l.flag}
                                        </Link>
                                    ))}
                                </motion.div>

                                {/* Credential card */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="mt-8 p-5 bg-[#F8F9FA] rounded-2xl border border-black/[0.05]"
                                >
                                    <p className="font-bold text-[#1A1A1A] text-[15px]">Iule Miranda</p>
                                    <div className="h-[2px] w-8 bg-[#C49D5B] my-2 rounded-full" />
                                    <p className="text-[10px] text-[#ADB5BD] font-bold uppercase tracking-[0.2em]">
                                        CRECI 17933 | CNAI 53290
                                    </p>
                                    <a
                                        href="https://wa.me/5581997230455"
                                        className="text-[12px] text-[#6C757D] mt-2 block hover:text-[#1A1A1A] transition-colors"
                                    >
                                        +55 81 99723-0455
                                    </a>
                                </motion.div>
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
