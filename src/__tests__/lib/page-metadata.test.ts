/**
 * Tests for page-metadata utility — validates that each page's metadata
 * returns correct Metadata objects with title, description, OG, and canonical
 */
import { PAGE_METADATA } from '@/lib/page-metadata'
import type { Metadata } from 'next'

const BASE = 'https://www.iulemirandaimoveis.com.br'
const SITE = 'IMI \u2014 Iule Miranda Im\u00f3veis'

type PageKey = keyof typeof PAGE_METADATA

const pageKeys: PageKey[] = [
  'home',
  'avaliacoes',
  'credito',
  'consultoria',
  'imoveis',
  'projetos',
  'sobre',
  'contato',
  'inteligencia',
  'construtoras',
]

describe('PAGE_METADATA', () => {
  it('exports all expected page keys', () => {
    pageKeys.forEach((key) => {
      expect(PAGE_METADATA[key]).toBeDefined()
      expect(typeof PAGE_METADATA[key]).toBe('function')
    })
  })

  describe.each(pageKeys)('%s', (key) => {
    let metadata: Metadata

    beforeAll(() => {
      metadata = PAGE_METADATA[key]('pt')
    })

    it('returns a title containing SITE name', () => {
      expect(typeof metadata.title).toBe('string')
      expect(metadata.title as string).toContain(SITE)
    })

    it('returns a non-empty description', () => {
      expect(typeof metadata.description).toBe('string')
      expect((metadata.description as string).length).toBeGreaterThan(10)
    })

    it('has openGraph with title, description, url, and images', () => {
      expect(metadata.openGraph).toBeDefined()
      const og = metadata.openGraph as Record<string, unknown>
      expect(og.title).toBe(metadata.title)
      expect(og.description).toBe(metadata.description)
      expect(typeof og.url).toBe('string')
      expect(og.url as string).toMatch(/^https:\/\//)

      const images = og.images as Array<Record<string, unknown>>
      expect(images).toBeDefined()
      expect(images.length).toBeGreaterThan(0)
      expect(images[0].url).toBeTruthy()
      expect(images[0].width).toBe(1200)
      expect(images[0].height).toBe(630)
    })

    it('has openGraph locale set to pt_BR', () => {
      const og = metadata.openGraph as Record<string, unknown>
      expect(og.locale).toBe('pt_BR')
    })

    it('has openGraph siteName', () => {
      const og = metadata.openGraph as Record<string, unknown>
      expect(og.siteName).toBe(SITE)
    })

    it('has twitter card set to summary_large_image', () => {
      expect(metadata.twitter).toBeDefined()
      const twitter = metadata.twitter as Record<string, unknown>
      expect(twitter.card).toBe('summary_large_image')
      expect(twitter.title).toBe(metadata.title)
      expect(twitter.description).toBe(metadata.description)
    })

    it('has canonical URL properly formed with BASE and lang', () => {
      expect(metadata.alternates).toBeDefined()
      const alternates = metadata.alternates as Record<string, unknown>
      const canonical = alternates.canonical as string
      expect(canonical).toMatch(new RegExp(`^${BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/pt`))
    })
  })

  describe('language parameter', () => {
    it('home generates correct path for "en"', () => {
      const metadata = PAGE_METADATA.home('en')
      const alternates = metadata.alternates as Record<string, unknown>
      expect(alternates.canonical).toBe(`${BASE}/en`)
    })

    it('avaliacoes generates correct path for "es"', () => {
      const metadata = PAGE_METADATA.avaliacoes('es')
      const alternates = metadata.alternates as Record<string, unknown>
      expect(alternates.canonical).toBe(`${BASE}/es/avaliacoes`)
    })

    it('imoveis generates correct path for "ja"', () => {
      const metadata = PAGE_METADATA.imoveis('ja')
      const alternates = metadata.alternates as Record<string, unknown>
      expect(alternates.canonical).toBe(`${BASE}/ja/imoveis`)
    })

    it('contato generates correct path for "ar"', () => {
      const metadata = PAGE_METADATA.contato('ar')
      const alternates = metadata.alternates as Record<string, unknown>
      expect(alternates.canonical).toBe(`${BASE}/ar/contato`)
    })
  })

  describe('specific page titles', () => {
    it('home has "Intelig\u00eancia Imobili\u00e1ria" in title', () => {
      const metadata = PAGE_METADATA.home('pt')
      expect(metadata.title as string).toContain('Intelig\u00eancia Imobili\u00e1ria')
    })

    it('avaliacoes mentions NBR 14653', () => {
      const metadata = PAGE_METADATA.avaliacoes('pt')
      expect(metadata.title as string).toContain('NBR 14653')
    })

    it('credito mentions Cr\u00e9dito Imobili\u00e1rio', () => {
      const metadata = PAGE_METADATA.credito('pt')
      expect(metadata.title as string).toContain('Cr\u00e9dito Imobili\u00e1rio')
    })

    it('consultoria mentions Consultoria', () => {
      const metadata = PAGE_METADATA.consultoria('pt')
      expect(metadata.title as string).toContain('Consultoria')
    })

    it('imoveis mentions Alto Padr\u00e3o', () => {
      const metadata = PAGE_METADATA.imoveis('pt')
      expect(metadata.title as string).toContain('Alto Padr\u00e3o')
    })
  })
})
