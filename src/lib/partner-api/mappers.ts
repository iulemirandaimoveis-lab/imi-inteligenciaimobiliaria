/**
 * Partner API v1 — mappers do schema interno para o contrato público.
 *
 * Regra do D-15: nenhuma rota /api/v1 devolve linha crua do banco. Todo campo
 * exposto é decidido AQUI, coluna a coluna (colunas verificadas em produção
 * via MCP em 2026-07-05 — lição FX-10). Preço só sai com escopo prices:read.
 */

import type { PartnerDevelopment, PartnerLot, PartnerLotStatus } from './types'

/** Colunas lidas de `developments` — todas confirmadas no banco de produção. */
export const PARTNER_DEV_SELECT = [
    'id', 'slug', 'name', 'developer', 'developer_logo', 'status',
    'status_commercial', 'type', 'property_type', 'description',
    'short_description', 'address', 'neighborhood', 'city', 'state', 'country',
    'lat', 'lng', 'delivery_date', 'total_units', 'units_count',
    'available_units', 'area_from', 'area_to', 'image', 'images',
    'gallery_images', 'floor_plans', 'videos', 'video_url', 'cover_video_url',
    'virtual_tour_url', 'brochure_url', 'features', 'price_min', 'price_max',
    'price_from', 'price_to', 'created_at', 'updated_at',
].join(', ')

/** Colunas lidas de `subdivision_lots`. */
export const PARTNER_LOT_SELECT =
    'id, development_id, quadra, lot_number, area_m2, price, status, special_type, updated_at'

/** Empreendimentos visíveis para parceiros — mesmo critério do site público. */
export const PARTNER_VISIBLE_STATUSES = ['published', 'campaign']

/** Slugs com módulo cartográfico servível em /api/v1/developments/{id}/map. */
export const MAP_ENABLED_SLUGS = new Set(['alto-bellevue'])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

function asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return []
    return value.filter((v): v is string => typeof v === 'string' && v.length > 0)
}

export function toPartnerDevelopment(row: Row, { includePrices = false } = {}): PartnerDevelopment {
    const images = (row.images ?? {}) as Row
    const gallery = asStringArray(row.gallery_images).length
        ? asStringArray(row.gallery_images)
        : asStringArray(images.gallery)
    const videos = [
        ...asStringArray(row.videos),
        ...(typeof row.video_url === 'string' && row.video_url ? [row.video_url] : []),
    ]

    const dev: PartnerDevelopment = {
        id: row.id,
        slug: row.slug,
        name: row.name,
        developer: {
            name: row.developer ?? null,
            logo_url: row.developer_logo ?? null,
        },
        status: row.status ?? null,
        type: row.property_type ?? row.type ?? null,
        description: row.description ?? null,
        short_description: row.short_description ?? null,
        location: {
            address: row.address ?? null,
            neighborhood: row.neighborhood ?? null,
            city: row.city ?? null,
            state: row.state ?? null,
            country: row.country ?? null,
            lat: row.lat ?? null,
            lng: row.lng ?? null,
        },
        delivery_date: row.delivery_date ?? null,
        units: {
            total: row.total_units ?? row.units_count ?? null,
            available: row.available_units ?? null,
        },
        area_m2: { from: row.area_from ?? null, to: row.area_to ?? null },
        media: {
            cover_image: row.image ?? (typeof images.main === 'string' ? images.main : null) ?? null,
            gallery,
            floor_plans: asStringArray(row.floor_plans),
            videos: Array.from(new Set(videos)),
            cover_video_url: row.cover_video_url ?? null,
            virtual_tour_url: row.virtual_tour_url ?? null,
            brochure_url: row.brochure_url ?? null,
        },
        features: Array.isArray(row.features) ? row.features : [],
        map_available: MAP_ENABLED_SLUGS.has(row.slug),
        created_at: row.created_at ?? null,
        updated_at: row.updated_at ?? null,
    }

    if (includePrices) {
        dev.price_range = {
            min: row.price_min ?? row.price_from ?? null,
            max: row.price_max ?? row.price_to ?? null,
            currency: 'BRL',
        }
    }
    return dev
}

/** Vocabulário fechado do contrato: interno (subdivision_lots/planilha) → público. */
const LOT_STATUS_MAP: Record<string, PartnerLotStatus> = {
    DISPONIVEL: 'disponivel',
    RESERVADO: 'reservado',
    VENDIDO: 'vendido',
    NEGOCIACAO: 'em_negociacao',
    // Lote de proprietário não é comercializável — para o parceiro é "bloqueado".
    PROPRIETARIO: 'bloqueado',
    BLOQUEADO: 'bloqueado',
}

export function toPartnerLotStatus(internal: string | null | undefined): PartnerLotStatus {
    if (!internal) return 'bloqueado'
    return LOT_STATUS_MAP[internal.toUpperCase()] ?? 'bloqueado'
}

/** Código canônico "A-01" — o mesmo id dos mapas e da planilha de disponibilidade. */
export function lotCode(quadra: string, lotNumber: number): string {
    return `${String(quadra).toUpperCase()}-${String(lotNumber).padStart(2, '0')}`
}

export function toPartnerLot(row: Row, { includePrices = false } = {}): PartnerLot {
    const lot: PartnerLot = {
        id: row.id,
        development_id: row.development_id,
        code: lotCode(row.quadra, row.lot_number),
        quadra: String(row.quadra).toUpperCase(),
        lot_number: Number(row.lot_number),
        area_m2: row.area_m2 != null ? Number(row.area_m2) : null,
        status: toPartnerLotStatus(row.status),
        special_type: row.special_type ?? null,
        updated_at: row.updated_at ?? null,
    }
    if (includePrices) {
        lot.price = row.price != null ? Number(row.price) : null
    }
    return lot
}
