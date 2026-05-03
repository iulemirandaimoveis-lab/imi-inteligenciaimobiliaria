
import { Development } from '@/app/[lang]/(website)/imoveis/types/development';

const YT_PATTERNS = [
    /youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
];

function extractYouTubeId(url: string): string | null {
    for (const r of YT_PATTERNS) {
        const m = url.match(r);
        if (m) return m[1];
    }
    return null;
}

function toYoutubeEmbed(url: string): string | null {
    if (!url) return null;
    const id = extractYouTubeId(url);
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

/** Deduplicate a list of video URLs by their resolved YouTube video ID */
function deduplicateVideos(urls: string[]): string[] {
    const seen = new Set<string>();
    return urls.filter(url => {
        const id = extractYouTubeId(url);
        const key = id ?? url;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- DB row shape is dynamic from Supabase joins
export function mapDbPropertyToDevelopment(dbProp: Record<string, any>): Development {
    // Determine status from status_commercial
    const status = (dbProp.status === 'ready' || dbProp.status_commercial === 'ready') ? 'ready' : (dbProp.status || 'launch');

    // Parse JSON arrays safely if they come as strings (sometimes happens with raw SQL)
    // Prioritize JSONB 'images' structure if available, fallback to legacy columns
    const imagesJson = dbProp.images || {};

    // Merge both JSONB images.gallery AND legacy gallery_images column — deduplicate
    const jsonbGallery = Array.isArray(imagesJson.gallery) ? imagesJson.gallery : [];
    const textGallery = Array.isArray(dbProp.gallery_images) ? dbProp.gallery_images : [];
    const gallery = [...new Set([...jsonbGallery, ...textGallery])].filter(Boolean);

    const baseVideos: string[] = Array.isArray(imagesJson.videos)
        ? imagesJson.videos
        : (Array.isArray(dbProp.videos) ? dbProp.videos : []);
    // Merge video_url and video_short_url into the videos array, then deduplicate by YouTube ID
    const extraUrls: string[] = [dbProp.video_url, dbProp.video_short_url].filter(Boolean);
    const videos = deduplicateVideos([...baseVideos, ...extraUrls]);

    const floorPlans = Array.isArray(imagesJson.floorPlans)
        ? imagesJson.floorPlans
        : (Array.isArray(dbProp.floor_plans) ? dbProp.floor_plans : []);

    const features = Array.isArray(dbProp.features)
        ? dbProp.features
        : (Array.isArray(dbProp.selling_points) ? dbProp.selling_points : []);

    // Construct specs string
    const beds = dbProp.bedrooms ? `${dbProp.bedrooms}` : 'Sob consulta';
    const area = dbProp.area_from
        ? `${dbProp.area_from}${dbProp.area_to && dbProp.area_to !== dbProp.area_from
            ? ' a ' + dbProp.area_to
            : ''}m²`
        : 'Sob consulta';

    // Main image logic: Prioritize images.main, then gallery[0], then legacy dbProp.image
    const mainImage = imagesJson.main || (gallery.length > 0 ? gallery[0] : (dbProp.image || null));

    // Developer Logic
    // If returned from join, use developers object. Otherwise check for flat fields.
    const developerName = dbProp.developers?.name || dbProp.developer_name || 'IMI - Inteligência Imobiliária';
    const developerLogo = dbProp.developers?.logo_url || dbProp.developers?.logo || dbProp.developer_logo || null;

    return {
        id: dbProp.id,
        slug: dbProp.slug,
        name: dbProp.title || dbProp.name || 'Empreendimento Sem Nome',
        developer: developerName,
        developerLogo: developerLogo,
        status: status as Development['status'],
        region: (dbProp.region as Development['region']) || 'pernambuco',
        location: {
            neighborhood: dbProp.neighborhood || '',
            city: dbProp.city || '',
            state: dbProp.state || 'PE',
            region: dbProp.region || 'pernambuco',
            country: dbProp.country || 'Brasil',
            coordinates: {
                lat: dbProp.lat ?? null,
                lng: dbProp.lng ?? null,
            },
            address: dbProp.address || ''
        },
        deliveryDate: dbProp.delivery_date ? new Date(dbProp.delivery_date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'Sob consulta',
        registrationNumber: dbProp.registration_number || '',
        description: dbProp.description || '',
        shortDescription: dbProp.description ? dbProp.description.substring(0, 120) + '...' : '',
        features: features,
        specs: {
            bedroomsRange: beds,
            areaRange: area,
            bathroomsRange: dbProp.bathrooms ? `${dbProp.bathrooms}` : undefined,
            parkingRange: dbProp.parking_spaces || dbProp.parking_spots ? `${dbProp.parking_spaces || dbProp.parking_spots}` : undefined,
        },
        priceRange: {
            min: Number(dbProp.price_from || dbProp.price_min) || 0,
            max: Number(dbProp.price_to || dbProp.price_max) || 0,
        },
        images: {
            main: mainImage,
            gallery: gallery,
            videos: videos,
            floorPlans: floorPlans,
            virtualTour: dbProp.virtual_tour_url,
            brochure: dbProp.brochure_url,
            heroVideo: imagesJson.hero_video || (dbProp.slug === 'jazz-boulevard-garanhuns' ? '/jazz-boulevard/hero.mp4' : undefined),
        },
        units: [], // Units are loaded separately on detail view if needed
        tags: Array.isArray(dbProp.tags) ? dbProp.tags : [],
        order: dbProp.display_order || 0,
        isHighlighted: dbProp.is_highlighted || false,
        createdAt: dbProp.created_at || new Date().toISOString(),
        updatedAt: dbProp.updated_at || new Date().toISOString(),
        listingCategory: 'comprar',
    };
}

/**
 * Maps a rental_properties row to the Development interface
 * so it can be displayed in the same unified listing grid.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapRentalToDevelopment(r: Record<string, any>): Development {
    const modeToCategory: Record<string, Development['listingCategory']> = {
        short_stay: 'short_stay',
        traditional: 'aluguel',
        seasonal: 'temporada',
        hybrid: 'temporada',
    };
    const category = modeToCategory[r.listing_mode] || 'aluguel';

    const typeLabel: Record<string, string> = {
        apartment: 'Apartamento', house: 'Casa', studio: 'Studio',
        penthouse: 'Cobertura', room: 'Quarto', commercial: 'Comercial',
    };

    const photos: string[] = Array.isArray(r.photos) ? r.photos : [];

    return {
        id: `rental-${r.id}`,
        slug: `rental-${r.id}`,
        name: r.name || 'Imóvel para Locação',
        developer: r.owner_name || 'IMI - Inteligência Imobiliária',
        status: 'ready',
        region: 'pernambuco',
        location: {
            neighborhood: r.neighborhood || '',
            city: r.city || '',
            state: r.state || '',
            region: 'pernambuco',
            country: r.country || 'Brasil',
            coordinates: {
                lat: r.lat ?? r.latitude ?? null,
                lng: r.lng ?? r.longitude ?? null,
            },
            address: r.address || '',
        },
        description: r.rules || '',
        shortDescription: r.address || typeLabel[r.property_type] || '',
        features: Array.isArray(r.amenities) ? r.amenities : [],
        specs: {
            bedroomsRange: r.bedrooms ? `${r.bedrooms}` : '—',
            areaRange: '—',
            bathroomsRange: r.bathrooms ? `${r.bathrooms}` : undefined,
        },
        priceRange: {
            min: r.daily_rate || r.monthly_rate || 0,
            max: r.monthly_rate || r.daily_rate || 0,
        },
        images: {
            main: photos[0] || '',
            gallery: photos,
            videos: [],
            floorPlans: [],
        },
        units: [],
        tags: [r.property_type || 'apartment', r.listing_mode || 'rental'].filter(Boolean),
        order: 999,
        isHighlighted: false,
        createdAt: r.created_at || new Date().toISOString(),
        updatedAt: r.updated_at || new Date().toISOString(),
        listingCategory: category,
        dailyRate: r.daily_rate || undefined,
        monthlyRate: r.monthly_rate || undefined,
        rentalId: r.id,
    };
}
