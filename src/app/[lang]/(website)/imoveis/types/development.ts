export interface DevelopmentUnit {
  id: string;
  unit: string;
  type: string;
  area: number;
  position?: string;
  tower?: string;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpots?: number;
  totalPrice: number;
  status: 'available' | 'reserved' | 'sold';
}

export interface Development {
  id: string;
  slug: string;
  name: string;
  developer: string;
  status: 'launch' | 'ready' | 'under_construction';
  location: {
    neighborhood: string;
    city: string;
    state: string;
    coordinates: { lat: number; lng: number };
    address?: string;
  };
  deliveryDate?: string;
  registrationNumber?: string;
  description: string;
  shortDescription: string;
  features: string[];
  specs: {
    bedroomsRange: string;
    areaRange: string;
    bathroomsRange?: string;
    parkingRange?: string;
  };
  priceRange: {
    min: number;
    max: number;
  };
  images: {
    main: string;
    gallery: string[];
  };
  videoUrl?: string;
  externalLinks?: {
    officialSite?: string;
    bookUrl?: string;
    locationMapUrl?: string;
    galleryUrl?: string;
  };
  units: DevelopmentUnit[];
  tags: string[];
  order: number;
  isHighlighted: boolean;
  createdAt: string;
  updatedAt: string;
}
