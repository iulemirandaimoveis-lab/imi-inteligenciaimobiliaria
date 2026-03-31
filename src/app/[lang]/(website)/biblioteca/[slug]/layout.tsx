import type { Metadata } from 'next'
import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = 'https://www.iulemirandaimoveis.com.br'

interface BookMeta {
    metadata: {
        titulo: string
        subtitulo?: string
        autor?: string
        serie?: string
        slug?: string
        descricao?: string
    }
    capitulos: Array<{ titulo: string; numero?: number }>
}

function loadBookMeta(slug: string): BookMeta | null {
    try {
        const filePath = path.join(process.cwd(), 'public', 'books', `${slug}.json`)
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        return data as BookMeta
    } catch {
        return null
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; lang: string }> }): Promise<Metadata> {
    const { slug, lang } = await params
    const book = loadBookMeta(slug)

    if (!book) {
        return { title: 'Livro no encontrado | IMI' }
    }

    const title = book.metadata.titulo
    const subtitle = book.metadata.subtitulo || ''
    const description = subtitle
        ? `${title} — ${subtitle}. Leitura gratuita online na Biblioteca IMI.`
        : `${title}. Leitura gratuita online na Biblioteca IMI.`
    const chapters = book.capitulos.length
    const author = book.metadata.autor || 'Iule Miranda'

    return {
        title: `${title} | Biblioteca IMI`,
        description,
        authors: [{ name: author }],
        keywords: [
            title.toLowerCase(),
            'ebook imobiliário',
            'avaliação de imóveis',
            'investimento imobiliário',
            'mercado imobiliário',
            'IMI',
            author,
        ],
        openGraph: {
            title: `${title} — ${author}`,
            description,
            type: 'book',
            url: `${BASE_URL}/${lang}/biblioteca/${slug}`,
            images: ['/og-biblioteca.jpg'],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        alternates: {
            canonical: `${BASE_URL}/pt/biblioteca/${slug}`,
            languages: {
                'pt-BR': `${BASE_URL}/pt/biblioteca/${slug}`,
                en: `${BASE_URL}/en/biblioteca/${slug}`,
            },
        },
        other: {
            'article:author': author,
            'book:author': author,
            'book:isbn': '',
            'og:book:author': author,
        },
    }
}

export default async function BookLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ slug: string; lang: string }>
}) {
    const { slug, lang } = await params
    const book = loadBookMeta(slug)

    // JSON-LD structured data for Google/LLMs
    const jsonLd = book ? {
        '@context': 'https://schema.org',
        '@type': 'Book',
        name: book.metadata.titulo,
        description: book.metadata.subtitulo || '',
        author: {
            '@type': 'Person',
            name: book.metadata.autor || 'Iule Miranda',
            url: `${BASE_URL}/${lang}/sobre`,
        },
        publisher: {
            '@type': 'Organization',
            name: 'IMI — Iule Miranda Imóveis',
            url: BASE_URL,
            logo: {
                '@type': 'ImageObject',
                url: `${BASE_URL}/logo-imi.png`,
            },
        },
        inLanguage: lang === 'en' ? 'en' : 'pt-BR',
        url: `${BASE_URL}/${lang}/biblioteca/${slug}`,
        numberOfPages: book.capitulos.length,
        bookFormat: 'https://schema.org/EBook',
        isAccessibleForFree: true,
        genre: 'Mercado Imobiliário',
        about: {
            '@type': 'Thing',
            name: 'Mercado Imobiliário',
        },
        hasPart: book.capitulos.slice(0, 10).map((ch, i) => ({
            '@type': 'Chapter',
            name: ch.titulo,
            position: ch.numero || i + 1,
        })),
        potentialAction: {
            '@type': 'ReadAction',
            target: `${BASE_URL}/${lang}/biblioteca/${slug}`,
        },
    } : null

    // BreadcrumbList for rich snippets
    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'IMI',
                item: `${BASE_URL}/${lang}`,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Biblioteca',
                item: `${BASE_URL}/${lang}/biblioteca`,
            },
            ...(book ? [{
                '@type': 'ListItem',
                position: 3,
                name: book.metadata.titulo,
                item: `${BASE_URL}/${lang}/biblioteca/${slug}`,
            }] : []),
        ],
    }

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
            />
            {children}
        </>
    )
}
