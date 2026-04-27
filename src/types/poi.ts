export type POICategory =
    | 'supermarket'
    | 'restaurant'
    | 'hospital'
    | 'pharmacy'
    | 'gas_station'
    | 'shopping_mall'
    | 'park'
    | 'beach'
    | 'gym'
    | 'school'
    | 'bank'
    | 'airport';

export interface POIItem {
    name: string;
    category: POICategory;
    distance_meters: number;
    rating?: number;
    address?: string;
    place_id: string;
}

export interface POICategoryResult {
    category: POICategory;
    label: string;
    icon: string;
    color: string;
    items: POIItem[];
    nearest_distance_meters: number;
}

export interface ConvenienceData {
    development_id: string;
    score: number;
    score_label: 'Excelente' | 'Ótimo' | 'Bom' | 'Regular' | 'Limitado';
    categories: POICategoryResult[];
    cached_at: string;
}

export interface POICategoryConfig {
    category: POICategory;
    radius: number;
    weight: number;
    label: string;
    icon: string;
    color: string;
}

export const POI_CONFIG: Record<string, POICategoryConfig[]> = {
    short_stay: [
        { category: 'restaurant',    radius: 500,  weight: 20, label: 'Restaurantes', icon: '🍽️', color: '#E85D4A' },
        { category: 'supermarket',   radius: 1000, weight: 15, label: 'Mercados',     icon: '🛒', color: '#4CAF50' },
        { category: 'pharmacy',      radius: 500,  weight: 10, label: 'Farmácias',    icon: '💊', color: '#2196F3' },
        { category: 'hospital',      radius: 3000, weight: 15, label: 'Hospitais',    icon: '🏥', color: '#F44336' },
        { category: 'beach',         radius: 1000, weight: 20, label: 'Praia',        icon: '🏖️', color: '#00BCD4' },
        { category: 'shopping_mall', radius: 3000, weight: 10, label: 'Shopping',     icon: '🏬', color: '#9C27B0' },
        { category: 'gas_station',   radius: 1000, weight: 5,  label: 'Posto',        icon: '⛽', color: '#FF9800' },
        { category: 'park',          radius: 1000, weight: 5,  label: 'Parques',      icon: '🌳', color: '#8BC34A' },
    ],
    residencial: [
        { category: 'supermarket',   radius: 1000, weight: 20, label: 'Mercados',     icon: '🛒', color: '#4CAF50' },
        { category: 'pharmacy',      radius: 1000, weight: 15, label: 'Farmácias',    icon: '💊', color: '#2196F3' },
        { category: 'hospital',      radius: 5000, weight: 15, label: 'Hospitais',    icon: '🏥', color: '#F44336' },
        { category: 'school',        radius: 2000, weight: 10, label: 'Escolas',      icon: '🏫', color: '#FF5722' },
        { category: 'bank',          radius: 1000, weight: 10, label: 'Bancos',       icon: '🏦', color: '#607D8B' },
        { category: 'shopping_mall', radius: 5000, weight: 10, label: 'Shopping',     icon: '🏬', color: '#9C27B0' },
        { category: 'park',          radius: 2000, weight: 10, label: 'Parques',      icon: '🌳', color: '#8BC34A' },
        { category: 'gas_station',   radius: 1500, weight: 10, label: 'Postos',       icon: '⛽', color: '#FF9800' },
    ],
};
