const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zocffccwjjyelwrgunhu.supabase.co'

/** Ensure image URL is absolute — handles relative Supabase Storage paths */
export function normalizeImageUrl(url: string | null | undefined): string | null {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    // Relative path like "property-images/abc.jpg" → full Supabase Storage URL
    if (url.startsWith('/')) return `${SUPABASE_URL}/storage/v1/object/public${url}`
    return `${SUPABASE_URL}/storage/v1/object/public/${url}`
}

// Centralized image fallback for all property components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMainImage(property: Record<string, any>): string | null {
    const raw = (
        property.images?.main ||
        property.images?.gallery?.[0] ||
        property.image ||
        property.gallery_images?.[0] ||
        property.cover_image ||
        property.cover_image_url ||
        null
    )
    return normalizeImageUrl(raw)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getGalleryImages(property: Record<string, any>): string[] {
    const jsonbGallery = Array.isArray(property.images?.gallery) ? property.images.gallery : []
    const textGallery = Array.isArray(property.gallery_images) ? property.gallery_images : []
    return [...new Set([...jsonbGallery, ...textGallery])].filter(Boolean)
}
