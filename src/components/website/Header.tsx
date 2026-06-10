'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Menu, X, MessageCircle, ChevronDown } from 'lucide-react'

import { GlobalSettings } from '@/lib/settings'

interface HeaderProps {
    lang: string
    settings?: GlobalSettings
}

// Itens principais — sempre visíveis no desktop nav
const NAV_MAIN = [
    { key: 'avaliacoes', label: 'Avaliações' },
    { key: 'imoveis', label: 'Imóveis' },
    { key: 'credito', label: 'Crédito' },
    { key: 'consultoria', label: 'Consultoria' },
    { key: 'inteligencia', label: 'Inteligência' },
]

// Itens secundários — dentro do dropdown "Mais ▾"
const NAV_MORE = [
    { key: 'construtoras', label: 'Construtoras' },
    { key: 'biblioteca', label: 'Biblioteca' },
    { key: 'sobre', label: 'Sobre' },
    { key: 'contato', label: 'Contato' },
]

// Todos os itens para o drawer mobile
const NAV_ITEMS = [...NAV_MAIN, ...NAV_MORE]

const LANGS = [
    { code: 'pt', flag: '🇧🇷', label: 'PT' },
    { code: 'en', flag: '🇺🇸', label: 'EN' },
    { code: 'es', flag: '🇪🇸', label: 'ES' },
    { code: 'ja', flag: '🇯🇵', label: 'JP' },
    { code: 'ar', flag: '🇸🇦', label: 'AR' },
]

export default function Header({ lang, settings }: HeaderProps) {
    const [open, setOpen] = useState(false)
    const [moreOpen, setMoreOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const pathname = usePathname()
    const moreRef = useRef<HTMLDivElement>(null)

    // Parallax: header gold line shimmer on scroll
    const { scrollY } = useScroll()
    const goldLineOpacity = useTransform(scrollY, [0, 200], [0.3, 0.7])

    // Fechar dropdown "Mais" ao clicar fora
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
                setMoreOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Lock body scroll when drawer is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
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
                className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled
                    ? 'bg-[#0B1928]/95 backdrop-blur-xl shadow-[0_1px_0_rgba(200,164,74,0.08),0_4px_30px_rgba(0,0,0,0.3)]'
                    : 'bg-[#0B1928]/80 backdrop-blur-md border-b border-white/[0.04]'
                    }`}
            >
                {/* Gold accent line at bottom */}
                <motion.div
                    className="absolute bottom-0 left-0 right-0 h-[1px]"
                    style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(200,164,74,0.3) 20%, rgba(200,164,74,0.5) 50%, rgba(200,164,74,0.3) 80%, transparent 100%)',
                        opacity: goldLineOpacity,
                    }}
                />

                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-[60px] lg:h-[68px]">

                        {/* Logo — Brand Identity v1.1 DARK */}
                        <Link
                            href={`/${lang}`}
                            className="flex items-center gap-2.5 sm:gap-3 group flex-shrink-0"
                        >
                            <span
                                className="leading-none select-none transition-colors duration-300 group-hover:text-[#C8A44A]"
                                style={{
                                    fontFamily: "'Playfair Display', Georgia, serif",
                                    fontSize: 26,
                                    fontWeight: 700,
                                    color: '#FFFFFF',
                                    letterSpacing: '2px',
                                }}
                            >
                                IMI
                            </span>
                            {/* Gold divider */}
                            <div style={{ width: 1, height: 22, background: '#C8A44A', flexShrink: 0 }} />
                            {/* Tagline — white on dark bg */}
                            <span
                                className="select-none"
                                style={{
                                    fontSize: '7px',
                                    fontWeight: 600,
                                    letterSpacing: '2.2px',
                                    textTransform: 'uppercase',
                                    color: 'rgba(255,255,255,0.6)',
                                    lineHeight: 1.45,
                                }}
                            >
                                INTELIGÊNCIA<br />IMOBILIÁRIA
                            </span>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden lg:flex items-center gap-0.5">
                            {/* Itens principais */}
                            {NAV_MAIN.map((item) => {
                                const active = isActive(item.key)
                                return (
                                    <Link
                                        key={item.key}
                                        href={`/${lang}/${item.key}`}
                                        prefetch={true}
                                        className={`relative px-3 py-2 text-[13px] font-medium tracking-tight transition-colors duration-200 rounded-lg ${active
                                            ? 'text-white'
                                            : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                                            }`}
                                    >
                                        {item.label}
                                        {active && (
                                            <motion.div
                                                layoutId="nav-indicator"
                                                className="absolute bottom-0.5 left-3 right-3 h-[2px] rounded-full"
                                                style={{ background: 'linear-gradient(90deg, transparent 0%, #C8A44A 30%, #C8A44A 70%, transparent 100%)' }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                    </Link>
                                )
                            })}

                            {/* Dropdown "Mais ▾" */}
                            <div ref={moreRef} className="relative">
                                <button
                                    onClick={() => setMoreOpen(v => !v)}
                                    className={`flex items-center gap-1 px-3 py-2 text-[13px] font-medium tracking-tight transition-colors duration-200 rounded-lg ${NAV_MORE.some(i => isActive(i.key))
                                        ? 'text-white'
                                        : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                                        }`}
                                >
                                    Mais
                                    <ChevronDown
                                        size={13}
                                        className={`transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                <AnimatePresence>
                                    {moreOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute top-full right-0 mt-2 w-48 bg-[#0F2035] rounded-2xl shadow-xl border border-white/[0.08] py-1.5 z-[50] overflow-hidden"
                                        >
                                            {NAV_MORE.map((item) => {
                                                const active = isActive(item.key)
                                                return (
                                                    <Link
                                                        key={item.key}
                                                        href={`/${lang}/${item.key}`}
                                                        prefetch={true}
                                                        onClick={() => setMoreOpen(false)}
                                                        className={`flex items-center h-[40px] px-4 text-[13px] font-medium transition-colors duration-150 ${active
                                                            ? 'text-white bg-white/[0.06] border-l-[3px] border-[#C8A44A] pl-[13px]'
                                                            : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                                                            }`}
                                                    >
                                                        {item.label}
                                                    </Link>
                                                )
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </nav>

                        {/* Desktop Right */}
                        <div className="hidden lg:flex items-center gap-3">
                            <a
                                href={`https://wa.me/${settings?.companyPhone?.replace(/\D/g, '') || '5581986141487'}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative overflow-hidden inline-flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.12] text-white text-[13px] font-semibold px-5 py-2.5 rounded-full transition-all duration-300 border border-white/[0.15] hover:border-white/[0.25]"
                            >
                                <MessageCircle size={15} strokeWidth={2.5} />
                                WhatsApp
                                {/* Gold accent line — bottom detail */}
                                <span className="absolute bottom-0 left-[20%] right-[20%] h-[2px] rounded-sm pointer-events-none"
                                    style={{ background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)' }} />
                            </a>
                        </div>

                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setOpen(true)}
                            className="lg:hidden p-2.5 -mr-1 rounded-xl hover:bg-white/[0.06] transition-colors text-white/80 active:scale-[0.92] min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label="Abrir menu"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
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
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                            onClick={() => setOpen(false)}
                            aria-hidden="true"
                        />

                        {/* Drawer Panel — Dark Theme */}
                        <motion.div
                            key="drawer"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.7 }}
                            className="fixed top-0 right-0 bottom-0 w-[min(82vw,320px)] bg-[#0B1928] z-[210] flex flex-col shadow-2xl"
                            style={{ maxHeight: '100dvh' }}
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between px-5 h-[54px] border-b border-white/[0.06] flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="text-[18px] font-black text-white"
                                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                    >
                                        IMI
                                    </span>
                                    <div className="h-3.5 w-px bg-[#C8A44A]/40" />
                                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Navegação</span>
                                </div>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="p-2.5 rounded-lg hover:bg-white/[0.06] text-white/50 transition-colors active:scale-[0.92] min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="Fechar menu"
                                    style={{ WebkitTapHighlightColor: 'transparent' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Nav Items */}
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
                                                    prefetch={true}
                                                    onClick={() => setOpen(false)}
                                                    className={`flex items-center h-[46px] px-4 rounded-xl text-[14px] font-semibold transition-all duration-150 active:scale-[0.98] ${active
                                                        ? 'bg-white/[0.06] text-white border-l-[3px] border-[#C8A44A] pl-[13px]'
                                                        : 'text-white/50 hover:bg-white/[0.04] hover:text-white'
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
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="mt-4"
                                >
                                    <a
                                        href={`https://wa.me/${settings?.companyPhone?.replace(/\D/g, '') || '5581986141487'}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => setOpen(false)}
                                        className="relative overflow-hidden flex items-center justify-center gap-2 w-full bg-white/[0.06] hover:bg-white/[0.12] text-white font-bold text-[14px] h-[44px] rounded-xl transition-all duration-200 active:scale-[0.97] border border-white/[0.15]"
                                    >
                                        <MessageCircle size={16} />
                                        WhatsApp
                                        <span className="absolute bottom-0 left-[20%] right-[20%] h-[2px] rounded-sm pointer-events-none"
                                            style={{ background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)' }} />
                                    </a>
                                </motion.div>

                                {/* Language Selector */}
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
                                                ? 'bg-white/[0.08] ring-2 ring-[#C8A44A]/50 ring-offset-1 ring-offset-[#0B1928]'
                                                : 'bg-white/[0.03] border border-[#C8A44A]/30 hover:border-white/[0.06]'
                                                }`}
                                        >
                                            {l.flag}
                                        </Link>
                                    ))}
                                </motion.div>

                                {/* Credencial mínima */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.35 }}
                                    className="mt-3 px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-white text-[13px]">Iule Miranda</p>
                                        <p className="text-[10px] text-[#C8A44A]/60 font-bold uppercase tracking-[0.15em]">CRECI 17933</p>
                                    </div>
                                    <a
                                        href={`https://wa.me/${settings?.companyPhone?.replace(/\D/g, '') || '5581986141487'}`}
                                        className="text-[12px] text-white/30 mt-1 block hover:text-white transition-colors"
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
