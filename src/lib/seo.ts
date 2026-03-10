import { Metadata } from 'next'

const SITE_NAME = 'IMI – Inteligência Imobiliária'
const SITE_DESCRIPTION = 'Avaliações imobiliárias técnicas, consultoria estratégica e corretagem com curadoria. Decisões imobiliárias baseadas em inteligência, método e segurança.'
const SITE_URL = 'https://imi.com.br' // Update with actual domain

export function generateMetadata({
    title,
    description,
    path = '',
    image,
}: {
    title: string
    description?: string
    path?: string
    image?: string
}): Metadata {
    const metaTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`
    const metaDescription = description || SITE_DESCRIPTION
    const url = `${SITE_URL}${path}`
    const metaImage = image || `${SITE_URL}/og-image.jpg`

    return {
        title: metaTitle,
        description: metaDescription,
        openGraph: {
            title: metaTitle,
            description: metaDescription,
            url,
            siteName: SITE_NAME,
            images: [
                {
                    url: metaImage,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            locale: 'pt_BR',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: metaTitle,
            description: metaDescription,
            images: [metaImage],
        },
        alternates: {
            canonical: url,
        },
    }
}

export function generateOrganizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        image: `${SITE_URL}/og-image.jpg`,
        priceRange: '$$$$',
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Boa Viagem',
            addressLocality: 'Recife',
            addressRegion: 'PE',
            addressCountry: 'BR',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: -8.1195,
            longitude: -34.9036,
        },
        contactPoint: [
            {
                '@type': 'ContactPoint',
                telephone: '+55-81-99723-0455',
                contactType: 'customer service',
                availableLanguage: ['Portuguese', 'English', 'Spanish', 'Arabic', 'Japanese'],
                areaServed: ['BR', 'AE', 'US'],
            },
        ],
        sameAs: [
            'https://www.linkedin.com/in/iule-miranda',
        ],
        hasCredential: [
            {
                '@type': 'EducationalOccupationalCredential',
                credentialCategory: 'Professional License',
                name: 'CRECI 17933',
            },
            {
                '@type': 'EducationalOccupationalCredential',
                credentialCategory: 'Professional Certification',
                name: 'CNAI 53290',
            },
        ],
        knowsAbout: [
            'Real Estate Appraisal',
            'NBR 14653',
            'Property Valuation',
            'Real Estate Consulting',
            'Cross-border Real Estate Investment',
        ],
    }
}

// Generate JSON-LD for a real estate listing
export function generatePropertySchema(property: {
    name: string
    description?: string
    price?: number
    currency?: string
    city?: string
    neighborhood?: string
    state?: string
    country?: string
    images?: string[]
    bedrooms?: number
    bathrooms?: number
    area?: number
    slug?: string
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: property.name,
        description: property.description || `${property.name} - IMI Inteligência Imobiliária`,
        url: property.slug ? `${SITE_URL}/pt/imoveis/${property.slug}` : undefined,
        image: property.images?.[0],
        offers: property.price ? {
            '@type': 'Offer',
            price: property.price,
            priceCurrency: property.currency || 'BRL',
            availability: 'https://schema.org/InStock',
        } : undefined,
        address: {
            '@type': 'PostalAddress',
            addressLocality: property.city,
            addressRegion: property.state,
            addressCountry: property.country || 'BR',
        },
        numberOfRooms: property.bedrooms,
        numberOfBathroomsTotal: property.bathrooms,
        floorSize: property.area ? {
            '@type': 'QuantitativeValue',
            value: property.area,
            unitCode: 'MTK',
        } : undefined,
    }
}

// Generate FAQ schema for homepage
export function generateFAQSchema(faqs: Array<{ q: string; a: string }>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.a,
            },
        })),
    }
}

// Generate BreadcrumbList schema
export function generateBreadcrumbSchema(items: Array<{ name: string; href: string }>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: `${SITE_URL}${item.href}`,
        })),
    }
}
