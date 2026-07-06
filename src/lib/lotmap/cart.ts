/**
 * Lot cart — núcleo compartilhado (puro, sem React) do carrinho de lotes.
 *
 * Usado pelos dois empreendimentos (Alto Bellevue + Miguel Marques) via o hook
 * `useLotCart`. Mantém UMA implementação — nunca duplicar lógica de carrinho por
 * empreendimento. Sem limite de itens (requisito do briefing).
 *
 * Tudo aqui é testável em Node (Jest) — ver src/__tests__/lib/lotmap/cart.test.ts.
 */

// ── Modelo neutro ────────────────────────────────────────────────────────────

/** Forma de pagamento escolhida pelo cliente no card do lote — segue com o
 *  lote para o carrinho e pré-preenche a proposta (evita reperguntar). */
export interface SelectedPaymentPlan {
  key: 'vista' | 'p12' | 'p36' | 'p60' | 'p120';
  label: string;      // "À Vista", "12×", ...
  total: number;
  parcela?: number;   // ausente na opção à vista
  entrada?: number;   // ausente na opção à vista
}

export interface CartLot {
  id: string;             // chave única do lote (ex.: "A-12")
  developmentSlug: string; // "alto-bellevue" | "miguel-marques"
  developmentName?: string;
  block: string;          // quadra
  lot: string;            // lote (sempre string p/ chave estável)
  areaM2: number;
  price: number;
  status?: string;
  selectedPlan?: SelectedPaymentPlan;
}

export interface CartTotals {
  count: number;
  totalArea: number;
  totalPrice: number;
  avgPrice: number;       // valor médio por lote
  avgPricePerM2: number;  // R$/m² da seleção
}

// ── Totais ───────────────────────────────────────────────────────────────────

export function cartTotals(items: CartLot[]): CartTotals {
  const count = items.length;
  const totalArea = items.reduce((s, l) => s + (Number.isFinite(l.areaM2) ? l.areaM2 : 0), 0);
  const totalPrice = items.reduce((s, l) => s + (Number.isFinite(l.price) ? l.price : 0), 0);
  return {
    count,
    totalArea,
    totalPrice,
    avgPrice: count ? totalPrice / count : 0,
    avgPricePerM2: totalArea ? totalPrice / totalArea : 0,
  };
}

// ── Adaptador único (AB e MM têm formatos diferentes) ────────────────────────

export interface RawLotLike {
  id: string;
  quadra: string;
  lot_number?: string | number | null;
  lote?: string | number | null;
  area_m2?: number | null;
  metragem?: number | null;
  area?: number | null;
  price?: number | null;
  valor?: number | null;
  status?: string;
}

/** Converte um lote do AB (`area_m2`/`lot_number`/`price`), do MM
 *  (`metragem`/`lote`/`valor`) ou dos JSONs de mapa (`area`) para o modelo
 *  neutro do carrinho. */
export function toCartLot(lot: RawLotLike, dev: { slug: string; name?: string }): CartLot {
  return {
    id: lot.id,
    developmentSlug: dev.slug,
    developmentName: dev.name,
    block: lot.quadra,
    lot: String(lot.lot_number ?? lot.lote ?? ''),
    areaM2: lot.area_m2 ?? lot.metragem ?? lot.area ?? 0,
    price: lot.price ?? lot.valor ?? 0,
    status: lot.status,
  };
}

// ── Formatação ───────────────────────────────────────────────────────────────

const BRL = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Math.round(n || 0));
const M2 = (n: number) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(n || 0)} m²`;

const planSuffix = (l: CartLot) =>
  l.selectedPlan
    ? ` (${l.selectedPlan.label}${l.selectedPlan.parcela ? ` · ${BRL(l.selectedPlan.parcela)}/mês` : ''})`
    : '';

// ── Compartilhamento por URL (/carrinho?id=token) ────────────────────────────

export interface CartShare { d: string; ids: string[] }

function toBase64Url(s: string): string {
  const b64 = typeof btoa === 'function'
    ? btoa(unescape(encodeURIComponent(s)))
    : Buffer.from(s, 'utf8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromBase64Url(t: string): string {
  const b64 = t.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
  return typeof atob === 'function'
    ? decodeURIComponent(escape(atob(b64 + pad)))
    : Buffer.from(b64 + pad, 'base64').toString('utf8');
}

/** Codifica empreendimento + ids dos lotes num token URL-safe e compacto. */
export function encodeCart(share: CartShare): string {
  return toBase64Url(JSON.stringify({ d: share.d, i: share.ids }));
}

/** Decodifica o token; retorna null se inválido (nunca lança). */
export function decodeCart(token: string): CartShare | null {
  try {
    const obj = JSON.parse(fromBase64Url(token)) as { d?: unknown; i?: unknown };
    if (!obj || typeof obj.d !== 'string' || !Array.isArray(obj.i)) return null;
    const ids = obj.i.filter((x): x is string => typeof x === 'string');
    return { d: obj.d, ids };
  } catch {
    return null;
  }
}

export function buildCartShareUrl(origin: string, share: CartShare): string {
  return `${origin.replace(/\/$/, '')}/carrinho?id=${encodeCart(share)}`;
}

// ── Exportações (WhatsApp / texto p/ PDF) ────────────────────────────────────

export interface CartMessageOptions {
  developmentName?: string;
  shareUrl?: string;
  note?: string;
}

export function buildCartWhatsAppMessage(items: CartLot[], opts: CartMessageOptions = {}): string {
  const t = cartTotals(items);
  const name = opts.developmentName || items[0]?.developmentName || 'Empreendimento';
  const lines = [
    `Olá! Tenho interesse nestes lotes do *${name}*:`,
    '',
    ...items.map((l) => `• Quadra ${l.block}, Lote ${l.lot} — ${M2(l.areaM2)} — ${BRL(l.price)}${planSuffix(l)}`),
    '',
    `*${t.count} ${t.count === 1 ? 'lote' : 'lotes'} · ${M2(t.totalArea)} · ${BRL(t.totalPrice)}*`,
  ];
  if (opts.shareUrl) lines.push('', `Seleção: ${opts.shareUrl}`);
  if (opts.note) lines.push('', opts.note);
  return lines.join('\n');
}

export function buildCartWhatsAppUrl(phone: string, items: CartLot[], opts?: CartMessageOptions): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildCartWhatsAppMessage(items, opts))}`;
}

/** Texto plano da seleção — base para exportação em PDF/impressão. */
export function buildCartPlainText(items: CartLot[], opts: CartMessageOptions = {}): string {
  const t = cartTotals(items);
  const name = opts.developmentName || items[0]?.developmentName || 'Empreendimento';
  return [
    `${name} — Seleção de lotes`,
    '',
    ...items.map((l, i) => `${i + 1}. Quadra ${l.block} · Lote ${l.lot} — ${M2(l.areaM2)} — ${BRL(l.price)}${planSuffix(l)}`),
    '',
    `Total: ${t.count} lote(s) · ${M2(t.totalArea)} · ${BRL(t.totalPrice)} (média ${BRL(t.avgPrice)}/lote · ${BRL(t.avgPricePerM2)}/m²)`,
  ].join('\n');
}
