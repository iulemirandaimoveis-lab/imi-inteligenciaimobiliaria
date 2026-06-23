/**
 * Lot compare — núcleo compartilhado da comparação de lotes (máx. 3).
 *
 * Usado pelos dois empreendimentos via o hook `useLotCompare`. UMA implementação —
 * nunca duplicar por empreendimento. Tudo aqui é puro e testável em Node (Jest).
 *
 * Limite do briefing: até 3 lotes; ao tentar o 4º, aviso elegante (ver
 * `compareRejectMessage`).
 */

export const MAX_COMPARE = 3;

export interface CompareLot {
  id: string;
  block: string; // quadra
  lot: string; // lote
  areaM2: number;
  price: number;
  status?: string;
  isCorner?: boolean;
  isLakefront?: boolean;
}

export type CompareReject = 'duplicate' | 'limit';
export interface CompareAddResult {
  ok: boolean;
  reason?: CompareReject;
}

/** Decide se um lote pode entrar na comparação (sem duplicar, respeitando o teto). */
export function canAddToCompare(current: ReadonlyArray<{ id: string }>, lot: { id: string }): CompareAddResult {
  if (current.some((l) => l.id === lot.id)) return { ok: false, reason: 'duplicate' };
  if (current.length >= MAX_COMPARE) return { ok: false, reason: 'limit' };
  return { ok: true };
}

export function compareRejectMessage(reason: CompareReject): string {
  return reason === 'limit'
    ? `Você pode comparar até ${MAX_COMPARE} lotes. Remova um para adicionar outro.`
    : 'Este lote já está na comparação.';
}

export function pricePerM2(lot: { price: number; areaM2: number }): number {
  return lot.areaM2 > 0 ? lot.price / lot.areaM2 : 0;
}

export function compareHighlights(lot: CompareLot): string[] {
  const h: string[] = [];
  if (lot.isCorner) h.push('Esquina');
  if (lot.isLakefront) h.push('Beira-lago');
  return h;
}

// ── Tabela comparativa (linhas servem desktop=tabela e mobile=cards) ─────────

export interface CompareRow {
  key: string;
  label: string;
  values: string[]; // um valor por lote, formatado
}

const BRL = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Math.round(n || 0));
const M2 = (n: number) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(n || 0)} m²`;

const STATUS_LABEL: Record<string, string> = {
  disponivel: 'Disponível',
  vendido: 'Vendido',
  negociacao: 'Em negociação',
  proprietario: 'Proprietário',
  reservado: 'Reservado',
  documentacao: 'Documentação',
  igreja: 'Igreja',
};
function statusLabel(s?: string): string {
  if (!s) return '—';
  return STATUS_LABEL[s.toLowerCase()] ?? s;
}

export function buildComparison(lots: CompareLot[]): CompareRow[] {
  const col = (fn: (l: CompareLot) => string): string[] => lots.map(fn);
  return [
    { key: 'quadra', label: 'Quadra', values: col((l) => l.block) },
    { key: 'lote', label: 'Lote', values: col((l) => l.lot) },
    { key: 'area', label: 'Área', values: col((l) => M2(l.areaM2)) },
    { key: 'preco', label: 'Preço', values: col((l) => (l.price > 0 ? BRL(l.price) : 'Sob consulta')) },
    { key: 'm2', label: 'R$/m²', values: col((l) => (l.price > 0 && l.areaM2 > 0 ? BRL(pricePerM2(l)) : '—')) },
    { key: 'status', label: 'Situação', values: col((l) => statusLabel(l.status)) },
    { key: 'destaques', label: 'Destaques', values: col((l) => compareHighlights(l).join(' · ') || '—') },
  ];
}
