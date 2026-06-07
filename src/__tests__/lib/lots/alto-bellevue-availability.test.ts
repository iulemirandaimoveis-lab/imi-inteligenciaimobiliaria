import { parseAvailabilityCSV, normalizeAvailabilityStatus } from '@/lib/lots/alto-bellevue-availability';

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
