import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  parsePoints,
  polygonArea,
  isValidPolygon,
  normalizeMap,
  validateLots,
  AB_EXPECTED_TOTAL,
  type ABLot,
} from '@/lib/lots/alto-bellevue';

const canonical = JSON.parse(
  readFileSync(join(process.cwd(), 'public/maps/alto-bellevue-lots.json'), 'utf8'),
);

function lot(partial: Partial<ABLot>): ABLot {
  return {
    id: 'A-01', quadra: 'A', lot_number: '01',
    polygon: [[0, 0], [10, 0], [10, 10], [0, 10]],
    centroid: [5, 5], area_m2: 100, price: 1000, status: 'DISPONIVEL',
    has_polygon: true, pending: false, valor: 1000, valorVista: 800, entrada: 100, plans: {},
    ...partial,
  };
}

describe('geometria', () => {
  it('parsePoints converte string em pares numéricos', () => {
    expect(parsePoints('1,2 3,4 5,6')).toEqual([[1, 2], [3, 4], [5, 6]]);
  });

  it('parsePoints é tolerante a entradas vazias/ inválidas', () => {
    expect(parsePoints('')).toEqual([]);
    expect(parsePoints(null)).toEqual([]);
    expect(parsePoints('  1,2   3,4 ')).toEqual([[1, 2], [3, 4]]);
  });

  it('polygonArea calcula a área (shoelace)', () => {
    expect(polygonArea([[0, 0], [10, 0], [10, 10], [0, 10]])).toBe(100);
  });

  it('isValidPolygon rejeita polígonos degenerados', () => {
    expect(isValidPolygon([[0, 0], [10, 0], [10, 10], [0, 10]])).toBe(true);
    expect(isValidPolygon([[0, 0], [1, 1]])).toBe(false); // < 3 pontos
    expect(isValidPolygon([[0, 0], [0, 0], [0, 0]])).toBe(false); // área zero
  });
});

describe('validateLots', () => {
  it('aceita conjunto consistente de 383 lotes', () => {
    const lots = Array.from({ length: AB_EXPECTED_TOTAL }, (_, i) =>
      lot({ id: `L-${i}` }),
    );
    const r = validateLots(lots);
    expect(r.ok).toBe(true);
    expect(r.duplicates).toEqual([]);
    expect(r.invalidPolygons).toEqual([]);
  });

  it('detecta duplicados', () => {
    const lots = [lot({ id: 'A-01' }), lot({ id: 'A-01' })];
    expect(validateLots(lots).duplicates).toEqual(['A-01']);
  });

  it('detecta polígonos inválidos', () => {
    const lots = [lot({ id: 'X', polygon: [[0, 0], [1, 1]], has_polygon: false })];
    expect(validateLots(lots).invalidPolygons).toEqual(['X']);
  });
});

describe('fonte canônica public/maps/alto-bellevue-lots.json', () => {
  const data = normalizeMap(canonical);

  it('contém exatamente 383 lotes', () => {
    expect(data.lots.length).toBe(AB_EXPECTED_TOTAL);
  });

  it('não tem lotes duplicados nem faltantes', () => {
    const ids = new Set(data.lots.map((l) => l.id));
    expect(ids.size).toBe(AB_EXPECTED_TOTAL);
  });

  it('todos os lotes têm polígono válido', () => {
    const invalid = data.lots.filter((l) => !l.has_polygon);
    expect(invalid).toEqual([]);
  });

  it('todos os lotes têm status normalizado em caixa alta', () => {
    const bad = data.lots.filter((l) => l.status !== l.status.toUpperCase() || !l.status);
    expect(bad).toEqual([]);
  });

  it('carrega o contexto urbano (ruas, perímetro, labels, portaria)', () => {
    expect(data.streets.length).toBeGreaterThan(100);
    expect(data.perimeter.length).toBeGreaterThanOrEqual(1);
    expect(data.streetLabels.length).toBeGreaterThan(0);
    expect(data.amenities.length).toBeGreaterThan(0);
  });

  it('carrega as áreas verdes oficiais do CAD (não mais pendente)', () => {
    expect(data.pending.greenAreas).toBe(false);
    expect(data.greenAreas.length).toBeGreaterThanOrEqual(9);
    expect(
      data.greenAreas.every((g) => Number.isFinite(g.x) && Number.isFinite(g.y) && Boolean(g.label)),
    ).toBe(true);
  });

  it('B-24 está marcado como pendente (sem polígono oficial no CAD)', () => {
    const b24 = data.lots.find((l) => l.id === 'B-24');
    expect(b24?.pending).toBe(true);
  });

  it('validateLots da fonte canônica é ok', () => {
    expect(validateLots(data.lots).ok).toBe(true);
  });
});
