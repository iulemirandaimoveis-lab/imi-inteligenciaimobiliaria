/**
 * Tipos de georreferenciamento do Digital Twin (Sprint 2 — FASE 2/3).
 *
 * Namespace isolado. Define o contrato para transformar a geometria da fonte
 * (espaço de pixels do viewBox SVG) em coordenadas geográficas reais (WGS84),
 * emitindo GeoJSON padrão. Nenhuma coordenada real é embutida aqui — o engine é
 * alimentado por pontos de controle (GCPs) fornecidos depois (DWG/DXF/Google Earth).
 */

import type { DigitalTwinLotStatus } from '@/types/digital-twin';

/** Ponto de controle: associa um ponto em pixels da fonte a uma coordenada real. */
export interface ControlPoint {
  /** Posição no espaço da fonte (viewBox SVG). */
  pixel: { x: number; y: number };
  /** Coordenada geográfica em ordem GeoJSON: [longitude, latitude] (WGS84). */
  lngLat: [number, number];
  /** Rótulo opcional (ex.: "Portaria", "Marco NE"). */
  label?: string;
}

/**
 * Transformação afim 2D pixel → (lng, lat):
 *   lng = a·x + b·y + c
 *   lat = d·x + e·y + f
 */
export interface AffineTransform {
  a: number; b: number; c: number;
  d: number; e: number; f: number;
}

/** Qualidade do ajuste — para validar a "tolerância" exigida na FASE 3. */
export interface GeorefResiduals {
  /** Erro por ponto de controle, em metros. */
  perPoint: { label?: string; meters: number }[];
  /** Erro quadrático médio (RMS), em metros. */
  rmsMeters: number;
  /** Maior erro entre os pontos, em metros. */
  maxMeters: number;
}

// ── GeoJSON mínimo (sem dependências externas) ───────────────────────────────

export type GeoPosition = [number, number];

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: GeoPosition[][];
}

export interface DigitalTwinLotProperties {
  id: string;
  quadra: string;
  lotNumber: string;
  areaM2: number | null;
  price: number | null;
  status: DigitalTwinLotStatus;
}

export interface GeoFeature {
  type: 'Feature';
  geometry: GeoPolygon;
  properties: DigitalTwinLotProperties;
}

export interface GeoFeatureCollection {
  type: 'FeatureCollection';
  features: GeoFeature[];
}
