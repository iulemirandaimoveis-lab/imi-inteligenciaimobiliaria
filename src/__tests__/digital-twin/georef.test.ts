import {
  solveAffine,
  applyAffine,
  georefResiduals,
  georeferencePolygon,
  toGeoJSON,
} from '@/lib/digital-twin/georef';
import type { ControlPoint } from '@/types/digital-twin/geo';
import type { DigitalTwinModel } from '@/types/digital-twin';

// Transformação afim sintética "tipo Garanhuns" (y do SVG cresce p/ baixo → lat invertida).
const TRUE = { a: 9e-6, b: 1e-7, c: -36.5, d: -1e-7, e: -9e-6, f: -8.9 };
const px = (x: number, y: number): [number, number] => [
  TRUE.a * x + TRUE.b * y + TRUE.c,
  TRUE.d * x + TRUE.e * y + TRUE.f,
];

function gcp(x: number, y: number, label?: string): ControlPoint {
  return { pixel: { x, y }, lngLat: px(x, y), label };
}

describe('digital-twin georef engine (Sprint 2)', () => {
  it('recupera uma transformação afim conhecida a partir de 4 GCPs', () => {
    const points = [gcp(0, 0, 'NW'), gcp(1200, 0, 'NE'), gcp(0, 820, 'SW'), gcp(600, 400, 'C')];
    const t = solveAffine(points);
    for (const p of points) {
      const [lng, lat] = applyAffine(t, p.pixel);
      expect(lng).toBeCloseTo(p.lngLat[0], 7);
      expect(lat).toBeCloseTo(p.lngLat[1], 7);
    }
  });

  it('mede resíduos (metros) e reporta RMS/máx praticamente zero para dados consistentes', () => {
    const points = [gcp(0, 0), gcp(1200, 0), gcp(0, 820), gcp(600, 400), gcp(300, 700)];
    const t = solveAffine(points);
    const res = georefResiduals(t, points);
    expect(res.perPoint).toHaveLength(5);
    expect(res.rmsMeters).toBeLessThan(0.05); // < 5 cm
    expect(res.maxMeters).toBeLessThan(0.05);
  });

  it('exige ≥3 pontos de controle', () => {
    expect(() => solveAffine([gcp(0, 0), gcp(10, 10)])).toThrow(/≥3 pontos/);
  });

  it('rejeita pontos de controle colineares (afim indeterminada)', () => {
    const collinear = [gcp(0, 0), gcp(1, 0), gcp(2, 0)]; // todos na mesma linha
    expect(() => solveAffine(collinear)).toThrow(/colineares|degenerados|indeterminada/);
  });

  it('georreferencia um polígono e fecha o anel (requisito GeoJSON)', () => {
    const t = solveAffine([gcp(0, 0), gcp(1200, 0), gcp(0, 820)]);
    const ring = georeferencePolygon(t, [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ]);
    expect(ring).toHaveLength(4); // 3 vértices + fechamento
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it('emite FeatureCollection GeoJSON, omitindo lotes sem polígono válido', () => {
    const identity = { a: 1, b: 0, c: 0, d: 0, e: 1, f: 0 };
    const model: DigitalTwinModel = {
      viewBox: { w: 1200, h: 820 },
      lots: [
        { id: 'A-01', quadra: 'A', lotNumber: '01', areaM2: 300, price: 200000, status: 'DISPONIVEL', polygon: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }], centroid: { x: 6, y: 3 } },
        { id: 'B-99', quadra: 'B', lotNumber: '99', areaM2: null, price: null, status: 'VENDIDO', polygon: [{ x: 0, y: 0 }, { x: 1, y: 1 }], centroid: { x: 0, y: 0 } }, // <3 → omitido
      ],
      stats: { total: 2, disponiveis: 1, negociacao: 0, vendidos: 1, reservados: 0, proprietario: 0 },
    };

    const fc = toGeoJSON(model, identity);
    expect(fc.type).toBe('FeatureCollection');
    expect(fc.features).toHaveLength(1); // o lote sem polígono é omitido
    const feat = fc.features[0];
    expect(feat.geometry.type).toBe('Polygon');
    expect(feat.geometry.coordinates[0][0]).toEqual(feat.geometry.coordinates[0].at(-1)); // anel fechado
    expect(feat.properties).toMatchObject({ id: 'A-01', quadra: 'A', status: 'DISPONIVEL' });
  });
});
