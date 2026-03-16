/**
 * Tests that JSON-LD schemas produced by @/lib/seo are structurally valid
 */
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
} from '@/lib/seo'

describe('Organization JSON-LD schema', () => {
  const schema = generateOrganizationSchema()

  it('has required @context field', () => {
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('has required @type field', () => {
    expect(schema['@type']).toBe('RealEstateAgent')
  })

  it('has required name field', () => {
    expect(typeof schema.name).toBe('string')
    expect(schema.name.length).toBeGreaterThan(0)
  })

  it('has required url field', () => {
    expect(typeof schema.url).toBe('string')
    expect(schema.url).toMatch(/^https?:\/\//)
  })

  it('has @id for reference', () => {
    expect(schema['@id']).toContain('/#organization')
  })

  it('has a valid logo object', () => {
    expect(schema.logo).toBeDefined()
    expect(schema.logo['@type']).toBe('ImageObject')
    expect(schema.logo.url).toMatch(/\.png$/)
  })

  it('has address with PostalAddress type', () => {
    expect(schema.address['@type']).toBe('PostalAddress')
    expect(schema.address.addressCountry).toBe('BR')
  })
})

describe('WebSite JSON-LD schema', () => {
  const schema = generateWebSiteSchema()

  it('has @context and @type', () => {
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('WebSite')
  })

  it('has name and url', () => {
    expect(schema.name).toBeTruthy()
    expect(schema.url).toMatch(/^https?:\/\//)
  })

  it('has SearchAction in potentialAction', () => {
    expect(schema.potentialAction).toBeDefined()
    expect(schema.potentialAction['@type']).toBe('SearchAction')
  })

  it('SearchAction has EntryPoint target with urlTemplate', () => {
    const target = schema.potentialAction.target
    expect(target['@type']).toBe('EntryPoint')
    expect(target.urlTemplate).toContain('{search_term_string}')
  })

  it('has query-input parameter', () => {
    expect(schema.potentialAction['query-input']).toBe('required name=search_term_string')
  })

  it('has description', () => {
    expect(typeof schema.description).toBe('string')
    expect(schema.description.length).toBeGreaterThan(0)
  })
})

describe('Article JSON-LD schema', () => {
  const schema = generateArticleSchema({
    title: 'Test Article',
    description: 'A test description',
    url: '/pt/blog/test',
    publishedTime: '2024-06-01T10:00:00Z',
    modifiedTime: '2024-06-15T12:00:00Z',
    authorName: 'Author Name',
  })

  it('has headline matching title', () => {
    expect(schema.headline).toBe('Test Article')
  })

  it('has datePublished', () => {
    expect(schema.datePublished).toBe('2024-06-01T10:00:00Z')
  })

  it('has dateModified', () => {
    expect(schema.dateModified).toBe('2024-06-15T12:00:00Z')
  })

  it('has author as Organization', () => {
    expect(schema.author).toBeDefined()
    expect(schema.author['@type']).toBe('Organization')
    expect(typeof schema.author.name).toBe('string')
  })

  it('has publisher with logo', () => {
    expect(schema.publisher['@type']).toBe('Organization')
    expect(schema.publisher.logo).toBeDefined()
    expect(schema.publisher.logo['@type']).toBe('ImageObject')
  })

  it('has mainEntityOfPage', () => {
    expect(schema.mainEntityOfPage['@type']).toBe('WebPage')
    expect(schema.mainEntityOfPage['@id']).toContain('/pt/blog/test')
  })

  it('has description', () => {
    expect(schema.description).toBe('A test description')
  })

  it('has @context and @type Article', () => {
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('Article')
  })
})

describe('Breadcrumb JSON-LD schema', () => {
  const items = [
    { name: 'Home', url: '/pt' },
    { name: 'Im\u00f3veis', url: '/pt/imoveis' },
    { name: 'Cobertura Boa Viagem', url: '/pt/imoveis/cobertura-boa-viagem' },
  ]
  const schema = generateBreadcrumbSchema(items)

  it('has BreadcrumbList type', () => {
    expect(schema['@type']).toBe('BreadcrumbList')
  })

  it('has correct number of items', () => {
    expect(schema.itemListElement).toHaveLength(3)
  })

  it('positions start at 1 and increment', () => {
    expect(schema.itemListElement[0].position).toBe(1)
    expect(schema.itemListElement[1].position).toBe(2)
    expect(schema.itemListElement[2].position).toBe(3)
  })

  it('each item has ListItem type', () => {
    schema.itemListElement.forEach(
      (item: { '@type': string; position: number; name: string; item: string }) => {
        expect(item['@type']).toBe('ListItem')
      }
    )
  })

  it('each item has name and item URL', () => {
    schema.itemListElement.forEach(
      (item: { '@type': string; position: number; name: string; item: string }) => {
        expect(typeof item.name).toBe('string')
        expect(item.name.length).toBeGreaterThan(0)
        expect(typeof item.item).toBe('string')
        expect(item.item).toMatch(/^https?:\/\//)
      }
    )
  })
})

describe('FAQ JSON-LD schema', () => {
  const faqs = [
    { question: 'Pergunta 1?', answer: 'Resposta 1.' },
    { question: 'Pergunta 2?', answer: 'Resposta 2.' },
    { question: 'Pergunta 3?', answer: 'Resposta 3.' },
  ]
  const schema = generateFAQSchema(faqs)

  it('has FAQPage type', () => {
    expect(schema['@type']).toBe('FAQPage')
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('has questions matching input', () => {
    expect(schema.mainEntity).toHaveLength(3)
  })

  it('each entity is a Question with an Answer', () => {
    schema.mainEntity.forEach(
      (q: { '@type': string; name: string; acceptedAnswer: { '@type': string; text: string } }, i: number) => {
        expect(q['@type']).toBe('Question')
        expect(q.name).toBe(faqs[i].question)
        expect(q.acceptedAnswer).toBeDefined()
        expect(q.acceptedAnswer['@type']).toBe('Answer')
        expect(q.acceptedAnswer.text).toBe(faqs[i].answer)
      }
    )
  })
})
