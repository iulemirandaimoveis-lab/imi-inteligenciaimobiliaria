import { Metadata } from 'next'

const SITE_NAME = 'IMI – Inteligência Imobiliária'
const SITE_DESCRIPTION = 'Avaliações imobiliárias técnicas NBR 14653, consultoria estratégica patrimonial e corretagem premium de alto padrão em Recife, Dubai e EUA.'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iulemirandaimoveis.com.br'

export function generateMetadata({
    title,
    description,
    path = '',
    image,
    type = 'website',
    publishedTime,
    modifiedTime,
    authors,
}: {
    title: string
    description?: string
    path?: string
    image?: string
    type?: 'website' | 'article'
    publishedTime?: string
    modifiedTime?: string
    authors?: string[]
}): Metadata {
    const metaTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`
    const metaDescription = description || SITE_DESCRIPTION
    const url = `${SITE_URL}${path}`
    const metaImage = image || `${SITE_URL}/og-image.svg`

    const ogBase = {
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
    }

    const openGraph = type === 'article'
        ? { ...ogBase, type: 'article' as const, publishedTime, modifiedTime, authors }
        : { ...ogBase, type: 'website' as const }

    return {
        title: metaTitle,
        description: metaDescription,
        openGraph,
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
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: 'Iule Miranda Imóveis',
        description: SITE_DESCRIPTION,
        url: SITE_URL,
        logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/logo.png`,
            width: 512,
            height: 512,
        },
        image: `${SITE_URL}/og-image.svg`,
        priceRange: '$$$$',
        areaServed: [
            { '@type': 'City', name: 'Recife', '@id': 'https://www.wikidata.org/wiki/Q48547' },
            { '@type': 'City', name: 'São Paulo', '@id': 'https://www.wikidata.org/wiki/Q174' },
            { '@type': 'City', name: 'Dubai', '@id': 'https://www.wikidata.org/wiki/Q612' },
            { '@type': 'City', name: 'Miami', '@id': 'https://www.wikidata.org/wiki/Q8652' },
        ],
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'Recife',
            addressRegion: 'PE',
            addressCountry: 'BR',
        },
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            availableLanguage: ['Portuguese', 'English', 'Spanish'],
        },
        knowsLanguage: ['pt-BR', 'en', 'es', 'ja', 'ar'],
        sameAs: [],
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Serviços IMI',
            itemListElement: [
                {
                    '@type': 'OfferCatalog',
                    name: 'Avaliações Imobiliárias',
                    itemListElement: [{
                        '@type': 'Offer',
                        itemOffered: {
                            '@type': 'Service',
                            name: 'Avaliações Imobiliárias NBR 14653',
                            description: 'Laudos técnicos para fins judiciais, garantia bancária, inventários e partilhas.',
                        },
                    }],
                },
                {
                    '@type': 'OfferCatalog',
                    name: 'Consultoria',
                    itemListElement: [{
                        '@type': 'Offer',
                        itemOffered: {
                            '@type': 'Service',
                            name: 'Consultoria Estratégica Patrimonial',
                            description: 'Análise de viabilidade, estruturação patrimonial e consultoria para investimentos.',
                        },
                    }],
                },
                {
                    '@type': 'OfferCatalog',
                    name: 'Corretagem',
                    itemListElement: [{
                        '@type': 'Offer',
                        itemOffered: {
                            '@type': 'Service',
                            name: 'Corretagem Premium',
                            description: 'Curadoria de imóveis de alto padrão em Recife, São Paulo, Dubai e Miami.',
                        },
                    }],
                },
            ],
        },
    }
}

export function generateWebSiteSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: ['pt-BR', 'en', 'es', 'ja', 'ar'],
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${SITE_URL}/pt/imoveis?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    }
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
        })),
    }
}

export function generateArticleSchema({
    title,
    description,
    url,
    image,
    publishedTime,
    modifiedTime,
    authorName,
}: {
    title: string
    description: string
    url: string
    image?: string
    publishedTime: string
    modifiedTime?: string
    authorName?: string
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description,
        url: url.startsWith('http') ? url : `${SITE_URL}${url}`,
        image: image || `${SITE_URL}/og-image.svg`,
        datePublished: publishedTime,
        dateModified: modifiedTime || publishedTime,
        author: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
        },
        publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            logo: {
                '@type': 'ImageObject',
                url: `${SITE_URL}/logo.png`,
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': url.startsWith('http') ? url : `${SITE_URL}${url}`,
        },
    }
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    }
}

export function generateLocalBusinessSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        '@id': `${SITE_URL}/#localbusiness`,
        name: SITE_NAME,
        url: SITE_URL,
        telephone: '',
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Boa Viagem',
            addressLocality: 'Recife',
            addressRegion: 'PE',
            postalCode: '51000-000',
            addressCountry: 'BR',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: -8.1189,
            longitude: -34.8953,
        },
        openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '09:00',
            closes: '18:00',
        },
        priceRange: '$$$$',
    }
}
