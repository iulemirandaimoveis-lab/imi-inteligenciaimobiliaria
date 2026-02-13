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
    features: any[]
    specs: Record<string, any>

    // Campos de preço (REAL)
    price_from: number
    price_to: number

    // Mídia
    images: {
        main: string
        gallery: string[]
        videos: string[]
        floorPlans: string[]
    }
    video_url: string | null
    external_links: Record<string, any>
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
    videos: any
    brochure_url: string | null
    units: number
    tipo: string | null
    status_comercial: string | null
    pais: string | null
    publico_alvo: string | null
    argumentos_venda: any[]
    tipologias: any
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
    selling_points: any[]
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
    media: any[]
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
