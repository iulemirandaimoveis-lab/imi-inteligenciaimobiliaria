import { parseAvailabilityCSV, normalizeAvailabilityStatus, resolveLotStatus } from '@/lib/lots/alto-bellevue-availability';

describe('alto-bellevue availability (Google Sheets)', () => {
  it('normaliza status PT da planilha', () => {
    expect(normalizeAvailabilityStatus('Disponível')).toBe('DISPONIVEL');
    expect(normalizeAvailabilityStatus('VENDA')).toBe('VENDIDO');
    expect(normalizeAvailabilityStatus('NEGOCIAÇÃO')).toBe('NEGOCIACAO');
    expect(normalizeAvailabilityStatus('lixo')).toBeNull();
  });

  it('parseia o layout de 3 quadras por bloco', () => {
    const csv = [
      ',,,,,,,,,,,',
      'QUADRA,LOTE,ÁREA (m2),Disponibilidade,QUADRA,LOTE,ÁREA (m2),Disponibilidade,QUADRA,LOTE,ÁREA (m2),Disponibilidade',
      'QUADRA A,,,,QUADRA B,,,,QUADRA C,,,',
      'QUADRA A,1,"355,99",NEGOCIAÇÃO,QUADRA B,1,"312,71",VENDA,QUADRA C,1,"401,58",Disponível',
      ',2,"355,99",VENDA,,2,"312,72",Disponível,,2,"336,82",Disponível',
    ].join('\n');
    const a = parseAvailabilityCSV(csv);
    expect(a['A-01']).toBe('NEGOCIACAO');
    expect(a['B-01']).toBe('VENDIDO');
    expect(a['C-01']).toBe('DISPONIVEL');
    expect(a['A-02']).toBe('VENDIDO');
    expect(a['C-02']).toBe('DISPONIVEL');
    // lote zero-padded
    expect(Object.keys(a)).toContain('A-02');
  });

  it('ignora linhas sem lote numérico', () => {
    const csv = 'QUADRA,LOTE,ÁREA (m2),Disponibilidade\nQUADRA A,,,\nQUADRA A,x,,Disponível';
    expect(Object.keys(parseAvailabilityCSV(csv)).length).toBe(0);
  });
});

// Fonte única de verdade compartilhada por Planta e Lista (auditoria C1/C2).
describe('resolveLotStatus — precedência única (planilha > canônico > banco)', () => {
  it('planilha viva tem prioridade máxima', () => {
    expect(resolveLotStatus('A-01', 'DISPONIVEL', { 'A-01': 'VENDIDO' }, { 'A-01': 'NEGOCIACAO' }))
      .toBe('NEGOCIACAO');
  });

  it('cai para o JSON canônico quando a planilha não cobre o lote', () => {
    expect(resolveLotStatus('A-01', 'DISPONIVEL', { 'A-01': 'VENDIDO' }, {}))
      .toBe('VENDIDO');
    expect(resolveLotStatus('A-01', 'DISPONIVEL', { 'A-01': 'VENDIDO' }, null))
      .toBe('VENDIDO');
  });

  it('cai para o status do banco quando não há planilha nem canônico', () => {
    expect(resolveLotStatus('A-01', 'DISPONIVEL', null, null)).toBe('DISPONIVEL');
    expect(resolveLotStatus('A-01', 'DISPONIVEL', {}, {})).toBe('DISPONIVEL');
  });

  it('A-01 produz o MESMO status independentemente da visão (paridade Planta=Lista)', () => {
    const canonical = { 'A-01': 'NEGOCIACAO' };
    const live = { 'A-01': 'NEGOCIACAO' };
    const planta = resolveLotStatus('A-01', 'DISPONIVEL', null, live);
    const lista = resolveLotStatus('A-01', 'DISPONIVEL', canonical, live);
    expect(planta).toBe(lista);
    expect(planta).toBe('NEGOCIACAO');
  });
});
