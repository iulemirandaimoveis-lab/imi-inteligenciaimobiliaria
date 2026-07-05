/**
 * Partner API v1 (D-15) — tipos do contrato público.
 *
 * O contrato NUNCA expõe colunas cruas do banco: toda resposta passa por um
 * mapper explícito (`mappers.ts`). Mudanças de schema interno não podem quebrar
 * `/api/v1/*` — se o contrato precisar mudar de forma incompatível, nasce /v2.
 */

export const PARTNER_SCOPES = [
    'developments:read',
    'lots:read',
    'maps:read',
    'prices:read',
] as const

export type PartnerScope = (typeof PARTNER_SCOPES)[number]

export interface PartnerAuthContext {
    keyId: string
    partnerName: string
    scopes: string[]
}

/** Status público de lote — vocabulário fechado do contrato v1. */
export type PartnerLotStatus =
    | 'disponivel'
    | 'reservado'
    | 'vendido'
    | 'em_negociacao'
    | 'bloqueado'

export interface PartnerDevelopment {
    id: string
    slug: string
    name: string
    developer: { name: string | null; logo_url: string | null }
    status: string | null
    type: string | null
    description: string | null
    short_description: string | null
    location: {
        address: string | null
        neighborhood: string | null
        city: string | null
        state: string | null
        country: string | null
        lat: number | null
        lng: number | null
    }
    delivery_date: string | null
    units: { total: number | null; available: number | null }
    area_m2: { from: number | null; to: number | null }
    media: {
        cover_image: string | null
        gallery: string[]
        floor_plans: string[]
        videos: string[]
        cover_video_url: string | null
        virtual_tour_url: string | null
        brochure_url: string | null
    }
    features: unknown[]
    /** Presente apenas quando a chave tem escopo prices:read. */
    price_range?: { min: number | null; max: number | null; currency: 'BRL' }
    map_available: boolean
    created_at: string | null
    updated_at: string | null
}

export interface PartnerLot {
    id: string
    development_id: string
    /** Código canônico "QUADRA-LOTE" (ex.: "A-01") — mesmo id usado nos mapas. */
    code: string
    quadra: string
    lot_number: number
    area_m2: number | null
    status: PartnerLotStatus
    special_type: string | null
    /** Presente apenas quando a chave tem escopo prices:read. */
    price?: number | null
    updated_at: string | null
}
