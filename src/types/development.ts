// src/types/development.ts
// VERSÃO FINAL - Baseada na estrutura REAL retornada pelo banco

export interface Development {
    id: string
    slug: string
    name: string
    developer: string
    developer_logo: string | null
    developer_id: string | null
    status: 'launch' | 'ready' | 'under_construction'
    region: 'paraiba' | 'pernambuco' | 'sao-paulo'
    neighborhood: string | null
    city: string | null
    state: string | null
    address: string | null
    lat: number | null
    lng: number | null
    delivery_date: string | null
    registration_number: string | null
    description: string | null
    short_description: string | null
    features: string[]
    specs: Record<string, string | number | boolean | null>

    // Campos de preço (REAL)
    price_from: number
    price_to: number

    // Mídia
    images: {
        main: string
        gallery: string[]
        videos: string[]
        floorPlans: string[]
        heroVideo?: string
        commonAreas?: string[]
        commonAreasVideos?: string[]
    }

    // Áreas Comuns / Mapa
    common_areas_images?: string[] | null
    common_areas_videos?: string[] | null
    common_areas_description?: string | null
    video_url: string | null
    external_links: Record<string, string>
    tags: string[]
    display_order: number
    is_highlighted: boolean

    // Campos novos (já existem no banco)
    property_type: string
    featured: boolean
    views_count: number
    leads_count: number
    virtual_tour_url: string | null

    // Campos extras que existem
    country: string | null
    tenant_id: string | null
    gallery_images: string[]
    floor_plans: string[]
    videos: string[]
    brochure_url: string | null
    units: number
    tipo: string | null
    status_comercial: string | null
    pais: string | null
    publico_alvo: string | null
    argumentos_venda: string[]
    tipologias: Record<string, string | number> | null
    metragem: string | null
    quartos: number | null
    suites: number | null
    vagas: number | null
    score: number
    created_by: string | null
    updated_by: string | null
    type: string
    status_commercial: string | null
    target_audience: string | null
    selling_points: string[]
    bedrooms: number
    bathrooms: number
    parking_spaces: number
    area_from: string | null
    area_to: string | null
    units_count: number
    floor_count: number | null
    inventory_score: number
    image: string | null
    views: number
    media: string[]
    completion_date: string | null
    total_units: number
    available_units: number

    created_at: string
    updated_at: string
}

export interface DevelopmentFilters {
    search?: string
    status?: string
    type?: string
    developer?: string
}
