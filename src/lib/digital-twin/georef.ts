/**
 * Engine de georreferenciamento do Digital Twin (Sprint 2 — FASE 2/3).
 *
 * Funções PURAS (testáveis em Jest/node), sem coordenadas reais embutidas:
 *  - `solveAffine`     — ajusta (mínimos quadrados) uma transformação afim 2D
 *                        pixel→(lng,lat) a partir de ≥3 pontos de controle (GCPs).
 *  - `applyAffine`     — aplica a transformação a um ponto.
 *  - `georeferencePolygon` — transforma um polígono inteiro.
 *  - `georefResiduals` — mede o erro de ajuste em metros (valida a tolerância da FASE 3).
 *  - `toGeoJSON`       — emite uma FeatureCollection a partir do modelo + transformação.
 *
 * O engine é alimentado por GCPs fornecidos depois (DWG/DXF/PDF/Google Earth). Sem GCPs,
 * nada é georreferenciado — não há "geometria aproximada" inventada.
 */

import type { DigitalTwinModel, DigitalTwinPoint } from '@/types/digital-twin';
import type {
  AffineTransform,
  ControlPoint,
  GeorefResiduals,
  GeoFeature,
  GeoFeatureCollection,
  GeoPosition,
} from '@/types/digital-twin/geo';

// ── Álgebra linear mínima (3x3) ──────────────────────────────────────────────

/** Resolve A·x = b para A 3x3 por eliminação de Gauss com pivoteamento parcial. */
function solve3x3(A: number[][], b: number[]): number[] {
  // Matriz aumentada [A | b]
  const m = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < 3; col++) {
    // Pivô parcial
    let pivot = col;
    for (let r = col + 1; r < 3; r++) {
      if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    }
    if (Math.abs(m[pivot][col]) < 1e-12) {
      throw new Error('Pontos de controle colineares/degenerados — afim indeterminada.');
    }
    [m[col], m[pivot]] = [m[pivot], m[col]];
    // Eliminação
    for (let r = 0; r < 3; r++) {
      if (r === col) continue;
      const factor = m[r][col] / m[col][col];
      for (let k = col; k < 4; k++) m[r][k] -= factor * m[col][k];
    }
  }
  return [m[0][3] / m[0][0], m[1][3] / m[1][1], m[2][3] / m[2][2]];
}

/** Mínimos quadrados de [x,y,1]·p = valor → resolve as normais (AᵀA)p = Aᵀv. */
function leastSquaresPlane(points: ControlPoint[], value: (p: ControlPoint) => number): [number, number, number] {
  const ATA = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const ATv = [0, 0, 0];
  for (const p of points) {
    const row = [p.pixel.x, p.pixel.y, 1];
    const v = value(p);
    for (let i = 0; i < 3; i++) {
      ATv[i] += row[i] * v;
      for (let j = 0; j < 3; j++) ATA[i][j] += row[i] * row[j];
    }
  }
  const [a, b, c] = solve3x3(ATA, ATv);
  return [a, b, c];
}

// ── API pública ──────────────────────────────────────────────────────────────

/**
 * Ajusta a transformação afim pixel→(lng,lat) a partir dos pontos de controle.
 * Requer ≥3 GCPs não colineares. Com exatamente 3 o ajuste é exato; com mais,
 * é o melhor ajuste por mínimos quadrados (recomendado para reduzir erro).
 */
export function solveAffine(controlPoints: ControlPoint[]): AffineTransform {
  if (controlPoints.length < 3) {
    throw new Error(`Georreferenciamento requer ≥3 pontos de controle (recebidos: ${controlPoints.length}).`);
  }
  const [a, b, c] = leastSquaresPlane(controlPoints, (p) => p.lngLat[0]); // lng
  const [d, e, f] = leastSquaresPlane(controlPoints, (p) => p.lngLat[1]); // lat
  return { a, b, c, d, e, f };
}

/** Aplica a transformação afim a um ponto da fonte → [lng, lat]. */
export function applyAffine(t: AffineTransform, point: DigitalTwinPoint): GeoPosition {
  return [
    t.a * point.x + t.b * point.y + t.c,
    t.d * point.x + t.e * point.y + t.f,
  ];
}

/** Distância aproximada (metros) entre duas coordenadas [lng,lat] — equiretangular. */
export function haversineMeters(a: GeoPosition, b: GeoPosition): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const x = toRad(lng2 - lng1) * Math.cos(toRad((lat1 + lat2) / 2));
  const y = toRad(lat2 - lat1);
  return Math.sqrt(x * x + y * y) * R;
}

/** Mede o erro de ajuste (em metros) nos próprios pontos de controle. */
export function georefResiduals(t: AffineTransform, controlPoints: ControlPoint[]): GeorefResiduals {
  const perPoint = controlPoints.map((p) => ({
    label: p.label,
    meters: haversineMeters(applyAffine(t, p.pixel), p.lngLat),
  }));
  const sumSq = perPoint.reduce((s, p) => s + p.meters * p.meters, 0);
  const rmsMeters = perPoint.length ? Math.sqrt(sumSq / perPoint.length) : 0;
  const maxMeters = perPoint.reduce((mx, p) => Math.max(mx, p.meters), 0);
  return { perPoint, rmsMeters, maxMeters };
}

/** Transforma um polígono (pixels) em anel GeoJSON fechado ([lng,lat], primeiro==último). */
export function georeferencePolygon(t: AffineTransform, polygon: DigitalTwinPoint[]): GeoPosition[] {
  const ring = polygon.map((pt) => applyAffine(t, pt));
  if (ring.length > 0) {
    const [fx, fy] = ring[0];
    const [lx, ly] = ring[ring.length - 1];
    if (fx !== lx || fy !== ly) ring.push([fx, fy]); // fecha o anel (requisito GeoJSON)
  }
  return ring;
}

/**
 * Emite uma FeatureCollection GeoJSON a partir do modelo do Digital Twin + transformação.
 * Lotes sem polígono (≥3 vértices) são omitidos — não inventamos geometria.
 */
export function toGeoJSON(model: DigitalTwinModel, t: AffineTransform): GeoFeatureCollection {
  const features: GeoFeature[] = [];
  for (const lot of model.lots) {
    if (lot.polygon.length < 3) continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [georeferencePolygon(t, lot.polygon)] },
      properties: {
        id: lot.id,
        quadra: lot.quadra,
        lotNumber: lot.lotNumber,
        areaM2: lot.areaM2,
        price: lot.price,
        status: lot.status,
      },
    });
  }
  return { type: 'FeatureCollection', features };
}
