
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { mapDbPropertyToDevelopment } from '@/modules/imoveis/utils/propertyMapper'
import DevelopmentHero from '../components/DevelopmentHero'
import DevelopmentDetails from '../components/DevelopmentDetails'
import DevelopmentGallery from '../components/DevelopmentGallery'
import DevelopmentLocation from '../components/DevelopmentLocation'
import DevelopmentUnits from '../components/DevelopmentUnits'
import DevelopmentCTA from '../components/DevelopmentCTA'

// Forcing dynamic for real-time updates from Backoffice
export const dynamic = 'force-dynamic'

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
    const imagesJson: any = typeof data.images === 'object' && data.images ? data.images : {}
    const gallery: string[] = Array.isArray(imagesJson.gallery)
        ? imagesJson.gallery
        : (Array.isArray(data.gallery_images) ? data.gallery_images : [])
    const rawImage: string = imagesJson.main || gallery[0] || (data as any).image || ''
    // Ensure absolute URL — local paths get the BASE prepended
    const mainImage: string = rawImage
        ? (rawImage.startsWith('http') ? rawImage : `${BASE}${rawImage}`)
        : `${BASE}/og-image.jpg`

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

export default async function DevelopmentDetailPage({ params }: { params: { slug: string, lang: string } }) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('developments')
        .select(`
            *,
            developers (
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

    // JSON-LD structured data for rich search results
    const priceMin = Number(data.price_from || data.price_min) || undefined
    const location = [data.neighborhood, data.city, data.country !== 'Brasil' ? data.country : data.state].filter(Boolean).join(', ')
    const imagesJson: any = typeof data.images === 'object' && data.images ? data.images : {}
    const gallery: string[] = Array.isArray(imagesJson.gallery) ? imagesJson.gallery : (Array.isArray(data.gallery_images) ? data.gallery_images : [])
    const rawImg: string = imagesJson.main || gallery[0] || (data as any).image || ''
    const mainImage: string = rawImg ? (rawImg.startsWith('http') ? rawImg : `${BASE}${rawImg}`) : ''

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
        <main className="bg-[#FAFBFC] pb-24 lg:pb-0">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <DevelopmentHero development={development} />

            <div className="container-custom py-10 md:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
                    {/* Main content */}
                    <div className="lg:col-span-8 space-y-12 md:space-y-20">
                        <DevelopmentDetails development={development} />
                        <DevelopmentGallery development={development} />
                        <DevelopmentUnits propertyId={development.id} propertyName={development.name} />
                        <DevelopmentLocation development={development} />
                    </div>

                    {/* Sidebar — desktop only */}
                    <aside className="hidden lg:block lg:col-span-4">
                        <DevelopmentCTA development={development} />
                    </aside>
                </div>
            </div>

            {/* Mobile Sticky CTA Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-lg border-t border-gray-200 px-4 py-3 safe-area-pb">
                <div className="flex gap-3 max-w-lg mx-auto">
                    <a
                        href={`https://wa.me/5581997230455?text=${encodeURIComponent(`Olá! Tenho interesse no ${development.name}. Gostaria de mais informações.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 h-[52px] rounded-xl bg-[#102A43] text-white text-sm font-bold shadow-lg shadow-[#102A43]/20"
                    >
                        Falar com Especialista
                    </a>
                    <a
                        href="tel:+5581997230455"
                        className="flex items-center justify-center w-[52px] h-[52px] rounded-xl border border-gray-200 bg-gray-50 text-gray-600"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    </a>
                </div>
            </div>
        </main>
    )
}
