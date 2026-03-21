import type { IMIProperty } from '@/features/properties/types'

/**
 * Maps a raw Supabase `developments` row to IMIProperty.
 * Handles ALL column-name variations across schemas:
 *  - Original migration: title, area_from, bedrooms, image, gallery_images
 *  - Website schema: name, images (JSONB), specs (JSONB), price_min, price_max
 *  - Backoffice schema: area_from, bedrooms, image_urls, cover_image_url
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- DB row has 30+ dynamic columns from multiple schema versions
export function mapDevToProperty(d: Record<string, any>): IMIProperty {
  // Images: handle JSONB `images` field or array fields
  const imagesObj = d.images as { main?: string; gallery?: string[]; videos?: string[]; floorPlans?: string[] } | null
  const gallery = imagesObj?.gallery ?? d.gallery_images ?? d.image_urls ?? []
  const cover = imagesObj?.main ?? d.image ?? d.cover_image_url ?? null

  // Area: handle multiple naming conventions
  const area = d.area_from ?? d.area ?? null

  // Price: handle multiple naming conventions
  const price = d.price_from ?? d.price_min ?? d.price ?? null

  // Developer: handle FK join vs text field
  let developer: IMIProperty['developer'] = undefined
  if (d.developer && typeof d.developer === 'object' && !Array.isArray(d.developer)) {
    developer = { id: d.developer.id, name: d.developer.name, logo_url: d.developer.logo_url ?? d.developer.logo }
  } else if (Array.isArray(d.developer) && d.developer[0]) {
    developer = { id: d.developer[0].id, name: d.developer[0].name, logo_url: d.developer[0].logo_url ?? d.developer[0].logo }
  } else if (typeof d.developer === 'string') {
    developer = { id: '', name: d.developer, logo_url: d.developer_logo ?? null }
  }

  return {
    id: d.id,
    name: d.name ?? d.title ?? '',
    type: d.type ?? d.tipo ?? '',
    condition: d.condition,
    status: normalizeStatus(d.status_commercial ?? d.status_comercial ?? d.status ?? 'disponivel'),
    price,
    area,
    bedrooms: d.bedrooms ?? (d.specs?.bedroomsRange ? parseInt(d.specs.bedroomsRange) : null) ?? null,
    bathrooms: d.bathrooms ?? null,
    parking: d.parking_spaces ?? null,
    neighborhood: d.neighborhood,
    city: d.city,
    state: d.state,
    address: d.address,
    image_urls: gallery.length > 0 ? gallery : (cover ? [cover] : []),
    cover_image_url: cover,
    slug: d.slug,
    developer,
    created_at: d.created_at,
    updated_at: d.updated_at,
  }
}

const DB_STATUS_MAP: Record<string, string> = {
  launch: 'lancamento',
  available: 'disponivel',
  under_construction: 'em_construcao',
  ready: 'disponivel',
  sold: 'vendido',
  reserved: 'reservado',
  negotiating: 'em_negociacao',
  published: 'disponivel',
  draft: 'rascunho',
  campaign: 'lancamento',
  private: 'privado',
}

export function normalizeStatus(s: string): string {
  return DB_STATUS_MAP[s?.toLowerCase()] ?? s?.toLowerCase() ?? 'disponivel'
}
