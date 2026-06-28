/**
 * SVG-space → WGS84 converter for Alto Bellevue.
 *
 * The canonical map JSON uses SVG pixel coordinates (viewBox 1200×821.86).
 * This module provides the affine transform to WGS84 and GeoJSON builders
 * for each layer, enabling MapLibre GL / WebGL rendering.
 *
 * Coordinate basis: approximate location — Alto Bellevue, BR-424, Garanhuns, PE.
 * Can be refined once GPS survey data is available without changing any lot geometry.
 */

import type { ABLot, Amenity, GreenArea, StreetLabel, Point } from './alto-bellevue';

// ── Geographic configuration ──────────────────────────────────────────────────
// Âncora geográfica CONFIRMADA: Plus Code 4FFQ+RJ → -8.875437, -36.510937
// (Magano, Garanhuns/PE). NÃO confundir com Gravatá. Ref.:
// .claude/ALTO_BELLEVUE_LOCATION.md e src/features/users/map/anchors.ts.
//
// A caixa abaixo é uma APROXIMAÇÃO norte-acima dimensionada para o terreno
// (~820 m L-O × ~561 m N-S, mantendo o aspecto do SVG 1200×821,86). O ajuste
// fino (rotação/escala reais) sai do solver de pontos de controle
// (scripts/cad/geo/) quando os GCPs do levantamento forem fornecidos.
export const AB_GEO_CONFIG = {
  west:  -36.514665, // SVG x = 0
  east:  -36.507209, // SVG x = 1200
  north:  -8.872900, // SVG y = 0      (topo do SVG = limite norte)
  south:  -8.877974, // SVG y = 821.86 (base do SVG = limite sul)
  centerLng: -36.510937,
  centerLat:  -8.875437,
  initialZoom: 16,
} as const;

const SVG_W = 1200;
const SVG_H = 821.86;

// ── Georreferenciamento fino (calibração) ───────────────────────────────────
// A caixa AB_GEO_CONFIG é norte-acima e aproximada — na prática o loteamento
// está ROTACIONADO e levemente deslocado em relação à imagem de satélite real.
// Em vez de chumbar números que só podem ser validados no olho, expomos uma
// transformação de SIMILARIDADE (rotação + escala + translação) aplicada por
// cima da caixa. O default é identidade → ZERO regressão visual. A equipe
// calibra ao vivo (overlay com ?calibrar=1) e o resultado é persistido em
// localStorage e pode ser chumbado aqui em `AB_CALIBRATION_DEFAULT`.
export interface AbCalibration {
  /** Rotação horária em graus, em torno do centro do loteamento. */
  rotationDeg: number;
  /** Escala uniforme (1 = tamanho atual). */
  scale: number;
  /** Deslocamento fino em graus (leste+/oeste-, norte+/sul-). */
  dLng: number;
  dLat: number;
}

export const AB_CALIBRATION_DEFAULT: AbCalibration = {
  rotationDeg: 0,
  scale: 1,
  dLng: 0,
  dLat: 0,
};

let _calibration: AbCalibration = { ...AB_CALIBRATION_DEFAULT };

/** Calibração atual (default + persistida/ao-vivo). */
export function getAbCalibration(): AbCalibration {
  return _calibration;
}

/** Define a calibração ao vivo (overlay). Os builders de GeoJSON passam a usá-la. */
export function setAbCalibration(cal: Partial<AbCalibration>): AbCalibration {
  _calibration = { ..._calibration, ...cal };
  return _calibration;
}

/** Hidrata a calibração a partir do localStorage (client-only, best-effort). */
export function hydrateAbCalibration(): AbCalibration {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(AB_CALIBRATION_KEY) : null;
    if (raw) {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object') _calibration = { ...AB_CALIBRATION_DEFAULT, ...obj };
    }
  } catch { /* storage indisponível — mantém default */ }
  return _calibration;
}

export const AB_CALIBRATION_KEY = 'imi:ab-geo-cal:v1';

// Cosseno da latitude central — converte graus de longitude em metros corretos
// para que a rotação não distorça o formato (lng "encolhe" longe do equador).
const COS_LAT = Math.cos((AB_GEO_CONFIG.centerLat * Math.PI) / 180);

/** Convert a single SVG coordinate pair to [lng, lat] (com calibração aplicada). */
export function svgToGeo(x: number, y: number): [number, number] {
  // 1) Caixa base (norte-acima, aproximada).
  let lng = AB_GEO_CONFIG.west + (x / SVG_W) * (AB_GEO_CONFIG.east - AB_GEO_CONFIG.west);
  let lat = AB_GEO_CONFIG.north + (y / SVG_H) * (AB_GEO_CONFIG.south - AB_GEO_CONFIG.north);

  const cal = _calibration;
  const isIdentity = cal.rotationDeg === 0 && cal.scale === 1 && cal.dLng === 0 && cal.dLat === 0;
  if (isIdentity) return [lng, lat];

  // 2) Rotação + escala em torno do centro, em espaço métrico-equivalente
  //    (corrige o aspecto via COS_LAT para não "esmagar" o desenho).
  const cx = AB_GEO_CONFIG.centerLng;
  const cy = AB_GEO_CONFIG.centerLat;
  let ex = (lng - cx) * COS_LAT; // east (graus equivalentes)
  let ny = lat - cy;             // north
  const rad = (-cal.rotationDeg * Math.PI) / 180; // horário (y cresce p/ sul)
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rx = (ex * cos - ny * sin) * cal.scale;
  const ry = (ex * sin + ny * cos) * cal.scale;
  lng = cx + rx / COS_LAT + cal.dLng;
  lat = cy + ry + cal.dLat;
  return [lng, lat];
}

/** Convert a Point[] (SVG space) to [[lng,lat], …] */
function pointsToGeo(points: Point[]): [number, number][] {
  return points
    .map(([x, y]) => svgToGeo(x, y))
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
}

// ── GeoJSON builders ──────────────────────────────────────────────────────────

export type GeoJSONFC = GeoJSON.FeatureCollection;

/** Status → display fill color (alpha via MapLibre paint property). */
export const STATUS_COLORS: Record<string, { fill: string; stroke: string; label: string }> = {
  DISPONIVEL:   { fill: '#22C55E', stroke: '#16A34A', label: 'Disponível' },
  NEGOCIACAO:   { fill: '#F59E0B', stroke: '#D97706', label: 'Negociação' },
  VENDIDO:      { fill: '#6B7280', stroke: '#4B5563', label: 'Vendido' },
  RESERVADO:    { fill: '#8B5CF6', stroke: '#7C3AED', label: 'Reservado' },
  PROPRIETARIO: { fill: '#3B82F6', stroke: '#2563EB', label: 'Proprietário' },
  IGREJA:       { fill: '#0D9488', stroke: '#0F766E', label: 'Igreja' },
};
export const STATUS_FALLBACK = { fill: '#94A3B8', stroke: '#64748B', label: 'Indisponível' };

/** Build GeoJSON FeatureCollection from ABLot array. */
export function lotsToGeoJSON(lots: ABLot[]): GeoJSONFC {
  const features: GeoJSON.Feature[] = [];

  for (const lot of lots) {
    if (lot.pending || !lot.has_polygon || !lot.polygon?.length) continue;

    const ring = lot.polygon.map(([x, y]) => svgToGeo(x, y));
    if (ring.length < 3) continue;

    // Close ring (GeoJSON requirement)
    const closed = [...ring, ring[0]];
    const [cLng, cLat] = svgToGeo(lot.centroid[0], lot.centroid[1]);
    const cfg = STATUS_COLORS[lot.status] ?? STATUS_FALLBACK;

    features.push({
      type: 'Feature',
      id: lot.id,
      geometry: { type: 'Polygon', coordinates: [closed] },
      properties: {
        id: lot.id,
        quadra: lot.quadra,
        lot_number: lot.lot_number,
        area_m2: lot.area_m2,
        price: lot.price,
        status: lot.status,
        fill_color: cfg.fill,
        stroke_color: cfg.stroke,
        status_label: cfg.label,
        center_lng: cLng,
        center_lat: cLat,
        // Payment info
        valor: lot.valor,
        valor_vista: lot.valorVista,
        entrada: lot.entrada,
        p12_parcela: lot.plans?.p12?.parcela ?? null,
        p36_parcela: lot.plans?.p36?.parcela ?? null,
        p60_parcela: lot.plans?.p60?.parcela ?? null,
        p120_parcela: lot.plans?.p120?.parcela ?? null,
      },
    });
  }

  return { type: 'FeatureCollection', features };
}

/** Build GeoJSON LineString FeatureCollection for streets. */
export function streetsToGeoJSON(streets: Point[][]): GeoJSONFC {
  const features: GeoJSON.Feature[] = [];
  for (let i = 0; i < streets.length; i++) {
    const coords = pointsToGeo(streets[i]);
    if (coords.length < 2) continue;
    features.push({
      type: 'Feature',
      id: i,
      geometry: { type: 'LineString', coordinates: coords },
      properties: {},
    });
  }
  return { type: 'FeatureCollection', features };
}

/** Build GeoJSON Polygon FeatureCollection for perimeter rings. */
export function perimeterToGeoJSON(perimeter: Point[][]): GeoJSONFC {
  const features: GeoJSON.Feature[] = [];
  for (let i = 0; i < perimeter.length; i++) {
    const ring = pointsToGeo(perimeter[i]);
    if (ring.length < 3) continue;
    features.push({
      type: 'Feature',
      id: i,
      geometry: { type: 'Polygon', coordinates: [[...ring, ring[0]]] },
      properties: {},
    });
  }
  return { type: 'FeatureCollection', features };
}

/** Build GeoJSON LineString for BR highway line. */
export function brLineToGeoJSON(brLine: Point[][]): GeoJSONFC {
  const features: GeoJSON.Feature[] = [];
  for (let i = 0; i < brLine.length; i++) {
    const coords = pointsToGeo(brLine[i]);
    if (coords.length < 2) continue;
    features.push({
      type: 'Feature',
      id: i,
      geometry: { type: 'LineString', coordinates: coords },
      properties: {},
    });
  }
  return { type: 'FeatureCollection', features };
}

/** Build GeoJSON Point FeatureCollection for amenity markers. */
export function amenitiesToGeoJSON(amenities: Amenity[]): GeoJSONFC {
  return {
    type: 'FeatureCollection',
    features: amenities.map((a) => ({
      type: 'Feature',
      id: a.id,
      geometry: { type: 'Point', coordinates: svgToGeo(a.x, a.y) },
      properties: {
        id: a.id,
        label: a.label,
        icon: a.icon,
        color: a.color,
      },
    })),
  };
}

/** Build GeoJSON Point FeatureCollection for green area markers. */
export function greenAreasToGeoJSON(greenAreas: GreenArea[]): GeoJSONFC {
  return {
    type: 'FeatureCollection',
    features: greenAreas.map((g) => ({
      type: 'Feature',
      id: g.id,
      geometry: { type: 'Point', coordinates: svgToGeo(g.x, g.y) },
      properties: { id: g.id, label: g.label },
    })),
  };
}

/** Build GeoJSON Point FeatureCollection for street label positions. */
export function streetLabelsToGeoJSON(labels: StreetLabel[]): GeoJSONFC {
  return {
    type: 'FeatureCollection',
    features: labels.map((s, i) => ({
      type: 'Feature',
      id: i,
      geometry: { type: 'Point', coordinates: svgToGeo(s.x, s.y) },
      properties: { name: s.name, rotation: -(s.rot ?? 0) },
    })),
  };
}

/** MapLibre expression: fill-color from status property. */
export function statusFillExpression(opacity = 0.72): unknown[] {
  return [
    'interpolate', ['linear'], ['zoom'],
    14, ['match', ['get', 'status'],
      'DISPONIVEL',   `rgba(34,197,94,${opacity})`,
      'NEGOCIACAO',   `rgba(245,158,11,${opacity})`,
      'VENDIDO',      `rgba(107,114,128,0.85)`,
      'RESERVADO',    `rgba(139,92,246,${opacity})`,
      'PROPRIETARIO', `rgba(59,130,246,${opacity})`,
      'IGREJA',       `rgba(13,148,136,${opacity})`,
      `rgba(148,163,184,0.50)`,
    ],
    18, ['match', ['get', 'status'],
      'DISPONIVEL',   `rgba(34,197,94,0.82)`,
      'NEGOCIACAO',   `rgba(245,158,11,0.82)`,
      'VENDIDO',      `rgba(107,114,128,0.92)`,
      'RESERVADO',    `rgba(139,92,246,0.82)`,
      'PROPRIETARIO', `rgba(59,130,246,0.82)`,
      'IGREJA',       `rgba(13,148,136,0.82)`,
      `rgba(148,163,184,0.60)`,
    ],
  ];
}

/** MapLibre expression: stroke-color from status property. */
export function statusStrokeExpression(): unknown[] {
  return ['match', ['get', 'status'],
    'DISPONIVEL',   '#16A34A',
    'NEGOCIACAO',   '#D97706',
    'VENDIDO',      '#4B5563',
    'RESERVADO',    '#7C3AED',
    'PROPRIETARIO', '#2563EB',
    'IGREJA',       '#0F766E',
    '#64748B',
  ];
}
