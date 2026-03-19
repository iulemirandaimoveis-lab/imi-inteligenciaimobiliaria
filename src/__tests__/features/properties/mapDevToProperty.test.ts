/**
 * @jest-environment node
 */

/**
 * Tests for mapDevToProperty and normalizeStatus
 * Verifies mapping from raw Supabase rows to IMIProperty across schema variations
 */

import { mapDevToProperty, normalizeStatus } from '@/features/properties/services/mapDevToProperty'

describe('mapDevToProperty', () => {
  it('maps a fully-populated row with all fields', () => {
    const raw = {
      id: 'dev-001',
      name: 'Residencial Alpha',
      type: 'apartamento',
      condition: 'lancamento',
      status: 'disponivel',
      price_from: 450000,
      area_from: 65,
      bedrooms: 3,
      bathrooms: 2,
      parking_spaces: 1,
      neighborhood: 'Boa Viagem',
      city: 'Recife',
      state: 'PE',
      address: 'Av. Boa Viagem, 1000',
      gallery_images: ['img1.jpg', 'img2.jpg'],
      image: 'cover.jpg',
      slug: 'residencial-alpha',
      developer: { id: 'dev-xyz', name: 'Construtora XYZ', logo_url: 'logo.png' },
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-06-01T00:00:00Z',
    }

    const result = mapDevToProperty(raw)

    expect(result.id).toBe('dev-001')
    expect(result.name).toBe('Residencial Alpha')
    expect(result.type).toBe('apartamento')
    expect(result.condition).toBe('lancamento')
    expect(result.status).toBe('disponivel')
    expect(result.price).toBe(450000)
    expect(result.area).toBe(65)
    expect(result.bedrooms).toBe(3)
    expect(result.bathrooms).toBe(2)
    expect(result.parking).toBe(1)
    expect(result.neighborhood).toBe('Boa Viagem')
    expect(result.city).toBe('Recife')
    expect(result.state).toBe('PE')
    expect(result.address).toBe('Av. Boa Viagem, 1000')
    expect(result.image_urls).toEqual(['img1.jpg', 'img2.jpg'])
    expect(result.cover_image_url).toBe('cover.jpg')
    expect(result.slug).toBe('residencial-alpha')
    expect(result.developer).toEqual({ id: 'dev-xyz', name: 'Construtora XYZ', logo_url: 'logo.png' })
    expect(result.created_at).toBe('2024-01-15T00:00:00Z')
    expect(result.updated_at).toBe('2024-06-01T00:00:00Z')
  })

  it('maps minimal data (only required fields)', () => {
    const raw = { id: 'min-001' }
    const result = mapDevToProperty(raw)

    expect(result.id).toBe('min-001')
    expect(result.name).toBe('')
    expect(result.type).toBe('')
    expect(result.price).toBeNull()
    expect(result.area).toBeNull()
    expect(result.bedrooms).toBeNull()
    expect(result.bathrooms).toBeNull()
    expect(result.parking).toBeNull()
    expect(result.image_urls).toEqual([])
    expect(result.cover_image_url).toBeNull()
    expect(result.developer).toBeUndefined()
  })

  describe('images handling (JSONB images field)', () => {
    it('uses images.main for cover and images.gallery for gallery', () => {
      const raw = {
        id: 'img-001',
        images: {
          main: 'main-image.jpg',
          gallery: ['g1.jpg', 'g2.jpg', 'g3.jpg'],
        },
      }
      const result = mapDevToProperty(raw)

      expect(result.cover_image_url).toBe('main-image.jpg')
      expect(result.image_urls).toEqual(['g1.jpg', 'g2.jpg', 'g3.jpg'])
    })

    it('falls back to gallery_images when images JSONB is null', () => {
      const raw = {
        id: 'img-002',
        images: null,
        gallery_images: ['fallback1.jpg'],
        image: 'fallback-cover.jpg',
      }
      const result = mapDevToProperty(raw)

      expect(result.cover_image_url).toBe('fallback-cover.jpg')
      expect(result.image_urls).toEqual(['fallback1.jpg'])
    })

    it('falls back to image_urls (backoffice schema)', () => {
      const raw = {
        id: 'img-003',
        image_urls: ['bo1.jpg', 'bo2.jpg'],
        cover_image_url: 'bo-cover.jpg',
      }
      const result = mapDevToProperty(raw)

      expect(result.cover_image_url).toBe('bo-cover.jpg')
      expect(result.image_urls).toEqual(['bo1.jpg', 'bo2.jpg'])
    })

    it('uses cover image as sole image_url when no gallery exists', () => {
      const raw = {
        id: 'img-004',
        image: 'only-cover.jpg',
      }
      const result = mapDevToProperty(raw)

      expect(result.cover_image_url).toBe('only-cover.jpg')
      expect(result.image_urls).toEqual(['only-cover.jpg'])
    })
  })

  describe('developer field variations', () => {
    it('handles developer as a plain object (FK join)', () => {
      const raw = {
        id: 'dev-obj',
        developer: { id: 'd1', name: 'Builder Inc', logo_url: 'logo.png' },
      }
      const result = mapDevToProperty(raw)
      expect(result.developer).toEqual({ id: 'd1', name: 'Builder Inc', logo_url: 'logo.png' })
    })

    it('handles developer as object with logo instead of logo_url', () => {
      const raw = {
        id: 'dev-logo',
        developer: { id: 'd2', name: 'Builder Two', logo: 'alt-logo.png' },
      }
      const result = mapDevToProperty(raw)
      expect(result.developer).toEqual({ id: 'd2', name: 'Builder Two', logo_url: 'alt-logo.png' })
    })

    it('handles developer as an array (Supabase join returns array)', () => {
      const raw = {
        id: 'dev-arr',
        developer: [{ id: 'd3', name: 'Array Builder', logo_url: 'arr-logo.png' }],
      }
      const result = mapDevToProperty(raw)
      expect(result.developer).toEqual({ id: 'd3', name: 'Array Builder', logo_url: 'arr-logo.png' })
    })

    it('handles developer as empty array', () => {
      const raw = {
        id: 'dev-empty-arr',
        developer: [],
      }
      const result = mapDevToProperty(raw)
      expect(result.developer).toBeUndefined()
    })

    it('handles developer as a string', () => {
      const raw = {
        id: 'dev-str',
        developer: 'Some Dev Company',
        developer_logo: 'str-logo.png',
      }
      const result = mapDevToProperty(raw)
      expect(result.developer).toEqual({ id: '', name: 'Some Dev Company', logo_url: 'str-logo.png' })
    })

    it('handles developer as null', () => {
      const raw = {
        id: 'dev-null',
        developer: null,
      }
      const result = mapDevToProperty(raw)
      expect(result.developer).toBeUndefined()
    })
  })

  describe('column name variations', () => {
    it('uses title when name is not present', () => {
      const raw = { id: 'col-1', title: 'Via Titulo' }
      expect(mapDevToProperty(raw).name).toBe('Via Titulo')
    })

    it('prefers name over title', () => {
      const raw = { id: 'col-2', name: 'Via Name', title: 'Via Titulo' }
      expect(mapDevToProperty(raw).name).toBe('Via Name')
    })

    it('uses area_min when area_from is not present', () => {
      const raw = { id: 'col-3', area_min: 80 }
      expect(mapDevToProperty(raw).area).toBe(80)
    })

    it('uses price_min when price_from is not present', () => {
      const raw = { id: 'col-4', price_min: 300000 }
      expect(mapDevToProperty(raw).price).toBe(300000)
    })

    it('uses bedrooms_from when bedrooms is not present', () => {
      const raw = { id: 'col-5', bedrooms_from: 2 }
      expect(mapDevToProperty(raw).bedrooms).toBe(2)
    })

    it('uses specs.bedroomsRange as fallback for bedrooms', () => {
      const raw = { id: 'col-6', specs: { bedroomsRange: '3' } }
      expect(mapDevToProperty(raw).bedrooms).toBe(3)
    })

    it('uses tipo when type is absent', () => {
      const raw = { id: 'col-7', tipo: 'apartamento' }
      expect(mapDevToProperty(raw).type).toBe('apartamento')
    })
  })
})

describe('normalizeStatus', () => {
  it('maps English status names to Portuguese', () => {
    expect(normalizeStatus('launch')).toBe('lancamento')
    expect(normalizeStatus('available')).toBe('disponivel')
    expect(normalizeStatus('under_construction')).toBe('em_construcao')
    expect(normalizeStatus('ready')).toBe('disponivel')
    expect(normalizeStatus('sold')).toBe('vendido')
    expect(normalizeStatus('reserved')).toBe('reservado')
    expect(normalizeStatus('negotiating')).toBe('em_negociacao')
    expect(normalizeStatus('published')).toBe('disponivel')
    expect(normalizeStatus('draft')).toBe('rascunho')
    expect(normalizeStatus('campaign')).toBe('lancamento')
    expect(normalizeStatus('private')).toBe('privado')
  })

  it('is case insensitive', () => {
    expect(normalizeStatus('Launch')).toBe('lancamento')
    expect(normalizeStatus('AVAILABLE')).toBe('disponivel')
    expect(normalizeStatus('Sold')).toBe('vendido')
  })

  it('passes through already-normalized Portuguese statuses', () => {
    expect(normalizeStatus('disponivel')).toBe('disponivel')
    expect(normalizeStatus('lancamento')).toBe('lancamento')
    expect(normalizeStatus('vendido')).toBe('vendido')
  })

  it('passes through unknown statuses as-is (lowercased)', () => {
    expect(normalizeStatus('custom_status')).toBe('custom_status')
    expect(normalizeStatus('UNKNOWN')).toBe('unknown')
  })

  it('handles null/undefined gracefully', () => {
    expect(normalizeStatus(null as unknown as string)).toBe('disponivel')
    expect(normalizeStatus(undefined as unknown as string)).toBe('disponivel')
  })
})
