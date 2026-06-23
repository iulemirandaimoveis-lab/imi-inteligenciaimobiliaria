import {
  MAX_COMPARE,
  canAddToCompare,
  compareRejectMessage,
  pricePerM2,
  compareHighlights,
  buildComparison,
  type CompareLot,
} from '@/lib/lotmap/compare';

const lot = (over: Partial<CompareLot>): CompareLot => ({
  id: 'A-1', block: 'A', lot: '1', areaM2: 200, price: 40000, status: 'disponivel', ...over,
});

describe('canAddToCompare', () => {
  it('permite adicionar quando há espaço', () => {
    expect(canAddToCompare([], lot({}))).toEqual({ ok: true });
    expect(canAddToCompare([lot({ id: 'A-1' })], lot({ id: 'A-2' }))).toEqual({ ok: true });
  });

  it('rejeita duplicado', () => {
    expect(canAddToCompare([lot({ id: 'A-1' })], lot({ id: 'A-1' }))).toEqual({ ok: false, reason: 'duplicate' });
  });

  it(`rejeita o ${MAX_COMPARE + 1}º lote (limite)`, () => {
    const three = [lot({ id: 'A-1' }), lot({ id: 'A-2' }), lot({ id: 'A-3' })];
    expect(three).toHaveLength(MAX_COMPARE);
    expect(canAddToCompare(three, lot({ id: 'A-4' }))).toEqual({ ok: false, reason: 'limit' });
  });
});

describe('compareRejectMessage', () => {
  it('mensagem de limite cita o máximo', () => {
    expect(compareRejectMessage('limit')).toContain(String(MAX_COMPARE));
  });
  it('mensagem de duplicado', () => {
    expect(compareRejectMessage('duplicate')).toMatch(/já está/i);
  });
});

describe('pricePerM2', () => {
  it('calcula R$/m²', () => {
    expect(pricePerM2({ price: 40000, areaM2: 200 })).toBe(200);
  });
  it('área zero → 0 (sem divisão por zero)', () => {
    expect(pricePerM2({ price: 40000, areaM2: 0 })).toBe(0);
  });
});

describe('compareHighlights', () => {
  it('detecta esquina e beira-lago', () => {
    expect(compareHighlights(lot({ isCorner: true, isLakefront: true }))).toEqual(['Esquina', 'Beira-lago']);
    expect(compareHighlights(lot({}))).toEqual([]);
  });
});

describe('buildComparison', () => {
  const lots = [
    lot({ id: 'A-1', block: 'A', lot: '1', areaM2: 200, price: 40000, status: 'disponivel', isCorner: true }),
    lot({ id: 'Z-9', block: 'Z', lot: '9', areaM2: 100, price: 0, status: 'vendido', isLakefront: true }),
  ];
  const rows = buildComparison(lots);

  it('gera as 7 linhas esperadas', () => {
    expect(rows.map((r) => r.key)).toEqual(['quadra', 'lote', 'area', 'preco', 'm2', 'status', 'destaques']);
  });

  it('cada linha tem um valor por lote', () => {
    for (const r of rows) expect(r.values).toHaveLength(2);
  });

  it('formata situação, R$/m² e "Sob consulta" p/ preço 0', () => {
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r.values]));
    expect(byKey.status).toEqual(['Disponível', 'Vendido']);
    expect(byKey.preco[1]).toBe('Sob consulta');
    expect(byKey.m2[1]).toBe('—'); // preço 0 → sem R$/m²
    expect(byKey.destaques).toEqual(['Esquina', 'Beira-lago']);
  });
});
