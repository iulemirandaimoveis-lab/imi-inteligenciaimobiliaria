// Centralized image fallback for all property components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMainImage(property: Record<string, any>): string | null {
    return (
        property.images?.main ||
        property.images?.gallery?.[0] ||
        property.image ||
        property.gallery_images?.[0] ||
        property.cover_image ||
        null
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getGalleryImages(property: Record<string, any>): string[] {
    const jsonbGallery = Array.isArray(property.images?.gallery) ? property.images.gallery : []
    const textGallery = Array.isArray(property.gallery_images) ? property.gallery_images : []
    return [...new Set([...jsonbGallery, ...textGallery])].filter(Boolean)
}
