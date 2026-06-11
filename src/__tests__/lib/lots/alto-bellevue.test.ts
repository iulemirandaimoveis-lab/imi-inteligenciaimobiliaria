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

  it('não contém o lote fantasma B-24 (Quadra B oficial tem 19 lotes)', () => {
    expect(data.lots.find((l) => l.id === 'B-24')).toBeUndefined();
  });

  it('contagem por quadra bate com a tabela de preços oficial (01/04/2026)', () => {
    const OFFICIAL: Record<string, number> = {
      A: 25, B: 19, C: 13, D: 25, E: 38, F: 27, G: 21, H: 45,
      I: 16, J: 24, K: 32, L: 24, M: 27, N: 31, O: 3, P: 13,
    };
    const byQuadra: Record<string, number> = {};
    for (const l of data.lots) byQuadra[l.quadra] = (byQuadra[l.quadra] ?? 0) + 1;
    expect(byQuadra).toEqual(OFFICIAL);
  });

  it('D-15 existe com polígono válido e dados oficiais (628,73 m² · R$ 432.566,24)', () => {
    const d15 = data.lots.find((l) => l.id === 'D-15');
    expect(d15).toBeDefined();
    expect(d15?.has_polygon).toBe(true);
    expect(d15?.pending).toBe(false);
    expect(d15?.price).toBe(432566.24);
  });

  it('nenhum lote está pendente (todos têm polígono oficial)', () => {
    expect(data.lots.filter((l) => l.pending)).toEqual([]);
  });

  it('N-09 é o lote ANTENA (900,80 m², sem preço — tabela oficial)', () => {
    const n09 = data.lots.find((l) => l.id === 'N-09');
    expect(n09?.price).toBeNull();
    expect(n09?.has_polygon).toBe(true);
  });

  it('planos de pagamento seguem as condições oficiais (descontos 20/15/8/5/0%)', () => {
    const a01 = data.lots.find((l) => l.id === 'A-01');
    expect(a01?.valor).toBe(233529.44);
    expect(a01?.valorVista).toBe(186823.55); // à vista −20%
    // 12 meses −15%: total, entrada (10% do total) e parcela — tabela impressa
    expect(a01?.plans.p12).toEqual({ total: 198500.02, entrada: 19850.0, parcela: 14887.5 });
    expect(a01?.plans.p36).toEqual({ total: 214847.08, entrada: 21484.71, parcela: 5371.18 });
    expect(a01?.plans.p60).toEqual({ total: 221852.97, entrada: 22185.3, parcela: 3327.79 });
    expect(a01?.plans.p120).toEqual({ total: 233529.44, entrada: 23352.94, parcela: 1751.47 });
  });

  it('validateLots da fonte canônica é ok', () => {
    expect(validateLots(data.lots).ok).toBe(true);
  });
});
