'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ArrowRight, ShoppingCart, Clock, Filter } from 'lucide-react'
import Image from 'next/image'
import type { Ebook } from './page'

interface Pilar {
    key: string
    label: string
}

interface Props {
    ebooks: Ebook[]
    pilares: Pilar[]
}

const PILAR_COLORS: Record<string, { text: string; bg: string; border: string }> = {
    avaliacao:     { text: '#9FB3C8', bg: 'rgba(159,179,200,0.08)', border: 'rgba(159,179,200,0.15)' },
    investimentos: { text: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.15)' },
    internacional: { text: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.15)' },
    patrimonial:   { text: '#c9a040', bg: 'rgba(201,160,64,0.08)', border: 'rgba(201,160,64,0.15)' },
    operacao:      { text: '#f472b6', bg: 'rgba(244,114,182,0.08)', border: 'rgba(244,114,182,0.15)' },
    tecnologia:    { text: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.15)' },
}

const PILAR_LABELS: Record<string, string> = {
    avaliacao:     'Avaliação',
    investimentos: 'Investimentos',
    internacional: 'Internacional',
    patrimonial:   'Patrimônio',
    operacao:      'Operação',
    tecnologia:    'Tecnologia',
}

export default function BibliotecaClient({ ebooks, pilares }: Props) {
    const [activeFilter, setActiveFilter] = useState('todos')

    const filtered = activeFilter === 'todos'
        ? ebooks
        : ebooks.filter(e => e.pilar === activeFilter)

    const publishedCount = ebooks.filter(e => e.publication_status === 'publicado').length
    const soonCount = ebooks.filter(e => e.publication_status === 'em_breve').length

    return (
        <main className="min-h-screen bg-[#0D1117]">
            {/* ── Hero ─────────────────────────────────── */}
            <section className="relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-20">
                {/* Background glow */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] sm:w-[700px] sm:h-[400px] pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse at top, rgba(51,78,104,0.18) 0%, transparent 70%)',
                        filter: 'blur(60px)',
                    }}
                />
                <div className="max-w-[1280px] mx-auto px-6 lg:px-8 relative z-10">
                    {/* Eyebrow */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-3 mb-6"
                    >
                        <div className="w-8 h-px bg-[#334E68]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#486581]">
                            Inteligência Imobiliária
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.05 }}
                        className="text-3xl md:text-5xl font-bold text-white mb-4 max-w-2xl leading-tight"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                        Biblioteca IMI
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-[15px] text-white/50 max-w-xl leading-relaxed mb-8"
                    >
                        Publicações técnicas e estratégicas sobre avaliação imobiliária, investimentos e
                        inteligência patrimonial — produzidas pelos especialistas da IMI.
                    </motion.p>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="flex items-center gap-6"
                    >
                        {publishedCount > 0 && (
                            <div className="flex items-center gap-2">
                                <BookOpen size={14} className="text-[#34d399]" />
                                <span className="text-[13px] text-white/60">
                                    <span className="text-white font-semibold">{publishedCount}</span> disponível{publishedCount !== 1 ? 'eis' : ''}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="text-[#c9a040]" />
                            <span className="text-[13px] text-white/60">
                                <span className="text-white font-semibold">{soonCount}</span> em breve
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter size={14} className="text-[#486581]" />
                            <span className="text-[13px] text-white/60">
                                <span className="text-white font-semibold">{pilares.length - 1}</span> pilares
                            </span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Filter Tabs ───────────────────────────── */}
            <section className="sticky top-0 z-30 bg-[#0D1117]/95 backdrop-blur-md border-b border-white/[0.05]">
                <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
                    <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
                        {pilares.map(p => {
                            const isActive = activeFilter === p.key
                            const color = p.key !== 'todos' ? PILAR_COLORS[p.key] : null
                            return (
                                <button
                                    key={p.key}
                                    onClick={() => setActiveFilter(p.key)}
                                    className="relative flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200"
                                    style={{
                                        color: isActive
                                            ? (color?.text || '#ffffff')
                                            : 'rgba(255,255,255,0.45)',
                                        background: isActive
                                            ? (color?.bg || 'rgba(255,255,255,0.08)')
                                            : 'transparent',
                                        border: isActive
                                            ? `1px solid ${color?.border || 'rgba(255,255,255,0.12)'}`
                                            : '1px solid transparent',
                                    }}
                                >
                                    {p.label}
                                    {isActive && (
                                        <motion.div
                                            layoutId="filter-pill"
                                            className="absolute inset-0 rounded-full"
                                            style={{
                                                background: color?.bg || 'rgba(255,255,255,0.06)',
                                                border: `1px solid ${color?.border || 'rgba(255,255,255,0.1)'}`,
                                            }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                        />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ── Grid ────────────────────────────────── */}
            <section className="py-12 lg:py-16">
                <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
                    <AnimatePresence mode="wait">
                        {filtered.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-24"
                            >
                                <BookOpen size={40} className="mx-auto mb-4 text-white/20" />
                                <p className="text-white/40 text-sm">Nenhuma publicação neste pilar ainda.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={activeFilter}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                            >
                                {filtered.map((ebook, i) => (
                                    <EbookCard key={ebook.id} ebook={ebook} index={i} />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* ── CTA strip ─────────────────────────────── */}
            <section className="py-16 border-t border-white/[0.05]">
                <div className="max-w-[1280px] mx-auto px-6 lg:px-8 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#486581] mb-3">
                        Seja o primeiro a saber
                    </p>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        Novos títulos toda temporada
                    </h2>
                    <p className="text-[14px] text-white/40 mb-6 max-w-md mx-auto">
                        Siga a IMI nas redes sociais e receba notificações quando novos ebooks forem lançados.
                    </p>
                    <a
                        href="https://wa.me/5581997230455"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-[#0D1117] transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
                        style={{ background: 'linear-gradient(135deg, #c9a040, #a07830)' }}
                    >
                        Falar com especialista <ArrowRight size={14} />
                    </a>
                </div>
            </section>
        </main>
    )
}

function EbookCard({ ebook, index }: { ebook: Ebook; index: number }) {
    const isAvailable = ebook.publication_status === 'publicado'
    const pilarColor = ebook.pilar ? PILAR_COLORS[ebook.pilar] : null
    const pilarLabel = ebook.pilar ? PILAR_LABELS[ebook.pilar] : null

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.4 }}
            className="group relative flex flex-col rounded-2xl overflow-hidden border border-white/[0.06] transition-all duration-300 hover:border-white/[0.12]"
            style={{ background: '#141420' }}
        >
            {/* Cover */}
            <div
                className="relative w-full aspect-[3/4] bg-[#0A0D13] flex items-center justify-center overflow-hidden"
                style={{ minHeight: 220 }}
            >
                {ebook.cover_image ? (
                    <Image
                        src={ebook.cover_image}
                        alt={ebook.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                ) : (
                    <PlaceholderCover title={ebook.title} pilar={ebook.pilar} />
                )}

                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141420] via-transparent to-transparent opacity-60" />

                {/* Status badge */}
                <div className="absolute top-3 left-3">
                    {isAvailable ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                            style={{ color: '#34d399', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.2)' }}>
                            Amazon
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                            style={{ color: '#c9a040', background: 'rgba(201,160,64,0.12)', border: '1px solid rgba(201,160,64,0.2)' }}>
                            Em Breve
                        </span>
                    )}
                </div>

                {/* Pilar badge */}
                {pilarLabel && pilarColor && (
                    <div className="absolute top-3 right-3">
                        <span
                            className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                            style={{ color: pilarColor.text, background: pilarColor.bg, border: `1px solid ${pilarColor.border}` }}
                        >
                            {pilarLabel}
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-5">
                <h3 className="text-[14px] font-bold text-white leading-snug mb-1 group-hover:text-white/90 transition-colors">
                    {ebook.title}
                </h3>
                {ebook.subtitle && (
                    <p className="text-[11px] text-white/40 mb-3 leading-relaxed">{ebook.subtitle}</p>
                )}
                {!ebook.subtitle && ebook.description && (
                    <p className="text-[11px] text-white/35 mb-3 line-clamp-2 leading-relaxed">{ebook.description}</p>
                )}

                <div className="mt-auto">
                    {isAvailable && (ebook.amazon_link || ebook.amazon_url) ? (
                        <a
                            href={ebook.amazon_link || ebook.amazon_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-200 hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg, #c9a040, #a07830)', color: '#0D1117' }}
                        >
                            <ShoppingCart size={13} /> Comprar na Amazon
                        </a>
                    ) : (
                        <button
                            disabled
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[12px] font-semibold cursor-default"
                            style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                            <Clock size={13} /> Em breve
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

function PlaceholderCover({ title, pilar }: { title: string; pilar: string | null }) {
    const fallbackColor = { text: '#486581', bg: 'rgba(72,101,129,0.1)', border: 'rgba(72,101,129,0.2)' }
    const color = (pilar && pilar in PILAR_COLORS) ? PILAR_COLORS[pilar] : fallbackColor
    const initials = title
        .split(' ')
        .filter(w => w.length > 3)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('')
        || title.slice(0, 2).toUpperCase()

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6"
            style={{ background: 'linear-gradient(145deg, #0E1420 0%, #141A2A 100%)' }}>
            {/* Decorative lines */}
            <div className="absolute top-4 left-4 right-4 h-px" style={{ background: color.text, opacity: 0.1 }} />
            <div className="absolute top-5 left-4 right-4 h-px" style={{ background: color.text, opacity: 0.06 }} />
            <div className="absolute bottom-4 left-4 right-4 h-px" style={{ background: color.text, opacity: 0.1 }} />
            <div className="absolute bottom-5 left-4 right-4 h-px" style={{ background: color.text, opacity: 0.06 }} />

            {/* Monogram */}
            <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-xl font-bold"
                style={{ background: color.bg, color: color.text, fontFamily: "'Playfair Display', Georgia, serif" }}
            >
                {initials}
            </div>

            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-center leading-relaxed"
                style={{ color: color.text, opacity: 0.6 }}>
                IMI<br />Inteligência<br />Imobiliária
            </p>
        </div>
    )
}
