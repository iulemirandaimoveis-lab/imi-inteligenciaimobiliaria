/**
 * Âncoras geográficas (centro) por empreendimento, para a vista de satélite do
 * console. Coordenadas confirmadas pelo cliente (Plus Code / Google Maps).
 *
 * NÃO confundir com o georreferenciamento dos LOTES (overlay sobre satélite),
 * que exige ≥3 pontos de controle e é resolvido por scripts/cad/geo/. Aqui é só
 * o ponto-âncora para CENTRAR o mapa aéreo — não posiciona polígonos.
 */
export interface GeoAnchor {
  lng: number
  lat: number
  zoom?: number
}

export const GEO_ANCHORS: Record<string, GeoAnchor> = {
  // Alto Bellevue — Magano, Garanhuns/PE. Plus Code 4FFQ+RJ → 69354FFQ+RJ.
  'alto-bellevue': { lng: -36.510937, lat: -8.875437, zoom: 16.5 },
}

export function getGeoAnchor(slug: string): GeoAnchor | null {
  return GEO_ANCHORS[slug] ?? null
}
