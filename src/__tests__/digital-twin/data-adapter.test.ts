import { readFileSync } from 'fs';
import { join } from 'path';
import {
  adaptCanonicalToDigitalTwin,
  normalizeDigitalTwinStatus,
  parsePoints,
} from '@/lib/digital-twin/data-adapter';
import type { DigitalTwinLotStatus } from '@/types/digital-twin';

describe('digital-twin data adapter (somente leitura)', () => {
  it('normaliza status minúsculos da fonte canônica', () => {
    expect(normalizeDigitalTwinStatus('disponivel')).toBe('DISPONIVEL');
    expect(normalizeDigitalTwinStatus('negociacao')).toBe('NEGOCIACAO');
    expect(normalizeDigitalTwinStatus('vendido')).toBe('VENDIDO');
    expect(normalizeDigitalTwinStatus('reservado')).toBe('RESERVADO');
    expect(normalizeDigitalTwinStatus(undefined)).toBe('DISPONIVEL');
    expect(normalizeDigitalTwinStatus('lixo')).toBe('DISPONIVEL');
  });

  it('converte string de pontos em polígono', () => {
    const pts = parsePoints('1029.55,187.93 1018.06,191.66');
    expect(pts).toEqual([
      { x: 1029.55, y: 187.93 },
      { x: 1018.06, y: 191.66 },
    ]);
    expect(parsePoints(undefined)).toEqual([]);
  });

  it('adapta um mapa sintético para o modelo do Digital Twin', () => {
    const model = adaptCanonicalToDigitalTwin({
      viewBox: '0 0 1200.0 821.86',
      lots: [
        { id: 'A-01', quadra: 'A', lote: '01', points: '0,0 10,0 10,10', area: 356, status: 'negociacao', price: 233529.44, labelX: 5, labelY: 5 },
        { id: 'A-02', quadra: 'A', lote: '02', points: '0,0 1,1', area: 312, status: 'disponivel', price: null },
        { id: 'B-01', quadra: 'B', lote: '01', points: '0,0', area: 401, status: 'vendido', price: 280000 },
      ],
    });

    expect(model.viewBox).toEqual({ w: 1200, h: 821.86 });
    expect(model.lots).toHaveLength(3);
    expect(model.lots[0].centroid).toEqual({ x: 5, y: 5 });
    expect(model.lots[0].status).toBe('NEGOCIACAO');
    expect(model.lots[1].price).toBeNull();
    expect(model.stats).toEqual({
      total: 3,
      disponiveis: 1,
      negociacao: 1,
      vendidos: 1,
      reservados: 0,
      proprietario: 0,
    });
  });

  it('mapa canônico real: 383 lotes e todos com status válido (sem regressão de dados)', () => {
    const raw = JSON.parse(
      readFileSync(join(process.cwd(), 'public/maps/alto-bellevue-lots.json'), 'utf8'),
    );
    const model = adaptCanonicalToDigitalTwin(raw);
    const valid: DigitalTwinLotStatus[] = ['DISPONIVEL', 'NEGOCIACAO', 'VENDIDO', 'RESERVADO', 'PROPRIETARIO'];

    expect(model.lots).toHaveLength(383);
    expect(model.stats.total).toBe(383);
    expect(model.lots.every((l) => valid.includes(l.status))).toBe(true);
    expect(model.lots.every((l) => l.polygon.length > 0)).toBe(true);
  });
});
