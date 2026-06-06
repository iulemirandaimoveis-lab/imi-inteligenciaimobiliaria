/**
 * Camada de dados canônica do loteamento Alto Bellevue.
 *
 * Fonte única de verdade: `public/maps/alto-bellevue-lots.json` (383 lotes, geometria
 * limpa + contexto urbano — ruas, perímetro, labels, portaria). Substitui o arquivo
 * legado e corrompido `public/data/alto-bellevue-lots.json` (426 entradas, duplicados,
 * polígonos inválidos). Ver AUDITORIA_MAPA_ALTO_BELLEVUE.md.
 *
 * Sem dependência de React — usado pelo componente do mapa e pelos testes (Jest/node).
 */

// Bump quando o JSON do mapa mudar: invalida o sessionStorage E o cache HTTP/CDN
// (o ?v= muda a URL). Sem isso, navegadores antigos servem dados em cache.
export const AB_MAP_VERSION = 3;
export const AB_MAP_URL = `/maps/alto-bellevue-lots.json?v=${AB_MAP_VERSION}`;
export const AB_VIEWBOX = { w: 1200, h: 821.86 } as const;
export const AB_EXPECTED_TOTAL = 383;
const CACHE_KEY = `imi:ab-map:v${AB_MAP_VERSION}`;

export type Point = [number, number];

export type LotStatus = 'DISPONIVEL' | 'NEGOCIACAO' | 'VENDIDO' | 'PROPRIETARIO' | 'RESERVADO';

export interface PaymentPlan {
  total: number;
  parcela: number;
}

/** Lote normalizado para consumo pela UI (compatível com a antiga shape `PlanLot`). */
export interface ABLot {
  id: string;
  quadra: string;
  lot_number: string;
  polygon: Point[];
  centroid: Point;
  area_m2: number | null;
  price: number | null;
  status: string;
  has_polygon: boolean;
  /** Registro comercial sem polígono oficial no CAD (ex.: B-24) — não renderizar no mapa. */
  pending: boolean;
  // Camada comercial embutida na fonte canônica
  valor: number | null;
  valorVista: number | null;
  entrada: number | null;
  plans: { p12?: PaymentPlan; p36?: PaymentPlan; p60?: PaymentPlan; p120?: PaymentPlan };
}

export interface StreetLabel { x: number; y: number; name: string; }
export interface MapMarker { x: number; y: number; label: string; }
export interface Amenity { id: string; label: string; icon: string; color: string; x: number; y: number; }
/** Área verde do CAD (posição oficial do rótulo "ÁREA VERDE NN"). */
export interface GreenArea { id: string; label: string; x: number; y: number; }

export interface ABMapData {
  lots: ABLot[];
  streets: Point[][];
  perimeter: Point[][];
  brLine: Point[][];
  streetLabels: StreetLabel[];
  entrance: MapMarker | null;
  amenities: Amenity[];
  /** Áreas verdes oficiais (CAD). Vazio = pendente. */
  greenAreas: GreenArea[];
  /** Itens sem dado oficial — exibidos como `pendente` (não inventar). */
  pending: { greenAreas: boolean };
}

// ── Raw shape (como vem do JSON) ───────────────────────────────────────────────

interface RawLot {
  id?: string; quadra: string; lote?: string; lot_number?: string;
  points?: string; area?: number; metragem?: number; area_m2?: number;
  labelX?: number; labelY?: number; status?: string; pending?: boolean;
  price?: number | null; valor?: number | null; valorVista?: number | null; entrada?: number | null;
  p12?: PaymentPlan; p36?: PaymentPlan; p60?: PaymentPlan; p120?: PaymentPlan;
}

interface RawMap {
  totalLots?: number;
  lots?: RawLot[];
  streets?: string[];
  perimeter?: string[];
  brLine?: string[];
  streetLabels?: StreetLabel[];
  entrance?: MapMarker | null;
  amenities?: Amenity[];
  greenAreas?: GreenArea[];
}

// ── Geometria ──────────────────────────────────────────────────────────────────

/** Converte "x,y x,y ..." em [[x,y], ...]. Tolerante a espaços/linhas extras. */
export function parsePoints(points?: string | null): Point[] {
  if (!points || typeof points !== 'string') return [];
  return points
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [x, y] = pair.split(',').map(Number);
      return [x, y] as Point;
    })
    .filter((p) => p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]));
}

export function polygonArea(poly: Point[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

export function isValidPolygon(poly: Point[]): boolean {
  return Array.isArray(poly) && poly.length >= 3 && polygonArea(poly) > 0.5;
}

function centroidOf(poly: Point[]): Point {
  if (!poly.length) return [0, 0];
  const s = poly.reduce(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0] as Point);
  return [s[0] / poly.length, s[1] / poly.length];
}

// ── Normalização + validação ─────────────────────────────────────────────────

function normalizeStatus(s?: string): string {
  return String(s ?? 'DISPONIVEL').toUpperCase();
}

function normalizeLot(raw: RawLot): ABLot {
  const polygon = parsePoints(raw.points);
  const centroid: Point =
    raw.labelX != null && raw.labelY != null ? [raw.labelX, raw.labelY] : centroidOf(polygon);
  return {
    id: raw.id ?? `${raw.quadra}-${raw.lote ?? raw.lot_number}`,
    quadra: raw.quadra,
    lot_number: String(raw.lote ?? raw.lot_number ?? ''),
    polygon,
    centroid,
    area_m2: raw.area ?? raw.metragem ?? raw.area_m2 ?? null,
    price: raw.price ?? raw.valor ?? null,
    status: normalizeStatus(raw.status),
    has_polygon: isValidPolygon(polygon),
    pending: Boolean(raw.pending),
    valor: raw.valor ?? raw.price ?? null,
    valorVista: raw.valorVista ?? null,
    entrada: raw.entrada ?? null,
    plans: { p12: raw.p12, p36: raw.p36, p60: raw.p60, p120: raw.p120 },
  };
}

export interface ValidationResult {
  total: number;
  uniqueIds: number;
  duplicates: string[];
  invalidPolygons: string[];
  missingStatus: string[];
  ok: boolean;
}

/** Validação pura — reusada nos testes e no carregamento. */
export function validateLots(lots: ABLot[]): ValidationResult {
  const counts = new Map<string, number>();
  for (const l of lots) counts.set(l.id, (counts.get(l.id) ?? 0) + 1);
  const duplicates = [...counts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  const invalidPolygons = lots.filter((l) => !l.has_polygon).map((l) => l.id);
  const missingStatus = lots.filter((l) => !l.status).map((l) => l.id);
  return {
    total: lots.length,
    uniqueIds: counts.size,
    duplicates,
    invalidPolygons,
    missingStatus,
    ok: lots.length === AB_EXPECTED_TOTAL && duplicates.length === 0 && invalidPolygons.length === 0,
  };
}

/** Normaliza o JSON bruto em `ABMapData`, descartando polígonos inválidos (logando). */
export function normalizeMap(raw: RawMap): ABMapData {
  const lots = (raw.lots ?? []).map(normalizeLot);

  // Validação antes de renderizar: nunca quebrar — logar e seguir.
  const valid = validateLots(lots);
  if (!valid.ok && typeof console !== 'undefined') {
    console.warn(
      `[alto-bellevue] inconsistência de dados: total=${valid.total} ` +
        `(esperado ${AB_EXPECTED_TOTAL}), duplicados=${valid.duplicates.length}, ` +
        `polígonos inválidos=${valid.invalidPolygons.length}`,
    );
  }

  return {
    lots,
    streets: (raw.streets ?? []).map(parsePoints).filter((p) => p.length >= 2),
    perimeter: (raw.perimeter ?? []).map(parsePoints).filter((p) => p.length >= 3),
    brLine: (raw.brLine ?? []).map(parsePoints).filter((p) => p.length >= 2),
    streetLabels: raw.streetLabels ?? [],
    entrance: raw.entrance ?? null,
    amenities: raw.amenities ?? [],
    greenAreas: raw.greenAreas ?? [],
    pending: { greenAreas: !raw.greenAreas || raw.greenAreas.length === 0 },
  };
}

// ── Loader resiliente (timeout + retry + cache de sessão) ──────────────────────

async function fetchWithTimeout(url: string, ms: number, cacheMode: RequestCache): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { cache: cacheMode, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export interface LoadOptions {
  retries?: number;
  timeoutMs?: number;
  useCache?: boolean;
  signal?: { cancelled: boolean };
}

/**
 * Carrega o mapa canônico de forma resiliente:
 *  - serve do sessionStorage imediatamente (offline-first dentro da sessão);
 *  - fetch com timeout explícito + retry com backoff exponencial;
 *  - lança erro só após esgotar tentativas (o componente cai para fallback estático).
 */
export async function loadAltoBellevueMap(opts: LoadOptions = {}): Promise<ABMapData> {
  const { retries = 3, timeoutMs = 8000, useCache = true } = opts;

  if (useCache && typeof sessionStorage !== 'undefined') {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached) as RawMap;
        if (data?.lots?.length) return normalizeMap(data);
      }
    } catch {
      /* cache corrompido — ignora */
    }
  }

  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    if (opts.signal?.cancelled) throw new Error('cancelled');
    try {
      const res = await fetchWithTimeout(AB_MAP_URL, timeoutMs, i === 0 ? 'force-cache' : 'reload');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = (await res.json()) as RawMap;
      if (useCache && typeof sessionStorage !== 'undefined') {
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(raw)); } catch { /* quota */ }
      }
      return normalizeMap(raw);
    } catch (err) {
      lastErr = err;
      if (i < retries - 1) await new Promise((r) => setTimeout(r, 2 ** i * 700));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Falha ao carregar o mapa');
}
