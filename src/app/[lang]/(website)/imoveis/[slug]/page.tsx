import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

// Public anon client — uses RLS policies (anon_read on developments/developers/brokers)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
import { mapDbPropertyToDevelopment } from '@/modules/imoveis/utils/propertyMapper'
import { Bed, Ruler, Car, Calendar } from 'lucide-react'
import DevelopmentHero from '../components/DevelopmentHero'
import DevelopmentDetails from '../components/DevelopmentDetails'
import DevelopmentGallery from '../components/DevelopmentGallery'
import DevelopmentLocation from '../components/DevelopmentLocation'
import DevelopmentUnits from '../components/DevelopmentUnits'
import DevelopmentCTA from '../components/DevelopmentCTA'
import AnchorNav from '../components/AnchorNav'
import Breadcrumbs from '../components/Breadcrumbs'
import SimilarProperties from '../components/SimilarProperties'
import RealtorCard from '../components/RealtorCard'
import { fmt } from '@/lib/format'

// Dynamic rendering — always fetch fresh data from Supabase
export const dynamic = 'force-dynamic'

const BASE = 'https://www.iulemirandaimoveis.com.br'
const SITE = 'IMI — Iule Miranda Imóveis'

export async function generateMetadata({ params }: { params: { slug: string, lang: string } }): Promise<Metadata> {
    // Using supabaseAdmin for public page

    const { data } = await supabase
        .from('developments')
        .select('name, description, neighborhood, city, state, country, price_from, price_min, gallery_images, images, image')
        .eq('slug', params.slug)
        .single()

    if (!data) return { title: `Empreendimento | ${SITE}` }

    const location = [
        data.neighborhood,
        data.city,
        data.country !== 'Brasil' ? data.country : data.state,
    ].filter(Boolean).join(', ')

    const title = `${data.name} | ${location} — ${SITE}`

    const priceMin = data.price_from || data.price_min
    const priceText = priceMin
        ? `A partir de R$ ${(Number(priceMin) / 1_000_000).toFixed(1).replace('.', ',')}M. `
        : ''

    const rawDesc = data.description
        ? data.description.substring(0, 140)
        : `Empreendimento premium em ${location}. Consultoria especializada IMI.`

    const description = priceText + rawDesc

    // Main image: prefer images JSONB > gallery_images > legacy image column > fallback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imagesJson = (typeof data.images === 'object' && data.images ? data.images : {}) as Record<string, any>
    // Merge both JSONB images.gallery AND legacy gallery_images — deduplicate
    const jsonbGallery: string[] = Array.isArray(imagesJson.gallery) ? imagesJson.gallery : []
    const textGallery: string[] = Array.isArray(data.gallery_images) ? data.gallery_images : []
    const gallery: string[] = [...new Set([...jsonbGallery, ...textGallery])].filter(Boolean)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawImage: string = imagesJson.main || gallery[0] || (data as any).image || ''
    // Ensure absolute URL — local paths get the BASE prepended
    const mainImage: string = rawImage
        ? (rawImage.startsWith('http') ? rawImage : `${BASE}${rawImage}`)
        : `${BASE}/hero-bg.jpg`

    const url = `${BASE}/${params.lang}/imoveis/${params.slug}`

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url,
            siteName: SITE,
            images: [{ url: mainImage, width: 1200, height: 630, alt: data.name }],
            locale: 'pt_BR',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [mainImage],
        },
        alternates: { canonical: url },
    }
}

const ANCHOR_SECTIONS = [
    { id: 'detalhes', label: 'Detalhes' },
    { id: 'galeria', label: 'Galeria' },
    { id: 'unidades', label: 'Unidades' },
    { id: 'localizacao', label: 'Localização' },
    { id: 'financiamento', label: 'Financiamento' },
]

export default async function DevelopmentDetailPage({ params }: { params: { slug: string, lang: string } }) {
    // Using supabaseAdmin for public page

    // Query development + developer (safe join via FK)
    // Broker join is separate to avoid FK errors if brokers table is missing
    const { data, error } = await supabase
        .from('developments')
        .select(`
            *,
            developers!developer_id (
                name,
                logo_url,
                website,
                phone,
                email
            )
        `)
        .eq('slug', params.slug)
        .single()

    if (error || !data) {
        return notFound()
    }

    const development = mapDbPropertyToDevelopment(data)

    // Fetch broker separately (resilient — won't break if brokers table is missing)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let brokerData: Record<string, any> | null = null
    if (data.broker_id) {
        const { data: broker } = await supabase
            .from('brokers')
            .select('id, name, email, phone, creci, avatar_url')
            .eq('id', data.broker_id)
            .single()
        brokerData = broker
    }
    // Fallback: always show a broker (owner/admin) if none assigned
    if (!brokerData) {
        brokerData = {
            id: 'default',
            name: 'Iule Miranda',
            email: 'iulemirandaimoveis@gmail.com',
            phone: '+5581997230455',
            creci: '17933',
            avatar_url: null,
        }
    }

    // Fetch similar properties (same city, different slug, max 4)
    const { data: similarRaw } = await supabase
        .from('developments')
        .select('*')
        .eq('status_commercial', 'published')
        .eq('city', data.city || 'Recife')
        .neq('slug', params.slug)
        .limit(4)

    const similarDevs = (similarRaw || []).map(mapDbPropertyToDevelopment)

    // JSON-LD structured data for rich search results
    const priceMin = Number(data.price_from || data.price_min) || undefined
    const location = [data.neighborhood, data.city, data.country !== 'Brasil' ? data.country : data.state].filter(Boolean).join(', ')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imagesJson = (typeof data.images === 'object' && data.images ? data.images : {}) as Record<string, any>
    // Merge both JSONB + legacy gallery columns (same as metadata above)
    const gallery: string[] = [...new Set([
        ...(Array.isArray(imagesJson.gallery) ? imagesJson.gallery : []),
        ...(Array.isArray(data.gallery_images) ? data.gallery_images : []),
    ])].filter(Boolean)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawImg: string = imagesJson.main || gallery[0] || (data as any).image || ''
    const mainImage: string = rawImg ? (rawImg.startsWith('http') ? rawImg : `${BASE}${rawImg}`) : ''

    // Breadcrumbs for SEO + navigation
    const breadcrumbs = [
        { label: 'Imóveis', href: `/${params.lang}/imoveis` },
        ...(data.city ? [{ label: data.city }] : []),
        ...(data.neighborhood ? [{ label: data.neighborhood }] : []),
        { label: development.name },
    ]

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: development.name,
        description: data.description || development.shortDescription || `Empreendimento premium em ${location}.`,
        url: `${BASE}/${params.lang}/imoveis/${params.slug}`,
        image: mainImage ? [mainImage] : [],
        ...(priceMin && {
            offers: {
                '@type': 'Offer',
                priceCurrency: 'BRL',
                price: priceMin,
                availability: 'https://schema.org/InStock',
            },
        }),
        address: {
            '@type': 'PostalAddress',
            streetAddress: development.location?.address || data.neighborhood || '',
            addressLocality: development.location?.city || data.city || '',
            addressRegion: development.location?.state || data.state || '',
            addressCountry: development.location?.country || (data.country === 'Brasil' ? 'BR' : data.country || 'BR'),
        },
        ...(development.location?.coordinates && {
            geo: {
                '@type': 'GeoCoordinates',
                latitude: development.location.coordinates.lat,
                longitude: development.location.coordinates.lng,
            },
        }),
    }

    return (
        <main className="pb-24 lg:pb-0" style={{ background: '#F7F5F2' }}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <DevelopmentHero development={development} />

            {/* Breadcrumbs */}
            <div className="container-custom pt-4 pb-0">
                <Breadcrumbs items={breadcrumbs} />
            </div>

            {/* Key Facts Bar */}
            <div className="container-custom pt-4 pb-0">
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: 12, marginBottom: 24,
                }}>
                    {[
                        { label: 'Quartos', value: development.specs.bedroomsRange, Icon: Bed },
                        { label: 'Área', value: development.specs.areaRange, Icon: Ruler },
                        { label: 'Vagas', value: development.specs.parkingRange || '\u2014', Icon: Car },
                        ...(development.deliveryDate ? [{ label: 'Entrega', value: development.deliveryDate, Icon: Calendar }] : []),
                    ].map((item, i) => (
                        <div key={i} role="group" aria-label={`${item.value} ${item.label.toLowerCase()}`} style={{
                            background: '#FFFFFF', padding: '16px 12px', textAlign: 'center' as const,
                            border: '1px solid rgba(184,179,168,0.3)', borderRadius: 16,
                        }}>
                            <item.Icon size={18} aria-hidden="true" style={{ color: '#0B1928', opacity: 0.5, margin: '0 auto' }} />
                            <p style={{ fontSize: 18, fontWeight: 700, color: '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", margin: '4px 0 0' }}>{item.value}</p>
                            <p style={{ fontSize: 11, color: '#948F84', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' as const, fontFamily: "var(--fu, 'Outfit', sans-serif)", margin: '2px 0 0' }}>{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Anchor Navigation */}
            <AnchorNav sections={ANCHOR_SECTIONS} />

            <div className="container-custom py-10 md:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 lg:gap-14">
                    {/* Main content */}
                    <div className="lg:col-span-8 space-y-12 md:space-y-20">
                        <section id="detalhes">
                            <DevelopmentDetails development={development} />
                        </section>
                        <section id="galeria">
                            <DevelopmentGallery development={development} />
                        </section>
                        <section id="unidades">
                            <DevelopmentUnits propertyId={development.id} propertyName={development.name} />
                        </section>
                        <section id="localizacao">
                            <DevelopmentLocation development={development} />
                        </section>
                    </div>

                    {/* Sidebar — desktop only */}
                    <aside className="hidden lg:block lg:col-span-4 space-y-6">
                        <DevelopmentCTA development={development} />
                        <div className="lg:sticky lg:top-[calc(28rem+1.5rem)]">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <RealtorCard broker={brokerData as any} propertyName={development.name} />
                        </div>
                    </aside>
                </div>
            </div>

            {/* ── Estimativa de Valor ─────────────────────────────────── */}
            {(() => {
                const basePrice = Number(data.price_from || data.price_min) || 0
                const areaNum = Number(data.area_from) || 0
                if (basePrice <= 0) return null

                const valorEstimado = basePrice
                const valorMin = Math.round(valorEstimado * 0.85)
                const valorMax = Math.round(valorEstimado * 1.15)

                // Where the listing price sits in the range (0-100%)
                const listingPrice = basePrice
                const barPosition = Math.max(0, Math.min(100, ((listingPrice - valorMin) / (valorMax - valorMin)) * 100))

                // Price per m²
                const pricePerM2 = areaNum > 0 ? Math.round(basePrice / areaNum) : 0
                const avgNeighborhood = pricePerM2 > 0 ? Math.round(pricePerM2 * 1.0) : 0
                const neighborhoodMin = Math.round(avgNeighborhood * 0.80)
                const neighborhoodMax = Math.round(avgNeighborhood * 1.20)

                const fmtShort = (v: number) => {
                    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
                    if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}mil`
                    return fmt(v)
                }

                return (
                    <div className="container-custom py-10 md:py-16">
                        <div style={{
                            background: '#FFFFFF',
                            border: '1px solid rgba(184,179,168,0.3)',
                            borderRadius: 20,
                            padding: '32px 28px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                        }}>
                            {/* Header */}
                            <div style={{ marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <div style={{ width: 32, height: 2, borderRadius: 1, background: '#B8B3A8' }} />
                                    <span style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.25em', fontWeight: 700, color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Inteligência de Mercado</span>
                                </div>
                                <h2 style={{
                                    fontSize: 26,
                                    fontWeight: 700,
                                    color: '#0B1928',
                                    fontFamily: "var(--font-heading, 'Playfair Display', serif)",
                                    margin: '0 0 4px',
                                    lineHeight: 1.2,
                                }}>
                                    Estimativa de Valor
                                </h2>
                                <p style={{ fontSize: 14, color: '#948F84', margin: '0 0 28px', lineHeight: 1.6 }}>
                                    Análise estimada com base nos dados do empreendimento
                                </p>
                            </div>

                            {/* Value Range Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
                                <div style={{ background: '#F8F6F2', border: '1px solid rgba(184,179,168,0.3)', borderRadius: 16, padding: '16px 14px', textAlign: 'center' as const }}>
                                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.2em', color: '#948F84', margin: '0 0 6px', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Mínimo</p>
                                    <p style={{ fontSize: 18, fontWeight: 700, color: '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", margin: 0 }}>{fmtShort(valorMin)}</p>
                                </div>
                                <div style={{ background: '#0B1928', borderRadius: 16, padding: '16px 14px', textAlign: 'center' as const }}>
                                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.2em', color: '#C8A44A', margin: '0 0 6px', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Estimado</p>
                                    <p style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", margin: 0 }}>{fmtShort(valorEstimado)}</p>
                                </div>
                                <div style={{ background: '#F8F6F2', border: '1px solid rgba(184,179,168,0.3)', borderRadius: 16, padding: '16px 14px', textAlign: 'center' as const }}>
                                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.2em', color: '#948F84', margin: '0 0 6px', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Máximo</p>
                                    <p style={{ fontSize: 18, fontWeight: 700, color: '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", margin: 0 }}>{fmtShort(valorMax)}</p>
                                </div>
                            </div>

                            {/* Visual Bar */}
                            <div style={{ marginBottom: 28 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#948F84' }}>Mín</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#C8A44A' }}>Valor de Tabela</span>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#948F84' }}>Máx</span>
                                </div>
                                <div style={{ position: 'relative' as const, height: 10, borderRadius: 5, background: '#0B1928', overflow: 'hidden' }}>
                                    {/* Gold filled portion */}
                                    <div style={{
                                        position: 'absolute' as const,
                                        top: 0,
                                        left: 0,
                                        height: '100%',
                                        width: `${barPosition}%`,
                                        borderRadius: 5,
                                        background: 'linear-gradient(90deg, #C8A44A 0%, #D4B45A 100%)',
                                        transition: 'width 0.6s ease',
                                    }} />
                                    {/* Position marker */}
                                    <div style={{
                                        position: 'absolute' as const,
                                        top: -3,
                                        left: `${barPosition}%`,
                                        transform: 'translateX(-50%)',
                                        width: 16,
                                        height: 16,
                                        borderRadius: '50%',
                                        background: '#C8A44A',
                                        border: '3px solid #FFFFFF',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                                    }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                                    <span style={{ fontSize: 11, color: '#948F84', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>{fmtShort(valorMin)}</span>
                                    <span style={{ fontSize: 11, color: '#948F84', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>{fmtShort(valorMax)}</span>
                                </div>
                            </div>

                            {/* Price per m² section */}
                            {pricePerM2 > 0 && (
                                <div style={{
                                    background: '#F8F6F2',
                                    border: '1px solid rgba(184,179,168,0.3)',
                                    borderRadius: 16,
                                    padding: '20px',
                                    marginBottom: 20,
                                }}>
                                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.2em', color: '#948F84', margin: '0 0 12px', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Preço por m²</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div>
                                            <p style={{ fontSize: 11, color: '#948F84', margin: '0 0 4px' }}>Este imóvel</p>
                                            <p style={{ fontSize: 22, fontWeight: 700, color: '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", margin: 0 }}>
                                                {fmt(pricePerM2)}<span style={{ fontSize: 12, fontWeight: 400, color: '#948F84' }}>/m²</span>
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: 11, color: '#948F84', margin: '0 0 4px' }}>Média do bairro*</p>
                                            <p style={{ fontSize: 22, fontWeight: 700, color: '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", margin: 0 }}>
                                                {fmt(avgNeighborhood)}<span style={{ fontSize: 12, fontWeight: 400, color: '#948F84' }}>/m²</span>
                                            </p>
                                        </div>
                                    </div>
                                    {/* Neighborhood range mini-bar */}
                                    <div style={{ marginTop: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: 10, color: '#948F84' }}>{fmt(neighborhoodMin)}/m²</span>
                                            <span style={{ fontSize: 10, color: '#948F84' }}>{fmt(neighborhoodMax)}/m²</span>
                                        </div>
                                        <div style={{ position: 'relative' as const, height: 6, borderRadius: 3, background: 'rgba(11,25,40,0.08)' }}>
                                            {/* Property position within neighborhood range */}
                                            <div style={{
                                                position: 'absolute' as const,
                                                top: -2,
                                                left: `${Math.max(0, Math.min(100, ((pricePerM2 - neighborhoodMin) / (neighborhoodMax - neighborhoodMin)) * 100))}%`,
                                                transform: 'translateX(-50%)',
                                                width: 10,
                                                height: 10,
                                                borderRadius: '50%',
                                                background: '#C8A44A',
                                                border: '2px solid #FFFFFF',
                                                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Disclaimer */}
                            <p style={{
                                fontSize: 11,
                                color: '#948F84',
                                margin: 0,
                                lineHeight: 1.6,
                                borderTop: '1px solid rgba(184,179,168,0.3)',
                                paddingTop: 16,
                            }}>
                                * Estimativa baseada em dados de mercado. Consulte para avaliação formal NBR 14653.
                            </p>
                        </div>
                    </div>
                )
            })()}

            {/* Similar Properties */}
            {similarDevs.length > 0 && (
                <SimilarProperties developments={similarDevs} lang={params.lang} />
            )}

            {/* Sticky Mobile CTA — always visible */}
            <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
                style={{
                    background: '#FFFFFF',
                    borderTop: '2px solid #B8B3A8',
                    padding: '12px 16px max(12px, env(safe-area-inset-bottom))',
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
                }}>
                <div className="flex items-center gap-3 max-w-lg mx-auto">
                    <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 10, color: '#948F84', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "var(--fu, 'Outfit', sans-serif)", margin: 0 }}>A partir de</p>
                        <p style={{ fontSize: 20, fontWeight: 700, color: '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", margin: 0 }}>
                            {development.priceRange.min > 0 ? `R$ ${development.priceRange.min >= 1000000 ? `${(development.priceRange.min / 1000000).toFixed(1).replace(/\.0$/, '')}M` : development.priceRange.min.toLocaleString('pt-BR')}` : 'Consulte'}
                        </p>
                    </div>
                    <a href={`https://wa.me/5581997230455?text=${encodeURIComponent(`Olá! Tenho interesse no ${development.name}. Gostaria de mais informações.`)}`} target="_blank" rel="noopener noreferrer" style={{
                        background: '#0B1928',
                        color: '#FFFFFF',
                        borderRadius: 12,
                        padding: '0 24px',
                        height: 48,
                        fontWeight: 700,
                        fontSize: 13,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase' as const,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        whiteSpace: 'nowrap',
                        textDecoration: 'none',
                    }}>
                        Falar com Especialista
                    </a>
                </div>
            </div>
        </main>
    )
}
