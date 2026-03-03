// Types para o módulo de Imóveis

export type PropertyStatus = 'active' | 'inactive' | 'pending' | 'sold'
export type PropertyType = 'apartment' | 'house' | 'penthouse' | 'studio' | 'land' | 'commercial' | 'resort'
export type CommercialStatus = 'draft' | 'published' | 'campaign' | 'private' | 'sold'
export type Region = 'paraiba' | 'pernambuco' | 'sao-paulo' | 'dubai' | 'usa' | 'other'

export interface Developer {
    id: string
    name: string
    logo_url: string | null
    active: boolean
}

export interface Property {
    id: string
    name: string
    slug: string
    description: string | null
    developer_id: string | null
    developers?: Developer
    type: PropertyType
    status: PropertyStatus

    // Localização
    address: string
    neighborhood: string
    city: string
    state: string
    country: string
    region: Region
    zipcode: string | null
    lat: number | null
    lng: number | null

    // Financeiro
    price_from: number
    price_to: number | null

    // Características
    bedrooms: number | null
    bathrooms: number | null
    parking_spaces: number | null
    area_from: number | null
    area_to: number | null
    units: number
    floors: number | null

    // Mídia
    image: string | null
    gallery_images: string[] | null
    floor_plans: string[] | null
    videos: string[] | null
    virtual_tour_url: string | null
    brochure_url: string | null

    // Datas
    delivery: string | null
    launch_date: string | null

    // Metadata
    views: number
    leads_count: number
    score: number | null
    featured: boolean
    status_commercial: CommercialStatus
    target_audience: string | null
    selling_points: string[] | null

    created_at: string
    updated_at: string
}

export interface PropertyUnit {
    id: string
    property_id: string
    unit_number: string
    floor: number
    type: string
    bedrooms: number
    bathrooms: number
    area: number
    price: number
    status: 'available' | 'reserved' | 'sold'
    created_at: string
}

export interface PropertyEvent {
    id: string
    property_id: string
    title: string
    description: string | null
    event_date: string
    location: string | null
    max_attendees: number | null
    registered_count: number
    status: 'scheduled' | 'completed' | 'cancelled'
    created_at: string
}

export interface TrackedLink {
    id: string
    property_id: string
    properties?: Property
    short_code: string
    original_url: string
    clicks: number
    unique_clicks: number
    last_click_at: string | null
    created_at: string
}

export interface PropertyAnalytics {
    property_id: string
    period: string
    views: number
    unique_views: number
    leads: number
    conversion_rate: number
    avg_time_on_page: number
    bounce_rate: number
    top_sources: Array<{ source: string; count: number }>
}

export interface PropertyFilterParams {
    search?: string
    status?: PropertyStatus | 'all'
    type?: PropertyType | 'all'
    developer_id?: string | 'all'
    neighborhood?: string | 'all'
    price_min?: number
    price_max?: number
    bedrooms?: number | 'all'
    sort?: 'recent' | 'price_asc' | 'price_desc' | 'name' | 'views'
}
