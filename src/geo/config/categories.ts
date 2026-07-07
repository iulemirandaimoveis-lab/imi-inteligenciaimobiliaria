/**
 * IMI Geo Intelligence Engine — Category Catalog
 * ------------------------------------------------------------------
 * The single, parameterized source of truth for the map's intelligence
 * layers. Providers translate their native taxonomies onto these keys;
 * the UI reads label/icon/color from here. Nothing is development-specific.
 *
 * To add a new layer (e.g. "veterinário"), add one entry here — providers,
 * scoring and the UI pick it up automatically.
 */

import type { GeoCategoryConfig, GeoCategoryKey } from '../types'

export const GEO_CATEGORIES: Record<GeoCategoryKey, GeoCategoryConfig> = {
  school: {
    key: 'school',
    label: 'Escolas',
    icon: '🏫',
    color: '#FF5722',
    radius: 2000,
    weight: 0.1,
    osmTags: ['"amenity"="school"', '"amenity"="kindergarten"'],
    googleTypes: ['school', 'primary_school', 'secondary_school'],
  },
  university: {
    key: 'university',
    label: 'Universidades',
    icon: '🎓',
    color: '#3F51B5',
    radius: 5000,
    weight: 0.05,
    osmTags: ['"amenity"="university"', '"amenity"="college"'],
    googleTypes: ['university'],
  },
  hospital: {
    key: 'hospital',
    label: 'Hospitais',
    icon: '🏥',
    color: '#F44336',
    radius: 5000,
    weight: 0.12,
    osmTags: ['"amenity"="hospital"', '"amenity"="clinic"'],
    googleTypes: ['hospital', 'doctor'],
  },
  pharmacy: {
    key: 'pharmacy',
    label: 'Farmácias',
    icon: '💊',
    color: '#2196F3',
    radius: 1500,
    weight: 0.08,
    osmTags: ['"amenity"="pharmacy"'],
    googleTypes: ['pharmacy', 'drugstore'],
  },
  supermarket: {
    key: 'supermarket',
    label: 'Supermercados',
    icon: '🛒',
    color: '#4CAF50',
    radius: 1500,
    weight: 0.12,
    osmTags: ['"shop"="supermarket"', '"shop"="convenience"'],
    googleTypes: ['supermarket', 'grocery_or_supermarket'],
  },
  gym: {
    key: 'gym',
    label: 'Academias',
    icon: '🏋️',
    color: '#795548',
    radius: 2000,
    weight: 0.05,
    osmTags: ['"leisure"="fitness_centre"', '"leisure"="sports_centre"'],
    googleTypes: ['gym'],
  },
  restaurant: {
    key: 'restaurant',
    label: 'Restaurantes',
    icon: '🍽️',
    color: '#E85D4A',
    radius: 1500,
    weight: 0.06,
    osmTags: ['"amenity"="restaurant"', '"amenity"="cafe"', '"amenity"="fast_food"'],
    googleTypes: ['restaurant', 'cafe'],
  },
  bakery: {
    key: 'bakery',
    label: 'Padarias',
    icon: '🥖',
    color: '#D4A24A',
    radius: 1200,
    weight: 0.04,
    osmTags: ['"shop"="bakery"'],
    googleTypes: ['bakery'],
  },
  gas_station: {
    key: 'gas_station',
    label: 'Postos',
    icon: '⛽',
    color: '#FF9800',
    radius: 2000,
    weight: 0.04,
    osmTags: ['"amenity"="fuel"'],
    googleTypes: ['gas_station'],
  },
  shopping_mall: {
    key: 'shopping_mall',
    label: 'Shopping',
    icon: '🏬',
    color: '#9C27B0',
    radius: 5000,
    weight: 0.06,
    osmTags: ['"shop"="mall"'],
    googleTypes: ['shopping_mall'],
  },
  bank: {
    key: 'bank',
    label: 'Bancos',
    icon: '🏦',
    color: '#607D8B',
    radius: 1500,
    weight: 0.05,
    osmTags: ['"amenity"="bank"', '"amenity"="atm"'],
    googleTypes: ['bank', 'atm'],
  },
  transit: {
    key: 'transit',
    label: 'Transporte',
    icon: '🚌',
    color: '#009688',
    radius: 1500,
    weight: 0.08,
    osmTags: ['"amenity"="bus_station"', '"highway"="bus_stop"', '"railway"="station"'],
    googleTypes: ['bus_station', 'transit_station', 'subway_station', 'train_station'],
  },
  park: {
    key: 'park',
    label: 'Áreas Verdes',
    icon: '🌳',
    color: '#8BC34A',
    radius: 2000,
    weight: 0.05,
    osmTags: ['"leisure"="park"', '"landuse"="recreation_ground"'],
    googleTypes: ['park'],
  },
  leisure: {
    key: 'leisure',
    label: 'Lazer',
    icon: '🎡',
    color: '#00BCD4',
    radius: 3000,
    weight: 0.04,
    osmTags: ['"leisure"="playground"', '"amenity"="cinema"', '"leisure"="sports_centre"'],
    googleTypes: ['amusement_park', 'movie_theater', 'stadium'],
  },
  beach: {
    key: 'beach',
    label: 'Praia',
    icon: '🏖️',
    color: '#00ACC1',
    radius: 5000,
    weight: 0.03,
    osmTags: ['"natural"="beach"'],
    googleTypes: ['natural_feature'],
  },
  notary: {
    key: 'notary',
    label: 'Cartórios',
    icon: '📜',
    color: '#8D6E63',
    radius: 3000,
    weight: 0.02,
    osmTags: ['"office"="notary"', '"office"="government"'],
    googleTypes: ['local_government_office'],
  },
  hotel: {
    key: 'hotel',
    label: 'Hotéis',
    icon: '🏨',
    color: '#5C6BC0',
    radius: 3000,
    weight: 0.02,
    osmTags: ['"tourism"="hotel"', '"tourism"="guest_house"'],
    googleTypes: ['lodging'],
  },
  real_estate: {
    key: 'real_estate',
    label: 'Imobiliárias',
    icon: '🏘️',
    color: '#455A64',
    radius: 3000,
    weight: 0.01,
    osmTags: ['"office"="estate_agent"', '"shop"="estate_agent"'],
    googleTypes: ['real_estate_agency'],
  },
  construction: {
    key: 'construction',
    label: 'Construtoras',
    icon: '🏗️',
    color: '#F9A825',
    radius: 5000,
    weight: 0.01,
    osmTags: ['"office"="company"', '"shop"="doityourself"'],
    googleTypes: ['hardware_store'],
  },
  company: {
    key: 'company',
    label: 'Empresas',
    icon: '🏢',
    color: '#78909C',
    radius: 3000,
    weight: 0.01,
    osmTags: ['"office"="company"'],
    googleTypes: ['point_of_interest'],
  },
}

export const ALL_CATEGORY_KEYS = Object.keys(GEO_CATEGORIES) as GeoCategoryKey[]

/**
 * Curated category sets by use-case. Consumers pass a profile name and the
 * engine resolves it to a list of category configs. Weights are normalized
 * at scoring time, so a subset still yields a coherent 0–100 score.
 */
export const GEO_PROFILES: Record<string, GeoCategoryKey[]> = {
  residencial: [
    'supermarket',
    'pharmacy',
    'hospital',
    'school',
    'bank',
    'shopping_mall',
    'park',
    'gas_station',
    'transit',
    'gym',
    'bakery',
  ],
  short_stay: [
    'restaurant',
    'supermarket',
    'pharmacy',
    'hospital',
    'beach',
    'shopping_mall',
    'gas_station',
    'park',
    'transit',
  ],
  comercial: [
    'bank',
    'transit',
    'restaurant',
    'gas_station',
    'shopping_mall',
    'notary',
    'company',
    'hotel',
  ],
  full: ALL_CATEGORY_KEYS,
}

export function resolveCategories(
  input?: GeoCategoryKey[] | keyof typeof GEO_PROFILES,
): GeoCategoryConfig[] {
  let keys: GeoCategoryKey[]
  if (!input) {
    keys = GEO_PROFILES.residencial
  } else if (typeof input === 'string') {
    keys = GEO_PROFILES[input] ?? GEO_PROFILES.residencial
  } else {
    keys = input
  }
  return keys.map((k) => GEO_CATEGORIES[k]).filter(Boolean)
}
