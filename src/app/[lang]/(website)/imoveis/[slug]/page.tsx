import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { mapDbPropertyToDevelopment } from '@/modules/imoveis/utils/propertyMapper'
import { Bed, Bath, Ruler, Car, Calendar } from 'lucide-react'
import DevelopmentHero from '../components/DevelopmentHero'
import DevelopmentDetails from '../components/DevelopmentDetails'
import DevelopmentGallery from '../components/DevelopmentGallery'
import DevelopmentLocation from '../components/DevelopmentLocation'
import DevelopmentUnits from '../components/DevelopmentUnits'
import dynamic from 'next/dynamic'
import SubdivisionErrorBoundary from '../components/SubdivisionErrorBoundary'
const SubdivisionLotMap = dynamic(() => import('../components/SubdivisionLotMap'), { ssr: false })
import DevelopmentCTA from '../components/DevelopmentCTA'
import AnchorNav from '../components/AnchorNav'
import Breadcrumbs from '../components/Breadcrumbs'
import SimilarProperties from '../components/SimilarProperties'
import RealtorCard from '../components/RealtorCard'
import MobileStickyBar from '../components/MobileStickyBar'
import NeighborhoodIntel from '@/components/intelligence/NeighborhoodIntel'
import PropertyIntelligence from '../components/PropertyIntelligence'
import { generateBreadcrumbSchema } from '@/lib/seo'
import type { IMIProperty } from '@/features/properties/types'
import { calcDetailedScores } from '@/features/properties/services/score.service'
import { POIGrid } from '@/components/imoveis/POIGrid'

// Revalidate every hour — balances freshness with performance (ISR)
export const revalidate = 3600

const BASE = 'https://www.iulemirandaimoveis.com.br'
const SITE = 'IMI — Iule Miranda Imóveis'

export async function generateMetadata({ params }: { params: { slug: string, lang: string } }): Promise<Metadata> {
    // Server-side admin client — bypasses RLS for public page rendering

    const { data } = await supabaseAdmin
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
    { id: 'galeria', label: 'Galeria' },
    { id: 'detalhes', label: 'Sobre' },
    { id: 'unidades', label: 'Unidades' },
    { id: 'localizacao', label: 'Localização' },
    { id: 'inteligencia', label: 'IMI Score' },
]

const ANCHOR_SECTIONS_LOTEAMENTO = [
    { id: 'galeria', label: 'Galeria' },
    { id: 'detalhes', label: 'Sobre' },
    { id: 'mapa', label: 'Disponibilidade' },
    { id: 'localizacao', label: 'Localização' },
    { id: 'inteligencia', label: 'IMI Score' },
]

export default async function DevelopmentDetailPage({ params }: { params: { slug: string, lang: string } }) {
    // Server-side admin client — bypasses RLS for public page rendering

    // Query development — no join to avoid PostgREST embed issues
    const { data, error } = await supabaseAdmin
        .from('developments')
        .select('*')
        .eq('slug', params.slug)
        .single()

    if (error || !data) {
        if (error) console.error('[slug] Supabase error:', error.message, '| slug:', params.slug)
        return notFound()
    }

    // Fetch developer separately if developer_id exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let developerData: Record<string, any> | null = null
    if (data.developer_id) {
        const { data: dev } = await supabaseAdmin
            .from('developers')
            .select('name, logo_url, website, phone, email')
            .eq('id', data.developer_id)
            .single()
        developerData = dev
    }

    const development = mapDbPropertyToDevelopment(data)

    // Fetch commercial config (WhatsApp contact, virtual tour URL, payment conditions)
    const { data: commercialConfig } = await supabaseAdmin
        .from('development_commercial_config')
        .select('whatsapp_contact, virtual_tour_url, payment_conditions')
        .eq('development_id', development.id)
        .maybeSingle()

    // Override virtual tour URL from DB config if not already present in development data
    if (!development.images.virtualTour && commercialConfig?.virtual_tour_url) {
        development.images.virtualTour = commercialConfig.virtual_tour_url
    }

    // Override with separately-fetched developer data (more complete than join)
    if (developerData?.logo_url) development.developerLogo = developerData.logo_url
    if (developerData?.name) development.developer = developerData.name

    // Compute real IMI scores for this property (used by DevelopmentCTA panel)
    const imiPropertyData: IMIProperty = {
        id: development.id,
        name: development.name,
        price: development.priceRange?.min || Number(data.price_min || data.price_from) || 0,
        area: Number(data.area_from) || 0,
        bedrooms: Number(data.bedrooms_from) || 0,
        parking: Number(data.parking_from) || 0,
        neighborhood: data.neighborhood || '',
        city: data.city || 'Recife',
        state: data.state || 'PE',
        type: data.type || 'apartamento',
        status: data.status_commercial || 'published',
    }
    const imiScores = calcDetailedScores(imiPropertyData)

    // Fetch broker separately (resilient — won't break if brokers table is missing)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let brokerData: Record<string, any> | null = null
    if (data.broker_id) {
        const { data: broker } = await supabaseAdmin
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
            email: 'iule.miranda.imoveis@gmail.com',
            phone: '+5581986141487',
            creci: '17933',
            avatar_url: 'https://zocffccwjjyelwrgunhu.supabase.co/storage/v1/object/public/avatars/avatars/6a51365d-0433-4a0e-b585-3e6d6a6c28d7.jpg',
        }
    }
    // Override WhatsApp contact from DB config (previously hardcoded per slug in source code)
    const commercialWhatsapp = commercialConfig?.whatsapp_contact ?? null
    if (commercialWhatsapp) {
        brokerData = { ...brokerData, phone: `+${commercialWhatsapp}` }
    }
    const whatsappContact = commercialWhatsapp ?? brokerData?.phone?.replace(/\D/g, '') ?? '5581986141487'

    // For loteamentos / condomínios fechados: override price with real minimum available lot price from subdivision_lots
    if (data.type === 'loteamento' || data.type === 'condominio_fechado') {
        const { data: lotPrices } = await supabaseAdmin
            .from('subdivision_lots')
            .select('price')
            .eq('development_id', development.id)
            .eq('status', 'DISPONIVEL')
            .not('price', 'is', null)
            .order('price', { ascending: true })
            .limit(1)
        if (lotPrices && lotPrices.length > 0 && lotPrices[0].price) {
            development.priceRange.min = Number(lotPrices[0].price)
        }
    }

    // Fetch similar properties (same city, different slug, max 4)
    const { data: similarRaw } = await supabaseAdmin
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

    const pageUrl = `${BASE}/${params.lang}/imoveis/${params.slug}`

    const allImages = [mainImage, ...gallery.map((img: string) => img.startsWith('http') ? img : `${BASE}${img}`)].filter(Boolean)

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: development.name,
        description: data.description || development.shortDescription || `Empreendimento premium em ${location}.`,
        url: pageUrl,
        image: allImages.slice(0, 10),
        ...(priceMin && {
            offers: {
                '@type': 'Offer',
                priceCurrency: 'BRL',
                price: priceMin,
                priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                availability: 'https://schema.org/InStock',
            },
        }),
        address: {
            '@type': 'PostalAddress',
            streetAddress: development.location?.address || data.address || data.neighborhood || '',
            addressLocality: development.location?.city || data.city || '',
            addressRegion: development.location?.state || data.state || '',
            postalCode: data.postal_code || data.cep || '',
            addressCountry: development.location?.country || (data.country === 'Brasil' ? 'BR' : data.country || 'BR'),
        },
        ...(development.location?.coordinates?.lat && development.location?.coordinates?.lng && {
            geo: {
                '@type': 'GeoCoordinates',
                latitude: development.location.coordinates.lat,
                longitude: development.location.coordinates.lng,
            },
        }),
        ...(Number(data.area_from) > 0 && {
            floorSize: {
                '@type': 'QuantitativeValue',
                value: Number(data.area_from),
                unitCode: 'MTK',
            },
        }),
        ...(Number(data.bedrooms_from) > 0 && {
            numberOfRooms: Number(data.bedrooms_from),
        }),
    }

    // BreadcrumbList JSON-LD for rich search results
    const breadcrumbJsonLd = generateBreadcrumbSchema([
        { name: 'Imóveis', url: `/${params.lang}/imoveis` },
        ...(data.city ? [{ name: data.city, url: `/${params.lang}/imoveis?city=${encodeURIComponent(data.city)}` }] : []),
        { name: development.name, url: pageUrl },
    ])

    const isLoteamento = data.type === 'loteamento' || data.type === 'condominio_fechado'
    // Loteamentos com mapa de lotes versionado em /public/maps (motor unificado).
    // Mantém o flag do banco e habilita explicitamente os que já têm JSON publicado,
    // tornando o mapa visível de forma atômica no deploy (sem depender de flag no DB).
    const KNOWN_LOT_MAP_SLUGS = new Set(['loteamento-miguel-marques'])
    const lotMapEnabled = isLoteamento && (data.lot_map_enabled === true || KNOWN_LOT_MAP_SLUGS.has(params.slug))
    const anchorSections = isLoteamento ? ANCHOR_SECTIONS_LOTEAMENTO : ANCHOR_SECTIONS

    return (
        <main className="pb-40 lg:pb-0" style={{ background: '#F7F5F2' }}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />

            <DevelopmentHero development={development} />

            {/* Breadcrumbs */}
            <div className="container-custom pt-4 pb-0">
                <Breadcrumbs items={breadcrumbs} />
            </div>

            {/* Key Facts Bar */}
            <div className="container-custom pt-4 pb-0">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 sm:grid sm:grid-cols-4 xl:grid-cols-5 sm:gap-3">
                    {[
                        { label: 'Quartos', value: development.specs.bedroomsRange, Icon: Bed },
                        { label: 'Banheiros', value: development.specs.bathroomsRange, Icon: Bath },
                        { label: 'Área', value: development.specs.areaRange, Icon: Ruler },
                        { label: 'Vagas', value: development.specs.parkingRange, Icon: Car },
                        ...(development.deliveryDate ? [{ label: 'Entrega', value: development.deliveryDate, Icon: Calendar }] : []),
                    ].filter(item => item.value && item.value !== '—').map((item, i) => (
                        <div key={i} role="group" aria-label={`${item.value} ${item.label.toLowerCase()}`} style={{
                            background: '#FFFFFF',
                            padding: '12px 10px',
                            textAlign: 'center' as const,
                            border: '1px solid rgba(184,179,168,0.3)',
                            borderRadius: 14,
                            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                            flexShrink: 0,
                            minWidth: 70,
                        }}>
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: '#F0EDE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>
                                <item.Icon size={14} aria-hidden="true" style={{ color: '#0B1928', opacity: 0.7 }} />
                            </div>
                            <p style={{ fontSize: 15, fontWeight: 700, color: '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", margin: '0 0 2px', whiteSpace: 'nowrap' as const }}>{item.value}</p>
                            <p style={{ fontSize: 9, color: '#948F84', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const, fontFamily: "var(--fu, 'Outfit', sans-serif)", margin: 0 }}>{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Anchor Navigation */}
            <AnchorNav sections={anchorSections} />

            <div className="container-custom py-10 md:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 lg:gap-14">
                    {/* Main content */}
                    <div className="lg:col-span-8 space-y-12 md:space-y-20">
                        <section id="galeria">
                            <DevelopmentGallery
                                development={development}
                                lotMapAmenities={Array.isArray(data.lot_map_amenities) ? data.lot_map_amenities : undefined}
                            />
                        </section>
                        <section id="detalhes">
                            <DevelopmentDetails
                                development={development}
                                financingEnabled={data.financing_enabled !== false}
                                lang={params.lang}
                            />
                        </section>
                        <section id={isLoteamento ? 'mapa' : 'unidades'}>
                            {params.slug === 'alto-bellevue' ? (
                                <SubdivisionLotMap
                                    developmentId={development.id}
                                    developmentName={development.name}
                                    whatsappPhone={whatsappContact}
                                    mapAmenities={Array.isArray(data.lot_map_amenities) ? data.lot_map_amenities : []}
                                    virtualTourUrl={data.virtual_tour_url || undefined}
                                />
                            ) : lotMapEnabled ? (
                                <SubdivisionErrorBoundary developmentName={development.name}>
                                    <SubdivisionLotMap
                                        developmentId={development.id}
                                        developmentName={development.name}
                                        whatsappPhone={whatsappContact}
                                        mapAmenities={Array.isArray(data.lot_map_amenities) ? data.lot_map_amenities : []}
                                        virtualTourUrl={data.virtual_tour_url || undefined}
                                    />
                                </SubdivisionErrorBoundary>
                            ) : (
                                <DevelopmentUnits propertyId={development.id} propertyName={development.name} />
                            )}
                        </section>
                        <section id="localizacao">
                            <DevelopmentLocation development={development} />
                            {development.location.coordinates.lat != null &&
                             development.location.coordinates.lng != null &&
                             development.location.coordinates.lat !== 0 &&
                             development.location.coordinates.lng !== 0 && (
                                <div className="mt-8">
                                    <POIGrid
                                        developmentId={development.id}
                                        latitude={development.location.coordinates.lat}
                                        longitude={development.location.coordinates.lng}
                                        imovelType={
                                            (data.listing_mode === 'short_stay' || data.listing_category === 'short_stay')
                                                ? 'short_stay'
                                                : 'residencial'
                                        }
                                    />
                                </div>
                            )}
                        </section>
                        <section id="inteligencia">
                            <PropertyIntelligence property={imiPropertyData} />
                        </section>
                        <section id="inteligencia-bairro">
                            <NeighborhoodIntel
                                neighborhood={development.location?.neighborhood}
                                city={development.location?.city}
                                compact
                            />
                        </section>
                        {/* Mobile: broker + CTA side by side at the bottom */}
                        <section id="corretor" className="lg:hidden">
                            <div className="grid grid-cols-2 gap-3 items-stretch">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                <RealtorCard broker={brokerData as any} propertyName={development.name} compact />
                                <DevelopmentCTA development={development} imiData={imiScores} compact {...(commercialWhatsapp && { whatsappPhone: commercialWhatsapp })} />
                            </div>
                        </section>
                    </div>

                    {/* Sidebar — desktop only */}
                    <aside className="hidden lg:block lg:col-span-4 self-start space-y-6">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <RealtorCard broker={brokerData as any} propertyName={development.name} />
                        <DevelopmentCTA development={development} imiData={imiScores} {...(commercialWhatsapp && { whatsappPhone: commercialWhatsapp })} />
                    </aside>
                </div>
            </div>


            {/* Similar Properties */}
            {similarDevs.length > 0 && (
                <SimilarProperties developments={similarDevs} lang={params.lang} />
            )}

            {/* Sticky Mobile CTA — captures lead via modal before redirecting to WhatsApp */}
            <MobileStickyBar
                propertyName={development.name}
                propertyId={development.id}
                priceMin={development.priceRange.min}
                whatsappContact={whatsappContact}
            />
        </main>
    )
}
