/**
 * Tests for SEO utility functions from @/lib/seo
 */
import {
  generateMetadata,
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateBreadcrumbSchema,
  generateArticleSchema,
  generateFAQSchema,
} from '@/lib/seo'

const SITE_NAME = 'IMI \u2013 Intelig\u00eancia Imobili\u00e1ria'
const SITE_URL = 'https://www.iulemirandaimoveis.com.br'

describe('generateMetadata', () => {
  it('returns Metadata with correct title, description, OG, Twitter, and canonical', () => {
    const result = generateMetadata({
      title: 'Avalia\u00e7\u00f5es',
      description: 'Servi\u00e7os de avalia\u00e7\u00e3o imobili\u00e1ria',
      path: '/pt/avaliacoes',
    })

    expect(result.title).toBe(`Avalia\u00e7\u00f5es | ${SITE_NAME}`)
    expect(result.description).toBe('Servi\u00e7os de avalia\u00e7\u00e3o imobili\u00e1ria')

    // OpenGraph
    expect(result.openGraph).toBeDefined()
    const og = result.openGraph as Record<string, unknown>
    expect(og.title).toBe(`Avalia\u00e7\u00f5es | ${SITE_NAME}`)
    expect(og.description).toBe('Servi\u00e7os de avalia\u00e7\u00e3o imobili\u00e1ria')
    expect(og.url).toBe(`${SITE_URL}/pt/avaliacoes`)
    expect(og.siteName).toBe(SITE_NAME)
    expect(og.type).toBe('website')

    // Twitter
    expect(result.twitter).toBeDefined()
    const twitter = result.twitter as Record<string, unknown>
    expect(twitter.card).toBe('summary_large_image')
    expect(twitter.title).toBe(`Avalia\u00e7\u00f5es | ${SITE_NAME}`)

    // Canonical
    expect(result.alternates).toBeDefined()
    const alternates = result.alternates as Record<string, unknown>
    expect(alternates.canonical).toBe(`${SITE_URL}/pt/avaliacoes`)
  })

  it('uses SITE_NAME as title without suffix when title matches SITE_NAME', () => {
    const result = generateMetadata({ title: SITE_NAME })
    expect(result.title).toBe(SITE_NAME)
  })

  it('uses default description when none is provided', () => {
    const result = generateMetadata({ title: 'Test' })
    expect(result.description).toBeTruthy()
    expect(typeof result.description).toBe('string')
  })

  it('uses default OG image when none is provided', () => {
    const result = generateMetadata({ title: 'Test' })
    const og = result.openGraph as Record<string, unknown>
    const images = og.images as Array<Record<string, unknown>>
    expect(images[0].url).toBe(`${SITE_URL}/og-image.svg`)
  })

  it('uses custom image when provided', () => {
    const result = generateMetadata({
      title: 'Test',
      image: 'https://example.com/custom.jpg',
    })
    const og = result.openGraph as Record<string, unknown>
    const images = og.images as Array<Record<string, unknown>>
    expect(images[0].url).toBe('https://example.com/custom.jpg')
  })

  it('includes publishedTime and modifiedTime for article type', () => {
    const result = generateMetadata({
      title: 'Blog Post',
      type: 'article',
      publishedTime: '2024-01-01T00:00:00Z',
      modifiedTime: '2024-06-01T00:00:00Z',
      authors: ['Iule Miranda'],
    })

    const og = result.openGraph as Record<string, unknown>
    expect(og.type).toBe('article')
    expect(og.publishedTime).toBe('2024-01-01T00:00:00Z')
    expect(og.modifiedTime).toBe('2024-06-01T00:00:00Z')
    expect(og.authors).toEqual(['Iule Miranda'])
  })

  it('builds canonical URL from empty path', () => {
    const result = generateMetadata({ title: 'Home', path: '' })
    const alternates = result.alternates as Record<string, unknown>
    expect(alternates.canonical).toBe(SITE_URL)
  })
})

describe('generateOrganizationSchema', () => {
  const schema = generateOrganizationSchema()

  it('has @context set to schema.org', () => {
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('has @type set to RealEstateAgent', () => {
    expect(schema['@type']).toBe('RealEstateAgent')
  })

  it('has name and url', () => {
    expect(schema.name).toBe(SITE_NAME)
    expect(schema.url).toBe(SITE_URL)
  })

  it('has a logo ImageObject', () => {
    expect(schema.logo['@type']).toBe('ImageObject')
    expect(schema.logo.url).toContain('/logo.png')
  })

  it('has areaServed with multiple cities', () => {
    expect(Array.isArray(schema.areaServed)).toBe(true)
    expect(schema.areaServed.length).toBeGreaterThanOrEqual(4)
    expect(schema.areaServed[0]['@type']).toBe('City')
  })

  it('has contactPoint with customer service type', () => {
    expect(schema.contactPoint['@type']).toBe('ContactPoint')
    expect(schema.contactPoint.contactType).toBe('customer service')
  })

  it('has hasOfferCatalog with services', () => {
    expect(schema.hasOfferCatalog['@type']).toBe('OfferCatalog')
    expect(schema.hasOfferCatalog.itemListElement.length).toBe(3)
  })
})

describe('generateWebSiteSchema', () => {
  const schema = generateWebSiteSchema()

  it('has @context and @type WebSite', () => {
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('WebSite')
  })

  it('has name and url', () => {
    expect(schema.name).toBe(SITE_NAME)
    expect(schema.url).toBe(SITE_URL)
  })

  it('has SearchAction as potentialAction', () => {
    expect(schema.potentialAction['@type']).toBe('SearchAction')
    expect(schema.potentialAction.target['@type']).toBe('EntryPoint')
    expect(schema.potentialAction.target.urlTemplate).toContain('?q={search_term_string}')
    expect(schema.potentialAction['query-input']).toBe('required name=search_term_string')
  })

  it('has publisher referencing organization', () => {
    expect(schema.publisher['@id']).toBe(`${SITE_URL}/#organization`)
  })

  it('lists multiple languages', () => {
    expect(Array.isArray(schema.inLanguage)).toBe(true)
    expect(schema.inLanguage).toContain('pt-BR')
    expect(schema.inLanguage).toContain('en')
  })
})

describe('generateBreadcrumbSchema', () => {
  it('builds correct ListItem positions starting at 1', () => {
    const items = [
      { name: 'Home', url: '/pt' },
      { name: 'Im\u00f3veis', url: '/pt/imoveis' },
      { name: 'Apartamento', url: '/pt/imoveis/apartamento-1' },
    ]
    const schema = generateBreadcrumbSchema(items)

    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('BreadcrumbList')
    expect(schema.itemListElement).toHaveLength(3)

    schema.itemListElement.forEach(
      (item: { '@type': string; position: number; name: string; item: string }, index: number) => {
        expect(item['@type']).toBe('ListItem')
        expect(item.position).toBe(index + 1)
        expect(item.name).toBe(items[index].name)
      }
    )
  })

  it('prepends SITE_URL for relative URLs', () => {
    const schema = generateBreadcrumbSchema([{ name: 'Page', url: '/pt/page' }])
    expect(schema.itemListElement[0].item).toBe(`${SITE_URL}/pt/page`)
  })

  it('keeps absolute URLs unchanged', () => {
    const schema = generateBreadcrumbSchema([
      { name: 'External', url: 'https://example.com/page' },
    ])
    expect(schema.itemListElement[0].item).toBe('https://example.com/page')
  })

  it('handles empty items array', () => {
    const schema = generateBreadcrumbSchema([])
    expect(schema.itemListElement).toHaveLength(0)
  })
})

describe('generateArticleSchema', () => {
  const schema = generateArticleSchema({
    title: 'Mercado Imobili\u00e1rio 2024',
    description: 'An\u00e1lise do mercado',
    url: '/pt/blog/mercado-2024',
    publishedTime: '2024-01-15T10:00:00Z',
    modifiedTime: '2024-02-01T12:00:00Z',
    authorName: 'Iule Miranda',
  })

  it('has valid @context and @type', () => {
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('Article')
  })

  it('has headline matching title', () => {
    expect(schema.headline).toBe('Mercado Imobili\u00e1rio 2024')
  })

  it('has datePublished and dateModified', () => {
    expect(schema.datePublished).toBe('2024-01-15T10:00:00Z')
    expect(schema.dateModified).toBe('2024-02-01T12:00:00Z')
  })

  it('falls back dateModified to publishedTime when not provided', () => {
    const s = generateArticleSchema({
      title: 'Test',
      description: 'Desc',
      url: '/test',
      publishedTime: '2024-01-01T00:00:00Z',
    })
    expect(s.dateModified).toBe('2024-01-01T00:00:00Z')
  })

  it('has author as Organization', () => {
    expect(schema.author['@type']).toBe('Organization')
    expect(schema.author.name).toBe(SITE_NAME)
  })

  it('has publisher with logo', () => {
    expect(schema.publisher['@type']).toBe('Organization')
    expect(schema.publisher.logo['@type']).toBe('ImageObject')
  })

  it('prepends SITE_URL for relative article URLs', () => {
    expect(schema.url).toBe(`${SITE_URL}/pt/blog/mercado-2024`)
  })

  it('uses default OG image when image is not provided', () => {
    expect(schema.image).toBe(`${SITE_URL}/og-image.svg`)
  })
})

describe('generateFAQSchema', () => {
  const faqs = [
    { question: 'O que \u00e9 NBR 14653?', answer: 'Norma t\u00e9cnica de avalia\u00e7\u00e3o.' },
    { question: 'Quanto custa?', answer: 'Depende do im\u00f3vel.' },
  ]
  const schema = generateFAQSchema(faqs)

  it('has @context and @type FAQPage', () => {
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('FAQPage')
  })

  it('has mainEntity with correct number of questions', () => {
    expect(schema.mainEntity).toHaveLength(2)
  })

  it('each question has @type Question with name and acceptedAnswer', () => {
    schema.mainEntity.forEach(
      (q: { '@type': string; name: string; acceptedAnswer: { '@type': string; text: string } }, i: number) => {
        expect(q['@type']).toBe('Question')
        expect(q.name).toBe(faqs[i].question)
        expect(q.acceptedAnswer['@type']).toBe('Answer')
        expect(q.acceptedAnswer.text).toBe(faqs[i].answer)
      }
    )
  })

  it('handles empty FAQ array', () => {
    const emptySchema = generateFAQSchema([])
    expect(emptySchema.mainEntity).toHaveLength(0)
  })
})
