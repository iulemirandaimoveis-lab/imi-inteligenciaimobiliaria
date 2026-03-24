import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
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

// ISR: revalidate every 60s for near-real-time updates while enabling CDN caching
export const revalidate = 60

const BASE = 'https://www.iulemirandaimoveis.com.br'
const SITE = 'IMI — Iule Miranda Imóveis'

export async function generateMetadata({ params }: { params: { slug: string, lang: string } }): Promise<Metadata> {
    const supabase = await createClient()

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
        : `${BASE}/og-image.svg`

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
    const supabase = await createClient()

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
        description: data.description || `Empreendimento premium em ${location}.`,
        url: `${BASE}/${params.lang}/imoveis/${params.slug}`,
        image: mainImage || undefined,
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
            addressLocality: data.city || '',
            addressRegion: data.state || '',
            addressCountry: data.country === 'Brasil' ? 'BR' : data.country || 'BR',
            streetAddress: data.neighborhood || '',
        },
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
                        <div key={i} style={{
                            background: '#FFFFFF', padding: '16px 12px', textAlign: 'center' as const,
                            border: '1px solid rgba(184,179,168,0.3)', borderRadius: 16,
                        }}>
                            <item.Icon size={18} style={{ color: '#0B1928', opacity: 0.5, margin: '0 auto' }} />
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
                        {brokerData?.name && (
                            <div className="lg:sticky lg:top-[calc(28rem+1.5rem)]">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                <RealtorCard broker={brokerData as any} propertyName={development.name} />
                            </div>
                        )}
                    </aside>
                </div>
            </div>

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
                        position: 'relative', overflow: 'hidden',
                        background: '#0B1928', color: '#fff',
                        borderRadius: 12, padding: '12px 20px',
                        fontFamily: "var(--fu, 'Outfit', sans-serif)",
                        fontWeight: 600, fontSize: 11, letterSpacing: '1px',
                        textTransform: 'uppercase', textDecoration: 'none',
                        whiteSpace: 'nowrap',
                        minHeight: 48, display: 'flex', alignItems: 'center',
                    }}>
                        Falar com Especialista
                    </a>
                </div>
            </div>
        </main>
    )
}
