import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { mapDbPropertyToDevelopment } from '@/modules/imoveis/utils/propertyMapper'
import { Development } from '@/app/[lang]/(website)/imoveis/types/development'

const GRADIENTS = [
    'from-[#0A1929] via-[#102A43] to-[#0D1F33]',
    'from-[#0D1117] via-[#1A2535] to-[#0A1929]',
    'from-[#0A1929] via-[#1A2F44] to-[#0D2340]',
    'from-[#0D1F33] via-[#14273A] to-[#0A1929]',
    'from-[#111827] via-[#1C2B3A] to-[#0D1F33]',
    'from-[#0A1929] via-[#0D2340] to-[#162136]',
]

const formatPrice = (price: number) => {
    if (!price || price <= 0) return null
    if (price >= 1000000) {
        const m = price / 1000000
        return `R$ ${m % 1 === 0 ? m : m.toFixed(1)}M`
    }
    return `R$ ${(price / 1000).toFixed(0)}k`
}

function FeaturedCard({
    dev,
    large = false,
    gradient,
    className = '',
    lang = 'pt',
}: {
    dev: Development
    large?: boolean
    gradient: string
    className?: string
    lang?: string
}) {
    const hasImage = !!(dev.images.main && dev.images.main.length > 10)
    const price = formatPrice(dev.priceRange.min)
    const statusLabel = dev.status === 'ready' ? 'Pronto' : dev.status === 'under_construction' ? 'Em Obra' : 'Lançamento'
    const statusColor = dev.status === 'ready'
        ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700/30'
        : dev.status === 'launch'
        ? 'bg-blue-900/40 text-blue-300 border-blue-700/30'
        : 'bg-white/10 text-white/70 border-white/10'
    // country shorthand
    const country = dev.location.country && dev.location.country !== 'Brasil' ? dev.location.country : null

    return (
        <Link
            href={`/${lang}/imoveis/${dev.slug}`}
            className={`group relative block overflow-hidden rounded-2xl ${className}`}
        >
            {/* Background */}
            {hasImage ? (
                <Image
                    src={dev.images.main!}
                    alt={dev.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 67vw, 853px"
                />
            ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
                    <div
                        className="absolute inset-0 opacity-[0.04]"
                        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '28px 28px' }}
                    />
                    <div
                        className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-25"
                        style={{ background: 'radial-gradient(circle, #334E68 0%, transparent 70%)', filter: 'blur(40px)' }}
                    />
                </div>
            )}

            {/* Gradient overlay — stronger for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#060E18]/98 via-[#060E18]/40 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
                {/* Top row */}
                <div className="flex items-start justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-sm ${statusColor}`}>
                        {statusLabel}
                    </span>
                    {country ? (
                        <span className="text-[10px] font-semibold text-white/50 uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/8 border border-white/10">
                            {country}
                        </span>
                    ) : (
                        <span className="text-[10px] font-medium text-white/35 uppercase tracking-widest">
                            {dev.location.state}
                        </span>
                    )}
                </div>

                {/* Bottom content */}
                <div>
                    <p className="flex items-center gap-1 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#627D98] mb-1.5">
                        <MapPin size={8} />
                        {dev.location.neighborhood}, {dev.location.city}
                    </p>
                    <h3
                        className={`font-bold text-white leading-tight mb-3 ${large ? 'text-2xl sm:text-[28px]' : 'text-base sm:text-lg'}`}
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                        {dev.name}
                    </h3>
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            {price && (
                                <>
                                    <p className="text-[9px] text-white/35 uppercase tracking-wider mb-0.5">A partir de</p>
                                    <p className={`font-bold text-white ${large ? 'text-lg' : 'text-sm'}`}>{price}</p>
                                </>
                            )}
                        </div>
                        <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-300 group-hover:scale-110"
                            style={{ background: 'rgba(200,166,90,0.15)', borderColor: 'rgba(200,166,90,0.3)' }}>
                            <ArrowRight size={13} className="text-white transition-transform duration-300 group-hover:translate-x-0.5" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default async function FeaturedDevelopments({ lang = 'pt' }: { lang?: string }) {
    try {
        const supabase = await createClient()

        // Fetch up to 6 highlighted properties
        const { data } = await supabase
            .from('developments')
            .select('*, developers(id, name, slug, logo_url)')
            .eq('status_commercial', 'published')
            .eq('is_highlighted', true)
            .order('created_at', { ascending: false })
            .limit(6)

        const developments: Development[] = (data || []).map(mapDbPropertyToDevelopment)
        if (developments.length === 0) return null

        const top3 = developments.slice(0, 3)
        const extra = developments.slice(3, 6)

        return (
            <section className="py-16 lg:py-24" style={{ background: '#F8F9FA' }}>
                <div className="max-w-[1280px] mx-auto px-6 lg:px-8">

                    {/* Section header */}
                    <div className="flex items-end justify-between mb-8 sm:mb-10">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-px" style={{ background: '#C8A65A' }} />
                                <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: '#C8A65A' }}>Portfólio em Destaque</span>
                            </div>
                            <h2
                                className="text-[26px] sm:text-[32px] font-bold text-[#1A1A1A] leading-tight"
                                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                            >
                                Empreendimentos{' '}
                                <span className="text-[#334E68]">Selecionados</span>
                            </h2>
                            <p className="text-sm text-gray-500 mt-2">Recife · João Pessoa · Dubai · EUA</p>
                        </div>
                        <Link
                            href={`/${lang}/imoveis`}
                            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#486581] hover:text-[#334E68] transition-colors group"
                        >
                            Ver portfólio completo
                            <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                        </Link>
                    </div>

                    {/* ── Hero bento — top 3 ── */}
                    {top3.length === 1 && (
                        <FeaturedCard dev={top3[0]} large gradient={GRADIENTS[0]} className="h-[380px] sm:h-[420px]" lang={lang} />
                    )}
                    {top3.length === 2 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FeaturedCard dev={top3[0]} large gradient={GRADIENTS[0]} className="h-[340px]" lang={lang} />
                            <FeaturedCard dev={top3[1]} large gradient={GRADIENTS[1]} className="h-[340px]" lang={lang} />
                        </div>
                    )}
                    {top3.length >= 3 && (
                        <>
                            {/* Mobile: vertical stack */}
                            <div className="flex flex-col gap-3 sm:hidden">
                                {top3.map((dev, i) => (
                                    <FeaturedCard key={dev.id} dev={dev} gradient={GRADIENTS[i]} className="h-[280px]" lang={lang} />
                                ))}
                            </div>
                            {/* Desktop: bento (large left + 2 stacked right) */}
                            <div className="hidden sm:flex gap-3 items-stretch" style={{ height: '420px' }}>
                                <div className="flex-[2]">
                                    <FeaturedCard dev={top3[0]} large gradient={GRADIENTS[0]} className="h-full" lang={lang} />
                                </div>
                                <div className="flex-1 flex flex-col gap-3">
                                    <FeaturedCard dev={top3[1]} gradient={GRADIENTS[1]} className="flex-1" lang={lang} />
                                    <FeaturedCard dev={top3[2]} gradient={GRADIENTS[2]} className="flex-1" lang={lang} />
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── Extra row — cards 4-6 ── */}
                    {extra.length > 0 && (
                        <div className={`grid gap-3 mt-3 grid-cols-1 sm:grid-cols-${extra.length}`}>
                            {extra.map((dev, i) => (
                                <FeaturedCard
                                    key={dev.id}
                                    dev={dev}
                                    gradient={GRADIENTS[3 + i]}
                                    className="h-[220px] sm:h-[240px]"
                                    lang={lang}
                                />
                            ))}
                        </div>
                    )}

                    {/* Mobile CTA */}
                    <div className="sm:hidden mt-6 text-center">
                        <Link
                            href={`/${lang}/imoveis`}
                            className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full text-white"
                            style={{ background: '#102A43' }}
                        >
                            Ver portfólio completo <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </section>
        )
    } catch {
        return null
    }
}
