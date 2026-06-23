import {
  cartTotals,
  toCartLot,
  encodeCart,
  decodeCart,
  buildCartShareUrl,
  buildCartWhatsAppMessage,
  buildCartWhatsAppUrl,
  buildCartPlainText,
  type CartLot,
} from '@/lib/lotmap/cart';

const lot = (over: Partial<CartLot>): CartLot => ({
  id: 'A-1', developmentSlug: 'miguel-marques', developmentName: 'Loteamento Miguel Marques',
  block: 'A', lot: '1', areaM2: 200, price: 30000, status: 'disponivel', ...over,
});

describe('cartTotals', () => {
  it('soma área e preço e calcula médias', () => {
    const t = cartTotals([lot({ areaM2: 100, price: 20000 }), lot({ id: 'A-2', areaM2: 300, price: 60000 })]);
    expect(t.count).toBe(2);
    expect(t.totalArea).toBe(400);
    expect(t.totalPrice).toBe(80000);
    expect(t.avgPrice).toBe(40000);
    expect(t.avgPricePerM2).toBe(200);
  });

  it('carrinho vazio não divide por zero', () => {
    const t = cartTotals([]);
    expect(t).toEqual({ count: 0, totalArea: 0, totalPrice: 0, avgPrice: 0, avgPricePerM2: 0 });
  });

  it('ignora valores não-finitos', () => {
    const t = cartTotals([lot({ areaM2: NaN, price: 10000 }), lot({ id: 'A-2', areaM2: 150, price: Infinity })]);
    expect(t.totalArea).toBe(150);
    expect(t.totalPrice).toBe(10000);
  });
});

describe('toCartLot', () => {
  it('mapeia lote do Alto Bellevue (area_m2/lot_number/price)', () => {
    const c = toCartLot(
      { id: 'B-3', quadra: 'B', lot_number: '3', area_m2: 250, price: 45000, status: 'DISPONIVEL' },
      { slug: 'alto-bellevue', name: 'Alto Bellevue' },
    );
    expect(c).toMatchObject({ id: 'B-3', developmentSlug: 'alto-bellevue', block: 'B', lot: '3', areaM2: 250, price: 45000 });
  });

  it('mapeia lote do Miguel Marques (metragem/lote/valor)', () => {
    const c = toCartLot(
      { id: 'Z-9', quadra: 'Z', lote: 9, metragem: 312.5, valor: 61210, status: 'disponivel' },
      { slug: 'miguel-marques', name: 'Loteamento Miguel Marques' },
    );
    expect(c).toMatchObject({ id: 'Z-9', developmentSlug: 'miguel-marques', block: 'Z', lot: '9', areaM2: 312.5, price: 61210 });
  });

  it('mapeia lote dos JSONs de mapa (campo `area`)', () => {
    const c = toCartLot(
      { id: 'A-01', quadra: 'A', lote: '01', area: 356, price: 233529, status: 'negociacao' },
      { slug: 'alto-bellevue', name: 'Alto Bellevue' },
    );
    expect(c).toMatchObject({ id: 'A-01', block: 'A', lot: '01', areaM2: 356, price: 233529 });
  });

  it('campos ausentes viram defaults seguros', () => {
    const c = toCartLot({ id: 'X-1', quadra: 'X' }, { slug: 'miguel-marques' });
    expect(c.lot).toBe('');
    expect(c.areaM2).toBe(0);
    expect(c.price).toBe(0);
  });
});

describe('encode/decode (compartilhamento por URL)', () => {
  it('round-trip preserva empreendimento + ids', () => {
    const share = { d: 'miguel-marques', ids: ['A-1', 'Z-9', 'C-12'] };
    const token = encodeCart(share);
    expect(token).not.toContain('+');
    expect(token).not.toContain('/');
    expect(token).not.toContain('=');
    expect(decodeCart(token)).toEqual(share);
  });

  it('token inválido retorna null (nunca lança)', () => {
    expect(decodeCart('@@@nao-e-base64@@@')).toBeNull();
    expect(decodeCart('')).toBeNull();
  });

  it('buildCartShareUrl produz /carrinho?id=token', () => {
    const url = buildCartShareUrl('https://www.iulemirandaimoveis.com.br/', { d: 'alto-bellevue', ids: ['A-1'] });
    expect(url).toMatch(/^https:\/\/www\.iulemirandaimoveis\.com\.br\/carrinho\?id=/);
    const token = url.split('id=')[1];
    expect(decodeCart(token)).toEqual({ d: 'alto-bellevue', ids: ['A-1'] });
  });
});

describe('exportações', () => {
  const items = [lot({ id: 'A-1', block: 'A', lot: '1', areaM2: 200, price: 30000 }), lot({ id: 'A-2', block: 'A', lot: '2', areaM2: 150, price: 22000 })];

  it('mensagem de WhatsApp lista lotes e total', () => {
    const msg = buildCartWhatsAppMessage(items, { developmentName: 'Loteamento Miguel Marques', shareUrl: 'https://x/carrinho?id=abc' });
    expect(msg).toContain('Loteamento Miguel Marques');
    expect(msg).toContain('Quadra A, Lote 1');
    expect(msg).toContain('Quadra A, Lote 2');
    expect(msg).toContain('2 lotes');
    expect(msg).toContain('https://x/carrinho?id=abc');
  });

  it('url do WhatsApp codifica a mensagem', () => {
    const url = buildCartWhatsAppUrl('5581986141487', items);
    expect(url).toMatch(/^https:\/\/wa\.me\/5581986141487\?text=/);
    expect(decodeURIComponent(url.split('text=')[1])).toContain('Quadra A, Lote 1');
  });

  it('texto plano (base do PDF) tem cabeçalho e total', () => {
    const txt = buildCartPlainText(items, { developmentName: 'Alto Bellevue' });
    expect(txt).toContain('Alto Bellevue — Seleção de lotes');
    expect(txt).toContain('1. Quadra A · Lote 1');
    expect(txt).toContain('Total: 2 lote(s)');
  });

  it('singular quando há 1 lote', () => {
    expect(buildCartWhatsAppMessage([items[0]])).toContain('1 lote ·');
  });
});
