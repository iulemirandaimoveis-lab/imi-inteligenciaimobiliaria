import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { mapDbPropertyToDevelopment } from '@/modules/imoveis/utils/propertyMapper'
import { Development } from '@/app/[lang]/(website)/imoveis/types/development'

const GRADIENTS = [
    'from-[#0A1929] via-[#102A43] to-[#0D1F33]',
    'from-[#0D1117] via-[#1A2535] to-[#0A1929]',
    'from-[#0A1929] via-[#1A2F44] to-[#0D2340]',
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
}: {
    dev: Development
    large?: boolean
    gradient: string
    className?: string
}) {
    const hasImage = !!(dev.images.main && dev.images.main.length > 10)
    const price = formatPrice(dev.priceRange.min)
    const statusLabel = dev.status === 'ready' ? 'Pronto' : dev.status === 'under_construction' ? 'Em Obra' : 'Lançamento'

    return (
        <Link
            href={`/pt/imoveis/${dev.slug}`}
            className={`group relative block overflow-hidden rounded-2xl ${className}`}
        >
            {/* Background */}
            {hasImage ? (
                <img
                    src={dev.images.main}
                    alt={dev.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
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

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#060E18]/95 via-[#060E18]/30 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
                {/* Top row */}
                <div className="flex items-start justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-white/75 border border-white/10 backdrop-blur-sm">
                        {statusLabel}
                    </span>
                    <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest">
                        {dev.location.state}
                    </span>
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
                        <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-white/10 border border-white/15 backdrop-blur-sm group-hover:bg-[#334E68] group-hover:border-[#334E68] transition-all duration-300">
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
        const { data } = await supabase
            .from('developments')
            .select('*, developers(id, name, slug, logo_url)')
            .eq('status_commercial', 'published')
            .eq('is_highlighted', true)
            .order('created_at', { ascending: false })
            .limit(3)

        const developments: Development[] = (data || []).map(mapDbPropertyToDevelopment)
        if (developments.length === 0) return null

        return (
            <section className="py-16 lg:py-20 bg-white">
                <div className="max-w-[1280px] mx-auto px-6 lg:px-8">

                    {/* Section header */}
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-px bg-[#334E68]" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#486581]">Em Destaque</span>
                            </div>
                            <h2
                                className="text-[26px] sm:text-[32px] font-bold text-[#1A1A1A] leading-tight"
                                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                            >
                                Empreendimentos<br className="sm:hidden" />{' '}
                                <span className="hidden sm:inline">Selecionados</span>
                                <span className="sm:hidden">Selecionados</span>
                            </h2>
                        </div>
                        <Link
                            href={`/${lang}/imoveis`}
                            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#486581] hover:text-[#334E68] transition-colors group"
                        >
                            Ver todos
                            <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                        </Link>
                    </div>

                    {/* Cards — bento layout */}
                    {developments.length === 1 && (
                        <FeaturedCard dev={developments[0]} large gradient={GRADIENTS[0]} className="h-[380px] sm:h-[420px]" />
                    )}

                    {developments.length === 2 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FeaturedCard dev={developments[0]} large gradient={GRADIENTS[0]} className="h-[340px]" />
                            <FeaturedCard dev={developments[1]} large gradient={GRADIENTS[1]} className="h-[340px]" />
                        </div>
                    )}

                    {developments.length >= 3 && (
                        <>
                            {/* Mobile: vertical stack */}
                            <div className="flex flex-col gap-3 sm:hidden">
                                {developments.map((dev, i) => (
                                    <FeaturedCard key={dev.id} dev={dev} gradient={GRADIENTS[i]} className="h-[280px]" />
                                ))}
                            </div>

                            {/* Desktop: bento (large left + 2 stacked right) */}
                            <div className="hidden sm:flex gap-3 items-stretch" style={{ height: '420px' }}>
                                <div className="flex-[2]">
                                    <FeaturedCard dev={developments[0]} large gradient={GRADIENTS[0]} className="h-full" />
                                </div>
                                <div className="flex-1 flex flex-col gap-3">
                                    <FeaturedCard dev={developments[1]} gradient={GRADIENTS[1]} className="flex-1" />
                                    <FeaturedCard dev={developments[2]} gradient={GRADIENTS[2]} className="flex-1" />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Mobile CTA */}
                    <div className="sm:hidden mt-5 text-center">
                        <Link
                            href={`/${lang}/imoveis`}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#486581]"
                        >
                            Ver todos os empreendimentos <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </section>
        )
    } catch {
        return null
    }
}
