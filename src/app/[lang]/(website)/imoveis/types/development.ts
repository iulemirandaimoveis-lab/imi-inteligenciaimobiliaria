export type DevelopmentStatus = 'launch' | 'ready' | 'under_construction';
export type UnitStatus = 'available' | 'reserved' | 'sold';

export interface DevelopmentUnit {
    id: string;
    unit: string;                        // Ex: "102", "GARDEN 01", "CASA 6"
    type: string;                        // Ex: "FLAT", "APTO", "COBERTURA DUPLEX", "GARDEN", "CASA"
    area: number;                        // m²
    position?: string;                   // Ex: "NORTE", "SUL", "NASC/SUL"
    tower?: string;                      // Ex: "RES", "N", "S", "P", "A", "B", "C"
    bedrooms?: number;
    bathrooms?: number;
    parkingSpots?: number;
    totalPrice: number;                  // Valor total em R$
    status: UnitStatus;
}

export interface DevelopmentLocation {
    neighborhood: string;                // Ex: "Ponta de Campina"
    city: string;                        // Ex: "Cabedelo"
    state: string;                       // Ex: "PB"
    region: 'paraiba' | 'pernambuco' | 'sao-paulo' | 'internacional'; // Região para filtros
    country?: string;                    // Ex: "Brasil", "Emirados Árabes Unidos", "Estados Unidos"
    coordinates: { lat: number; lng: number };
    address?: string;                    // Endereço completo
}

export interface DevelopmentSpecs {
    bedroomsRange: string;               // Ex: "1-4"
    areaRange: string;                   // Ex: "29-251m²"
    bathroomsRange?: string;
    parkingRange?: string;
}

export interface DevelopmentPriceRange {
    min: number;
    max: number;
}

export interface DevelopmentImages {
    main: string;                        // URL principal (placeholder se vazio)
    gallery: string[];                   // URLs da galeria
    videos: string[];                    // URLs de vídeo (YouTube/Vimeo embed)
    floorPlans: string[];                // Plantas baixas
    virtualTour?: string;                // Link para tour virtual
    brochure?: string;                   // URL do brochure/book PDF
}

export interface DevelopmentExternalLinks {
    officialSite?: string;
    bookUrl?: string;                    // Link para book PDF
    locationMapUrl?: string;
    galleryUrl?: string;                 // Google Drive ou similar
}

export interface Development {
    id: string;
    slug: string;                        // URL-friendly: "setai-beach-resort"
    name: string;                        // Nome comercial
    developer: string;                   // "Setai Grupo GP"
    developerLogo?: string;              // URL da logo da construtora
    status: DevelopmentStatus;
    region: 'paraiba' | 'pernambuco' | 'sao-paulo' | 'internacional'; // Região para filtros
    location: DevelopmentLocation;
    deliveryDate?: string;               // Ex: "Dezembro 2026"
    registrationNumber?: string;         // Ex: "R-02-30.697"
    description: string;                 // Descrição longa (200-400 chars)
    shortDescription: string;            // Para o card (80-120 chars)
    features: string[];                  // Diferenciais (array de strings)
    specs: DevelopmentSpecs;
    priceRange: DevelopmentPriceRange;
    images: DevelopmentImages;
    videoUrl?: string;                   // YouTube/Vimeo embed URL (deprecated, prefer images.videos)
    externalLinks?: DevelopmentExternalLinks;
    units: DevelopmentUnit[];
    tags: string[];                      // Ex: ["frente-mar", "flat", "luxo"]
    order: number;                       // Ordem de exibição na vitrine
    isHighlighted: boolean;              // Destaque especial
    createdAt: string;
    updatedAt: string;
}
