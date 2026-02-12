
import { Development } from '@/app/[lang]/(website)/imoveis/types/development';

export function mapDbPropertyToDevelopment(dbProp: any): Development {
    // Determine status from status_commercial
    const status = (dbProp.status === 'ready' || dbProp.status_commercial === 'ready') ? 'ready' : 'launch';

    // Parse JSON arrays safely if they come as strings (sometimes happens with raw SQL)
    const gallery = Array.isArray(dbProp.gallery_images) ? dbProp.gallery_images : [];
    const videos = Array.isArray(dbProp.videos) ? dbProp.videos : [];
    const floorPlans = Array.isArray(dbProp.floor_plans) ? dbProp.floor_plans : [];
    const features = Array.isArray(dbProp.selling_points) ? dbProp.selling_points : (Array.isArray(dbProp.features) ? dbProp.features : []);

    // Construct specs string
    const beds = dbProp.bedrooms ? `${dbProp.bedrooms}` : 'Sob consulta';
    const area = dbProp.area_from
        ? `${dbProp.area_from}${dbProp.area_to && dbProp.area_to !== dbProp.area_from ? ' a ' + dbProp.area_to : ''}m²`
        : 'Sob consulta';

    return {
        id: dbProp.id,
        slug: dbProp.slug,
        name: dbProp.title || dbProp.name || 'Empreendimento Sem Nome',
        developer: dbProp.developers?.name || 'IMI - Inteligência Imobiliária',
        developerLogo: dbProp.developers?.logo || dbProp.developers?.logo_url || null,
        status: status,
        region: (dbProp.region as any) || 'paraiba',
        location: {
            neighborhood: dbProp.neighborhood || '',
            city: dbProp.city || '',
            state: dbProp.state || 'PB', // Default to PB if unknown
            region: dbProp.region || 'paraiba',
            country: dbProp.country || 'Brasil',
            coordinates: {
                lat: dbProp.lat || -7.1150,
                lng: dbProp.lng || -34.8230
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
            parkingRange: dbProp.parking_spaces ? `${dbProp.parking_spaces}` : undefined,
        },
        priceRange: {
            min: Number(dbProp.price_from) || 0,
            max: Number(dbProp.price_to) || 0,
        },
        images: {
            main: dbProp.image || '/images/placeholders/property-main.jpg',
            gallery: gallery,
            videos: videos,
            floorPlans: floorPlans,
            virtualTour: dbProp.virtual_tour_url,
            brochure: dbProp.brochure_url
        },
        units: [], // Units are loaded separately on detail view if needed
        tags: Array.isArray(dbProp.tags) ? dbProp.tags : [],
        order: dbProp.display_order || 0,
        isHighlighted: dbProp.is_highlighted || false,
        createdAt: dbProp.created_at || new Date().toISOString(),
        updatedAt: dbProp.updated_at || new Date().toISOString(),
    };
}
