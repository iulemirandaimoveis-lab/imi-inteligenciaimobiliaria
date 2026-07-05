/**
 * Partner API v1 — módulo cartográfico do Alto Bellevue (GeoJSON WGS84).
 *
 * Reusa a fonte canônica do mapa (public/maps/alto-bellevue-lots.json, import
 * estático — sempre presente no bundle da função) e os builders GeoJSON já
 * usados pelo motor de mapas do site. Nenhuma geometria nova é inventada aqui.
 */

import abMapRaw from '../../../public/maps/alto-bellevue-lots.json'
import { normalizeMap, type ABMapData } from '@/lib/lots/alto-bellevue'
import {
    lotsToGeoJSON,
    streetsToGeoJSON,
    perimeterToGeoJSON,
    amenitiesToGeoJSON,
    greenAreasToGeoJSON,
    streetLabelsToGeoJSON,
    AB_GEO_CONFIG,
    type GeoJSONFC,
} from '@/lib/lots/alto-bellevue-geojson'

export interface PartnerMapPayload {
    development_slug: string
    crs: 'EPSG:4326'
    center: { lng: number; lat: number }
    bounds: { west: number; south: number; east: number; north: number }
    /** Aviso de precisão: georreferenciamento aproximado até o solver de GCPs rodar. */
    georeference: 'approximate'
    layers: {
        lots: GeoJSONFC
        streets: GeoJSONFC
        perimeter: GeoJSONFC
        green_areas: GeoJSONFC
        amenities: GeoJSONFC
        street_labels: GeoJSONFC
    }
}

let cached: PartnerMapPayload | null = null

export function buildAltoBellevueMap(): PartnerMapPayload {
    if (cached) return cached
    const map: ABMapData = normalizeMap(abMapRaw as Parameters<typeof normalizeMap>[0])
    cached = {
        development_slug: 'alto-bellevue',
        crs: 'EPSG:4326',
        center: { lng: AB_GEO_CONFIG.centerLng, lat: AB_GEO_CONFIG.centerLat },
        bounds: {
            west: AB_GEO_CONFIG.west,
            south: AB_GEO_CONFIG.south,
            east: AB_GEO_CONFIG.east,
            north: AB_GEO_CONFIG.north,
        },
        georeference: 'approximate',
        layers: {
            lots: lotsToGeoJSON(map.lots),
            streets: streetsToGeoJSON(map.streets),
            perimeter: perimeterToGeoJSON(map.perimeter),
            green_areas: greenAreasToGeoJSON(map.greenAreas),
            amenities: amenitiesToGeoJSON(map.amenities),
            street_labels: streetLabelsToGeoJSON(map.streetLabels),
        },
    }
    return cached
}
