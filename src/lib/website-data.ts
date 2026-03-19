import { createClient } from '@supabase/supabase-js'
import { Development } from '@/app/[lang]/(website)/imoveis/types/development'
// Use direct supabase-js client for public data fetching
// This avoids issues with cookies and server context in Next.js 14
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: ReturnType<typeof createClient<any>> | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabase(): ReturnType<typeof createClient<any>> {
    if (!_supabase) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'build-placeholder'
        _supabase = createClient(supabaseUrl, supabaseKey)
    }
    return _supabase!
}
export async function getDevelopments(): Promise<Development[]> {
    const { data: devs, error } = await getSupabase()
        .from('developments')
        .select('*')
        .order('display_order', { ascending: true })
    if (error) {
        return []
    }
    return devs.map((dev: Record<string, unknown>) => mapDatabaseToDevelopment(dev))
}
export async function getDevelopmentBySlug(slug: string): Promise<Development | null> {
    const { data: dev, error } = await getSupabase()
        .from('developments')
        .select('*')
        .eq('slug', slug)
        .single()
    if (error) {
        return null
    }
    return mapDatabaseToDevelopment(dev)
}
// Database row type for developments table
interface DbDevelopment {
    id: string
    slug: string
    name: string
    developer: string
    developer_logo?: string
    status: string
    region: string
    neighborhood?: string
    city?: string
    state?: string
    address?: string
    lat?: number
    lng?: number
    delivery_date?: string
    registration_number?: string
    description?: string
    short_description?: string
    features?: string[]
    specs?: { bedroomsRange?: string; areaRange?: string }
    price_min?: number
    price_max?: number
    images?: { main?: string; gallery?: string[]; videos?: string[]; floorPlans?: string[] }
    units?: Development['units']
    tags?: string[]
    display_order?: number
    is_highlighted?: boolean
    created_at?: string
    updated_at?: string
}
function mapDatabaseToDevelopment(raw: Record<string, unknown>): Development {
    const dbDev = raw as unknown as DbDevelopment
    return {
        id: dbDev.id,
        slug: dbDev.slug,
        name: dbDev.name,
        developer: dbDev.developer,
        developerLogo: dbDev.developer_logo,
        status: dbDev.status as Development['status'],
        region: dbDev.region as Development['region'],
        location: {
            neighborhood: dbDev.neighborhood || '',
            city: dbDev.city || '',
            state: dbDev.state || '',
            country: dbDev.region === 'internacional' ? (dbDev.state || dbDev.city || '') : 'Brasil',
            region: dbDev.region as Development['region'],
            address: dbDev.address,
            coordinates: {
                lat: dbDev.lat || 0,
                lng: dbDev.lng || 0
            }
        },
        deliveryDate: dbDev.delivery_date,
        registrationNumber: dbDev.registration_number,
        description: dbDev.description || '',
        shortDescription: dbDev.short_description || '',
        features: dbDev.features || [],
        specs: {
            bedroomsRange: dbDev.specs?.bedroomsRange || 'N/A',
            areaRange: dbDev.specs?.areaRange || 'N/A'
        },
        priceRange: {
            min: dbDev.price_min || 0,
            max: dbDev.price_max || 0
        },
        images: {
            main: dbDev.images?.main || '',
            gallery: dbDev.images?.gallery || [],
            videos: dbDev.images?.videos || [],
            floorPlans: dbDev.images?.floorPlans || []
        },
        units: dbDev.units || [],
        tags: dbDev.tags || [],
        order: dbDev.display_order || 99,
        isHighlighted: dbDev.is_highlighted || false,
        createdAt: dbDev.created_at || '',
        updatedAt: dbDev.updated_at || ''
    }
}
export interface BlogPost {
    id: string
    title: string
    slug: string
    excerpt: string
    content: string
    coverImage: string
    publishedAt: string
    author: string
    category: string
    tags: string[]
}
export async function getLatestPosts(limit = 6): Promise<BlogPost[]> {
    const { data: posts, error } = await getSupabase()
        .from('content_publications')
        .select(`
            id,
            published_at,
            published_content,
            published_image_urls,
            content_item:content_items (
                title,
                topic,
                hashtags
            )
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limit)
    if (error) {
        return []
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase join returns dynamic shape
    return posts.map((p: Record<string, any>) => ({
        id: p.id,
        title: p.content_item?.title || 'Sem título',
        slug: p.id,
        excerpt: p.published_content?.substring(0, 150) + '...',
        content: p.published_content || '',
        coverImage: p.published_image_urls?.[0] || '/images/blog-placeholder.jpg',
        publishedAt: p.published_at,
        author: 'IMI Intelligence',
        category: p.content_item?.topic || 'Geral',
        tags: p.content_item?.hashtags || []
    }))
}
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
    const { data: post, error } = await getSupabase()
        .from('content_publications')
        .select(`
            id,
            published_at,
            published_content,
            published_image_urls,
            content_item:content_items (
                title,
                topic,
                hashtags
            )
        `)
        .eq('status', 'published')
        .eq('id', slug) // Por enquanto slug é ID
        .single()
    if (error || !post) {
        return null
    }
    // content_item pode ser array ou objeto dependendo do join
    const item = Array.isArray(post.content_item) ? post.content_item[0] : post.content_item;
    return {
        id: post.id,
        title: item?.title || 'Sem título',
        slug: post.id,
        excerpt: post.published_content?.substring(0, 150) + '...',
        content: post.published_content || '',
        coverImage: post.published_image_urls?.[0] || '/images/blog-placeholder.jpg',
        publishedAt: post.published_at,
        author: 'IMI Intelligence',
        category: item?.topic || 'Geral',
        tags: item?.hashtags || []
    }
}
