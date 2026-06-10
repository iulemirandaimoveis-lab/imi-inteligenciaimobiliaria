'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ArrowRight, ShoppingCart, Clock, Filter, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ButtonPrimary, ButtonGhost } from '@/components/website/Buttons'
import type { Ebook } from './page'

interface Pilar {
    key: string
    label: string
}

interface Props {
    ebooks: Ebook[]
    pilares: Pilar[]
    bookSlugs?: string[]
}

const PILAR_COLORS: Record<string, { text: string; bg: string; border: string; gradient: string }> = {
    avaliacao:     { text: '#9FB3C8', bg: 'rgba(159,179,200,0.08)', border: 'rgba(159,179,200,0.15)', gradient: 'linear-gradient(160deg, #0F1D30 0%, #1A2D45 50%, #0D1928 100%)' },
    investimentos: { text: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.15)', gradient: 'linear-gradient(160deg, #0A1E18 0%, #102E22 50%, #081A14 100%)' },
    internacional: { text: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.15)', gradient: 'linear-gradient(160deg, #0A1628 0%, #0F2040 50%, #0A1420 100%)' },
    patrimonial:   { text: '#c9a040', bg: 'rgba(201,160,64,0.08)', border: 'rgba(201,160,64,0.15)', gradient: 'linear-gradient(160deg, #1A1508 0%, #2A2210 50%, #151008 100%)' },
    operacao:      { text: '#f472b6', bg: 'rgba(244,114,182,0.08)', border: 'rgba(244,114,182,0.15)', gradient: 'linear-gradient(160deg, #1A0A14 0%, #2A1020 50%, #150810 100%)' },
    tecnologia:    { text: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.15)', gradient: 'linear-gradient(160deg, #110A20 0%, #1A1030 50%, #0E0818 100%)' },
}

const PILAR_LABELS: Record<string, string> = {
    avaliacao:     'Avaliação',
    investimentos: 'Investimentos',
    internacional: 'Internacional',
    patrimonial:   'Patrimônio',
    operacao:      'Operação',
    tecnologia:    'Tecnologia',
}

export default function BibliotecaClient({ ebooks, pilares, bookSlugs = [] }: Props) {
    const params = useParams()
    const lang = (params?.lang as string) || 'pt'
    const [activeFilter, setActiveFilter] = useState('todos')

    const filtered = activeFilter === 'todos'
        ? ebooks
        : ebooks.filter(e => e.pilar === activeFilter)

    const publishedCount = ebooks.filter(e => e.publication_status === 'publicado').length
    const soonCount = ebooks.filter(e => e.publication_status === 'em_breve').length

    return (
        <main className="min-h-screen bg-[#0B1928]">
            {/* ── Hero ─────────────────────────────────── */}
            <section className="relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-20">
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] sm:w-[700px] sm:h-[400px] pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse at top, rgba(200,164,74,0.06) 0%, transparent 70%)',
                        filter: 'blur(80px)',
                    }}
                />
                <div className="max-w-[1280px] mx-auto px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-3 mb-6"
                    >
                        <div className="w-8 h-px" style={{ background: '#C8A44A' }} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: '#C8A44A' }}>
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

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="flex items-center gap-6"
                    >
                        <div className="flex items-center gap-2">
                            <BookOpen size={14} className="text-white/40" />
                            <span className="text-[13px] text-white/50">
                                <span className="text-white font-semibold">{ebooks.length}</span> títulos
                            </span>
                        </div>
                        {publishedCount > 0 && (
                            <div className="flex items-center gap-2">
                                <ShoppingCart size={14} style={{ color: '#34d399' }} />
                                <span className="text-[13px] text-white/50">
                                    <span className="text-white font-semibold">{publishedCount}</span> disponíve{publishedCount !== 1 ? 'is' : 'l'}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Clock size={14} style={{ color: '#C8A44A' }} />
                            <span className="text-[13px] text-white/50">
                                <span className="text-white font-semibold">{soonCount}</span> em breve
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter size={14} className="text-navy-300" />
                            <span className="text-[13px] text-white/50">
                                <span className="text-white font-semibold">{pilares.length - 1}</span> pilares
                            </span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Filter Tabs ───────────────────────────── */}
            <section className="sticky top-0 z-30 bg-[#0B1928]/95 backdrop-blur-md border-b border-white/[0.05]">
                <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
                    <div className="flex items-center gap-1.5 overflow-x-auto py-3 scrollbar-hide" role="tablist" aria-label="Filtrar por pilar">
                        {pilares.map(p => {
                            const isActive = activeFilter === p.key
                            const color = p.key !== 'todos' ? PILAR_COLORS[p.key] : null
                            const count = p.key === 'todos' ? ebooks.length : ebooks.filter(e => e.pilar === p.key).length
                            return (
                                <button
                                    key={p.key}
                                    onClick={() => setActiveFilter(p.key)}
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-controls="ebooks-grid"
                                    className="relative flex-shrink-0 px-4 py-2.5 min-h-[44px] rounded-full text-[12px] font-semibold transition-all duration-200"
                                    style={{
                                        color: isActive ? (color?.text || '#ffffff') : 'rgba(255,255,255,0.45)',
                                        background: isActive ? (color?.bg || 'rgba(255,255,255,0.08)') : 'transparent',
                                        border: isActive ? `1px solid ${color?.border || 'rgba(255,255,255,0.12)'}` : '1px solid transparent',
                                    }}
                                >
                                    {p.label}
                                    <span className="ml-1.5 text-[10px] opacity-60">({count})</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ── Grid ────────────────────────────────── */}
            <section id="ebooks-grid" className="py-12 lg:py-16">
                <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
                    {/* Result count */}
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-6">
                        {filtered.length} {filtered.length === 1 ? 'título' : 'títulos'}
                        {activeFilter !== 'todos' && ` em ${PILAR_LABELS[activeFilter] || activeFilter}`}
                    </p>

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
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {filtered.map((ebook, i) => (
                                    <EbookCard key={ebook.id} ebook={ebook} index={i} lang={lang} bookSlugs={bookSlugs} />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* ── WhatsApp CTA ─────────────────────────── */}
            <section className="py-16 border-t border-white/[0.05]">
                <div className="max-w-[1280px] mx-auto px-6 lg:px-8 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-[0.25em] mb-3" style={{ color: '#C8A44A' }}>
                        Seja o primeiro a saber
                    </p>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        Novos títulos toda temporada
                    </h2>
                    <p className="text-[14px] text-white/40 mb-6 max-w-md mx-auto">
                        Receba notificações quando novos ebooks forem lançados e acesse conteúdo exclusivo.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <a
                            href="https://wa.me/5581986141487?text=Ol%C3%A1!%20Gostaria%20de%20ser%20avisada(o)%20quando%20novos%20ebooks%20da%20IMI%20forem%20lan%C3%A7ados."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 text-[11px] font-semibold uppercase tracking-[1px] transition-all duration-200 hover:brightness-110"
                            style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: '#fff', height: 52, borderRadius: 6 }}
                        >
                            <MessageCircle size={15} /> Quero ser avisado via WhatsApp
                        </a>
                        <ButtonGhost
                            href="https://wa.me/5581986141487"
                            target="_blank"
                            rel="noopener noreferrer"
                            arrow
                            dark
                            strong
                        >
                            Falar com especialista
                        </ButtonGhost>
                    </div>
                </div>
            </section>
        </main>
    )
}

function EbookCard({ ebook, index, lang, bookSlugs }: { ebook: Ebook; index: number; lang: string; bookSlugs: string[] }) {
    const isAvailable = ebook.publication_status === 'publicado'
    const hasBookContent = bookSlugs.includes(ebook.slug)
    const pilarColor = ebook.pilar ? PILAR_COLORS[ebook.pilar] : null
    const pilarLabel = ebook.pilar ? PILAR_LABELS[ebook.pilar] : null
    const svgUrl = useMemo(() => `/books/covers/${ebook.slug}.svg`, [ebook.slug])

    // Inline SVG: fetched client-side so page fonts (Playfair Display) render in the SVG text
    const [svgHtml, setSvgHtml] = useState('')
    const [svgLoaded, setSvgLoaded] = useState(false)

    useEffect(() => {
        if (ebook.cover_image) return
        let cancelled = false
        fetch(svgUrl)
            .then(r => r.ok ? r.text() : Promise.reject())
            .then(text => {
                if (cancelled) return
                // Strip XML declaration; make SVG fill its container
                const html = text
                    .replace(/<\?xml[^>]*?\?>\s*/s, '')
                    .replace(/<svg(\s[^>]*)>/, (_: string, attrs: string) =>
                        `<svg${attrs
                            .replace(/width="[^"]*"/, 'width="100%"')
                            .replace(/height="[^"]*"/, 'height="100%"')
                        } style="position:absolute;inset:0;display:block">`)
                setSvgHtml(html)
                setSvgLoaded(true)
            })
            .catch(() => { /* fall through to PlaceholderCover */ })
        return () => { cancelled = true }
    }, [svgUrl, ebook.cover_image])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.4 }}
            className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 active:scale-[0.98]"
            style={{
                background: '#0d2035',
                border: '1px solid rgba(255,255,255,0.06)',
                WebkitTapHighlightColor: 'transparent',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = pilarColor?.border || 'rgba(200,164,74,0.3)'
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${pilarColor?.border || 'rgba(200,164,74,0.15)'}`
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
            }}
        >
            {/* Cover */}
            <div className="relative w-full aspect-[3/4] overflow-hidden" style={{ minHeight: 240 }}>
                {ebook.cover_image ? (
                    <Image
                        src={ebook.cover_image}
                        alt={ebook.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                ) : svgLoaded ? (
                    /* Inline SVG: Playfair Display from the page's CSS renders correctly */
                    <div
                        className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]"
                        aria-hidden="true"
                        dangerouslySetInnerHTML={{ __html: svgHtml }}
                    />
                ) : (
                    <PlaceholderCover title={ebook.title} subtitle={ebook.subtitle} pilar={ebook.pilar} />
                )}

                {/* Bottom gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d2035] via-transparent to-transparent opacity-80" />

                {/* Badges — top-right, stacked, clear of IMI logo at top-left */}
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                    {isAvailable ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm"
                            style={{ color: '#34d399', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.25)' }}>
                            Disponível
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm"
                            style={{ color: '#E8C840', background: 'rgba(232,200,64,0.12)', border: '1px solid rgba(232,200,64,0.25)' }}>
                            Em Breve
                        </span>
                    )}
                    {pilarLabel && pilarColor && (
                        <span
                            className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full backdrop-blur-sm"
                            style={{ color: pilarColor.text, background: pilarColor.bg, border: `1px solid ${pilarColor.border}` }}
                        >
                            {pilarLabel}
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-5">
                <h3 className="text-[15px] font-bold text-white leading-snug mb-1.5 group-hover:text-white/90 transition-colors"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    {ebook.title}
                </h3>
                {ebook.subtitle && (
                    <p className="text-[12px] text-white/45 mb-3 leading-relaxed">{ebook.subtitle}</p>
                )}
                {!ebook.subtitle && ebook.description && (
                    <p className="text-[12px] text-white/35 mb-3 line-clamp-2 leading-relaxed">{ebook.description}</p>
                )}

                <div className="mt-auto pt-2 space-y-2">
                    {hasBookContent && (
                        <ButtonPrimary
                            href={`/${lang}/biblioteca/${ebook.slug}`}
                            icon={<BookOpen size={14} />}
                            arrow={false}
                            full
                            size="sm"
                        >
                            Ler Agora
                        </ButtonPrimary>
                    )}
                    {!hasBookContent && isAvailable && (ebook.amazon_link || ebook.amazon_url) ? (
                        <ButtonPrimary
                            href={ebook.amazon_link || ebook.amazon_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            icon={<ShoppingCart size={13} />}
                            arrow={false}
                            full
                            size="sm"
                        >
                            Adquirir na Amazon
                        </ButtonPrimary>
                    ) : !hasBookContent ? (
                        <ButtonGhost
                            href="https://wa.me/5581986141487?text=Ol%C3%A1!%20Tenho%20interesse%20no%20ebook%20da%20IMI%20sobre%20esse%20tema."
                            target="_blank"
                            rel="noopener noreferrer"
                            icon={<MessageCircle size={13} />}
                            arrow={false}
                            full
                            size="sm"
                            dark
                        >
                            Avise-me quando sair
                        </ButtonGhost>
                    ) : null}
                </div>
            </div>
        </motion.div>
    )
}

function PlaceholderCover({ title, subtitle, pilar }: { title: string; subtitle: string | null; pilar: string | null }) {
    const color = pilar ? PILAR_COLORS[pilar] : null
    const accentColor = color?.text || '#C8A44A'

    return (
        <div
            className="absolute inset-0 flex flex-col justify-between overflow-hidden"
            style={{
                background: color?.gradient || 'linear-gradient(160deg, #0A1624 0%, #162840 50%, #0D1928 100%)',
                padding: '24px 20px',
            }}
        >
            {/* Top: IMI watermark + accent line */}
            <div>
                <div style={{
                    width: 40, height: 2, borderRadius: 1,
                    background: `linear-gradient(90deg, ${accentColor}, transparent)`,
                    marginBottom: 12,
                }} />
                <p style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 11,
                    fontWeight: 700,
                    color: accentColor,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    opacity: 0.6,
                    margin: 0,
                }}>
                    IMI
                </p>
            </div>

            {/* Bottom: Book title */}
            <div>
                <p style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 17,
                    fontWeight: 700,
                    color: '#E8E4DC',
                    lineHeight: 1.3,
                    margin: '0 0 6px 0',
                }}>
                    {title}
                </p>
                {subtitle && (
                    <p style={{
                        fontSize: 11,
                        color: 'rgba(232,228,220,0.4)',
                        margin: 0,
                        lineHeight: 1.4,
                    }}>
                        {subtitle}
                    </p>
                )}
                <div style={{
                    width: '100%', height: 1, marginTop: 12,
                    background: `linear-gradient(90deg, ${accentColor}40, transparent)`,
                }} />
            </div>

            {/* Subtle pattern overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at 80% 20%, ${accentColor}08 0%, transparent 50%)`,
                }}
            />
        </div>
    )
}
